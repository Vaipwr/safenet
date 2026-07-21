# JAAL Architecture Specification

- **Purpose**: Describes overall system architecture, data flow, folder structure, component relationships, and SafeNet integration for the JAAL Fraud Network Graph Intelligence module.
- **Last Updated**: 2026-07-21
- **Related Files**: `server.ts`, `server/jaal/graphEngine.ts`, `src/components/network-intelligence/*`, `src/types/jaal.ts`
- **Maintainer**: SafeNet Engineering Team (JAAL Lead)

---

## 1. System Overview

JAAL (Fraud Network Graph Intelligence) is an AI-assisted digital public safety engine designed to convert disconnected fraud reports (UPI handles, phone numbers, mule accounts, device IMEIs) into an actionable criminal network topology graph. It identifies fraud rings, calculates entity risk scores, prioritizes high-impact targets for law enforcement intervention, and simulates network disruption in real time.

---

## 2. Refactored Single Source of Truth Architecture

State management is centralized inside **`useJaalGraph`** using a single `graphState` object:

```typescript
export interface JaalGraphState {
  summary: JaalSummary | null;
  nodes: JaalNode[];
  edges: JaalEdge[];
  fraudRings: JaalFraudRing[];
  recommendedTargets: JaalRecommendedTarget[];
  disruptionSummary: JaalDisruptionSummary | null;
}
```

### Architectural Guarantees:
1. **Single Source of Truth**: Backend API responses (`GET /api/jaal/graph` and `POST /api/jaal/disrupt`) completely replace `graphState`.
2. **Selected Node ID**: Only string ID (`selectedNodeId: string | null`) is stored in React state. The `selectedNode` object reference is dynamically derived: `graphState.nodes.find(n => n.id === selectedNodeId)`.
3. **No Duplicated Frozen State**: Frozen node IDs are dynamically derived directly from `graphState.nodes.filter(n => n.isFrozen).map(n => n.id)`.

---

## 3. Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    participant UI as NetworkIntelligenceContainer.tsx
    participant Hook as useJaalGraph.ts
    participant Express as server.ts (/api/jaal/*)
    participant Engine as server/jaal/graphEngine.ts

    UI->>Hook: useJaalGraph(onAddAuditLog)
    Hook->>Express: GET /api/jaal/graph
    Express->>Engine: getSyntheticGraph()
    Engine-->>Express: Return JaalGraphResponse JSON
    Express-->>Hook: setGraphState(json.data)
    Hook-->>UI: Provide graphState, selectedNodeId, & derived values
    UI->>NetworkCanvas: Pass nodes, edges, selectedNodeId
    UI->>InspectorPanel: Pass selectedNode (derived)
    UI->>RecommendedTargets: Pass recommendedTargets, frozenNodeIds (derived)
    UI->>SummaryCards: Pass summary
    UI->>DisruptionControls: Pass disruptionSummary

    Note over UI, Express: User clicks "Freeze Account" on InspectorPanel or "Freeze Target" on RecommendedTargets
    UI->>Hook: disruptNodes(["M-1"])
    Hook->>Express: POST /api/jaal/disrupt { frozenNodeIds: ["M-1"] }
    Express->>Engine: simulateDisruption(["M-1"])
    Engine-->>Express: Return JaalDisruptionResponse JSON (with updated summary, nodes, edges)
    Express-->>Hook: setGraphState(entire backend response)
    Hook-->>UI: Push updated graphState down to ALL components
```
