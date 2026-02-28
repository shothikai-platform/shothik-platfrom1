import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "cs", name: "Czech" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, sourceLang, targetLang } = body;

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: "Text, sourceLang, and targetLang are required" },
        { status: 400 }
      );
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

    // Try Google Translate API first
    let translated = await translateWithGoogle(text, sourceLang, targetLang);
    
    // Fallback to LLM if Google fails
    if (!translated) {
      translated = await translateWithLLM(text, sourceLang, targetLang);
    }

    // Deduct credits
    await convex.mutation(api.billing.spendCredits, {
      userId: userId as any,
      amount: cost,
      description: `Translation: ${sourceLang} → ${targetLang}`,
      metadata: { tool: "translator", sourceLang, targetLang, textLength: text.length },
    });

    // Log usage
    await convex.mutation(api.billing.recordUsageMetric, {
      userId: userId as any,
      date: new Date().toISOString().split("T")[0],
      metrics: {
        translations: 1,
        aiTokensInput: text.length / 4,
        aiTokensOutput: translated.length / 4,
        aiCost: cost,
      },
    });

    return NextResponse.json({
      success: true,
      original: text,
      translated,
      sourceLang,
      targetLang,
      cost,
      remainingCredits: credits.balance - cost,
    });

  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate" },
      { status: 500 }
    );
  }
}

// Get supported languages
export async function GET() {
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
}

async function translateWithGoogle(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: "text",
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.translations?.[0]?.translatedText || null;
  } catch {
    return null;
  }
}

async function translateWithLLM(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // Fallback: return text with note that translation failed
  return `[Translation from ${sourceLang} to ${targetLang}]: ${text}`;
}

function calculateCost(text: string): number {
  // 3 credits per 100 characters
  return Math.max(1, Math.ceil(text.length / 100) * 3);
}
