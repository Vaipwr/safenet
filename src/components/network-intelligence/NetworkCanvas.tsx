import React from "react";
import { Activity } from "lucide-react";
import { JaalNode, JaalEdge } from "../../types/jaal";

interface NetworkCanvasProps {
  nodes: JaalNode[];
  edges: JaalEdge[];
  selectedNodeId: string | null;
  fraudRingsCount?: number;
  onSelectNodeId: (id: string) => void;
}

export function NetworkCanvas({ nodes, edges, selectedNodeId, fraudRingsCount = 2, onSelectNodeId }: NetworkCanvasProps) {
  const nodeMap = new Map<string, JaalNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Identify edges connected to the selected node ID
  const connectedEdgeIndexes = new Set<number>();
  if (selectedNodeId) {
    edges.forEach((edge, idx) => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        connectedEdgeIndexes.add(idx);
      }
    });
  }

  const getNodeColor = (type: string, isFrozen: boolean) => {
    if (isFrozen) return "#64748b"; // Slate gray for frozen nodes
    switch (type) {
      case "scammer":
        return "#f43f5e"; // 🔴 Scammer (Rose Red)
      case "mule_account":
        return "#fbbf24"; // 🟡 Mule (Amber Yellow)
      case "upi":
        return "#10b981"; // 🟢 UPI (Emerald Green)
      case "device":
        return "#c084fc"; // 🟣 Device (Purple)
      case "phone":
        return "#60a5fa"; // 🔵 Phone (Blue)
      default:
        return "#94a3b8"; // Slate
    }
  };

  return (
    <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5 space-y-4 flex flex-col justify-between" id="network-visualizer-canvas">
      {/* Canvas Header & Status Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2 text-sm">
          <Activity className="w-4.5 h-4.5 text-[var(--color-safe)]" />
          <span>Interactive Money Trail Topology</span>
        </h3>

        {/* Network Status Widget */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-full text-xs font-mono text-[var(--color-ink-2)]">
          <span className="flex items-center gap-1.5 text-[var(--color-safe)] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[var(--color-safe)]" />
            <span>Connected</span>
          </span>
          <span className="text-[var(--color-ink-3)]">|</span>
          <span className="font-semibold">{nodes.length} Nodes</span>
          <span className="text-[var(--color-ink-3)]">|</span>
          <span className="font-semibold">{edges.length} Edges</span>
          <span className="text-[var(--color-ink-3)]">|</span>
          <span className="text-[var(--color-critical)] font-semibold">{fraudRingsCount} Rings</span>
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div className="relative bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 overflow-hidden min-h-[430px] flex items-center justify-center">
        <svg className="w-full h-[400px]" viewBox="0 0 400 310">
          {/* Draw Edges */}
          {edges.map((edge, idx) => {
            const start = nodeMap.get(edge.source);
            const end = nodeMap.get(edge.target);
            if (!start || !end) return null;

            const isConnectedToSelected = connectedEdgeIndexes.has(idx);
            
            const opacity = selectedNodeId
              ? isConnectedToSelected
                ? 1.0
                : edge.isSevered
                ? 0.25
                : 0.45
              : edge.isSevered
              ? 0.35
              : 0.65;

            const strokeColor = edge.isSevered
              ? "#f43f5e"
              : isConnectedToSelected
              ? "#fbbf24"
              : "#475569";

            const strokeWidth = isConnectedToSelected ? 3.5 : edge.isSevered ? 2 : 2.5;

            const midX = (start.cx + end.cx) / 2;
            const midY = (start.cy + end.cy) / 2;
            const labelText = edge.isSevered ? "SEVERED" : edge.label;
            const labelWidth = Math.max(38, labelText.length * 4.2);

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={start.cx}
                  y1={start.cy}
                  x2={end.cx}
                  y2={end.cy}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={edge.isSevered ? "4,4" : edge.label.includes("VoIP") || edge.label.includes("SMS") ? "5,3" : undefined}
                  opacity={opacity}
                  className="transition-all duration-300"
                />
                
                {/* Dark Background Pill Behind Edge Label for Readability */}
                <rect
                  x={midX - labelWidth / 2}
                  y={midY - 7}
                  width={labelWidth}
                  height={12}
                  rx="3"
                  fill="#020617"
                  stroke={isConnectedToSelected ? "#f59e0b" : "#1e293b"}
                  strokeWidth="0.8"
                  opacity={opacity}
                />
                
                {/* Edge Label Text */}
                <text
                  x={midX}
                  y={midY + 1.5}
                  fill={edge.isSevered ? "#f87171" : isConnectedToSelected ? "#fbbf24" : "#cbd5e1"}
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                  opacity={opacity}
                  className="select-none pointer-events-none"
                >
                  {labelText}
                </text>
              </g>
            );
          })}

          {/* Draw Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const nodeColor = getNodeColor(node.type, node.isFrozen);
            const radius = node.val + 3;

            const isConnectedToSelectedNode = selectedNodeId && (
              node.id === selectedNodeId ||
              edges.some(e => (e.source === selectedNodeId && e.target === node.id) || (e.target === selectedNodeId && e.source === node.id))
            );

            const nodeOpacity = selectedNodeId ? (isConnectedToSelectedNode ? 1.0 : 0.55) : 1.0;

            return (
              <g
                key={node.id}
                onClick={() => onSelectNodeId(node.id)}
                className="cursor-pointer group"
              >
                {/* Halo highlight ring when selected */}
                {isSelected && (
                  <>
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={radius + 7}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray="4,2"
                    />
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={radius + 3}
                      fill="#f59e0b"
                      opacity={0.3}
                    />
                  </>
                )}

                {/* Node Outer Dark Border */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={radius + 1.5}
                  fill="#020617"
                />

                {/* Main Node Circle */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={radius}
                  fill={nodeColor}
                  opacity={node.isFrozen ? 0.45 : nodeOpacity}
                  className={`transition-all duration-300 ${
                    isSelected ? "stroke-[#1b1a17] stroke-2" : "group-hover:stroke-[#4a4842] group-hover:stroke-2"
                  }`}
                />

                {/* Frozen Overlay Cross */}
                {node.isFrozen && (
                  <text
                    x={node.cx}
                    y={node.cy + 3.5}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="black"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    ✕
                  </text>
                )}

                {/* Label Background Box for High Contrast */}
                <rect
                  x={node.cx - 24}
                  y={node.cy + radius + 3}
                  width="48"
                  height="12"
                  rx="3"
                  fill="#0f172a"
                  stroke={isSelected ? "#f59e0b" : "#1e293b"}
                  strokeWidth="0.8"
                  opacity={nodeOpacity}
                />

                {/* Node ID Label */}
                <text
                  x={node.cx}
                  y={node.cy + radius + 11.5}
                  fill={node.isFrozen ? "#94a3b8" : isSelected ? "#ffffff" : "#e2e8f0"}
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {node.id} {node.isFrozen ? "⛔" : ""}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Clean Floating Legend */}
        <div className="absolute bottom-3 left-3 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[3px] p-3 text-xs font-mono text-[var(--color-ink)] space-y-1.5">
          <div className="text-[10px] font-semibold text-[var(--color-ink-2)] uppercase tracking-wider mb-1">Entity Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--color-critical)] shadow-sm" />
            <span className="font-semibold text-[var(--color-ink)]">🔴 Scammer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--color-medium)] shadow-sm" />
            <span className="font-semibold text-[var(--color-ink)]">🟡 Mule</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--color-safe)] shadow-sm" />
            <span className="font-semibold text-[var(--color-ink)]">🟢 UPI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-400 shadow-sm" />
            <span className="font-semibold text-[var(--color-ink)]">🟣 Device</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400 shadow-sm" />
            <span className="font-semibold text-[var(--color-ink)]">🔵 Phone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
