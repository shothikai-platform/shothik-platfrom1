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
    const { text, mode = "standard", intensity = "medium" } = body;

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

    const cost = calculateCost(text, intensity);

    if (credits.balance < cost) {
      return NextResponse.json(
        { error: "Insufficient credits", required: cost, balance: credits.balance },
        { status: 403 }
      );
    }

    // Call LLM for humanization
    const humanized = await humanizeWithLLM(text, mode, intensity);

    // Deduct credits
    await convex.mutation(api.billing.spendCredits, {
      userId: userId as any,
      amount: cost,
      description: `Humanize (${mode}, ${intensity})`,
      metadata: { tool: "humanize", mode, intensity, textLength: text.length },
    });

    // Log usage
    await convex.mutation(api.billing.recordUsageMetric, {
      userId: userId as any,
      date: new Date().toISOString().split("T")[0],
      metrics: {
        humanizeRequests: 1,
        aiTokensInput: text.length / 4,
        aiTokensOutput: humanized.length / 4,
        aiCost: cost,
      },
    });

    return NextResponse.json({
      success: true,
      original: text,
      humanized,
      mode,
      intensity,
      changes: calculateChanges(text, humanized),
      cost,
      remainingCredits: credits.balance - cost,
    });

  } catch (error) {
    console.error("Humanize error:", error);
    return NextResponse.json(
      { error: "Failed to humanize text" },
      { status: 500 }
    );
  }
}

async function humanizeWithLLM(
  text: string,
  mode: string,
  intensity: string
): Promise<string> {
  const prompts: Record<string, string> = {
    standard: "Rewrite this text to sound more natural and human-written:",
    academic: "Rewrite this text in a more academic and formal tone:",
    casual: "Rewrite this text in a casual, conversational tone:",
    creative: "Rewrite this text with more creativity and flair:",
  };

  const intensityModifiers: Record<string, string> = {
    light: "Make minimal changes, preserve the original structure.",
    medium: "Make moderate changes to improve flow and readability.",
    heavy: "Significantly rewrite while keeping the core meaning.",
  };

  const prompt = `${prompts[mode] || prompts.standard} ${intensityModifiers[intensity] || intensityModifiers.medium}\n\nText: ${text}`;

  // Call Kimi API
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    // Fallback to simple transformations
    return simpleHumanize(text, mode);
  }

  try {
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-k2-thinking",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return simpleHumanize(text, mode);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch {
    return simpleHumanize(text, mode);
  }
}

function simpleHumanize(text: string, mode: string): string {
  // Simple rule-based humanization as fallback
  let result = text;

  // Add some variability
  result = result
    .replace(/\butilize\b/gi, "use")
    .replace(/\bleverage\b/gi, "use")
    .replace(/\bfacilitate\b/gi, "help")
    .replace(/\bcommence\b/gi, "start")
    .replace(/\bterminate\b/gi, "end");

  // Add contractions
  result = result
    .replace(/\bdoes not\b/gi, "doesn't")
    .replace(/\bdid not\b/gi, "didn't")
    .replace(/\bwill not\b/gi, "won't")
    .replace(/\bcannot\b/gi, "can't");

  return result;
}

function calculateChanges(original: string, humanized: string) {
  const originalWords = original.split(/\s+/).length;
  const humanizedWords = humanized.split(/\s+/).length;
  
  return {
    wordCountBefore: originalWords,
    wordCountAfter: humanizedWords,
    difference: humanizedWords - originalWords,
    percentChange: Math.round(((humanizedWords - originalWords) / originalWords) * 100),
  };
}

function calculateCost(text: string, intensity: string): number {
  const baseCost = Math.max(1, Math.ceil(text.length / 100));
  const intensityMultiplier = intensity === "heavy" ? 3 : intensity === "medium" ? 2 : 1;
  return baseCost * intensityMultiplier * 2; // 2 credits per unit
}
