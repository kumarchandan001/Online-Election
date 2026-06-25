"use client";

// =============================================================================
// VoterNav — Mobile-first top navigation bar for voter portal
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";

interface VoterNavProps {
  onLogout: () => void;
}

export default function VoterNav({ onLogout }: VoterNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base shadow-md">
            🗳️
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
            VoteSecure
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/dashboard"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            My Elections
          </Link>
          <button
            onClick={onLogout}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
