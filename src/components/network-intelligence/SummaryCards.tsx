import React from "react";
import { Users, ShieldAlert, Target, Coins } from "lucide-react";
import { JaalSummary } from "../../types/jaal";

interface SummaryCardsProps {
  summary: JaalSummary | null;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null;

  const formatAmount = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${num.toLocaleString("en-IN")}`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="jaal-summary-cards">
      {/* Total Entities Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
        <div className="flex justify-between items-center text-slate-400">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Total Entities</span>
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-black text-slate-100 font-display">{summary.totalNodes}</span>
          <span className="text-xs text-slate-500 ml-2 font-mono font-medium">({summary.totalEdges} edges)</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">Active graph topology nodes</p>
      </div>

      {/* Fraud Rings Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
        <div className="flex justify-between items-center text-slate-400">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Fraud Rings</span>
          <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-black text-rose-400 font-display">{summary.fraudRingsCount}</span>
          <span className="text-xs text-slate-500 ml-2 font-mono font-medium">syndicates</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">Isolated criminal clusters</p>
      </div>

      {/* Critical Targets Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
        <div className="flex justify-between items-center text-slate-400">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Critical Targets</span>
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-black text-amber-400 font-display">{summary.criticalTargetsCount}</span>
          <span className="text-xs text-slate-500 ml-2 font-mono font-medium">bottlenecks</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">Ranked for freeze directives</p>
      </div>

      {/* Flagged Volume Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
        <div className="flex justify-between items-center text-slate-400">
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Flagged Volume</span>
          <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 text-teal-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-emerald-400 font-display">{formatAmount(summary.totalFlaggedAmount)}</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">Total money laundering flow</p>
      </div>
    </div>
  );
}
