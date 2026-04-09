"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [oddsFormat, setOddsFormat] = useState<"fractional" | "decimal">(
    "fractional"
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-[#00FF87]" size={24} />
          Settings
        </h1>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} className="text-[#00FF87]" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-16 h-16 rounded-full ring-2 ring-zinc-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-400 ring-2 ring-zinc-700">
                  {session?.user?.name?.[0] ?? "?"}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">
                  {session?.user?.name ?? "Unknown"}
                </p>
                <p className="text-sm text-zinc-500">{session?.user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      session?.user?.role === "ADMIN" ? "warning" : "default"
                    }
                  >
                    {session?.user?.role}
                  </Badge>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-600">
              Profile details are synced from your Discord account.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette size={16} className="text-[#00FF87]" />
            Display Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Default Odds Format
            </label>
            <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-1 w-fit">
              <button
                onClick={() => setOddsFormat("fractional")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  oddsFormat === "fractional"
                    ? "bg-[#00FF87] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Fractional (7/2)
              </button>
              <button
                onClick={() => setOddsFormat("decimal")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  oddsFormat === "decimal"
                    ? "bg-[#00FF87] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Decimal (4.50)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell size={16} className="text-[#00FF87]" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            Push notifications and tip alerts coming soon. For now, check the
            Tips Feed regularly.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={16} className="text-[#00FF87]" />
            About BWN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Version</span>
            <span className="text-sm text-white font-mono">0.1.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Platform</span>
            <span className="text-sm text-white">Next.js + Vercel</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Data</span>
            <span className="text-sm text-white">The Odds API</span>
          </div>
          <p className="text-xs text-zinc-600 pt-2 border-t border-zinc-800">
            Built for the group. No bookies allowed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
