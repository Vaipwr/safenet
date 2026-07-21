# JAAL Architecture Decision Records (ADR)

- **Purpose**: Tracks major structural, design, and technical decisions made during the development of JAAL.
- **Last Updated**: 2026-07-21
- **Related Files**: `docs/JAAL_ARCHITECTURE.md`, `server/jaal/graphEngine.ts`
- **Maintainer**: SafeNet Engineering Team (JAAL Lead)

---

## ADR-001: Deterministic Synthetic Graph Engine

- **Context**: Hackathon prototype requiring fast, reproducible, and realistic Indian cybercrime network visualizations (Jamtara Phishing & Mewat SIM-Swap rings).
- **Problem**: Live graph databases (Neo4j) or external APIs add complex setup instructions, latency, and deployment risks for teammates.
- **Decision**: Implement a pure TypeScript deterministic graph generator in `server/jaal/graphEngine.ts`.
- **Reasoning**: Ensures zero setup overhead for teammates, 100% test reliability, and instant response times (<10ms).
- **Alternatives Considered**: Neo4j, NetworkX via Python microservice (rejected due to multi-runtime dependency bloat).
- **Consequences**: Easy to maintain and demo; easily extendable with live database queries post-hackathon.

---

## ADR-002: Backend Normalized SVG Coordinate Layout

- **Context**: Existing [`NetworkIntelligence.tsx`](file:///c:/Users/sahil/OneDrive/Desktop/SafeNet/src/components/NetworkIntelligence.tsx) uses native SVG elements (`<circle>`, `<line>`) to render graph topology.
- **Problem**: Including client-side force-directed graphing libraries (e.g. D3.js) requires complex React ref hooks, potential canvas re-render lag, and visual jitter.
- **Decision**: Backend layout engine pre-computes normalized 2D SVG canvas coordinates (`cx`, `cy`) for all generated nodes.
- **Reasoning**: Guarantees zero UI layout pop-in, high rendering performance, and clean element separation out of the box.
- **Alternatives Considered**: D3-force on client (rejected for simplicity and stability).
- **Consequences**: Frontend renderer remains thin and declarative.

---

## ADR-003: Modular Logic Isolation (`server/jaal/`)

- **Context**: Need to keep [`server.ts`](file:///c:/Users/sahil/OneDrive/Desktop/SafeNet/server.ts) clean and readable as multiple teammates add API routes.
- **Problem**: Adding graph generation, fraud ring clustering, and disruption metrics directly in `server.ts` bloats the root server file.
- **Decision**: Place all business logic inside `server/jaal/graphEngine.ts`. `server.ts` will only act as an HTTP routing wrapper.
- **Reasoning**: Strict separation of concerns makes code review and teammate handoff effortless.
- **Consequences**: High modularity and clear code ownership.
