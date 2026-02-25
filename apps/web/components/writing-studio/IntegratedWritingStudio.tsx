'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

import { ModeSwitcherHeader } from '@/components/writing-studio/navigation/ModeSwitcherHeader';
import { PolishedWriteView } from '@/components/writing-studio/PolishedWriteView';
import { PublishingPage } from '@/components/writing-studio/PublishingPage';
import { AccessibilityReportPanel } from '@/components/writing-studio/validation';

import { useToast } from '@/hooks/useToast';

type Mode = 'write' | 'format' | 'publish';

interface IntegratedWritingStudioProps {
  projectId: Id<'projects'>;
  userId: Id<'users'>;
}

export function IntegratedWritingStudio({ projectId, userId }: IntegratedWritingStudioProps) {
  const [currentMode, setCurrentMode] = useState<Mode>('write');
  const [localContent, setLocalContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const { toast } = useToast();

  // Fetch project data
  const project = useQuery(api.projects.get, { projectId });
  
  // Mutations
  const updateContent = useMutation(api.projects.updateContent);
  const saveVersion = useMutation(api.projects.saveVersion);
  const generateAIResponse = useMutation(api.llmActions.generateResponse);
  const analyzeNeural = useMutation(api.llmActions.analyzeNeuralCoupling);
  const analyzeNobel = useMutation(api.llmActions.analyzeNobelImpact);

  // Initialize content from project
  useEffect(() => {
    if (project?.content && !localContent) {
      setLocalContent(project.content);
    }
  }, [project?.content]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (localContent !== project?.content) {
        handleSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [localContent, project?.content]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const wordCount = localContent.split(/\s+/).filter(w => w.length > 0).length;
      
      await updateContent({
        projectId,
        content: localContent,
        wordCount,
      });
      
      setLastSaved(new Date());
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Could not save your changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [localContent, projectId, isSaving, toast, updateContent]);

  // Version history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLocalContent(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLocalContent(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Track history
  useEffect(() => {
    if (localContent && localContent !== history[historyIndex]) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), localContent].slice(-50));
      setHistoryIndex(prev => prev + 1);
    }
  }, [localContent]);

  // AI Chat integration
  const handleAIChat = useCallback(async (message: string, sessionId: Id<'chatSessions'>) => {
    try {
      const response = await generateAIResponse({
        sessionId,
        userMessage: message,
        includeFullManuscript: true,
      });
      
      return response.content;
    } catch (error) {
      toast({
        title: 'AI Error',
        description: 'Could not get AI response. Please try again.',
        variant: 'destructive',
      });
      return 'Sorry, I encountered an error. Please try again.';
    }
  }, [generateAIResponse, toast]);

  // Analysis handlers
  const runNeuralAnalysis = useCallback(async () => {
    try {
      const result = await analyzeNeural({
        projectId,
        content: localContent,
      });
      return result;
    } catch (error) {
      console.error('Neural analysis failed:', error);
      return null;
    }
  }, [analyzeNeural, projectId, localContent]);

  const runNobelAnalysis = useCallback(async () => {
    try {
      const result = await analyzeNobel({
        projectId,
        content: localContent,
      });
      return result;
    } catch (error) {
      console.error('Nobel analysis failed:', error);
      return null;
    }
  }, [analyzeNobel, projectId, localContent]);

  if (!project) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f14]">
      <ModeSwitcherHeader
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        projectName={project.title}
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
            bookTitle={project.title}
            content={localContent}
            onChange={setLocalContent}
            onAIChat={handleAIChat}
            onNeuralAnalysis={runNeuralAnalysis}
            onNobelAnalysis={runNobelAnalysis}
            projectId={projectId}
            userId={userId}
          />
        )}

        {currentMode === 'format' && (
          <FormatView
            project={project}
            content={localContent}
            onPublish={() => setCurrentMode('publish')}
          />
        )}

        {currentMode === 'publish' && (
          <PublishingPage
            project={project}
            onBackToEditor={() => setCurrentMode('write')}
          />
        )}
      </div>
    </div>
  );
}

// Format View Component
function FormatView({ 
  project, 
  content, 
  onPublish 
}: { 
  project: any; 
  content: string;
  onPublish: () => void;
}) {
  const [accessibilityReport, setAccessibilityReport] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAccessibility = async () => {
    setIsValidating(true);
    // TODO: Run actual validation
    setTimeout(() => {
      setAccessibilityReport({
        passed: true,
        score: 85,
        epubVersion: '3.3',
        wcagLevel: 'AA',
        issues: [],
        summary: { errors: 0, warnings: 3, info: 5 },
        metadata: {
          title: project.title,
          hasAccessibilityMetadata: true,
        },
      });
      setIsValidating(false);
    }, 2000);
  };

  return (
    <div className="h-full flex">
      {/* Left: Format Settings */}
      <div className="w-[380px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101922] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-lg font-bold mb-2">Format Settings</h1>
            <p className="text-sm text-slate-500">Configure for digital or print distribution.</p>
          </div>

          {/* Typography */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-[#137fec] uppercase tracking-wider">Typography</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 rounded-xl border-2 border-[#137fec] bg-[#137fec]/5 text-[#137fec]">
                <div className="text-2xl font-serif">Aa</div>
                <div className="text-xs font-medium mt-1">Serif</div>
              </button>
              <button className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-2xl font-sans">Aa</div>
                <div className="text-xs font-medium mt-1">Sans</div>
              </button>
            </div>
          </section>

          {/* Accessibility Check */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Accessibility</h3>
            
            <button
              onClick={validateAccessibility}
              disabled={isValidating}
              className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isValidating ? 'Validating...' : 'Validate ePub 3.3 + WCAG 2.2'}
            </button>

            {accessibilityReport && (
              <div className="mt-4">
                <AccessibilityReportPanel 
                  report={accessibilityReport}
                  onRevalidate={validateAccessibility}
                />
              </div>
            )}
          </section>

          {/* Export */}
          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={onPublish}
              className="w-full bg-[#137fec] text-white py-3 rounded-lg font-bold shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 transition-all"
            >
              🚀 Continue to Publish
            </button>
          </div>
        </div>
      </div>

      {/* Center: Preview */}
      <div className="flex-1 bg-slate-100 dark:bg-[#0a0f14]/50 flex items-center justify-center p-8">
        <div className="flex gap-4">
          <div className="w-[420px] aspect-[2/3] bg-white p-12 shadow-2xl font-serif">
            <div className="text-center text-slate-400 text-xs uppercase tracking-widest mb-16">
              {project.title}
            </div>
            <div className="text-[15px] leading-[1.6] text-justify">
              {content.substring(0, 500)}...
            </div>
          </div>
        </div>
      </div>

      {/* Right: Format Assistant */}
      <div className="w-[320px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101922]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Format Assistant</span>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-bold text-blue-600 mb-1">💡 Recommendation</div>
              <p className="text-xs text-slate-600">For Sci-Fi, try 1.3 line height with Caslon font.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
