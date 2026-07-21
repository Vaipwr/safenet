# JAAL Team Handover Document (5-Minute Executive Summary)

- **Purpose**: High-level handover summary explaining what was built, files created/modified, backend architecture, and integration points for teammates.
- **Last Updated**: 2026-07-21
- **Related Files**: `src/types/jaal.ts`, `server/jaal/graphEngine.ts`, `server.ts`, `src/components/network-intelligence/*`
- **Maintainer**: SafeNet Engineering Team (JAAL Lead)

---

## 1. What Did I Build?

I implemented **JAAL (Fraud Network Graph Intelligence)** for SafeNet — an end-to-end prototype that correlates isolated fraud reports into interactive relationship topology graphs. It highlights organized crime rings (Jamtara Phishing & Mewat SIM Swap syndicates), calculates risk scores, recommends high-impact freeze targets for law enforcement, and simulates network disruption in real time.

---

## 2. Refactored State Architecture & Persistent Disruption

State management is built on a single source of truth:
- **`graphState: JaalGraphState`**: Single object containing `nodes`, `edges`, `summary`, `fraudRings`, `recommendedTargets`, and `disruptionSummary`.
- **Persistent State**: Automatic re-fetching has been removed. Initial graph fetch runs once on mount. When a freeze mandate is executed, `POST /api/jaal/disrupt` updates `graphState` persistently.
- **Manual Reset**: A permanent **Reset Network** button in the header triggers `GET /api/jaal/graph` only when explicitly clicked by the user.

---

## 3. APIs Added

- `GET /api/jaal/graph` — Returns synthetic graph nodes (with precomputed SVG coordinates `cx`, `cy`), edges, detected fraud rings, risk scores, and law enforcement targets.
- `POST /api/jaal/disrupt` — Accepts `{ frozenNodeIds: [...] }`, recalculates network topology, updates summary metrics, and returns disruption impact payload.

---

## 4. How the Frontend Connects to the Backend

The custom hook `useJaalGraph.ts` inside [`src/components/network-intelligence/hooks/useJaalGraph.ts`](file:///c:/Users/sahil/OneDrive/Desktop/SafeNet/src/components/network-intelligence/hooks/useJaalGraph.ts) fetches `/api/jaal/graph` on mount, populating `graphState`. When an investigator clicks "Freeze Account" or "Freeze Target", a POST request is sent to `/api/jaal/disrupt`. The backend response completely replaces `graphState`, updating all UI components in real time.
