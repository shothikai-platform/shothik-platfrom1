import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

const SYSTEM_PROMPT = `You are an expert academic writing co-author assistant for STEM researchers. Your role is to help complete, extend, and improve academic text.

Rules:
- Continue writing naturally from where the text left off
- Match the academic tone, style, and vocabulary of the existing text
- Use proper academic language and formal register
- When the context includes LaTeX, mathematical notation, or code, handle them appropriately
- Keep responses concise and directly relevant
- Do not repeat the input text, only provide the continuation
- Do not add meta-commentary like "Here's the continuation" — just write the text
- If asked to complete a sentence, complete it naturally
- For autocomplete requests, provide only 1-2 sentences maximum
- For expand requests, provide 2-4 paragraphs
- For paragraph requests, provide 1 complete paragraph`;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const identifier = authHeader || request.headers.get("x-forwarded-for") || "anonymous";
    const { allowed, remaining, resetAt } = checkRateLimit(identifier, {
      windowMs: 60000,
      maxRequests: 10,
    });

    if (!allowed) {
      return rateLimitResponse(remaining, resetAt);
    }

    const body = await request.json();
    const { context, currentText, mode = "autocomplete", instruction } = body;

    if (!currentText && !instruction) {
      return new Response(JSON.stringify({ error: "Text or instruction is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let prompt = "";

    switch (mode) {
      case "autocomplete":
        prompt = `Continue this academic text naturally with 1-2 sentences. Only output the continuation, nothing else:\n\n${currentText}`;
        break;
      case "expand":
        prompt = `Expand on the following academic text with 2-4 detailed paragraphs. Maintain the same academic tone and style. Only output the expansion:\n\n${currentText}`;
        break;
      case "paragraph":
        prompt = `Write one complete academic paragraph that naturally follows from this text. Only output the new paragraph:\n\n${currentText}`;
        break;
      case "instruction":
        prompt = `Given this academic text:\n\n${currentText}\n\nFollow this instruction: ${instruction}\n\nOnly output the result, no meta-commentary.`;
        break;
      default:
        prompt = `Continue this text naturally:\n\n${currentText}`;
    }

    const contents = [];

    if (context) {
      contents.push({
        role: "user" as const,
        parts: [{ text: `Document context for reference:\n${context}` }],
      });
      contents.push({
        role: "model" as const,
        parts: [{ text: "I understand the document context. I'll use it to inform my writing style and content." }],
      });
    }

    contents.push({
      role: "user" as const,
      parts: [{ text: prompt }],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents,
            config: {
              maxOutputTokens: 8192,
              temperature: 0.7,
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            },
          });

          for await (const chunk of response) {
            const text = chunk.text || "";
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
              );
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "AI generation failed";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
