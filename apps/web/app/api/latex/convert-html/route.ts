import { NextRequest, NextResponse } from "next/server";
import { htmlToLatex } from "@/lib/writing-studio/htmlToLatex";

export async function POST(request: NextRequest) {
  try {
    const { html, styles } = await request.json();
    if (!html) {
      return NextResponse.json({ error: "HTML is required" }, { status: 400 });
    }
    const latex = htmlToLatex(html, styles);
    return NextResponse.json({ latex });
  } catch (error) {
    return NextResponse.json({ error: "Failed to convert HTML to LaTeX" }, { status: 500 });
  }
}
