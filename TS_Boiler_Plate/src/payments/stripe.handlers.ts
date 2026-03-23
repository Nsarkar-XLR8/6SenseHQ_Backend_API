import { logger } from "../config/logger.js";
import { messageBus } from "../messaging/messageBus.js";
import type Stripe from "stripe";

type StripeEventHandler = (event: Stripe.Event) => Promise<void>;

async function enqueueWorkflow(event: Stripe.Event, jobName: string) {
    const published = await messageBus.publish({
        name: jobName,
        kind: "job",
        idempotencyKey: event.id,
        payload: {
            stripeEventId: event.id,
            stripeEventType: event.type,
            data: event.data.object as unknown as Record<string, unknown>,
            occurredAt: event.created,
        },
    });

    if (!published) {
        throw new Error(`Failed to safely enqueue Stripe event: ${jobName}`);
    }
}

const handlers: Record<string, StripeEventHandler> = {
    "payment_intent.succeeded": async (event) => {
        await enqueueWorkflow(event, "payment.intent.succeeded");
    },
    "checkout.session.completed": async (event) => {
        await enqueueWorkflow(event, "payment.checkout.completed");
    },
    "customer.subscription.created": async (event) => {
        await enqueueWorkflow(event, "subscription.updated");
    },
    "customer.subscription.updated": async (event) => {
        await enqueueWorkflow(event, "subscription.updated");
    },
    "customer.subscription.deleted": async (event) => {
        await enqueueWorkflow(event, "subscription.deleted");
    },
    "invoice.payment_failed": async (event) => {
        await enqueueWorkflow(event, "invoice.payment_failed");
    },
};

export async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
    const handler = handlers[event.type];
    if (!handler) {
        logger.debug({ type: event.type }, "Unhandled Stripe event type");
        return;
    }
    await handler(event);
}
