"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionProvider } from "next-auth/react";

function RegisterForm() {
  const [code, setCode] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  useSession();
  const pending = searchParams.get("pending");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) {
      setError("You must confirm you are 18 or over to join.");
      return;
    }
    if (!policyAccepted) {
      setError("You must agree to the Terms of Service and Privacy Notice.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: code,
          ageConfirmed: true,
          policyAccepted: true,
        }),
      });

      if (res.ok) {
        router.push("/odds");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid invite code");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="BWN"
            className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(0,255,135,0.4)]"
          />
          <h1 className="text-2xl font-bold text-white">Welcome to BWN</h1>
          <p className="text-zinc-500 mt-2">
            {pending
              ? "Your account is pending approval"
              : "Enter your invite code to join"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
          {pending ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-400 text-xl">⏳</span>
              </div>
              <p className="text-zinc-300 mb-2">Waiting for admin approval</p>
              <p className="text-xs text-zinc-500">
                Ask Harry to approve your account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Invite Code
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your invite code"
                  required
                />
              </div>
              <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#00FF87] focus:ring-[#00FF87] focus:ring-offset-0 cursor-pointer"
                />
                <span>
                  I confirm I am <strong className="text-white">18 or over</strong>{" "}
                  and have read the{" "}
                  <Link
                    href="/responsible-gambling"
                    className="text-[#00FF87] hover:underline"
                  >
                    responsible-gambling information
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#00FF87] focus:ring-[#00FF87] focus:ring-offset-0 cursor-pointer"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-[#00FF87] hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-[#00FF87] hover:underline"
                  >
                    Privacy Notice
                  </Link>
                  .
                </span>
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !ageConfirmed || !policyAccepted}
              >
                {loading ? "Verifying..." : "Join BWN"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-500 text-center">
          <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold mr-1">
            18+
          </span>
          Gamble responsibly. Help:{" "}
          <a
            href="https://www.begambleaware.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white underline"
          >
            BeGambleAware.org
          </a>
        </p>
        <nav className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-zinc-600">
          <Link href="/privacy" className="hover:text-zinc-400">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-400">
            Terms
          </Link>
          <Link href="/cookies" className="hover:text-zinc-400">
            Cookies
          </Link>
          <Link href="/accessibility" className="hover:text-zinc-400">
            Accessibility
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <SessionProvider>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </SessionProvider>
  );
}
