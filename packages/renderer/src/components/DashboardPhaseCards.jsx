import { cn } from '../lib/utils'
import { computeStatusBreakdown } from '../lib/statsUtils'

export function DashboardPhaseCards({ fazProgress, fazConfig, data, statusColumns, isCompact }) {
  if (!fazProgress?.length) return null

  const colCount = fazProgress.length
  const gridClass = isCompact
    ? 'grid-cols-2'
    : colCount <= 3
      ? 'grid-cols-3'
      : 'grid-cols-4'

  return (
    <div className={cn('grid gap-3', gridClass)}>
      {fazProgress.map(faz => {
        const cfg = fazConfig[faz.key]
        if (!cfg) return null

        const items = data[faz.key] || []
        const firstStatus = statusColumns?.[0]
        const breakdown = firstStatus
          ? computeStatusBreakdown(items, firstStatus.key)
          : { done: faz.done, inProgress: 0, notDone: faz.total - faz.done, na: 0 }

        return (
          <div
            key={faz.key}
            className={cn(
              'rounded-lg border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors',
              'border-l-[3px]',
              cfg.color,
            )}
          >
            <div className={cn(isCompact ? 'p-2.5' : 'p-3')}>
              {/* Faz adi */}
              <div className={cn(
                'font-mono-code font-bold truncate mb-2',
                isCompact ? 'text-[10px]' : 'text-[11px]',
                cfg.text,
              )}>
                {cfg.name}
              </div>

              {/* Progress bar */}
              <div className={cn(
                'w-full rounded-full overflow-hidden mb-2',
                isCompact ? 'h-1' : 'h-1.5',
                'bg-muted/10',
              )}>
                {faz.pct > 0 && (
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      faz.pct === 100
                        ? 'bg-emerald-500/60 dark:bg-emerald-400/50'
                        : `${cfg.bg}/50`,
                    )}
                    style={{ width: `${faz.pct}%` }}
                  />
                )}
              </div>

              {/* Done / Total + yuzde */}
              <div className="flex items-center justify-between">
                <div className={cn(
                  'font-mono-code tabular-nums leading-none',
                  isCompact ? 'text-[9px]' : 'text-[10px]',
                )}>
                  <span className="font-bold text-foreground/60">{faz.done}</span>
                  <span className="text-muted-foreground/20 mx-px">/</span>
                  <span className="text-muted-foreground/35">{faz.total}</span>
                </div>
                <span className={cn(
                  'font-mono-code font-bold tabular-nums leading-none',
                  isCompact ? 'text-[9px]' : 'text-[10px]',
                  faz.pct === 100
                    ? 'text-emerald-500/70 dark:text-emerald-400/60'
                    : faz.pct > 0
                      ? 'text-foreground/40'
                      : 'text-muted-foreground/20',
                )}>
                  {faz.pct}%
                </span>
              </div>

              {/* Mini status dots */}
              {items.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {breakdown.done > 0 && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                      <span className="text-[8px] font-mono-code text-muted-foreground/40">{breakdown.done}</span>
                    </div>
                  )}
                  {breakdown.inProgress > 0 && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                      <span className="text-[8px] font-mono-code text-muted-foreground/40">{breakdown.inProgress}</span>
                    </div>
                  )}
                  {breakdown.notDone > 0 && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                      <span className="text-[8px] font-mono-code text-muted-foreground/40">{breakdown.notDone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
