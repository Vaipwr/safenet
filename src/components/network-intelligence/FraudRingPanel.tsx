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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="font-bold text-slate-100 text-sm">Detected Fraud Rings & Syndicates</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{rings.length} Clusters Isolated</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rings.map((ring) => (
          <div
            key={ring.id}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase">{ring.id} • {ring.type}</span>
                <h4 className="font-bold text-slate-200 text-sm mt-0.5">{ring.name}</h4>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                ring.severity === "CRITICAL"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {ring.severity}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{ring.description}</p>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-900 text-[10px]">
              <div>
                <span className="text-slate-500 block font-mono">Members</span>
                <span className="text-slate-300 font-semibold flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3 text-slate-500" />
                  {ring.statistics.nodeCount} nodes
                </span>
              </div>

              <div>
                <span className="text-slate-500 block font-mono">Laundering Flow</span>
                <span className="text-amber-500 font-bold mt-0.5 block font-mono">
                  {formatAmount(ring.totalMuleVolume)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block font-mono">Operating Hub</span>
                <span className="text-slate-300 font-medium flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
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
