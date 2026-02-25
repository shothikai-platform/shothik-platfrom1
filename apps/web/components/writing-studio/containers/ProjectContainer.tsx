'use client';

import { useState, useCallback, useEffect } from 'react';
import { ModeSwitcherHeader } from '../navigation/ModeSwitcherHeader';
import { PolishedWriteView } from '../PolishedWriteView';
import { PublishingPage } from '../PublishingPage';

// Placeholder for Format view - we'll integrate the existing Format components
type Mode = 'write' | 'format' | 'publish';

interface ProjectContainerProps {
  projectId?: string;
  initialMode?: Mode;
}

export function ProjectContainer({ 
  projectId,
  initialMode = 'write' 
}: ProjectContainerProps) {
  const [currentMode, setCurrentMode] = useState<Mode>(initialMode);
  const [projectName, setProjectName] = useState('The Obsidian Protocol');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // History for undo/redo
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Load project data
  useEffect(() => {
    // TODO: Load from Convex
    console.log('Loading project:', projectId);
  }, [projectId]);

  // Save handler
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    // TODO: Save to Convex
    console.log('Saving project...');
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setLastSaved(new Date());
    setIsSaving(false);
  }, []);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      // TODO: Apply history state to editor
    }
  }, [historyIndex]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      // TODO: Apply history state to editor
    }
  }, [history, historyIndex]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSaving) {
        handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [handleSave, isSaving]);

  // Handle mode change
  const handleModeChange = useCallback((mode: Mode) => {
    // Save before switching modes
    handleSave();
    setCurrentMode(mode);
  }, [handleSave]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f14]">
      <ModeSwitcherHeader
        currentMode={currentMode}
        onModeChange={handleModeChange}
        projectName={projectName}
        onSave={handleSave}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />

      <div className="flex-1 overflow-hidden">
        {currentMode === 'write' && (
          <PolishedWriteView 
            bookTitle={projectName}
            onTitleChange={setProjectName}
          />
        )}

        {currentMode === 'format' && (
          <FormatView 
            onPublish={() => setCurrentMode('publish')}
          />
        )}

        {currentMode === 'publish' && (
          <PublishingPage 
            project={{ id: projectId, name: projectName }}
            onBackToEditor={() => setCurrentMode('write')}
          />
        )}
      </div>
    </div>
  );
}

// Format View - Integrates the format components
function FormatView({ onPublish }: { onPublish: () => void }) {
  return (
    <div className="h-full flex">
      {/* Left: Format Settings */}
      <div className="w-[380px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101922] overflow-y-auto">
        <div className="p-6 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-bold">Format Settings</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">v2.4 Draft</span>
            </div>
            <p className="text-sm text-slate-500">Configure your manuscript for digital or print distribution.</p>
          </div>

          {/* Typography */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#137fec] font-semibold text-sm uppercase tracking-widest">
              <span>Typography</span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-[#137fec] bg-[#137fec]/5 text-[#137fec]">
                  <span className="text-xl font-serif">Aa</span>
                  <span className="text-xs font-medium mt-1">Serif</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-colors">
                  <span className="text-xl font-sans">Aa</span>
                  <span className="text-xs font-medium mt-1">Sans</span>
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-500">Font Family</label>
                <select className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                  <option>EB Garamond</option>
                  <option>Baskerville</option>
                  <option>Caslon</option>
                  <option>Inter</option>
                </select>
              </div>
            </div>
          </section>

          {/* Page Layout */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm uppercase tracking-widest">
              <span>Page Layout</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500">Trim Size</label>
                <select className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                  <option>Digest (5.5" x 8.5")</option>
                  <option selected>Trade Paperback (6" x 9")</option>
                  <option>US Letter (8.5" x 11")</option>
                </select>
              </div>
            </div>
          </section>

          {/* Export */}
          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Export Format</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button className="flex flex-col items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#137fec] transition-all">
                <span className="text-red-500 text-lg">📄</span>
                <span className="text-[10px] mt-1 font-bold">PDF</span>
              </button>
              <button className="flex flex-col items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-[#137fec] ring-1 ring-[#137fec]">
                <span className="text-[#137fec] text-lg">📱</span>
                <span className="text-[10px] mt-1 font-bold">EPUB</span>
              </button>
              <button className="flex flex-col items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#137fec] transition-all">
                <span className="text-blue-400 text-lg">📝</span>
                <span className="text-[10px] mt-1 font-bold">DOCX</span>
              </button>
            </div>
            
            <button 
              onClick={onPublish}
              className="w-full bg-[#137fec] text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 transition-all flex items-center justify-center gap-2"
            >
              🚀 Generate Export
            </button>
          </div>
        </div>
      </div>

      {/* Center: Preview */}
      <div className="flex-1 bg-slate-100 dark:bg-[#0a0f14]/50 relative flex flex-col">
        <div className="bg-white dark:bg-[#101922] border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
            <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-white dark:bg-slate-800 shadow-sm">Spread View</button>
            <button className="px-4 py-1.5 text-xs font-medium text-slate-500">Single Page</button>
            <button className="px-4 py-1.5 text-xs font-medium text-slate-500">E-reader</button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">75%</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex items-start justify-center p-8">
          <div className="flex gap-4">
            {/* Page 1 */}
            <div className="w-[420px] aspect-[2/3] bg-white p-12 shadow-2xl relative font-serif">
              <div className="text-[10px] text-center text-slate-400 uppercase tracking-widest mb-16">The Last Constellation</div>
              <div className="text-[15px] leading-[1.6] text-justify space-y-4">
                <p>The starship hummed with a low, rhythmic vibration...</p>
              </div>
              
              <div className="absolute bottom-12 left-0 right-0 text-center text-[11px] text-slate-400">142</div>
            </div>

            {/* Page 2 */}
            <div className="w-[420px] aspect-[2/3] bg-white p-12 shadow-2xl relative font-serif">
              <div className="text-[10px] text-center text-slate-400 uppercase tracking-widest mb-24">Chapter Twelve</div>
              <div className="text-2xl font-bold mb-8 text-center italic">The Gutter of the Void</div>
              
              <div className="text-[15px] leading-[1.6] text-justify space-y-4">
                <p><span className="float-left text-6xl font-bold leading-[0.8] mr-3 mt-1 text-[#137fec]">I</span>t was a place where light went to die...</p>
              </div>
              
              <div className="absolute bottom-12 left-0 right-0 text-center text-[11px] text-slate-400">143</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Format Assistant */}
      <FormatRightPanel />
    </div>
  );
}

// Import the FormatRightPanel
import { FormatRightPanel } from './FormatRightPanel';
