'use client';

import { 
  FileText, 
  Zap, 
  Brain, 
  Trophy,
  Type
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBarProps {
  wordCount: number;
  toonSavings?: number;
  neuralScore?: number;
  nobelImpact?: number;
  tone?: string;
}

export function StatusBar({
  wordCount,
  toonSavings = 45,
  neuralScore = 92,
  nobelImpact = 8.4,
  tone = 'Noir'
}: StatusBarProps) {
  return (
    <div className="h-10 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-slate-50 dark:bg-[#101922]/60 backdrop-blur-sm relative z-50">
      {/* Left: Metrics */}
      <div className="flex items-center gap-6 text-[10px] font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {wordCount.toLocaleString()} Words
        </span>
        
        <span className="flex items-center gap-1.5 text-[#137fec]">
          <Zap className="w-3.5 h-3.5" />
          TOON ⚡ {toonSavings}% saved
        </span>
        
        <span className="flex items-center gap-1.5 text-amber-500">
          <Brain className="w-3.5 h-3.5" />
          Neural Score: {neuralScore}/100
        </span>
        
        <span className="flex items-center gap-1.5 text-green-500">
          <Trophy className="w-3.5 h-3.5" />
          Nobel Impact: {nobelImpact}
        </span>
      </div>

      {/* Right: Tone Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-[#137fec]/10 text-[#137fec]">
          <Type className="w-3 h-3" />
          Tone: {tone}
        </div>
      </div>
    </div>
  );
}
