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
    const { text, type = "key-points", length = "medium" } = body;

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

    const cost = calculateCost(text, length);

    if (credits.balance < cost) {
      return NextResponse.json(
        { error: "Insufficient credits", required: cost, balance: credits.balance },
        { status: 403 }
      );
    }

    // Generate summary
    const summary = await generateSummary(text, type, length);

    // Deduct credits
    await convex.mutation(api.billing.spendCredits, {
      userId: userId as any,
      amount: cost,
      description: `Summarize (${type}, ${length})`,
      metadata: { tool: "summarize", type, length, textLength: text.length },
    });

    // Log usage
    await convex.mutation(api.billing.recordUsageMetric, {
      userId: userId as any,
      date: new Date().toISOString().split("T")[0],
      metrics: {
        summaries: 1,
        aiTokensInput: text.length / 4,
        aiTokensOutput: summary.length / 4,
        aiCost: cost,
      },
    });

    return NextResponse.json({
      success: true,
      original: text,
      summary,
      type,
      length,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: Math.round((summary.length / text.length) * 100),
      cost,
      remainingCredits: credits.balance - cost,
    });

  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "Failed to summarize" },
      { status: 500 }
    );
  }
}

async function generateSummary(
  text: string,
  type: string,
  length: string
): Promise<string> {
  const lengthTargets: Record<string, string> = {
    short: "1-2 sentences",
    medium: "3-5 sentences",
    long: "1-2 paragraphs",
  };

  const typePrompts: Record<string, string> = {
    "key-points": `Extract the key points from this text as bullet points (${lengthTargets[length]}):`,
    "tl-dr": `Provide a TL;DR summary (${lengthTargets[length]}):`,
    "abstract": `Write an academic-style abstract (${lengthTargets[length]}):`,
    "executive": `Write an executive summary for business leaders (${lengthTargets[length]}):`,
  };

  const prompt = `${typePrompts[type] || typePrompts["key-points"]}\n\n${text}`;

  // Call Kimi API
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    // Fallback to extractive summarization
    return extractiveSummary(text, length);
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
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      return extractiveSummary(text, length);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch {
    return extractiveSummary(text, length);
  }
}

function extractiveSummary(text: string, length: string): string {
  // Simple extractive summarization as fallback
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  const counts: Record<string, number> = {
    short: 1,
    medium: 3,
    long: 5,
  };
  
  const numSentences = Math.min(counts[length] || 3, sentences.length);
  
  // Score sentences by keyword density
  const wordFreq: Record<string, number> = {};
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  words.forEach((word) => {
    if (word.length > 4) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const scoredSentences = sentences.map((sentence) => {
    const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    const score = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0);
    return { sentence, score };
  });

  // Get top sentences in original order
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence));

  return topSentences.map((s) => s.sentence.trim()).join(" ");
}

function calculateCost(text: string, length: string): number {
  const baseCost = Math.max(1, Math.ceil(text.length / 100));
  const lengthMultiplier = length === "long" ? 3 : length === "medium" ? 2 : 1;
  return baseCost * lengthMultiplier;
}
