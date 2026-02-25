"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  extractFileContent,
  formatFileSize,
  getFileType,
  validateFile,
  ACCEPTED_FILE_TYPES,
  type FileExtractionError,
  type FileExtractionResult,
} from "@/utils/fileExtractor";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface FileDropzoneProps {
  onExtracted: (text: string, result: FileExtractionResult) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

type DropzoneState = "idle" | "dragging" | "processing" | "error" | "success";

const FileDropzone = ({
  onExtracted,
  disabled = false,
  className,
  compact = false,
}: FileDropzoneProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [state, setState] = useState<DropzoneState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [extractionResult, setExtractionResult] =
    useState<FileExtractionResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      setErrorMessage("");
      const validationError = validateFile(file);
      if (validationError) {
        setState("error");
        setErrorMessage(validationError.message);
        return;
      }

      setState("processing");

      try {
        const result = await extractFileContent(file);
        setExtractionResult(result);
        setState("success");
        onExtracted(result.text, result);
      } catch (err) {
        const error = err as FileExtractionError;
        setState("error");
        setErrorMessage(error.message || "Failed to extract text from the file.");
      }
    },
    [disabled, onExtracted]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setState("dragging");
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setState((prev) => (prev === "dragging" ? "idle" : prev));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;

      if (disabled) {
        setState("idle");
        return;
      }

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      } else {
        setState("idle");
      }
    },
    [disabled, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  const handleClear = useCallback(() => {
    setState("idle");
    setExtractionResult(null);
    setErrorMessage("");
  }, []);

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.2 },
      };

  if (compact) {
    return (
      <label
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "border-border hover:border-primary/50 hover:bg-primary/5",
          disabled && "pointer-events-none opacity-50",
          state === "processing" && "pointer-events-none",
          className
        )}
      >
        {state === "processing" ? (
          <Loader2 className="size-4 animate-spin text-primary" />
        ) : (
          <Upload className="text-muted-foreground size-4" />
        )}
        <span className="text-muted-foreground">
          {state === "processing" ? "Extracting..." : "Upload file"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleInputChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={disabled || state === "processing"}
          aria-label="Upload document file"
        />
      </label>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait">
        {state === "success" && extractionResult ? (
          <motion.div
            key="success"
            {...animationProps}
            className="flex items-center gap-3 rounded-xl bg-emerald-500/5 p-4"
          >
            <span className="shrink-0 rounded-full bg-emerald-500/10 p-2">
              <FileText
                className="size-5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {extractionResult.fileName}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(extractionResult.fileSize)}
                {" · "}
                {extractionResult.wordCount.toLocaleString()} words
                {extractionResult.pageCount
                  ? ` · ${extractionResult.pageCount} pages`
                  : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={handleClear}
              aria-label="Remove uploaded file"
            >
              <X className="size-4" />
            </Button>
          </motion.div>
        ) : state === "error" ? (
          <motion.div
            key="error"
            {...animationProps}
            className="flex items-center gap-3 rounded-xl bg-destructive/5 p-4"
            role="alert"
          >
            <span className="shrink-0 rounded-full bg-destructive/10 p-2">
              <AlertTriangle
                className="text-destructive size-5"
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-destructive text-sm font-medium">
                Upload failed
              </p>
              <p className="text-muted-foreground text-xs">{errorMessage}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={handleClear}
              aria-label="Dismiss error"
            >
              <X className="size-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            {...animationProps}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
              state === "dragging"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30",
              state === "processing" && "pointer-events-none opacity-70",
              disabled && "pointer-events-none opacity-50"
            )}
            role="button"
            tabIndex={0}
            aria-label="Drop a file here or click to upload"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            {state === "processing" ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Extracting text...</p>
                <p className="text-muted-foreground text-xs">
                  This may take a moment for large files
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "rounded-full p-3 transition-colors",
                    state === "dragging"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Upload className="size-6" aria-hidden="true" />
                </span>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {state === "dragging"
                      ? "Drop your file here"
                      : "Drag & drop a file here"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    PDF, DOCX, TXT, or LaTeX — up to 10 MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  disabled={disabled}
                >
                  Browse files
                </Button>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleInputChange}
              className="hidden"
              disabled={disabled || state === "processing"}
              aria-label="Upload document file"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileDropzone;
