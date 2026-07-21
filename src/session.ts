import { UserSession } from "./types";

const STORAGE_KEY = "safenet.session";

export const ANONYMOUS_SESSION: UserSession = {
  id: "USER-001",
  name: "Arjun Singh",
  role: "citizen",
  email: "arjun.singh@cert-in.gov.in",
  isLoggedIn: false,
};

/**
 * Restores the session from storage so a page reload does not force a
 * re-login. This is presentation-state only — it does not grant any
 * authority the server would not otherwise grant.
 */
export function loadSession(): UserSession {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return ANONYMOUS_SESSION;
    const parsed = JSON.parse(raw) as UserSession;
    if (!parsed || typeof parsed !== "object" || !parsed.isLoggedIn) {
      return ANONYMOUS_SESSION;
    }
    return { ...ANONYMOUS_SESSION, ...parsed };
  } catch {
    return ANONYMOUS_SESSION;
  }
}

export function saveSession(session: UserSession): void {
  try {
    if (session.isLoggedIn) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* storage unavailable (private mode) — session stays in memory only */
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
