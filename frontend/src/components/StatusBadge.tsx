// =============================================================================
// StatusBadge — Color-coded election status pill
// =============================================================================

import { ElectionStatus } from "@/lib/types";

const STATUS_STYLES: Record<ElectionStatus, string> = {
  [ElectionStatus.UPCOMING]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  [ElectionStatus.ACTIVE]:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  [ElectionStatus.COMPLETED]:
    "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
};

const STATUS_ICONS: Record<ElectionStatus, string> = {
  [ElectionStatus.UPCOMING]: "🕐",
  [ElectionStatus.ACTIVE]: "🟢",
  [ElectionStatus.COMPLETED]: "✅",
};

export default function StatusBadge({ status }: { status: ElectionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${STATUS_STYLES[status]}`}
    >
      <span>{STATUS_ICONS[status]}</span>
      {status}
    </span>
  );
}
