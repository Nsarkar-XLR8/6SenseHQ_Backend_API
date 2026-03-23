/**
 * Distributed Rate-Limit Store (Redis-backed)
 *
 * Provides a Redis-backed store for `express-rate-limit`.
 * When Redis is unavailable, returns a MemoryStore for single-instance fallback.
 */
import { RedisStore } from "rate-limit-redis";
import { type Store, MemoryStore } from "express-rate-limit";
import { getRedis } from "./redis.js";
import { logger } from "../config/logger.js";

/**
 * Creates a Redis-backed store for express-rate-limit.
 * Returns MemoryStore when Redis is not connected (single-instance fallback).
 *
 * @param prefix - Optional key prefix to namespace counters (e.g., "rl:api:", "rl:auth:")
 */
export function createRedisStore(prefix = "rl:"): Store {
    const redis = getRedis();

    if (!redis) {
        logger.debug("Rate-limit Redis store unavailable — using in-memory fallback.");
        return new MemoryStore();
    }

    return new RedisStore({
        // Use the `ioredis` sendCommand adapter
        sendCommand: (...args: string[]) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            redis.call(args[0]!, ...args.slice(1)) as Promise<any>,
        prefix,
    });
}

