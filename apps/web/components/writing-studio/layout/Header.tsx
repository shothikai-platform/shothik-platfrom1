'use client';

import { useState } from 'react';
import { 
  BookOpen, 
  Cloud, 
  Share2, 
  Upload,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onTitleChange?: (title: string) => void;
  wordCount: number;
  targetWords: number;
  isSaving?: boolean;
  userAvatar?: string;
}

export function Header({
  title,
  onTitleChange,
  wordCount,
  targetWords,
  isSaving = false,
  userAvatar
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  
  const progress = Math.min(100, Math.round((wordCount / targetWords) * 100));

  const handleTitleSubmit = () => {
    if (editTitle.trim() && onTitleChange) {
      onTitleChange(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-white dark:bg-[#0d1117] z-30 relative">
      {/* Left: Title & Save Status */}
      <div className="flex items-center gap-3 w-1/3">
        <BookOpen className="w-5 h-5 text-[#137fec]" />
        
        <div className="flex flex-col">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setEditTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-transparent border-none focus:ring-0 font-semibold text-sm w-48 p-0 text-slate-900 dark:text-slate-100"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-[#137fec] transition-colors text-left"
            >
              {title || 'Untitled Project'}
            </button>
          )}
          
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Cloud className={cn(
              "w-3 h-3",
              isSaving && "animate-pulse"
            )} />
            <span>{isSaving ? 'Saving...' : 'Saved to cloud'}</span>
          </div>
        </div>
      </div>

      {/* Center: Progress Bar */}
      <div className="flex flex-col items-center w-1/3 px-8">
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="bg-[#137fec] h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] mt-1 uppercase tracking-widest text-slate-400 font-medium">
          Progress: {progress}% ({wordCount.toLocaleString()} / {targetWords.toLocaleString()} words)
        </span>
      </div>

      {/* Right: Actions & Avatar */}
      <div className="flex items-center justify-end gap-3 w-1/3">
        <button className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </button>
        
        <button className="px-4 py-1.5 text-xs font-semibold bg-[#137fec] text-white hover:bg-[#137fec]/90 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-[#137fec]/20">
          <Upload className="w-4 h-4" />
          Publish
        </button>
        
        <div className="h-8 w-8 rounded-full overflow-hidden ml-2 border-2 border-[#137fec]/20">
          {userAvatar ? (
            <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-500">U</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
