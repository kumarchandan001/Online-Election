"use client";

// =============================================================================
// VoterNav — Top navigation bar for voter portal (Mobile-Responsive)
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
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-3 sm:h-16 sm:px-6">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm shadow-md sm:h-9 sm:w-9 sm:rounded-xl">
            🗳️
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white sm:text-lg">
            VoteSecure
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Avatar — only on sm+ */}
          {userName && (
            <div className="mr-1 hidden items-center gap-2 sm:mr-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {userName.split(" ")[0]}
              </span>
            </div>
          )}

          {/* My Elections link */}
          <Link
            href="/dashboard"
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm ${
              pathname === "/dashboard"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            <span className="hidden sm:inline">My Elections</span>
            <span className="sm:hidden">Elections</span>
          </Link>

          {/* Divider */}
          <div className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700 sm:mx-1 sm:h-6" />

          {/* Sign Out */}
          <button
            onClick={onLogout}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400 sm:px-3 sm:py-2 sm:text-sm"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
