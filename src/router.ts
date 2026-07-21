import { useCallback, useEffect, useState } from "react";
import { ScreenType } from "./types";

/**
 * Single source of truth mapping each screen to its URL path.
 * Adding a screen here is all that is needed for it to become linkable.
 */
export const SCREEN_PATHS: Record<ScreenType, string> = {
  landing: "/",
  signup: "/register",
  login: "/login",
  request_access: "/request-access",
  your_details: "/request-access/details",
  final_verification: "/request-access/verify",
  success: "/request-access/submitted",
  dashboard: "/command-centre",
  scam_analyser: "/scam-analyser",
  currency_detector: "/currency-forensics",
  network_intel: "/network-intelligence",
  ai_assistant: "/ai-advisor",
  reports: "/investigations",
  signup_requests: "/officer-requests",
  citizen_portal: "/citizen-shield",
  settings: "/settings",
};

const PATH_TO_SCREEN = Object.entries(SCREEN_PATHS).reduce<Record<string, ScreenType>>(
  (acc, [screen, path]) => {
    acc[path] = screen as ScreenType;
    return acc;
  },
  {}
);

/** Normalises a URL path (trailing slash, casing) to a known screen. */
export function screenFromPath(pathname: string): ScreenType {
  const normalised =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1).toLowerCase()
      : pathname.toLowerCase();
  return PATH_TO_SCREEN[normalised] ?? "landing";
}

export function pathFromScreen(screen: ScreenType): string {
  return SCREEN_PATHS[screen] ?? "/";
}

/**
 * Keeps the active screen in sync with the browser URL so that the back/forward
 * buttons, deep links and reloads all behave the way a user expects.
 */
export function useRoutedScreen(): [ScreenType, (screen: ScreenType) => void] {
  const [screen, setScreen] = useState<ScreenType>(() =>
    screenFromPath(window.location.pathname)
  );

  // Back / forward buttons.
  useEffect(() => {
    const onPopState = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Replace the initial entry so the first screen carries its canonical path.
  useEffect(() => {
    const canonical = pathFromScreen(screenFromPath(window.location.pathname));
    if (window.location.pathname !== canonical) {
      window.history.replaceState({}, "", canonical);
    }
  }, []);

  const navigate = useCallback((next: ScreenType) => {
    setScreen((current) => {
      const path = pathFromScreen(next);
      if (window.location.pathname !== path) {
        window.history.pushState({}, "", path);
      }
      if (current !== next) window.scrollTo(0, 0);
      return next;
    });
  }, []);

  return [screen, navigate];
}
