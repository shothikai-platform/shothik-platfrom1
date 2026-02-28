import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import stripe, { CREDIT_PACKAGES } from "@/lib/stripe/client";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Create checkout session for credit purchase
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, successUrl, cancelUrl } = body;

    // Find credit package
    const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { error: "Invalid credit package" },
        { status: 400 }
      );
    }

    if (!creditPackage.priceId) {
      return NextResponse.json(
        { error: "Price not configured" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      client_reference_id: userId,
      line_items: [
        {
          price: creditPackage.priceId,
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          type: "credit_purchase",
          userId,
          packageId: creditPackage.id,
          credits: creditPackage.credits.toString(),
        },
      },
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/billing/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/credits/cancel`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Credit checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// Get or create Stripe customer
async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Implementation same as subscription route
  // In production, this would be a shared utility
  const { stripe } = await import("@/lib/stripe/client");
  const { api } = await import("@/convex/_generated/api");

  const user = await convex.query(api.users.getUserById, { userId });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    metadata: { userId },
  });

  await convex.mutation(api.users.updateUserStripeCustomerId, {
    userId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}
