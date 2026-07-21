import React from "react";
import { ShieldAlert, Users, MapPin, Layers } from "lucide-react";
import { JaalFraudRing } from "../../types/jaal";

interface FraudRingPanelProps {
  rings: JaalFraudRing[];
  onSelectRingNodes?: (nodeIds: string[]) => void;
}

export function FraudRingPanel({ rings }: FraudRingPanelProps) {
  const formatAmount = (num: number) => {
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakhs`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-[var(--color-line)]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[var(--color-critical)]" />
          <h3 className="font-semibold text-[var(--color-ink)] text-sm">Detected Fraud Rings & Syndicates</h3>
        </div>
        <span className="text-[10px] font-mono text-[var(--color-ink-3)]">{rings.length} Clusters Isolated</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rings.map((ring) => (
          <div
            key={ring.id}
            className="bg-[var(--color-paper)] border border-[var(--color-line)] hover:border-[var(--color-line)] rounded-[3px] p-4 space-y-3 transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono text-[var(--color-ink-3)] uppercase">{ring.id} • {ring.type}</span>
                <h4 className="font-semibold text-[var(--color-ink)] text-sm mt-0.5">{ring.name}</h4>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                ring.severity === "CRITICAL"
                  ? "bg-[var(--color-critical-tint)] text-[var(--color-critical)] border-[var(--color-line)]"
                  : "bg-[var(--color-navy-tint)] text-[var(--color-navy)] border-[var(--color-line)]"
              }`}>
                {ring.severity}
              </span>
            </div>

            <p className="text-xs text-[var(--color-ink-2)] leading-relaxed">{ring.description}</p>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--color-line)] text-[10px]">
              <div>
                <span className="text-[var(--color-ink-3)] block font-mono">Members</span>
                <span className="text-[var(--color-ink-2)] font-semibold flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3 text-[var(--color-ink-3)]" />
                  {ring.statistics.nodeCount} nodes
                </span>
              </div>

              <div>
                <span className="text-[var(--color-ink-3)] block font-mono">Laundering Flow</span>
                <span className="text-[var(--color-navy)] font-semibold mt-0.5 block font-mono">
                  {formatAmount(ring.totalMuleVolume)}
                </span>
              </div>

              <div>
                <span className="text-[var(--color-ink-3)] block font-mono">Operating Hub</span>
                <span className="text-[var(--color-ink-2)] font-medium flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-[var(--color-ink-3)] shrink-0" />
                  {ring.primaryLocation}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
