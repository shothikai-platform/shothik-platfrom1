import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, mode = "standard", strength = "medium" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text too long (max 5,000 characters)" },
        { status: 400 }
      );
    }

    // Check credits
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

    // Call paraphrase service
    const serviceUrl = process.env.PARAPHRASE_SERVICE_URL || "http://localhost:3006";
    
    const response = await fetch(`${serviceUrl}/paraphrase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode, strength }),
    });

    if (!response.ok) {
      // Fallback to LLM if T5 service fails
      const llmResult = await fallbackToLLM(text, mode, strength);
      
      // Deduct credits
      await convex.mutation(api.billing.spendCredits, {
        userId: userId as any,
        amount: cost,
        description: "Paraphrase (LLM fallback)",
        metadata: { tool: "paraphrase", mode, strength, textLength: text.length },
      });

      return NextResponse.json({
        success: true,
        original: text,
        paraphrased: llmResult,
        mode,
        strength,
        cost,
        remainingCredits: credits.balance - cost,
        source: "llm-fallback",
      });
    }

    const result = await response.json();

    // Deduct credits
    await convex.mutation(api.billing.spendCredits, {
      userId: userId as any,
      amount: cost,
      description: "Paraphrase",
      metadata: { tool: "paraphrase", mode, strength, textLength: text.length },
    });

    // Log usage
    await convex.mutation(api.billing.recordUsageMetric, {
      userId: userId as any,
      date: new Date().toISOString().split("T")[0],
      metrics: {
        paraphraseRequests: 1,
        aiTokensInput: text.length / 4,
        aiTokensOutput: result.paraphrased?.length / 4 || 0,
        aiCost: cost,
      },
    });

    return NextResponse.json({
      success: true,
      original: text,
      paraphrased: result.paraphrased,
      alternatives: result.alternatives || [],
      mode,
      strength,
      cost,
      remainingCredits: credits.balance - cost,
      source: "t5",
    });

  } catch (error) {
    console.error("Paraphrase error:", error);
    return NextResponse.json(
      { error: "Failed to paraphrase" },
      { status: 500 }
    );
  }
}

// Fallback to LLM if T5 service is down
async function fallbackToLLM(text: string, mode: string, strength: string): Promise<string> {
  // Simple paraphrasing rules as fallback
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  const paraphrased = sentences.map(sentence => {
    // Simple word replacements
    return sentence
      .replace(/\bgood\b/gi, "excellent")
      .replace(/\bbad\b/gi, "poor")
      .replace(/\bbig\b/gi, "large")
      .replace(/\bsmall\b/gi, "compact")
      .replace(/\bvery\b/gi, "extremely")
      .replace(/\bmany\b/gi, "numerous")
      .replace(/\bsome\b/gi, "certain")
      .replace(/\bthing\b/gi, "aspect");
  });

  return paraphrased.join(" ");
}

function calculateCost(text: string): number {
  // 2 credits per 100 characters
  return Math.max(1, Math.ceil(text.length / 100) * 2);
}
