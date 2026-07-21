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
        return "bg-[var(--color-critical-tint)] text-[var(--color-critical)] border-[var(--color-line)]";
      case "HIGH":
        return "bg-[var(--color-navy-tint)] text-[var(--color-navy)] border-[var(--color-line)]";
      case "MEDIUM":
        return "bg-[var(--color-medium-tint)] text-[var(--color-medium)] border-yellow-500/40";
      default:
        return "bg-[var(--color-safe-tint)] text-[var(--color-safe)] border-[var(--color-line)]";
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-[var(--color-line)]">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--color-safe-tint)] rounded-[3px] border border-[var(--color-line)] text-[var(--color-safe)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] font-display flex items-center gap-2.5">
              <span>Network Intelligence</span>
              <span className="text-xs font-mono font-semibold text-[var(--color-navy)] bg-[var(--color-navy-tint)] px-2.5 py-0.5 rounded-full border border-[var(--color-line)]">
                JAAL Engine
              </span>
            </h2>
            <p className="text-xs text-[var(--color-ink-2)] font-mono">
              Graph-Based Threat Intelligence & Criminal Syndicate Disruption
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {onResetSimulation && (
          <button
            onClick={onResetSimulation}
            className="px-3.5 py-1.5 bg-[var(--color-paper)] hover:bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-line)] hover:border-[var(--color-line)] rounded-[3px] text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reload baseline network graph"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[var(--color-safe)]" />
            <span>Reset Network</span>
          </button>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-ink-2)] rounded-[3px] border border-[var(--color-line)] text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-navy)]" />
          <span className="font-semibold">Threat Intelligence</span>
          <span className="text-[9px] bg-[var(--color-surface-2)] text-[var(--color-ink-2)] px-1.5 py-0.2 rounded border border-[var(--color-line)]">
            Demo Dataset
          </span>
        </div>

        <div className={`px-4 py-1.5 rounded-[3px] border text-xs font-mono font-semibold uppercase tracking-wide flex items-center gap-2 ${getBadgeStyle(threatLevel)}`}>
          <span className={`w-2 h-2 rounded-full ${threatLevel === "LOW" ? "bg-[var(--color-safe)]" : "bg-[var(--color-critical)]"}`} />
          <span>{threatLevel} THREAT</span>
        </div>
      </div>
    </div>
  );
}
