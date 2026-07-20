import React, { useState } from "react";
import { SAMPLE_BANKNOTES } from "../data";
import { CurrencyAnalysis } from "../types";
import { Coins, Upload, Search, Activity, ShieldCheck, AlertTriangle } from "lucide-react";

interface CurrencyForensicsProps {
  onAddAuditLog: (msg: string) => void;
}

export default function CurrencyForensics({ onAddAuditLog }: CurrencyForensicsProps) {
  const [selectedNote, setSelectedNote] = useState(SAMPLE_BANKNOTES[0]);
  const [analysisResult, setAnalysisResult] = useState<CurrencyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Base64 of the user's uploaded image, kept so the "Run Inspection Verdict"
  // button can re-analyse the upload instead of a name tag with no image.
  const [uploadedB64, setUploadedB64] = useState<string | null>(null);
  const [activeHoverMark, setActiveHoverMark] = useState<any | null>(null);

  // Reject responses that are missing the fields the UI renders, so a bad
  // payload surfaces as a clear message instead of a blank panel or a crash.
  const isValidAnalysis = (d: any): d is CurrencyAnalysis =>
    d && Array.isArray(d.features) && Array.isArray(d.heatmapMarkings);

  const triggerVerification = async (noteId: string) => {
    // A custom upload has no server-side sample file — it must be re-sent as an
    // image. Guard against clicking Run before anything has been uploaded.
    const isCustom = noteId === "custom_note";
    if (isCustom && !uploadedB64) {
      setErrorMsg("Please upload a note image first, then run the inspection.");
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setErrorMsg(null);
    onAddAuditLog(`Requested optical forensic analysis on Banknote [ID: ${noteId}]`);

    try {
      const body = isCustom
        ? { noteImageBase64: uploadedB64 }
        : { selectedNoteId: noteId };
      const response = await fetch("/api/currency-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data = await response.json();
      if (!isValidAnalysis(data)) throw new Error("Malformed analysis response");
      setAnalysisResult(data);
      onAddAuditLog(`Forensic scan completed for Serial No ${data.serialNo}. Verdict: ${data.isValid ? "Genuine" : "Counterfeit Warn"}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Analysis failed: ${err?.message || "request error"}. Is the NETRA backend running on port 8000?`);
      onAddAuditLog("Forensic scan error encountered.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const b64 = reader.result as string;
        setUploadedB64(b64);
        setIsLoading(true);
        setAnalysisResult(null);
        setErrorMsg(null);
        onAddAuditLog("Uploading custom currency note for forensic analysis...");

        try {
          const response = await fetch("/api/currency-detector", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ noteImageBase64: reader.result }),
          });
          if (!response.ok) throw new Error(`Server responded ${response.status}`);
          const data = await response.json();
          if (!isValidAnalysis(data)) throw new Error("Malformed analysis response");
          setAnalysisResult(data);
          setSelectedNote({
            id: "custom_note",
            name: "Uploaded Custom Banknote",
            value: 500,
            imageUrl: reader.result as string,
            isValid: data.isValid,
            description: `Serial Number detected: ${data.serialNo}`
          });
          onAddAuditLog(`Custom analysis finished. Serial Number: ${data.serialNo}`);
        } catch (err: any) {
          console.error(err);
          setErrorMsg(`Upload analysis failed: ${err?.message || "request error"}. Is the NETRA backend running on port 8000?`);
          onAddAuditLog("Custom upload inspection failed.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="currency-root-panel">
      {/* Selector and Controller */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5" id="currency-select-card">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-100">Banknote Specimen</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Select an official Reserve Bank of India banknote sample or upload a clear photo of your own Rs 500 bill to run an automated threat assessment.
          </p>

          <div className="space-y-3 mb-5" id="specimen-list">
            {SAMPLE_BANKNOTES.map((note) => (
              <button
                key={note.id}
                id={`specimen-btn-${note.id}`}
                onClick={() => {
                  setSelectedNote(note);
                  setAnalysisResult(null);
                  setErrorMsg(null);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedNote.id === note.id
                    ? "bg-slate-800/80 border-amber-500/50 text-slate-100"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-200">{note.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    note.isValid ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {note.isValid ? "Genuine Type" : "Scam Specimen"}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400">{note.description}</p>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4" id="currency-upload-block">
            <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-slate-700 rounded-lg p-4 cursor-pointer bg-slate-950 transition-all">
              <Upload className="w-5 h-5 text-slate-500 mb-1" />
              <span className="text-xs font-medium text-slate-300">Upload Custom Note Image</span>
              <span className="text-[9px] text-slate-500 mt-1">PNG, JPG up to 5MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
            </label>
          </div>

          <button
            id="run-currency-forensics"
            onClick={() => triggerVerification(selectedNote.id)}
            disabled={isLoading}
            className="w-full mt-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Forensic Scanner Processing...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Run Inspection Verdict</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3" id="currency-error-banner">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-400">Scan could not complete</p>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5" id="currency-verdict-summary">
            <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-3">Verification Verdict</h4>
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              analysisResult.isValid ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
            }`}>
              {analysisResult.isValid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${analysisResult.isValid ? "text-emerald-400" : "text-rose-400"}`}>
                    {analysisResult.isValid ? "VALID BANKNOTE" : "COUNTERFEIT ALERT"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Conf: {analysisResult.confidence}%</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {analysisResult.isValid 
                    ? "All vital Reserve Bank of India security indices align perfectly with state treasury parameters."
                    : `Forensic warning: ${analysisResult.mismatchReason}`}
                </p>
                <div className="mt-2 text-[10px] font-mono text-slate-400">
                  Serial No: {analysisResult.serialNo}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Canvas and Heatmap */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5" id="currency-canvas-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>Inspection Heatmap Overlays</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">RBI Banknote Safety Protocol v4.2</span>
          </div>

          {/* Interactive Bounding Box Stage */}
          <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-4 min-h-[300px]">
            {/* Wrapper shrinks to the rendered image so overlay boxes are
                positioned relative to the NOTE, not the letterboxed panel. */}
            <div className="relative inline-block">
              <img
                src={selectedNote.imageUrl}
                alt="Rupee Note Specimen"
                referrerPolicy="no-referrer"
                className="block max-h-[320px] w-auto rounded-lg object-contain select-none"
              />

              {/* Render analysis overlays if loaded — % is relative to the image */}
              {analysisResult && analysisResult.heatmapMarkings.map((mark, index) => (
                <div
                  key={index}
                  id={`landmark-box-${index}`}
                  onMouseEnter={() => setActiveHoverMark(mark)}
                  onMouseLeave={() => setActiveHoverMark(null)}
                  style={{
                    left: `${mark.x}%`,
                    top: `${mark.y}%`,
                    width: `${mark.width}%`,
                    height: `${mark.height}%`
                  }}
                  className={`absolute cursor-pointer border transition-all duration-300 ${
                    activeHoverMark?.label === mark.label
                      ? "bg-amber-500/10 border-amber-400 ring-2 ring-amber-400 shadow-lg"
                      : mark.status === "valid"
                        ? "border-emerald-500/60 hover:bg-emerald-500/10"
                        : "border-rose-500/60 hover:bg-rose-500/10"
                  }`}
                >
                  {/* Visual marker pin */}
                  <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full flex items-center justify-center font-mono text-[8px] font-bold text-slate-950 ${
                    mark.status === "valid" ? "bg-emerald-400" : "bg-rose-400"
                  }`}>
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-100 gap-3">
                <Activity className="w-8 h-8 text-amber-500 animate-spin" />
                <span className="text-xs font-mono text-slate-400">Performing high-precision RGB watermark alignment...</span>
              </div>
            )}

            {!analysisResult && !isLoading && (
              <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-lg text-center shadow-lg">
                  <p className="text-xs text-slate-300 font-semibold">Ready for Spectral Scan</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Click 'Run Inspection Verdict' to segment security markers.</p>
                </div>
              </div>
            )}
          </div>

          {/* Active Landmark Information */}
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg min-h-[70px]">
            {activeHoverMark ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    activeHoverMark.status === "valid" ? "bg-emerald-400" : "bg-rose-400"
                  }`} />
                  <span className="text-xs font-bold text-slate-200">{activeHoverMark.label}</span>
                  <span className={`text-[9px] uppercase px-1.5 font-mono rounded ${
                    activeHoverMark.status === "valid" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {activeHoverMark.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{activeHoverMark.description}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full py-2">
                <p className="text-[11px] text-slate-500">
                  {analysisResult 
                    ? "Hover over the green/red boxes on the banknote to inspect security markers in real-time."
                    : "Forensic indicators will display here once the verification process is complete."}
                </p>
              </div>
            )}
          </div>
        </div>

        {analysisResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature Audit Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5" id="currency-features-list">
              <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-3">Feature Checklist Verification</h4>
              <div className="space-y-2">
                {analysisResult.features.map((feat, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800/60 text-xs">
                    <span className="text-slate-300 font-medium">{feat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{feat.detail}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        feat.status === "PASS"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {feat.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Machine Audit Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5" id="currency-audit-ledger">
              <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-3">Technical Audit Log</h4>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-[130px] overflow-y-auto font-mono text-[10px] text-slate-400 space-y-1.5">
                {analysisResult.auditLog.map((log, index) => (
                  <div key={index} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-amber-500 shrink-0">⚡</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
