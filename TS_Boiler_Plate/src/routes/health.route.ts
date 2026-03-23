import { Router } from "express";
import { isDbReady } from "../database/index.js";
import { isRedisReady } from "../lib/redis.js";
import { isRabbitReady } from "../queues/rabbitmq.js";
import { isKafkaReady } from "../queues/kafka.js";
import { isBullMQReady } from "../queues/bullmq.js";

export const healthRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: System
 *     description: System health and operational endpoints
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: Retrieves the current system health and uptime.
 *     operationId: getSystemHealth
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: OK
 */
healthRouter.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "OK",
        data: {
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }
    });
});

healthRouter.get("/ready", (_req, res) => {
    const dbReady = isDbReady();
    const redisStatus = isRedisReady();
    const rabbitMQStatus = isRabbitReady();
    const kafkaStatus = isKafkaReady();
    const bullmqStatus = isBullMQReady();
    
    // DB is the only hard requirement for readiness. All other queues degrade gracefully.
    const ready = dbReady;

    res.status(ready ? 200 : 503).json({
        success: ready,
        statusCode: ready ? 200 : 503,
        message: ready ? "READY" : "NOT_READY",
        data: { 
            db: dbReady, 
            redis: redisStatus,
            rabbitmq: rabbitMQStatus,
            kafka: kafkaStatus,
            bullmq: bullmqStatus
        }
    });
});
