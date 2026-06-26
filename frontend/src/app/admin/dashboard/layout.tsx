"use client";

// =============================================================================
// Admin Layout — Protected wrapper with sidebar + auth guard
// =============================================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading, logout, user } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/admin/login");
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  // Show nothing while checking auth
  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <svg
            className="h-6 w-6 animate-spin text-indigo-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar onLogout={logout} userName={user?.name} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
