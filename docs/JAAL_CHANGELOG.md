# JAAL Changelog

- **Purpose**: Chronological log of all modifications, features added, and bug fixes in the JAAL module.
- **Last Updated**: 2026-07-21
- **Related Files**: All files in `docs/`, `server/jaal/`, `src/types/jaal.ts`, `src/components/network-intelligence/`
- **Maintainer**: SafeNet Engineering Team (JAAL Lead)

---

## [Demo Stability Polish] - 2026-07-21

### Persistent Disruption State & Manual "Reset Network" Control

- **Files Modified**:
  - `src/components/network-intelligence/hooks/useJaalGraph.ts`
  - `src/components/network-intelligence/NetworkHeader.tsx`
  - `src/components/network-intelligence/NetworkIntelligenceContainer.tsx`
  - `docs/JAAL_CHANGELOG.md`
  - `docs/TEAM_HANDOVER.md`

- **Purpose**:
  - Removed all automatic re-fetching of baseline graph data (`useRef` added for `onAddAuditLog`, `useEffect` dependency array set to `[]` so initial fetch runs strictly ONCE on mount).
  - Ensured disruption state returned by `POST /api/jaal/disrupt` is held persistently in `graphState` without automatic resets or re-fetches.
  - Added a permanent **Reset Network** button in `NetworkHeader.tsx` as the single manual trigger for `GET /api/jaal/graph`.

- **Impact on Application**:
  - 100% demo stability for hackathon presentations: freeze actions update canvas, inspector, summary cards, threat badge, and disruption controls, and remain visible until the user manually clicks "Reset Network".
  - Verified `npx tsc --noEmit` with 0 compilation errors.

---

## [State Architecture Refactor] - 2026-07-21

### Single Source of Truth `graphState` & `selectedNodeId` Refactor

---

## [Step 5] - 2026-07-21

### Step 5: Network Disruption Simulation Workflow & Final Polish

---

## [Graph Readability Polish] - 2026-07-21

### Network Topology Readability & Presentation Refactor

---

## [Step 4] - 2026-07-21

### Step 4: Modular UI Refactoring & Backend API Integration

---

## [Step 3] - 2026-07-21

### Step 3: Modular Type Organization & Type Safety

---

## [Step 2] - 2026-07-21

### Step 2: Route Registration in `server.ts`

---

## [Step 1] - 2026-07-21

### Step 1: Initial Setup & Backend Graph Engine Creation
