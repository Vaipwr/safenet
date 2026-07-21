import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Search, ShieldCheck, Phone, HelpCircle, ArrowRight } from "lucide-react";

interface SearchResult {
  isMatch: boolean;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  scamCategory: string;
  detailMessage: string;
}

interface CitizenPortalProps {
  onAddAuditLog: (msg: string) => void;
}

export default function CitizenPortal({ onAddAuditLog }: CitizenPortalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"phone" | "upi" | "link">("phone");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    onAddAuditLog(`Public Portal Query: searched ${searchType.toUpperCase()} index: ${searchQuery}`);

    try {
      const response = await fetch("/api/citizen-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, type: searchType }),
      });
      const data = await response.json();
      setResult(data);
      onAddAuditLog(`Public Portal result loaded: Risk ${data.riskLevel}`);
    } catch (err) {
      console.error(err);
      onAddAuditLog("Public Portal verify check failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerQuickCheck = (q: string, type: "phone" | "upi" | "link") => {
    setSearchQuery(q);
    setSearchType(type);
    // Directly submit
    setTimeout(() => {
      const btn = document.getElementById("public-search-btn");
      if (btn) btn.click();
    }, 50);
  };

  return (
    <div className="space-y-6" id="citizen-portal-container">
      {/* Search Console */}
      <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-6 md:p-8 text-center max-w-4xl mx-auto" id="public-search-hero">
        <span className="text-[10px] font-mono font-semibold tracking-widest text-[var(--color-safe)] uppercase bg-[var(--color-safe-tint)] px-2.5 py-1 rounded-full">
          National Cyber Crime Registry Database Check
        </span>
        <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-ink)] mt-3 leading-snug">
          Verify Phone, UPI, or Website Domain Safety
        </h2>
        <p className="text-xs text-[var(--color-ink-2)] mt-2 max-w-lg mx-auto leading-relaxed">
          Search the Indian national cybercrime registry (1930 records) in real-time. Instantly check if an address has been flagged for fraud.
        </p>

        {/* Form controls */}
        <form onSubmit={handleSearchVerify} className="mt-6 space-y-4" id="public-search-form">
          {/* Tabs selector */}
          <div className="flex justify-center gap-2 max-w-md mx-auto">
            {(["phone", "upi", "link"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSearchType(type);
                  setResult(null);
                }}
                className={`flex-1 py-2 rounded-[3px] border text-xs font-semibold capitalize transition-all cursor-pointer ${
                  searchType === type
                    ? "bg-[var(--color-safe)] hover:bg-[#24503b] text-white border-[var(--color-line)]"
                    : "bg-[var(--color-paper)] border-[var(--color-line)] hover:border-[var(--color-line)] text-[var(--color-ink-2)]"
                }`}
              >
                {type === "phone" ? "Mobile No" : type === "upi" ? "UPI Handle" : "URL Website"}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="relative max-w-2xl mx-auto flex items-center bg-[var(--color-paper)] border border-[var(--color-line)] focus-within:border-[var(--color-line)] rounded-[3px] overflow-hidden px-3 py-1">
            <Search className="w-5 h-5 text-[var(--color-ink-3)] ml-1 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchType === "phone"
                  ? "Enter caller number (e.g. +91 98765 43210)"
                  : searchType === "upi"
                    ? "Enter merchant UPI ID (e.g. rewards-paytm@ybl)"
                    : "Enter website domain link (e.g. onlinesbll-net.in)"
              }
              className="flex-1 bg-transparent px-3 py-3 text-sm text-[var(--color-ink)] outline-none placeholder-[var(--color-ink-3)]"
            />
            <button
              type="submit"
              id="public-search-btn"
              disabled={isLoading || !searchQuery.trim()}
              className="px-5 py-2.5 bg-[var(--color-safe)] hover:bg-[#24503b] disabled:bg-[var(--color-surface-2)] text-white disabled:text-[var(--color-ink-3)] font-semibold rounded-[3px] text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? "Checking..." : "Verify Safety"}
            </button>
          </div>
        </form>

        {/* Quick Check recommendations */}
        <div className="mt-5 flex flex-wrap justify-center items-center gap-2 text-[var(--color-ink-2)] text-[10px]" id="quick-presets">
          <span className="font-semibold text-[var(--color-ink-3)]">Quick Test:</span>
          <button
            onClick={() => handleTriggerQuickCheck("9876543210", "phone")}
            className="px-2 py-1 bg-[var(--color-paper)] border border-[var(--color-line)] hover:border-[var(--color-line)] rounded text-[var(--color-ink-2)] transition-all cursor-pointer"
          >
            Blocked Caller No
          </button>
          <button
            onClick={() => handleTriggerQuickCheck("rewards-paytm@ybl", "upi")}
            className="px-2 py-1 bg-[var(--color-paper)] border border-[var(--color-line)] hover:border-[var(--color-line)] rounded text-[var(--color-ink-2)] transition-all cursor-pointer"
          >
            Flagged UPI ID
          </button>
          <button
            onClick={() => handleTriggerQuickCheck("onlinesbll-net.in", "link")}
            className="px-2 py-1 bg-[var(--color-paper)] border border-[var(--color-line)] hover:border-[var(--color-line)] rounded text-[var(--color-ink-2)] transition-all cursor-pointer"
          >
            Phishing URL
          </button>
        </div>
      </div>

      {/* Result Display Pane */}
      {result && (
        <div className="max-w-3xl mx-auto" id="public-search-result">
          <div className={`border rounded-[3px] overflow-hidden ${
            result.isMatch
              ? result.riskLevel === "CRITICAL"
                ? "bg-[var(--color-critical-tint)] border-[var(--color-line)] text-[var(--color-critical)]"
                : "bg-[var(--color-navy-tint)] border-[var(--color-line)] text-[var(--color-navy)]"
              : "bg-[var(--color-safe-tint)] border-[var(--color-line)] text-[var(--color-safe)]"
          }`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${
              result.isMatch
                ? result.riskLevel === "CRITICAL" ? "border-[var(--color-line)]" : "border-[var(--color-line)]"
                : "border-[var(--color-line)]"
            }`}>
              <div className="flex items-center gap-2">
                {result.isMatch ? (
                  <AlertTriangle className={`w-5 h-5 ${result.riskLevel === "CRITICAL" ? "text-[var(--color-critical)]" : "text-[var(--color-navy)]"}`} />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-[var(--color-safe)]" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                  {result.isMatch ? `Registry Alert: Match Found [${result.riskLevel} Risk]` : "No Registry Flag Found [Clear Profile]"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--color-ink-3)]">Database Ledger Verification</span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                {result.isMatch && (
                  <span className="text-[10px] font-mono text-[var(--color-ink-3)] uppercase block mb-1">Threat Category</span>
                )}
                <h3 className="text-base font-semibold text-[var(--color-ink)]">
                  {result.isMatch ? result.scamCategory : "Profile Verified Clean"}
                </h3>
                <p className="text-xs text-[var(--color-ink-2)] mt-2 leading-relaxed">
                  {result.detailMessage}
                </p>
              </div>

              {/* Steps/Checks Checklist */}
              {result.isMatch ? (
                <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 text-xs text-[var(--color-ink-2)] space-y-3">
                  <h4 className="font-semibold text-[var(--color-ink)] uppercase text-[10px] tracking-wider text-[var(--color-critical)]">Emergency Actions Required</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--color-critical)] shrink-0 mt-0.5">•</span>
                      <span>**DO NOT initiate any transaction** or click any verification links provided by this entity.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--color-critical)] shrink-0 mt-0.5">•</span>
                      <span>Block this communication connection immediately on your local handset.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--color-critical)] shrink-0 mt-0.5">•</span>
                      <span>If any financial loss was incurred, immediately dial **1930 Cyber Helpline** to request bank lock.</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 text-xs text-[var(--color-ink-2)] space-y-3">
                  <h4 className="font-semibold text-[var(--color-ink)] uppercase text-[10px] tracking-wider text-[var(--color-safe)]">Security Checklist</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--color-safe)] shrink-0 mt-0.5">•</span>
                      <span>Always verify bank officials manually. Banks will never ask for your UPI PIN or credit card passwords.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--color-safe)] shrink-0 mt-0.5">•</span>
                      <span>Always check domain spellings carefully. Look for suspicious domain typos.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trust factors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4" id="trust-features-cards">
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 text-center">
          <span className="text-lg font-semibold text-[var(--color-ink)] font-mono">15.4L+</span>
          <p className="text-xs text-[var(--color-ink-2)] font-semibold mt-1">Reported Entities Checked</p>
          <p className="text-[10px] text-[var(--color-ink-3)] mt-1 leading-relaxed">Continuous database logs from 36 Indian states and union territories.</p>
        </div>
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 text-center">
          <span className="text-lg font-semibold text-[var(--color-safe)] font-mono">₹412Cr+</span>
          <p className="text-xs text-[var(--color-ink-2)] font-semibold mt-1">Victim Losses Frozen</p>
          <p className="text-[10px] text-[var(--color-ink-3)] mt-1 leading-relaxed">Direct partner bank clearance pipelines preventing dynamic layering.</p>
        </div>
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 text-center">
          <span className="text-lg font-semibold text-[var(--color-ink)] font-mono">Under 4m</span>
          <p className="text-xs text-[var(--color-ink-2)] font-semibold mt-1">Mule Account Interception</p>
          <p className="text-[10px] text-[var(--color-ink-3)] mt-1 leading-relaxed">Automated CERT-In triggers locking secondary money trails.</p>
        </div>
      </div>
    </div>
  );
}
