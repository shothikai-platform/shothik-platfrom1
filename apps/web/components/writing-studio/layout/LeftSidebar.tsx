'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GripVertical, 
  Folder, 
  FolderOpen, 
  Plus,
  ChevronRight,
  ChevronDown,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chapter {
  id: string;
  title: string;
  status?: 'complete' | 'in-progress' | 'draft';
  sections: Section[];
  isOpen?: boolean;
}

interface Section {
  id: string;
  title: string;
  isActive?: boolean;
}

interface LeftSidebarProps {
  chapters?: Chapter[];
  activeSectionId?: string;
  onSectionClick?: (sectionId: string) => void;
  dailyGoal?: { current: number; target: number };
}

const DEFAULT_CHAPTERS: Chapter[] = [
  {
    id: 'ch1',
    title: 'Chapter 1: The Breach',
    status: 'in-progress',
    isOpen: true,
    sections: [
      { id: 's1-1', title: '1.1 Introduction', isActive: true },
      { id: 's1-2', title: '1.2 The Encounter' },
    ],
  },
  {
    id: 'ch2',
    title: 'Chapter 2: Echoes',
    status: 'draft',
    isOpen: false,
    sections: [
      { id: 's2-1', title: '2.1 Fragments' },
    ],
  },
];

export function LeftSidebar({
  chapters = DEFAULT_CHAPTERS,
  activeSectionId,
  onSectionClick,
  dailyGoal = { current: 850, target: 1000 }
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<'manuscript' | 'format'>('manuscript');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.filter(c => c.isOpen).map(c => c.id))
  );

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const goalProgress = Math.min(100, Math.round((dailyGoal.current / dailyGoal.target) * 100));

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-[#101922]/40">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-black/20">
        <button
          onClick={() => setActiveTab('manuscript')}
          className={cn(
            "px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors",
            activeTab === 'manuscript'
              ? "text-[#137fec] border-b-2 border-[#137fec]"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          Manuscript
        </button>
        <button
          onClick={() => setActiveTab('format')}
          className={cn(
            "px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors",
            activeTab === 'format'
              ? "text-[#137fec] border-b-2 border-[#137fec]"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          )}
        >
          Format
        </button>
      </div>

      {activeTab === 'manuscript' ? (
        <>
          {/* Structure Header */}
          <div className="p-3 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Structure
            </h3>
            <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors">
              <Plus className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Chapters List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="group">
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <GripVertical className="w-3 h-3 text-slate-400 cursor-grab opacity-0 group-hover:opacity-100" />
                  
                  {expandedChapters.has(chapter.id) ? (
                    <FolderOpen className="w-4 h-4 text-[#137fec]" />
                  ) : (
                    <Folder className="w-4 h-4 text-slate-400" />
                  )}
                  
                  <span className={cn(
                    "text-xs font-semibold truncate flex-1 text-left",
                    chapter.status === 'complete' > "text-slate-300" :
                    chapter.status === 'in-progress' ? "text-slate-700 dark:text-slate-200" :
                    "text-slate-500"
                  )}>
                    {chapter.title}
                  </span>
                  
                  {expandedChapters.has(chapter.id) ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </button>

                {/* Sections */}
                <AnimatePresence>
                  {expandedChapters.has(chapter.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-6 space-y-1 mt-1 border-l-2 border-slate-200 dark:border-slate-800"
                    >
                      {chapter.sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => onSectionClick?.(section.id)}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 py-1.5 rounded-lg -ml-[2px] border-l-2 transition-colors text-left",
                            section.id === activeSectionId || section.isActive
                              ? "bg-[#137fec]/10 text-[#137fec] border-[#137fec]"
                              : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 border-transparent"
                          )}
                        >
                          <span className="text-xs truncate">{section.title}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Daily Goal Card */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="bg-[#137fec]/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#137fec] uppercase flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Daily Goal
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {dailyGoal.current} / {dailyGoal.target}
                </span>
              </div>
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="bg-[#137fec] h-full rounded-full transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Format Tab */
        <div className="p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Format Options
          </h3>
          <div className="space-y-2">
            <button className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Export to PDF
            </button>
            <button className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Export to ePub
            </button>
            <button className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Export to Word
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
