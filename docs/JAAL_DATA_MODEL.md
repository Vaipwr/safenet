# JAAL Data Model Specification

- **Purpose**: Defines all TypeScript types, data structures, and response contracts used across the JAAL module.
- **Last Updated**: 2026-07-21
- **Related Files**: `src/types/jaal.ts`, `src/types.ts`, `server/jaal/graphEngine.ts`
- **Maintainer**: SafeNet Engineering Team (JAAL Lead)

---

## 1. Type Organization & File Structure

JAAL interfaces are modularized in [`src/types/jaal.ts`](file:///c:/Users/sahil/OneDrive/Desktop/SafeNet/src/types/jaal.ts) and re-exported through [`src/types.ts`](file:///c:/Users/sahil/OneDrive/Desktop/SafeNet/src/types.ts). This ensures global shared application types remain clean while providing a single import source for JAAL frontend and backend contracts.

---

## 2. Shared Literal Union Types

| Type Name | Defined Values | Purpose |
| :--- | :--- | :--- |
| `RiskLevel` | `"CRITICAL" \| "HIGH" \| "MEDIUM" \| "LOW"` | Threat level severity classification |
| `EntityCategory` | `"PERSON" \| "ACCOUNT" \| "DEVICE" \| "PHONE" \| "PAYMENT" \| "ORGANIZATION"` | High-level category grouping |
| `NodeType` | `"scammer" \| "mule_account" \| "upi" \| "victim" \| "ip_address" \| "device" \| "phone"` | Specific entity node type |
| `ActionType` | `"FREEZE_BANK_ACCOUNT" \| "SUSPEND_UPI" \| "BLOCK_IMEI_SIM"` | Directive enforcement action |

---

## 3. Top-Level Response Envelopes

### `JaalGraphResponse` (`GET /api/jaal/graph`)
```typescript
export interface JaalGraphResponse {
  status: "success" | "error";
  metadata: JaalMetadata;
  data: {
    summary: JaalSummary;
    nodes: JaalNode[];
    edges: JaalEdge[];
    fraudRings: JaalFraudRing[];
    recommendedTargets: JaalRecommendedTarget[];
  };
}
```

### `JaalDisruptionResponse` (`POST /api/jaal/disrupt`)
```typescript
export interface JaalDisruptionResponse {
  status: "success" | "error";
  metadata: JaalMetadata;
  data: {
    disruptionSummary: JaalDisruptionSummary;
    nodes: JaalNode[];
    edges: JaalEdge[];
  };
}
```

### `JaalApiErrorResponse`
```typescript
export interface JaalApiErrorResponse {
  status: "error";
  code: string;
  message: string;
}
```

---

## 4. Core Object Interfaces

### `JaalNode`
```typescript
export interface JaalNode {
  id: string;
  label: string;
  type: NodeType;
  entityCategory: EntityCategory;
  val: number;
  cx: number;
  cy: number;
  riskScore: number;
  riskLevel: RiskLevel;
  ringId: string | null;
  isFrozen: boolean;
  metrics: JaalNodeMetrics;
  details: JaalNodeDetails;
}
```

### `JaalEdge`
```typescript
export interface JaalEdge {
  source: string;
  target: string;
  label: string;
  value: number;
  amount: number | null;
  ringId: string | null;
  isSevered: boolean;
}
```

### `JaalFraudRing`
```typescript
export interface JaalFraudRing {
  id: string;
  name: string;
  type: string;
  severity: RiskLevel;
  nodeIds: string[];
  totalMuleVolume: number;
  primaryLocation: string;
  description: string;
  statistics: JaalFraudRingStatistics;
}
```

### `JaalRecommendedTarget`
```typescript
export interface JaalRecommendedTarget {
  nodeId: string;
  rank: number;
  label: string;
  entityType: string;
  riskScore: number;
  confidence: number;
  disruptionImpact: string;
  actionType: ActionType;
}
```
