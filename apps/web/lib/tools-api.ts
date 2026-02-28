// Unified Tools API Layer for shothik-platfrom1
// Connects frontend tools to backend services

import { executeWithGateway } from "@/lib/ai-gateway";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Grammar Checker API
export const grammarCheck = async (text: string, language: string = "en") => {
  return executeWithGateway(async () => {
    const response = await fetch(`${API_BASE}/api/tools/grammar/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });
    return response.json();
  });
};

// Paraphrase API - Connects to standalone service
export const paraphraseText = async ({
  text,
  mode = "standard",
  level = "intermediate",
  language = "en",
}: {
  text: string;
  mode?: string;
  level?: string;
  language?: string;
}) => {
  const response = await fetch(`${API_BASE}/api/tools/paraphrase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, level, language }),
  });
  return response.json();
};

// AI Detector API - Uses ONNX backend
export const detectAI = async (text: string) => {
  const response = await fetch(`${API_BASE}/api/tools/ai-detector`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return response.json();
};

// File upload for AI Detector
export const detectAIFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE}/api/tools/ai-detector/file`, {
    method: "POST",
    body: formData,
  });
  return response.json();
};

// ============================================
// PHASE 2: Language Tools
// ============================================

// Translator API
export const translateText = async ({
  text,
  sourceLang,
  targetLang,
}: {
  text: string;
  sourceLang: string;
  targetLang: string;
}) => {
  const response = await fetch(`${API_BASE}/api/tools/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });
  return response.json();
};

// Humanize GPT API
export const humanizeText = async ({
  text,
  mode = "natural",
  intensity = 50,
}: {
  text: string;
  mode?: string;
  intensity?: number;
}) => {
  const response = await fetch(`${API_BASE}/api/tools/humanize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, intensity }),
  });
  return response.json();
};

// Summarizer API
export const summarizeText = async ({
  text,
  type = "paragraph",
  length = 30,
}: {
  text: string;
  type?: string;
  length?: number;
}) => {
  const response = await fetch(`${API_BASE}/api/tools/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, type, length }),
  });
  return response.json();
};
