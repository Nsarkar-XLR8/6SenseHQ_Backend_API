import path from "node:path";
import swaggerJSDoc from "swagger-jsdoc";

const isProd = (process.env.NODE_ENV ?? "development") === "production";

export const openapiSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: process.env.APP_NAME ?? "6Sense HQ Backend Challenge API",
            version: process.env.APP_VERSION ?? "1.0.0",
            description: "API documentation",
            contact: {
                name: "API Support",
                email: "nsarkar6251@gmail.com"
            }
        },
        servers: [
            {
                url: process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 5000}`,
                description: isProd ? "Production" : "Local"
            }
        ]
        ,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },

    // ✅ Works for both:
    // - dev: tsx runs src/*.ts
    // - prod: node runs dist/*.js
    apis: isProd
        ? [path.join(process.cwd(), "dist/**/*.js")]
        : [path.join(process.cwd(), "src/**/*.ts")]
});
