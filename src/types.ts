export type UserRole = "citizen" | "officer" | "bank_rep" | "admin";

export type ScreenType =
  | "landing"
  | "signup"
  | "login"
  | "request_access"
  | "your_details"
  | "final_verification"
  | "success"
  | "dashboard"
  | "currency_detector"
  | "scam_analyser"
  | "network_intel"
  | "citizen_portal"
  | "ai_assistant"
  | "reports"
  | "signup_requests"
  | "settings";

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  organisation?: string;
  employeeId?: string;
  isLoggedIn: boolean;
}

export interface LiveAlert {
  id: string;
  timestamp: string;
  type: string;
  source: string;
  amount?: string;
  status: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  location: string;
}

export interface ScamCallAnalysis {
  riskScore: number; // 0 to 100
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  scamType: string;
  confidence: number;
  hindiTranscript?: string;
  englishTranscript: string;
  highlights: {
    text: string;
    reason: string;
    severity: "high" | "medium" | "low";
  }[];
  actions: string[];
  cases: {
    caseId: string;
    title: string;
    similarity: string;
    status: string;
  }[];
}

export interface CurrencyAnalysis {
  serialNo: string;
  isValid: boolean;
  /** False when the uploaded image is not a banknote at all (presence gate). */
  isBanknote?: boolean;
  /** Raw NETRA verdict: "genuine" | "suspect" | "inconclusive". */
  verdict?: string;
  confidence: number;
  mismatchReason?: string;
  heatmapMarkings: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    status: "valid" | "suspicious" | "missing";
    description: string;
  }[];
  features: {
    name: string;
    status: "PASS" | "FAIL" | "SUSPICIOUS";
    detail: string;
  }[];
  auditLog: string[];
}

export interface NetworkNode {
  id: string;
  label: string;
  type: "scammer" | "victim" | "mule_account" | "upi" | "ip_address";
  val: number;
  details: {
    risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    location: string;
    transactionsCount: number;
    totalValue: string;
    flaggedDate: string;
  };
}

export interface NetworkLink {
  source: string;
  target: string;
  label: string;
  value: number;
}

export interface IncidentReport {
  id: string;
  category: string;
  reporter: string;
  targetEntity: string; // e.g. Phone or UPI or URL
  description: string;
  state: string;
  date: string;
  status: "UNDER INVESTIGATION" | "RESOLVED" | "FROZEN" | "PENDING";
  amountLoss?: string;
}

export interface OfficerSignupRequest {
  id: string;
  name: string;
  organisation: string;
  employeeId: string;
  phone: string;
  role: "officer" | "bank_rep";
  status: "PENDING" | "APPROVED" | "REJECTED";
  date: string;
}

// JAAL Module Interface Exports
export * from "./types/jaal";
