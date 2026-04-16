import Link from "next/link";

/**
 * Required on every page that carries affiliate CTAs to meet UK
 * advertising standards (18+, problem-gambling signposting).
 */
export function ResponsibleGamblingFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
      <p>
        <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold mr-2">
          18+
        </span>
        Gamble responsibly. When the fun stops, stop.
      </p>
      <p>
        Free, confidential help is available from{" "}
        <a
          href="https://www.begambleaware.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white underline"
        >
          BeGambleAware.org
        </a>
        {" · "}
        <a
          href="https://www.gamstop.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-white underline"
        >
          GamStop
        </a>
        {" · "}
        <Link
          href="/responsible-gambling"
          className="text-zinc-400 hover:text-white underline"
        >
          Our policy
        </Link>
      </p>
      <p className="text-zinc-600">
        Links to bookmakers may earn BWN a commission. Odds and availability
        vary; check the operator&apos;s site for current terms.
      </p>
    </div>
  );
}
