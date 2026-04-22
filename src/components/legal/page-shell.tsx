import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { POLICY_VERSION } from "@/lib/legal";

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-xs text-zinc-500">
            Last updated: {lastUpdated} &middot; Policy version {POLICY_VERSION}
          </p>
        </header>
        <div className="space-y-5 text-sm leading-relaxed text-zinc-300 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-[#00FF87] [&_a:hover]:underline">
          {children}
        </div>
        <footer className="pt-6 border-t border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-500">
          <Link href="/privacy" className="hover:text-zinc-300">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300">
            Terms
          </Link>
          <Link href="/cookies" className="hover:text-zinc-300">
            Cookies
          </Link>
          <Link href="/accessibility" className="hover:text-zinc-300">
            Accessibility
          </Link>
          <Link href="/responsible-gambling" className="hover:text-zinc-300">
            Responsible gambling
          </Link>
        </footer>
      </div>
    </div>
  );
}
