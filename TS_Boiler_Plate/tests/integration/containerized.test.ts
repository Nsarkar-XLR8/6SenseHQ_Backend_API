/**
 * Containerized Integration Tests
 *
 * These tests spin up real MongoDB and Redis containers via testcontainers.
 * They require Docker to be running and are NOT run during `npm test`.
 *
 * Run with: npm run test:integration:containers
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { Redis } from "ioredis";
import { startContainers, stopContainers, type ContainerURIs } from "../helpers/containers.js";

let uris: ContainerURIs;
let redis: Redis;

describe("Containerized Integration Tests", () => {
    beforeAll(async () => {
        // Start real containers (may take 10-30s on first run)
        uris = await startContainers();

        // Connect Mongoose to the container
        await mongoose.connect(uris.mongoUri);

        // Connect ioredis to the container
        redis = new Redis(uris.redisUri);
    }, 300_000); // 5-minute timeout for container startup

    afterAll(async () => {
        await mongoose.disconnect();
        if (redis) {
            redis.disconnect();
        }
        await stopContainers();
    }, 30_000);

    it("should write and read a document from MongoDB", async () => {
        const db = mongoose.connection.db!;
        const collection = db.collection("test_items");

        await collection.insertOne({ name: "test-item", value: 42 });
        const found = await collection.findOne({ name: "test-item" });

        expect(found).toBeDefined();
        expect(found?.value).toBe(42);

        // Cleanup
        await collection.deleteOne({ name: "test-item" });
    });

    it("should set and get a value from Redis", async () => {
        await redis.set("test:key", "hello-world");
        const value = await redis.get("test:key");

        expect(value).toBe("hello-world");

        // Cleanup
        await redis.del("test:key");
    });

    it("should store and retrieve a JSON object in Redis", async () => {
        const data = { userId: "123", role: "admin" };
        await redis.set("test:json", JSON.stringify(data));

        const raw = await redis.get("test:json");
        const parsed = JSON.parse(raw!);

        expect(parsed).toEqual(data);

        // Cleanup
        await redis.del("test:json");
    });
});
