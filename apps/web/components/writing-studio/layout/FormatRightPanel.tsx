'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles,
  Lightbulb,
  Check,
  X,
  BookOpen,
  Settings,
  Zap,
  Target,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormatRightPanelProps {
  className?: string;
}

type TabId = 'ai' | 'checklist' | 'publish';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'ai', label: 'AI Tips', icon: Sparkles },
  { id: 'checklist', label: 'Checklist', icon: Check },
  { id: 'publish', label: 'Publish', icon: Zap },
];

interface AITip {
  id: string;
  type: 'recommendation' | 'warning' | 'success';
  title: string;
  description: string;
  action?: string;
}

const SAMPLE_TIPS: AITip[] = [
  {
    id: '1',
    type: 'recommendation',
    title: 'Typography Optimization',
    description: 'For Sci-Fi novels, a slightly tighter line height (1.3) and a modern serif like Caslon often improves readability.',
    action: 'Apply Now',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Margin Warning',
    description: 'Your inside margin (0.75") might be too narrow for perfect binding. Consider 0.875" for 300+ page books.',
    action: 'Fix Margins',
  },
  {
    id: '3',
    type: 'success',
    title: 'Export Ready',
    description: 'Your EPUB format is optimized for Kindle, Apple Books, and Kobo. All validation checks passed.',
  },
];

const CHECKLIST_ITEMS = [
  { id: '1', label: 'Title Page', checked: true },
  { id: '2', label: 'Copyright Page', checked: true },
  { id: '3', label: 'Table of Contents', checked: true },
  { id: '4', label: 'Chapter Headers', checked: true },
  { id: '5', label: 'Page Numbers', checked: false },
  { id: '6', label: 'Ornaments', checked: false },
];

export function FormatRightPanel({ className }: FormatRightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ai');
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  const [checklist, setChecklist] = useState(CHECKLIST_ITEMS);

  const dismissTip = (id: string) => {
    setDismissedTips(prev => new Set([...prev, id]));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const visibleTips = SAMPLE_TIPS.filter(tip => !dismissedTips.has(tip.id));
  const completedCount = checklist.filter(i => i.checked).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  return (
    <aside className={cn(
      "w-[320px] border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#101922]",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-[#137fec]" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Format Assistant
          </span>
        </div>
        <p className="text-xs text-slate-500">
          AI-powered formatting recommendations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-3 py-3 text-[10px] font-bold uppercase tracking-tight transition-colors whitespace-nowrap flex items-center justify-center gap-1",
              activeTab === tab.id
                ? "text-[#137fec] border-b-2 border-[#137fec]"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              {visibleTips.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs mt-1">No new recommendations</p>
                </div>
              ) : (
                visibleTips.map((tip) => (
                  <motion.div
                    key={tip.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-4 rounded-xl border relative",
                      tip.type === 'recommendation' && "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
                      tip.type === 'warning' && "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800",
                      tip.type === 'success' && "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    )}
                  >
                    <button
                      onClick={() => dismissTip(tip.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        tip.type === 'recommendation' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
                        tip.type === 'warning' && "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
                        tip.type === 'success' && "bg-green-100 dark:bg-green-900/30 text-green-600"
                      )}>
                        {tip.type === 'recommendation' && <Lightbulb className="w-4 h-4" />}
                        {tip.type === 'warning' && <AlertCircle className="w-4 h-4" />}
                        {tip.type === 'success' && <Check className="w-4 h-4" />}
                      </div>

                      <div className="flex-1">
                        <h4 className={cn(
                          "text-xs font-bold uppercase mb-1",
                          tip.type === 'recommendation' && "text-blue-600",
                          tip.type === 'warning' && "text-amber-600",
                          tip.type === 'success' && "text-green-600"
                        )}>
                          {tip.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {tip.description}
                        </p>
                        
                        {tip.action && (
                          <button className={cn(
                            "mt-2 text-[10px] font-bold uppercase tracking-wider hover:underline",
                            tip.type === 'recommendation' && "text-blue-600",
                            tip.type === 'warning' && "text-amber-600"
                          )}>
                            {tip.action}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'checklist' && (
                    defaultValue="A gripping sci-fi adventure across the cosmos..."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'checklist' && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-500">Completion</span>
                  <span className="text-xs font-bold text-[#137fec]">{progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#137fec] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <label 
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[#137fec] focus:ring-[#137fec]"
                    />
                    <span className={cn(
                      "text-sm",
                      item.checked && "text-slate-400 line-through"
                    )}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'publish' && (
            <motion.div
              key="distribution"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-4"
            >
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-600 uppercase">Ready to Publish</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Your book is formatted and ready for distribution.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Distribution Channels</h4>
                
                {[
                  { name: 'Amazon KDP', status: 'ready', icon: 'A' },
                  { name: 'Apple Books', status: 'ready', icon: '🍎' },
                  { name: 'Google Play', status: 'pending', icon: 'G' },
                  { name: 'Kobo', status: 'ready', icon: 'K' },
                ].map((channel) => (
                  <div 
                    key={channel.name}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs"
003e
                        {channel.icon}
                      </span>
                      <span className="text-sm">{channel.name}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                      channel.status === 'ready' 
                        ? "bg-green-100 text-green-600" 
                        : "bg-amber-100 text-amber-600"
                    )}>
                      {channel.status}
                    </span>
                  </div>
                ))}
              </div>

              <button className="w-full bg-[#137fec] text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 transition-all flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Publish Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <FileText className="w-3 h-3" />
              Pages
            </div>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-200">310</div>
          </div>

          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Target className="w-3 h-3" />
              Words
            </div>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-200">82.4k</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
