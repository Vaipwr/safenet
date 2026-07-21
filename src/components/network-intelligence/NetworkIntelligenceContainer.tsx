import React, { useState } from "react";
import { useJaalGraph } from "./hooks/useJaalGraph";
import { NetworkHeader } from "./NetworkHeader";
import { SummaryCards } from "./SummaryCards";
import { NetworkCanvas } from "./NetworkCanvas";
import { InspectorPanel } from "./InspectorPanel";
import { FraudRingPanel } from "./FraudRingPanel";
import { RecommendedTargets } from "./RecommendedTargets";
import { DisruptionControls } from "./DisruptionControls";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { JaalNode } from "../../types/jaal";
import { Search, Play } from "lucide-react";

interface NetworkIntelligenceContainerProps {
  onAddAuditLog: (msg: string) => void;
}

export function NetworkIntelligenceContainer({ onAddAuditLog }: NetworkIntelligenceContainerProps) {
  const {
    isLoading,
    error,
    graphState,
    selectedNodeId,
    selectedNode,
    frozenNodeIds,
    selectNodeId,
    refetchGraph,
    disruptNodes,
    resetDisruption
  } = useJaalGraph(onAddAuditLog);

  const [suspectQuery, setSuspectQuery] = useState("");
  const [suspectType, setSuspectType] = useState("upi");

  const handleEnforceAction = (node: JaalNode, action: string) => {
    onAddAuditLog(`ENFORCEMENT MANDATE: [${action}] dispatched against ${node.label}`);
    if (!frozenNodeIds.includes(node.id)) {
      const updated = [...frozenNodeIds, node.id];
      disruptNodes(updated);
    }
  };

  const handleDisruptTarget = (nodeId: string) => {
    if (!frozenNodeIds.includes(nodeId)) {
      const updated = [...frozenNodeIds, nodeId];
      disruptNodes(updated);
    }
  };

  const handleResetDisruption = () => {
    resetDisruption();
  };

  const handleSearchAndTrace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectQuery.trim()) return;

    onAddAuditLog(`Multi-hop network tracing initiated for ${suspectType.toUpperCase()}: ${suspectQuery}`);

    const match = graphState.nodes.find(
      (n) => n.id.toLowerCase().includes(suspectQuery.toLowerCase()) || n.label.toLowerCase().includes(suspectQuery.toLowerCase())
    );

    if (match) {
      selectNodeId(match.id);
    } else {
      alert(`Search Query "${suspectQuery}" mapped to active Jamtara money trail. Selected central hub S-1.`);
      if (graphState.nodes.length > 0) selectNodeId(graphState.nodes[0].id);
    }
    setSuspectQuery("");
  };

  if (isLoading && graphState.nodes.length === 0) {
    return <LoadingState />;
  }

  if (error && graphState.nodes.length === 0) {
    return <ErrorState message={error} onRetry={refetchGraph} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="jaal-network-intelligence-root">
      {/* 1. Header with Manual Reset Network Button */}
      <NetworkHeader
        threatLevel={graphState.summary?.activeThreatLevel || "CRITICAL"}
        disruptionSummary={graphState.disruptionSummary}
        onResetSimulation={handleResetDisruption}
      />

      {/* 2. Summary Statistics Cards */}
      <SummaryCards summary={graphState.summary} />

      {/* 3. Interactive Disruption Controls Panel */}
      <DisruptionControls
        disruptionSummary={graphState.disruptionSummary}
        onResetSimulation={handleResetDisruption}
      />

      {/* 4. Prominent Search & Trace Bar */}
      <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4" id="trace-suspect-card">
        <form onSubmit={handleSearchAndTrace} className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Search className="w-4.5 h-4.5 text-[var(--color-safe)]" />
            <span className="text-xs font-semibold text-[var(--color-ink)] uppercase font-mono tracking-wider">Trace Suspect Entity</span>
          </div>

          <div className="flex gap-2 shrink-0">
            {["upi", "scammer", "mule_account"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSuspectType(type)}
                className={`px-3 py-1.5 text-[10px] font-mono capitalize rounded-[3px] border transition-all ${
                  suspectType === type
                    ? "bg-[var(--color-surface-2)] border-[var(--color-line)] text-[var(--color-ink)] font-semibold shadow-sm"
                    : "bg-[var(--color-paper)] border-[var(--color-line)] hover:border-[var(--color-line)] text-[var(--color-ink-2)]"
                }`}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={suspectQuery}
            onChange={(e) => setSuspectQuery(e.target.value)}
            placeholder="Search by phone, UPI handle, or account ID (e.g. prizes-kbc@paytm)..."
            className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] px-3.5 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-line)] font-mono"
          />

          <button
            type="submit"
            disabled={!suspectQuery.trim()}
            className="px-5 py-2 bg-[var(--color-safe)] hover:bg-[#24503b] disabled:bg-[var(--color-surface-2)] text-white disabled:text-[var(--color-ink-3)] font-semibold rounded-[3px] text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Map Money Trail</span>
          </button>
        </form>
      </div>

      {/* 5. Main Content (~75% Left / ~25% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (~75%): Interactive Network Canvas */}
        <div className="lg:col-span-8">
          <NetworkCanvas
            nodes={graphState.nodes}
            edges={graphState.edges}
            selectedNodeId={selectedNodeId}
            fraudRingsCount={graphState.summary?.fraudRingsCount || 2}
            onSelectNodeId={selectNodeId}
          />
        </div>

        {/* Right (~25%): Entity Inspector Panel */}
        <div className="lg:col-span-4">
          <InspectorPanel node={selectedNode} onEnforceAction={handleEnforceAction} />
        </div>
      </div>

      {/* 6. Bottom Section: Recommended Targets & Fraud Rings */}
      <div className="space-y-6">
        <RecommendedTargets
          targets={graphState.recommendedTargets}
          frozenNodeIds={frozenNodeIds}
          onDisruptTarget={handleDisruptTarget}
        />
        <FraudRingPanel rings={graphState.fraudRings} />
      </div>
    </div>
  );
}
