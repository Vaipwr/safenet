import React from "react";
import { LIVE_ALERTS } from "../data";
import { ShieldAlert, AlertTriangle, Building, MapPin, Activity, CheckCircle, TrendingUp } from "lucide-react";

interface CommandCentreProps {
  onAddAuditLog: (msg: string) => void;
}

export default function CommandCentre({ onAddAuditLog }: CommandCentreProps) {
  const stats = [
    { label: "Threats Neutralized", value: "48,931", change: "+14.2% YoY", color: "text-[var(--color-safe)]" },
    { label: "Mule Accounts Frozen", value: "11,842", change: "+9.6% MoM", color: "text-[var(--color-critical)]" },
    { label: "Call Scams Blocked", value: "1,45,920", change: "+24.5%", color: "text-[var(--color-navy)]" },
    { label: "Losses Intercepted", value: "₹412.5Cr", change: "Emergency Golden Hr", color: "text-[var(--color-navy)]" }
  ];

  const hotspots = [
    { state: "Jharkhand (Jamtara)", risk: "CRITICAL", incidents: "4,120", trend: "UP" },
    { state: "Delhi NCR", risk: "CRITICAL", incidents: "5,849", trend: "UP" },
    { state: "Haryana (Mewat)", risk: "HIGH", incidents: "2,980", trend: "DOWN" },
    { state: "Maharashtra", risk: "HIGH", incidents: "3,110", trend: "UP" },
    { state: "Karnataka", risk: "MEDIUM", incidents: "1,850", trend: "STABLE" }
  ];

  return (
    <div className="space-y-6" id="command-centre-root">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-[var(--color-ink-3)] uppercase tracking-wider">{stat.label}</span>
              <h3 className={`text-xl font-semibold mt-1 font-mono ${stat.color}`}>{stat.value}</h3>
            </div>
            <div className="flex justify-between items-center mt-3 text-[10px] text-[var(--color-ink-2)] border-t border-[var(--color-line)]/60 pt-2">
              <span>Performance Indicator:</span>
              <span className="font-semibold text-[var(--color-ink-2)]">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* State Hotspots & Live alerts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Indian Threat Hotspots */}
          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5" id="regional-hotspots-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-critical)]" />
                <span>National Regional Hotspots</span>
              </h3>
              <span className="text-[10px] font-mono text-[var(--color-ink-3)]">Source: Sanchar Saathi Analytics</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hotspots List */}
              <div className="space-y-2">
                {hotspots.map((hot, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] text-xs">
                    <div>
                      <span className="text-[var(--color-ink-2)] font-medium">{hot.state}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[var(--color-ink-3)]">
                        <span>{hot.incidents} monthly records</span>
                        <span>•</span>
                        <span className={`font-mono font-semibold ${hot.trend === "UP" ? "text-[var(--color-critical)]" : hot.trend === "DOWN" ? "text-[var(--color-safe)]" : "text-[var(--color-ink-2)]"}`}>
                          Trend {hot.trend}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded ${
                      hot.risk === "CRITICAL"
                        ? "bg-[var(--color-critical-tint)] text-[var(--color-critical)]"
                        : hot.risk === "HIGH"
                          ? "bg-[var(--color-navy-tint)] text-[var(--color-navy)]"
                          : "bg-[var(--color-safe-tint)] text-[var(--color-safe)]"
                    }`}>
                      {hot.risk}
                    </span>
                  </div>
                ))}
              </div>

              {/* Visual mini chart */}
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-mono text-[var(--color-ink-3)] uppercase mb-2">Interception Lead Times</h4>
                  <div className="space-y-2" id="lead-time-indicators">
                    <div>
                      <div className="flex justify-between text-[10px] text-[var(--color-ink-2)] mb-1">
                        <span>Golden Hour Freeze Rate</span>
                        <span className="font-mono text-[var(--color-safe)] font-semibold">88.4%</span>
                      </div>
                      <div className="w-full bg-[var(--color-paper)] rounded-full h-1.5">
                        <div className="bg-[var(--color-safe)] h-1.5 rounded-full" style={{ width: "88.4%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-[var(--color-ink-2)] mb-1">
                        <span>Telecom Chakshu Block Rate</span>
                        <span className="font-mono text-[var(--color-navy)] font-semibold">76.1%</span>
                      </div>
                      <div className="w-full bg-[var(--color-paper)] rounded-full h-1.5">
                        <div className="bg-[var(--color-medium)] h-1.5 rounded-full" style={{ width: "76.1%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-[var(--color-ink-2)] mb-1">
                        <span>APK Signature Neutralization</span>
                        <span className="font-mono text-[var(--color-navy)] font-semibold">91.5%</span>
                      </div>
                      <div className="w-full bg-[var(--color-paper)] rounded-full h-1.5">
                        <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: "91.5%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-[var(--color-ink-3)] leading-relaxed mt-4 border-t border-[var(--color-line)]/60 pt-2">
                  Active algorithms automatically sync flagged records with 22 state cooperative banks to speed up treasury holds.
                </p>
              </div>
            </div>
          </div>

          {/* Scrolling Alerts Feed */}
          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5" id="live-threat-feed">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--color-safe)]" />
                <span>Live Intercepted Threat Ledger</span>
              </h3>
              <span className="w-2.5 h-2.5 bg-[var(--color-safe)] rounded-full" />
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto" id="threat-ledger">
              {LIVE_ALERTS.map((alert) => (
                <div key={alert.id} className="flex justify-between items-center p-3 bg-[var(--color-paper)] border border-[var(--color-line)]/80 rounded-[3px] text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                      alert.status === "CRITICAL" ? "bg-[var(--color-critical)]" : "bg-[var(--color-navy)]"
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--color-ink)] font-semibold">{alert.type}</span>
                        <span className="text-[9px] text-[var(--color-ink-3)] font-mono">#{alert.id}</span>
                      </div>
                      <p className="text-[10px] text-[var(--color-ink-2)] mt-0.5 font-mono">{alert.source} • {alert.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {alert.amount && (
                      <span className="text-[10px] font-semibold text-[var(--color-ink-2)] font-mono block">{alert.amount}</span>
                    )}
                    <span className="text-[9px] text-[var(--color-ink-3)] font-mono block mt-0.5">{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Threat Analytics */}
        <div className="lg:col-span-4 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5 space-y-6" id="dashboard-right-analytics">
          {/* Scam Category Breakdown */}
          <div>
            <h3 className="font-semibold text-[var(--color-ink)] text-xs uppercase tracking-wider mb-3">Top Deception Methods</h3>
            <div className="space-y-3 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4">
              {[
                { label: "Digital Arrest", percentage: "34%", count: "12.4K cases" },
                { label: "Aadhaar KYC Suspensions", percentage: "28%", count: "10.2K cases" },
                { label: "UPI QR Prize Phishing", percentage: "20%", count: "7.3K cases" },
                { label: "Job Offer Baiting", percentage: "18%", count: "6.5K cases" }
              ].map((scam, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-ink-2)] font-medium">{scam.label}</span>
                    <span className="font-mono text-[var(--color-ink-2)]">{scam.percentage}</span>
                  </div>
                  <div className="w-full bg-[var(--color-paper)] rounded-full h-1">
                    <div className="bg-[var(--color-navy)] h-1 rounded-full" style={{ width: scam.percentage }} />
                  </div>
                  <span className="text-[9px] text-[var(--color-ink-3)] font-mono block">{scam.count} reported</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Investigations */}
          <div>
            <h3 className="font-semibold text-[var(--color-ink)] text-xs uppercase tracking-wider mb-3">Active Joint Operations</h3>
            <div className="space-y-2.5">
              {[
                { name: "Op Jamtara Shadow", status: "PHASE 3 ACTION", accounts: "142 frozen", officer: "Sandeep Gupta" },
                { name: "Op Mewat Loan Ring", status: "TRACING UPI IDS", accounts: "92 mapped", officer: "Preeti Sinha" },
                { name: "Op Noida Digital Arrest", status: "EVIDENCE SEGMENT", accounts: "18 locations", officer: "Arjun Singh" }
              ].map((op, idx) => (
                <div key={idx} className="p-3 bg-[var(--color-paper)] border border-[var(--color-line)]/80 rounded-[3px] text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-ink)] font-semibold">{op.name}</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.2 bg-[var(--color-paper)] text-[var(--color-ink-2)] rounded uppercase font-semibold border border-[var(--color-line)]">
                      {op.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-[var(--color-ink-3)]">
                    <span>Ledger: {op.accounts}</span>
                    <span>Lead: {op.officer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
