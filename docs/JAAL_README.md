# JAAL Module Quick Start & Teammate Guide

- **Purpose**: Quick start guide for teammates working on or extending the JAAL Fraud Network Graph Intelligence module.
- **Last Updated**: 2026-07-21
- **Related Files**: `server/jaal/graphEngine.ts`, `src/components/NetworkIntelligence.tsx`
- **Maintainer**: SafeNet Engineering Team (JAAL Lead)

---

## What is JAAL?
JAAL is the **Fraud Network Graph Intelligence** engine for SafeNet (PRAHARI). It maps relationships across suspect entities (phone numbers, mule bank accounts, UPI handles, device IMEIs, IP addresses) to identify organized crime syndicates, rank top targets for law enforcement intervention, and simulate network disruption.

---

## Folder Overview & File Locations

- **Backend Logic**: `server/jaal/graphEngine.ts`
- **API Routes**: `server.ts` (`/api/jaal/*`)
- **Frontend View**: `src/components/NetworkIntelligence.tsx`
- **Documentation**: `docs/`

---

## Running Locally

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```
2. Start the SafeNet dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser and click on **Network Intel** in the top navigation bar.

---

## Extension Guide for Teammates

- **Adding a new Entity Type**: Update entity category mappings in `server/jaal/graphEngine.ts` and add color key support in `src/components/NetworkIntelligence.tsx`.
- **Modifying Synthetic Graph Data**: Edit the scenario generator inside `server/jaal/graphEngine.ts`.
