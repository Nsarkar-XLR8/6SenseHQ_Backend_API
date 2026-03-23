import { StatusCodes } from "http-status-codes";
import ms from "ms";
import catchAsync from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AuthService } from "./auth.service.js";

import AppError from "../../errors/AppError.js";
import { getAuthTokenMeta } from "../../utils/tokenMeta.js";
import config from "../../config/index.js";


const loginUser = catchAsync(async (req, res) => {

    const result = await AuthService.loginUser(req.validated!.body);
    const { refreshToken, accessToken, user } = result;

    const safeUser = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
    };

    const meta = getAuthTokenMeta();

    // Set refresh token as httpOnly cookie
    const refreshMaxAge = ms(config.jwt.refreshExpiresIn as ms.StringValue);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: config.nodeEnv === "production" ? "strict" : "lax",
        maxAge: typeof refreshMaxAge === "number" ? refreshMaxAge : 30 * 24 * 60 * 60 * 1000,
        path: "/",
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "User logged in successfully",
        data: {
            accessToken,
            refreshToken, // Also in JSON for mobile/non-cookie clients
            ...meta,
            user: safeUser,
        },
    });
});




const registerUser = catchAsync(async (req, res) => {
    const result = await AuthService.registerUser(req.validated!.body);

    // If register returns Mongoose doc, map it to API shape here (id instead of _id)
    const safeUser = {
        id: result._id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
    };

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "User registered successfully. Please check your email for OTP.",
        data: safeUser,
    });
});




const verifyEmail = catchAsync(async (req, res) => {
    const { email, otp } = req.validated!.body;
    const result = await AuthService.verifyEmail(email, otp);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Email verified successfully. You can now login.",
        data: result,
    });
});




const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.validated!.body;
    await AuthService.forgotPassword(email);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'OTP Sent Successfully.',
        data: null,
    });
});



const verifyOtp = catchAsync(async (req, res) => {
    const result = await AuthService.verifyOtp(req.validated!.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
        data: result, // Contains the resetToken
    });
});


// auth.controller.ts
const resetPassword = catchAsync(async (req, res) => {
    // 1. Look for the 'authorization' header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, 'Reset token is required in headers');
    }

    // 2. Extract token safely
    let token: string | undefined;

    if (authHeader.startsWith('Bearer ')) {
        const parts = authHeader.split(' ');
        if (parts.length !== 2) {
            throw AppError.of(StatusCodes.UNAUTHORIZED, 'Malformed Authorization header');
        }
        token = parts[1];
    } else {
        token = authHeader;
    }

    // Double check token exists (handles empty strings or whitespace)
    if (!token) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, 'Token not found in header');
    }

    // 3. TypeScript is now satisfied that 'token' is a string
    await AuthService.resetPassword(token, req.validated!.body.newPassword);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Password reset successful.',
        data: null,
    });
});


// ── New: Refresh Token ───────────────────────────────────────────────

const refreshToken = catchAsync(async (req, res) => {
    // Accept refresh token from httpOnly cookie OR request body
    const token =
        (req.cookies as Record<string, string> | undefined)?.refreshToken ??
        req.validated?.body?.refreshToken;

    if (!token) {
        throw AppError.of(StatusCodes.UNAUTHORIZED, 'Refresh token is required', [
            { path: 'refreshToken', message: 'Provide refresh token in cookie or body' }
        ]);
    }

    const result = await AuthService.refreshAccessToken(token);
    const meta = getAuthTokenMeta();

    const refreshMaxAge = ms(config.jwt.refreshExpiresIn as ms.StringValue);
    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: config.nodeEnv === "production" ? "strict" : "lax",
        maxAge: typeof refreshMaxAge === "number" ? refreshMaxAge : 30 * 24 * 60 * 60 * 1000,
        path: "/",
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Token refreshed successfully',
        data: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            ...meta,
        },
    });
});


// ── New: Logout ──────────────────────────────────────────────────────

const logoutUser = catchAsync(async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req.user as any)!.userId;
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.refreshToken ?? req.body?.refreshToken;

    await AuthService.logoutUser(userId, token);

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: config.nodeEnv === "production" ? "strict" : "lax",
        path: "/",
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Logged out successfully',
        data: null,
    });
});


// ── New: Resend OTP ──────────────────────────────────────────────────

const resendOtp = catchAsync(async (req, res) => {
    const { email } = req.validated!.body;
    const result = await AuthService.resendOtp(email);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: null,
    });
});



export const AuthController = {
    loginUser,
    registerUser,
    verifyEmail,
    forgotPassword,
    verifyOtp,
    resetPassword,
    refreshToken,
    logoutUser,
    resendOtp
};
