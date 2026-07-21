import React from "react";
import { NetworkIntelligenceContainer } from "./network-intelligence/NetworkIntelligenceContainer";

interface NetworkIntelligenceProps {
  onAddAuditLog: (msg: string) => void;
}

/**
 * Re-export wrapper component for backwards compatibility with App.tsx imports.
 */
export default function NetworkIntelligence({ onAddAuditLog }: NetworkIntelligenceProps) {
  return <NetworkIntelligenceContainer onAddAuditLog={onAddAuditLog} />;
}
