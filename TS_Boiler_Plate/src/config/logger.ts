import pino from "pino";
import { trace, context } from "@opentelemetry/api";

const isProd = (process.env.NODE_ENV ?? "development") === "production";

export const logger = pino({
    level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
    base: null,
    // Explicitly inject traceId and spanId via mixin
    mixin() {
        const spanContext = trace.getSpanContext(context.active());
        if (!spanContext) return {};
        return {
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
            traceFlags: spanContext.traceFlags,
        };
    },
    // Better error objects in logs
    serializers: {
        err: pino.stdSerializers.err,
    },
    ...(isProd
        ? {
            // In production, log to Loki if configured
            transport: process.env.LOKI_URL
                ? {
                    target: "pino-loki",
                    options: {
                        batching: true,
                        interval: 5,
                        host: process.env.LOKI_URL,
                        labels: {
                            application: process.env.OTEL_SERVICE_NAME || "ts-boilerplate",
                            environment: process.env.NODE_ENV,
                        },
                    },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
                : undefined,
        }
        : {
            transport: {
                target: "pino-pretty",
                options: { colorize: true, translateTime: "SYS:standard", singleLine: false },
            },
        }),
});
