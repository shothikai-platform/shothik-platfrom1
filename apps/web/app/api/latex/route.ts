import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { htmlToLatex } from "@/lib/writing-studio/htmlToLatex";
import { LATEX_TEMPLATES, DEFAULT_TEMPLATE } from "@/lib/writing-studio/templates";
import { createBuild, updateBuild } from "@/lib/writing-studio/buildStore";
import { compilePdf } from "@/lib/writing-studio/pdfCompiler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, templateId, styles, buildId: existingBuildId, isRawTex } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const buildId = existingBuildId || crypto.randomUUID();

    createBuild(buildId, content, { ...styles, isRawTex });

    (async () => {
      try {
        updateBuild(buildId, { status: "processing" });

        let latexContent: string;
        if (isRawTex) {
          latexContent = content;
        } else {
          const latexBody = htmlToLatex(content, styles);
          const template = LATEX_TEMPLATES[templateId] || DEFAULT_TEMPLATE;
          latexContent = template
            .replace("{{TITLE}}", styles?.title || "Untitled Document")
            .replace("{{AUTHOR}}", styles?.author || "")
            .replace("{{ABSTRACT}}", styles?.abstract || "")
            .replace("{{CONTENT}}", latexBody);
        }

        const { pdfUrl } = await compilePdf(buildId, latexContent);
        updateBuild(buildId, { status: "completed", pdfUrl });
      } catch (err: any) {
        updateBuild(buildId, { status: "failed", error: err.message });
      }
    })();

    return NextResponse.json({ buildId, status: "queued" });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
