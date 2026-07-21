import React from "react";
import { MapPin, Lock, Shield, AlertCircle, Coins, Activity } from "lucide-react";
import { JaalNode } from "../../types/jaal";

interface InspectorPanelProps {
  node: JaalNode | null;
  onEnforceAction: (node: JaalNode, action: string) => void;
}

export function InspectorPanel({ node, onEnforceAction }: InspectorPanelProps) {
  if (!node) {
    return (
      <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-6 flex flex-col items-center justify-center text-center space-y-2 min-h-[420px]">
        <AlertCircle className="w-8 h-8 text-[var(--color-ink-3)]" />
        <p className="text-xs text-[var(--color-ink-2)] font-semibold">No Entity Selected</p>
        <p className="text-[10px] text-[var(--color-ink-3)] font-mono">Click a node on the network graph to inspect entity details.</p>
      </div>
    );
  }

  const formatAmount = (num: number) => {
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakhs`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-[var(--color-critical-tint)] text-[var(--color-critical)] border-[var(--color-line)] shadow-sm";
      case "HIGH":
        return "bg-[var(--color-navy-tint)] text-[var(--color-navy)] border-[var(--color-line)] shadow-sm";
      default:
        return "bg-[var(--color-safe-tint)] text-[var(--color-safe)] border-[var(--color-line)] shadow-sm";
    }
  };

  return (
    <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5 space-y-4" id="entity-inspector">
      {/* Header & Risk Level */}
      <div className="flex justify-between items-start border-b border-[var(--color-line)] pb-3">
        <div className="space-y-0.5">
          <span className="text-[9px] font-mono text-[var(--color-ink-3)] uppercase tracking-wider font-semibold">Entity Audit Panel</span>
          <h4 className="font-semibold text-[var(--color-ink)] text-base leading-snug">{node.label}</h4>
          <span className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase block">ID: {node.id} • Category: {node.entityCategory}</span>
        </div>
        <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border ${getRiskBadge(node.riskLevel)}`}>
          {node.riskLevel} ({node.riskScore}%)
        </span>
      </div>

      {/* Grid of Key Attributes */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-2.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] space-y-0.5">
          <span className="text-[var(--color-ink-3)] block text-[9px] font-mono uppercase">Location</span>
          <span className="text-[var(--color-ink)] font-semibold flex items-center gap-1 text-[11px]">
            <MapPin className="w-3 h-3 text-[var(--color-ink-3)] shrink-0" />
            {node.details.location}
          </span>
        </div>

        <div className="p-2.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] space-y-0.5">
          <span className="text-[var(--color-ink-3)] block text-[9px] font-mono uppercase">Money Traced</span>
          <span className="text-[var(--color-navy)] font-semibold block text-[11px] font-mono">
            {formatAmount(node.details.totalValue)}
          </span>
        </div>

        <div className="p-2.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] space-y-0.5">
          <span className="text-[var(--color-ink-3)] block text-[9px] font-mono uppercase">Degree Centrality</span>
          <span className="text-[var(--color-ink-2)] block font-mono text-[11px] font-semibold">
            {node.metrics.degree} edges ({node.metrics.inDegree} in / {node.metrics.outDegree} out)
          </span>
        </div>

        <div className="p-2.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] space-y-0.5">
          <span className="text-[var(--color-ink-3)] block text-[9px] font-mono uppercase">Flagged Date</span>
          <span className="text-[var(--color-ink-2)] block font-mono text-[11px] font-medium">{node.details.flaggedDate}</span>
        </div>
      </div>

      {/* Intelligence Notes */}
      <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] space-y-1">
        <span className="text-[9px] font-mono text-[var(--color-ink-2)] uppercase block font-semibold">Intelligence Notes</span>
        <p className="text-[11px] text-[var(--color-ink-2)] leading-relaxed font-sans">{node.details.reason}</p>
      </div>

      {/* Freeze Status Warning */}
      {node.isFrozen && (
        <div className="p-2.5 bg-[var(--color-critical-tint)] border border-[var(--color-line)] rounded-[3px] flex items-center gap-2 text-[var(--color-critical)] text-xs font-semibold">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Entity Frozen by Enforcement Warrant</span>
        </div>
      )}

      {/* Simplified Enforcement Action Buttons */}
      <div className="space-y-2 border-t border-[var(--color-line)] pt-3">
        <span className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase block mb-1 font-semibold">Recommended Actions</span>

        <button
          onClick={() => onEnforceAction(node, "FREEZE_BANK_ACCOUNT")}
          disabled={node.isFrozen}
          className="w-full text-left p-2.5 bg-[var(--color-critical-tint)] hover:bg-[var(--color-critical-tint)] disabled:bg-[var(--color-surface-2)] text-[var(--color-critical)] disabled:text-[var(--color-ink-3)] border border-[var(--color-line)] disabled:border-[var(--color-line)] rounded-[3px] text-xs font-semibold flex items-center justify-between transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <span>{node.isFrozen ? "Account Frozen" : "Freeze Account"}</span>
          <Lock className="w-3.5 h-3.5 text-[var(--color-critical)]" />
        </button>

        <button
          onClick={() => onEnforceAction(node, "SUSPEND_UPI")}
          disabled={node.isFrozen}
          className="w-full text-left p-2.5 bg-[var(--color-navy-tint)] hover:bg-[var(--color-navy-tint)] disabled:bg-[var(--color-surface-2)] text-[var(--color-navy)] disabled:text-[var(--color-ink-3)] border border-[var(--color-line)] disabled:border-[var(--color-line)] rounded-[3px] text-xs font-semibold flex items-center justify-between transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Suspend UPI</span>
          <Coins className="w-3.5 h-3.5 text-[var(--color-navy)]" />
        </button>

        <button
          onClick={() => onEnforceAction(node, "BLOCK_IMEI_SIM")}
          className="w-full text-left p-2.5 bg-[var(--color-paper)] hover:bg-[var(--color-surface-2)] text-[var(--color-ink-2)] border border-[var(--color-line)] rounded-[3px] text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
        >
          <span>Block Device</span>
          <Shield className="w-3.5 h-3.5 text-[var(--color-ink-2)]" />
        </button>
      </div>
    </div>
  );
}
