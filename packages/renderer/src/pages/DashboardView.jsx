import { useMemo } from 'react'
import { startOfDay, addDays, isBefore } from 'date-fns'
import { cn } from '../lib/utils'
import { parseDate } from '../lib/hooks'
import { DashboardEmptyState } from '../components/DashboardEmptyState'
import { DashboardSummaryCards } from '../components/DashboardSummaryCards'
import { DashboardProgressOverview } from '../components/DashboardProgressOverview'
import { DashboardPhaseCards } from '../components/DashboardPhaseCards'
import { DashboardUpcoming } from '../components/DashboardUpcoming'
import { DashboardTaskTypes } from '../components/DashboardTaskTypes'

export function DashboardView({
  overallPct,
  fazProgress,
  dateDist,
  total,
  done,
  isCompact,
  data,
  fazConfig,
  fazOrder,
  columns,
  gorevTurleri,
  allRootItems,
  statusBreakdowns,
  dateStats,
  statusColumns,
  dateColumn,
  isWide,
  onNavigate,
}) {
  // Devam eden gorevler
  const inProgressCount = useMemo(() => {
    if (!statusBreakdowns || statusBreakdowns.length === 0) return 0
    return statusBreakdowns[0].breakdown.inProgress
  }, [statusBreakdowns])

  // Geciken gorevler
  const overdueItems = useMemo(() => {
    if (!dateColumn || !statusColumns?.length) return []
    const today = startOfDay(new Date())
    const result = []

    for (const fazKey of (fazOrder || [])) {
      const items = data[fazKey]
      if (!Array.isArray(items)) continue
      for (const item of items) {
        const d = parseDate(item[dateColumn.key])
        if (!d) continue
        const date = startOfDay(d)
        const allDone = statusColumns.every(sc => item[sc.key] === '\u2705')
        if (isBefore(date, today) && !allDone) {
          result.push({ item, fazKey })
        }
      }
    }

    result.sort((a, b) => {
      const da = parseDate(a.item[dateColumn.key])
      const db = parseDate(b.item[dateColumn.key])
      return (da?.getTime() || 0) - (db?.getTime() || 0)
    })

    return result
  }, [data, fazOrder, dateColumn, statusColumns])

  // Yaklasan gorevler (bugun + 14 gun icinde)
  const upcomingItems = useMemo(() => {
    if (!dateColumn || !statusColumns?.length) return []
    const today = startOfDay(new Date())
    const horizon = addDays(today, 14)
    const result = []

    for (const fazKey of (fazOrder || [])) {
      const items = data[fazKey]
      if (!Array.isArray(items)) continue
      for (const item of items) {
        const d = parseDate(item[dateColumn.key])
        if (!d) continue
        const date = startOfDay(d)
        const allDone = statusColumns.every(sc => item[sc.key] === '\u2705')
        if (!allDone && !isBefore(date, today) && isBefore(date, horizon)) {
          result.push({ item, fazKey })
        }
      }
    }

    result.sort((a, b) => {
      const da = parseDate(a.item[dateColumn.key])
      const db = parseDate(b.item[dateColumn.key])
      return (da?.getTime() || 0) - (db?.getTime() || 0)
    })

    return result
  }, [data, fazOrder, dateColumn, statusColumns])

  // Gorev turu dagilimi
  const taskTypeDistribution = useMemo(() => {
    if (!gorevTurleri?.length || !allRootItems?.length) return []
    const counts = {}
    for (const item of allRootItems) {
      const tur = item.tur
      if (tur) counts[tur] = (counts[tur] || 0) + 1
    }

    return gorevTurleri
      .filter(t => (counts[t.key] || 0) > 0)
      .map(t => ({
        key: t.key,
        label: t.label,
        color: t.color,
        icon: t.icon,
        count: counts[t.key] || 0,
      }))
  }, [allRootItems, gorevTurleri])

  // Bos durum
  if (total === 0) {
    return (
      <main className="flex-1 overflow-auto p-4">
        <DashboardEmptyState onNavigate={onNavigate} />
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-auto p-4">
      <div className={cn(
        'flex flex-col gap-4 mx-auto w-full',
        isWide ? 'max-w-5xl' : 'max-w-2xl',
      )}>
        {/* Ozet kartlari */}
        <DashboardSummaryCards
          total={total}
          done={done}
          inProgress={inProgressCount}
          overdue={overdueItems.length}
          isCompact={isCompact}
        />

        {/* Ilerleme genel bakis */}
        {fazProgress?.length > 0 && (
          <DashboardProgressOverview
            overallPct={overallPct}
            fazProgress={fazProgress}
            dateDist={dateDist}
            total={total}
            done={done}
            isCompact={isCompact}
            isWide={isWide}
          />
        )}

        {/* Faz kartlari */}
        {fazProgress?.length > 0 && (
          <DashboardPhaseCards
            fazProgress={fazProgress}
            fazConfig={fazConfig}
            data={data}
            statusColumns={statusColumns}
            isCompact={isCompact}
          />
        )}

        {/* Geciken ve yaklasan */}
        <DashboardUpcoming
          overdueItems={overdueItems}
          upcomingItems={upcomingItems}
          dateColumn={dateColumn}
          fazConfig={fazConfig}
          data={data}
          fazOrder={fazOrder}
          isCompact={isCompact}
        />

        {/* Gorev turleri */}
        <DashboardTaskTypes
          distribution={taskTypeDistribution}
          total={total}
          isCompact={isCompact}
        />
      </div>
    </main>
  )
}
