/**
 * Versioning for the legal surface: Terms, Privacy Notice, Cookie Notice.
 *
 * Bump whenever any policy is materially updated so we can force consent
 * refresh on next visit / login. The `<YYYY-MM-DD>-v<N>` shape keeps the
 * latest version visually sortable.
 */
export const POLICY_VERSION = "2026-04-22-v1";

export const COOKIE_CONSENT_STORAGE_KEY = "bwn.cookie-consent";

export type CookieConsentChoice = "accept" | "reject";

export type CookieConsentState = {
  choice: CookieConsentChoice;
  version: string;
  decidedAt: string; // ISO timestamp
};

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (!parsed.choice || !parsed.version || !parsed.decidedAt) return null;
    if (parsed.choice !== "accept" && parsed.choice !== "reject") return null;
    return parsed as CookieConsentState;
  } catch {
    return null;
  }
}

export function writeCookieConsent(choice: CookieConsentChoice): CookieConsentState {
  const state: CookieConsentState = {
    choice,
    version: POLICY_VERSION,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify(state)
    );
  }
  return state;
}

export function needsCookieConsent(state: CookieConsentState | null): boolean {
  if (!state) return true;
  return state.version !== POLICY_VERSION;
}
