"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  needsCookieConsent,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentChoice,
} from "@/lib/legal";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(needsCookieConsent(readCookieConsent()));
  }, []);

  if (!visible) return null;

  const decide = (choice: CookieConsentChoice) => {
    writeCookieConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 p-3 md:p-4"
    >
      <div className="max-w-4xl mx-auto rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur shadow-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="text-xs md:text-sm text-zinc-300 leading-relaxed">
          <p>
            BWN only sets cookies that are strictly necessary to sign you in
            and secure the session — we don&apos;t run analytics or marketing
            trackers today. If that changes we&apos;ll ask first. See our{" "}
            <Link
              href="/cookies"
              className="text-[#00FF87] underline-offset-2 hover:underline"
            >
              Cookie Notice
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-[#00FF87] underline-offset-2 hover:underline"
            >
              Privacy Notice
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => decide("reject")}
            className="px-4 py-2 rounded-md text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => decide("accept")}
            className="px-4 py-2 rounded-md text-xs font-semibold text-zinc-900 bg-[#00FF87] hover:bg-[#00E67A]"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
