import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ============================================
// Stripe Webhook Handler
// ============================================

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle events
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      case "transfer.paid": {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferPaid(transfer);
        break;
      }

      case "transfer.failed": {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferFailed(transfer);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  // Update account status in Convex
  console.log("Account updated:", account.id, account.status);
  
  // TODO: Call Convex mutation to update account status
  // await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/stripe/update-account`, {
  //   method: "POST",
  //   body: JSON.stringify({
  //     stripeAccountId: account.id,
  //     status: account.status,
  //     payoutsEnabled: account.payouts_enabled,
  //   }),
  // });
}

async function handleTransferPaid(transfer: Stripe.Transfer) {
  console.log("Transfer paid:", transfer.id);
  
  // TODO: Update payout status in Convex
  // await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/stripe/update-payout`, {
  //   method: "POST",
  //   body: JSON.stringify({
  //     stripeTransferId: transfer.id,
  //     status: "paid",
  //     paidAt: Date.now(),
  //   }),
  // });
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  console.error("Transfer failed:", transfer.id, transfer.failure_message);
  
  // TODO: Update payout status and refund balance
  // await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/stripe/update-payout`, {
  //   method: "POST",
  //   body: JSON.stringify({
  //     stripeTransferId: transfer.id,
  //     status: "failed",
  //     failureMessage: transfer.failure_message,
  //   }),
  // });
}
