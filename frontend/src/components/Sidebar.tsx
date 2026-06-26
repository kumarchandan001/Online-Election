"use client";

// =============================================================================
// Sidebar — Admin Dashboard Navigation (Responsive)
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onLogout: () => void;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "📊",
  },
  {
    label: "Create Election",
    href: "/admin/dashboard/new",
    icon: "➕",
  },
];

export default function Sidebar({ onLogout, userName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold shadow-lg">
              🗳️
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">Election Admin</h1>
              <p className="text-[11px] text-slate-400">Control Panel</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/admin/dashboard" &&
                pathname.startsWith("/admin/dashboard/") &&
                pathname !== "/admin/dashboard/new");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 shadow-sm"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="border-t border-slate-700/50 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold">
              {userName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{userName || "Admin"}</p>
              <p className="text-[11px] text-slate-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full cursor-pointer rounded-lg bg-slate-700/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-red-600/20 hover:text-red-300"
          >
            ← Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
