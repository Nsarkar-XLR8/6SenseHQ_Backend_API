/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import ms from "ms";
import type { SignOptions } from "jsonwebtoken";
import AppError from "@/errors/AppError.js";
import { blacklistToken, deleteKey, getValue, isTokenBlacklisted, setWithExpiry, isRedisReady } from "@/lib/redis.js";
import { messageBus } from "@/messaging/messageBus.js";
import { sendEmail } from "@/utils/sendEmail.js";
import { createToken } from "@/utils/jwt.js";
import config from "@/config/index.js";
import { IUser } from "../user/user.interface.js";
import { User } from "../user/user.model.js";
import { ILoginCredentials, ILoginResponse } from "./auth.interface.js";

type RefreshClaims = {
    userId: string;
    email: string;
    role: string;
    tokenType: "refresh";
    tokenFamilyId: string;
    jti?: string;
    iat?: number;
    exp?: number;
};

function refreshTtlSeconds(): number {
    const value = ms(config.jwt.refreshExpiresIn as ms.StringValue);
    return typeof value === "number" ? Math.max(1, Math.floor(value / 1000)) : 30 * 24 * 60 * 60;
}

function sessionKey(userId: string, familyId: string) {
    return `rt:session:${userId}:${familyId}`;
}

async function publishAuthAudit(action: string, payload: Record<string, unknown>): Promise<void> {
    try {
        await messageBus.publish({
            name: "audit.auth",
            kind: "audit",
            payload: {
                action,
                ...payload,
                at: new Date().toISOString(),
            },
        });
    } catch {
        // best-effort audit
    }
}

async function issueRefreshToken(input: {
    userId: string;
    email: string;
    role: string;
    familyId?: string;
}) {
    const familyId = input.familyId ?? crypto.randomUUID();
    const tokenId = crypto.randomUUID();

    const token = jwt.sign(
        {
            userId: input.userId,
            email: input.email,
            role: input.role,
            tokenType: "refresh",
            tokenFamilyId: familyId,
        },
        config.jwt.refreshSecret,
        {
            expiresIn: config.jwt.refreshExpiresIn as ms.StringValue,
            jwtid: tokenId,
        } as SignOptions
    );

    await setWithExpiry(sessionKey(input.userId, familyId), tokenId, refreshTtlSeconds());

    return { token, tokenId, familyId };
}

const registerUser = async (payload: IUser) => {
    const isUserExists = await User.findOne({ email: payload.email }).lean();
    if (isUserExists) {
        throw AppError.of(StatusCodes.BAD_REQUEST, "User already exists");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await User.create({
        ...payload,
        otp,
        otpExpires,
        isVerified: false,
    });

    if (!newUser) {
        throw AppError.of(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create user");
    }

    const emailResult = await sendEmail({
        to: newUser.email,
        subject: "Verify Your Email",
        html: `<h1>Your OTP is: ${otp}</h1><p>Expires in 10 minutes.</p>`,
    });

    if (!emailResult.success) {
        await User.findByIdAndDelete(newUser._id);
        throw AppError.of(StatusCodes.INTERNAL_SERVER_ERROR, "Email delivery failed. Try again.");
    }

    return {
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
    };
};

const verifyEmail = async (email: string, otp: string) => {
    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) {
        throw AppError.of(StatusCodes.NOT_FOUND, "User not found");
    }

    if (!user.otp || user.otp !== otp) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, "OTP has expired");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return { message: "Email verified successfully" };
};

const loginUser = async (payload: ILoginCredentials): Promise<ILoginResponse> => {
    const user = await User.findOne({ email: payload.email }).select("+password").lean();

    if (!user) {
        throw AppError.of(StatusCodes.NOT_FOUND, "User not found", [
            { path: "email", message: "No account associated with this email" },
        ]);
    }

    if (!user.isVerified) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, "Email not verified", [
            { path: "email", message: "Please verify your email before logging in" },
        ]);
    }

    const isPasswordMatch = await User.isPasswordMatch(payload.password, user.password);

    if (!isPasswordMatch) {
        await publishAuthAudit("login_failed", { email: payload.email, reason: "invalid_password" });
        throw AppError.of(StatusCodes.UNAUTHORIZED, "Invalid credentials", [
            { path: "password", message: "Incorrect password" },
        ]);
    }

    const jwtPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    };

    const accessToken = createToken(jwtPayload, config.jwt.jwtAccessSecret, config.jwt.jwtExpiresIn);
    const refresh = await issueRefreshToken({
        userId: jwtPayload.userId,
        email: jwtPayload.email,
        role: jwtPayload.role,
    });

    await publishAuthAudit("login_success", { userId: jwtPayload.userId, email: jwtPayload.email });

    return {
        accessToken,
        refreshToken: refresh.token,
        user: {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        },
    };
};

const forgotPassword = async (email: string) => {
    const user = await User.findOne({ email }).lean();
    if (!user) return;

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
        otp,
        otpExpires,
    });

    const emailResult = await sendEmail({
        to: user.email,
        subject: "Password Reset OTP",
        html: `<div>Your OTP is: <b>${otp}</b>. It expires in 10 minutes.</div>`,
    });

    if (!emailResult.success) {
        throw AppError.of(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
};

const verifyOtp = async (payload: { email: string; otp: string }) => {
    const user = await User.findOne({
        email: payload.email,
        otp: payload.otp,
        otpExpires: { $gt: new Date() },
    }).lean();

    if (!user) {
        throw AppError.of(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
    }

    const resetToken = jwt.sign(
        { email: user.email, role: user.role, type: "password_reset" },
        config.jwt.jwtAccessSecret,
        { expiresIn: "15m" }
    );

    return { resetToken };
};

const resetPassword = async (token: string, newPassword: string) => {
    let decoded;
    try {
        decoded = jwt.verify(token, config.jwt.jwtAccessSecret) as any;
    } catch {
        throw AppError.of(StatusCodes.UNAUTHORIZED, "Invalid or expired reset token");
    }

    if (decoded.type !== "password_reset") {
        throw AppError.of(StatusCodes.FORBIDDEN, "Invalid token type");
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) throw AppError.of(StatusCodes.NOT_FOUND, "User not found");

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();
};

const refreshAccessToken = async (refreshToken: string) => {
    let decoded: RefreshClaims;
    try {
        decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as RefreshClaims;
    } catch {
        await publishAuthAudit("refresh_failed", { reason: "invalid_or_expired_token" });
        throw AppError.of(StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token", [
            { path: "refreshToken", message: "Please login again" },
        ]);
    }

    const { userId, email, role, tokenFamilyId, jti } = decoded;
    if (!userId || !email || !tokenFamilyId || !jti) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, "Malformed refresh token");
    }

    if (isRedisReady()) {
        const blacklisted = await isTokenBlacklisted(`refresh:${jti}`);
        if (blacklisted) {
            throw AppError.of(StatusCodes.UNAUTHORIZED, "Token has been revoked", [
                { path: "refreshToken", message: "This refresh token has been revoked. Please login again." },
            ]);
        }

        const activeTokenId = await getValue(sessionKey(userId, tokenFamilyId));

        if (!activeTokenId || activeTokenId !== jti) {
            await deleteKey(sessionKey(userId, tokenFamilyId));
            await publishAuthAudit("refresh_reuse_detected", { userId, tokenFamilyId });
            throw AppError.of(StatusCodes.UNAUTHORIZED, "Refresh token reuse detected", [
                { path: "refreshToken", message: "Session invalidated. Please login again." },
            ]);
        }
    }

    const user = await User.findById(userId).lean();
    if (!user) {
        throw AppError.of(StatusCodes.NOT_FOUND, "User no longer exists");
    }

    const newAccessToken = createToken({ userId, email, role }, config.jwt.jwtAccessSecret, config.jwt.jwtExpiresIn);
    const rotated = await issueRefreshToken({ userId, email, role, familyId: tokenFamilyId });

    const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
    if (ttl > 0) {
        await blacklistToken(`refresh:${jti}`, ttl);
    }

    await publishAuthAudit("refresh_success", { userId, tokenFamilyId });

    return {
        accessToken: newAccessToken,
        refreshToken: rotated.token,
    };
};

const logoutUser = async (userId: string, refreshToken?: string) => {
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as RefreshClaims;
            if (decoded.jti) {
                const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
                if (ttl > 0) {
                    await blacklistToken(`refresh:${decoded.jti}`, ttl);
                }
            }
            if (decoded.tokenFamilyId) {
                await deleteKey(sessionKey(userId, decoded.tokenFamilyId));
            }
        } catch {
            // ignore invalid token on logout
        }
    }

    await publishAuthAudit("logout", { userId });
    return { message: "Logged out successfully" };
};

const resendOtp = async (email: string) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw AppError.of(StatusCodes.NOT_FOUND, "User not found");
    }

    if (user.isVerified) {
        throw AppError.of(StatusCodes.BAD_REQUEST, "Email is already verified");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailResult = await sendEmail({
        to: user.email,
        subject: "Verify Your Email - New OTP",
        html: `<h1>Your new OTP is: ${otp}</h1><p>Expires in 10 minutes.</p>`,
    });

    if (!emailResult.success) {
        throw AppError.of(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send OTP email");
    }

    return { message: "OTP resent successfully" };
};

export const AuthService = {
    registerUser,
    verifyEmail,
    loginUser,
    forgotPassword,
    verifyOtp,
    resetPassword,
    refreshAccessToken,
    logoutUser,
    resendOtp,
};
