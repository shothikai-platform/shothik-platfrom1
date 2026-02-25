'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from './layout/Header';
import { LeftSidebar } from './layout/LeftSidebar';
import { CenterEditor } from './layout/CenterEditor';
import { RightPanel } from './layout/RightPanel';
import { StatusBar } from './layout/StatusBar';

interface PolishedWriteViewProps {
  bookTitle?: string;
  project?: any;
}

export function PolishedWriteView({ 
  bookTitle = 'The Midnight Protocol',
  project 
}: PolishedWriteViewProps) {
  const [title, setTitle] = useState(bookTitle);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(1245);
  const [targetWords] = useState(38000);
  const [isSaving, setIsSaving] = useState(false);
  
  // History for undo/redo
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showRollback, setShowRollback] = useState(false);

  // Auto-save simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== history[historyIndex]) {
        setIsSaving(true);
        setTimeout(() => {
          setHistory(prev => [...prev.slice(-19), content]);
          setHistoryIndex(prev => prev + 1);
          setIsSaving(false);
        }, 500);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [content, history, historyIndex]);

  // Update word count when content changes
  useEffect(() => {
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [content]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
    }
  }, [history, historyIndex]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#0a0f14]">
      {/* Header */}
      <Header
        title={title}
        onTitleChange={setTitle}
        wordCount={wordCount}
        targetWords={targetWords}
        isSaving={isSaving}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Center Editor */}
        <CenterEditor
          content={content}
          onChange={setContent}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onRollbackClick={() => setShowRollback(!showRollback)}
        />

        {/* Right Panel */}
        <RightPanel />
      </main>

      {/* Status Bar */}
      <StatusBar 
        wordCount={wordCount}
        toonSavings={45}
        neuralScore={92}
        nobelImpact={8.4}
        tone="Noir"
      />
    </div>
  );
}
