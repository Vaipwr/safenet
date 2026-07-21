import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-[400px] bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-10 flex flex-col items-center justify-center space-y-4 text-center">
      <div className="p-3 bg-[var(--color-critical-tint)] rounded-full border border-[var(--color-line)] text-[var(--color-critical)]">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-base font-semibold text-[var(--color-ink)]">Failed to Load Graph Data</h4>
        <p className="text-xs text-[var(--color-ink-2)] font-mono">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] text-[var(--color-ink)] font-semibold rounded-[3px] text-xs transition-all flex items-center gap-2 cursor-pointer border border-[var(--color-line)]"
      >
        <RefreshCw className="w-4 h-4 text-[var(--color-safe)]" />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
