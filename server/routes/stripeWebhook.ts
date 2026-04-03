import Stripe from "stripe";
import express from "express";
import { getDb } from "../db";
import { houses } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2025-02-24.acacia" as any,
});

export const stripeWebhookHandler = async (req: express.Request, res: express.Response) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder");
    } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    const db = await getDb();
    if (!db) {
        res.status(500).send("No DB");
        return;
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.client_reference_id && session.subscription && session.customer) {
                await db.update(houses).set({
                    planType: "premium",
                    stripeSubscriptionId: session.subscription as string,
                    stripeCustomerId: session.customer as string,
                    subscriptionStatus: "active",
                }).where(eq(houses.id, parseInt(session.client_reference_id)));
            }
            break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await db.update(houses).set({
                subscriptionStatus: subscription.status,
                planType: subscription.status === 'active' || subscription.status === 'trialing' ? 'premium' : 'free'
            }).where(eq(houses.stripeSubscriptionId, subscription.id));
            break;
        }
    }

    res.json({ received: true });
};
