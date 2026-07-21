import {
  JaalNode,
  JaalEdge,
  JaalFraudRing,
  JaalRecommendedTarget,
  JaalGraphResponse,
  JaalDisruptionResponse,
  JaalSummary,
  RiskLevel
} from "../../src/types/jaal";

// Optimized synthetic dataset with wide node distribution to prevent edge overlapping
const SYNTHETIC_NODES: JaalNode[] = [
  {
    id: "S-1",
    label: "Scam Call Hub (IP: 103.88.92.1)",
    type: "scammer",
    entityCategory: "ORGANIZATION",
    val: 16,
    cx: 200,
    cy: 135,
    riskScore: 98,
    riskLevel: "CRITICAL",
    ringId: "RING-JAMTARA",
    isFrozen: false,
    metrics: { degree: 5, inDegree: 1, outDegree: 4 },
    details: {
      location: "Jamtara, JH",
      transactionsCount: 412,
      totalValue: 4850000,
      flaggedDate: "10-06-2026",
      reason: "Central VoIP spoof origin for KBC & Digital Arrest campaigns"
    }
  },
  {
    id: "D-1",
    label: "Device IMEI: 8694029104...",
    type: "device",
    entityCategory: "DEVICE",
    val: 12,
    cx: 200,
    cy: 35,
    riskScore: 94,
    riskLevel: "CRITICAL",
    ringId: "RING-MEWAT",
    isFrozen: false,
    metrics: { degree: 3, inDegree: 0, outDegree: 3 },
    details: {
      location: "Mewat, HR",
      transactionsCount: 68,
      totalValue: 1800000,
      flaggedDate: "14-06-2026",
      reason: "Shared physical device operating 12 fraudulent SIM profiles"
    }
  },
  {
    id: "V-1",
    label: "Victim: Suresh Sharma",
    type: "victim",
    entityCategory: "PERSON",
    val: 10,
    cx: 65,
    cy: 75,
    riskScore: 15,
    riskLevel: "LOW",
    ringId: null,
    isFrozen: false,
    metrics: { degree: 2, inDegree: 1, outDegree: 1 },
    details: {
      location: "New Delhi, NCR",
      transactionsCount: 2,
      totalValue: 200000,
      flaggedDate: "17-06-2026",
      reason: "Reported ₹2L Digital Arrest extortion"
    }
  },
  {
    id: "V-2",
    label: "Victim: Dr. Ananya Sen",
    type: "victim",
    entityCategory: "PERSON",
    val: 10,
    cx: 335,
    cy: 75,
    riskScore: 18,
    riskLevel: "LOW",
    ringId: null,
    isFrozen: false,
    metrics: { degree: 2, inDegree: 1, outDegree: 1 },
    details: {
      location: "Kolkata, WB",
      transactionsCount: 4,
      totalValue: 520000,
      flaggedDate: "18-06-2026",
      reason: "FedEx Drug Courier Impersonation Victim"
    }
  },
  {
    id: "M-1",
    label: "Mule A/C: Rajesh Kumar (SBI)",
    type: "mule_account",
    entityCategory: "ACCOUNT",
    val: 14,
    cx: 85,
    cy: 235,
    riskScore: 92,
    riskLevel: "CRITICAL",
    ringId: "RING-JAMTARA",
    isFrozen: false,
    metrics: { degree: 4, inDegree: 2, outDegree: 2 },
    details: {
      location: "Kolkata, WB",
      transactionsCount: 92,
      totalValue: 2240000,
      flaggedDate: "15-06-2026",
      reason: "High-frequency rapid ATM cash extraction node"
    }
  },
  {
    id: "M-2",
    label: "Mule A/C: Preeti Sen (ICICI)",
    type: "mule_account",
    entityCategory: "ACCOUNT",
    val: 12,
    cx: 315,
    cy: 235,
    riskScore: 86,
    riskLevel: "HIGH",
    ringId: "RING-JAMTARA",
    isFrozen: false,
    metrics: { degree: 3, inDegree: 1, outDegree: 2 },
    details: {
      location: "Patna, BR",
      transactionsCount: 45,
      totalValue: 1180000,
      flaggedDate: "18-06-2026",
      reason: "Secondary money laundering layering account"
    }
  },
  {
    id: "U-1",
    label: "UPI: prizes-kbc@paytm",
    type: "upi",
    entityCategory: "PAYMENT",
    val: 13,
    cx: 200,
    cy: 255,
    riskScore: 89,
    riskLevel: "HIGH",
    ringId: "RING-JAMTARA",
    isFrozen: false,
    metrics: { degree: 4, inDegree: 3, outDegree: 1 },
    details: {
      location: "Mewat, HR",
      transactionsCount: 184,
      totalValue: 1510000,
      flaggedDate: "12-06-2026",
      reason: "Linked to 14 advance-fee lottery complaints"
    }
  },
  {
    id: "P-1",
    label: "Phone: +91 98765 43210",
    type: "phone",
    entityCategory: "PHONE",
    val: 11,
    cx: 335,
    cy: 155,
    riskScore: 82,
    riskLevel: "HIGH",
    ringId: "RING-MEWAT",
    isFrozen: false,
    metrics: { degree: 2, inDegree: 1, outDegree: 1 },
    details: {
      location: "Gurugram, HR",
      transactionsCount: 34,
      totalValue: 950000,
      flaggedDate: "19-06-2026",
      reason: "Spoofed customer care helpline number"
    }
  }
];

const SYNTHETIC_EDGES: JaalEdge[] = [
  { source: "S-1", target: "D-1", label: "VPN Device Pairing", value: 3, amount: null, ringId: "RING-MEWAT", isSevered: false },
  { source: "S-1", target: "V-1", label: "VoIP Extortion Call", value: 2, amount: 200000, ringId: "RING-JAMTARA", isSevered: false },
  { source: "S-1", target: "V-2", label: "Customs Arrest Claim", value: 2, amount: 520000, ringId: "RING-JAMTARA", isSevered: false },
  { source: "V-1", target: "U-1", label: "UPI Advance Payment", value: 4, amount: 200000, ringId: "RING-JAMTARA", isSevered: false },
  { source: "V-2", target: "M-1", label: "RTGS Escrow Deposit", value: 5, amount: 520000, ringId: "RING-JAMTARA", isSevered: false },
  { source: "U-1", target: "M-1", label: "Automated Mule Sweep", value: 4, amount: 1850000, ringId: "RING-JAMTARA", isSevered: false },
  { source: "M-1", target: "M-2", label: "Layering Transfer", value: 3, amount: 1180000, ringId: "RING-JAMTARA", isSevered: false },
  { source: "D-1", target: "P-1", label: "Cloned SIM Host", value: 2, amount: null, ringId: "RING-MEWAT", isSevered: false },
  { source: "P-1", target: "U-1", label: "Phishing SMS Link", value: 3, amount: null, ringId: "RING-MEWAT", isSevered: false }
];

const SYNTHETIC_RINGS: JaalFraudRing[] = [
  {
    id: "RING-JAMTARA",
    name: "Jamtara Phishing & Mule Syndicate",
    type: "Digital Arrest & KBC Fraud",
    severity: "CRITICAL",
    nodeIds: ["S-1", "M-1", "M-2", "U-1"],
    totalMuleVolume: 4850000,
    primaryLocation: "Jamtara, JH / Kolkata, WB",
    description: "Multi-hop money laundering pipeline converting phishing funds into cash via mule bank networks.",
    statistics: { nodeCount: 4, edgeCount: 5, estimatedLoss: 4850000 }
  },
  {
    id: "RING-MEWAT",
    name: "Mewat SIM Swap & Device Hub",
    type: "SIM Swap & IMEI Spoofing",
    severity: "HIGH",
    nodeIds: ["D-1", "P-1", "S-1"],
    totalMuleVolume: 2750000,
    primaryLocation: "Mewat, HR",
    description: "Device-sharing ring operating multiple fraudulent SIM cards to bypass banking OTP verification.",
    statistics: { nodeCount: 3, edgeCount: 3, estimatedLoss: 2750000 }
  }
];

const RECOMMENDED_TARGETS: JaalRecommendedTarget[] = [
  {
    nodeId: "M-1",
    rank: 1,
    label: "Mule A/C: Rajesh Kumar (SBI)",
    entityType: "mule_account",
    riskScore: 92,
    confidence: 0.96,
    disruptionImpact: "Freezing this account immediately breaks the primary cash extraction pipeline for Jamtara Syndicate.",
    actionType: "FREEZE_BANK_ACCOUNT"
  },
  {
    nodeId: "S-1",
    rank: 2,
    label: "Scam Call Hub (IP: 103.88.92.1)",
    entityType: "scammer",
    riskScore: 98,
    confidence: 0.98,
    disruptionImpact: "Blocking this server endpoint severs 3 active phishing campaigns across Delhi NCR and Mumbai.",
    actionType: "SUSPEND_UPI"
  },
  {
    nodeId: "D-1",
    rank: 3,
    label: "Device IMEI: 8694029104...",
    entityType: "device",
    riskScore: 94,
    confidence: 0.93,
    disruptionImpact: "Blacklisting this IMEI disconnects 12 cloned SIM card handles under Sanchar Saathi protocol.",
    actionType: "BLOCK_IMEI_SIM"
  }
];

/**
 * Returns the full synthetic graph JSON payload.
 */
export function getSyntheticGraph(): JaalGraphResponse {
  const totalFlaggedAmount = SYNTHETIC_NODES.reduce((acc, node) => acc + node.details.totalValue, 0);

  return {
    status: "success",
    metadata: {
      generatedAt: new Date().toISOString(),
      generator: "JAAL Graph Engine",
      version: "1.0",
      scenario: "Digital Arrest + Jamtara KBC Fraud"
    },
    data: {
      summary: {
        totalNodes: SYNTHETIC_NODES.length,
        totalEdges: SYNTHETIC_EDGES.length,
        totalFlaggedAmount,
        currency: "INR",
        fraudRingsCount: SYNTHETIC_RINGS.length,
        criticalTargetsCount: RECOMMENDED_TARGETS.length,
        activeThreatLevel: "CRITICAL"
      },
      nodes: SYNTHETIC_NODES,
      edges: SYNTHETIC_EDGES,
      fraudRings: SYNTHETIC_RINGS,
      recommendedTargets: RECOMMENDED_TARGETS
    }
  };
}

/**
 * Simulates targeted network disruption by freezing selected node IDs.
 */
export function simulateDisruption(frozenNodeIds: string[]): JaalDisruptionResponse {
  const frozenSet = new Set(frozenNodeIds);

  const updatedNodes = SYNTHETIC_NODES.map((node) => ({
    ...node,
    isFrozen: frozenSet.has(node.id)
  }));

  const updatedEdges = SYNTHETIC_EDGES.map((edge) => ({
    ...edge,
    isSevered: frozenSet.has(edge.source) || frozenSet.has(edge.target)
  }));

  const severedEdges = updatedEdges.filter((e) => e.isSevered);
  const severedEdgeCount = severedEdges.length;

  let blockedVolume = 0;
  severedEdges.forEach((e) => {
    if (e.amount) {
      blockedVolume += e.amount;
    }
  });

  const collapsedRingCount = SYNTHETIC_RINGS.filter((ring) =>
    ring.nodeIds.some((id) => frozenSet.has(id))
  ).length;

  const networkDisruptionPercentage = Math.min(
    100,
    Math.round((severedEdgeCount / SYNTHETIC_EDGES.length) * 100)
  );

  const totalInitialVolume = SYNTHETIC_NODES.reduce((acc, node) => acc + node.details.totalValue, 0);
  const remainingFlaggedAmount = Math.max(0, totalInitialVolume - blockedVolume);

  const activeThreatLevel: RiskLevel =
    networkDisruptionPercentage >= 65
      ? "LOW"
      : networkDisruptionPercentage >= 30
      ? "HIGH"
      : "CRITICAL";

  const updatedSummary: JaalSummary = {
    totalNodes: SYNTHETIC_NODES.length,
    totalEdges: SYNTHETIC_EDGES.length - severedEdgeCount,
    totalFlaggedAmount: remainingFlaggedAmount,
    currency: "INR",
    fraudRingsCount: Math.max(0, SYNTHETIC_RINGS.length - collapsedRingCount),
    criticalTargetsCount: Math.max(0, RECOMMENDED_TARGETS.length - frozenNodeIds.length),
    activeThreatLevel
  };

  return {
    status: "success",
    metadata: {
      generatedAt: new Date().toISOString(),
      generator: "JAAL Disruption Simulator",
      version: "1.0",
      scenario: "Network Freeze Simulation"
    },
    data: {
      disruptionSummary: {
        frozenNodeIds,
        severedEdgeCount,
        collapsedRingCount,
        blockedVolume,
        currency: "INR",
        networkDisruptionPercentage
      },
      summary: updatedSummary,
      nodes: updatedNodes,
      edges: updatedEdges
    }
  };
}
