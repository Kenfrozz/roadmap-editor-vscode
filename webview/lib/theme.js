import { useState, useEffect } from 'react'

// Hex/RGB rengi HSL degerine donustur
export function cssColorToHSL(color) {
  if (!color) return null
  let r, g, b
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    }
  } else if (color.startsWith('rgb')) {
    const m = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (!m) return null
    r = parseInt(m[1]); g = parseInt(m[2]); b = parseInt(m[3])
  } else return null
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export const VS_CODE_MAP = [
  ['--vscode-editor-background', '--background'],
  ['--vscode-editor-foreground', '--foreground'],
  ['--vscode-editorWidget-background', '--card'],
  ['--vscode-editor-foreground', '--card-foreground'],
  ['--vscode-editorWidget-background', '--popover'],
  ['--vscode-editor-foreground', '--popover-foreground'],
  ['--vscode-button-background', '--primary'],
  ['--vscode-button-foreground', '--primary-foreground'],
  ['--vscode-input-background', '--secondary'],
  ['--vscode-editor-foreground', '--secondary-foreground'],
  ['--vscode-sideBar-background', '--muted'],
  ['--vscode-descriptionForeground', '--muted-foreground'],
  ['--vscode-list-hoverBackground', '--accent'],
  ['--vscode-button-background', '--accent-foreground'],
  ['--vscode-errorForeground', '--destructive'],
  ['--vscode-button-foreground', '--destructive-foreground'],
  ['--vscode-editorWidget-border', '--border'],
  ['--vscode-input-border', '--input'],
  ['--vscode-focusBorder', '--ring'],
  ['--vscode-sideBar-background', '--grid-color'],
]

export function useTheme() {
  const [dark, setDark] = useState(() => {
    return document.body.classList.contains('vscode-dark') ||
           document.body.classList.contains('vscode-high-contrast')
  })

  useEffect(() => {
    function syncTheme() {
      const isDark = document.body.classList.contains('vscode-dark') ||
                     document.body.classList.contains('vscode-high-contrast')
      setDark(isDark)

      const root = document.documentElement
      if (isDark) root.classList.add('dark')
      else root.classList.remove('dark')

      const cs = getComputedStyle(document.body)
      for (const [vsVar, ourVar] of VS_CODE_MAP) {
        const val = cs.getPropertyValue(vsVar).trim()
        const hsl = cssColorToHSL(val)
        if (hsl) root.style.setProperty(ourVar, hsl)
      }
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return dark
}
