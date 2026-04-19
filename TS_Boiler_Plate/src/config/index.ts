import { z } from "zod";
import dotenv from "dotenv";


dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    DB_TYPE: z.enum(["mongodb", "postgres", "mysql"]).default("mongodb"),
    MONGODB_URL: z.string().optional(),
    POSTGRES_URL: z.string().optional(),
    MYSQL_URL: z.string().optional(),

    BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().min(1),
    JWT_REFRESH_TOKEN_SECRET: z.string().min(1),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1),

    EMAIL_ADDRESS: z.string().optional(),
    EMAIL_PASSWORD: z.string().optional(),
    ADMIN_EMAIL: z.string().optional(),

    RESET_PASSWORD_TOKEN_SECRET: z.string().optional(),
    RESET_EXPIRES_IN: z.string().optional(),

    CLOUDINARY_CLOUD_NAME: z.string().trim().optional(),
    CLOUDINARY_API_KEY: z.string().trim().optional(),
    CLOUDINARY_API_SECRET: z.string().trim().optional(),

    AES_KEY: z.string().optional(),
    AES_IV: z.string().optional(),

    RESET_PASSWORD_URL: z.string().optional(),
    FRONT_END_URL: z.string().optional(),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_ADMIN_SECRET: z.string().optional(),
    STRIPE_WEBHOOK_ADMIN_URL: z.string().optional(),

    STRIPE_ONBOARDING_SECRET_KEY: z.string().optional(),
    STRIPE_ONBOARDING_WEBHOOK_URL: z.string().optional(),

    // ── New: Redis, CORS, Proxy, Swagger ──
    REDIS_URL: z.string().optional(),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    TRUST_PROXY: z.enum(["true", "false"]).default("false"),
    SWAGGER_ENABLED: z.enum(["true", "false"]).default("true"),

    // ── Advanced Scalability ──
    RABBITMQ_URL: z.string().optional(),
    KAFKA_BROKERS: z.string().optional(),
    LOKI_URL: z.string().optional(),

    // ── OAuth ──
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().optional(),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GITHUB_CALLBACK_URL: z.string().optional(),

    // Feature Flags
    BULLMQ_ENABLED: z.enum(["true", "false"]).default("true"),
    KAFKA_ENABLED: z.enum(["true", "false"]).default("true"),
    RABBITMQ_ENABLED: z.enum(["true", "false"]).default("true"),
    STRIPE_ENABLED: z.enum(["true", "false"]).default("false"),
    CLOUDINARY_ENABLED: z.enum(["true", "false"]).default("false")
});

const env = envSchema.parse(process.env);

const config = {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,

    dbType: env.DB_TYPE,
    mongodbUrl: env.MONGODB_URL,
    postgresUrl: env.POSTGRES_URL,
    mysqlUrl: env.MYSQL_URL,

    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,

    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        jwtAccessSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
        refreshSecret: env.JWT_REFRESH_TOKEN_SECRET,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
    },

    email: {
        emailAddress: env.EMAIL_ADDRESS,
        emailPass: env.EMAIL_PASSWORD,
        adminEmail: env.ADMIN_EMAIL
    },

    reset: {
        tokenSecret: env.RESET_PASSWORD_TOKEN_SECRET,
        expiresIn: env.RESET_EXPIRES_IN
    },

    cloudinary: {
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET
    },

    security: {
        AES_KEY: env.AES_KEY,
        AES_IV: env.AES_IV
    },

    frontend: {
        resetPasswordUrl: env.RESET_PASSWORD_URL,
        url: env.FRONT_END_URL,
    },

    stripe: {
        stripeSecretKey: env.STRIPE_SECRET_KEY,
        stripeAdminWebhookSecret: env.STRIPE_WEBHOOK_ADMIN_SECRET,
        stripeAdminWebhookUrl: env.STRIPE_WEBHOOK_ADMIN_URL,
        stripeOnboardWebhookSecret: env.STRIPE_ONBOARDING_SECRET_KEY,
        stripeOnboardWebhookUrl: env.STRIPE_ONBOARDING_WEBHOOK_URL
    },

    logger: {
        level: env.NODE_ENV === "production" ? "info" : "debug",
        lokiUrl: env.LOKI_URL
    },

    redis: {
        url: env.REDIS_URL,
    },

    queues: {
        rabbitmqUrl: env.RABBITMQ_URL,
        kafkaBrokers: env.KAFKA_BROKERS
    },

    oauth: {
        googleClientId: env.GOOGLE_CLIENT_ID,
        googleClientSecret: env.GOOGLE_CLIENT_SECRET,
        googleCallbackUrl: env.GOOGLE_CALLBACK_URL,
        githubClientId: env.GITHUB_CLIENT_ID,
        githubClientSecret: env.GITHUB_CLIENT_SECRET,
        githubCallbackUrl: env.GITHUB_CALLBACK_URL
    },

    cors: {
        origin: env.CORS_ORIGIN,
    },

    trustProxy: env.TRUST_PROXY === "true",
    swaggerEnabled: env.SWAGGER_ENABLED === "true",
    features: {
        bullmqEnabled: env.BULLMQ_ENABLED === "true",
        kafkaEnabled: env.KAFKA_ENABLED === "true",
        rabbitmqEnabled: env.RABBITMQ_ENABLED === "true",
        stripeEnabled: env.STRIPE_ENABLED === "true",
        cloudinaryEnabled: env.CLOUDINARY_ENABLED === "true"
    }
};

function assertDatabaseConfig() {
    if (config.dbType === "mongodb" && !config.mongodbUrl) {
        throw new Error("MONGODB_URL is required when DB_TYPE=mongodb");
    }
    if (config.dbType === "postgres" && !config.postgresUrl) {
        throw new Error("POSTGRES_URL is required when DB_TYPE=postgres");
    }
    if (config.dbType === "mysql" && !config.mysqlUrl) {
        throw new Error("MYSQL_URL is required when DB_TYPE=mysql");
    }
}

function assertStripeConfig() {
    if (config.features.stripeEnabled) {
        if (!config.stripe.stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY is required when STRIPE_ENABLED=true");
        }
        if (!config.stripe.stripeAdminWebhookSecret) {
            throw new Error("STRIPE_WEBHOOK_ADMIN_SECRET is required when STRIPE_ENABLED=true");
        }
    }
}

function assertCloudinaryConfig() {
    if (config.features.cloudinaryEnabled) {
        if (!config.cloudinary.cloud_name) {
            throw new Error("CLOUDINARY_CLOUD_NAME is required when CLOUDINARY_ENABLED=true");
        }
        if (!config.cloudinary.api_key) {
            throw new Error("CLOUDINARY_API_KEY is required when CLOUDINARY_ENABLED=true");
        }
        if (!config.cloudinary.api_secret) {
            throw new Error("CLOUDINARY_API_SECRET is required when CLOUDINARY_ENABLED=true");
        }
    }
}

function assertRequiredWhenEnabled() {
    assertDatabaseConfig();
    assertStripeConfig();
    assertCloudinaryConfig();
}

assertRequiredWhenEnabled();

export default config;
