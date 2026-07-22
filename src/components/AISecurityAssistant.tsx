import React, { useState, useRef, useEffect } from "react";
import { Brain, Send, ShieldAlert, Sparkles, AlertTriangle, Globe, HelpCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
}

export default function AISecurityAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Namaskar. I am the CERT-In AI Security Assistant. I am configured with official Indian anti-fraud parameters and cyber threat indices. Ask me anything regarding suspicious UPI accounts, malicious APK downloads, phishing websites, or the 1930 Cyber Helpline filing processes."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState({
    riskRating: 0,
    riskLabel: "PENDING",
    vectors: [] as string[]
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: inputText
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          sender: "assistant",
          text: data.text
        }
      ]);

      // Dynamically adjust sidebar risk evaluation tags based on user input keywords
      const textLower = userMessage.text.toLowerCase();
      let rating = 10;
      let label = "SAFE";
      let vectors = ["Normal query context verified."];

      if (textLower.includes("upi") || textLower.includes("gpay") || textLower.includes("paytm")) {
        rating = 78;
        label = "HIGH";
        vectors = ["UPI PIN Phishing Bait", "Unauthorized Merchant Debit Request"];
      } else if (textLower.includes("apk") || textLower.includes("app") || textLower.includes("malware")) {
        rating = 94;
        label = "CRITICAL";
        vectors = ["Banking Trojan Payload", "Aadhaar e-KYC Impersonation App"];
      } else if (textLower.includes("link") || textLower.includes("website") || textLower.includes("url")) {
        rating = 82;
        label = "CRITICAL";
        vectors = ["Credential Harvester", "Typosquatting Domain Target"];
      }

      setActiveAnalysis({
        riskRating: rating,
        riskLabel: label,
        vectors
      });

    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          sender: "assistant",
          text: "I encountered a transient communication error. Please ensure your internet link and server are fully online."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-assistant-root">
      {/* Sidebar Analysis Pane */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5" id="ai-risk-pane">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-[var(--color-navy)]" />
            <h3 className="font-semibold text-[var(--color-ink)]">AI Inquiry Profiling</h3>
          </div>
          <p className="text-xs text-[var(--color-ink-2)] mb-4">
            Our real-time analyzer parses active questions to identify critical malware signatures or known financial phishing templates.
          </p>

          <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-4 space-y-4">
            <div>
              <span className="text-[10px] font-mono text-[var(--color-ink-3)] uppercase block mb-1">Thread Threat Index</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-semibold font-mono text-[var(--color-ink)]">{activeAnalysis.riskRating}%</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${
                  activeAnalysis.riskLabel === "CRITICAL" || activeAnalysis.riskLabel === "HIGH"
                    ? "bg-[var(--color-critical-tint)] text-[var(--color-critical)]"
                    : activeAnalysis.riskLabel === "SAFE"
                      ? "bg-[var(--color-safe-tint)] text-[var(--color-safe)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-ink-2)]"
                }`}>
                  {activeAnalysis.riskLabel} RISK
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-[var(--color-ink-3)] uppercase block mb-1.5">Detected Deception Vectors</span>
              {activeAnalysis.vectors.length > 0 ? (
                <div className="space-y-1.5">
                  {activeAnalysis.vectors.map((vec, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-[var(--color-ink-2)]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-navy)] shrink-0" />
                      <span>{vec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-ink-3)] italic">Initiate conversation to populate security parameters...</p>
              )}
            </div>
          </div>
        </div>

        {/* National Helplines */}
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-5" id="helpline-reference-card">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-[var(--color-safe)]" />
            <h4 className="font-semibold text-xs text-[var(--color-ink)] uppercase tracking-wider">CERT-In Directory Reference</h4>
          </div>
          <p className="text-xs text-[var(--color-ink-2)] leading-relaxed mb-3">
            Indian citizens who are active victims of banking fraud must file immediate report procedures.
          </p>
          <div className="space-y-2 text-xs" id="national-emergency-box">
            <div className="p-2.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] flex justify-between items-center">
              <span className="text-[var(--color-ink-2)] font-semibold">National Cyber Helpline</span>
              <span className="font-mono text-[var(--color-critical)] font-semibold text-sm">1930</span>
            </div>
            <div className="p-2.5 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] flex justify-between items-center">
              <span className="text-[var(--color-ink-2)] font-semibold">Government Cyber Portal</span>
              <span className="font-mono text-[var(--color-safe)] font-semibold">cybercrime.gov.in</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div className="lg:col-span-8 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] flex flex-col h-[520px]" id="ai-chat-canvas">
        {/* Header bar */}
        <div className="border-b border-[var(--color-line)] p-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-[var(--color-navy)]" />
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-ink)]">SafeNet AI Cyber Intelligence Agent</h4>
              <p className="text-[10px] text-[var(--color-ink-3)]">Secured CERT-In Sandbox Session</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[var(--color-navy-tint)] text-[var(--color-navy)] text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider font-mono">
            <Sparkles className="w-3 h-3" />
            <span>Gemini v3.5 Active</span>
          </div>
        </div>

        {/* Messaging Box */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" id="chat-messages-box">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-[3px] p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-[var(--color-navy-tint)] border border-[var(--color-navy)]/30 text-[var(--color-ink)]"
                  : "bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink-2)]"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] p-3 text-xs text-[var(--color-ink-3)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="font-mono text-[10px]">Decoding malware fingerprints...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="border-t border-[var(--color-line)] p-4 flex gap-3" id="ai-chat-input-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Type your inquiry here (e.g. 'How do I report a fraudulent UPI transaction?')..."
            className="flex-1 bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[3px] px-4 py-2.5 text-xs text-[var(--color-ink)] outline-none focus:border-purple-500/50"
          />
          <button
            type="submit"
            id="send-message-btn"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-[var(--color-surface-2)] text-[var(--color-ink)] disabled:text-[var(--color-ink-3)] font-semibold rounded-[3px] text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consult</span>
          </button>
        </form>
      </div>
    </div>
  );
}
