"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionProvider } from "next-auth/react";

function RegisterForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const pending = searchParams.get("pending");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
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
          <img src="/logo.svg" alt="BWN" className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(0,255,135,0.4)]" />
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
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Join BWN"}
              </Button>
            </form>
          )}
        </div>
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
