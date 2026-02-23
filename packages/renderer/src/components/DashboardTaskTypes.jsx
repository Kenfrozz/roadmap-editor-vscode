import { cn } from '../lib/utils'
import { GOREV_TURU_COLORS } from '../lib/constants'
import { getGorevTuruIcon } from './TaskTypeBadge'

export function DashboardTaskTypes({ distribution, total, isCompact }) {
  if (!distribution || distribution.length === 0 || total === 0) return null

  return (
    <div className={cn(
      'rounded-lg border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors',
      isCompact ? 'p-2.5' : 'p-3',
    )}>
      <div className={cn(
        'font-mono-code font-bold text-foreground/50 mb-3',
        isCompact ? 'text-[10px]' : 'text-[11px]',
      )}>
        Gorev Turleri
      </div>

      {/* Orantili cubuk */}
      <div className="flex w-full h-2 rounded-full overflow-hidden gap-px">
        {distribution.map(d => {
          const colors = GOREV_TURU_COLORS[d.color] || GOREV_TURU_COLORS.slate
          return (
            <div
              key={d.key}
              className={cn('h-full first:rounded-l-full last:rounded-r-full', colors.dot)}
              style={{ width: `${(d.count / total) * 100}%`, opacity: 0.6 }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className={cn(
        'flex flex-wrap gap-x-4 gap-y-1.5 mt-3',
      )}>
        {distribution.map(d => {
          const colors = GOREV_TURU_COLORS[d.color] || GOREV_TURU_COLORS.slate
          const Icon = getGorevTuruIcon(d.icon)
          return (
            <div key={d.key} className="flex items-center gap-1.5">
              <Icon className={cn('w-3 h-3 shrink-0', colors.text)} />
              <span className={cn(
                'font-mono-code text-foreground/50',
                isCompact ? 'text-[9px]' : 'text-[10px]',
              )}>
                {d.label}
              </span>
              <span className={cn(
                'font-mono-code font-bold tabular-nums',
                isCompact ? 'text-[9px]' : 'text-[10px]',
                colors.text,
              )}>
                {d.count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
