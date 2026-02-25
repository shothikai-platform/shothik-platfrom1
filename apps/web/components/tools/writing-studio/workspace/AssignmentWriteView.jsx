"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  Send,
  Sparkles,
  GripVertical,
  PanelRightClose,
  PanelRightOpen,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  Quote,
  CalendarClock,
  ChevronDown,
} from "lucide-react";

const SECTIONS = [
  { id: "intro", title: "Introduction", status: "complete" },
  { id: "body-1", title: "Body Section 1", status: "in_progress" },
  { id: "body-2", title: "Body Section 2", status: "not_started" },
  { id: "conclusion", title: "Conclusion", status: "not_started" },
  { id: "references", title: "References", status: "not_started" },
];

const STATUS_DOT = {
  complete: "bg-emerald-500",
  in_progress: "bg-amber-500",
  not_started: "bg-slate-300 dark:bg-slate-600",
};

const RUBRIC_ITEMS = [
  { id: 1, criterion: "Thesis Statement", maxScore: 10, score: 8, feedback: "Clear and well-defined thesis. Consider making it more specific to your argument." },
  { id: 2, criterion: "Evidence & Support", maxScore: 20, score: 14, feedback: "Good use of sources. Add 2-3 more peer-reviewed citations to strengthen body paragraphs." },
  { id: 3, criterion: "Critical Analysis", maxScore: 20, score: 12, feedback: "Analysis needs more depth. Avoid summarizing sources — instead, evaluate and compare them." },
  { id: 4, criterion: "Structure & Organization", maxScore: 15, score: 13, feedback: "Well-organized with clear transitions. Introduction could better preview your argument structure." },
  { id: 5, criterion: "Grammar & Style", maxScore: 15, score: 11, feedback: "Several grammatical issues flagged. Run grammar check before submission." },
  { id: 6, criterion: "Citation Format (APA)", maxScore: 10, score: 7, feedback: "Some in-text citations missing page numbers. Check reference list formatting." },
  { id: 7, criterion: "Word Count", maxScore: 10, score: 10, feedback: "Within required range (2,500-3,000 words)." },
];

function SectionSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="w-60 bg-white dark:bg-[#101922] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Sections</h3>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: "20%" }} />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">1 of 5 sections complete</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                isActive
                  ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
              }`}
              aria-label={`Go to ${section.title}`}
            >
              <GripVertical size={12} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
              <FileText size={14} className={isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-400"} />
              <span className={`text-xs font-medium flex-1 ${isActive ? "text-amber-700 dark:text-amber-300" : "text-slate-700 dark:text-slate-300"}`}>
                {section.title}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[section.status]}`} />
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock size={12} className="text-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Deadline</span>
          </div>
          <p className="text-sm font-bold text-red-700 dark:text-red-300">March 5, 2026</p>
          <p className="text-[10px] text-red-500 mt-0.5">11 days remaining</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} className="text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Word Target</span>
          </div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">1,850 / 3,000 words</p>
          <div className="h-1.5 bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "62%" }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function EditorArea({ activeSection }) {
  const section = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0c1117]">
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-4">
            <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 font-bold text-xs" aria-label="Bold">B</button>
            <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 italic text-xs" aria-label="Italic">I</button>
            <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 underline text-xs" aria-label="Underline">U</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400" aria-label="Insert citation">
              <Quote size={12} /> Cite
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400" aria-label="Insert footnote">
              <BookOpen size={12} /> Footnote
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6" style={{ fontFamily: "'Georgia', serif" }}>
            {section.title}
          </h2>
          <div className="prose dark:prose-invert max-w-none" style={{ fontFamily: "'Georgia', serif", fontSize: "16px", lineHeight: 1.8 }}>
            {activeSection === "intro" && (
              <>
                <p className="text-slate-700 dark:text-slate-300">
                  The role of artificial intelligence in modern education has been a subject of intense debate
                  among educators, policymakers, and technologists. As AI-powered tools become increasingly
                  integrated into academic settings, questions arise about their impact on student learning
                  outcomes, critical thinking development, and academic integrity.
                </p>
                <p className="text-slate-700 dark:text-slate-300 mt-4">
                  This essay examines the dual nature of AI in higher education, arguing that while AI tools
                  present legitimate concerns regarding academic honesty, they also offer unprecedented
                  opportunities to enhance personalized learning experiences when implemented with proper
                  institutional frameworks <span className="text-amber-600 dark:text-amber-400 cursor-pointer hover:underline">(Johnson & Lee, 2024)</span>.
                </p>
              </>
            )}
            {activeSection !== "intro" && (
              <p className="text-slate-400 dark:text-slate-500 italic">
                Start writing your {section.title.toLowerCase()} here...
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>1,850 Words</span>
          <span>5 Citations</span>
          <span className="flex items-center gap-1"><Clock size={11} /> Reading: 7 min</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-medium">APA 7th</span>
          <span>62% of word target</span>
        </div>
      </div>
    </main>
  );
}

function AIAssignmentPanel({ showPanel, onToggle }) {
  const [aiTab, setAiTab] = useState("rubric");
  const totalScore = RUBRIC_ITEMS.reduce((sum, r) => sum + r.score, 0);
  const maxScore = RUBRIC_ITEMS.reduce((sum, r) => sum + r.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  return (
    <>
      {!showPanel && (
        <button
          onClick={onToggle}
          className="absolute right-4 top-20 z-20 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700"
          aria-label="Open assignment tools panel"
        >
          <PanelRightOpen size={14} />
        </button>
      )}
      <AnimatePresence>
        {showPanel && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#101922] border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shrink-0"
          >
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex-1 mr-2">
                {["rubric", "integrity", "ai"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAiTab(tab)}
                    className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md flex-1 transition-all ${
                      aiTab === tab
                        ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab === "rubric" ? "Rubric" : tab === "integrity" ? "Integrity" : "AI Help"}
                  </button>
                ))}
              </div>
              <button onClick={onToggle} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" aria-label="Close panel">
                <PanelRightClose size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiTab === "rubric" && (
                <>
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">{totalScore}/{maxScore}</div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Estimated Rubric Score ({percentage}%)</div>
                    <div className="h-2 bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {RUBRIC_ITEMS.map((item) => {
                      const pct = (item.score / item.maxScore) * 100;
                      return (
                        <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.criterion}</span>
                            <span className={`text-xs font-bold ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                              {item.score}/{item.maxScore}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                            <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.feedback}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {aiTab === "integrity" && (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30 text-center">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Integrity Score: 94%</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Your work appears original</p>
                  </div>
                  {[
                    { label: "Plagiarism Check", score: "3% similarity", status: "pass", icon: ShieldCheck },
                    { label: "AI Detection", score: "96% human", status: "pass", icon: ClipboardCheck },
                    { label: "Citation Accuracy", score: "4 of 5 verified", status: "warn", icon: Quote },
                    { label: "Grammar Score", score: "87/100", status: "pass", icon: FileText },
                  ].map((check) => {
                    const Icon = check.icon;
                    return (
                      <div key={check.label} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${check.status === "pass" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                          <Icon size={14} className={check.status === "pass" ? "text-emerald-600" : "text-amber-600"} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{check.label}</p>
                          <p className="text-[10px] text-slate-500">{check.score}</p>
                        </div>
                        {check.status === "pass" ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <AlertTriangle size={14} className="text-amber-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {aiTab === "ai" && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Assignment Assistant</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      I can help strengthen your arguments, improve your thesis statement, suggest additional sources, or check your work against the rubric criteria.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {["Strengthen my thesis", "Find supporting evidence", "Improve transitions", "Check rubric alignment", "Fix citations"].map((suggestion) => (
                      <button
                        key={suggestion}
                        className="w-full text-left px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask AI about your assignment..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  aria-label="Ask assignment AI assistant"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md" aria-label="Send message">
                  <Send size={10} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AssignmentWriteView({ bookTitle, project, tabMode }) {
  const [activeSection, setActiveSection] = useState("intro");
  const [showAIPanel, setShowAIPanel] = useState(true);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <SectionSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <EditorArea activeSection={activeSection} />
      <AIAssignmentPanel showPanel={showAIPanel} onToggle={() => setShowAIPanel(!showAIPanel)} />
    </div>
  );
}
