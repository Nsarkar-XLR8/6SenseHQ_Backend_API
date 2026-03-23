import { Kafka, Producer, Consumer, logLevel } from "kafkajs";
import { logger } from "../config/logger.js";

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let consumer: Consumer | null = null;

/**
 * Connect Kafka producer. No-op if KAFKA_BROKERS is not set.
 */
export async function connectKafka(brokers?: string, clientId?: string): Promise<void> {
    if (!brokers) {
        logger.info("⏭️  KAFKA_BROKERS not set — skipping Kafka");
        return;
    }

    try {
        kafka = new Kafka({
            clientId: clientId ?? "ts-boilerplate",
            brokers: brokers.split(",").map(b => b.trim()),
            logLevel: logLevel.WARN,
        });

        producer = kafka.producer();
        await producer.connect();

        logger.info("✅ Kafka producer connected");
    } catch (err) {
        logger.warn({ err }, "Kafka connection failed — continuing without it");
        kafka = null;
        producer = null;
    }
}

export async function disconnectKafka(): Promise<void> {
    try {
        if (consumer) await consumer.disconnect();
        if (producer) await producer.disconnect();
        logger.info("Kafka disconnected");
    } catch (err) {
        logger.error({ err }, "Kafka disconnect error");
    } finally {
        consumer = null;
        producer = null;
        kafka = null;
    }
}

export function isKafkaReady(): boolean {
    return producer !== null;
}

// ── Event Helpers ────────────────────────────────────────────────────

/**
 * Publish an event to a Kafka topic. No-op if not connected.
 */
export async function publishEvent(
    topic: string,
    message: { key?: string; value: Record<string, unknown> }
): Promise<void> {
    if (!producer) {
        logger.debug({ topic }, "Kafka not connected — event dropped");
        return;
    }

    await producer.send({
        topic,
        messages: [
            {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                key: message.key as any,
                value: JSON.stringify(message.value),
            },
        ],
    });

    logger.debug({ topic }, "Event published to Kafka");
}

/**
 * Subscribe to a Kafka topic. Creates a new consumer per call.
 */
export async function subscribeToTopic(
    topic: string,
    groupId: string,
    handler: (message: Record<string, unknown>) => Promise<void> | void
): Promise<void> {
    if (!kafka) {
        logger.warn({ topic }, "Kafka not connected — cannot subscribe");
        return;
    }

    consumer = kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                const value = message.value?.toString();
                if (value) {
                    const parsed = JSON.parse(value) as Record<string, unknown>;
                    await handler(parsed);
                }
            } catch (err) {
                logger.error({ err, topic }, "Error processing Kafka message");
            }
        },
    });

    logger.info({ topic, groupId }, "Kafka consumer subscribed");
}
