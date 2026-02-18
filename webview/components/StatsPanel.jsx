import { useState, useEffect, useRef } from 'react'
import { cn } from '../lib/utils'
import { AlertTriangle, TrendingUp, CalendarDays } from 'lucide-react'

// ── Animated counter (easeOutQuart) ──
function useAnimatedValue(target, duration = 700) {
  const [display, setDisplay] = useState(0)
  const currentRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = currentRef.current
    const start = performance.now()

    const animate = (now) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      const val = Math.round(from + (target - from) * eased)
      currentRef.current = val
      setDisplay(val)
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return display
}

// ── Date indicator config ──
const DATE_CFG = {
  overdue: { icon: AlertTriangle, label: 'gecikmiş', text: 'text-red-500 dark:text-red-400', dot: 'bg-red-500', pulse: true },
  thisWeek: { icon: TrendingUp, label: 'bu hafta', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', pulse: false },
  upcoming: { icon: CalendarDays, label: 'yaklaşan', text: 'text-emerald-600/60 dark:text-emerald-400/60', dot: 'bg-emerald-500/50', pulse: false },
}

// ── Main Panel ──
export function StatsPanel({ overallPct, statusBreakdowns, dateStats, total, isCompact }) {
  if (total === 0 || (statusBreakdowns.length === 0 && !dateStats)) return null

  const pct = useAnimatedValue(overallPct)

  // Accent bar shifts color based on project health
  const accentGradient = overallPct >= 75
    ? 'from-emerald-500/70 via-emerald-400/50 to-transparent'
    : overallPct >= 35
      ? 'from-amber-500/70 via-amber-400/50 to-transparent'
      : 'from-red-500/70 via-red-400/50 to-transparent'

  const hasDateInfo = dateStats && (dateStats.overdue > 0 || dateStats.thisWeek > 0 || dateStats.upcoming > 0)

  // ── COMPACT MODE (sidebar ~300px) ──
  if (isCompact) {
    return (
      <div className="mb-4 rounded-lg border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors">
        <div className="p-3 space-y-2.5">
          {/* Hero number + count */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-px">
              <span className="text-[26px] font-black font-mono-code tracking-[-0.04em] leading-none">
                {pct}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground/35">%</span>
            </div>
            <span className="text-[9px] font-mono-code text-muted-foreground/25 tabular-nums">
              {total} görev
            </span>
          </div>

          {/* Status meters */}
          <div className="space-y-1.5">
            {statusBreakdowns.map(col => (
              <MeterRow key={col.key} col={col} />
            ))}
          </div>

          {/* Date chips */}
          {hasDateInfo && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/10">
              {Object.entries(DATE_CFG).map(([key, cfg]) => {
                const count = dateStats?.[key]
                if (!count) return null
                return (
                  <span key={key} className={cn('flex items-center gap-1', cfg.text)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot, cfg.pulse && 'animate-pulse')} />
                    <span className="text-[9px] font-mono-code font-bold tabular-nums">{count}</span>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── WIDE MODE (tab) ──
  return (
    <div className="mb-5 rounded-xl border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors">
      <div className="flex items-stretch">
        {/* Left: Hero percentage */}
        <div className="flex items-center gap-2.5 px-5 py-3 shrink-0">
          <div className="flex items-baseline gap-px">
            <span className="text-[34px] font-black font-mono-code tracking-[-0.05em] leading-none">
              {pct}
            </span>
            <span className="text-xs font-bold text-muted-foreground/30">%</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[7px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/30 leading-none">
              ilerleme
            </span>
            <span className="text-[10px] font-mono-code text-muted-foreground/20 tabular-nums leading-none">
              {total} görev
            </span>
          </div>
        </div>

        {/* Gradient divider */}
        <div className="w-px self-stretch my-2.5 bg-gradient-to-b from-transparent via-border/25 to-transparent shrink-0" />

        {/* Center: Status meters */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 px-5 py-2.5 min-w-0">
          {statusBreakdowns.map((col, i) => (
            <MeterRow key={col.key} col={col} delay={i * 40} />
          ))}
        </div>

        {/* Right: Date indicators */}
        {hasDateInfo && (
          <>
            <div className="w-px self-stretch my-2.5 bg-gradient-to-b from-transparent via-border/25 to-transparent shrink-0" />
            <div className="flex flex-col justify-center gap-1.5 px-4 py-2.5 shrink-0">
              {Object.entries(DATE_CFG).map(([key, cfg]) => {
                const count = dateStats?.[key]
                if (!count) return null
                const Icon = cfg.icon
                return (
                  <div key={key} className={cn('flex items-center gap-1.5', cfg.text)}>
                    <Icon className={cn('w-3 h-3 shrink-0', cfg.pulse && 'animate-pulse')} />
                    <span className="text-[10px] font-mono-code font-bold tabular-nums">{count}</span>
                    <span className="text-[9px] font-medium opacity-50">{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Inline Meter Row ──
function MeterRow({ col, delay = 0 }) {
  const { done, inProgress, notDone } = col.breakdown
  const effective = done + inProgress + notDone

  return (
    <div
      className="flex items-center gap-2.5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/45 w-16 truncate shrink-0">
        {col.label}
      </span>

      <div className="flex-1 h-[5px] rounded-sm bg-muted/25 overflow-hidden flex">
        {effective > 0 ? (
          <>
            {done > 0 && (
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-700"
                style={{ width: `${(done / effective) * 100}%` }}
              />
            )}
            {inProgress > 0 && (
              <div
                className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-700"
                style={{ width: `${(inProgress / effective) * 100}%` }}
              />
            )}
            {notDone > 0 && (
              <div
                className="h-full bg-red-500/30 dark:bg-red-400/30 transition-all duration-700"
                style={{ width: `${(notDone / effective) * 100}%` }}
              />
            )}
          </>
        ) : null}
      </div>

      <div className="shrink-0 tabular-nums">
        <span className="text-[10px] font-mono-code font-bold text-foreground/60">{done}</span>
        <span className="text-[10px] font-mono-code text-muted-foreground/15 mx-px">/</span>
        <span className="text-[10px] font-mono-code text-muted-foreground/30">{effective}</span>
      </div>
    </div>
  )
}
