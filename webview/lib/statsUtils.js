import { startOfWeek, endOfWeek, isBefore, isAfter, isWithinInterval, startOfDay } from 'date-fns'
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
