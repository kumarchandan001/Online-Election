"use client";

// =============================================================================
// VoterNav — Top navigation bar for voter portal
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";

interface VoterNavProps {
  onLogout: () => void;
  userName?: string;
}

export default function VoterNav({ onLogout, userName }: VoterNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
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
          {userName && (
            <div className="mr-2 hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {userName.split(" ")[0]}
              </span>
            </div>
          )}
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
          <div className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
          <button
            onClick={onLogout}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
