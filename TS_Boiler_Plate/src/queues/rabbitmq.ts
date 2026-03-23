import amqp from "amqplib";
import { logger } from "../config/logger.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;

/**
 * Connect to RabbitMQ. No-op if RABBITMQ_URL is not set.
 */
export async function connectRabbitMQ(url?: string): Promise<void> {
    if (!url) {
        logger.info("⏭️  RABBITMQ_URL not set — skipping RabbitMQ");
        return;
    }

    try {
        connection = await amqp.connect(url);
        channel = await connection.createChannel();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connection.on("error", (err: any) => {
            logger.error({ err }, "RabbitMQ connection error");
        });

        connection.on("close", () => {
            logger.warn("RabbitMQ connection closed");
            channel = null;
            connection = null;
        });

        logger.info("✅ RabbitMQ connected");
    } catch (err) {
        logger.warn({ err }, "RabbitMQ connection failed — continuing without it");
        connection = null;
        channel = null;
    }
}

export async function disconnectRabbitMQ(): Promise<void> {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        logger.info("RabbitMQ disconnected");
    } catch (err) {
        logger.error({ err }, "RabbitMQ disconnect error");
    } finally {
        channel = null;
        connection = null;
    }
}

export function isRabbitReady(): boolean {
    return connection !== null && channel !== null;
}

// ── Queue Helpers ────────────────────────────────────────────────────

/**
 * Publish a message to a queue. No-op if RabbitMQ is not connected.
 */
export async function publishToQueue(queue: string, message: Record<string, unknown>): Promise<boolean> {
    if (!channel) {
        logger.debug({ queue }, "RabbitMQ not connected — message dropped");
        return false;
    }

    await channel.assertQueue(queue, { durable: true });
    const sent = channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
    });

    logger.debug({ queue, sent }, "Message published to RabbitMQ");
    return sent;
}

/**
 * Consume messages from a queue.
 */
export async function consumeFromQueue(
    queue: string,
    handler: (msg: Record<string, unknown>) => Promise<void> | void
): Promise<void> {
    if (!channel) {
        logger.warn({ queue }, "RabbitMQ not connected — cannot consume");
        return;
    }

    await channel.assertQueue(queue, { durable: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await channel.consume(queue, async (msg: any) => {
        if (!msg) return;

        try {
            const content = JSON.parse(msg.content.toString()) as Record<string, unknown>;
            await handler(content);
            channel!.ack(msg);
        } catch (err) {
            logger.error({ err, queue }, "Error processing RabbitMQ message");
            channel!.nack(msg, false, false); // Dead-letter
        }
    });

    logger.info({ queue }, "RabbitMQ consumer registered");
}
