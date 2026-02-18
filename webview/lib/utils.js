import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// PRD referans formatini parse eder
// "README.md:5-10" → { filename: "README.md", start: 5, end: 10 }
// "5-10"           → { filename: "PRD.md", start: 5, end: 10 }
// "docs/spec.md:12"→ { filename: "docs/spec.md", start: 12, end: 12 }
export function parsePrdRef(ref) {
  if (!ref) return null
  const colonIdx = ref.lastIndexOf(':')
  let filename = 'PRD.md'
  let range = ref

  if (colonIdx > 0) {
    const beforeColon = ref.slice(0, colonIdx)
    const afterColon = ref.slice(colonIdx + 1)
    // Eger colon sonrasi sayi ile basliyorsa dosya:satir formati
    if (/^\d/.test(afterColon)) {
      filename = beforeColon
      range = afterColon
    }
  }

  const parts = range.split('-').map(Number).filter(n => !isNaN(n))
  const start = parts[0] || 1
  const end = parts[1] || start

  return { filename, start, end }
}

// PRD referans stringi olusturur
// ("PRD.md", 5, 10)      → "5-10"        (legacy format korunur)
// ("README.md", 5, 10)   → "README.md:5-10"
export function buildPrdRef(filename, start, end) {
  const range = start === end ? `${start}` : `${start}-${end}`
  if (filename === 'PRD.md') return range
  return `${filename}:${range}`
}
