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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 min-h-[420px] shadow-xl">
        <AlertCircle className="w-8 h-8 text-slate-600" />
        <p className="text-xs text-slate-400 font-semibold">No Entity Selected</p>
        <p className="text-[10px] text-slate-500 font-mono">Click a node on the network graph to inspect entity details.</p>
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
        return "bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm";
      case "HIGH":
        return "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl" id="entity-inspector">
      {/* Header & Risk Level */}
      <div className="flex justify-between items-start border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Entity Audit Panel</span>
          <h4 className="font-extrabold text-slate-100 text-base leading-snug">{node.label}</h4>
          <span className="text-[10px] font-mono text-slate-400 uppercase block">ID: {node.id} • Category: {node.entityCategory}</span>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${getRiskBadge(node.riskLevel)}`}>
          {node.riskLevel} ({node.riskScore}%)
        </span>
      </div>

      {/* Grid of Key Attributes */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-0.5">
          <span className="text-slate-500 block text-[9px] font-mono uppercase">Location</span>
          <span className="text-slate-200 font-semibold flex items-center gap-1 text-[11px]">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            {node.details.location}
          </span>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-0.5">
          <span className="text-slate-500 block text-[9px] font-mono uppercase">Money Traced</span>
          <span className="text-amber-400 font-bold block text-[11px] font-mono">
            {formatAmount(node.details.totalValue)}
          </span>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-0.5">
          <span className="text-slate-500 block text-[9px] font-mono uppercase">Degree Centrality</span>
          <span className="text-slate-300 block font-mono text-[11px] font-semibold">
            {node.metrics.degree} edges ({node.metrics.inDegree} in / {node.metrics.outDegree} out)
          </span>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-0.5">
          <span className="text-slate-500 block text-[9px] font-mono uppercase">Flagged Date</span>
          <span className="text-slate-300 block font-mono text-[11px] font-medium">{node.details.flaggedDate}</span>
        </div>
      </div>

      {/* Intelligence Notes */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
        <span className="text-[9px] font-mono text-slate-400 uppercase block font-semibold">Intelligence Notes</span>
        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{node.details.reason}</p>
      </div>

      {/* Freeze Status Warning */}
      {node.isFrozen && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs font-bold">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Entity Frozen by Enforcement Warrant</span>
        </div>
      )}

      {/* Simplified Enforcement Action Buttons */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1 font-semibold">Recommended Actions</span>

        <button
          onClick={() => onEnforceAction(node, "FREEZE_BANK_ACCOUNT")}
          disabled={node.isFrozen}
          className="w-full text-left p-2.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:bg-slate-800 text-rose-400 disabled:text-slate-500 border border-rose-500/30 disabled:border-slate-800 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <span>{node.isFrozen ? "Account Frozen" : "Freeze Account"}</span>
          <Lock className="w-3.5 h-3.5 text-rose-400" />
        </button>

        <button
          onClick={() => onEnforceAction(node, "SUSPEND_UPI")}
          disabled={node.isFrozen}
          className="w-full text-left p-2.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-slate-800 text-amber-400 disabled:text-slate-500 border border-amber-500/30 disabled:border-slate-800 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Suspend UPI</span>
          <Coins className="w-3.5 h-3.5 text-amber-400" />
        </button>

        <button
          onClick={() => onEnforceAction(node, "BLOCK_IMEI_SIM")}
          className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
        >
          <span>Block Device</span>
          <Shield className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
