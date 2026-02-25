"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileType,
  HardDrive,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ACCEPTED_FORMATS = {
  "application/epub+zip": ".epub",
  "application/pdf": ".pdf",
};

const ACCEPTED_EXTENSIONS = [".epub", ".pdf"];
const MAX_FILE_SIZE = 300 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

export function ManuscriptUpload({ formData, updateFormData, onManuscriptUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    const ext = getFileExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return "Only ePub (.epub) and PDF (.pdf) files are accepted.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds the 300MB limit. Your file is ${formatFileSize(file.size)}.`;
    }
    return null;
  }, []);

  const processFile = useCallback(
    async (file) => {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }

      setUploadError("");
      setIsUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 300);

      try {
        if (onManuscriptUpload) {
          await onManuscriptUpload(file);
        } else {
          const ext = getFileExtension(file.name);
          updateFormData({
            manuscript: file,
            manuscriptName: file.name,
            manuscriptSize: file.size,
            manuscriptFormat: ext.replace(".", "").toUpperCase(),
          });
        }
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (err) {
        clearInterval(progressInterval);
        setUploadError(err.message || "Upload failed. Please try again.");
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [validateFile, updateFormData, onManuscriptUpload]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const removeFile = useCallback(() => {
    updateFormData({
      manuscript: null,
      manuscriptName: "",
      manuscriptSize: 0,
      manuscriptFormat: "",
    });
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [updateFormData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Upload Your Manuscript
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Upload your completed book manuscript. We accept ePub and PDF formats.
        </p>
      </div>

      {!formData.manuscript ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
            isDragging
              ? "border-[#137fec] bg-[#137fec]/5 scale-[1.01]"
              : "border-slate-300 dark:border-slate-700 hover:border-[#137fec]/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
          )}
          role="button"
          aria-label="Upload manuscript file"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="size-16 bg-[#137fec]/10 text-[#137fec] rounded-full flex items-center justify-center mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Upload className="h-8 w-8" />
                </motion.div>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Processing your manuscript...
              </p>
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-[#137fec] h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {Math.round(uploadProgress)}% complete
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="size-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
                Drop your manuscript here
              </p>
              <p className="text-sm text-slate-500 mb-4">
                or click to browse your files
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <FileType className="h-3.5 w-3.5" />
                  ePub, PDF
                </span>
                <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" />
                  Max 300MB
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/50 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="size-14 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {formData.manuscriptName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">
                      {formatFileSize(formData.manuscriptSize)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#137fec]/10 text-[#137fec] font-bold">
                      {formData.manuscriptFormat}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ready
                    </span>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl"
        >
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Upload Error</p>
            <p className="text-sm text-red-600 dark:text-red-300">{uploadError}</p>
          </div>
        </motion.div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#137fec]" />
          Manuscript Guidelines
        </h3>
        <ul className="space-y-2 text-xs text-slate-500">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            ePub format recommended for best reader experience
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            PDF accepted but may have limited formatting on mobile devices
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            Minimum 5,000 words required for publication
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            Ensure your work is original and does not contain plagiarized content
          </li>
        </ul>
      </div>
    </div>
  );
}
