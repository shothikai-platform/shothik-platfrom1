"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  BookOpen,
  FlaskConical,
  BarChart3,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Send,
  Quote,
  Link2,
  ExternalLink,
  Sparkles,
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

const SECTIONS = [
  { id: "abstract", title: "Abstract", icon: FileText, status: "complete" },
  { id: "intro", title: "Introduction", icon: BookOpen, status: "in_progress" },
  { id: "lit-review", title: "Literature Review", icon: Search, status: "in_progress" },
  { id: "methodology", title: "Methodology", icon: FlaskConical, status: "not_started" },
  { id: "results", title: "Results", icon: BarChart3, status: "not_started" },
  { id: "discussion", title: "Discussion", icon: MessageSquare, status: "not_started" },
  { id: "conclusion", title: "Conclusion", icon: Target, status: "not_started" },
  { id: "references", title: "References", icon: Quote, status: "not_started" },
];

const STATUS_COLORS = {
  complete: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", label: "Complete" },
  in_progress: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "In Progress" },
  not_started: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-400 dark:text-slate-500", label: "Not Started" },
};

const SAMPLE_CITATIONS = [
  { id: 1, authors: "Kumar, S. et al.", year: 2024, title: "Deep Learning Approaches for Edge Computing Optimization", journal: "IEEE Trans. Neural Networks", doi: "10.1109/TNN.2024.001", cited: 47 },
  { id: 2, authors: "Chen, L. & Wang, R.", year: 2023, title: "Federated Learning in Resource-Constrained Environments", journal: "ACM Computing Surveys", doi: "10.1145/CS.2023.042", cited: 89 },
  { id: 3, authors: "Patel, A. et al.", year: 2024, title: "Energy-Efficient Neural Architecture Search", journal: "Nature Machine Intelligence", doi: "10.1038/NMI.2024.015", cited: 32 },
];

function SectionSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="w-64 bg-white dark:bg-[#101922] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sections</h3>
          <span className="text-[10px] text-slate-400">2/8</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "25%" }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const status = STATUS_COLORS[section.status];
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
              }`}
              aria-label={`Go to ${section.title}`}
            >
              <GripVertical size={12} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
              <Icon size={14} className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} />
              <span className={`text-xs font-medium flex-1 ${isActive ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>
                {section.title}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                section.status === "complete" ? "bg-emerald-500" :
                section.status === "in_progress" ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
              }`} />
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} className="text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Target Journal</span>
          </div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">IEEE Trans. Neural Networks</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Word limit: 8,000</p>
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
            <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400" aria-label="Insert equation">
              <span className="font-mono text-[10px]">∑</span> Equation
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400" aria-label="Insert figure">
              <BarChart3 size={12} /> Figure
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
            {activeSection === "abstract" && (
              <p className="text-slate-700 dark:text-slate-300">
                This paper presents a novel approach to optimizing deep learning models for edge computing environments.
                We propose a hybrid architecture that combines federated learning with neural architecture search to
                achieve state-of-the-art performance while maintaining energy efficiency. Our experimental results
                demonstrate a 40% reduction in computational overhead with only a 2% decrease in model accuracy
                across benchmark datasets. The implications of this work extend to real-world IoT deployments
                in resource-constrained settings.
              </p>
            )}
            {activeSection === "intro" && (
              <>
                <p className="text-slate-700 dark:text-slate-300">
                  The proliferation of Internet of Things (IoT) devices has created an unprecedented demand for
                  efficient machine learning models that can operate at the edge of the network. Traditional deep
                  learning approaches, while achieving remarkable accuracy, often require computational resources
                  that exceed the capabilities of edge devices <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">[Kumar et al., 2024]</span>.
                </p>
                <p className="text-slate-700 dark:text-slate-300 mt-4">
                  Recent advances in federated learning have shown promise in distributing the training process
                  across multiple devices <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">[Chen & Wang, 2023]</span>,
                  but the challenge of optimizing model architecture for heterogeneous hardware remains largely unsolved.
                </p>
              </>
            )}
            {!["abstract", "intro"].includes(activeSection) && (
              <p className="text-slate-400 dark:text-slate-500 italic">
                Start writing your {section.title.toLowerCase()} section here...
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>1,245 Words</span>
          <span>12 Citations</span>
          <span className="flex items-center gap-1"><Clock size={11} /> Reading: 5 min</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">APA 7th</span>
          <span>Section {SECTIONS.findIndex((s) => s.id === activeSection) + 1} of {SECTIONS.length}</span>
        </div>
      </div>
    </main>
  );
}

function AIResearchPanel({ showPanel, onToggle }) {
  const [aiTab, setAiTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {!showPanel && (
        <button
          onClick={onToggle}
          className="absolute right-4 top-20 z-20 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700"
          aria-label="Open AI research panel"
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
                {["search", "cite", "ai"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAiTab(tab)}
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md flex-1 transition-all ${
                      aiTab === tab
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab === "search" ? "Search" : tab === "cite" ? "Cite" : "AI Help"}
                  </button>
                ))}
              </div>
              <button onClick={onToggle} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" aria-label="Close panel">
                <PanelRightClose size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiTab === "search" && (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Semantic Scholar..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                      aria-label="Search academic papers"
                    />
                  </div>
                  <div className="space-y-2">
                    {SAMPLE_CITATIONS.map((paper) => (
                      <div key={paper.id} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed mb-1">{paper.title}</h4>
                        <p className="text-[10px] text-slate-500">{paper.authors} ({paper.year})</p>
                        <p className="text-[10px] text-slate-400 italic">{paper.journal}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400">Cited by {paper.cited}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50" aria-label="Add citation">
                              + Cite
                            </button>
                            <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded" aria-label="Open paper">
                              <ExternalLink size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {aiTab === "cite" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your citations (12 total)</p>
                  {SAMPLE_CITATIONS.map((paper) => (
                    <div key={paper.id} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {paper.authors} ({paper.year}). {paper.title}. <em>{paper.journal}</em>.
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">DOI: {paper.doi}</p>
                    </div>
                  ))}
                </div>
              )}

              {aiTab === "ai" && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">AI Research Assistant</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      I can help you strengthen your introduction by finding supporting evidence, suggest methodology improvements, or help write your literature review based on your cited papers.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {["Expand literature review", "Improve methodology", "Check argument flow", "Suggest missing citations"].map((suggestion) => (
                      <button
                        key={suggestion}
                        className="w-full text-left px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
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
                  placeholder="Ask AI about your research..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  aria-label="Ask AI research assistant"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md" aria-label="Send message">
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

export default function ResearchPaperWriteView({ bookTitle, project, tabMode }) {
  const [activeSection, setActiveSection] = useState("intro");
  const [showAIPanel, setShowAIPanel] = useState(true);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <SectionSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <EditorArea activeSection={activeSection} />
      <AIResearchPanel showPanel={showAIPanel} onToggle={() => setShowAIPanel(!showAIPanel)} />
    </div>
  );
}
