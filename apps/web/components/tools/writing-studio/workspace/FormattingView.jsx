"use client";

import { useState, useEffect } from "react";
import {
  Type,
  Ruler,
  ListChecks,
  FileText,
  Smartphone,
  FileDown,
  ZoomOut,
  ZoomIn,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

function LeftFormatPanel() {
  const [fontType, setFontType] = useState("serif");

  return (
    <aside className="w-[380px] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#101922] overflow-y-auto scrollbar-hide shrink-0">
      <div className="p-6 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold">Format Settings</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">v2.4 Draft</span>
          </div>
          <p className="text-sm text-slate-500">Configure your manuscript for digital or print distribution.</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#137fec] font-semibold text-sm uppercase tracking-widest">
            <Type className="h-4 w-4" /> Typography
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFontType("serif")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                fontType === "serif" ? "border-[#137fec] bg-[#137fec]/5 text-[#137fec]" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              )}
              aria-label="Select serif font"
              aria-pressed={fontType === "serif"}
            >
              <span className="text-xl" style={{ fontFamily: "Georgia, serif" }}>Aa</span>
              <span className="text-xs font-medium mt-1">Serif</span>
            </button>
            <button
              onClick={() => setFontType("sans")}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                fontType === "sans" ? "border-[#137fec] bg-[#137fec]/5 text-[#137fec]" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              )}
              aria-label="Select sans-serif font"
              aria-pressed={fontType === "sans"}
            >
              <span className="text-xl font-sans">Aa</span>
              <span className="text-xs font-medium mt-1">Sans</span>
            </button>
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Font Family</label>
                <span className="text-xs text-slate-400">Garamond Pro</span>
              </div>
              <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-[#137fec] p-2" aria-label="Font family">
                <option>EB Garamond</option>
                <option>Baskerville</option>
                <option>Caslon</option>
                <option>Inter</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Font Size</label>
                <span className="text-xs font-mono">11pt</span>
              </div>
              <input type="range" min="8" max="18" defaultValue="11" className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#137fec]" aria-label="Font size" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Line Spacing</label>
                <span className="text-xs font-mono">1.4</span>
              </div>
              <input type="range" min="1" max="2" step="0.1" defaultValue="1.4" className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#137fec]" aria-label="Line spacing" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm uppercase tracking-widest">
            <Ruler className="h-4 w-4" /> Page Layout
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trim Size</label>
              <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-[#137fec] p-2" aria-label="Trim size">
                <option>Digest (5.5&quot; x 8.5&quot;)</option>
                <option>Trade Paperback (6&quot; x 9&quot;)</option>
                <option>US Letter (8.5&quot; x 11&quot;)</option>
                <option>A5 (148 x 210 mm)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-medium">Inside Margin</label>
                <input type="text" defaultValue="0.75 in" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-center p-2" aria-label="Inside margin" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-medium">Outside Margin</label>
                <input type="text" defaultValue="0.50 in" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-center p-2" aria-label="Outside margin" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm uppercase tracking-widest">
            <ListChecks className="h-4 w-4" /> Chapter Styles
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Drop Caps</span>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#137fec] focus:ring-[#137fec]" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Chapter Ornaments</span>
              <input type="checkbox" className="rounded border-slate-300 text-[#137fec] focus:ring-[#137fec]" />
            </label>
          </div>
        </section>
      </div>

      <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase">Export Format</span>
          <div className="grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#137fec] transition-all" aria-label="Export as PDF">
              <FileText className="h-5 w-5 text-red-500" />
              <span className="text-[10px] mt-1 font-bold">PDF</span>
            </button>
            <button className="flex flex-col items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-[#137fec] ring-1 ring-[#137fec]" aria-label="Export as EPUB" aria-pressed="true">
              <Smartphone className="h-5 w-5 text-[#137fec]" />
              <span className="text-[10px] mt-1 font-bold">EPUB</span>
            </button>
            <button className="flex flex-col items-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#137fec] transition-all" aria-label="Export as DOCX">
              <FileDown className="h-5 w-5 text-blue-400" />
              <span className="text-[10px] mt-1 font-bold">DOCX</span>
            </button>
          </div>
          <button className="w-full bg-[#137fec] text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-[#137fec]/20 hover:bg-[#137fec]/90 transition-all flex items-center justify-center gap-2 mt-2" aria-label="Generate export file">
            <FileDown className="h-4 w-4" /> Generate Export
          </button>
        </div>
      </div>
    </aside>
  );
}

function RightPreviewPanel() {
  const [viewMode, setViewMode] = useState("spread");
  const [showAiTip, setShowAiTip] = useState(true);

  useEffect(() => {
    if (showAiTip) {
      const timer = setTimeout(() => setShowAiTip(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showAiTip]);

  return (
    <section className="flex-1 bg-slate-100 dark:bg-[#101922]/50 relative flex flex-col items-center overflow-hidden">
      <div className="w-full bg-white dark:bg-[#101922] border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-1" role="tablist" aria-label="Preview mode">
          {["spread", "single", "ereader"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              role="tab"
              aria-selected={viewMode === mode}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                viewMode === mode
                  ? "bg-white dark:bg-slate-800 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {mode === "spread" ? "Spread View" : mode === "single" ? "Single Page" : "E-reader"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4 text-slate-400" />
            <input type="range" className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#137fec]" aria-label="Zoom level" />
            <ZoomIn className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 ml-1">75%</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <button className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#137fec] transition-colors" aria-label="Toggle safe zones">
            <LayoutGrid className="h-4 w-4" /> Safe Zones
          </button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-auto flex items-start justify-center p-12 scrollbar-hide">
        <div className={cn(
          "flex items-start max-w-full",
          viewMode === "spread" ? "flex-row gap-4" : "flex-col gap-8"
        )}>
          {(viewMode === "spread" || viewMode === "single") && (
            <div className="bg-white w-[420px] p-12 relative flex flex-col shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.3)] dark:border dark:border-slate-700" style={{ aspectRatio: "6/9", fontFamily: "'Georgia', serif" }}>
              <div className="text-[10px] text-center text-slate-400 uppercase tracking-widest mb-16">The Last Constellation</div>
              <div className="flex-1 text-[#2d2d2d] leading-[1.6] text-[15px] space-y-4 text-justify">
                <p>The starship hummed with a low, rhythmic vibration that pulsed through the soles of Elara&apos;s boots. It was a familiar comfort, the heartbeat of a vessel that had been her only home for three decades.</p>
                <p>Outside the reinforced obsidian glass, the void stretched on forever, punctuated only by the dying embers of the Andromeda cluster. They were the last of their kind—keepers of the celestial fire, drifting through a galaxy that had forgotten the warmth of a rising sun.</p>
                <p>Elara adjusted the settings on the navigation console. Her fingers moved with practiced grace, a dance she had performed a thousand times before. But tonight felt different. The sensors were picking up a faint signal from the gravitational well of Sector 7G.</p>
                <p>&quot;Captain?&quot; The artificial voice of the ship&apos;s AI, Seraphina, crackled through the comms. &quot;I&apos;m detecting a localized distortion in the fabric of spacetime. It shouldn&apos;t be possible.&quot;</p>
                <p>Elara leaned in closer. &quot;Possible or not, it&apos;s there. Bring us about, Seraphina. Let&apos;s see what&apos;s left of the universe.&quot;</p>
              </div>
              <div className="mt-16 text-center text-[11px] text-slate-400" style={{ fontFamily: "Inter, sans-serif" }}>142</div>
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-200/50 to-transparent" />
            </div>
          )}

          <div className={cn(
            "bg-white p-12 relative flex flex-col shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.3)] dark:border dark:border-slate-700",
            viewMode === "ereader" ? "w-[360px] rounded-xl" : "w-[420px]"
          )} style={{ aspectRatio: "6/9", fontFamily: "'Georgia', serif" }}>
            <div className="text-[10px] text-center text-slate-400 uppercase tracking-widest mb-24">Chapter Twelve</div>
            <div className="flex-1 text-[#2d2d2d]">
              <h3 className="text-2xl font-bold mb-8 text-center italic">The Gutter of the Void</h3>
              <div className="leading-[1.6] text-[15px] space-y-4 text-justify">
                <p><span className="float-left text-6xl font-bold leading-[0.8] mr-3 mt-1 text-[#137fec]">I</span>t was a place where light went to die. Not in the violent surge of a black hole, but in the slow, agonizing fade of a candle in a drafty room. The Nebula of Sighs was aptly named by the scouts of the Old Republic.</p>
                <p>Elara watched the displays as the ship entered the thick, violet gas. Visibility dropped to near zero. The Seraphina&apos;s hull groaned under the sudden shift in pressure.</p>
                <p>&quot;Shields at eighty percent,&quot; the AI reported. &quot;Thermal radiation is within acceptable limits, but I am losing lock on the beacon.&quot;</p>
                <p>&quot;Keep looking,&quot; Elara whispered. &quot;It&apos;s there. It has to be.&quot; She knew that if they missed this window, they would never find their way back to the core. The path was closing, and they were running out of time.</p>
              </div>
            </div>
            <div className="mt-16 text-center text-[11px] text-slate-400" style={{ fontFamily: "Inter, sans-serif" }}>143</div>
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-200/50 to-transparent" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 flex items-center gap-6 z-10">
        <button className="size-10 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:text-[#137fec] transition-all" aria-label="Previous page">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-6 py-2 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <span className="text-xs font-bold text-slate-500">Page 142 of 310</span>
          <div className="h-1 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#137fec] w-[45%]" />
          </div>
        </div>
        <button className="size-10 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:text-[#137fec] transition-all" aria-label="Next page">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {showAiTip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 right-8 w-64 bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl border border-[#137fec]/30 backdrop-blur-sm z-20"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-[#137fec]/20 rounded-lg shrink-0">
                <Lightbulb className="h-5 w-5 text-[#137fec]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#137fec] mb-1">AI Recommendation</p>
                <p className="text-[11px] leading-relaxed text-slate-300">For Sci-Fi novels, a slightly tighter line height (1.3) and a modern serif like Caslon often improves readability.</p>
                <button className="mt-2 text-[10px] font-bold text-[#137fec] uppercase tracking-wider hover:underline" aria-label="Apply AI recommendation">Apply Now</button>
              </div>
            </div>
            <button
              onClick={() => setShowAiTip(false)}
              className="absolute -top-2 -right-2 size-5 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700"
              aria-label="Dismiss recommendation"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function FormattingView() {
  return (
    <main className="flex flex-1 overflow-hidden">
      <LeftFormatPanel />
      <RightPreviewPanel />
    </main>
  );
}
