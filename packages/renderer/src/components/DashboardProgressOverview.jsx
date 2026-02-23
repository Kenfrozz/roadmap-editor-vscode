import { cn } from '../lib/utils'
import { ProgressRing, PhaseProgress, DateChart } from './StatsPanel'

export function DashboardProgressOverview({ overallPct, fazProgress, dateDist, total, done, isCompact, isWide }) {
  const hasDateData = dateDist && dateDist.bins?.some(b => b.count > 0)

  if (isCompact) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors">
        <div className="p-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <ProgressRing size={48} strokeWidth={3} pct={overallPct} done={done} total={total} />
            <div className="flex-1 min-w-0">
              <PhaseProgress phases={fazProgress} isCompact />
            </div>
          </div>
          {hasDateData && (
            <div className="pt-2 border-t border-border/15">
              <DateChart data={dateDist} isCompact />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors">
      <div className="flex items-stretch">
        <div className="flex items-center justify-center px-5 py-3 shrink-0">
          <ProgressRing size={74} strokeWidth={4} pct={overallPct} done={done} total={total} />
        </div>
        <div className="w-px self-stretch my-2.5 bg-gradient-to-b from-transparent via-border/20 to-transparent shrink-0" />
        <div className="flex-1 flex items-center px-5 py-3 min-w-0">
          <PhaseProgress phases={fazProgress} />
        </div>
      </div>
      {hasDateData && (
        <div className="px-5 pb-3 pt-0">
          <div className="pt-2.5 border-t border-border/15">
            <DateChart data={dateDist} />
          </div>
        </div>
      )}
    </div>
  )
}
