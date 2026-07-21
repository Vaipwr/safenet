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
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 space-y-4 shadow-xl" id="disruption-controls-panel">
      {/* Header & Reset Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/30 shadow-inner">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-rose-400 font-display flex items-center gap-2">
              <span>Network Disruption Simulation Active</span>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                Warrants Enforced
              </span>
            </h4>
            <p className="text-xs text-slate-300 font-mono">
              Targeted nodes frozen: <span className="font-bold text-rose-300">{disruptionSummary.frozenNodeIds.join(", ")}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onResetSimulation}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0 hover:border-slate-600"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Disruption Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Threat Reduction Percentage */}
        <div className="bg-slate-950/80 border border-rose-500/20 rounded-xl p-3.5 space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Threat Capability Reduced</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-display">
              {disruptionSummary.networkDisruptionPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${disruptionSummary.networkDisruptionPercentage}%` }}
            />
          </div>
        </div>

        {/* Illicit Amount Blocked */}
        <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Illicit Volume Blocked</span>
          <div className="text-2xl font-black text-emerald-400 font-display">
            {formatAmount(disruptionSummary.blockedVolume)}
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Secured from laundering flow</p>
        </div>

        {/* Money Trails Severed */}
        <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Money Trails Severed</span>
          <div className="text-2xl font-black text-amber-400 font-display">
            {disruptionSummary.severedEdgeCount} edges
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Disrupted transfer lines</p>
        </div>

        {/* Syndicates Collapsed */}
        <div className="bg-slate-950/80 border border-purple-500/20 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Syndicates Collapsed</span>
          <div className="text-2xl font-black text-purple-400 font-display">
            {disruptionSummary.collapsedRingCount} rings
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Dismantled criminal clusters</p>
        </div>
      </div>
    </div>
  );
}
