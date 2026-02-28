import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Grammar check endpoint
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, language = "en" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: "Text too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    // Check user credits
    const credits = await convex.query(api.billing.getUserCredits, {
      userId: userId as any,
    });

    const cost = calculateCost(text);

    if (credits.balance < cost) {
      return NextResponse.json(
        { error: "Insufficient credits", required: cost, balance: credits.balance },
        { status: 403 }
      );
    }

    // Call NLP service
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || "http://localhost:3005";
    
    const response = await fetch(`${nlpServiceUrl}/grammar/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      throw new Error(`NLP service error: ${response.status}`);
    }

    const result = await response.json();

    // Deduct credits
    await convex.mutation(api.billing.spendCredits, {
      userId: userId as any,
      amount: cost,
      description: "Grammar check",
      metadata: {
        tool: "grammar",
        textLength: text.length,
        issuesFound: result.issues?.length || 0,
      },
    });

    // Log usage
    await convex.mutation(api.billing.recordUsageMetric, {
      userId: userId as any,
      date: new Date().toISOString().split("T")[0],
      metrics: {
        grammarChecks: 1,
        aiTokensInput: text.length / 4, // Approximate
        aiTokensOutput: JSON.stringify(result).length / 4,
        aiCost: cost,
      },
    });

    return NextResponse.json({
      success: true,
      text,
      issues: result.issues || [],
      corrections: result.corrections || [],
      cost,
      remainingCredits: credits.balance - cost,
    });

  } catch (error) {
    console.error("Grammar check error:", error);
    return NextResponse.json(
      { error: "Failed to check grammar" },
      { status: 500 }
    );
  }
}

// Calculate cost based on text length
function calculateCost(text: string): number {
  // 1 credit per 100 characters, minimum 1 credit
  return Math.max(1, Math.ceil(text.length / 100));
}
