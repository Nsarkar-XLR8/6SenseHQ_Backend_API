import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { startContainers, stopContainers, type ContainerURIs } from "../helpers/containers.js";
import { createApp } from "../../src/app.js";

let uris: ContainerURIs;
let app: ReturnType<typeof createApp>;

describe("Category Module Containerized Integration Tests", () => {
    beforeAll(async () => {
        uris = await startContainers();
        await mongoose.connect(uris.mongoUri);
        app = createApp();
    }, 300_000); 

    afterAll(async () => {
        const db = mongoose.connection.db;
        if (db) {
            await db.dropDatabase();
        }
        await mongoose.disconnect();
        await stopContainers();
    }, 30_000);

    let categoryId = "";

    it("POST /api/v1/category/create-category - should create a new category safely", async () => {
        const payload = {
            name: "Test Electronics",
            description: "Category for electronic items"
        };
        const response = await request(app)
            .post("/api/v1/category/create-category")
            .send(payload);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Test Electronics");
        expect(response.body.data._id).toBeDefined();

        categoryId = response.body.data._id;
    });

    it("GET /api/v1/category/get-all-categories - should correctly fetch categories", async () => {
        const response = await request(app).get("/api/v1/category/get-all-categories");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        // Specifically look for the one we just created
        const names = response.body.data.map((c: any) => c.name);
        expect(names).toContain("Test Electronics");
    });

    it("GET /api/v1/category/get-single-category/:categoryId - should retrieve individual record", async () => {
        const response = await request(app).get(`/api/v1/category/get-single-category/${categoryId}`);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Test Electronics");
    });

    it("PATCH /api/v1/category/update-category/:categoryId - should apply individual overrides", async () => {
        const payload = { description: "Updated Description" };
        const response = await request(app)
            .patch(`/api/v1/category/update-category/${categoryId}`)
            .send(payload);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.description).toBe("Updated Description");
    });

    it("DELETE /api/v1/category/delete-category/:categoryId - should purge category", async () => {
        const response = await request(app).delete(`/api/v1/category/delete-category/${categoryId}`);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify it was actually deleted
        const refetch = await request(app).get(`/api/v1/category/get-single-category/${categoryId}`);
        expect(refetch.status).toBe(404);
    });
});
