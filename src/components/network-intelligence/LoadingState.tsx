import React from "react";
import { Activity } from "lucide-react";

export function LoadingState() {
  return (
    <div className="min-h-[450px] bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-12 flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-navy)] animate-spin" />
        <Activity className="w-5 h-5 text-[var(--color-safe)] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="text-center space-y-1">
        <h4 className="text-sm font-semibold text-[var(--color-ink)] tracking-tight">Initializing JAAL Graph Engine...</h4>
        <p className="text-xs text-[var(--color-ink-3)] font-mono">Correlating synthetic money laundering trails & multi-entity nodes</p>
      </div>
    </div>
  );
}
