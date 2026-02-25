"use client";

import { useState } from "react";
import {
  Globe,
  Store,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Lock,
  Loader2,
  BookOpen,
  TrendingUp,
  Zap,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAvailableChannels, isPublishDriveEnabled } from "@/services/publishDriveService";

const CHANNEL_ICONS = {
  google_play: "🔵",
  amazon_kindle: "📦",
  apple_books: "🍎",
  kobo: "📖",
  barnes_noble: "📚",
  scribd: "📜",
  overdrive: "🏛️",
  bibliotheca: "📕",
  tolino: "📱",
  vivlio: "📗",
  dangdang: "🔴",
  "24symbols": "✨",
};

const CATEGORY_LABELS = {
  ebook: { label: "eBook Store", icon: Store, color: "text-blue-500" },
  subscription: { label: "Subscription", icon: TrendingUp, color: "text-purple-500" },
  library: { label: "Library Network", icon: Library, color: "text-amber-500" },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
  live: { label: "Live", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
  failed: { label: "Failed", color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
  removed: { label: "Removed", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500" },
};

function ChannelCard({ channel, bookDistribution, isEnabled }) {
  const dist = bookDistribution?.find((d) => d.channelId === channel.id);
  const status = dist?.status || "pending";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const categoryConfig = CATEGORY_LABELS[channel.category] || CATEGORY_LABELS.ebook;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-slate-900/50 border rounded-xl p-4 transition-all",
        status === "live"
          ? "border-emerald-200 dark:border-emerald-800/30"
          : "border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{CHANNEL_ICONS[channel.id] || "📘"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {channel.name}
            </h4>
            {!isEnabled && (
              <Lock className="h-3 w-3 text-slate-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400">{channel.region}</span>
            <span className="text-[10px] text-slate-300">·</span>
            <span className={cn("text-[10px] font-bold", categoryConfig.color)}>
              {categoryConfig.label}
            </span>
          </div>
        </div>
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0", statusConfig.color)}>
          {isEnabled ? statusConfig.label : "Locked"}
        </span>
      </div>
      {dist?.url && status === "live" && (
        <a
          href={dist.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-2 text-xs text-[#137fec] font-bold hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View on {channel.name}
        </a>
      )}
    </motion.div>
  );
}

export function DistributionManager({ book }) {
  const enabled = isPublishDriveEnabled();
  const channels = getAvailableChannels();
  const [filter, setFilter] = useState("all");

  const bookDistribution = book?.distributionChannels || [];

  const googlePlayChannel = {
    channelId: "google_play",
    channelName: "Google Play Books",
    status: book && book.status === "published" ? "live" : "pending",
    url: book?.googlePlayUrl || undefined,
  };

  const allDistribution = [
    googlePlayChannel,
    ...bookDistribution.filter((d) => d.channelId !== "google_play"),
  ];

  const liveCount = allDistribution.filter((d) => d.status === "live").length;
  const processingCount = allDistribution.filter((d) => d.status === "processing").length;

  const filteredChannels = channels.filter((ch) => {
    if (filter === "all") return true;
    return ch.category === filter;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{liveCount}</p>
          <p className="text-xs text-slate-500">Live Stores</p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{processingCount}</p>
          <p className="text-xs text-slate-500">Processing</p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-slate-600 dark:text-slate-300">{channels.length}</p>
          <p className="text-xs text-slate-500">Available Channels</p>
        </div>
      </div>

      {!enabled && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-200 dark:border-purple-800/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Multi-Store Distribution Coming Soon
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Distribute your books to 400+ stores worldwide including Amazon Kindle, Apple Books, Kobo,
                Barnes & Noble, and 240,000+ libraries via PublishDrive integration. This feature will be
                available next month. Currently, your books are published directly to Google Play Books.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {[
          { id: "all", label: "All Channels" },
          { id: "ebook", label: "eBook Stores" },
          { id: "subscription", label: "Subscription" },
          { id: "library", label: "Libraries" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === f.id
                ? "bg-[#137fec] text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredChannels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            bookDistribution={allDistribution}
            isEnabled={enabled || channel.id === "google_play"}
          />
        ))}
      </div>
    </div>
  );
}
