# JAAL API Specification

- **Purpose**: Comprehensive API reference for backend routes provided by the JAAL Fraud Network Graph module.
- **Last Updated**: 2026-07-21
- **Related Files**: `server.ts`, `server/jaal/graphEngine.ts`
- **Maintainer**: SafeNet Engineering Team (JAAL Lead)

---

## Endpoint 1: `GET /api/jaal/graph`

- **Method**: `GET`
- **Purpose**: Fetches the complete synthetic fraud network graph, detected fraud rings, risk scores, and law enforcement target recommendations.
- **Request Parameters**: None
- **Response Format**: `application/json`

### Example Response Body:
```json
{
  "status": "success",
  "metadata": {
    "generatedAt": "2026-07-21T10:07:00.000Z",
    "generator": "JAAL Graph Engine",
    "version": "1.0",
    "scenario": "Digital Arrest + Jamtara KBC Fraud"
  },
  "data": {
    "summary": {
      "totalNodes": 8,
      "totalEdges": 9,
      "totalFlaggedAmount": 8740000,
      "currency": "INR",
      "fraudRingsCount": 2,
      "criticalTargetsCount": 3,
      "activeThreatLevel": "CRITICAL"
    },
    "nodes": [
      {
        "id": "S-1",
        "label": "Scam Call Hub (IP: 103.88.92.1)",
        "type": "scammer",
        "entityCategory": "ORGANIZATION",
        "val": 14,
        "cx": 200,
        "cy": 90,
        "riskScore": 96,
        "riskLevel": "CRITICAL",
        "ringId": "RING-JAMTARA",
        "isFrozen": false,
        "metrics": { "degree": 4, "inDegree": 1, "outDegree": 3 },
        "details": {
          "location": "Jamtara, JH",
          "transactionsCount": 412,
          "totalValue": 4850000,
          "flaggedDate": "10-06-2026",
          "reason": "Central VoIP spoof origin for KBC & Digital Arrest campaigns"
        }
      }
    ],
    "edges": [
      {
        "source": "S-1",
        "target": "V-1",
        "label": "VoIP Extortion Call",
        "value": 2,
        "amount": 200000,
        "ringId": "RING-JAMTARA",
        "isSevered": false
      }
    ],
    "fraudRings": [
      {
        "id": "RING-JAMTARA",
        "name": "Jamtara Phishing & Mule Syndicate",
        "type": "Digital Arrest & KBC Fraud",
        "severity": "CRITICAL",
        "nodeIds": ["S-1", "M-1", "U-1"],
        "totalMuleVolume": 4850000,
        "primaryLocation": "Jamtara, JH / Kolkata, WB",
        "description": "Multi-hop money laundering pipeline converting phishing funds into cash via mule bank networks.",
        "statistics": { "nodeCount": 3, "edgeCount": 4, "estimatedLoss": 4850000 }
      }
    ],
    "recommendedTargets": [
      {
        "nodeId": "M-1",
        "rank": 1,
        "label": "Mule A/C: Rajesh Kumar (SBI)",
        "entityType": "mule_account",
        "riskScore": 92,
        "confidence": 0.96,
        "disruptionImpact": "Freezing this account immediately breaks the primary cash extraction pipeline for Jamtara Syndicate.",
        "actionType": "FREEZE_BANK_ACCOUNT"
      }
    ]
  }
}
```

---

## Endpoint 2: `POST /api/jaal/disrupt`

- **Method**: `POST`
- **Purpose**: Simulates targeted network disruption by freezing selected node IDs. Recalculates graph state, severs connected links, updates risk scores, and measures disruption metrics.
- **Request Body**:
```json
{
  "frozenNodeIds": ["M-1", "S-1"]
}
```

### Example Response Body:
```json
{
  "status": "success",
  "metadata": {
    "generatedAt": "2026-07-21T10:07:05.000Z",
    "generator": "JAAL Disruption Simulator",
    "version": "1.0",
    "scenario": "Network Freeze Simulation"
  },
  "data": {
    "disruptionSummary": {
      "frozenNodeIds": ["M-1", "S-1"],
      "severedEdgeCount": 6,
      "collapsedRingCount": 2,
      "blockedVolume": 6700000,
      "currency": "INR",
      "networkDisruptionPercentage": 76.6
    },
    "nodes": [ /* updated node states with isFrozen: true */ ],
    "edges": [ /* updated edge states with isSevered: true */ ]
  }
}
```
