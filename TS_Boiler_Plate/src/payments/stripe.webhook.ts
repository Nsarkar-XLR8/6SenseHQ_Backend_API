import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type Stripe from "stripe";
import config from "../config/index.js";
import { logger } from "../config/logger.js";
import { setIfNotExists, isRedisReady } from "../lib/redis.js";
import { getStripe } from "./stripe.js";
import { dispatchStripeEvent } from "./stripe.handlers.js";

/**
 * Stripe webhook handler.
 * Verifies signature, enforces idempotency, then dispatches to handlers.
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const stripe = getStripe();
    if (!stripe) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Stripe not configured" });
        return;
    }

    if (!isRedisReady()) {
        logger.error("Redis is unavailable. Rejecting Stripe webhook to prevent idempotency bypass.");
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Temporarily unavailable" });
        return;
    }

    const sig = req.headers["stripe-signature"];
    const webhookSecret = config.stripe.stripeAdminWebhookSecret;

    if (!sig || !webhookSecret) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing signature or webhook secret" });
        return;
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err) {
        logger.error({ err }, "Stripe webhook signature verification failed");
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid signature" });
        return;
    }

    logger.info({ type: event.type, id: event.id }, "Stripe webhook received");

    const accepted = await setIfNotExists(`idemp:stripe:${event.id}`, "1", 24 * 60 * 60);
    if (!accepted) {
        logger.info({ id: event.id }, "Duplicate Stripe event ignored");
        res.status(StatusCodes.OK).json({ received: true, duplicate: true });
        return;
    }

    await dispatchStripeEvent(event);

    res.status(StatusCodes.OK).json({ received: true });
}