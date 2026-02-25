'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  BookOpen, 
  FileText,
  MoreVertical,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'epub' | 'pdf' | 'text';
  name: string;
  path?: string;
  content?: string;
}

interface PersistentChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Persistent Chat Panel - Like Replit's Assistant Panel
 * Always accessible, resizable, with MCP integration for E-books
 */
export function PersistentChatPanel({ 
  isOpen, 
  onToggle, 
  onClose,
  className 
}: PersistentChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: '👋 I\'m your writing assistant. I can help you:\n\n• Analyze your writing\n• Suggest improvements\n• Answer questions about your manuscript\n• Chat with EPUB/PDF files (via MCP)',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [height, setHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(200, Math.min(600, newHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    // Simulate AI response (replace with actual MCP/LLM call)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input, attachedFiles),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateResponse = (query: string, files: Attachment[]): string => {
    if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      return `I've analyzed ${fileNames}. Here's what I found:\n\n` +
        `**Key Insights:**\n` +
        `• The document discusses several important themes\n` +
        `• Chapter 3 has particularly relevant content for your query\n` +
        `• I recommend focusing on the sections about narrative structure\n\n` +
        `Would you like me to extract specific chapters or create a summary?`;
    }
    
    if (query.toLowerCase().includes('help')) {
      return 'I can help you with:\n\n' +
        '**Writing Assistance:**\n' +
        '• Analyze your writing style\n' +
        '• Suggest improvements\n' +
        '• Check narrative structure\n\n' +
        '**Document Analysis:**\n' +
        '• Upload EPUB/PDF files\n' +
        '• Ask questions about content\n' +
        '• Extract key information\n\n' +
        'What would you like to work on?';
    }
    
    return 'I\'m analyzing your request. Based on your manuscript, I suggest:\n\n' +
      '1. Consider adding more sensory details to increase neural coupling\n' +
      '2. Your character arc is progressing well - the protagonist shows clear growth\n' +
      '3. The pacing in chapter 3 could benefit from more tension\n\n' +
      'Would you like me to elaborate on any of these points?';
  };

  const handleAttachFile = (type: 'epub' | 'pdf') => {
    // Simulate file attachment (replace with actual file picker)
    const mockFile: Attachment = {
      type,
      name: type === 'epub' ? 'manuscript.epub' : 'research.pdf',
      path: `/books/${Date.now()}.${type}`
    };
    setAttachedFiles(prev => [...prev, mockFile]);
    setShowFileMenu(false);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'system',
      content: '👋 Chat cleared. How can I help you?',
      timestamp: new Date()
    }]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0d1117] border-t border-slate-200 dark:border-slate-800 flex flex-col z-50",
            className
          )}
          style={{ height }}
        >
          {/* Resize Handle */}
          <div
            ref={resizeRef}
            onMouseDown={() => setIsResizing(true)}
            className="h-1 cursor-ns-resize bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 transition-colors"
          />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Writing Assistant
              </span>
              <span className="text-xs text-slate-400">
                (MCP Ready)
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                title="Clear chat"
              >
                <span className="text-xs">Clear</span>
              </button>
              
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>

          {/* Attachments */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex gap-2 flex-wrap">
              {attachedFiles.map((file, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm"
                >
                  {file.type === 'epub' ? <BookOpen className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFileMenu(!showFileMenu)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  title="Attach file"
                >
                  <Plus className="w-5 h-5" />
                </button>
                
                {showFileMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1">
                    <button
                      onClick={() => handleAttachFile('epub')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      Attach EPUB
                    </button>
                    <button
                      onClick={() => handleAttachFile('pdf')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      Attach PDF
                    </button>
                  </div>
                )}
              </div>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your writing or attach an EPUB/PDF..."
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border-0 resize-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-32"
                rows={1}
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() && attachedFiles.length === 0}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Chat Message Bubble Component
function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : ""
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser 
          ? "bg-blue-500 text-white" 
          : isSystem
            ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
            : "bg-purple-500 text-white"
      )}>
        {isUser ? 'U' : isSystem ? 'S' : 'AI'}
      </div>

      {/* Content */}
      <div className={cn(
        "max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-2xl text-sm",
          isUser
            ? "bg-blue-500 text-white rounded-br-md"
            : isSystem
              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
        )}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 flex gap-2">
              {message.attachments.map((file, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded text-xs"
                >
                  {file.type === 'epub' ? <BookOpen className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  {file.name}
                </div>
              ))}
            </div>
          )}
          
          {/* Message text */}
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        
        <div className="text-xs text-slate-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// Collapsed Chat Button (when panel is closed)
export function ChatToggleButton({ 
  isOpen, 
  onClick, 
  unreadCount = 0 
}: { 
  isOpen: boolean; 
  onClick: () => void;
  unreadCount?: number;
}) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center z-50 transition-transform hover:scale-105"
    >
      <MessageSquare className="w-6 h-6" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
