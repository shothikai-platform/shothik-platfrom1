// Writing Studio Bubble Menu - Tool Integration
// Adds quick access to Grammar, Paraphrase, AI Detector

"use client";

import { useState } from "react";
import { BubbleMenu } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import {
  CheckCircle,
  RefreshCw,
  Scan,
  Wand2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { grammarCheck, paraphraseText, detectAI } from "@/lib/tools-api";

interface StudioBubbleMenuProps {
  editor: Editor;
}

export function StudioBubbleMenu({ editor }: StudioBubbleMenuProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const getSelectedText = () => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to);
  };

  const handleGrammarCheck = async () => {
    const text = getSelectedText();
    if (!text) return;

    setIsProcessing(true);
    try {
      const result = await grammarCheck(text);
      if (result.data?.correctedText) {
        editor.commands.insertContent(result.data.correctedText);
      }
    } catch (error) {
      console.error("Grammar check failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParaphrase = async (mode: string = "standard") => {
    const text = getSelectedText();
    if (!text) return;

    setIsProcessing(true);
    try {
      const result = await paraphraseText({ text, mode });
      if (result.paraphrases?.[0]) {
        editor.commands.insertContent(result.paraphrases[0]);
      }
    } catch (error) {
      console.error("Paraphrase failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIDetection = async () => {
    const text = getSelectedText();
    if (!text) return;

    setIsProcessing(true);
    try {
      const result = await detectAI(text);
      // Show result in toast or panel
      alert(`AI Detection: ${result.isAI ? "AI-generated" : "Human-written"} (${result.confidence}% confidence)`);
    } catch (error) {
      console.error("AI detection failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 rounded-lg border bg-white p-1 shadow-lg dark:bg-gray-900"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGrammarCheck}
        disabled={isProcessing}
        className="h-8 gap-1"
      >
        <CheckCircle className="h-4 w-4 text-blue-500" />
        <span className="hidden sm:inline">Grammar</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isProcessing}
            className="h-8 gap-1"
          >
            <RefreshCw className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">Paraphrase</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleParaphrase("standard")}>
            Standard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleParaphrase("fluency")}>
            Fluency
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleParaphrase("academic")}>
            Academic
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleParaphrase("creative")}>
            Creative
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleAIDetection}
        disabled={isProcessing}
        className="h-8 gap-1"
      >
        <Scan className="h-4 w-4 text-purple-500" />
        <span className="hidden sm:inline">AI Detect</span>
      </Button>

      <div className="mx-1 h-4 w-px bg-gray-200" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Open full tool in modal or panel
          window.open(`/paraphrase?text=${encodeURIComponent(getSelectedText())}`, "_blank");
        }}
        className="h-8 gap-1"
      >
        <Wand2 className="h-4 w-4" />
        <span className="hidden sm:inline">More</span>
      </Button>
    </BubbleMenu>
  );
}
