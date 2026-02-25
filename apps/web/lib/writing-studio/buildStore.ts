import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

export interface BuildRecord {
  buildId: string;
  status: "queued" | "processing" | "completed" | "failed";
  content?: string;
  pdfUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

const STORE_DIR = "/tmp/writing-studio-builds";

function ensureDir() {
  if (!existsSync(STORE_DIR)) {
    mkdirSync(STORE_DIR, { recursive: true });
  }
}

function buildPath(buildId: string): string {
  return path.join(STORE_DIR, `${buildId}.json`);
}

export function createBuild(buildId: string, content: string, metadata?: Record<string, any>): BuildRecord {
  ensureDir();
  const record: BuildRecord = {
    buildId,
    status: "queued",
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  };
  writeFileSync(buildPath(buildId), JSON.stringify(record), "utf-8");
  return record;
}

export function getBuild(buildId: string): BuildRecord | undefined {
  const fp = buildPath(buildId);
  if (!existsSync(fp)) return undefined;
  try {
    return JSON.parse(readFileSync(fp, "utf-8"));
  } catch {
    return undefined;
  }
}

export function updateBuild(buildId: string, updates: Partial<BuildRecord>): BuildRecord | undefined {
  const existing = getBuild(buildId);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  writeFileSync(buildPath(buildId), JSON.stringify(updated), "utf-8");
  return updated;
}
