"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Target,
  Lightbulb,
  TrendingUp,
  Trophy,
  Gauge,
  Settings,
  Shield,
  X,
  Bike,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Odds", href: "/odds", icon: Gauge },
  { name: "Tips", href: "/tips", icon: Target },
  { name: "Tipsters", href: "/tipsters", icon: Users },
  { name: "Tracker", href: "/tracker", icon: BarChart3 },
  { name: "Strategies", href: "/strategies", icon: Lightbulb },
  { name: "Matches", href: "/matches", icon: Trophy },
  { name: "Racing", href: "/racing/horses", icon: Bike },
];

const adminNav = [
  { name: "Admin", href: "/admin", icon: Shield },
];

interface SidebarProps {
  isAdmin?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isAdmin, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <Link href="/odds" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="BWN" className="w-9 h-9 drop-shadow-[0_0_8px_rgba(0,255,135,0.3)]" />
            <div>
              <p className="text-sm font-bold text-[#00FF87] tracking-wider leading-none">BWN</p>
              <p className="text-[10px] text-zinc-500 tracking-widest leading-none mt-1">BOOKIES WORST NIGHTMARE</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  Admin
                </p>
              </div>
              {adminNav.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    )}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Settings */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
          >
            <Settings size={18} />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
