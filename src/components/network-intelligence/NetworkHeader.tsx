import React from "react";
import { Shield, Sparkles, RefreshCw } from "lucide-react";
import { RiskLevel, JaalDisruptionSummary } from "../../types/jaal";

interface NetworkHeaderProps {
  threatLevel: RiskLevel;
  disruptionSummary?: JaalDisruptionSummary | null;
  onResetSimulation?: () => void;
}

export function NetworkHeader({ threatLevel, disruptionSummary, onResetSimulation }: NetworkHeaderProps) {
  const getBadgeStyle = (level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/10";
      case "HIGH":
        return "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10";
      case "MEDIUM":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/40";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10";
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-900">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 font-display flex items-center gap-2.5">
              <span>Network Intelligence</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                JAAL Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Graph-Based Threat Intelligence & Criminal Syndicate Disruption
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {onResetSimulation && (
          <button
            onClick={onResetSimulation}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Reload baseline network graph"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset Network</span>
          </button>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 text-slate-300 rounded-lg border border-slate-800 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold">Threat Intelligence</span>
          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
            Demo Dataset
          </span>
        </div>

        <div className={`px-4 py-1.5 rounded-xl border text-xs font-mono font-black uppercase tracking-wide flex items-center gap-2 ${getBadgeStyle(threatLevel)}`}>
          <span className={`w-2 h-2 rounded-full ${threatLevel === "LOW" ? "bg-emerald-400" : "bg-rose-500 animate-ping"}`} />
          <span>{threatLevel} THREAT</span>
        </div>
      </div>
    </div>
  );
}
