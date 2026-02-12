import { useState, useCallback, useRef } from 'react'

export function useContainerWidth(threshold = 350) {
  const [isCompact, setIsCompact] = useState(false)
  const observerRef = useRef(null)

  const containerRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (node) {
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          setIsCompact(entry.contentRect.width < threshold)
        }
      })
      observer.observe(node)
      observerRef.current = observer
    }
  }, [threshold])

  return [containerRef, isCompact]
}

export function parseDate(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === '') return null
  const match = dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
  if (!match) return null
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}
