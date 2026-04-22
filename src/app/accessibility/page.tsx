import { LegalPageShell } from "@/components/legal/page-shell";
import { DraftNotice } from "@/components/legal/draft-notice";

export const metadata = {
  title: "Accessibility — BWN",
  description: "Our accessibility target, known gaps, and how to request adjustments.",
};

export default function AccessibilityPage() {
  return (
    <LegalPageShell title="Accessibility Statement" lastUpdated="2026-04-22">
      <DraftNotice />

      <p>
        BWN aims to be usable by everyone. This statement explains our target,
        the known gaps we are working on, and how to contact us if you need a
        reasonable adjustment.
      </p>

      <h2>Our target</h2>
      <p>
        BWN targets{" "}
        <a
          href="https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_overview&levels=aaa"
          target="_blank"
          rel="noopener noreferrer"
        >
          WCAG 2.1 Level AA
        </a>
        . This is the standard UK public-sector bodies must meet and what we
        believe private services should aim for.
      </p>

      <h2>Known issues</h2>
      <ul>
        <li>
          <span className="text-amber-300">
            [TODO: run an accessibility audit (see audit/02-product-design.md)
            and populate this list with specific non-conformances.]
          </span>
        </li>
        <li>
          Keyboard focus styles are inconsistent in some components — we are
          working through this.
        </li>
        <li>
          Odds cards rely on colour to distinguish best price; a non-colour
          affordance is planned.
        </li>
      </ul>

      <h2>Requesting an adjustment</h2>
      <p>
        If any part of BWN is hard to use with your assistive technology, email
        us at{" "}
        <a href="mailto:accessibility@bwn.local">accessibility@bwn.local</a>{" "}
        and describe what you were trying to do. We aim to reply within 5
        working days.{" "}
        <span className="text-amber-300">
          [TODO: replace with real address.]
        </span>
      </p>

      <h2>Preparation of this statement</h2>
      <p>
        This statement was last reviewed on 2026-04-22. It has not yet been
        validated by external accessibility testing.
      </p>
    </LegalPageShell>
  );
}
