import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { grantVaultAccess } from "@/lib/billing";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY?.trim();
        const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!secret || !whSecret) {
          return Response.json(
            { error: "Stripe webhook is not configured" },
            { status: 503 },
          );
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return Response.json({ error: "Missing signature" }, { status: 400 });
        }

        const raw = await request.text();
        const stripe = new Stripe(secret);
        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(raw, signature, whSecret);
        } catch {
          return Response.json({ error: "Invalid signature" }, { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId =
            session.client_reference_id || session.metadata?.userId || "";
          if (userId && (session.payment_status === "paid" || session.status === "complete")) {
            const intent =
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id ?? null;
            const customer =
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null;
            await grantVaultAccess({
              userId,
              source: "stripe",
              stripeSessionId: session.id,
              stripeCustomerId: customer,
              stripePaymentIntent: intent,
            });
          }
        }

        return Response.json({ received: true });
      },
    },
  },
});
