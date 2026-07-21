/**
 * JAAL (Fraud Network Graph Intelligence) Interface Definitions
 * 
 * Provides strongly-typed frontend & backend contracts for nodes, edges,
 * fraud ring clusters, law enforcement target recommendations, API envelopes,
 * and disruption metrics.
 */

/** Threat level severity classification */
export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/** Entity node category */
export type EntityCategory = "PERSON" | "ACCOUNT" | "DEVICE" | "PHONE" | "PAYMENT" | "ORGANIZATION";

/** Specific entity node type string */
export type NodeType = "scammer" | "mule_account" | "upi" | "victim" | "ip_address" | "device" | "phone";

/** Recommended law enforcement directive action type */
export type ActionType = "FREEZE_BANK_ACCOUNT" | "SUSPEND_UPI" | "BLOCK_IMEI_SIM";

/**
 * Standard execution metadata returned in all JAAL API responses.
 */
export interface JaalMetadata {
  /** ISO timestamp of response generation */
  generatedAt: string;
  /** Name of backend engine/service */
  generator: string;
  /** API engine version string */
  version: string;
  /** Active crime scenario narrative name */
  scenario: string;
}

/**
 * High-level summary metrics of the analyzed network graph.
 */
export interface JaalSummary {
  /** Total count of nodes in the graph */
  totalNodes: number;
  /** Total count of relationship edges */
  totalEdges: number;
  /** Total numeric flagged transaction amount in INR */
  totalFlaggedAmount: number;
  /** Currency ISO code (default "INR") */
  currency: string;
  /** Number of detected fraud rings */
  fraudRingsCount: number;
  /** Number of recommended critical targets for enforcement */
  criticalTargetsCount: number;
  /** Overall graph threat assessment */
  activeThreatLevel: RiskLevel;
}

/**
 * Detailed entity metadata attached to each graph node.
 */
export interface JaalNodeDetails {
  /** Geographic location or city/state */
  location: string;
  /** Total count of associated transactions */
  transactionsCount: number;
  /** Total raw numeric transaction volume in INR */
  totalValue: number;
  /** Date entity was flagged by CERT-In or bank network */
  flaggedDate: string;
  /** Textual reason for high risk categorization */
  reason: string;
}

/**
 * Network degree statistics for graph topology analysis.
 */
export interface JaalNodeMetrics {
  /** Total connected edges */
  degree: number;
  /** Incoming directed transfers / calls */
  inDegree: number;
  /** Outgoing directed transfers / calls */
  outDegree: number;
}

/**
 * Core graph entity node representation for SVG rendering & inspection.
 */
export interface JaalNode {
  /** Unique entity ID */
  id: string;
  /** Human-readable display label */
  label: string;
  /** Specific node type */
  type: NodeType;
  /** High-level category grouping */
  entityCategory: EntityCategory;
  /** Visual radius size hint for SVG stage */
  val: number;
  /** Normalized X canvas coordinate (0 - 400 space) */
  cx: number;
  /** Normalized Y canvas coordinate (0 - 350 space) */
  cy: number;
  /** Calculated risk score (0 - 100) */
  riskScore: number;
  /** Categorized risk level */
  riskLevel: RiskLevel;
  /** ID of parent fraud ring cluster, or null if unclustered */
  ringId: string | null;
  /** Indicates whether node has been frozen by law enforcement */
  isFrozen: boolean;
  /** Graph degree metrics */
  metrics: JaalNodeMetrics;
  /** Detailed audit attributes */
  details: JaalNodeDetails;
}

/**
 * Directed relationship edge connecting two entities in the graph.
 */
export interface JaalEdge {
  /** ID of source node */
  source: string;
  /** ID of target node */
  target: string;
  /** Descriptive relationship label (e.g. "VoIP Extortion Call") */
  label: string;
  /** Visual stroke thickness (1 - 5) */
  value: number;
  /** Transaction amount in numeric INR, or null for non-financial edges */
  amount: number | null;
  /** Associated fraud ring ID */
  ringId: string | null;
  /** Indicates if this edge is severed due to frozen endpoint node */
  isSevered: boolean;
}

/**
 * Statistical summary of a detected criminal cluster / fraud ring.
 */
export interface JaalFraudRingStatistics {
  /** Total nodes in ring */
  nodeCount: number;
  /** Total edges in ring */
  edgeCount: number;
  /** Total estimated financial loss in numeric INR */
  estimatedLoss: number;
}

/**
 * Detected fraud ring cluster grouping related suspicious entities.
 */
export interface JaalFraudRing {
  /** Unique ring ID (e.g. "RING-JAMTARA") */
  id: string;
  /** Human-readable ring title */
  name: string;
  /** Scam pattern / methodology type */
  type: string;
  /** Cluster threat severity */
  severity: RiskLevel;
  /** Member node IDs */
  nodeIds: string[];
  /** Total illicit volume laundered through this ring in numeric INR */
  totalMuleVolume: number;
  /** Primary geographic operating hub */
  primaryLocation: string;
  /** Narrative description of modus operandi */
  description: string;
  /** Cluster statistics */
  statistics: JaalFraudRingStatistics;
}

/**
 * High-priority target recommended for law enforcement action.
 */
export interface JaalRecommendedTarget {
  /** Target node ID to freeze */
  nodeId: string;
  /** Enforcement priority rank (1 = highest) */
  rank: number;
  /** Display label */
  label: string;
  /** Entity type string */
  entityType: string;
  /** Risk score (0 - 100) */
  riskScore: number;
  /** Algorithmic confidence score (0.0 - 1.0) */
  confidence: number;
  /** Expected impact narrative upon freezing */
  disruptionImpact: string;
  /** Direct enforcement directive type */
  actionType: ActionType;
}

/**
 * Summary of a network disruption simulation.
 */
export interface JaalDisruptionSummary {
  /** Array of node IDs that were targeted and frozen */
  frozenNodeIds: string[];
  /** Count of edges severed */
  severedEdgeCount: number;
  /** Count of fraud rings collapsed */
  collapsedRingCount: number;
  /** Total numeric volume blocked in INR */
  blockedVolume: number;
  /** Currency code */
  currency: string;
  /** Percentage reduction in overall network capability (0 - 100) */
  networkDisruptionPercentage: number;
}

/**
 * Single Unified Graph State object holding the single source of truth.
 */
export interface JaalGraphState {
  summary: JaalSummary | null;
  nodes: JaalNode[];
  edges: JaalEdge[];
  fraudRings: JaalFraudRing[];
  recommendedTargets: JaalRecommendedTarget[];
  disruptionSummary: JaalDisruptionSummary | null;
}

/**
 * Full API response envelope for GET /api/jaal/graph.
 */
export interface JaalGraphResponse {
  /** API status indicator */
  status: "success" | "error";
  /** Execution metadata */
  metadata: JaalMetadata;
  /** Graph data payload */
  data: {
    summary: JaalSummary;
    nodes: JaalNode[];
    edges: JaalEdge[];
    fraudRings: JaalFraudRing[];
    recommendedTargets: JaalRecommendedTarget[];
  };
}

/**
 * API response envelope for POST /api/jaal/disrupt.
 */
export interface JaalDisruptionResponse {
  /** API status indicator */
  status: "success" | "error";
  /** Execution metadata */
  metadata: JaalMetadata;
  /** Disruption state payload */
  data: {
    disruptionSummary: JaalDisruptionSummary;
    summary?: JaalSummary;
    nodes: JaalNode[];
    edges: JaalEdge[];
  };
}

/**
 * Standard API error response structure.
 */
export interface JaalApiErrorResponse {
  /** Error status indicator */
  status: "error";
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
}
