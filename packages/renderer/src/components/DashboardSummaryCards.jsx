import { ListChecks, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAnimatedValue } from './StatsPanel'

function SummaryCard({ icon: Icon, label, value, accent, isCompact }) {
  const animValue = useAnimatedValue(value)

  return (
    <div className={cn(
      'rounded-lg border border-border/40 bg-card/80 hover:border-border/60 transition-colors',
      isCompact ? 'p-3' : 'p-4',
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'shrink-0 rounded-lg flex items-center justify-center',
          isCompact ? 'w-8 h-8' : 'w-10 h-10',
          accent,
        )}>
          <Icon className={cn('text-white', isCompact ? 'w-4 h-4' : 'w-5 h-5')} />
        </div>
        <div className="min-w-0">
          <div className={cn(
            'font-black font-mono-code tracking-tight leading-none',
            isCompact ? 'text-xl' : 'text-2xl',
          )}>
            {animValue}
          </div>
          <div className={cn(
            'font-mono-code text-muted-foreground/60 mt-1 truncate',
            isCompact ? 'text-[9px]' : 'text-[10px]',
          )}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardSummaryCards({ total, done, inProgress, overdue, isCompact }) {
  return (
    <div className={cn(
      'grid gap-3',
      isCompact ? 'grid-cols-2' : 'grid-cols-4',
    )}>
      <SummaryCard
        icon={ListChecks}
        label="Toplam Gorev"
        value={total}
        accent="bg-primary"
        isCompact={isCompact}
      />
      <SummaryCard
        icon={CheckCircle2}
        label="Tamamlanan"
        value={done}
        accent="bg-emerald-500"
        isCompact={isCompact}
      />
      <SummaryCard
        icon={Clock}
        label="Devam Eden"
        value={inProgress}
        accent="bg-amber-500"
        isCompact={isCompact}
      />
      <SummaryCard
        icon={AlertTriangle}
        label="Geciken"
        value={overdue}
        accent="bg-red-500"
        isCompact={isCompact}
      />
    </div>
  )
}
