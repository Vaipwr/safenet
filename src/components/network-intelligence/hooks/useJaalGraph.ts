import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  JaalGraphResponse,
  JaalDisruptionResponse,
  JaalNode,
  JaalGraphState
} from "../../../types/jaal";

interface UseJaalGraphReturn {
  isLoading: boolean;
  error: string | null;
  graphState: JaalGraphState;
  selectedNodeId: string | null;
  selectedNode: JaalNode | null;
  frozenNodeIds: string[];
  selectNodeId: (id: string | null) => void;
  refetchGraph: () => Promise<void>;
  disruptNodes: (targetNodeIds: string[]) => Promise<void>;
  resetDisruption: () => Promise<void>;
}

export function useJaalGraph(onAddAuditLog?: (msg: string) => void): UseJaalGraphReturn {
  const auditLogRef = useRef(onAddAuditLog);
  useEffect(() => {
    auditLogRef.current = onAddAuditLog;
  }, [onAddAuditLog]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Single unified graph state object
  const [graphState, setGraphState] = useState<JaalGraphState>({
    summary: null,
    nodes: [],
    edges: [],
    fraudRings: [],
    recommendedTargets: [],
    disruptionSummary: null
  });

  // Store ONLY selected node ID string
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Dynamically derive selectedNode object reference from graphState.nodes
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphState.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graphState.nodes, selectedNodeId]);

  // Dynamically derive frozenNodeIds array directly from graphState.nodes
  const frozenNodeIds = useMemo(() => {
    return graphState.nodes.filter((n) => n.isFrozen).map((n) => n.id);
  }, [graphState.nodes]);

  // Fetch baseline graph from GET /api/jaal/graph
  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jaal/graph");
      if (!res.ok) {
        throw new Error(`Failed to fetch graph data: ${res.statusText}`);
      }
      const json: JaalGraphResponse = await res.json();
      if (json.status === "success" && json.data) {
        setGraphState({
          summary: json.data.summary,
          nodes: json.data.nodes,
          edges: json.data.edges,
          fraudRings: json.data.fraudRings,
          recommendedTargets: json.data.recommendedTargets,
          disruptionSummary: null
        });

        if (json.data.nodes.length > 0 && !selectedNodeId) {
          setSelectedNodeId(json.data.nodes[0].id);
        }

        if (auditLogRef.current) {
          auditLogRef.current("JAAL Engine: Loaded baseline synthetic network graph.");
        }
      } else {
        throw new Error("Invalid response envelope returned by backend API");
      }
    } catch (err: any) {
      console.error("Error fetching JAAL graph:", err);
      setError(err.message || "Failed to load network intelligence graph");
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array: fetchGraph reference NEVER changes

  // RUN ONCE ON INITIAL MOUNT ONLY. No automatic re-fetching!
  useEffect(() => {
    fetchGraph();
  }, []);

  const selectNodeId = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id && auditLogRef.current) {
      auditLogRef.current(`Entity Inspection: Node [${id}] selected.`);
    }
  }, []);

  // Execute node freeze via POST /api/jaal/disrupt and keep returned state persistently
  const disruptNodes = useCallback(async (targetNodeIds: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jaal/disrupt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frozenNodeIds: targetNodeIds })
      });
      if (!res.ok) {
        throw new Error(`Failed to execute node disruption: ${res.statusText}`);
      }
      const json: JaalDisruptionResponse = await res.json();
      if (json.status === "success" && json.data) {
        // Update graphState permanently with response envelope
        setGraphState((prev) => ({
          ...prev,
          nodes: json.data.nodes,
          edges: json.data.edges,
          summary: json.data.summary || prev.summary,
          disruptionSummary: json.data.disruptionSummary
        }));

        if (auditLogRef.current) {
          auditLogRef.current(`ENFORCEMENT MANDATE: Disruption executed against [${targetNodeIds.join(", ")}].`);
        }
      } else {
        throw new Error("Disruption simulation API returned error status");
      }
    } catch (err: any) {
      console.error("Error executing disruption simulation:", err);
      setError(err.message || "Failed to execute disruption simulation");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // MANUAL RESET ONLY: Triggered when user clicks "Reset Network" button
  const resetDisruption = useCallback(async () => {
    await fetchGraph();
    if (auditLogRef.current) {
      auditLogRef.current("JAAL Engine: Reset disruption simulation to baseline network state.");
    }
  }, [fetchGraph]);

  return {
    isLoading,
    error,
    graphState,
    selectedNodeId,
    selectedNode,
    frozenNodeIds,
    selectNodeId,
    refetchGraph: fetchGraph,
    disruptNodes,
    resetDisruption
  };
}
