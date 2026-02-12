import { cn } from '../lib/utils'

export function StatusStatCard({ label, breakdown, icon: Icon, isCompact }) {
  const { done, inProgress, notDone, na } = breakdown
  const effective = done + inProgress + notDone
  const donePct = effective > 0 ? (done / effective) * 100 : 0
  const inProgressPct = effective > 0 ? (inProgress / effective) * 100 : 0
  const notDonePct = effective > 0 ? (notDone / effective) * 100 : 0

  return (
    <div className={cn('flex flex-col min-w-0', isCompact ? 'gap-1.5' : 'gap-2')}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[10px] font-medium text-muted-foreground truncate">{label}</span>
      </div>

      {effective > 0 ? (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
          {donePct > 0 && (
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${donePct}%` }}
            />
          )}
          {inProgressPct > 0 && (
            <div
              className="h-full bg-amber-500 transition-all duration-700"
              style={{ width: `${inProgressPct}%` }}
            />
          )}
          {notDonePct > 0 && (
            <div
              className="h-full bg-red-500 transition-all duration-700"
              style={{ width: `${notDonePct}%` }}
            />
          )}
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-muted" />
      )}

      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] font-mono-code text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {done}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-mono-code text-amber-600 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {inProgress}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-mono-code text-red-600 dark:text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {notDone}
        </span>
        {na > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-mono-code text-muted-foreground/50">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            {na}
          </span>
        )}
      </div>
    </div>
  )
}
