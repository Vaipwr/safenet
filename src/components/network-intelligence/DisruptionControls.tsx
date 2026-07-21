import React from "react";
import { Zap, RefreshCw, Lock, ShieldCheck } from "lucide-react";
import { JaalDisruptionSummary } from "../../types/jaal";

interface DisruptionControlsProps {
  disruptionSummary: JaalDisruptionSummary | null;
  onResetSimulation: () => void;
}

export function DisruptionControls({ disruptionSummary, onResetSimulation }: DisruptionControlsProps) {
  if (!disruptionSummary || disruptionSummary.frozenNodeIds.length === 0) {
    return null;
  }

  const formatAmount = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakhs`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-[var(--color-critical-tint)] border border-[var(--color-line)] rounded-[3px] p-5 space-y-4" id="disruption-controls-panel">
      {/* Header & Reset Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[var(--color-line)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--color-critical-tint)] rounded-[3px] text-[var(--color-critical)] border border-[var(--color-line)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-critical)] font-display flex items-center gap-2">
              <span>Network Disruption Simulation Active</span>
              <span className="text-[10px] font-mono text-[var(--color-critical)] bg-[var(--color-critical-tint)] px-2 py-0.5 rounded-full border border-[var(--color-line)]">
                Warrants Enforced
              </span>
            </h4>
            <p className="text-xs text-[var(--color-ink-2)] font-mono">
              Targeted nodes frozen: <span className="font-semibold text-[var(--color-critical)]">{disruptionSummary.frozenNodeIds.join(", ")}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onResetSimulation}
          className="px-4 py-2 bg-[var(--color-paper)] hover:bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-line)] rounded-[3px] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:border-[var(--color-line)]"
        >
          <RefreshCw className="w-4 h-4 text-[var(--color-safe)]" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Disruption Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Threat Reduction Percentage */}
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-3.5 space-y-1.5">
          <span className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase font-semibold">Threat Capability Reduced</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[var(--color-critical)] font-display">
              {disruptionSummary.networkDisruptionPercentage}%
            </span>
          </div>
          <div className="w-full bg-[var(--color-paper)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--color-critical)] h-2 rounded-full transition-all duration-500"
              style={{ width: `${disruptionSummary.networkDisruptionPercentage}%` }}
            />
          </div>
        </div>

        {/* Illicit Amount Blocked */}
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase font-semibold">Illicit Volume Blocked</span>
          <div className="text-2xl font-semibold text-[var(--color-safe)] font-display">
            {formatAmount(disruptionSummary.blockedVolume)}
          </div>
          <p className="text-[10px] text-[var(--color-ink-3)] font-mono">Secured from laundering flow</p>
        </div>

        {/* Money Trails Severed */}
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase font-semibold">Money Trails Severed</span>
          <div className="text-2xl font-semibold text-[var(--color-navy)] font-display">
            {disruptionSummary.severedEdgeCount} edges
          </div>
          <p className="text-[10px] text-[var(--color-ink-3)] font-mono">Disrupted transfer lines</p>
        </div>

        {/* Syndicates Collapsed */}
        <div className="bg-[var(--color-paper)] border border-purple-500/20 rounded-[3px] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase font-semibold">Syndicates Collapsed</span>
          <div className="text-2xl font-semibold text-[var(--color-navy)] font-display">
            {disruptionSummary.collapsedRingCount} rings
          </div>
          <p className="text-[10px] text-[var(--color-ink-3)] font-mono">Dismantled criminal clusters</p>
        </div>
      </div>
    </div>
  );
}
