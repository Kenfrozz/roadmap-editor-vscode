import { startOfWeek, endOfWeek, isBefore, isAfter, isWithinInterval, startOfDay, addWeeks, differenceInCalendarDays, addDays } from 'date-fns'
import { parseDate } from './hooks'

export function computeStatusBreakdown(items, columnKey) {
  let done = 0, inProgress = 0, notDone = 0, na = 0
  for (const item of items) {
    const val = item[columnKey]
    if (val === '\u2705') done++
    else if (val === '\u26A0\uFE0F') inProgress++
    else if (val === '\u274C') notDone++
    else na++
  }
  return { done, inProgress, notDone, na, total: items.length }
}

export function computeDateStats(items, dateKey, statusColumnKeys) {
  let overdue = 0, thisWeek = 0, upcoming = 0, noDate = 0
  const today = startOfDay(new Date())
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

  for (const item of items) {
    const date = parseDate(item[dateKey])
    if (!date) {
      noDate++
      continue
    }

    const d = startOfDay(date)
    const allDone = statusColumnKeys.every(key => item[key] === '\u2705')

    // Completed past dates don't fall into any bucket
    if (isBefore(d, today) && allDone) continue

    if (isBefore(d, today)) {
      overdue++
    } else if (isWithinInterval(d, { start: weekStart, end: weekEnd })) {
      thisWeek++
    } else if (isAfter(d, weekEnd)) {
      upcoming++
    }
  }

  return { overdue, thisWeek, upcoming, noDate, total: items.length }
}

export function computeDateDistribution(items, dateKey, statusColumnKeys) {
  const today = startOfDay(new Date())

  // Collect all dated tasks
  const dated = []
  for (const item of items) {
    const date = parseDate(item[dateKey])
    if (!date) continue
    const d = startOfDay(date)
    const allDone = statusColumnKeys.every(key => item[key] === '\u2705')
    dated.push({ date: d, done: allDone })
  }

  if (dated.length === 0) return null

  // Sort and find range
  dated.sort((a, b) => a.date.getTime() - b.date.getTime())
  const minDate = dated[0].date
  const maxDate = dated[dated.length - 1].date
  const rangeDays = differenceInCalendarDays(maxDate, minDate) || 1

  // Determine bin count: 1 per day up to 12, then group
  const binCount = Math.max(1, Math.min(12, rangeDays))
  const binWidth = rangeDays / binCount

  const fmt = d => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`

  // Create bins
  const bins = []
  for (let i = 0; i < binCount; i++) {
    const s = addDays(minDate, Math.round(i * binWidth))
    const e = i < binCount - 1 ? addDays(minDate, Math.round((i + 1) * binWidth) - 1) : maxDate
    bins.push({
      count: 0,
      done: 0,
      overdue: 0,
      isCurrent: !isBefore(today, s) && !isAfter(today, e),
      isPast: isBefore(e, today),
      label: fmt(s),
    })
  }

  // Fill bins
  for (const { date, done } of dated) {
    const offset = differenceInCalendarDays(date, minDate)
    const idx = Math.min(Math.floor(offset / binWidth), binCount - 1)
    bins[idx].count++
    if (done) bins[idx].done++
    if (isBefore(date, today) && !done) bins[idx].overdue++
  }

  // Today position as 0-1 ratio across the range
  const todayOffset = differenceInCalendarDays(today, minDate)

  return {
    bins,
    todayPct: todayOffset / rangeDays,
    startLabel: fmt(minDate),
    endLabel: fmt(maxDate),
  }
}
