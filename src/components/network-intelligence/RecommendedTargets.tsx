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
    <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-[var(--color-line)]">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[var(--color-navy)]" />
          <h3 className="font-semibold text-[var(--color-ink)] text-sm">Recommended Enforcement Targets</h3>
        </div>
        <span className="text-[10px] font-mono text-[var(--color-ink-3)]">Ranked by Centrality Impact</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {targets.map((target) => {
          const isFrozen = frozenNodeIds.includes(target.nodeId);

          return (
            <div
              key={target.nodeId}
              className={`bg-[var(--color-paper)] border rounded-[3px] p-4 space-y-3 transition-all ${
                isFrozen ? "border-[var(--color-line)] opacity-60" : "border-[var(--color-line)] hover:border-[var(--color-line)]"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-navy-tint)] border border-[var(--color-line)] text-[var(--color-navy)] text-[10px] font-semibold font-mono flex items-center justify-center">
                    #{target.rank}
                  </span>
                  <div>
                    <h4 className="font-semibold text-[var(--color-ink)] text-xs truncate max-w-[170px]">{target.label}</h4>
                    <span className="text-[9px] font-mono text-[var(--color-ink-3)] uppercase">ID: {target.nodeId}</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-[var(--color-navy)] font-semibold bg-[var(--color-navy-tint)] px-2 py-0.5 rounded-full border border-[var(--color-line)]">
                  {(target.confidence * 100).toFixed(0)}% Match
                </span>
              </div>

              <p className="text-[11px] text-[var(--color-ink-2)] leading-relaxed min-h-[36px] font-sans">{target.disruptionImpact}</p>

              <button
                onClick={() => onDisruptTarget && onDisruptTarget(target.nodeId)}
                disabled={isFrozen}
                className={`w-full py-2 px-3 rounded-[3px] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isFrozen
                    ? "bg-[var(--color-surface-2)] text-[var(--color-ink-3)] border border-[var(--color-line)] cursor-not-allowed"
                    : "bg-[var(--color-navy)] hover:bg-[var(--color-navy-hover)] text-white"
                }`}
              >
                {isFrozen ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-safe)]" />
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
