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
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: "Text too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    // Check credits
    const credits = await convex.query(api.billing.getUserCredits, {
      userId: userId as any,
    });

    const cost = 5; // Flat rate for AI detection

    if (credits.balance < cost) {
      return NextResponse.json(
        { error: "Insufficient credits", required: cost, balance: credits.balance },
        { status: 403 }
      );
    }

    // Call ONNX AI Detector service
    const serviceUrl = process.env.AI_DETECTOR_URL || "http://localhost:3007";
    
    const response = await fetch(`${serviceUrl}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    let result;
    
    if (!response.ok) {
      // Fallback to simple heuristic
      result = fallbackDetection(text);
    } else {
      result = await response.json();
    }

    // Deduct credits
    await convex.mutation(api.billing.spendCredits, {
      userId: userId as any,
      amount: cost,
      description: "AI Detection",
      metadata: { tool: "ai-detector", textLength: text.length },
    });

    // Log usage
    await convex.mutation(api.billing.recordUsageMetric, {
      userId: userId as any,
      date: new Date().toISOString().split("T")[0],
      metrics: {
        aiDetectorScans: 1,
        aiCost: cost,
      },
    });

    return NextResponse.json({
      success: true,
      text,
      ...result,
      cost,
      remainingCredits: credits.balance - cost,
    });

  } catch (error) {
    console.error("AI detection error:", error);
    return NextResponse.json(
      { error: "Failed to analyze text" },
      { status: 500 }
    );
  }
}

// Fallback heuristic detection
function fallbackDetection(text: string) {
  // Simple heuristics that might indicate AI-generated text
  const indicators = {
    repetitivePatterns: (text.match(/\b(in addition|furthermore|moreover)\b/gi) || []).length,
    avgSentenceLength: text.split(/[.!?]+/).filter(s => s.trim()).reduce((sum, s) => sum + s.length, 0) / text.split(/[.!?]+/).filter(s => s.trim()).length,
    formalTransitions: (text.match(/\b(therefore|thus|consequently|hence)\b/gi) || []).length,
    lackOfContractions: !(text.match(/\b(don't|can't|won't|isn't|aren't)\b/i)),
  };

  // Calculate score (0-100, higher = more likely AI)
  let score = 50;
  
  if (indicators.repetitivePatterns > 2) score += 15;
  if (indicators.avgSentenceLength > 100) score += 10;
  if (indicators.formalTransitions > 2) score += 10;
  if (indicators.lackOfContractions) score += 10;

  return {
    isAIGenerated: score > 60,
    confidence: Math.min(100, score),
    score,
    indicators,
    analysis: score > 60 
      ? "Text shows patterns consistent with AI generation"
      : "Text appears to be human-written",
  };
}
