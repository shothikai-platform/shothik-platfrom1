// AI Detector Page
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Scan, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { detectAI } from "@/lib/tools-api";

export default function AIDetectorPage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDetect = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const response = await detectAI(text);
      if (response.success) setResult(response);
    } catch (error) {
      console.error("AI detection failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-6">AI Detector</h1>

      <Card>
        <CardHeader>
          <CardTitle>Enter Text to Analyze</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px]"
          />

          <Button
            onClick={handleDetect}
            disabled={!text.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Detect AI Content"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.isAI ? (
                <>
                  <AlertCircle className="text-red-500" />
                  <span>AI Detected</span>
                </>
              ) : (
                <>
                  <CheckCircle className="text-green-500" />
                  <span>Human-Written</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-2">
              <span>Confidence</span>
              <span>{result.confidence?.toFixed(1)}%</span>
            </div>
            <Progress value={result.confidence} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
