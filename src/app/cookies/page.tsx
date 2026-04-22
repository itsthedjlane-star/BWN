import { LegalPageShell } from "@/components/legal/page-shell";
import { DraftNotice } from "@/components/legal/draft-notice";

export const metadata = {
  title: "Cookie Notice — BWN",
  description: "What cookies BWN sets and how you can control them.",
};

export default function CookiesPage() {
  return (
    <LegalPageShell title="Cookie Notice" lastUpdated="2026-04-22">
      <DraftNotice />

      <p>
        This notice explains the cookies and similar technologies used on BWN
        and how to control them, as required by PECR and UK GDPR.
      </p>

      <h2>Strictly necessary</h2>
      <p>
        These cookies are required for BWN to work and do not need your
        consent.
      </p>
      <ul>
        <li>
          <strong>Session cookie</strong> (<code>next-auth.session-token</code>)
          — keeps you signed in after Discord login. Expires when you sign out
          or after 30 days.
        </li>
        <li>
          <strong>CSRF token</strong> (<code>next-auth.csrf-token</code>) —
          prevents cross-site request forgery on the auth endpoints. Session
          lifetime.
        </li>
      </ul>

      <h2>Functional</h2>
      <p>
        These cookies remember preferences. We only set them when you choose
        one.
      </p>
      <ul>
        <li>
          <strong>Odds format</strong> — remembers whether you last viewed
          fractional or decimal odds. Stored in <code>localStorage</code>, not
          in an HTTP cookie.
        </li>
      </ul>

      <h2>Consent state</h2>
      <ul>
        <li>
          <strong>bwn.cookie-consent</strong> — stores your banner choice
          (&quot;accept&quot; / &quot;reject&quot;) and the policy version so we
          know when to re-prompt you. Stored in <code>localStorage</code>.
        </li>
      </ul>

      <h2>Analytics and marketing</h2>
      <p>
        We do not run analytics or marketing trackers today. If that changes, we
        will block them until you accept in the cookie banner, and this notice
        will be updated with the exact providers and purposes.
      </p>

      <h2>Managing your choices</h2>
      <p>
        You can change your decision at any time by clearing your browser
        storage for this site, which re-shows the banner. Browser-level controls
        also let you block or delete cookies per site.
      </p>

      <h2>Third-party cookies set during Discord login</h2>
      <p>
        Signing in with Discord may briefly set cookies on the{" "}
        <code>discord.com</code> domain. These are controlled by Discord under
        their{" "}
        <a
          href="https://discord.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          privacy policy
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
