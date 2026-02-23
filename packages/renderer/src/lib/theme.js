import { useState, useEffect } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined' && window.kairos?.isDarkMode) {
      return window.kairos.isDarkMode()
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    const root = document.documentElement

    function applyTheme(isDark) {
      setDark(isDark)
      if (isDark) root.classList.add('dark')
      else root.classList.remove('dark')
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(mq.matches)

    const handler = (e) => applyTheme(e.matches)
    mq.addEventListener('change', handler)

    // Electron tema degisiklik callback'i
    let electronCleanup
    if (window.kairos?.onThemeChange) {
      electronCleanup = window.kairos.onThemeChange((isDark) => applyTheme(isDark))
    }

    return () => {
      mq.removeEventListener('change', handler)
      if (electronCleanup) electronCleanup()
    }
  }, [])

  return dark
}
