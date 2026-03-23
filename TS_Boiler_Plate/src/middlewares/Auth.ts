import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import AppError from "../errors/AppError.js";
import { isUserRole, normalizeUserRole, type UserRole } from "../constant/role.constant.js";
import { canAccess } from "../auth/policy.js";

type JwtClaims = jwt.JwtPayload & {
    userId?: string;
    role?: unknown; // validate at runtime
};

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw AppError.of(StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret not configured", [
            { path: "server", message: "Missing JWT_SECRET" }
        ]);
    }
    return secret;
}

function extractToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;

    if (typeof authHeader === "string") {
        const [scheme, token] = authHeader.split(" ");
        if (scheme?.toLowerCase() === "bearer" && token) return token;
    }

    // Optional cookie support (safe even without cookie-parser)
    const {cookies} = req as unknown as { cookies?: Record<string, unknown> };
    const cookieToken = cookies?.accessToken;
    if (typeof cookieToken === "string" && cookieToken.length > 0) return cookieToken;

    return undefined;
}

function verifyAccessToken(token: string): { userId: string; role: UserRole; iat?: number | undefined; exp?: number | undefined } {
    try {
        const { userId, role, iat, exp } = jwt.verify(token, getJwtSecret()) as JwtClaims;
        const normalizedRole = normalizeUserRole(role);

        if (!userId || normalizedRole === undefined || !isUserRole(normalizedRole)) {
            throw AppError.of(StatusCodes.UNAUTHORIZED, "Invalid token", [
                { path: "authorization", message: "Missing/invalid userId or role in token" }
            ]);
        }

        return { userId, role: normalizedRole, iat, exp };
    } catch (err: unknown) {
        const anyErr = err as { name?: string };

        if (anyErr?.name === "TokenExpiredError") {
            throw AppError.of(StatusCodes.UNAUTHORIZED, "Token expired", [
                { path: "authorization", message: "Please login again" }
            ]);
        }

        throw AppError.of(StatusCodes.UNAUTHORIZED, "Unauthorized", [
            { path: "authorization", message: "Invalid or missing token" }
        ]);
    }
}

/**
 * Auth(...roles)
 * Usage:
 *   router.get("/me", Auth(), handler)
 *   router.get("/admin", Auth(USER_ROLE.ADMIN), handler)
 *   router.get("/staff", Auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN), handler)
 */

export const Auth =
    (...allowedRoles: UserRole[]): RequestHandler =>
        (req, _res, next) => {
            try {
                const token = extractToken(req);
                if (!token) {
                    throw AppError.of(StatusCodes.UNAUTHORIZED, "Unauthorized", [
                        { path: "authorization", message: "Missing Bearer token" }
                    ]);
                }

                const { userId, role, iat, exp } = verifyAccessToken(token);

                // FIX: Actually attach the data to the request object
                req.user = { userId, role, iat, exp } as { userId: string; role: UserRole; iat?: number; exp?: number; };

                if (allowedRoles.length > 0 && !canAccess(role, allowedRoles)) {
                    throw AppError.of(StatusCodes.FORBIDDEN, "Forbidden", [
                        { path: "authorization", message: "Insufficient permissions" }
                    ]);
                }

                next();
            } catch (err) {
                next(err);
            }
        };
