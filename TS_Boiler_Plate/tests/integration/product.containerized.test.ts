import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { startContainers, stopContainers, type ContainerURIs } from "../helpers/containers.js";
import { createApp } from "../../src/app.js";

// Mocking Cloudinary integrations beforehand to intercept service calls
vi.mock("../../src/utils/cloudinary.js", () => {
    return {
        uploadToCloudinaryFromMulter: vi.fn().mockResolvedValue({
            secure_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            public_id: "sample_id",
        }),
        deleteFromCloudinary: vi.fn().mockResolvedValue(true),
    };
});

let uris: ContainerURIs;
let app: ReturnType<typeof createApp>;

describe("Product Module Containerized Integration Tests", () => {
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
    let productId = "";

    it("Pre-requisite setup: should instantiate a new category to link product references", async () => {
        const response = await request(app)
            .post("/api/v1/category/create-category")
            .send({ name: "General Goods", description: "All encompassing items" });

        expect(response.status).toBe(201);
        categoryId = response.body.data._id;
    });

    it("POST /api/v1/product/create-product - should create product with a simulated file payload", async () => {
        const response = await request(app)
            .post("/api/v1/product/create-product")
            // Send Multipart-Form Data using supertest
            .field("name", "Test Widget")
            .field("description", "A highly advanced widget.")
            .field("price", 100)
            .field("discount", 20)
            .field("category", categoryId)
            .attach("image", Buffer.from("fake-image"), "test-widget.jpg"); // Simulated image attachment

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Test Widget");
        expect(response.body.data.productCode).toBeDefined(); // Expects Product.utils productCode creation
        expect(response.body.data.category).toBe(categoryId);
        expect(response.body.data.image).toBe("https://res.cloudinary.com/demo/image/upload/sample.jpg"); // From mocked output

        productId = response.body.data._id;
    });

    it("POST /api/v1/product/create-product - should return 400 if image is missing", async () => {
        const response = await request(app)
            .post("/api/v1/product/create-product")
            .field("name", "No Image Widget")
            .field("description", "A widget without an image.")
            .field("price", 100)
            .field("category", categoryId);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("image is required");
    });

    it("GET /api/v1/product/get-all-products - should correctly fetch products via parameter logic", async () => {
        const response = await request(app)
            .get("/api/v1/product/get-all-products")
            .query({ searchTerm: "Widget", category: categoryId });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].name).toBe("Test Widget");
    });

    it("GET /api/v1/product/:productId - should successfully grab discrete record", async () => {
        const response = await request(app).get(`/api/v1/product/${productId}`);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe("Test Widget");
        
        // Assert dynamic population logic worked
        expect(response.body.data.category._id).toBe(categoryId);
        expect(response.body.data.category.name).toBe("General Goods");
    });

    it("PATCH /api/v1/product/:productId - should dynamically handle update", async () => {
        const response = await request(app)
            .patch(`/api/v1/product/${productId}`)
            .field("price", 150)
            .field("discount", 0); // No image attachment applied, fallback logic should kick in
            
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.price).toBe(150);
        expect(response.body.data.discount).toBe(0);
        // Original Mock URL Should Be Maintained
        expect(response.body.data.image).toBe("https://res.cloudinary.com/demo/image/upload/sample.jpg");
    });

    it("DELETE /api/v1/product/:productId - should securely eradicate item alongside external service invocation handling", async () => {
        const response = await request(app).delete(`/api/v1/product/${productId}`);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const refetch = await request(app).get(`/api/v1/product/${productId}`);
        expect(refetch.status).toBe(404);
    });
});
