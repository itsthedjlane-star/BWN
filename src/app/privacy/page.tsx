import { LegalPageShell } from "@/components/legal/page-shell";
import { DraftNotice } from "@/components/legal/draft-notice";

export const metadata = {
  title: "Privacy Notice — BWN",
  description: "How BWN handles your personal data under UK GDPR.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Notice" lastUpdated="2026-04-22">
      <DraftNotice />

      <p>
        BWN is an invite-only, private community platform. This notice explains
        what personal data we collect, why, how long we keep it, and the rights
        you have under the UK GDPR and the Data Protection Act 2018.
      </p>

      <h2>Who we are</h2>
      <p>
        The controller of your data is the operator of BWN (currently a sole
        trader; a limited company will be incorporated before any paid tier
        launches). You can reach us at{" "}
        <a href="mailto:privacy@bwn.local">privacy@bwn.local</a>.{" "}
        <span className="text-amber-300">
          [TODO: replace with real contact + ICO registration number once
          registered.]
        </span>
      </p>

      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Account identity (Discord ID, name, email, avatar).</strong>{" "}
          Collected via Discord OAuth to authenticate you and grant access to
          the community. Legal basis: performance of a contract (Art. 6(1)(b)).
        </li>
        <li>
          <strong>Invite code redemption + age confirmation.</strong> We record
          the code you used and the timestamp you confirmed you are 18 or over.
          Legal basis: legitimate interests (Art. 6(1)(f)) — preventing under-18
          access to gambling-adjacent content.
        </li>
        <li>
          <strong>Bet tracker entries.</strong> The bets, tips, tails and
          comments you add are stored on your account. Legal basis: performance
          of a contract.
        </li>
        <li>
          <strong>Outbound click logs.</strong> When you click an affiliate link
          to a bookmaker we log the bookmaker and the surface ("odds", "tip",
          "tracker"). We do not send your identity to the bookmaker.
        </li>
        <li>
          <strong>Technical logs.</strong> IP address, user agent, and request
          timing are handled by our hosting provider for a short operational
          window. Legal basis: legitimate interests (service integrity).
        </li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not take bets, hold funds, or act as a bookmaker.</li>
        <li>We do not sell your personal data.</li>
        <li>We do not run advertising or analytics trackers today.</li>
      </ul>

      <h2>Retention</h2>
      <ul>
        <li>
          Account data: kept for the life of your account. Deleted within 30
          days of account closure, subject to any legal-hold exceptions.
        </li>
        <li>Used invite codes: deleted after 90 days.</li>
        <li>Session records: handled by the auth layer, typically 30 days.</li>
        <li>
          Bets and tips authored by a deleted user: user ID is nulled so stats
          others saw remain intact, and the content is reassigned to a
          "Deleted user" placeholder.
        </li>
      </ul>

      <h2>Sub-processors</h2>
      <p>
        We use a small set of third-party processors. A live list will be
        published at <a href="/privacy#sub-processors">/privacy#sub-processors</a>{" "}
        before any wider rollout.{" "}
        <span className="text-amber-300">
          [TODO: publish the current list — Vercel (hosting), Neon (Postgres),
          Discord (auth), The Odds API (odds data), Anthropic (agent MCP).]
        </span>
      </p>

      <h2>International transfers</h2>
      <p>
        We target EU/UK regions for hosting (London on Vercel, EU-West on Neon)
        so personal data stays within the UK-adequate zone wherever possible.
        Where a US processor is involved (e.g. Discord auth), transfers rely on
        the UK International Data Transfer Agreement or the relevant provider&apos;s
        UK addendum.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK GDPR you can request access to, correction of, deletion of, or
        a portable copy of your data, and you can object to certain processing.
        Contact us at <a href="mailto:privacy@bwn.local">privacy@bwn.local</a>.
        We aim to respond within one calendar month.
      </p>
      <p>
        You also have the right to complain to the{" "}
        <a
          href="https://ico.org.uk/make-a-complaint/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Information Commissioner&apos;s Office
        </a>
        .
      </p>

      <h2>Children</h2>
      <p>
        BWN is for adults only. We confirm age on sign-up and do not knowingly
        process data from anyone under 18. If you believe we have, please tell
        us and we will delete the account.
      </p>

      <h2>Changes</h2>
      <p>
        We version this notice (see the footer). Material changes trigger a new
        consent prompt on your next visit.
      </p>
    </LegalPageShell>
  );
}
