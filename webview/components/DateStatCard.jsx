import { CalendarDays } from 'lucide-react'
import { cn } from '../lib/utils'

const ROWS = [
  { key: 'overdue', label: 'Gecikmiş', color: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  { key: 'thisWeek', label: 'Bu Hafta', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  { key: 'upcoming', label: 'Yaklaşan', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { key: 'noDate', label: 'Tarihi Yok', color: 'text-muted-foreground/60', dot: 'bg-muted-foreground/40' },
]

export function DateStatCard({ dateStats, isCompact }) {
  return (
    <div className={cn('flex flex-col min-w-0', isCompact ? 'gap-1.5' : 'gap-2')}>
      <div className="flex items-center gap-1.5">
        <CalendarDays className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[10px] font-medium text-muted-foreground">Tarih</span>
      </div>

      <div className="flex flex-col gap-1">
        {ROWS.map(row => {
          const count = dateStats[row.key]
          const isBold = row.key === 'overdue' && count > 0
          return (
            <div key={row.key} className="flex items-center justify-between gap-2">
              <span className={cn('flex items-center gap-1.5 text-[10px]', row.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', row.dot)} />
                {row.label}
              </span>
              <span className={cn(
                'text-[10px] font-mono-code tabular-nums',
                isBold ? 'font-bold' : 'font-medium',
                row.color
              )}>
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
