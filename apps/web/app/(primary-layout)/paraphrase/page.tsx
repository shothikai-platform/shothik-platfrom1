// Paraphrase Tool Page - Streamlined for shothik-platfrom1
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2, Copy, Check } from "lucide-react";
import { paraphraseText } from "@/lib/tools-api";

const modes = [
  { id: "standard", label: "Standard", desc: "Natural rephrasing" },
  { id: "fluency", label: "Fluency", desc: "More fluent" },
  { id: "academic", label: "Academic", desc: "Formal tone" },
  { id: "creative", label: "Creative", desc: "Unique style" },
];

const levels = [
  { id: "basic", label: "Basic" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "expert", label: "Expert" },
];

export default function ParaphrasePage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("standard");
  const [level, setLevel] = useState("intermediate");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleParaphrase = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const response = await paraphraseText({ text, mode, level });
      if (response.paraphrases) setResults(response.paraphrases);
    } catch (error) {
      console.error("Paraphrase failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-6">Paraphrase Tool</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter text to paraphrase..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px]"
            />

            <div className="flex gap-2 flex-wrap">
              {modes.map((m) => (
                <Button
                  key={m.id}
                  variant={mode === m.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode(m.id)}
                >
                  {m.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              {levels.map((l) => (
                <Button
                  key={l.id}
                  variant={level === l.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setLevel(l.id)}
                >
                  {l.label}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleParaphrase}
              disabled={!text.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Paraphrase
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.length === 0 && (
              <p className="text-muted-foreground">Paraphrased text will appear here</p>
            )}

            {results.map((result, index) => (
              <div key={index} className="border p-4 rounded-lg relative group">
                <Badge className="mb-2">Version {index + 1}</Badge>
                <p>{result}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  onClick={() => copyToClipboard(result, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
