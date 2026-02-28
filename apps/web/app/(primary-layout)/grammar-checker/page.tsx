// Grammar Checker Page - Streamlined for shothik-platfrom1
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { grammarCheck } from "@/lib/tools-api";

export default function GrammarCheckerPage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const response = await grammarCheck(text, "en");
      if (response.data) setResult(response.data);
    } catch (error) {
      console.error("Grammar check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-6">Grammar Checker</h1>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter text to check..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[300px]"
            />
            <Button 
              onClick={handleCheck} 
              disabled={!text.trim() || isLoading}
              className="mt-4 w-full"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Check Grammar"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!result && <p className="text-muted-foreground">Results will appear here</p>}
            {result?.corrections?.map((c: any, i: number) => (
              <div key={i} className="border p-3 rounded mb-2">
                <Badge variant="destructive">{c.type}</Badge>
                <p className="line-through text-red-500">{c.original}</p>
                <p className="text-green-600">{c.suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
