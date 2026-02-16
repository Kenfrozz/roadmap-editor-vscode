import { useMemo } from 'react'
import { cn } from '../lib/utils'
import { CalendarDays, TrendingUp, AlertTriangle } from 'lucide-react'

// ── SVG Radial Gauge ──
function RadialGauge({ percentage, size = 96, strokeWidth = 7 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const center = size / 2

  // Color stops based on percentage
  const gaugeColor = percentage >= 80
    ? 'var(--gauge-high)'
    : percentage >= 40
      ? 'var(--gauge-mid)'
      : 'var(--gauge-low)'

  return (
    <div className="stats-gauge-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="stats-gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gaugeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={gaugeColor} stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity="0.6"
        />

        {/* Tick marks */}
        {[...Array(24)].map((_, i) => {
          const angle = (i * 360) / 24 - 90
          const rad = (angle * Math.PI) / 180
          const isMajor = i % 6 === 0
          const r1 = radius - (isMajor ? 5 : 3)
          const r2 = radius + (isMajor ? 5 : 3)
          return (
            <line
              key={i}
              x1={center + r1 * Math.cos(rad)}
              y1={center + r1 * Math.sin(rad)}
              x2={center + r2 * Math.cos(rad)}
              y2={center + r2 * Math.sin(rad)}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={isMajor ? 1.2 : 0.5}
              opacity={isMajor ? 0.3 : 0.15}
            />
          )
        })}

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="stats-gauge-arc"
        />
      </svg>

      {/* Center text */}
      <div className="stats-gauge-center">
        <span className="stats-gauge-pct font-mono-code">{percentage}</span>
        <span className="stats-gauge-unit font-mono-code">%</span>
      </div>
    </div>
  )
}

// ── Segmented Meter Bar ──
function MeterBar({ label, breakdown, delay = 0 }) {
  const { done, inProgress, notDone, na } = breakdown
  const effective = done + inProgress + notDone
  const donePct = effective > 0 ? (done / effective) * 100 : 0
  const inProgressPct = effective > 0 ? (inProgress / effective) * 100 : 0
  const notDonePct = effective > 0 ? (notDone / effective) * 100 : 0

  return (
    <div
      className="stats-meter animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stats-meter-header">
        <span className="stats-meter-label">{label}</span>
        <span className="stats-meter-count font-mono-code">
          {done}<span className="stats-meter-sep">/</span>{effective}
        </span>
      </div>

      <div className="stats-meter-track">
        {effective > 0 ? (
          <>
            {donePct > 0 && (
              <div
                className="stats-meter-fill stats-meter-done"
                style={{ width: `${donePct}%` }}
              />
            )}
            {inProgressPct > 0 && (
              <div
                className="stats-meter-fill stats-meter-wip"
                style={{ width: `${inProgressPct}%` }}
              />
            )}
            {notDonePct > 0 && (
              <div
                className="stats-meter-fill stats-meter-fail"
                style={{ width: `${notDonePct}%` }}
              />
            )}
          </>
        ) : (
          <div className="stats-meter-fill stats-meter-empty" style={{ width: '100%' }} />
        )}
      </div>

      {/* Mini legend */}
      <div className="stats-meter-legend">
        {done > 0 && (
          <span className="stats-legend-item stats-legend-done">
            <span className="stats-legend-dot" />
            {done}
          </span>
        )}
        {inProgress > 0 && (
          <span className="stats-legend-item stats-legend-wip">
            <span className="stats-legend-dot" />
            {inProgress}
          </span>
        )}
        {notDone > 0 && (
          <span className="stats-legend-item stats-legend-fail">
            <span className="stats-legend-dot" />
            {notDone}
          </span>
        )}
        {na > 0 && (
          <span className="stats-legend-item stats-legend-na">
            <span className="stats-legend-dot" />
            {na}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Date Badge Strip ──
const DATE_ROWS = [
  { key: 'overdue', label: 'Gecikmiş', cls: 'stats-date-overdue', icon: AlertTriangle },
  { key: 'thisWeek', label: 'Bu Hafta', cls: 'stats-date-week', icon: TrendingUp },
  { key: 'upcoming', label: 'Yaklaşan', cls: 'stats-date-upcoming', icon: CalendarDays },
  { key: 'noDate', label: 'Tarihi Yok', cls: 'stats-date-nodate', icon: null },
]

function DateStrip({ dateStats, delay = 0 }) {
  const hasOverdue = dateStats.overdue > 0

  return (
    <div
      className="stats-date-strip animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {DATE_ROWS.map(row => {
        const count = dateStats[row.key]
        if (count === 0) return null
        const Icon = row.icon
        return (
          <div
            key={row.key}
            className={cn('stats-date-badge', row.cls, row.key === 'overdue' && hasOverdue && 'stats-date-pulse')}
          >
            {Icon && <Icon className="stats-date-icon" />}
            <span className="stats-date-count font-mono-code">{count}</span>
            <span className="stats-date-label">{row.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Panel ──
export function StatsPanel({ overallPct, statusBreakdowns, dateStats, total, isCompact }) {
  if (total === 0 || (statusBreakdowns.length === 0 && !dateStats)) return null

  return (
    <div className={cn('stats-panel', isCompact && 'stats-panel-compact')}>

      <div className={cn('stats-body', isCompact && 'stats-body-compact')}>
        {/* Gauge section */}
        <div className="stats-gauge-section animate-fade-up" style={{ animationDelay: '0ms' }}>
          <RadialGauge
            percentage={overallPct}
            size={isCompact ? 72 : 96}
            strokeWidth={isCompact ? 5 : 7}
          />
          <span className="stats-gauge-label font-mono-code">GENEL İLERLEME</span>
        </div>

        {/* Divider */}
        {!isCompact && <div className="stats-divider" />}

        {/* Meters section */}
        <div className={cn('stats-meters', isCompact && 'stats-meters-compact')}>
          {statusBreakdowns.map((col, i) => (
            <MeterBar
              key={col.key}
              label={col.label}
              breakdown={col.breakdown}
              delay={80 + i * 60}
            />
          ))}
        </div>
      </div>

      {/* Date strip */}
      {dateStats && (
        <>
          <div className="stats-strip-border" />
          <DateStrip
            dateStats={dateStats}
            delay={80 + statusBreakdowns.length * 60 + 40}
          />
        </>
      )}
    </div>
  )
}
