// Summarizer Tool Page
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { FileText, Loader2, Copy, Check, List, AlignLeft } from "lucide-react";

const summaryTypes = [
  { id: "paragraph", label: "Paragraph", description: "Concise summary paragraph" },
  { id: "bullet", label: "Bullet Points", description: "Key points as bullets" },
  { id: "detailed", label: "Detailed", description: "Comprehensive summary" },
];

export default function SummarizerPage() {
  const [text, setText] = useState("");
  const [type, setType] = useState("paragraph");
  const [length, setLength] = useState([30]); // percentage of original
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    keyPoints: string[];
    originalLength: number;
    summaryLength: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/tools/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          type,
          length: length[0],
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Summarization failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reductionPercentage = result
    ? Math.round((1 - result.summaryLength / result.originalLength) * 100)
    : 0;

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-blue-500" />
          Summarizer
        </h1>
        <p className="text-muted-foreground mt-2">
          Condense long texts into concise summaries
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your long text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[300px]"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{text.split(/\s+/).filter(Boolean).length} words</span>
              <span>{text.length} characters</span>
            </div>

            {/* Summary Type */}
            <div className="grid grid-cols-3 gap-2">
              {summaryTypes.map((t) => (
                <Button
                  key={t.id}
                  variant={type === t.id ? "default" : "outline"}
                  className="h-auto py-3 flex flex-col items-center"
                  onClick={() => setType(t.id)}
                >
                  {t.id === "paragraph" && <AlignLeft className="h-4 w-4 mb-1" />}
                  {t.id === "bullet" && <List className="h-4 w-4 mb-1" />}
                  {t.id === "detailed" && <FileText className="h-4 w-4 mb-1" />}
                  <span className="text-xs">{t.label}</span>
                </Button>
              ))}
            </div>

            {/* Length Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Summary Length</span>
                <span className="text-sm font-medium">{length[0]}% of original</span>
              </div>
              <Slider value={length} onValueChange={setLength} max={100} step={5} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Brief</span>
                <span>Detailed</span>
              </div>
            </div>

            <Button
              onClick={handleSummarize}
              disabled={!text.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Summarize
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Summary</span>
              {result && (
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="secondary">{type}</Badge>
                  <Badge variant="outline">{reductionPercentage}% shorter</Badge>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{result.summary}</p>
                </div>

                {result.keyPoints?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Points</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.keyPoints.map((point, i) => (
                        <li key={i} className="text-sm">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-sm text-muted-foreground pt-2 border-t">
                  Original: {result.originalLength} chars → Summary: {result.summaryLength} chars
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Summary will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
