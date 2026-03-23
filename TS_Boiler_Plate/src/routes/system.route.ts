import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { isDbReady } from "../database/index.js";
import { isRedisReady } from "../lib/redis.js";
import { messageBus } from "../messaging/messageBus.js";
import type { CapabilityReport, PipelineReadiness } from "../interfaces/system.interface.js";
import { sendResponse } from "../utils/sendResponse.js";

export const systemRouter = Router();

systemRouter.get("/capabilities", (req, res) => {
    const data: CapabilityReport = messageBus.health();
    return sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Capability report",
        data,
        ...(req.requestId === undefined ? {} : { requestId: req.requestId }),
    });
});

systemRouter.get("/pipeline-ready", (req, res) => {
    const bus = messageBus.getCapabilities();
    const data: PipelineReadiness = {
        db: isDbReady(),
        redis: isRedisReady(),
        messaging: bus,
    };
    const ready = data.db && (bus.bullmq || bus.kafka || bus.rabbitmq);
    return sendResponse(res, {
        statusCode: ready ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE,
        message: ready ? "PIPELINE_READY" : "PIPELINE_NOT_READY",
        data,
        ...(req.requestId === undefined ? {} : { requestId: req.requestId }),
    });
});
