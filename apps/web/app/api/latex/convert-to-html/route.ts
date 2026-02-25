import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { latex } = await request.json();
    if (!latex) {
      return NextResponse.json({ error: "LaTeX is required" }, { status: 400 });
    }
    const html = `<div class="latex-content"><pre>${latex}</pre></div>`;
    return NextResponse.json({ html, orientation: "portrait" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to convert LaTeX to HTML" }, { status: 500 });
  }
}
