import React, { useState } from "react";
import { SAMPLE_TRANSCRIPTS } from "../data";
import { ScamCallAnalysis } from "../types";
import { Phone, AlertTriangle, Play, FileText, CheckCircle, HelpCircle, Activity } from "lucide-react";

interface ScamAnalyserProps {
  onAddAuditLog: (msg: string) => void;
}

export default function ScamAnalyser({ onAddAuditLog }: ScamAnalyserProps) {
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_TRANSCRIPTS[0]);
  const [transcriptText, setTranscriptText] = useState(SAMPLE_TRANSCRIPTS[0].text);
  const [language, setLanguage] = useState("Hindi / Hinglish");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ScamCallAnalysis | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<any | null>(null);

  const handlePresetSelect = (preset: typeof SAMPLE_TRANSCRIPTS[0]) => {
    setSelectedPreset(preset);
    setTranscriptText(preset.text);
    setLanguage(preset.language);
    setAnalysis(null);
    setSelectedHighlight(null);
  };

  const runAnalysis = async () => {
    if (!transcriptText.trim()) return;
    setIsLoading(true);
    setAnalysis(null);
    setSelectedHighlight(null);
    onAddAuditLog(`Requested Scam Call Transcript Analysis (${language}). Size: ${transcriptText.length} chars.`);

    try {
      const response = await fetch("/api/scam-analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText, language }),
      });
      const data = await response.json();
      setAnalysis(data);
      onAddAuditLog(`Call analysis finished. Threat level: ${data.riskLevel} (${data.riskScore}/100)`);
    } catch (err) {
      console.error(err);
      onAddAuditLog("Transcript forensic parser crashed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="scam-analyser-root">
      {/* Transcript Input Control */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5" id="transcript-input-card">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-[var(--color-critical)]" />
            <h3 className="font-semibold text-[var(--color-ink)]">Suspect Dialogue Records</h3>
          </div>

          <p className="text-xs text-[var(--color-ink-2)] mb-4">
            Paste an intercepted telephonic transcript or choose from typical high-impact Indian fraud presets below to extract critical risk indexes.
          </p>

          {/* Preset Buttons */}
          <div className="space-y-2.5 mb-4" id="presets-panel">
            {SAMPLE_TRANSCRIPTS.map((preset) => (
              <button
                key={preset.id}
                id={`preset-btn-${preset.id}`}
                onClick={() => handlePresetSelect(preset)}
                className={`w-full text-left p-2.5 rounded-[3px] border text-xs transition-all ${
                  selectedPreset.id === preset.id
                    ? "bg-[var(--color-surface-2)] border-[var(--color-line)] text-[var(--color-ink)]"
                    : "bg-[var(--color-paper)] border-[var(--color-line)] hover:border-[var(--color-line)] text-[var(--color-ink-2)]"
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>{preset.title}</span>
                  <span className="text-[9px] text-[var(--color-ink-3)]">{preset.language}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Transcript Form */}
          <div className="space-y-3" id="transcript-form">
            <div>
              <label className="block text-[10px] font-mono text-[var(--color-ink-2)] uppercase mb-1">Target Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-line)]"
              >
                <option>Hindi / Hinglish</option>
                <option>English / Hindi</option>
                <option>English only</option>
                <option>Bengali</option>
                <option>Tamil / Telugu</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[var(--color-ink-2)] uppercase mb-1">Conversation Transcript</label>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                rows={6}
                placeholder="Paste the suspicious speech record or transcript text here..."
                className="w-full bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-3 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-line)] font-sans leading-relaxed resize-none"
              />
            </div>

            <button
              id="analyze-transcript-btn"
              onClick={runAnalysis}
              disabled={isLoading || !transcriptText.trim()}
              className="w-full py-2.5 bg-[var(--color-critical)] hover:bg-[#741c1c] disabled:bg-[var(--color-surface-2)] text-white disabled:text-[var(--color-ink-3)] font-semibold rounded-[3px] text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Voice Vectors...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Analyse Conversation Risk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Reports Display */}
      <div className="lg:col-span-7 space-y-6">
        {analysis ? (
          <div className="space-y-6" id="analysis-reports-container">
            {/* Main Indicators Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase mb-2">Threat Index</span>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke={analysis.riskScore > 75 ? "#ef4444" : "#f59e0b"}
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray="201"
                      strokeDashoffset={201 - (201 * analysis.riskScore) / 100}
                    />
                  </svg>
                  <span className="absolute text-lg font-semibold text-[var(--color-ink)] font-mono">{analysis.riskScore}%</span>
                </div>
                <span className={`text-[10px] font-semibold mt-2 px-2 py-0.5 rounded font-mono ${
                  analysis.riskLevel === "CRITICAL" || analysis.riskLevel === "HIGH"
                    ? "bg-[var(--color-critical-tint)] text-[var(--color-critical)]"
                    : "bg-[var(--color-navy-tint)] text-[var(--color-navy)]"
                }`}>
                  {analysis.riskLevel} RISK
                </span>
              </div>

              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 md:col-span-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[var(--color-ink-2)] uppercase">Identified Scam Classification</span>
                  <h4 className="font-semibold text-[var(--color-ink)] mt-1 text-sm">{analysis.scamType}</h4>
                  <p className="text-[11px] text-[var(--color-ink-2)] mt-2 leading-relaxed">
                    Forensic algorithms verified core patterns matching registered telephonic exploitation methods targeting Indian citizens.
                  </p>
                </div>
                <div className="flex justify-between items-center mt-3 border-t border-[var(--color-line)]/60 pt-2 text-[10px]">
                  <span className="text-[var(--color-ink-3)]">Forensic Confidence:</span>
                  <span className="font-mono text-[var(--color-ink-2)] font-semibold">{analysis.confidence}%</span>
                </div>
              </div>
            </div>

            {/* Interactive Highlighted Transcript */}
            <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5" id="transcript-highlight-card">
              <h4 className="font-semibold text-xs text-[var(--color-ink-2)] uppercase tracking-wider mb-3">AI Social Engineering Mapping</h4>
              <p className="text-[11px] text-[var(--color-ink-2)] mb-3 leading-relaxed">
                We have segmented key suspicious cues. Click on highlighted phrases to view technical fraud analysis.
              </p>

              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 leading-relaxed text-xs text-[var(--color-ink-2)] font-sans space-y-4 max-h-[220px] overflow-y-auto">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[var(--color-ink-3)] uppercase tracking-wider block">Verbatim:</span>
                  <p className="whitespace-pre-line leading-loose">
                    {/* Render a beautiful highlighted text by replacing identified phrases */}
                    {(() => {
                      let text = analysis.englishTranscript;
                      const sortedHighlights = [...analysis.highlights].sort((a, b) => b.text.length - a.text.length);
                      
                      // For render simplicity, we show standard phrases or click maps
                      return (
                        <>
                          {text.split("\n").map((line, lIdx) => {
                            let elements: React.ReactNode[] = [line];
                            
                            sortedHighlights.forEach((hl, hIdx) => {
                              const newElements: React.ReactNode[] = [];
                              elements.forEach((el) => {
                                if (typeof el === "string") {
                                  const parts = el.split(hl.text);
                                  if (parts.length > 1) {
                                    parts.forEach((part, pIdx) => {
                                      newElements.push(part);
                                      if (pIdx < parts.length - 1) {
                                        newElements.push(
                                          <span
                                            key={`${lIdx}-${hIdx}-${pIdx}`}
                                            onClick={() => setSelectedHighlight(hl)}
                                            className={`cursor-pointer border-b-2 font-medium px-0.5 transition-all ${
                                              hl.severity === "high"
                                                ? "border-[var(--color-critical)] hover:bg-[var(--color-critical-tint)] text-[var(--color-critical)]"
                                                : "border-[var(--color-navy)] hover:bg-[var(--color-navy-tint)] text-[var(--color-navy)]"
                                            }`}
                                          >
                                            {hl.text}
                                          </span>
                                        );
                                      }
                                    });
                                  } else {
                                    newElements.push(el);
                                  }
                                } else {
                                  newElements.push(el);
                                }
                              });
                              elements = newElements;
                            });

                            return <div key={lIdx} className="mb-2">{elements}</div>;
                          })}
                        </>
                      );
                    })()}
                  </p>
                </div>
              </div>

              {/* Display Box for Active Highlight Inspection */}
              <div className="mt-4 p-4 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] min-h-[60px]" id="highlight-detail-box">
                {selectedHighlight ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedHighlight.severity === "high" ? "bg-[var(--color-critical)]" : "bg-[var(--color-navy)]"}`} />
                      <span className="text-xs font-semibold text-[var(--color-ink)]">Deception Vector: "{selectedHighlight.text}"</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-ink-2)] leading-relaxed">
                      <span className="font-semibold text-[var(--color-ink-2)]">Tactic Profile:</span> {selectedHighlight.reason}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full py-2">
                    <p className="text-[11px] text-[var(--color-ink-3)] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[var(--color-ink-3)]" />
                      <span>Click highlighted orange/red segments above to inspect deceptive tactics.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations & Action Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4">
                <h5 className="font-semibold text-xs text-[var(--color-ink-2)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--color-safe)]" />
                  <span>Enforcement Safety Advisory</span>
                </h5>
                <ul className="space-y-1.5">
                  {analysis.actions.map((act, idx) => (
                    <li key={idx} className="text-[11px] text-[var(--color-ink-2)] flex items-start gap-1.5 leading-relaxed">
                      <span className="text-[var(--color-safe)] shrink-0 mt-0.5">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4">
                <h5 className="font-semibold text-xs text-[var(--color-ink-2)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[var(--color-navy)]" />
                  <span>Corresponding Database Matches</span>
                </h5>
                <div className="space-y-1.5">
                  {analysis.cases.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded bg-[var(--color-paper)] border border-[var(--color-line)]/40 text-[10px]">
                      <div>
                        <span className="text-[var(--color-ink-2)] font-medium">{c.caseId}</span>
                        <span className="text-[var(--color-ink-3)] ml-1.5">({c.title})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[var(--color-ink-2)] font-semibold">{c.similarity} match</span>
                        <span className="px-1 py-0.2 rounded bg-[var(--color-surface-2)] text-[8px] text-[var(--color-ink-2)] uppercase font-mono">{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] border-dashed rounded-[3px] p-12 text-center h-full flex flex-col items-center justify-center min-h-[350px]">
            <Phone className="w-10 h-10 text-[var(--color-ink-3)] mb-3" />
            <h3 className="font-semibold text-[var(--color-ink-2)] mb-1">Transcript Diagnostic Pending</h3>
            <p className="text-xs text-[var(--color-ink-3)] max-w-sm mx-auto leading-relaxed">
              Click 'Analyse Conversation Risk' on the left controller to trigger a secure NLP forensic parse across fraud databases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
