"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CitationAnalysis } from "@/services/citationDetector";
import { BookOpen, Check, AlertTriangle, ExternalLink } from "lucide-react";

interface CitationAnalysisPanelProps {
  analysis: CitationAnalysis;
  className?: string;
}

const CitationCoverageRing = ({ percent }: { percent: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 80
      ? "text-emerald-500"
      : percent >= 50
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="5"
          className="stroke-muted/30"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", `stroke-current ${color}`)}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className={cn("absolute text-sm font-bold", color)}>
        {percent}%
      </span>
    </div>
  );
};

const CitedSourceCard = ({
  authors,
  year,
  text,
}: {
  authors?: string;
  year?: string;
  text: string;
}) => (
  <div className="flex items-start gap-2 rounded-lg bg-emerald-500/5 p-3">
    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        {authors && year ? `${authors} (${year})` : text}
      </p>
      {authors && year && (
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{text}</p>
      )}
    </div>
  </div>
);

const UncitedSourceCard = ({
  sourceTitle,
  sourceUrl,
  snippet,
  similarity,
}: {
  sourceTitle?: string;
  sourceUrl: string;
  snippet: string;
  similarity: number;
}) => (
  <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 p-3">
    <AlertTriangle
      className="mt-0.5 size-4 shrink-0 text-amber-500"
      aria-hidden="true"
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-sm font-medium text-amber-700 dark:text-amber-400">
          {sourceTitle || "Uncited source"}
        </p>
        <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-400">
          {similarity}%
        </span>
      </div>
      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{snippet}</p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
        >
          <ExternalLink className="size-3" aria-hidden="true" />
          View source
        </a>
      )}
    </div>
  </div>
);

const CitationAnalysisPanel = ({
  analysis,
  className,
}: CitationAnalysisPanelProps) => {
  const { citations, citedSources, uncitedSources, coveragePercent } = analysis;

  if (citations.length === 0 && uncitedSources.length === 0) return null;

  return (
    <Card className={cn("bg-card shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <span className="bg-primary/10 text-primary rounded-full p-2">
          <BookOpen className="size-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <CardTitle className="text-base">Citation Analysis</CardTitle>
          <p className="text-muted-foreground text-xs">
            {citations.length} citation{citations.length !== 1 ? "s" : ""} detected
          </p>
        </div>
        <CitationCoverageRing percent={coveragePercent} />
      </CardHeader>
      <CardContent className="space-y-4">
        {citedSources.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Properly cited ({citedSources.length})
            </h4>
            <div className="space-y-2">
              {citedSources.slice(0, 5).map((cs, i) => (
                <CitedSourceCard
                  key={i}
                  authors={cs.citation.authors}
                  year={cs.citation.year}
                  text={cs.citation.text}
                />
              ))}
              {citedSources.length > 5 && (
                <p className="text-muted-foreground text-xs">
                  +{citedSources.length - 5} more cited sources
                </p>
              )}
            </div>
          </div>
        )}

        {uncitedSources.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              Needs citation ({uncitedSources.length})
            </h4>
            <div className="space-y-2">
              {uncitedSources.slice(0, 5).map((us, i) => (
                <UncitedSourceCard
                  key={i}
                  sourceTitle={us.sourceTitle}
                  sourceUrl={us.sourceUrl}
                  snippet={us.snippet}
                  similarity={us.similarity}
                />
              ))}
              {uncitedSources.length > 5 && (
                <p className="text-muted-foreground text-xs">
                  +{uncitedSources.length - 5} more uncited sources
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CitationAnalysisPanel;
