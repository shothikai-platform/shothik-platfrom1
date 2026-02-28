import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import stripe from "@/lib/stripe/client";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Get billing portal session
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { returnUrl } = body;

    // Get user's Stripe customer ID
    const user = await convex.query(api.users.getUserById, { userId });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription
    const subscription = await convex.query(api.billing.getUserSubscription, {
      userId: userId as any,
    });

    if (!subscription?.subscription) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 404 }
      );
    }

    // Cancel at period end
    await stripe.subscriptions.update(
      subscription.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update in database
    await convex.mutation(api.billing.updateSubscriptionStatus, {
      stripeSubscriptionId: subscription.subscription.stripeSubscriptionId,
      status: subscription.subscription.status,
      cancelAtPeriodEnd: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
