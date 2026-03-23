import "../config/env.js";
import config from "../config/index.js";
import { logger } from "../config/logger.js";
import { connectDB, disconnectDB } from "../database/index.js";
import { connectRedis, disconnectRedis } from "../lib/redis.js";
import { initMessaging, logCapabilityReport } from "../messaging/index.js";
import { messageBus } from "../messaging/messageBus.js";
import { closeBullMQ } from "../queues/bullmq.js";
import { processPaymentJob } from "./processors/paymentJobs.js";

await connectDB();
await connectRedis(config.redis.url);
initMessaging();
logCapabilityReport();

const processor = async (payload: any) => {
    const eventName = String(payload.__metaEventName ?? payload.eventName ?? payload.name ?? "unknown");
    await processPaymentJob(eventName, payload);
};

await messageBus.subscribe("events", processor, { transport: "bullmq", concurrency: 10 });
await messageBus.subscribe("jobs", processor, { transport: "bullmq", concurrency: 10 });

logger.info("BullMQ worker is running");

const shutdown = async () => {
    await closeBullMQ();
    await disconnectRedis();
    await disconnectDB();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
