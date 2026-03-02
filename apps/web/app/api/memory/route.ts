import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Cognee API configuration
const COGNEE_API_URL = process.env.COGNEE_API_URL || "http://localhost:8000";
const COGNEE_API_KEY = process.env.COGNEE_API_KEY || "";

/**
 * Add data to Cognee memory
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, type = "conversation", metadata = {} } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Add to Cognee
    const response = await fetch(`${COGNEE_API_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COGNEE_API_KEY}`,
      },
      body: JSON.stringify({
        text,
        user_id: userId,
        type,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Cognee error: ${response.status}`);
    }

    const result = await response.json();

    // Also store in Convex for redundancy
    await convex.mutation(api.memory.addMemory, {
      userId: userId as any,
      text,
      type,
      metadata,
      cogneeId: result.id,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Memory added successfully",
    });

  } catch (error) {
    console.error("Cognee add error:", error);
    return NextResponse.json(
      { error: "Failed to add memory" },
      { status: 500 }
    );
  }
}

/**
 * Search Cognee memory
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Search Cognee
    const response = await fetch(`${COGNEE_API_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COGNEE_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        user_id: userId,
        limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cognee error: ${response.status}`);
    }

    const results = await response.json();

    return NextResponse.json({
      success: true,
      query,
      results: results.results || [],
      relationships: results.relationships || [],
    });

  } catch (error) {
    console.error("Cognee search error:", error);
    return NextResponse.json(
      { error: "Failed to search memory" },
      { status: 500 }
    );
  }
}

/**
 * Build knowledge graph (cognify)
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trigger Cognee cognify
    const response = await fetch(`${COGNEE_API_URL}/cognify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COGNEE_API_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cognee error: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Knowledge graph built successfully",
      nodes: result.nodes || 0,
      edges: result.edges || 0,
    });

  } catch (error) {
    console.error("Cognee cognify error:", error);
    return NextResponse.json(
      { error: "Failed to build knowledge graph" },
      { status: 500 }
    );
  }
}
