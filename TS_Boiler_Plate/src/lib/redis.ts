import { Redis } from "ioredis";
import { logger } from "../config/logger.js";

let redis: Redis | null = null;

/**
 * Connect to Redis if REDIS_URL is configured.
 * Returns null gracefully if not configured — app works without it.
 */
export async function connectRedis(url?: string): Promise<void> {
    if (!url) {
        logger.info("⏭️  REDIS_URL not set — skipping Redis (in-memory fallback)");
        return;
    }

    try {
        redis = new Redis(url, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            connectTimeout: 5000,
        });

        redis.on("error", (err: Error) => {
            logger.error({ err }, "Redis connection error");
        });

        redis.on("connect", () => {
            logger.info("✅ Redis connected");
        });

        await redis.connect();
    } catch (err) {
        logger.warn({ err }, "Redis connection failed — continuing without Redis");
        redis = null;
    }
}

export async function disconnectRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        logger.info("Redis disconnected");
        redis = null;
    }
}

export function isRedisReady(): boolean {
    return redis?.status === "ready";
}

export function getRedis(): Redis | null {
    return redis;
}

export async function setIfNotExists(key: string, value: string, expiresInSeconds: number): Promise<boolean> {
    if (!redis) {
        throw new Error("Redis connection is required for idempotency checks");
    }
    const result = await redis.set(key, value, "EX", expiresInSeconds, "NX");
    return result === "OK";
}

export async function setWithExpiry(key: string, value: string, expiresInSeconds: number): Promise<void> {
    if (!redis) return;
    await redis.set(key, value, "EX", expiresInSeconds);
}

export async function getValue(key: string): Promise<string | null> {
    if (!redis) return null;
    return redis.get(key);
}

export async function deleteKey(key: string): Promise<void> {
    if (!redis) return;
    await redis.del(key);
}

// ── Token Blacklist Helpers ──────────────────────────────────────────

/**
 * Blacklist a JWT by its jti (or raw token hash) until its expiry.
 * No-op if Redis is not connected.
 */
export async function blacklistToken(tokenId: string, expiresInSeconds: number): Promise<void> {
    if (!redis) return;
    await redis.set(`bl:${tokenId}`, "1", "EX", expiresInSeconds);
}

/**
 * Check if a token has been blacklisted.
 * Returns false if Redis is not connected (fail-open).
 */
export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
    if (!redis) return false;
    const result = await redis.get(`bl:${tokenId}`);
    return result === "1";
}
