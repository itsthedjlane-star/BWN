"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  UserPlus,
  Users,
  Copy,
  Check,
  Loader2,
  Target,
  CheckCircle,
  XCircle,
  MinusCircle,
  Mail,
} from "lucide-react";

interface Tip {
  id: string;
  sport: string;
  event: string;
  pick: string;
  odds: string;
  result: string;
  createdAt: string;
  author: { name: string | null };
}

interface InviteApplication {
  id: string;
  email: string;
  reason: string;
  source: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewNotes: string | null;
  inviteCode: { code: string } | null;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<any[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pendingTips, setPendingTips] = useState<Tip[]>([]);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [applications, setApplications] = useState<InviteApplication[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [lastMintedCode, setLastMintedCode] = useState<string | null>(null);

  useEffect(() => {
    // Fetch members
    fetch("/api/admin/members")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(() => {});

    // Fetch pending tips for settlement
    fetch("/api/tips?result=PENDING&limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.items)) setPendingTips(data.items);
      })
      .catch(() => {});

    // Fetch pending invite applications
    fetch("/api/admin/invite-applications?status=PENDING")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setApplications(data);
      })
      .catch(() => {});
  }, []);

  const reviewApplication = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/admin/invite-applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplications((prev) => prev.filter((a) => a.id !== id));
        if (action === "approve" && data.code) {
          setLastMintedCode(data.code);
        }
      }
    } catch (err) {
      console.error("Failed to review application:", err);
    } finally {
      setReviewingId(null);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/invite", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setGeneratedCode(data.code);
      }
    } catch (err) {
      // Fallback to client-side generation if DB is not connected
      const code = `BWN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setGeneratedCode(code);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setApproval = async (memberId: string, approved: boolean) => {
    setApprovingId(memberId);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, ...updated } : m))
        );
      }
    } catch (err) {
      console.error("Failed to update approval:", err);
    } finally {
      setApprovingId(null);
    }
  };

  const settleTip = async (tipId: string, result: "WON" | "LOST" | "VOID") => {
    setSettlingId(tipId);
    try {
      const res = await fetch(`/api/tips/${tipId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (res.ok) {
        setPendingTips((prev) => prev.filter((t) => t.id !== tipId));
      }
    } catch (err) {
      console.error("Failed to settle tip:", err);
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="text-[#00FF87]" size={24} />
          Admin Panel
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage members, invite codes & settle tips
        </p>
      </div>

      {/* Generate Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus size={16} className="text-[#00FF87]" />
            Generate Invite Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button onClick={generateCode} size="sm" disabled={generating}>
              {generating ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : null}
              Generate Code
            </Button>
            {generatedCode && (
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 bg-zinc-800 rounded-lg text-[#00FF87] font-mono text-sm">
                  {generatedCode}
                </code>
                <Button variant="ghost" size="sm" onClick={copyCode}>
                  {copied ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Share this code with someone to let them join BWN. Each code can only
            be used once.
          </p>
        </CardContent>
      </Card>

      {/* Invite Applications */}
      {(applications.length > 0 || lastMintedCode) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail size={16} className="text-[#00FF87]" />
              Invite Applications ({applications.length} pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastMintedCode && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-[#00FF87]/30 bg-[#00FF87]/5 px-3 py-2">
                <div className="text-xs text-zinc-300">
                  Minted code for last approval:{" "}
                  <code className="ml-1 px-2 py-0.5 rounded bg-zinc-800 text-[#00FF87] font-mono">
                    {lastMintedCode}
                  </code>
                  <span className="text-zinc-500"> — email it to the applicant.</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(lastMintedCode);
                  }}
                >
                  <Copy size={14} />
                </Button>
              </div>
            )}
            {applications.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">
                No pending applications.
              </p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-zinc-800 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {app.email}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(app.createdAt).toLocaleString()}
                          {app.source ? ` · via ${app.source}` : ""}
                        </p>
                        <p className="text-sm text-zinc-300 mt-2 whitespace-pre-wrap">
                          {app.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => reviewApplication(app.id, "approve")}
                          disabled={reviewingId === app.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-green-500/10 hover:bg-green-500/20 transition-colors text-green-400 text-xs font-medium disabled:opacity-50"
                        >
                          <CheckCircle size={12} />
                          Approve
                        </button>
                        <button
                          onClick={() => reviewApplication(app.id, "reject")}
                          disabled={reviewingId === app.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 text-xs font-medium disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settle Tips */}
      {pendingTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target size={16} className="text-[#00FF87]" />
              Settle Tips ({pendingTips.length} pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTips.map((tip) => (
                <div
                  key={tip.id}
                  className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {tip.pick}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {tip.event} &middot; {tip.odds} &middot; by{" "}
                      {tip.author?.name ?? "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => settleTip(tip.id, "WON")}
                      disabled={settlingId === tip.id}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 transition-colors text-green-400 text-xs font-medium"
                    >
                      <CheckCircle size={12} />
                      Won
                    </button>
                    <button
                      onClick={() => settleTip(tip.id, "LOST")}
                      disabled={settlingId === tip.id}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 text-xs font-medium"
                    >
                      <XCircle size={12} />
                      Lost
                    </button>
                    <button
                      onClick={() => settleTip(tip.id, "VOID")}
                      disabled={settlingId === tip.id}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors text-yellow-400 text-xs font-medium"
                    >
                      <MinusCircle size={12} />
                      Void
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={16} className="text-[#00FF87]" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">
              No members yet. Generate invite codes to grow the group.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {member.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={member.role === "ADMIN" ? "warning" : "default"}
                    >
                      {member.role}
                    </Badge>
                    <Badge variant={member.approved ? "success" : "danger"}>
                      {member.approved ? "Approved" : "Pending"}
                    </Badge>
                    {member.id !== session?.user?.id && (
                      <Button
                        size="sm"
                        variant={member.approved ? "ghost" : "default"}
                        onClick={() =>
                          setApproval(member.id, !member.approved)
                        }
                        disabled={approvingId === member.id}
                      >
                        {approvingId === member.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : member.approved ? (
                          "Revoke"
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
