import { LegalPageShell } from "@/components/legal/page-shell";
import { DraftNotice } from "@/components/legal/draft-notice";

export const metadata = {
  title: "Terms of Service — BWN",
  description: "The terms that govern your use of BWN.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="2026-04-22">
      <DraftNotice />

      <p>
        These terms govern your use of BWN (&quot;we&quot;, &quot;us&quot;). By
        joining or continuing to use the service you agree to them.
      </p>

      <h2>What BWN is</h2>
      <p>
        BWN is a private, invite-only community offering betting information,
        tools and commentary. We do not take bets, hold funds, or act as a
        bookmaker. Any bet you place happens on a licensed operator&apos;s site
        subject to that operator&apos;s terms.
      </p>

      <h2>Eligibility</h2>
      <ul>
        <li>You must be 18 or over.</li>
        <li>
          You must be physically located in a jurisdiction where accessing
          gambling-adjacent content is lawful for you.
        </li>
        <li>
          You must have received a valid invite code. Sharing or reselling
          invite codes is prohibited.
        </li>
      </ul>

      <h2>Your account</h2>
      <ul>
        <li>
          You sign in with Discord. Keep your Discord account secure; anything
          done under your session is your responsibility.
        </li>
        <li>
          We may suspend or remove accounts that abuse the service or breach
          these terms.
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>No automated scraping of the service or its API.</li>
        <li>
          No content that promotes gambling to under-18s, presents it as a way
          to resolve financial problems, or offers guaranteed returns.
        </li>
        <li>No harassment, illegal content, or circumvention of access controls.</li>
      </ul>

      <h2>No financial or betting advice</h2>
      <p>
        Content on BWN is for information and entertainment only. It is not
        financial advice, investment advice, or a guarantee of outcomes. Only
        stake amounts you can afford to lose. If gambling stops being fun,{" "}
        <a
          href="https://www.begambleaware.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          BeGambleAware
        </a>{" "}
        offers free, confidential support.
      </p>

      <h2>Affiliate links</h2>
      <p>
        Some outbound links to bookmakers are affiliate links. If you sign up
        and bet through one we may receive a commission from the operator at no
        cost to you. Affiliate status does not change our editorial view of an
        operator.
      </p>

      <h2>Intellectual property</h2>
      <p>
        We keep rights in the BWN brand, design, and editorial content. You
        keep rights in the content you post; by posting you grant us a
        non-exclusive licence to display it within the service.
      </p>

      <h2>Liability</h2>
      <p>
        Nothing in these terms limits our liability where UK law prevents us
        from doing so (for example, death or personal injury caused by
        negligence, or fraud). To the fullest extent permitted, BWN is provided
        &quot;as is&quot; and our aggregate liability is capped at £100.
      </p>

      <h2>Termination</h2>
      <p>
        You can stop using BWN at any time. We may suspend or remove access for
        breach of these terms or on reasonable notice if we cease operating the
        service.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of England and Wales. The courts of
        England and Wales have exclusive jurisdiction over any dispute.
      </p>

      <h2>Contact</h2>
      <p>
        Questions:{" "}
        <a href="mailto:legal@bwn.local">legal@bwn.local</a>.{" "}
        <span className="text-amber-300">[TODO: replace with real address.]</span>
      </p>
    </LegalPageShell>
  );
}
