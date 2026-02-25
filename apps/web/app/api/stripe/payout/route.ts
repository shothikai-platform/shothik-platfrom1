import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthToken } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// ============================================
// Create Payout (Transfer to Connected Account)
// ============================================

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId, amount, currency = "usd" } = await req.json();

    // Validate minimum payout ($25)
    if (amount < 2500) {
      return NextResponse.json(
        { error: "Minimum payout is $25" },
        { status: 400 }
      );
    }

    // Get user's Stripe account
    // TODO: Fetch from Convex
    const stripeAccountId = await getStripeAccountId(userId);

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    // Verify account is active
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account.payouts_enabled) {
      return NextResponse.json(
        { error: "Payouts not enabled for this account" },
        { status: 400 }
      );
    }

    // Create transfer
    const transfer = await stripe.transfers.create({
      amount,
      currency: currency.toLowerCase(),
      destination: stripeAccountId,
      description: `Shothik royalty payout`,
      metadata: {
        userId,
        platform: "shothik",
      },
    });

    // Record in database
    // TODO: Call Convex mutation

    return NextResponse.json({
      transferId: transfer.id,
      status: transfer.status,
      amount: transfer.amount,
      currency: transfer.currency,
      estimatedArrival: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days
    });
  } catch (error) {
    console.error("Payout error:", error);
    return NextResponse.json(
      { error: "Failed to process payout" },
      { status: 500 }
    );
  }
}

async function getStripeAccountId(userId: string): Promise<string | null> {
  // TODO: Fetch from Convex
  return null;
}
