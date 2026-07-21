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
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[3px] p-4 space-y-3 relative overflow-hidden group hover:border-[var(--color-line)] transition-all">
        <div className="flex justify-between items-center text-[var(--color-ink-2)]">
          <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[var(--color-ink-2)]">Total Entities</span>
          <div className="p-2 bg-[var(--color-safe-tint)] rounded-[3px] border border-[var(--color-line)] text-[var(--color-safe)]">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-semibold text-[var(--color-ink)] font-display">{summary.totalNodes}</span>
          <span className="text-xs text-[var(--color-ink-3)] ml-2 font-mono font-medium">({summary.totalEdges} edges)</span>
        </div>
        <p className="text-[10px] text-[var(--color-ink-3)] font-mono">Active graph topology nodes</p>
      </div>

      {/* Fraud Rings Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[3px] p-4 space-y-3 relative overflow-hidden group hover:border-[var(--color-line)] transition-all">
        <div className="flex justify-between items-center text-[var(--color-ink-2)]">
          <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[var(--color-ink-2)]">Fraud Rings</span>
          <div className="p-2 bg-[var(--color-critical-tint)] rounded-[3px] border border-[var(--color-line)] text-[var(--color-critical)]">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-semibold text-[var(--color-critical)] font-display">{summary.fraudRingsCount}</span>
          <span className="text-xs text-[var(--color-ink-3)] ml-2 font-mono font-medium">syndicates</span>
        </div>
        <p className="text-[10px] text-[var(--color-ink-3)] font-mono">Isolated criminal clusters</p>
      </div>

      {/* Critical Targets Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[3px] p-4 space-y-3 relative overflow-hidden group hover:border-[var(--color-line)] transition-all">
        <div className="flex justify-between items-center text-[var(--color-ink-2)]">
          <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[var(--color-ink-2)]">Critical Targets</span>
          <div className="p-2 bg-[var(--color-navy-tint)] rounded-[3px] border border-[var(--color-line)] text-[var(--color-navy)]">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-3xl font-semibold text-[var(--color-navy)] font-display">{summary.criticalTargetsCount}</span>
          <span className="text-xs text-[var(--color-ink-3)] ml-2 font-mono font-medium">bottlenecks</span>
        </div>
        <p className="text-[10px] text-[var(--color-ink-3)] font-mono">Ranked for freeze directives</p>
      </div>

      {/* Flagged Volume Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[3px] p-4 space-y-3 relative overflow-hidden group hover:border-[var(--color-line)] transition-all">
        <div className="flex justify-between items-center text-[var(--color-ink-2)]">
          <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[var(--color-ink-2)]">Flagged Volume</span>
          <div className="p-2 bg-[var(--color-safe-tint)] rounded-[3px] border border-[var(--color-line)] text-[var(--color-safe)]">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-semibold text-[var(--color-safe)] font-display">{formatAmount(summary.totalFlaggedAmount)}</span>
        </div>
        <p className="text-[10px] text-[var(--color-ink-3)] font-mono">Total money laundering flow</p>
      </div>
    </div>
  );
}
