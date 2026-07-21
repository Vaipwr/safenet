import React from "react";
import { Target, Lock, CheckCircle2 } from "lucide-react";
import { JaalRecommendedTarget } from "../../types/jaal";

interface RecommendedTargetsProps {
  targets: JaalRecommendedTarget[];
  frozenNodeIds?: string[];
  onDisruptTarget?: (nodeId: string) => void;
}

export function RecommendedTargets({ targets, frozenNodeIds = [], onDisruptTarget }: RecommendedTargetsProps) {
  const getActionLabel = (action: string) => {
    switch (action) {
      case "FREEZE_BANK_ACCOUNT":
        return "Freeze Account";
      case "SUSPEND_UPI":
        return "Suspend UPI";
      case "BLOCK_IMEI_SIM":
        return "Block Device";
      default:
        return "Enforce Directive";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h3 className="font-extrabold text-slate-100 text-sm">Recommended Enforcement Targets</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Ranked by Centrality Impact</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {targets.map((target) => {
          const isFrozen = frozenNodeIds.includes(target.nodeId);

          return (
            <div
              key={target.nodeId}
              className={`bg-slate-950 border rounded-xl p-4 space-y-3 transition-all ${
                isFrozen ? "border-slate-800 opacity-60" : "border-amber-500/30 hover:border-amber-500/50 shadow-md"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] font-black font-mono flex items-center justify-center">
                    #{target.rank}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs truncate max-w-[170px]">{target.label}</h4>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">ID: {target.nodeId}</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {(target.confidence * 100).toFixed(0)}% Match
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed min-h-[36px] font-sans">{target.disruptionImpact}</p>

              <button
                onClick={() => onDisruptTarget && onDisruptTarget(target.nodeId)}
                disabled={isFrozen}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isFrozen
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg"
                }`}
              >
                {isFrozen ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Target Frozen</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{getActionLabel(target.actionType)}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
