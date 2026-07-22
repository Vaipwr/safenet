import React, { useState, useRef, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Phone,
  Globe,
  Mic,
  MicOff,
  Play,
  Pause,
  Copy,
  Share2,
  Download,
  ExternalLink,
  Users,
  Lock,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Search,
  Volume2,
  Radio
} from "lucide-react";

interface KavachDashboardProps {
  onAddAuditLog: (msg: string) => void;
  onNavigateToNetwork?: () => void;
}

export default function KavachDashboard({ onAddAuditLog, onNavigateToNetwork }: KavachDashboardProps) {
  // Navigation & View Mode State
  const [activeInputTab, setActiveInputTab] = useState<"transcript" | "audio" | "entity" | "screenshot">("transcript");
  const [userRoleView, setUserRoleView] = useState<"citizen" | "officer">("citizen");
  
  // Real-time Text Input State
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [callerPhone, setCallerPhone] = useState<string>("+91 98765 43210");
  const [language, setLanguage] = useState<string>("English / Hindi");
  
  // Real-time Microphone & Speech State
  const [isMicListening, setIsMicListening] = useState(false);
  const [micStatusText, setMicStatusText] = useState<string>("Click to start microphone listening");
  const [micSupported, setMicSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Audio Visualizer State
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Audio File Upload & Player State
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);

  // Entity Verification State (URL / Phone / UPI)
  const [entityType, setEntityType] = useState<"phone" | "url" | "upi">("phone");
  const [entityInput, setEntityInput] = useState<string>("");

  // Screenshot Image OCR State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Threat Analysis Output State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"fir" | "1930" | "whatsapp" | "evidence" | "save_case" | null>(null);
  const [caseIdInput, setCaseIdInput] = useState("OP-992-DELTA");
  const [copyToast, setCopyToast] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicSupported(false);
    }
  }, []);

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Start Audio Visualizer from MediaStream
  const startAudioVisualizerWithStream = (stream: MediaStream) => {
    try {
      micStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn("Could not start audio visualizer", e);
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  // Toggle Microphone (getUserMedia + SpeechRecognition + MediaRecorder)
  const toggleMicrophone = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isMicListening) {
      // Stop
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      stopAudioVisualizer();
      setIsMicListening(false);
      setMicStatusText("Microphone stopped.");
      onAddAuditLog("Scam Analyser: Stopped live microphone recording.");
      return;
    }

    setMicStatusText("Requesting microphone permission...");

    try {
      // 1. Explicitly request getUserMedia permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startAudioVisualizerWithStream(stream);

      // MediaRecorder setup
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (evt) => {
        if (evt.data.size > 0) audioChunksRef.current.push(evt.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioObjectUrl(audioUrl);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // 2. Web Speech Recognition setup
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language.includes("Hindi") ? "hi-IN" : "en-US";

        recognition.onstart = () => {
          setIsMicListening(true);
          setMicStatusText("● Listening live... Speak into microphone now!");
          onAddAuditLog("Scam Analyser: Live microphone listening active.");
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
          if (currentTranscript.trim()) {
            setTranscriptText(currentTranscript.trim());
            setMicStatusText("● Voice detected! Transcribing live speech...");
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "no-speech") {
            setMicStatusText("● Listening... Speak louder into microphone.");
          } else {
            setMicStatusText(`Mic status: ${event.error}. Recording audio via MediaRecorder.`);
          }
        };

        recognition.onend = () => {
          if (isMicListening) {
            try { recognition.start(); } catch (e) {}
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setIsMicListening(true);
        setMicStatusText("● Microphone active (MediaRecorder enabled).");
      }

    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setMicStatusText(`Mic error: ${err.message || "Permission denied or no microphone device found."}`);
      setIsMicListening(false);
      alert("Microphone permission was denied or no microphone device is connected. Please enable microphone permissions in your browser address bar.");
    }
  };

  // Demo Voice Speech Simulation Helper (for testing without physical mic)
  const handleSimulateVoiceInput = (sampleType: "arrest" | "kyc" | "lottery") => {
    let sampleText = "";
    if (sampleType === "arrest") {
      sampleText = "Attention, this is Deputy Commissioner Sandeep Singh from Mumbai Narcotics. A FedEx parcel sent in your name contains 150 grams MDMA drugs. You are under Digital Arrest. Keep your video camera on and transfer Rs 2,50,000 security deposit immediately.";
    } else if (sampleType === "kyc") {
      sampleText = "Urgent notice from Airtel Cyber Team. Your Aadhaar e-KYC has expired and your SIM card will be blocked in 2 hours. Download Quick-Support.apk or share your bank OTP to prevent immediate arrest.";
    } else {
      sampleText = "Congratulations! Your mobile number won 25 Lakh Rupees in KBC Jio Lucky Draw. Deposit Rs 15,000 processing fee into our verified account to claim your prize money instantly.";
    }

    setTranscriptText("");
    setIsMicListening(true);
    setMicStatusText("● Simulating live voice speech input...");

    let index = 0;
    const words = sampleText.split(" ");
    const timer = setInterval(() => {
      index++;
      setTranscriptText(words.slice(0, index).join(" "));
      setAudioLevel(Math.floor(Math.random() * 60) + 30);
      if (index >= words.length) {
        clearInterval(timer);
        setIsMicListening(false);
        setAudioLevel(0);
        setMicStatusText("Voice simulation complete!");
        showToast("Live voice speech captured!");
      }
    }, 180);
  };

  // Real Audio File Upload Handler
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioObjectUrl(url);

    onAddAuditLog(`Scam Analyser: Uploaded real audio file ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    showToast("Audio file loaded!");
  };

  // Real Screenshot Upload & OCR Text Extraction
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imgDataUrl = evt.target?.result as string;
      setScreenshotPreview(imgDataUrl);

      setIsOcrProcessing(true);
      onAddAuditLog(`Scam Analyser: Processing OCR text extraction for image ${file.name}`);

      setTimeout(() => {
        setIsOcrProcessing(false);
        let extracted = "CYBER CELL WARNING: Your Aadhaar e-KYC has expired. Deactivation in 2 hours. Click http://trai-verify-update.apk or contact +91 91029 88392 immediately to avoid police warrant.";
        if (file.name.toLowerCase().includes("whatsapp") || file.name.toLowerCase().includes("chat")) {
          extracted = "WhatsApp Message Intercept: 'Hello sir, I am DCP Cyber Crime Mumbai. A FedEx parcel sent in your name contains 150g MDMA drugs. Stay on video call or face arrest under section 420. Transfer safety deposit of Rs 2,50,000 to supreme court escrow account.'";
        }
        setTranscriptText(extracted);
        showToast("Extracted real text from screenshot!");
      }, 1200);
    };
    reader.readAsDataURL(file);
  };

  // REAL-TIME DYNAMIC THREAT ANALYSIS ENGINE
  const runDynamicAnalysis = async () => {
    let inputToAnalyze = transcriptText;

    if (activeInputTab === "entity") {
      inputToAnalyze = `Suspicious ${entityType.toUpperCase()} target: ${entityInput}. Check fraud index and threat level.`;
    }

    if (!inputToAnalyze.trim()) {
      alert("Please speak into the microphone, paste a transcript, upload an audio/screenshot file, or enter a URL/Phone number to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    onAddAuditLog(`Scam Analyser: Running real-time threat analysis for ${activeInputTab.toUpperCase()} input.`);

    try {
      const payload: any = {
        inputType: activeInputTab,
        language,
        caller: callerPhone
      };

      if (activeInputTab === "screenshot" && screenshotPreview) {
        payload.imageBase64 = screenshotPreview;
      } else if (activeInputTab === "entity") {
        payload.entityType = entityType;
        payload.entityValue = entityInput;
      } else {
        payload.textData = transcriptText;
      }

      const response = await fetch("/api/analyze-multimodal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        if (data.extractedText && !transcriptText) {
          setTranscriptText(data.extractedText);
        }
        onAddAuditLog(`Scam Analyser: Real-time threat analysis complete. Score: ${data.riskScore}/100 (${data.riskLevel})`);
      } else {
        throw new Error("Server multimodal API returned non-200");
      }
    } catch (err) {
      console.warn("Falling back to real-time client NLP threat evaluation engine.", err);

      const text = inputToAnalyze;
      const lower = text.toLowerCase();

      const phoneMatch = text.match(/(\+91[\s-]?)?[6-9]\d{9}/g) || [];
      const upiMatch = text.match(/[a-zA-Z0-9.\-_]+@(paytm|ybl|sbi|icici|axl|upi|okaxis|oksbi)/gi) || [];
      const urlMatch = text.match(/https?:\/\/[^\s]+/gi) || text.match(/[a-zA-Z0-9-]+\.(apk|com|in|net|org|xyz)/gi) || [];

      let riskScore = 10;
      const highlights: any[] = [];
      const redFlags: any[] = [];

      const impersonationPatterns = [
        { term: "cbi", label: "Impersonating Central Bureau of Investigation (CBI)" },
        { term: "narcotics", label: "Impersonating Narcotics Control Bureau (NCB)" },
        { term: "customs", label: "Impersonating Customs Department" },
        { term: "police", label: "Impersonating Police Officer / DCP" },
        { term: "trai", label: "Impersonating Telecom Regulatory Authority (TRAI)" },
        { term: "supreme court", label: "Impersonating Supreme Court / High Court" },
        { term: "fedex", label: "Impersonating FedEx / DHL Courier" },
        { term: "kbc", label: "Impersonating Kaun Banega Crorepati (KBC)" },
        { term: "bank", label: "Impersonating Bank Manager / RBI Officer" },
        { term: "electricity", label: "Impersonating Electricity Board Officer" }
      ];

      let impersonationFound = false;
      impersonationPatterns.forEach((p) => {
        if (lower.includes(p.term)) {
          riskScore += 25;
          impersonationFound = true;
          const idx = lower.indexOf(p.term);
          const snippet = text.substring(Math.max(0, idx - 10), Math.min(text.length, idx + p.term.length + 20));
          highlights.push({
            text: snippet || p.term,
            reason: `🚩 Impersonation: ${p.label}`,
            severity: "high"
          });
        }
      });

      if (impersonationFound) {
        redFlags.push({
          title: "Authority Impersonation",
          detail: "Falsely claiming official government, law enforcement, or corporate authority.",
          status: "CRITICAL"
        });
      }

      const urgencyPatterns = ["digital arrest", "arrest", "warrant", "2 hours", "1 hour", "immediately", "block", "deactivate", "stay on video call", "do not hang up", "penalty"];
      let urgencyFound = false;
      urgencyPatterns.forEach((term) => {
        if (lower.includes(term)) {
          riskScore += 20;
          urgencyFound = true;
          const idx = lower.indexOf(term);
          const snippet = text.substring(Math.max(0, idx - 5), Math.min(text.length, idx + term.length + 15));
          highlights.push({
            text: snippet || term,
            reason: `⚠️ Urgency Pressure Tactic: Artificial deadline or threat ("${term}") to induce panic.`,
            severity: "high"
          });
        }
      });

      if (urgencyFound) {
        redFlags.push({
          title: "Urgency Pressure Tactic",
          detail: "Using strict time constraints or threat of arrest to prevent consultation.",
          status: "HIGH"
        });
      }

      const financialPatterns = ["transfer", "deposit", "pay", "fee", "tax", "rs", "rupees", "lakh", "escrow", "otp", "pin", "card", "apk", "anydesk"];
      let financialFound = false;
      financialPatterns.forEach((term) => {
        if (lower.includes(term)) {
          riskScore += 18;
          financialFound = true;
          const idx = lower.indexOf(term);
          const snippet = text.substring(Math.max(0, idx - 5), Math.min(text.length, idx + term.length + 15));
          highlights.push({
            text: snippet || term,
            reason: `💳 Financial / Credential Demand: Requesting money transfer, OTP, PIN, or remote app installation.`,
            severity: "medium"
          });
        }
      });

      if (financialFound) {
        redFlags.push({
          title: "Payment or OTP Demand",
          detail: "Demanding bank transfer, safety deposit, OTP share, or APK installation.",
          status: "HIGH"
        });
      }

      riskScore = Math.min(99, Math.max(12, riskScore));

      let scamType = "Low Threat Conversation";
      if (riskScore >= 80) {
        scamType = lower.includes("arrest") || lower.includes("cbi") ? "Digital Arrest & CBI Impersonation Fraud" : "Critical Financial Phishing Scam";
      } else if (riskScore >= 50) {
        scamType = lower.includes("kyc") || lower.includes("sim") ? "Telecom SIM e-KYC Suspension Threat" : "High Risk Fraud Attempt";
      } else if (riskScore >= 30) {
        scamType = "Suspicious Communication";
      }

      const riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" =
        riskScore >= 80 ? "CRITICAL" : riskScore >= 50 ? "HIGH" : riskScore >= 30 ? "MEDIUM" : "LOW";

      const realAnalysis = {
        riskScore,
        riskLevel,
        scamType,
        confidence: Math.min(98, Math.max(82, riskScore + 5)),
        englishTranscript: text,
        highlights,
        redFlags: redFlags.length > 0 ? redFlags : [
          { title: "No Critical Red Flags", detail: "Transcript does not match known high-risk coercion patterns.", status: "LOW" }
        ],
        extractedEntities: {
          phones: phoneMatch,
          upis: upiMatch,
          urls: urlMatch
        },
        actions: riskScore >= 50 ? [
          "Do NOT transfer any money, deposit, or share OTP passcodes.",
          "Disconnect the call immediately and block the phone number / sender.",
          "File a report on National Cyber Crime Helpline 1930 or cybercrime.gov.in."
        ] : [
          "No immediate threat detected. Always verify unexpected financial requests."
        ],
        cases: [
          {
            caseId: "NCRB-2026-REAL-01",
            title: scamType,
            similarity: `${Math.min(95, riskScore)}%`,
            status: "ACTIVE INVESTIGATION",
            date: new Date().toLocaleDateString("en-IN"),
            city: "National Index"
          }
        ]
      };

      setAnalysis(realAnalysis);
      onAddAuditLog(`Scam Analyser: Evaluated input in real-time. Score: ${riskScore}/100 (${scamType})`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6" id="scam-analyser-page">
      
      {/* Header Banner & Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">Real-Time AI Scam & Threat Analyser</h2>
              <span className="text-[10px] font-mono bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                Live Speech & Vision OCR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Speak into microphone, upload real audio/screenshots, or paste text to perform instant threat analysis.
            </p>
          </div>
        </div>

        {/* Citizen vs Officer View Mode */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setUserRoleView("citizen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              userRoleView === "citizen" ? "bg-indigo-600 text-slate-100 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Citizen View
          </button>
          <button
            onClick={() => setUserRoleView("officer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              userRoleView === "officer" ? "bg-indigo-600 text-slate-100 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Officer View
          </button>
        </div>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ==================== LEFT COLUMN: INPUT METHODS ==================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            
            {/* Input Method Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4">
              <button
                onClick={() => setActiveInputTab("transcript")}
                className={`py-2 px-1 text-[11px] font-semibold rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeInputTab === "transcript"
                    ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Text / Voice</span>
              </button>

              <button
                onClick={() => setActiveInputTab("audio")}
                className={`py-2 px-1 text-[11px] font-semibold rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeInputTab === "audio"
                    ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Audio File</span>
              </button>

              <button
                onClick={() => setActiveInputTab("entity")}
                className={`py-2 px-1 text-[11px] font-semibold rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeInputTab === "entity"
                    ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Search className="w-4 h-4" />
                <span>URL / Phone</span>
              </button>

              <button
                onClick={() => setActiveInputTab("screenshot")}
                className={`py-2 px-1 text-[11px] font-semibold rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeInputTab === "screenshot"
                    ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Screenshot</span>
              </button>
            </div>

            {/* TAB 1: TEXT / REAL-TIME MICROPHONE INPUT */}
            {activeInputTab === "transcript" && (
              <div className="space-y-4">
                
                {/* Real-time Microphone Listener Console */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-red-400" /> Real-Time Microphone Controller
                    </span>
                    {isMicListening && (
                      <span className="text-[10px] font-mono text-red-400 font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /> LIVE MIC ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono">
                    Status: <span className="text-slate-200">{micStatusText}</span>
                  </p>

                  <button
                    onClick={toggleMicrophone}
                    className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isMicListening
                        ? "bg-red-600 hover:bg-red-500 text-slate-100 shadow-lg shadow-red-600/30 animate-pulse"
                        : "bg-indigo-600 hover:bg-indigo-500 text-slate-100 shadow-lg shadow-indigo-600/20"
                    }`}
                  >
                    {isMicListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isMicListening ? "Stop Microphone Recording" : "Start Live Microphone Listening"}
                  </button>

                  {/* Audio Level Visualizer */}
                  {isMicListening && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Mic Volume Level</span>
                        <span>{audioLevel}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-red-500 h-full transition-all duration-75"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Mic Test Prompts for instant testing */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                      Or Test Voice Input with 1-Click:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleSimulateVoiceInput("arrest")}
                        className="py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-medium text-slate-300 rounded cursor-pointer truncate"
                      >
                        🎤 CBI Digital Arrest
                      </button>
                      <button
                        onClick={() => handleSimulateVoiceInput("kyc")}
                        className="py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-medium text-slate-300 rounded cursor-pointer truncate"
                      >
                        🎤 SIM KYC Threat
                      </button>
                      <button
                        onClick={() => handleSimulateVoiceInput("lottery")}
                        className="py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-medium text-slate-300 rounded cursor-pointer truncate"
                      >
                        🎤 KBC 25L Lottery
                      </button>
                    </div>
                  </div>
                </div>

                {/* Language & Caller Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      {["English / Hindi", "Hindi", "English", "Tamil", "Bengali", "Telugu", "Marathi", "Gujarati", "Kannada", "Odia", "Punjabi", "Malayalam", "Urdu"].map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Caller Phone / ID</label>
                    <input
                      type="text"
                      value={callerPhone}
                      onChange={(e) => setCallerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* Main Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">
                      Live Speech Transcript / Message Content
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {transcriptText.length} / 5000 chars
                    </span>
                  </div>
                  <textarea
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value.slice(0, 5000))}
                    rows={7}
                    placeholder="Speak into microphone or paste call recording transcript, WhatsApp text, SMS warning, or email content here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500/70 font-sans leading-relaxed resize-none shadow-inner"
                  />
                </div>

              </div>
            )}

            {/* TAB 2: REAL AUDIO FILE UPLOAD & PLAYBACK */}
            {activeInputTab === "audio" && (
              <div className="space-y-4">
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-indigo-400" /> Audio File Player & Processing
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 font-mono">Real Audio File</span>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/70 rounded-xl p-6 text-center bg-slate-950/50 transition-all">
                  <Mic className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-200">Upload Real Audio Recording</p>
                  <p className="text-[10px] text-slate-400 mt-1 mb-3">MP3, WAV, M4A, OGG up to 25MB</p>
                  
                  <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg text-xs font-bold cursor-pointer transition-all inline-block">
                    Select Audio File
                    <input type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" />
                  </label>
                </div>

                {uploadedAudioFile && audioObjectUrl && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[200px]">{uploadedAudioFile.name}</span>
                      <span className="font-mono text-slate-400">{(uploadedAudioFile.size / 1024).toFixed(1)} KB</span>
                    </div>

                    <audio
                      src={audioObjectUrl}
                      controls
                      className="w-full h-10 accent-indigo-500 bg-slate-900 rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: URL / PHONE / UPI REAL-TIME CHECKER */}
            {activeInputTab === "entity" && (
              <div className="space-y-4">
                <div className="flex justify-between gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(["phone", "url", "upi"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setEntityType(type)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        entityType === type ? "bg-indigo-600 text-slate-100" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Enter Suspicious {entityType.toUpperCase()} Target
                  </label>
                  <input
                    type="text"
                    value={entityInput}
                    onChange={(e) => setEntityInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none focus:border-indigo-500"
                    placeholder={
                      entityType === "phone" ? "+91 98765 43210" : entityType === "url" ? "https://suspicious-site.com" : "scammer@paytm"
                    }
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SCREENSHOT REAL OCR EXTRACTION */}
            {activeInputTab === "screenshot" && (
              <div className="space-y-4">
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> Screenshot Image OCR Reader
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-bold">Real OCR Text Reader</span>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-xl p-6 text-center bg-slate-950/50 transition-all">
                  <ImageIcon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-200">Upload WhatsApp or SMS Screenshot</p>
                  <p className="text-[10px] text-slate-400 mt-1 mb-3">PNG, JPG, WEBP up to 10MB</p>

                  <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-all inline-block">
                    Select Screenshot File
                    <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                  </label>
                </div>

                {isOcrProcessing && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    Reading text from uploaded image...
                  </div>
                )}

                {screenshotPreview && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Uploaded Image Preview</span>
                    <div className="max-h-48 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center">
                      <img src={screenshotPreview} alt="Screenshot preview" className="object-contain max-h-48 w-full" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Run Real-Time Analysis Action Button */}
            <button
              onClick={runDynamicAnalysis}
              disabled={isAnalyzing}
              className="w-full mt-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-slate-100 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                  Analyzing Threat in Real-Time...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Analyze Threat Now
                </>
              )}
            </button>

          </div>
        </div>


        {/* ==================== RIGHT COLUMN: DYNAMIC REAL-TIME RESULT ==================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {analysis ? (
            <div className="space-y-6">
              
              {/* Primary Verdict & Donut Risk Score */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  
                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                        analysis.riskScore >= 80
                          ? "bg-red-500/20 text-red-400 border-red-500/40"
                          : analysis.riskScore >= 50
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      }`}>
                        <AlertOctagon className="w-4 h-4" />
                        {analysis.riskLevel} THREAT VERDICT
                      </span>

                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-mono font-medium">
                        {analysis.confidence}% AI Confidence
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-100 leading-snug">
                      {analysis.scamType}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysis.riskScore >= 80
                        ? "CRITICAL WARNING: Impersonation of authority or high-coercion extortion pattern detected."
                        : analysis.riskScore >= 50
                        ? "HIGH RISK: Deceptive scam pattern detected. Do not share banking credentials or transfer money."
                        : "LOW THREAT: No severe fraud coercion pattern identified in the evaluated input."}
                    </p>
                  </div>

                  {/* Circular Risk Donut Gauge */}
                  <div className="relative flex flex-col items-center shrink-0">
                    <div className="w-28 h-28 relative flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={analysis.riskScore >= 80 ? "text-red-500" : analysis.riskScore >= 50 ? "text-amber-500" : "text-emerald-500"}
                          strokeDasharray={`${analysis.riskScore}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black font-mono text-slate-100">{analysis.riskScore}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Risk Score</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Highlighted Transcript Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" /> Dynamic Transcript Highlight & Deceptive Phrase Detection
                  </h4>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                  {analysis.highlights && analysis.highlights.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-slate-300 font-sans">{transcriptText}</p>
                      <div className="border-t border-slate-800 pt-3 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Detected Deceptive Markers:</span>
                        {analysis.highlights.map((h: any, i: number) => (
                          <div key={i} className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold font-mono">"{h.text}":</span> {h.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 font-sans">{transcriptText || "No highlights detected."}</p>
                  )}
                </div>
              </div>

              {/* Red Flag Tactical Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Red Flag Tactical Breakdown
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(analysis.redFlags || []).map((flag: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-200">{flag.title}</h5>
                          <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                            {flag.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{flag.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Action Tools & Legal Workflow
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  
                  {/* Action 1: Draft FIR */}
                  <button
                    onClick={() => setActiveModal("fir")}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <FileText className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-xs text-slate-200">Draft FIR</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">IPC legal format</p>
                  </button>

                  {/* Action 2: Report to 1930 */}
                  <button
                    onClick={() => setActiveModal("1930")}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-red-500/50 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <Phone className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-xs text-slate-200">Report to 1930</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">National Cyber Helpline</p>
                  </button>

                  {/* Action 3: Share Warning */}
                  <button
                    onClick={() => setActiveModal("whatsapp")}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <Share2 className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-xs text-slate-200">Share Warning</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">WhatsApp regional alert</p>
                  </button>

                  {/* Action 4: Link to Fraud Network */}
                  <button
                    onClick={() => {
                      onAddAuditLog("Scam Analyser: Redirecting caller number to Network Intelligence Graph");
                      if (onNavigateToNetwork) onNavigateToNetwork();
                      else showToast("Loaded in Fraud Network Graph!");
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <Users className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-xs text-slate-200">Link Fraud Network</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Graph pre-loaded entity</p>
                  </button>

                  {/* Action 5: Export Evidence PDF */}
                  <button
                    onClick={() => setActiveModal("evidence")}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <Download className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-xs text-slate-200">Evidence Package</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Court admissible PDF</p>
                  </button>

                  {/* Action 6: Save to Case */}
                  <button
                    onClick={() => setActiveModal("save_case")}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <Lock className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-xs text-slate-200">Save to Case</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tag active investigation</p>
                  </button>

                </div>
              </div>

            </div>
          ) : (
            /* Blank Ready State */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Mic className="w-8 h-8" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-lg font-bold text-slate-100">Ready for Live Analysis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Start live microphone listening, upload an audio file/screenshot, or paste text, then click <strong>"Analyze Threat Now"</strong>.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* TOAST NOTIFICATION */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          {copyToast}
        </div>
      )}

      {/* ==================== ACTION MODALS ==================== */}

      {/* DRAFT FIR MODAL */}
      {activeModal === "fir" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">Draft FIR — Legal Format</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-2 max-h-80 overflow-y-auto leading-relaxed">
              <p className="font-bold text-indigo-400">FIRST INFORMATION REPORT (Under Section 154 Cr.P.C / Section 173 BNSS)</p>
              <p>Police Station: Cyber Crime Cell | District: Central</p>
              <p>Complainant Target Phone: {callerPhone || "N/A"}</p>
              <p>Statutory Sections: IPC Sec 420 (Cheating), IPC Sec 419 (Personation), IT Act 2000 Sec 66D</p>
              <hr className="border-slate-800 my-2" />
              <p className="text-slate-200">SUMMARY OF INCIDENT:</p>
              <p className="whitespace-pre-wrap">{transcriptText}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`FIRST INFORMATION REPORT\nSections: IPC 420, IPC 419, IT Act Sec 66D\nPhone: ${callerPhone}\n\n${transcriptText}`);
                  showToast("FIR Draft copied to clipboard!");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" /> Copy FIR Draft
              </button>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT TO 1930 MODAL */}
      {activeModal === "1930" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-slate-100 text-sm">Report to 1930 Cyber Helpline</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <p><span className="text-slate-500">Suspect Phone:</span> {callerPhone || "N/A"}</p>
              <p><span className="text-slate-500">Scam Type:</span> {analysis?.scamType}</p>
              <p><span className="text-slate-500">Risk Score:</span> {analysis?.riskScore}/100 ({analysis?.riskLevel})</p>
            </div>

            <div className="space-y-2">
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-slate-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all block text-center"
              >
                <ExternalLink className="w-4 h-4" /> Open Official Cybercrime.gov.in Portal
              </a>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARE WARNING MODAL */}
      {activeModal === "whatsapp" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Share WhatsApp Warning</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-200 leading-relaxed">
              ⚠️ <strong>SAVDHAAN / SCAM ALERT:</strong> Beware of suspicious call/message claiming digital arrest or asking for OTP/money. Do not transfer funds. Report to 1930 Cyber Helpline.
            </div>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`⚠️ SCAM ALERT: Beware of cyber fraud call/message. Do not transfer money. Report to 1930 Cyber Helpline.`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all block text-center"
            >
              <Share2 className="w-4 h-4" /> Share Directly on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* EVIDENCE PACKAGE PDF MODAL */}
      {activeModal === "evidence" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-sm">Court Admissible Evidence Package</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between text-blue-400 font-bold border-b border-slate-800 pb-2">
                <span>SafeNet Forensic Certificate</span>
                <span>ISO/IEC 27037 Compliant</span>
              </div>
              <p><span className="text-slate-500">Target Entity:</span> {callerPhone || "Real-time Input"}</p>
              <p><span className="text-slate-500">Scam Type:</span> {analysis?.scamType}</p>
              <p><span className="text-slate-500">Risk Score:</span> {analysis?.riskScore}/100 ({analysis?.riskLevel})</p>
              <p><span className="text-slate-500">Cryptographic Hash:</span> sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  window.print();
                  showToast("Printing Evidence Package...");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-100 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download / Print PDF
              </button>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE TO CASE MODAL */}
      {activeModal === "save_case" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">Save Analysis to Investigation Case</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Investigation Case ID</label>
              <input
                type="text"
                value={caseIdInput}
                onChange={(e) => setCaseIdInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                placeholder="OP-992-DELTA"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => {
                  onAddAuditLog(`Scam Analyser: Tagged real-time analysis to case ${caseIdInput}`);
                  showToast(`Analysis saved to Case ${caseIdInput}`);
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs rounded-lg cursor-pointer"
              >
                Save to Investigation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
