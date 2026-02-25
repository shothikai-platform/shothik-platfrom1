"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Server } from "lucide-react";

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

export function BackendStatusIndicator() {
  const [status, setStatus] = useState("checking");
  const rawEnv = process.env.NEXT_PUBLIC_WRITING_STUDIO_API_URL || "";
  const isSelfHosted = rawEnv === "self";
  const backendUrl = isSelfHosted ? "" : rawEnv;

  useEffect(() => {
    if (!backendUrl && !isSelfHosted) {
      setStatus("disabled");
      return;
    }

    const checkHealth = async () => {
      try {
        const healthUrl = isSelfHosted ? "/api/health" : `${backendUrl}/api/health`;
        const response = await fetch(healthUrl, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        setStatus(response.ok ? "connected" : "error");
      } catch {
        setStatus("error");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [backendUrl, isSelfHosted]);

  const statusConfig = {
    checking: {
      icon: Server,
      label: "Checking...",
      color: "text-muted-foreground",
      dot: "bg-muted-foreground",
    },
    connected: {
      icon: Wifi,
      label: "LaTeX Backend Connected",
      color: "text-green-600 dark:text-green-400",
      dot: "bg-green-500",
    },
    error: {
      icon: WifiOff,
      label: "LaTeX Backend Offline",
      color: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    disabled: {
      icon: WifiOff,
      label: "LaTeX Backend Not Configured",
      color: "text-muted-foreground",
      dot: "bg-muted-foreground/50",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springTransition}
      className="flex items-center gap-1.5"
    >
      <div className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      <span className={cn("text-[10px]", config.color)}>{config.label}</span>
    </motion.div>
  );
}

export default BackendStatusIndicator;
