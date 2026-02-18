import { useState, useEffect, useRef } from 'react'
import { cn } from '../lib/utils'

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

// ── Circular Progress Ring ──
function ProgressRing({ size = 70, strokeWidth = 4, pct, done, total }) {
  const animPct = useAnimatedValue(pct)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - animPct / 100)

  const [c1, c2] = pct >= 75
    ? ['rgb(16,185,129)', 'rgb(52,211,153)']
    : pct >= 35
      ? ['rgb(245,158,11)', 'rgb(251,191,36)']
      : ['rgb(239,68,68)', 'rgb(248,113,113)']

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c1} stopOpacity={0.85} />
              <stop offset="100%" stopColor={c2} stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" className="stroke-muted/10" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="url(#ring-grad)"
            className="transition-all duration-700"
            strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-baseline gap-0.5">
            <span className={cn('font-black font-mono-code tracking-tight leading-none', size >= 70 ? 'text-xl' : size >= 50 ? 'text-lg' : 'text-base')}>
              {animPct}
            </span>
            <span className="text-[8px] font-bold text-muted-foreground/25">%</span>
          </div>
        </div>
      </div>
      <div className="tabular-nums text-center">
        <span className="text-[10px] font-mono-code font-bold text-foreground/55">{done}</span>
        <span className="text-[10px] font-mono-code text-muted-foreground/15 mx-px">/</span>
        <span className="text-[10px] font-mono-code text-muted-foreground/30">{total}</span>
      </div>
    </div>
  )
}

// ── Phase Progress Bars ──
function PhaseProgress({ phases, isCompact }) {
  return (
    <div className={cn('flex flex-col justify-center w-full', isCompact ? 'gap-1.5' : 'gap-2')}>
      {phases.map((faz, i) => {
        const complete = faz.pct === 100
        const active = faz.pct > 0 && faz.pct < 100

        return (
          <div key={faz.key} className="flex items-center gap-2">
            {/* Phase number */}
            <span className={cn(
              'font-mono-code tabular-nums leading-none shrink-0',
              isCompact ? 'text-[7px]' : 'text-[8px]',
              complete ? 'text-emerald-500/50 dark:text-emerald-400/40 font-bold' :
              active ? 'text-foreground/40 font-bold' :
              'text-muted-foreground/15',
            )}>
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Phase name (wide only) */}
            {!isCompact && (
              <span
                className={cn(
                  'text-[8px] font-mono-code leading-none truncate shrink-0',
                  complete ? 'text-emerald-500/40 dark:text-emerald-400/35' :
                  active ? 'text-foreground/30' :
                  'text-muted-foreground/12',
                )}
                style={{ width: 72 }}
                title={faz.name}
              >
                {faz.name}
              </span>
            )}

            {/* Progress bar */}
            <div className={cn(
              'flex-1 rounded-full overflow-hidden',
              isCompact ? 'h-[3px]' : 'h-1',
              'bg-muted/8',
            )}>
              {faz.pct > 0 && (
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    complete ? 'bg-emerald-500/45 dark:bg-emerald-400/35' :
                    'bg-primary/40',
                  )}
                  style={{ width: `${faz.pct}%` }}
                />
              )}
            </div>

            {/* Done / Total */}
            <div className={cn(
              'font-mono-code tabular-nums leading-none shrink-0 text-right',
              isCompact ? 'text-[7px]' : 'text-[8px]',
            )}>
              <span className={cn(
                'font-bold',
                complete ? 'text-emerald-500/50 dark:text-emerald-400/40' :
                active ? 'text-foreground/40' :
                'text-muted-foreground/12',
              )}>
                {faz.done}
              </span>
              <span className="text-muted-foreground/10 mx-px">/</span>
              <span className="text-muted-foreground/18">{faz.total}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Smooth curve (Catmull-Rom) ──
function smoothCurve(pts) {
  if (pts.length < 2) return `M${pts[0]?.x ?? 0},${pts[0]?.y ?? 100}`
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`
  }
  return d
}

// ── Date Timeline Chart (Area Sparkline) ──
function DateChart({ data, isCompact }) {
  if (!data) return null
  const { bins, todayPct, startLabel, endLabel } = data
  const maxCount = Math.max(...bins.map(b => b.count), 1)
  const chartH = isCompact ? 22 : 30
  const todayShow = todayPct >= 0 && todayPct <= 1

  if (bins.length < 2) return null

  // Data points in viewBox coords (0-100)
  const dataPts = bins.map((b, i) => ({
    x: ((i + 0.5) / bins.length) * 100,
    y: 100 - (b.count / maxCount) * 75,
  }))

  // Extend to edges for full-width coverage
  const pts = [
    { x: 0, y: dataPts[0].y },
    ...dataPts,
    { x: 100, y: dataPts[dataPts.length - 1].y },
  ]

  const curve = smoothCurve(pts)
  const curveBody = curve.substring(curve.indexOf(' ') + 1)
  const area = `M0,100 L0,${pts[0].y} ${curveBody} L100,100 Z`

  return (
    <div className="flex flex-col w-full">
      <div className="relative" style={{ height: chartH }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="tl-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={area} fill="url(#tl-area)" />

          {/* Curve line */}
          <path
            d={curve}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeOpacity={0.45}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Today marker */}
          {todayShow && (
            <line
              x1={todayPct * 100} y1={0}
              x2={todayPct * 100} y2={100}
              stroke="hsl(var(--foreground))"
              strokeOpacity={0.18}
              strokeWidth={1}
              strokeDasharray="3 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Today dot */}
        {todayShow && (
          <div
            className="absolute -bottom-[2px] w-1 h-1 rounded-full bg-foreground/30 -translate-x-1/2"
            style={{ left: `${todayPct * 100}%` }}
          />
        )}
      </div>

      {/* Date labels */}
      <div className="relative flex justify-between mt-1">
        <span className={cn(
          'font-mono-code tabular-nums leading-none text-muted-foreground/30',
          isCompact ? 'text-[6px]' : 'text-[7px]',
        )}>
          {startLabel}
        </span>
        {todayShow && (
          <span
            className={cn(
              'absolute font-mono-code leading-none text-foreground/30 font-medium',
              isCompact ? 'text-[6px]' : 'text-[7px]',
            )}
            style={{ left: `${todayPct * 100}%`, transform: 'translateX(-50%)' }}
          >
            bugün
          </span>
        )}
        <span className={cn(
          'font-mono-code tabular-nums leading-none text-muted-foreground/30',
          isCompact ? 'text-[6px]' : 'text-[7px]',
        )}>
          {endLabel}
        </span>
      </div>
    </div>
  )
}

// ── Main Panel ──
export function StatsPanel({ overallPct, fazProgress, dateDist, total, done, isCompact }) {
  if (total === 0 || !fazProgress?.length) return null

  const hasDateData = dateDist && dateDist.bins?.some(b => b.count > 0)

  // ── COMPACT MODE ──
  if (isCompact) {
    return (
      <div className="mb-4 rounded-lg border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors">
        <div className="p-3 flex flex-col gap-3">
          {/* Top: Ring + Phase bars */}
          <div className="flex items-center gap-3">
            <ProgressRing size={48} strokeWidth={3} pct={overallPct} done={done} total={total} />
            <div className="flex-1 min-w-0">
              <PhaseProgress phases={fazProgress} isCompact />
            </div>
          </div>

          {/* Bottom: Date chart */}
          {hasDateData && (
            <div className="pt-2 border-t border-border/15">
              <DateChart data={dateDist} isCompact />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── WIDE MODE ──
  return (
    <div className="mb-5 rounded-xl border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors">
      {/* Top row: Ring + Phase bars */}
      <div className="flex items-stretch">
        <div className="flex items-center justify-center px-5 py-3 shrink-0">
          <ProgressRing size={74} strokeWidth={4} pct={overallPct} done={done} total={total} />
        </div>
        <div className="w-px self-stretch my-2.5 bg-gradient-to-b from-transparent via-border/20 to-transparent shrink-0" />
        <div className="flex-1 flex items-center px-5 py-3 min-w-0">
          <PhaseProgress phases={fazProgress} />
        </div>
      </div>

      {/* Bottom row: Date timeline */}
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
