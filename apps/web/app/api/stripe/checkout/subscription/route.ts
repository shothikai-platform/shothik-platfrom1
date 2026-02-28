import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import stripe, { SUBSCRIPTION_TIERS, CREDIT_PACKAGES } from "@/lib/stripe/client";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Create checkout session for subscription
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tier, interval = "month", successUrl, cancelUrl } = body;

    // Validate tier
    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    if (!tierConfig || tier === "free") {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Get price ID
    const priceId =
      interval === "year"
        ? tierConfig.yearlyPriceId
        : tierConfig.priceId;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let customerId = await getOrCreateStripeCustomer(userId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// Get or create Stripe customer
async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Check if user already has a Stripe customer ID
  const user = await convex.query(api.users.getUserById, { userId });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Get user details from Clerk
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("User not authenticated");

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    metadata: {
      userId: clerkUserId,
    },
  });

  // Save customer ID to user record
  await convex.mutation(api.users.updateUserStripeCustomerId, {
    userId: clerkUserId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}
