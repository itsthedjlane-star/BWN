import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsibleGamblingFooter } from "@/components/responsible-gambling-footer";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Responsible Gambling — BWN",
};

export default function ResponsibleGamblingPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-[#00FF87]" size={24} />
          Responsible Gambling
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Betting should be fun, never harmful.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Our policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-400 leading-relaxed">
          <p>
            BWN is an information and community platform. We do not take bets,
            hold funds, or accept stakes. All betting happens on the licensed
            operator&apos;s own site. Some of our outbound bookmaker links are
            affiliate links — when you sign up through one and place a bet, BWN
            may earn a commission at no extra cost to you.
          </p>
          <p>
            You must be 18 or over to use BWN&apos;s betting content. Only bet
            money you can afford to lose. If gambling stops being fun, take a
            break — or stop.
          </p>
          <div>
            <p className="font-semibold text-white mb-2">Get help</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <a
                  href="https://www.begambleaware.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00FF87] hover:underline"
                >
                  BeGambleAware.org
                </a>
                {" "}— free, confidential advice and support.
              </li>
              <li>
                <a
                  href="https://www.gamstop.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00FF87] hover:underline"
                >
                  GamStop
                </a>
                {" "}— self-exclude from UK-licensed gambling sites.
              </li>
              <li>
                National Gambling Helpline:{" "}
                <span className="text-white">0808 8020 133</span> (24/7, free).
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">
              Tools operators must offer you
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Deposit limits (daily / weekly / monthly).</li>
              <li>Loss, wager, and session-time limits.</li>
              <li>Reality checks and time-out periods.</li>
              <li>Self-exclusion — immediate and irreversible.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <ResponsibleGamblingFooter />
    </div>
  );
}
