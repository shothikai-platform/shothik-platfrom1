"use client";

import { useState, useCallback } from "react";
import {
  BookOpen,
  Sparkles,
  XCircle,
  Globe,
  Tag,
  Layers,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "ur", label: "Urdu (اردو)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "ar", label: "Arabic (العربية)" },
  { code: "es", label: "Spanish (Español)" },
  { code: "fr", label: "French (Français)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "pt", label: "Portuguese (Português)" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "zh", label: "Chinese (中文)" },
];

const CATEGORIES = [
  { value: "fiction_literary", label: "Fiction > Literary" },
  { value: "fiction_scifi", label: "Fiction > Science Fiction" },
  { value: "fiction_fantasy", label: "Fiction > Fantasy" },
  { value: "fiction_romance", label: "Fiction > Romance" },
  { value: "fiction_thriller", label: "Fiction > Thriller & Suspense" },
  { value: "fiction_mystery", label: "Fiction > Mystery & Detective" },
  { value: "fiction_horror", label: "Fiction > Horror" },
  { value: "fiction_historical", label: "Fiction > Historical" },
  { value: "nonfiction_science", label: "Non-Fiction > Science & Technology" },
  { value: "nonfiction_business", label: "Non-Fiction > Business & Economics" },
  { value: "nonfiction_selfhelp", label: "Non-Fiction > Self-Help & Personal Development" },
  { value: "nonfiction_biography", label: "Non-Fiction > Biography & Memoir" },
  { value: "nonfiction_history", label: "Non-Fiction > History" },
  { value: "nonfiction_education", label: "Non-Fiction > Education & Reference" },
  { value: "nonfiction_health", label: "Non-Fiction > Health & Wellness" },
  { value: "academic_stem", label: "Academic > STEM" },
  { value: "academic_engineering", label: "Academic > Engineering" },
  { value: "academic_medicine", label: "Academic > Medicine & Health Sciences" },
  { value: "academic_social", label: "Academic > Social Sciences" },
  { value: "academic_humanities", label: "Academic > Humanities" },
  { value: "academic_computer", label: "Academic > Computer Science" },
  { value: "academic_math", label: "Academic > Mathematics" },
  { value: "poetry", label: "Poetry" },
  { value: "children", label: "Children's Books" },
  { value: "young_adult", label: "Young Adult" },
  { value: "comics", label: "Comics & Graphic Novels" },
];

const INPUT_CLASS = "w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#137fec] focus:border-transparent outline-none transition-all";

export function MetadataForm({ formData, updateFormData }) {
  const [keywordInput, setKeywordInput] = useState("");

  const addKeyword = useCallback(() => {
    const kw = keywordInput.trim();
    if (kw && !formData.keywords.includes(kw) && formData.keywords.length < 7) {
      updateFormData({ keywords: [...formData.keywords, kw] });
      setKeywordInput("");
    }
  }, [keywordInput, formData.keywords, updateFormData]);

  const removeKeyword = useCallback(
    (kw) => {
      updateFormData({ keywords: formData.keywords.filter((k) => k !== kw) });
    },
    [formData.keywords, updateFormData]
  );

  const handleKeywordKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addKeyword();
      }
    },
    [addKeyword]
  );

  const descLength = formData.description?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Book Details
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Add details that help readers discover your book. Good metadata means more visibility.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-[#137fec]" />
            <h3 className="font-bold text-sm">Title & Subtitle</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Book Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="Enter your book title"
              maxLength={200}
              className={INPUT_CLASS}
              aria-label="Book title"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">3-200 characters</span>
              <span className={cn("text-[10px]", formData.title.length < 3 ? "text-red-400" : "text-slate-400")}>
                {formData.title.length}/200
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Subtitle <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => updateFormData({ subtitle: e.target.value })}
              placeholder="A catchy subtitle to complement your title"
              maxLength={300}
              className={INPUT_CLASS}
              aria-label="Book subtitle"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#137fec]" />
              <h3 className="font-bold text-sm">Description</h3>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#137fec]/10 text-[#137fec] text-xs font-bold hover:bg-[#137fec]/20 transition-all"
              aria-label="Generate description with AI"
            >
              <Sparkles className="h-3 w-3" /> AI Assist
            </button>
          </div>
          <div className="relative">
            <textarea
              rows={6}
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Write a compelling description that will make readers want to buy your book. Include the main themes, key characters, and what makes your book unique..."
              maxLength={4000}
              className={cn(INPUT_CLASS, "resize-none")}
              aria-label="Book description"
            />
            <div className="flex justify-between mt-1">
              <span className={cn("text-[10px]", descLength < 50 ? "text-red-400" : "text-slate-400")}>
                {descLength < 50 ? `${50 - descLength} more characters needed` : ""}
              </span>
              <span className={cn("text-[10px]", descLength > 3800 ? "text-amber-400" : "text-slate-400")}>
                {descLength}/4000
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#137fec]" />
            <h3 className="font-bold text-sm">Language</h3>
          </div>
          <select
            value={formData.language}
            onChange={(e) => updateFormData({ language: e.target.value })}
            className={INPUT_CLASS}
            aria-label="Book language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#137fec]" />
            <h3 className="font-bold text-sm">Category</h3>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Primary Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateFormData({ category: e.target.value })}
              className={INPUT_CLASS}
              aria-label="Primary category"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Secondary Category <span className="text-slate-400">(Optional)</span>
            </label>
            <select
              value={formData.subcategory}
              onChange={(e) => updateFormData({ subcategory: e.target.value })}
              className={INPUT_CLASS}
              aria-label="Secondary category"
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#137fec]" />
              <h3 className="font-bold text-sm">Keywords</h3>
            </div>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              formData.keywords.length >= 3
                ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600"
                : "bg-red-100 dark:bg-red-900/20 text-red-500"
            )}>
              {formData.keywords.length}/7
            </span>
          </div>

          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[50px] items-center">
            {formData.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#137fec]/15 text-[#137fec] text-xs font-bold"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(kw)}
                  className="hover:text-red-500 transition-colors"
                  aria-label={`Remove keyword ${kw}`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {formData.keywords.length < 7 && (
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                onBlur={addKeyword}
                placeholder={formData.keywords.length === 0 ? "Type a keyword and press Enter..." : "Add more..."}
                className="flex-grow bg-transparent border-none text-xs outline-none focus:ring-0 px-1 text-slate-600 dark:text-slate-400 min-w-[100px] placeholder:text-slate-400"
                aria-label="Add keyword"
              />
            )}
          </div>
          <div className="flex items-start gap-2 text-[10px] text-slate-400">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>Add 3-7 keywords to help readers find your book. Press Enter or comma to add.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
