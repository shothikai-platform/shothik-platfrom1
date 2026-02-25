'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Underline, 
  Quote,
  AlignLeft,
  History,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

// Inline AI Suggestion Component
interface AISuggestionProps {
  suggestion: string;
  onApply: () => void;
  onIgnore: () => void;
}

function InlineAISuggestion({ suggestion, onApply, onIgnore }: AISuggestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative group cursor-pointer bg-[#137fec]/5 border-l-2 border-[#137fec] p-4 rounded-r-lg my-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-[#137fec] uppercase flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Draft Suggestion
        </span>
        <div className="flex gap-2">
          <button
            onClick={onApply}
            className="text-[10px] bg-[#137fec] text-white px-2 py-0.5 rounded font-bold hover:bg-[#137fec]/90 transition-colors"
          >
            APPLY
          </button>
          <button
            onClick={onIgnore}
            className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            IGNORE
          </button>
        </div>
      </div>
      <p className="text-slate-400 italic text-sm">{suggestion}</p>
    </motion.div>
  );
}

interface CenterEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  chapterTitle?: string;
  suggestions?: AISuggestionProps[];
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRollbackClick?: () => void;
}

export function CenterEditor({
  content = '',
  onChange,
  chapterTitle = '1.1 Introduction',
  suggestions = [],
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onRollbackClick
}: CenterEditorProps) {
  const [showSuggestion, setShowSuggestion] = useState(true);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sample suggestion for demo
  const sampleSuggestion = "\"You shouldn't have come back,\" a voice rasped from the shadows, heavy with the weight of years spent in the dark corridors of the spire.";

  return (
    <section className="flex-1 flex flex-col bg-white dark:bg-slate-900/40 relative">
      {/* Toolbar */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 bg-white/80 dark:bg-[#101922]/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-4">
          {/* Formatting */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <ToolbarButton 
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive('bold')}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive('italic')}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

          {/* Citation */}
          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px] font-medium">
            <Quote className="w-4 h-4" />
            Citation
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Rollback Button */}
          <button
            onClick={onRollbackClick}
            className="px-2 py-1 text-[10px] font-bold flex items-center gap-1.5 bg-[#137fec]/10 text-[#137fec] hover:bg-[#137fec]/20 rounded-md transition-all border border-[#137fec]/20"
          >
            <History className="w-3.5 h-3.5" />
            ROLLBACK
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

          {/* Undo/Redo */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Undo">
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={onRedo} disabled={!canRedo} title="Redo">
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto py-16 px-8 min-h-[150%]">
          <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">
            {chapterTitle}
          </h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed text-slate-700 dark:text-slate-300 space-y-6">
            <EditorContent editor={editor} />

            {/* Inline AI Suggestion */}
            {showSuggestion && (
              <InlineAISuggestion
                suggestion={sampleSuggestion}
                onApply={() => {
                  editor?.chain().focus().insertContent(sampleSuggestion).run();
                  setShowSuggestion(false);
                }}
                onIgnore={() => setShowSuggestion(false)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolbarButton({ 
  children, 
  onClick, 
  isActive,
  disabled,
  title 
}: { 
  children: React.ReactNode; 
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        isActive
          ? "bg-white dark:bg-slate-700 text-[#137fec] shadow-sm"
          : disabled
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
      )}
    >
      {children}
    </button>
  );
}
