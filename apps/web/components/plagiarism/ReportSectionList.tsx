import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlagiarismSection } from "@/types/plagiarism";
import { Copy } from "lucide-react";
import EmptyReportState from "./EmptyReportState";
import ReportSectionItem from "./ReportSectionItem";

interface ReportSectionListProps {
  sections: PlagiarismSection[];
  exactMatches?: PlagiarismSection[];
  loading: boolean;
  activeMatchId?: string | null;
  onSectionClick?: (matchId: string) => void;
}

const ReportSectionList = ({
  sections,
  exactMatches,
  loading,
  activeMatchId,
  onSectionClick,
}: ReportSectionListProps) => {
  if (
    loading &&
    sections.length === 0 &&
    (!exactMatches || exactMatches.length === 0)
  ) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const hasAnyMatches =
    sections.length > 0 || (exactMatches && exactMatches.length > 0);

  if (!hasAnyMatches) {
    return (
      <EmptyReportState
        title="No overlapping passages detected"
        description="Your content looks original. Keep writing confidently! If you've updated the text, run another scan to be sure."
      />
    );
  }

  let sectionIndex = 0;

  return (
    <div className="space-y-6">
      {/* Exact Matches Section */}
      {exactMatches && exactMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2">
            <Badge variant="destructive" className="flex items-center gap-1.5">
              <Copy className="size-3" />
              Exact Matches
            </Badge>
            <span className="text-muted-foreground text-sm">
              {exactMatches.length}{" "}
              {exactMatches.length === 1 ? "match" : "matches"}
            </span>
          </div>
          <Accordion type="single" collapsible className="space-y-3" value={activeMatchId?.startsWith('exact-') ? activeMatchId : undefined}>
            {exactMatches.map((section, idx) => {
              const currentIndex = sectionIndex++;
              const matchId = `exact-${idx}`;
              return (
                <ReportSectionItem
                  key={`exact-match-${idx}`}
                  section={section}
                  index={currentIndex}
                  isExactMatch={true}
                  matchId={matchId}
                  isActive={activeMatchId === matchId}
                  onMatchClick={onSectionClick}
                />
              );
            })}
          </Accordion>
        </div>
      )}

      {/* Paraphrased Sections */}
      {sections.length > 0 && (
        <div className="space-y-3">
          {exactMatches && exactMatches.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <Badge variant="outline" className="text-sm">
                Paraphrased Sections
              </Badge>
              <span className="text-muted-foreground text-sm">
                {sections.length}{" "}
                {sections.length === 1 ? "section" : "sections"}
              </span>
            </div>
          )}
          <Accordion type="single" collapsible className="space-y-3" value={activeMatchId?.startsWith('section-') ? activeMatchId : undefined}>
            {sections.map((section, idx) => {
              const currentIndex = sectionIndex++;
              const matchId = `section-${idx}`;
              return (
                <ReportSectionItem
                  key={`paraphrased-section-${idx}`}
                  section={section}
                  index={currentIndex}
                  isExactMatch={false}
                  matchId={matchId}
                  isActive={activeMatchId === matchId}
                  onMatchClick={onSectionClick}
                />
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default ReportSectionList;
