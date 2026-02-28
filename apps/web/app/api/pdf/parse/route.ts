import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";
import { promisify } from "util";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const execAsync = promisify(exec);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Upload and parse PDF
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const agent = formData.get("agent") as string; // 'research' | 'slide' | 'sheet'
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Create temp directory
    const uploadId = uuidv4();
    const tempDir = join("/tmp", "pdf-uploads", uploadId);
    await mkdir(tempDir, { recursive: true });

    const inputPath = join(tempDir, "input.pdf");
    const outputDir = join(tempDir, "output");
    await mkdir(outputDir, { recursive: true });

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(bytes));

    // Parse with OpenDataloader
    console.log(`Parsing PDF: ${file.name} (${file.size} bytes)`);
    const startTime = Date.now();

    try {
      // Run OpenDataloader CLI
      await execAsync(
        `npx @opendataloader/pdf convert "${inputPath}" --output-dir "${outputDir}" --format markdown,json`,
        { timeout: 60000 }
      );
    } catch (error) {
      console.error("OpenDataloader error:", error);
      return NextResponse.json(
        { error: "Failed to parse PDF" },
        { status: 500 }
      );
    }

    const parseTime = Date.now() - startTime;
    console.log(`Parsed in ${parseTime}ms`);

    // Read output files
    const markdownPath = join(outputDir, "input.md");
    const jsonPath = join(outputDir, "input.json");

    let markdown = "";
    let structured: any = null;

    try {
      const { readFile } = await import("fs/promises");
      markdown = await readFile(markdownPath, "utf-8");
      const jsonContent = await readFile(jsonPath, "utf-8");
      structured = JSON.parse(jsonContent);
    } catch (error) {
      console.error("Reading output error:", error);
    }

    // Extract metadata
    const metadata = {
      title: structured?.metadata?.title || file.name.replace(".pdf", ""),
      author: structured?.metadata?.author || null,
      pages: structured?.pages?.length || 0,
      wordCount: markdown.split(/\s+/).length,
      parseTime,
    };

    // Store in database
    const documentId = await convex.mutation(api.documents.storeParsedDocument, {
      userId,
      originalName: file.name,
      metadata,
      markdown,
      structured,
      agent,
    });

    // Process based on agent type
    let processedResult: any = null;

    switch (agent) {
      case "research":
        processedResult = await processForResearch(documentId, markdown, metadata);
        break;
      case "slide":
        processedResult = await processForSlides(documentId, markdown, metadata);
        break;
      case "sheet":
        processedResult = await processForSheets(documentId, structured, metadata);
        break;
    }

    return NextResponse.json({
      success: true,
      documentId,
      metadata,
      processedResult,
      preview: markdown.slice(0, 2000), // First 2000 chars for preview
    });

  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}

// Process PDF for Research Agent
async function processForResearch(
  documentId: string,
  markdown: string,
  metadata: any
) {
  // Extract key sections
  const sections = extractSections(markdown);
  
  // Generate research summary
  const summary = {
    title: metadata.title,
    sections: sections.slice(0, 10), // Top 10 sections
    keyPoints: extractKeyPoints(markdown),
    citations: extractCitations(markdown),
  };

  return {
    type: "research",
    summary,
    documentId,
  };
}

// Process PDF for Slide Generation
async function processForSlides(
  documentId: string,
  markdown: string,
  metadata: any
) {
  // Extract slide-worthy content
  const slides = extractSlideContent(markdown);
  
  // Generate slide outline
  const outline = {
    title: metadata.title,
    totalSlides: Math.min(slides.length, 20),
    slides: slides.slice(0, 20).map((slide, index) => ({
      index,
      title: slide.title,
      bulletPoints: slide.bullets.slice(0, 5),
      hasImage: slide.hasImage,
    })),
  };

  return {
    type: "slides",
    outline,
    documentId,
  };
}

// Process PDF for Sheet Generation
async function processForSheets(
  documentId: string,
  structured: any,
  metadata: any
) {
  // Extract tables from structured data
  const tables = extractTables(structured);
  
  // Generate sheet data
  const sheetData = {
    title: metadata.title,
    tables: tables.map((table: any, index: number) => ({
      index,
      name: table.name || `Table ${index + 1}`,
      rows: table.rows,
      columns: table.columns,
      headers: table.headers,
      sampleData: table.data.slice(0, 5),
    })),
    stats: {
      totalTables: tables.length,
      totalRows: tables.reduce((sum: number, t: any) => sum + t.rows, 0),
    },
  };

  return {
    type: "sheet",
    sheetData,
    documentId,
  };
}

// Helper: Extract sections from markdown
function extractSections(markdown: string) {
  const sections = [];
  const lines = markdown.split("\n");
  let currentSection: any = null;

  for (const line of lines) {
    // H1 or H2 heading
    if (line.startsWith("# ") || line.startsWith("## ")) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace(/^#+ /, ""),
        level: line.startsWith("# ") ? 1 : 2,
        content: [],
      };
    } else if (currentSection && line.trim()) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.map((s) => ({
    title: s.title,
    preview: s.content.slice(0, 3).join(" ").slice(0, 200),
  }));
}

// Helper: Extract key points
function extractKeyPoints(markdown: string): string[] {
  const points = [];
  
  // Find bullet points and key sentences
  const lines = markdown.split("\n");
  for (const line of lines) {
    // Bullet points
    if (line.match(/^[*\-•]\s+(.{20,100})$/)) {
      points.push(line.replace(/^[*\-•]\s+/, ""));
    }
    // Numbered lists
    else if (line.match(/^\d+\.\s+(.{20,100})$/)) {
      points.push(line.replace(/^\d+\.\s+/, ""));
    }
    
    if (points.length >= 10) break;
  }

  return points.slice(0, 10);
}

// Helper: Extract citations
function extractCitations(markdown: string): string[] {
  const citations = [];
  const citationRegex = /\[\d+\]|\(\w+\s+et\s+al\.?\s*,?\s*\d{4}\)|\(\w+\s*,?\s*\d{4}\)/g;
  const matches = markdown.match(citationRegex) || [];
  
  for (const match of matches.slice(0, 20)) {
    if (!citations.includes(match)) {
      citations.push(match);
    }
  }

  return citations;
}

// Helper: Extract slide content
function extractSlideContent(markdown: string) {
  const slides = [];
  const sections = markdown.split(/\n#{1,2}\s+/);

  for (const section of sections.slice(1)) {
    const lines = section.split("\n");
    const title = lines[0].trim();
    const content = lines.slice(1).join("\n");

    // Extract bullet points
    const bullets = content
      .split("\n")
      .filter((line) => line.match(/^[*\-•]\s+/))
      .map((line) => line.replace(/^[*\-•]\s+/, "").trim())
      .filter((line) => line.length > 10 && line.length < 200);

    if (title && bullets.length > 0) {
      slides.push({
        title,
        bullets: bullets.slice(0, 6),
        hasImage: content.toLowerCase().includes("figure") || 
                  content.toLowerCase().includes("image"),
      });
    }
  }

  return slides.slice(0, 25);
}

// Helper: Extract tables from structured data
function extractTables(structured: any) {
  const tables = [];

  if (!structured?.pages) return tables;

  for (const page of structured.pages) {
    for (const element of page.elements || []) {
      if (element.type === "table") {
        tables.push({
          name: element.name || `Table ${tables.length + 1}`,
          rows: element.rows || 0,
          columns: element.columns || 0,
          headers: element.headers || [],
          data: element.data || [],
          page: page.page_number,
        });
      }
    }
  }

  return tables;
}
