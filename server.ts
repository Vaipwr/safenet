import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { getSyntheticGraph, simulateDisruption } from "./server/jaal/graphEngine";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));

// Serve NETRA's real sample banknote images so the frontend can DISPLAY the
// exact same image the CV backend ANALYSES (no more stock-photo mismatch).
app.use(
  "/samples",
  express.static(path.join(process.cwd(), "prahari", "modules", "netra", "samples"))
);

const PORT = 3000;

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini Client successfully initialized server-side.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.log("GEMINI_API_KEY is not configured or placeholder. Running with simulated fallback analytics.");
}

// ==========================================
// NETRA — Currency CV backend (Python / FastAPI) integration
// ==========================================
// The real counterfeit-currency analysis lives in the Python module at
// prahari/modules/netra. This Express endpoint forwards the note image to it
// and maps the returned PrahariEvent into the CurrencyAnalysis shape the React
// frontend already expects. Start the backend with:
//     cd prahari && .venv/Scripts/uvicorn app.main:app --port 8000
const NETRA_API_URL = process.env.NETRA_API_URL || "http://127.0.0.1:8000";

// Frontend sample-note IDs -> NETRA's on-disk sample images. Passing the real
// filename lets NETRA's demo hint seed the canonical serial numbers.
const NETRA_SAMPLE_FILES: Record<string, string> = {
  genuine_500: "genuine_500.jpg",
  counterfeit_500: "fake_500_photocopy.jpg",
  fake_rbi_500: "fake_500_photocopy.jpg",
};

// Approximate on-note regions for each security feature, so the frontend can
// draw a heatmap box per finding (x/y/width/height are % of the note image).
const NETRA_ROI: Record<string, { x: number; y: number; width: number; height: number }> = {
  NOTE_PRESENCE:     { x: 1,  y: 1,  width: 98, height: 98 },
  ASPECT_RATIO:    { x: 25, y: 2,  width: 50, height: 6  },
  PRINT_SHARPNESS:   { x: 60, y: 24, width: 30, height: 52 },
  MICRO_LETTERING:   { x: 6,  y: 72, width: 24, height: 20 },
  SECURITY_THREAD:   { x: 42, y: 8,  width: 5,  height: 84 },
  COLOUR_PROFILE:    { x: 3,  y: 6,  width: 18, height: 24 },
  SERIAL_FORMAT:     { x: 66, y: 76, width: 28, height: 16 },
  SERIAL_RECURRENCE: { x: 66, y: 58, width: 28, height: 14 },
};

function netraFeatureStatus(passed: boolean | null): "PASS" | "FAIL" | "SUSPICIOUS" {
  if (passed === true) return "PASS";
  if (passed === false) return "FAIL";
  return "SUSPICIOUS";
}

function netraMarkStatus(passed: boolean | null): "valid" | "suspicious" | "missing" {
  if (passed === true) return "valid";
  if (passed === false) return "suspicious";
  return "missing";
}

// Map a PrahariEvent (from NETRA) into the CurrencyAnalysis shape.
function mapPrahariToCurrency(event: any): any {
  const findings: any[] = Array.isArray(event.findings) ? event.findings : [];
  const verdict: string = event.verdict || "inconclusive";
  const isValid = verdict === "genuine";
  // The gate rejected the image outright — it isn't a banknote, so there is no
  // serial and no security-feature verdict to report.
  const isBanknote = event?.raw?.is_banknote !== false;
  const serialNo = isBanknote ? event?.raw?.serial || "UNREADABLE" : "N/A";
  const risk = typeof event.risk_score === "number" ? event.risk_score : 0;

  const heatmapMarkings = findings
    .filter((f) => NETRA_ROI[f.code])
    .map((f) => ({
      ...NETRA_ROI[f.code],
      label: f.label,
      status: netraMarkStatus(f.passed),
      description: f.detail || "",
    }));

  const features = findings.map((f) => ({
    name: f.label,
    status: netraFeatureStatus(f.passed),
    detail: f.detail || "",
  }));

  const auditLog: string[] = [
    `NETRA currency-CV engine ${event.model_version || ""} — source: ${event.source_module}`,
    "Perspective rectification and denomination classification complete.",
    ...findings.map(
      (f) => `${f.label}: ${netraFeatureStatus(f.passed)} — ${f.detail}`
    ),
    // Naming the reader matters: a serial read by the cloud model and one read
    // offline carry different reliability, and an analyst must be able to tell.
    `Serial OCR result: ${serialNo}` +
      (event?.raw?.serial_source && event.raw.serial_source !== "none"
        ? ` (read by: ${event.raw.serial_source})`
        : " (could not be read)"),
    `Composite risk ${risk.toFixed(2)} (${event.risk_band}). Verdict: ${verdict.toUpperCase()}.`,
    event.explanation || "",
  ].filter(Boolean);

  return {
    serialNo,
    isValid,
    isBanknote,
    verdict,
    confidence: Math.max(1, Math.round((event.confidence || 0) * 100)),
    mismatchReason: isValid ? "" : event.explanation || "Security features did not validate.",
    heatmapMarkings,
    features,
    auditLog,
  };
}

// Send a note image to NETRA and return the mapped CurrencyAnalysis, or null on failure.
async function analyseWithNetra(
  noteImageBase64?: string,
  selectedNoteId?: string
): Promise<any | null> {
  let buf: Buffer | null = null;
  let filename = "upload.jpg";

  if (noteImageBase64) {
    const clean = noteImageBase64.replace(/^data:image\/\w+;base64,/, "");
    buf = Buffer.from(clean, "base64");
  } else if (selectedNoteId && NETRA_SAMPLE_FILES[selectedNoteId]) {
    filename = NETRA_SAMPLE_FILES[selectedNoteId];
    const p = path.join(process.cwd(), "prahari", "modules", "netra", "samples", filename);
    buf = fs.readFileSync(p);
  }
  if (!buf) return null;

  const form = new FormData();
  form.append("image", new Blob([buf as any]), filename);
  form.append("district", "Demo District");

  const resp = await fetch(`${NETRA_API_URL}/api/netra/scan`, {
    method: "POST",
    body: form as any,
  });
  if (!resp.ok) {
    console.error(`NETRA backend returned HTTP ${resp.status}`);
    return null;
  }
  const event = await resp.json();
  return mapPrahariToCurrency(event);
}

// ==========================================
// 1. API Endpoint: Scam Call Analyser
// ==========================================
app.post("/api/scam-analyser", async (req, res) => {
  const { transcript, language } = req.body;

  if (!transcript || transcript.trim() === "") {
    return res.status(400).json({ error: "Transcript is required" });
  }

  // 1. If Gemini AI is active, run real AI analysis
  if (ai) {
    try {
      const prompt = `You are an expert Cyber Security and Anti-Fraud Investigator at CERT-In (Indian Computer Emergency Response Team).
Analyze the following transcript of a suspicious phone conversation (Language: ${language || "English"}).
Detect if it is a scam call (phishing, social engineering, impersonation, etc.), assess risk level, highlight specific deceptive sentences/tactics, and provide actionable advice.

Transcript:
"${transcript}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.INTEGER, description: "Threat / Scam risk score from 0 to 100" },
              riskLevel: { type: Type.STRING, description: "CRITICAL, HIGH, MEDIUM, or LOW" },
              scamType: { type: Type.STRING, description: "Specific Indian scam class (e.g., Telecom KYC Suspension, KBC Lottery Fraud, Customs Narcotics Drug Package, Part-time Job WhatsApp Trap, Digital Arrest Impersonation)" },
              confidence: { type: Type.INTEGER, description: "Confidence score of detection (0-100)" },
              englishTranscript: { type: Type.STRING, description: "A high-fidelity English translation or synthesis of the conversation" },
              highlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: "Exact sentence or word pattern in the transcript that is highly suspicious" },
                    reason: { type: Type.STRING, description: "Technical social engineering tactic being used (e.g., artificial urgency, official credential impersonation, baiting, intimidating bank account freeze warning)" },
                    severity: { type: Type.STRING, description: "high, medium, or low" }
                  },
                  required: ["text", "reason", "severity"]
                }
              },
              actions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Immediate action points (e.g., Report on National Cyber Crime Portal Cybercrime.gov.in, Dial Helpline 1930, Freeze bank account immediately)"
              },
              cases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    caseId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    similarity: { type: Type.STRING, description: "Similarity match percentage e.g. 92%" },
                    status: { type: Type.STRING }
                  },
                  required: ["caseId", "title", "similarity", "status"]
                }
              }
            },
            required: ["riskScore", "riskLevel", "scamType", "confidence", "highlights", "actions", "cases"]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        return res.json(parsed);
      }
    } catch (error: any) {
      console.error("Gemini Scam Analyser API failed, falling back to mock analyser:", error.message);
    }
  }

  // 2. High-fidelity Fallback Simulation (triggers based on common Indian scam keywords)
  const textLower = transcript.toLowerCase();
  let result = {
    riskScore: 12,
    riskLevel: "LOW" as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    scamType: "Standard Normal Call",
    confidence: 85,
    englishTranscript: transcript,
    highlights: [] as any[],
    actions: ["No immediate danger detected. Always remain vigilant and never share OTPs."],
    cases: [
      { caseId: "CASE-9281", title: "Telecom Spam Call Pattern", similarity: "15%", status: "RESOLVED" }
    ]
  };

  if (textLower.includes("lottery") || textLower.includes("crore") || textLower.includes("kbc")) {
    result = {
      riskScore: 92,
      riskLevel: "CRITICAL",
      scamType: "Kaun Banega Crorepati (KBC) Lottery Fraud",
      confidence: 96,
      englishTranscript: "Congratulations, you won a KBC lottery worth 25 lakh rupees. Pay 25,000 rupees as registration tax first.",
      highlights: [
        { text: "lottery worth 25 lakh", reason: "Unsolicited high-value lottery baiting to trigger greed.", severity: "high" },
        { text: "Pay 25,000 rupees as registration tax", reason: "Advance-fee fraud request under the guise of fake taxes.", severity: "high" }
      ],
      actions: [
        "DO NOT pay any advance registration fee under any circumstances.",
        "Report the scam phone number on the CERT-In Portal and WhatsApp spam.",
        "Block the caller on all communication channels immediately."
      ],
      cases: [
        { caseId: "CASE-1102", title: "Jamtara WhatsApp KBC Lottery Ring", similarity: "94%", status: "FROZEN" },
        { caseId: "CASE-4409", title: "Mumbai Advance-fee Prize Fraud", similarity: "88%", status: "UNDER INVESTIGATION" }
      ]
    };
  } else if (textLower.includes("customs") || textLower.includes("narcotics") || textLower.includes("fedex") || textLower.includes("arrest") || textLower.includes("drugs")) {
    result = {
      riskScore: 98,
      riskLevel: "CRITICAL",
      scamType: "Digital Arrest & Illegal Drug Parcel Scam",
      confidence: 99,
      englishTranscript: "A FedEx package containing drugs has been intercepted in your name. You are under digital arrest. Stay on the video call.",
      highlights: [
        { text: "under digital arrest", reason: "Fake legal intimidation. Indian law enforcement never uses 'digital arrest' or video calls for detention.", severity: "high" },
        { text: "package containing drugs", reason: "Using panic and fear of prosecution to extract immediate compliance.", severity: "high" },
        { text: "Stay on the video call", reason: "Isolation technique to prevent victim from consulting friends or family.", severity: "high" }
      ],
      actions: [
        "Disconnect the call immediately. This is a 100% fake arrest scheme.",
        "File an emergency complaint by calling the Cyber Helpdesk at 1930.",
        "Inform local police station about the impersonation threat."
      ],
      cases: [
        { caseId: "CASE-8832", title: "Fake CBI/Customs Mumbai Syndicate", similarity: "96%", status: "UNDER INVESTIGATION" },
        { caseId: "CASE-3091", title: "NCR FedEx Drug Parcel Scam Ring", similarity: "91%", status: "FROZEN" }
      ]
    };
  } else if (textLower.includes("otp") || textLower.includes("sim") || textLower.includes("kyc") || textLower.includes("aadhar") || textLower.includes("block")) {
    result = {
      riskScore: 89,
      riskLevel: "HIGH",
      scamType: "Telecom Sim Swap & Aadhaar KYC Block Fraud",
      confidence: 94,
      englishTranscript: "Your Airtel/Jio SIM card will be blocked in 2 hours unless you complete Aadhaar verification now. Share the OTP sent to your phone.",
      highlights: [
        { text: "will be blocked in 2 hours", reason: "Fabricated urgency. Telecom operators never suspend connections with 2-hour phone ultimatums.", severity: "high" },
        { text: "Share the OTP", reason: "Credential theft to complete illegal sim-swap or bypass bank multi-factor auth.", severity: "high" }
      ],
      actions: [
        "NEVER disclose OTP, PIN, or login credentials to anyone.",
        "Contact your official telecom service provider directly via their verified support number.",
        "Report the number on Chakshu (Sanchar Saathi Portal)."
      ],
      cases: [
        { caseId: "CASE-2291", title: "Mewat Aadhaar KYC Extortion", similarity: "92%", status: "RESOLVED" },
        { caseId: "CASE-0932", title: "Sim Swap Banking Takeover Scheme", similarity: "89%", status: "FROZEN" }
      ]
    };
  } else {
    // General suspicious fallback
    result = {
      riskScore: 78,
      riskLevel: "HIGH",
      scamType: "Social Engineering Fraud Threat",
      confidence: 82,
      englishTranscript: transcript,
      highlights: [
        { text: transcript.substring(0, Math.min(transcript.length, 60)), reason: "Suspicious conversational trigger involving finance or urgent actions.", severity: "medium" }
      ],
      actions: [
        "Do not click any link or send funds.",
        "Verify credentials through an independent, known communication channel.",
        "Report to 1930 and freeze relevant digital cards if any details were leaked."
      ],
      cases: [
        { caseId: "CASE-4911", title: "Generic Financial Phishing Pattern", similarity: "76%", status: "PENDING" }
      ]
    };
  }

  res.json(result);
});

// ==========================================
// 2. API Endpoint: Currency Detector
// ==========================================
app.post("/api/currency-detector", async (req, res) => {
  const { noteImageBase64, selectedNoteId } = req.body;

  // 0. PRIMARY: real NETRA computer-vision backend (Python / FastAPI).
  //    Falls through to the Gemini / simulated paths below if it is unreachable.
  try {
    const netraResult = await analyseWithNetra(noteImageBase64, selectedNoteId);
    if (netraResult) {
      return res.json(netraResult);
    }
  } catch (err: any) {
    console.error("NETRA backend unreachable, falling back:", err?.message || err);
  }

  // 1. If Gemini is available, we perform multimodal analysis
  if (ai && noteImageBase64) {
    try {
      const cleanBase64 = noteImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imagePart = {
        inlineData: {
          mimeType: "image/png",
          data: cleanBase64,
        },
      };

      const prompt = {
        text: `You are an expert currency forensic inspector at the Reserve Bank of India (RBI) Banknote Security Division.
Examine this Indian Rupee (INR) banknote image. Identify if it appears genuine or counterfeit.
Perform security feature audits including:
1. Mahatma Gandhi Portrait Watermark and Latent Image.
2. Security Thread color shift from Green to Blue with demetalised RBI and Bharat inscription.
3. Micro-lettering, numbering panels, alignment, and optical variable ink.
4. Intaglio print feeling and Ashoka Pillar emblem.

Provide a detailed forensic verification breakdown in the exact structured JSON response schema specified below. Return precision coordinates (as percentage points from top-left, 0-100) for bounding boxes of security landmarks.`
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, prompt] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              serialNo: { type: Type.STRING, description: "Serial number detected on the note (e.g. 3CF 992839)" },
              isValid: { type: Type.BOOLEAN, description: "True if banknotes are RBI genuine, False if counterfeit indicators exist" },
              confidence: { type: Type.INTEGER, description: "Forensic confidence score (0-100)" },
              mismatchReason: { type: Type.STRING, description: "Key mismatch indicator if counterfeit (e.g. 'Security thread lacks color shift', 'Ashoka Pillar alignment error')" },
              heatmapMarkings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.INTEGER, description: "X percentage from left of image (0-100)" },
                    y: { type: Type.INTEGER, description: "Y percentage from top of image (0-100)" },
                    width: { type: Type.INTEGER, description: "width percentage (0-100)" },
                    height: { type: Type.INTEGER, description: "height percentage (0-100)" },
                    label: { type: Type.STRING, description: "Security landmark name" },
                    status: { type: Type.STRING, description: "valid, suspicious, or missing" },
                    description: { type: Type.STRING, description: "Forensic note on what is seen in this region" }
                  },
                  required: ["x", "y", "width", "height", "label", "status", "description"]
                }
              },
              features: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Landmark name e.g. Watermark, Latent Image" },
                    status: { type: Type.STRING, description: "PASS, FAIL, or SUSPICIOUS" },
                    detail: { type: Type.STRING, description: "Technical audit explanation" }
                  },
                  required: ["name", "status", "detail"]
                }
              },
              auditLog: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Sequential machine forensic steps log"
              }
            },
            required: ["serialNo", "isValid", "confidence", "heatmapMarkings", "features", "auditLog"]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        return res.json(parsed);
      }
    } catch (error: any) {
      console.error("Gemini Currency Forensics failed, falling back to simulated analysis:", error.message);
    }
  }

  // 2. No fake fallback. If we get here, the real NETRA engine could not be
  //    reached (and no Gemini key is configured). Returning a hardcoded
  //    "98% genuine" here is exactly what made a fake note look authentic, so
  //    we now fail honestly and let the UI show a clear error instead.
  console.error(
    "currency-detector: NETRA backend did not return a result. " +
    `Check that it is running at ${NETRA_API_URL}. Refusing to send mock data.`
  );
  return res.status(503).json({
    error: "analysis_engine_unavailable",
    message:
      "The NETRA analysis engine is not reachable, so no verdict can be produced. " +
      `Start the Python backend (uvicorn on port 8000) and try again.`,
  });
});

// ==========================================
// 3. API Endpoint: AI Security Assistant Chat
// ==========================================
app.post("/api/ai-assistant", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // 1. If Gemini AI is active, run real Chat conversation
  if (ai) {
    try {
      // Structure the messages for Gemini
      const formattedHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.text }],
      }));

      const latestMessage = messages[messages.length - 1]?.text || "";

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `You are the CERT-In AI Cyber Security Assistant (SafeNet Specialist).
Your purpose is to assist Indian citizens, police officers, bank representatives, and administrators with security guidelines, fraud investigation tactics, scam report protocols, and tech safety procedures (such as verifying UPI IDs, malicious APK analysis, fishing websites, and reporting under 1930 Cyber helpline).
Keep your advice highly professional, clear, objective, and action-oriented. Maintain a helpful, calm, and sovereign tone. Mention official resources like cybercrime.gov.in and RBI guidelines when relevant.`,
        },
        history: formattedHistory,
      });

      const response = await chat.sendMessage({ message: latestMessage });
      const text = response.text;
      if (text) {
        return res.json({ text });
      }
    } catch (error: any) {
      console.error("Gemini Assistant Chat failed, falling back to simulated chat response:", error.message);
    }
  }

  // 2. High-fidelity Fallback Conversation Agent
  const lastUserText = messages[messages.length - 1]?.text || "";
  const lastUserTextLower = lastUserText.toLowerCase();

  let textReply = "As your CERT-In Cyber Security Advisor, I have evaluated your inquiry. Please ensure you never share active OTPs, and report suspicious entities to cybercrime.gov.in. Is there a specific UPI ID, phone number, or suspicious app link you would like me to audit?";

  if (lastUserTextLower.includes("upi") || lastUserTextLower.includes("gpay") || lastUserTextLower.includes("paytm")) {
    textReply = `I have received your inquiry regarding UPI safety.
Under RBI and NPCI directives, please ensure:
1. **Never enter your UPI PIN to RECEIVE money.** Any request asking for your PIN to credit money is 100% a scam.
2. If you accidentally transferred money to a fraudulent UPI handle, dial **1930 Cyber Helpline** within the golden hour to request an immediate bank freeze.
3. Report the fraudulent UPI ID on our **Citizen Portal** and file an official complaint on cybercrime.gov.in so banks can freeze the linked merchant account.`;
  } else if (lastUserTextLower.includes("link") || lastUserTextLower.includes("website") || lastUserTextLower.includes("url") || lastUserTextLower.includes("http")) {
    textReply = `I am auditing the link you queried. 
To identify malicious URLs or phishing pages:
1. **Check the domain spelling**: Phishing websites often mimic popular banks or services with tiny typos (e.g., 'onlinesbll.com' instead of 'onlinesbi.sbi').
2. **Verify HTTPs and Certificate**: While HTTPS is common, verify that the domain name is officially registered. Check registry logs using Whois.
3. Avoid logging into banking credentials on links received via SMS, WhatsApp, or email. CERT-In urges citizens to always type the official URL directly.`;
  } else if (lastUserTextLower.includes("apk") || lastUserTextLower.includes("app") || lastUserTextLower.includes("download") || lastUserTextLower.includes("malware")) {
    textReply = `Regarding suspicious apps or APK files:
1. **Never install APK files sent via WhatsApp** (such as fake 'Speed Post tracking' or 'Electricity bill payment' APKs). These contain banking trojans.
2. These rogue apps read your incoming SMS to steal OTPs and drain your accounts in the background.
3. If you have installed one, immediately **turn on Airplane Mode**, backup vital photos, and **factory reset your phone** to eradicate the resident malware.`;
  }

  res.json({ text: textReply });
});

// ==========================================
// 4. API Endpoint: Citizen Fraud Search Verification
// ==========================================
app.post("/api/citizen-check", async (req, res) => {
  const { query, type } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const cleanQuery = query.trim();

  // 1. Predefined blacklisted matches in India
  const blacklistedNumbers = ["+919876543210", "9876543210", "09876543210", "+919999988888", "9999988888"];
  const blacklistedUPIs = ["rewards-paytm@ybl", "refund-sbi@upi", "cert-verification@ybl", "prizes-kbc@paytm"];
  const blacklistedURLs = ["onlinesbll-net.in", "free-kbc-lottery.org", "electricity-bill-pay.com", "customer-care-verification.xyz"];

  let isMatch = false;
  let detailMessage = "Safe Profile. No fraudulent matches found in the National Cyber Crime Database (1930 records). Always practice safe digital transactions.";
  let riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let scamCategory = "None";

  if (type === "phone" && (blacklistedNumbers.includes(cleanQuery) || cleanQuery.startsWith("98765"))) {
    isMatch = true;
    riskLevel = "CRITICAL";
    scamCategory = "Electricity / SIM Block Extortion";
    detailMessage = "WARNING: This phone number is flagged in 24 active investigations across 4 Indian states. Associated with telecom KYC phishing impersonation schemes.";
  } else if (type === "upi" && (blacklistedUPIs.includes(cleanQuery) || cleanQuery.includes("lottery") || cleanQuery.includes("refund"))) {
    isMatch = true;
    riskLevel = "HIGH";
    scamCategory = "Advance-Fee Lottery Refund Fraud";
    detailMessage = "ALERT: This UPI ID is linked to a series of fraudulent lottery claims and advance-fee collection scams reported in Jharkhand (Jamtara region).";
  } else if (type === "link" && (blacklistedURLs.includes(cleanQuery) || cleanQuery.includes(".xyz") || cleanQuery.includes("free-") || cleanQuery.includes("gift"))) {
    isMatch = true;
    riskLevel = "CRITICAL";
    scamCategory = "Phishing Credential Harvester";
    detailMessage = "CRITICAL CRIME THREAT: This URL is identified as a fake banking landing page designed to harvest SBI / ICICI Internet Banking logins. Domain registered in Russia 3 days ago.";
  }

  // If no predefined match, but key is present, let's let Gemini do a general look (e.g. is link weird)
  if (!isMatch && ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are a Cyber Security Domain Analyst at CERT-In.
Evaluate the safety of this query: "${cleanQuery}" (Type: ${type}).
Identify if this looks like a phishing URL, scam UPI handle, or typical caller ID format for fraud.
Provide response in strict JSON:
{
  "isMatch": boolean,
  "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "scamCategory": string,
  "detailMessage": string
}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isMatch: { type: Type.BOOLEAN },
              riskLevel: { type: Type.STRING },
              scamCategory: { type: Type.STRING },
              detailMessage: { type: Type.STRING }
            },
            required: ["isMatch", "riskLevel", "scamCategory", "detailMessage"]
          }
        }
      });
      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        return res.json(parsed);
      }
    } catch (e) {
      // ignore, use standard safe fallback
    }
  }

  res.json({
    isMatch,
    riskLevel,
    scamCategory,
    detailMessage
  });
});

// ==========================================
// 5. API Endpoint: JAAL Fraud Network Intelligence
// ==========================================
app.get("/api/jaal/graph", (_req, res) => {
  const result = getSyntheticGraph();
  res.json(result);
});

app.post("/api/jaal/disrupt", (req, res) => {
  const { frozenNodeIds } = req.body || {};
  const result = simulateDisruption(Array.isArray(frozenNodeIds) ? frozenNodeIds : []);
  res.json(result);
});

// ==========================================
// 6. Serve Vite Middleware or Static Files
// ==========================================
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SafeNet AI server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
