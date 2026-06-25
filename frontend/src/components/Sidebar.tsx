"use client";

// =============================================================================
// Sidebar — Admin Dashboard Navigation
// =============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onLogout: () => void;
  userName?: string;
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

export default function Sidebar({ onLogout, userName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold shadow-lg">
          🗳️
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide">Election Admin</h1>
          <p className="text-[11px] text-slate-400">Control Panel</p>
        </div>
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
  );
}
