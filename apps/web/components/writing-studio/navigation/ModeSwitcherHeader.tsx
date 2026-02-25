'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Type, 
  Rocket,
  Save,
  Undo,
  Redo,
  ChevronDown,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Mode = 'write' | 'format' | 'publish';

interface ModeSwitcherHeaderProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  projectName?: string;
  onSave?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  lastSaved?: Date;
  isSaving?: boolean;
}

const MODES: { id: Mode; label: string; icon: any; description: string }[] = [
  { 
    id: 'write', 
    label: 'Write', 
    icon: BookOpen,
    description: 'Edit your manuscript'
  },
  { 
    id: 'format', 
    label: 'Format', 
    icon: Type,
    description: 'Style and preview'
  },
  { 
    id: 'publish', 
    label: 'Publish', 
    icon: Rocket,
    description: 'Finalize and distribute'
  },
];

export function ModeSwitcherHeader({
  currentMode,
  onModeChange,
  projectName = 'Untitled Project',
  onSave,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  lastSaved,
  isSaving = false,
}: ModeSwitcherHeaderProps) {
  const [showModeMenu, setShowModeMenu] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
      
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo?.();
      }
      
      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) onRedo?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onUndo, onRedo, canUndo, canRedo]);

  const currentModeData = MODES.find(m => m.id === currentMode);

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] flex items-center justify-between px-4 z-50">
      {/* Left: Logo + Mode Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[#137fec]">
          <BookOpen className="w-6 h-6" />
          <span className="font-bold text-lg hidden sm:block">Shothik</span>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Mode Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowModeMenu(!showModeMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {currentModeData && (<>
              <currentModeData.icon className="w-4 h-4 text-[#137fec]" />
              <span className="font-medium text-sm hidden sm:block">{currentModeData.label}</span>
              <ChevronDown className={cn(
                "w-4 h-4 text-slate-400 transition-transform",
                showModeMenu && "rotate-180"
              )} />
            </>)}
          </button>

          {showModeMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowModeMenu(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                {MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onModeChange(mode.id);
                      setShowModeMenu(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      currentMode === mode.id
                        ? "bg-[#137fec]/10 text-[#137fec]"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      currentMode === mode.id
                        ? "bg-[#137fec]/20"
                        : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <mode.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{mode.label}</div>
                      <div className="text-xs text-slate-500">{mode.description}</div>
                    </div>
                    {currentMode === mode.id && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Project Name */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-slate-500">Project:</span>
          <span className="font-medium text-sm truncate max-w-[150px]">{projectName}</span>
        </div>
      </div>

      {/* Center: Keyboard Shortcuts Hint (Desktop) */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">S</kbd>
          <span className="ml-1">Save</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Z</kbd>
          <span className="ml-1">Undo</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={cn(
              "p-1.5 rounded transition-colors",
              canUndo 
                ? "hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" 
                : "opacity-30 cursor-not-allowed"
            )}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={cn(
              "p-1.5 rounded transition-colors",
              canRedo 
                ? "hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" 
                : "opacity-30 cursor-not-allowed"
            )}
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Save Status */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          {isSaving ? (
            <>
              <div className="w-3 h-3 border-2 border-slate-300 border-t-[#137fec] rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          ) : (
            <span>Unsaved changes</span>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#137fec]/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>
    </header>
  );
}
