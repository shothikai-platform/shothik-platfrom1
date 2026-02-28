import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe/client";
import { headers } from "next/headers";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Stripe webhook secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`Processing webhook: ${event.type}`);

  try {
    switch (event.type) {
      // Subscription events
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      // Payment events
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      // Checkout events
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      // Credit purchase events
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Subscription created:", subscription.id);

  // Store webhook event
  await convex.mutation(api.billing.storeWebhookEvent, {
    stripeEventId: subscription.id,
    type: "customer.subscription.created",
    payload: {
      object: "subscription",
      objectId: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status,
    },
  });
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);

  await convex.mutation(api.billing.updateSubscriptionStatus, {
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: subscription.current_period_end * 1000,
  });

  await convex.mutation(api.billing.markWebhookProcessed, {
    stripeEventId: subscription.id,
  });
}

// Handle subscription deleted (canceled)
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription deleted:", subscription.id);

  await convex.mutation(api.billing.updateSubscriptionStatus, {
    stripeSubscriptionId: subscription.id,
    status: "canceled",
    cancelAtPeriodEnd: false,
  });
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Invoice payment succeeded:", invoice.id);

  // Only process subscription invoices
  if (invoice.subscription) {
    // Add credits for the new period
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );

    const customerId = invoice.customer as string;
    const user = await convex.query(api.billing.getUserByStripeCustomerId, {
      stripeCustomerId: customerId,
    });

    if (user) {
      // Get plan credits
      const plan = await convex.query(api.billing.getSubscriptionPlanByPriceId, {
        stripePriceId: subscription.items.data[0].price.id,
      });

      if (plan) {
        await convex.mutation(api.billing.addCredits, {
          userId: user.userId,
          amount: plan.features.monthlyCredits,
          type: "purchase",
          description: `Monthly credits for ${plan.name} subscription`,
          paymentIntentId: invoice.payment_intent as string,
        });
      }
    }
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Invoice payment failed:", invoice.id);

  // Update subscription status to past_due
  if (invoice.subscription) {
    await convex.mutation(api.billing.updateSubscriptionStatus, {
      stripeSubscriptionId: invoice.subscription as string,
      status: "past_due",
      cancelAtPeriodEnd: false,
    });
  }
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log("Checkout session completed:", session.id);

  const userId = session.client_reference_id;
  if (!userId) {
    console.error("No user ID in checkout session");
    return;
  }

  // Handle subscription checkout
  if (session.mode === "subscription" && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const plan = await convex.query(api.billing.getSubscriptionPlanByPriceId, {
      stripePriceId: subscription.items.data[0].price.id,
    });

    if (plan) {
      await convex.mutation(api.billing.createSubscription, {
        userId: userId as any,
        planId: plan._id,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        interval: subscription.items.data[0].price.recurring?.interval as any,
        currentPeriodStart: subscription.current_period_start * 1000,
        currentPeriodEnd: subscription.current_period_end * 1000,
        trialEnd: subscription.trial_end
          ? subscription.trial_end * 1000
          : undefined,
      });

      // Add initial credits
      await convex.mutation(api.billing.addCredits, {
        userId: userId as any,
        amount: plan.features.monthlyCredits,
        type: "purchase",
        description: `Initial credits for ${plan.name} subscription`,
      });
    }
  }

  // Handle credit purchase
  if (session.mode === "payment" && session.payment_intent) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    const metadata = paymentIntent.metadata;
    if (metadata?.credits && metadata?.packageId) {
      await convex.mutation(api.billing.addCredits, {
        userId: userId as any,
        amount: parseInt(metadata.credits),
        type: "purchase",
        description: `Credit purchase: ${metadata.packageId}`,
        paymentIntentId: paymentIntent.id,
      });
    }
  }
}

// Handle payment intent succeeded (for credit purchases)
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment intent succeeded:", paymentIntent.id);

  // Only process if it's a credit purchase (not subscription)
  if (paymentIntent.metadata?.type === "credit_purchase") {
    const userId = paymentIntent.metadata.userId;
    const credits = parseInt(paymentIntent.metadata.credits);

    await convex.mutation(api.billing.addCredits, {
      userId: userId as any,
      amount: credits,
      type: "purchase",
      description: `Credit purchase`,
      paymentIntentId: paymentIntent.id,
    });
  }
}

// Handle payment intent failed
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment intent failed:", paymentIntent.id);
  // Could send email notification to user
}
