import { LiveAlert, IncidentReport, NetworkNode, NetworkLink } from "./types";

export const SAMPLE_TRANSCRIPTS = [
  {
    id: "kbc_lottery",
    title: "Kaun Banega Crorepati (KBC) Lottery Scam",
    language: "Hindi / Hinglish",
    text: "Namaskar! Main KBC Mumbai head office se Rajesh Kumar baat kar raha hoon. Aapke liye bohot badi khushkhabri hai! Aapka phone number KBC aur Jio ke 25 Lakh ka lottery winner bana hai! Haan ji, bilkul sach! Lekin is lottery money ko aapke bank account mein transfer karne ke liye, aapko humari security tax aur processing file charge pay karni hogi. Sirf Rs. 25,000 humare counter register par submit kijiye, fir 10 minute mein paise aapke account mein transfer ho jayenge. Agar aapne abhi pay nahi kiya to aapki lottery cancel ho jayegi!"
  },
  {
    id: "customs_arrest",
    title: "CBI / FedEx 'Digital Arrest' Narcotics Parcel Scam",
    language: "English / Hindi",
    text: "Attention, this is Deputy Commissioner Sandeep Singh calling from the Mumbai Narcotics and Customs Department. A FedEx parcel sent from Mumbai to Taiwan has been intercepted. The parcel contains 5 illegal passports, 150 grams of MDMA (drugs), and 2 credit cards registered in your name and Aadhaar ID! You are a major prime suspect in an international money laundering syndicate. Do not hang up this call! You are under 'Digital Arrest'. Keep your mobile video camera on so we can monitor you. You must immediately transfer a safety deposit of Rs. 3,50,000 to our verified supreme court clearance escrow account for forensic verification, or you will be arrested in 1 hour."
  },
  {
    id: "sim_kyc",
    title: "Telecom Aadhaar KYC Suspension Threat",
    language: "Hindi / English",
    text: "Urgent update from your Telecom Service Provider. Your Aadhaar e-KYC validation has expired and your SIM card services will be deactivated and blocked within 2 hours. To prevent immediate deactivation, dial 9 right now to speak with our verification agent. Welcome sir, please download this 'Support-Quick.apk' or 'AnyDesk' utility application immediately, then enter your credit card number, and share the 6-digit OTP passcode with me so I can manually update your Aadhaar card links in our mainframe computer."
  }
];

export const SAMPLE_BANKNOTES = [
  {
    id: "genuine_500",
    name: "Rs 500 Note - Genuine RBI Tender",
    value: 500,
    // The exact image the NETRA CV backend analyses (served by server.ts).
    imageUrl: "/samples/genuine_500.jpg",
    isValid: true,
    description: "Official Indian banknote featuring clear Mahatma Gandhi portrait, 3mm windowed security thread, and tactile intaglio markings."
  },
  {
    id: "counterfeit_500",
    name: "Rs 500 Note - Counterfeit Warning Pattern",
    value: 500,
    imageUrl: "/samples/fake_500_photocopy.jpg",
    isValid: false,
    description: "Suspect note intercepted in regional retail checks. Fails multi-spectral fiber checks and security thread optical variable shift tests."
  }
];

export const LIVE_ALERTS: LiveAlert[] = [
  {
    id: "ALT-8831",
    timestamp: "Just Now",
    type: "UPI Scam Mule Account",
    source: "Google Pay @ybl",
    amount: "₹1,25,000",
    status: "CRITICAL",
    location: "Jamtara, Jharkhand"
  },
  {
    id: "ALT-8832",
    timestamp: "2 mins ago",
    type: "Digital Arrest Phishing Call",
    source: "+91 91029 88392",
    amount: "₹5,00,000 Attempted",
    status: "CRITICAL",
    location: "Delhi NCR"
  },
  {
    id: "ALT-8833",
    timestamp: "5 mins ago",
    type: "Fake Electricity Bill APK",
    source: "Malicious SMS Link",
    status: "HIGH",
    location: "Pune, Maharashtra"
  },
  {
    id: "ALT-8834",
    timestamp: "8 mins ago",
    type: "Mule Account Frozen",
    source: "HDFC Bank (A/C **9928)",
    amount: "₹8,45,000 Frozen",
    status: "MEDIUM",
    location: "Mumbai, MH"
  },
  {
    id: "ALT-8835",
    timestamp: "12 mins ago",
    type: "SIM Swap Extortion Campaign",
    source: "+91 88291 00293",
    status: "HIGH",
    location: "Mewat, Haryana"
  },
  {
    id: "ALT-8836",
    timestamp: "15 mins ago",
    type: "Part-time job WhatsApp Bait",
    source: "Telegram Portal",
    amount: "₹45,000",
    status: "MEDIUM",
    location: "Bengaluru, KA"
  }
];

export const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: "INC-2026-9811",
    category: "Digital Arrest Impersonation",
    reporter: "Suresh Chandra",
    targetEntity: "+91 98234 11092",
    description: "Caller claimed to be DCP Cyber Mumbai, threatened arrest over a fake DHL courier containing contraband. Demand of Rs 2 Lakhs made.",
    state: "Maharashtra",
    date: "17-07-2026",
    status: "UNDER INVESTIGATION",
    amountLoss: "₹2,00,000"
  },
  {
    id: "INC-2026-9812",
    category: "UPI Merchant Refund Scam",
    reporter: "Meera Deshmukh",
    targetEntity: "refund-support@paytm",
    description: "Received QR code to claim cash prize of Rs 10,000. Scanning immediately debited account instead.",
    state: "Karnataka",
    date: "16-07-2026",
    status: "FROZEN",
    amountLoss: "₹34,500"
  },
  {
    id: "INC-2026-9813",
    category: "Electricity Bill Suspension",
    reporter: "Ramesh Iyer",
    targetEntity: "electricity-verify.apk",
    description: "SMS warned electricity disconnect. Downloaded apk which read OTPs. Bank account cleared.",
    state: "Tamil Nadu",
    date: "15-07-2026",
    status: "RESOLVED",
    amountLoss: "₹1,80,000"
  },
  {
    id: "INC-2026-9814",
    category: "Part-Time YouTube Like Bait",
    reporter: "Amit Sharma",
    targetEntity: "+91 77382 01928",
    description: "Invited to WhatsApp group for simple video likes. Invested funds to unlock VIP levels. Group dissolved.",
    state: "Haryana",
    date: "15-07-2026",
    status: "PENDING",
    amountLoss: "₹55,000"
  }
];

export const NETWORK_NODES: NetworkNode[] = [
  { id: "S-1", label: "Suspect Call Center (IP: 103.88.92.1)", type: "scammer", val: 12, details: { risk: "CRITICAL", location: "Jamtara, JH", transactionsCount: 412, totalValue: "₹48.5L", flaggedDate: "10-06-2026" } },
  { id: "M-1", label: "Mule Account: Rajesh Kumar (SBI)", type: "mule_account", val: 8, details: { risk: "CRITICAL", location: "Kolkata, WB", transactionsCount: 92, totalValue: "₹22.4L", flaggedDate: "15-06-2026" } },
  { id: "M-2", label: "Mule Account: Preeti Sen (ICICI)", type: "mule_account", val: 8, details: { risk: "HIGH", location: "Patna, BR", transactionsCount: 45, totalValue: "₹11.8L", flaggedDate: "18-06-2026" } },
  { id: "V-1", label: "Victim: Suresh Sharma (Delhi)", type: "victim", val: 5, details: { risk: "LOW", location: "New Delhi", transactionsCount: 2, totalValue: "₹2.0L", flaggedDate: "17-06-2026" } },
  { id: "V-2", label: "Victim: Dr. Ananya Sen (Kolkata)", type: "victim", val: 5, details: { risk: "LOW", location: "Kolkata", transactionsCount: 4, totalValue: "₹5.2L", flaggedDate: "18-06-2026" } },
  { id: "U-1", label: "UPI ID: prizes-kbc@paytm", type: "upi", val: 6, details: { risk: "CRITICAL", location: "Mewat, HR", transactionsCount: 184, totalValue: "₹15.1L", flaggedDate: "12-06-2026" } },
  { id: "I-1", label: "IP Address: 103.88.92.1 (VPN Endpoint)", type: "ip_address", val: 6, details: { risk: "HIGH", location: "Cyber space", transactionsCount: 200, totalValue: "N/A", flaggedDate: "10-06-2026" } }
];

export const NETWORK_LINKS: NetworkLink[] = [
  { source: "S-1", target: "I-1", label: "VPN Tunnel Access", value: 3 },
  { source: "S-1", target: "V-1", label: "VoIP Spoof Extortion", value: 2 },
  { source: "S-1", target: "V-2", label: "Customs Arrest Impersonation", value: 2 },
  { source: "V-1", target: "U-1", label: "UPI Fraud Transfer", value: 4 },
  { source: "V-2", target: "M-1", label: "RTGS Escrow Transfer", value: 5 },
  { source: "U-1", target: "M-2", label: "Immediate Cash Sweep", value: 4 },
  { source: "M-1", target: "M-2", label: "Secondary Account Layering", value: 3 }
];
