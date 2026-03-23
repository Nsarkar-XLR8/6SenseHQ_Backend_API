import { logger } from "../../config/logger.js";

export async function processPaymentJob(
    name: string,
    payload: Record<string, unknown>
): Promise<void> {
    switch (name) {
        case "payment.intent.succeeded":
            logger.info({ payload }, "Processing payment success workflow");
            return;
        case "subscription.updated":
            logger.info({ payload }, "Processing subscription update workflow");
            return;
        case "subscription.deleted":
            logger.info({ payload }, "Processing subscription deletion workflow");
            return;
        case "payment.checkout.completed":
            logger.info({ payload }, "Processing checkout completed workflow");
            return;
        case "invoice.payment_failed":
            logger.warn({ payload }, "Processing invoice payment failure workflow");
            return;
        default:
            logger.debug({ name, payload }, "No payment processor found for job");
    }
}
