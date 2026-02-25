'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles,
  History,
  Check,
  X,
  Send,
  Paperclip,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Version {
  id: string;
  timestamp: string;
  preview: string;
  isAISuggestion?: boolean;
  status?: 'pending' | 'applied' | 'rejected';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hasActions?: boolean;
}

type TabId = 'neuro' | 'nobel' | 'chars' | 'ai' | 'research' | 'plan' | 'critique';

interface RightPanelProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'neuro', label: 'Neuro' },
  { id: 'nobel', label: 'Nobel' },
  { id: 'chars', label: 'Chars' },
  { id: 'ai', label: 'AI' },
  { id: 'research', label: 'Research' },
  { id: 'plan', label: 'Plan' },
  { id: 'critique', label: 'Critique' },
];

const SAMPLE_VERSIONS: Version[] = [
  {
    id: 'v1',
    timestamp: '2 minutes ago',
    preview: '"The rain didn\'t just fall; it hammered against the reinforced glass..."',
    isAISuggestion: true,
    status: 'pending',
  },
  {
    id: 'v2',
    timestamp: '15 minutes ago',
    preview: '"Sarah looked tired, the cybernetic augmentations around her left eye flickering..."',
    status: 'applied',
  },
];

const SAMPLE_CHAT: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: "I've analyzed the tension in Section 1.1. Would you like me to draft a high-impact transition into Chapter 2?",
    hasActions: true,
  },
];

export function RightPanel({ 
  activeTab = 'ai', 
  onTabChange 
}: RightPanelProps) {
  const [currentTab, setCurrentTab] = useState<TabId>(activeTab);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_CHAT);
  const [versions, setVersions] = useState<Version[]>(SAMPLE_VERSIONS);

  const handleTabClick = (tabId: TabId) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
    };
    
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand. Let me analyze that for you...',
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const applyVersion = (versionId: string) => {
    setVersions(prev => prev.map(v => 
      v.id === versionId ? { ...v, status: 'applied' } : v
    ));
  };

  const rejectVersion = (versionId: string) => {
    setVersions(prev => prev.map(v => 
      v.id === versionId ? { ...v, status: 'rejected' } : v
    ));
  };

  return (
    <aside className="w-[420px] border-l border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-[#101922]/40 overflow-hidden">
      {/* Horizontal Scrollable Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar bg-slate-100/30 dark:bg-black/20 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "px-3 py-3 text-[9px] font-bold uppercase tracking-tight shrink-0 transition-colors whitespace-nowrap",
              currentTab === tab.id
                ? "text-[#137fec] border-b-2 border-[#137fec]"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            {tab.label}
            {tab.id === 'ai' && <span className="ml-1 text-[#137fec]">🔥</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Rollback & Versions Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border-b border-slate-200 dark:border-slate-800">
          <div className="p-4 bg-slate-100/50 dark:bg-slate-900/20 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800/50 backdrop-blur-sm">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
              <History className="w-3 h-3" />
              Rollback & Versions
            </h4>
          </div>

          <div className="p-3 space-y-3">
            {versions.map((version) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white dark:bg-slate-800/40 p-3 rounded-lg border transition-colors",
                  version.status === 'rejected' 
                    ? "opacity-50 border-slate-200 dark:border-slate-700/50" :
                  version.status === 'applied'
                    ? "border-green-500/30 bg-green-50/50 dark:bg-green-900/10" :
                  "border-slate-200 dark:border-slate-700/50 hover:border-[#137fec] cursor-pointer"
                )}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-semibold text-slate-500">{version.timestamp}</span>
                  
                  {version.status === 'pending' ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => applyVersion(version.id)}
                        className="p-1 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => rejectVersion(version.id)}
                        className="p-1 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : version.status === 'applied' ? (
                    <span className="text-[9px] font-bold text-green-500 uppercase">Applied</span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Ignored</span>
                  )}
                </div>
                
                <p className="text-[11px] line-clamp-2 text-slate-600 dark:text-slate-400">
                  {version.preview}
                </p>
                
                {version.isAISuggestion && version.status === 'pending' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-[#137fec]/10 text-[#137fec] text-[9px] rounded font-bold">
                      AI SUGGESTION
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Chat Section */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900/10">
          <div className="p-4 bg-slate-100/50 dark:bg-slate-900/20 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800/50 backdrop-blur-sm flex justify-between items-center">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#137fec]" />
              Writing Assistant (MCP)
            </h4>
            <span className="text-[10px] bg-[#137fec]/10 text-[#137fec] px-1.5 py-0.5 rounded font-bold">
              ACTIVE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div key={message.id} className={cn(
                "flex gap-2",
                message.role === 'user' ? "flex-row-reverse" : ""
              )}>
                <div className={cn(
                  "w-6 h-6 rounded flex items-center justify-center shrink-0",
                  message.role === 'user' 
                    ? "bg-slate-200 dark:bg-slate-700" 
                    : "bg-[#137fec]/20 text-[#137fec]"
                )}>
                  {message.role === 'user' ? (
                    <span className="text-[10px] font-bold">U</span>
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className={cn(
                  "max-w-[85%] p-3 rounded-xl text-xs shadow-sm border",
                  message.role === 'user'
                    ? "bg-[#137fec] text-white rounded-tr-none border-[#137fec]"
                    : "bg-white dark:bg-slate-800 rounded-tl-none border-slate-200 dark:border-slate-700"
                )}
                >
                  {message.content}
                  
                  {message.hasActions && (
                    <div className="mt-3 flex gap-2">
                      <button className="px-2 py-1 bg-[#137fec]/10 text-[#137fec] rounded text-[10px] font-bold hover:bg-[#137fec]/20 transition-colors">
                        YES, DRAFT IT
                      </button>
                      <button className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        NOT NOW
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101922]/50">
            <div className="relative">
              <button className="absolute left-3 top-3 flex items-center gap-1 text-slate-400 hover:text-[#137fec] transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask MCP for structural help..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs p-3 pl-10 pr-10 focus:ring-1 focus:ring-[#137fec] min-h-[60px] max-h-[120px] resize-none"
                rows={2}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="absolute bottom-2 right-2 p-1.5 bg-[#137fec] text-white rounded-lg hover:bg-[#137fec]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
