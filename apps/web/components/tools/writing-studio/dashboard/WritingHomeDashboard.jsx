"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Star,
  MoreHorizontal,
  Trash2,
  Clock,
  FileText,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { getProjects, deleteProject } from "@/lib/projects-store";
import CreateProjectModal from "./CreateProjectModal";

const TYPE_CONFIG = {
  book: { label: "Book", color: "#137fec", bgColor: "bg-blue-50 dark:bg-blue-950/30", icon: BookOpen },
  research: { label: "Research Paper", color: "#10b981", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", icon: FlaskConical },
  assignment: { label: "Assignment", color: "#f59e0b", bgColor: "bg-amber-50 dark:bg-amber-950/30", icon: GraduationCap },
};

function formatDate(timestamp) {
  if (!timestamp) return "Just now";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWordCount(count) {
  if (!count) return "0 words";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`;
  return `${count} words`;
}

function ProjectCard({ project, onOpen, onDelete, viewMode }) {
  const [showMenu, setShowMenu] = useState(false);
  const config = TYPE_CONFIG[project.type];
  const Icon = config.icon;

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="group flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-[#137fec]/40 hover:shadow-md transition-all cursor-pointer"
        onClick={() => onOpen(project)}
      >
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
          <Icon size={18} style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{project.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{project.template || config.label}</p>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{formatWordCount(project.wordCount)}</span>
        <div className="w-20 hidden sm:block">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${project.progress || 0}%`, backgroundColor: config.color }} />
          </div>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 w-16 text-right hidden sm:block">{formatDate(project.lastEditedAt)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
          aria-label="Project options"
        >
          <MoreHorizontal size={14} />
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50 w-36">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project._id); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full"
              >
                <Trash2 size={12} /> Delete Project
              </button>
            </div>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-[#137fec]/40 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={() => onOpen(project)}
    >
      <div className={`h-2 w-full`} style={{ backgroundColor: config.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
            <Icon size={18} style={{ color: config.color }} />
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.bgColor}`} style={{ color: config.color }}>
              {config.label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
              aria-label="Project options"
            >
              <MoreHorizontal size={14} />
              {showMenu && (
                <div className="absolute right-0 top-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50 w-36">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(project._id); setShowMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full"
                  >
                    <Trash2 size={12} /> Delete Project
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1 truncate">{project.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
          {project.description || `${project.template || config.label} project`}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-3">
          <span className="flex items-center gap-1"><FileText size={11} /> {formatWordCount(project.wordCount)}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(project.lastEditedAt)}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${project.progress || 0}%`, backgroundColor: config.color }} />
        </div>
        <p className="text-[10px] text-slate-400 mt-1 text-right">{project.progress || 0}% complete</p>
      </div>
    </motion.div>
  );
}

export default function WritingHomeDashboard({ onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (filterType !== "all") {
      result = result.filter((p) => p.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
    }
    return result;
  }, [projects, filterType, searchQuery]);

  const stats = useMemo(() => ({
    total: projects.length,
    books: projects.filter((p) => p.type === "book").length,
    papers: projects.filter((p) => p.type === "research").length,
    assignments: projects.filter((p) => p.type === "assignment").length,
    totalWords: projects.reduce((sum, p) => sum + (p.wordCount || 0), 0),
  }), [projects]);

  function handleProjectCreated(project) {
    setProjects(getProjects());
    setShowCreateModal(false);
    onOpenProject(project);
  }

  function handleDelete(id) {
    deleteProject(id);
    setProjects(getProjects());
  }

  return (
    <div className="flex flex-col h-full bg-[#f6f7f8] dark:bg-[#0c1117]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Writing Studio</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.total} project{stats.total !== 1 ? "s" : ""} &middot; {formatWordCount(stats.totalWords)} total
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#137fec] hover:bg-[#1171d4] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
              aria-label="Create new project"
            >
              <Plus size={16} /> New Project
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-[#137fec]/40 rounded-lg outline-none transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                aria-label="Search projects"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              {[
                { value: "all", label: "All" },
                { value: "book", label: "Books" },
                { value: "research", label: "Papers" },
                { value: "assignment", label: "Assignments" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterType === f.value
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                  aria-label={`Filter by ${f.label}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
                aria-label="List view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              {projects.length === 0 ? (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/40 dark:to-slate-900 flex items-center justify-center mb-5">
                    <BookOpen size={32} className="text-[#137fec]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Start your first project</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
                    Create a book, research paper, or university assignment. Each gets its own workspace with the right tools.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#137fec] hover:bg-[#1171d4] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
                  >
                    <Plus size={16} /> Create New Project
                  </motion.button>
                </>
              ) : (
                <>
                  <Search size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No projects match your search</p>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className={viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-2"
              }>
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onOpen={onOpenProject}
                    onDelete={handleDelete}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
