import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// PRD referans formatini parse eder
// "README.md:5-10#a1b2c3" → { filename: "README.md", start: 5, end: 10, hash: "a1b2c3" }
// "5-10"                  → { filename: "PRD.md", start: 5, end: 10, hash: null }
// "docs/spec.md:12"       → { filename: "docs/spec.md", start: 12, end: 12, hash: null }
export function parsePrdRef(ref) {
  if (!ref) return null

  // Hash suffix'i ayir
  let hash = null
  let base = ref
  const hashIdx = ref.lastIndexOf('#')
  if (hashIdx > 0) {
    const candidate = ref.slice(hashIdx + 1)
    if (/^[a-z0-9]+$/.test(candidate)) {
      hash = candidate
      base = ref.slice(0, hashIdx)
    }
  }

  const colonIdx = base.lastIndexOf(':')
  let filename = 'PRD.md'
  let range = base

  if (colonIdx > 0) {
    const beforeColon = base.slice(0, colonIdx)
    const afterColon = base.slice(colonIdx + 1)
    // Eger colon sonrasi sayi ile basliyorsa dosya:satir formati
    if (/^\d/.test(afterColon)) {
      filename = beforeColon
      range = afterColon
    }
  }

  const parts = range.split('-').map(Number).filter(n => !isNaN(n))
  const start = parts[0] || 1
  const end = parts[1] || start

  return { filename, start, end, hash }
}

// PRD referans stringi olusturur
// ("PRD.md", 5, 10)               → "5-10"              (legacy format korunur)
// ("README.md", 5, 10, "a1b2c3")  → "README.md:5-10#a1b2c3"
// ("PRD.md", 5, 10, "a1b2c3")     → "5-10#a1b2c3"
export function buildPrdRef(filename, start, end, hash) {
  const range = start === end ? `${start}` : `${start}-${end}`
  let result = filename === 'PRD.md' ? range : `${filename}:${range}`
  if (hash) result += `#${hash}`
  return result
}

// Icerik parmak izi hesaplar (djb2 algoritmasi)
// Ilk satir + son satir + satir sayisi hash'lenir, 6 karakter doner
export function computePrdHash(content) {
  if (!content) return null
  const lines = content.split('\n')
  const first = lines[0] || ''
  const last = lines[lines.length - 1] || ''
  const input = `${first}|${last}|${lines.length}`

  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36).slice(0, 6)
}
