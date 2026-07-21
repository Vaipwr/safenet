import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-[400px] bg-slate-900 border border-rose-500/30 rounded-2xl p-10 flex flex-col items-center justify-center space-y-4 text-center">
      <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-400">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-md">
        <h4 className="text-base font-bold text-slate-100">Failed to Load Graph Data</h4>
        <p className="text-xs text-slate-400 font-mono">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
      >
        <RefreshCw className="w-4 h-4 text-emerald-400" />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
