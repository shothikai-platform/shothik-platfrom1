'use client';

import { useState, useEffect } from 'react';
import { Brain, Trophy, Zap, ChevronUp } from 'lucide-react';
import { NeuralCouplingEngine, NobelImpactEngine, FormatAgent } from '@/lib/nobel-engine';
import { cn } from '@/lib/utils';

interface NobelStatusBarProps {
  content: string;
  wordCount: number;
  charCount: number;
  toonSavings?: number;
}

export function NobelStatusBar({ 
  content, 
  wordCount, 
  charCount,
  toonSavings = 45
}: NobelStatusBarProps) {
  const [neuralScore, setNeuralScore] = useState(0);
  const [nobelScore, setNobelScore] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    if (!content) return;
    
    // Debounced analysis
    const timer = setTimeout(() => {
      const neural = NeuralCouplingEngine.quickCheck(content);
      const nobel = NobelImpactEngine.quickCheck(content);
      
      setNeuralScore(neural.score);
      setNobelScore(nobel.score);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [content]);

  const getNeuralColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-slate-400';
  };

  const getNobelColor = (score: number) => {
    if (score >= 75) return 'text-amber-500';
    if (score >= 55) return 'text-blue-500';
    return 'text-slate-400';
  };

  return (
    <>
      <div className="h-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 text-sm">
        {/* Left: Basic Stats */}
        <div className="flex items-center gap-4">
          <span className="text-slate-600 dark:text-slate-400">
            {wordCount.toLocaleString()} words
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 dark:text-slate-400">
            {charCount.toLocaleString()} chars
          </span>
        </div>

        {/* Center: Nobel Scores */}
        <div className="flex items-center gap-6">
          {/* Neural Coupling */}
          <div className="flex items-center gap-1.5" title="Neural Coupling Score">
            <Brain className={cn("w-4 h-4", getNeuralColor(neuralScore))} />
            <span className={cn("font-medium", getNeuralColor(neuralScore))}>
              {neuralScore}
            </span>
          </div>

          {/* Nobel Impact */}
          <div className="flex items-center gap-1.5" title="Nobel Impact Score">
            <Trophy className={cn("w-4 h-4", getNobelColor(nobelScore))} />
            <span className={cn("font-medium", getNobelColor(nobelScore))}>
              {nobelScore}
            </span>
          </div>

          {/* TOON Indicator */}
          <div 
            className="flex items-center gap-1 text-amber-600 dark:text-amber-400" 
            title={`TOON format: ${toonSavings}% token savings`}
          >
            <Zap className="w-4 h-4" />
            <span className="font-medium">TOON</span㸀
            <span className="text-xs opacity-75">{toonSavings}%</span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <span>Quick Actions</span>
          <ChevronUp className={cn("w-4 h-4 transition-transform", showQuickActions ? '' : 'rotate-180')} />
        </button>
      </div>

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="absolute bottom-10 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg">
          <div className="flex flex-wrap gap-2">
            <QuickActionButton 
              label="Boost Neural Coupling"
              icon={Brain}
              onClick={() => console.log('Boost neural')}
              color="blue"
            />
            <QuickActionButton 
              label="Deepen Character"
              icon={Trophy}
              onClick={() => console.log('Deepen character')}
              color="purple"
            />
            <QuickActionButton 
              label="Check Nobel Score"
              icon={Trophy}
              onClick={() => console.log('Check Nobel')}
              color="amber"
            />
            <QuickActionButton 
              label="Preview PDF"
              icon={Zap}
              onClick={() => console.log('Preview PDF')}
              color="green"
            />
            <QuickActionButton 
              label="Export ePub"
              icon={Zap}
              onClick={() => console.log('Export ePub')}
              color="slate"
            />
          </div>
        </div>
      )}
    </>
  );
}

function QuickActionButton({ 
  label, 
  icon: Icon, 
  onClick,
  color
}: { 
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  color: 'blue' | 'purple' | 'amber' | 'green' | 'slate';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300',
    green: 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300',
    slate: 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        colorClasses[color]
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
