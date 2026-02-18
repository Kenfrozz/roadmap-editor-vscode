export const STATUS_OPTIONS = [
  { value: '✅', label: 'Tamamlandi', color: 'bg-emerald-500', textColor: 'text-emerald-500', ring: 'ring-emerald-500/30', icon: 'Check' },
  { value: '⚠️', label: 'Devam Ediyor', color: 'bg-amber-500', textColor: 'text-amber-500', ring: 'ring-amber-500/30', icon: 'Clock' },
  { value: '❌', label: 'Yapilmadi', color: 'bg-red-500', textColor: 'text-red-500', ring: 'ring-red-500/30', icon: 'X' },
  { value: '-', label: 'N/A', color: 'bg-slate-300 dark:bg-slate-600', textColor: 'text-slate-400', ring: 'ring-slate-300/50 dark:ring-slate-600/50', icon: 'Minus' },
]

export const FAZ_COLORS = [
  { color: 'border-l-teal-300/50 dark:border-l-teal-700/50', bg: 'bg-teal-500', text: 'text-teal-700/70 dark:text-teal-400/70', dim: 'bg-teal-500/10', tag: 'bg-teal-500/15 text-teal-700/70 dark:text-teal-300/70' },
  { color: 'border-l-violet-300/50 dark:border-l-violet-700/50', bg: 'bg-violet-500', text: 'text-violet-700/70 dark:text-violet-400/70', dim: 'bg-violet-500/10', tag: 'bg-violet-500/15 text-violet-700/70 dark:text-violet-300/70' },
  { color: 'border-l-rose-300/50 dark:border-l-rose-700/50', bg: 'bg-rose-500', text: 'text-rose-700/70 dark:text-rose-400/70', dim: 'bg-rose-500/10', tag: 'bg-rose-500/15 text-rose-700/70 dark:text-rose-300/70' },
  { color: 'border-l-amber-300/50 dark:border-l-amber-700/50', bg: 'bg-amber-500', text: 'text-amber-700/70 dark:text-amber-400/70', dim: 'bg-amber-500/10', tag: 'bg-amber-500/15 text-amber-700/70 dark:text-amber-300/70' },
  { color: 'border-l-emerald-300/50 dark:border-l-emerald-700/50', bg: 'bg-emerald-500', text: 'text-emerald-700/70 dark:text-emerald-400/70', dim: 'bg-emerald-500/10', tag: 'bg-emerald-500/15 text-emerald-700/70 dark:text-emerald-300/70' },
  { color: 'border-l-cyan-300/50 dark:border-l-cyan-700/50', bg: 'bg-cyan-500', text: 'text-cyan-700/70 dark:text-cyan-400/70', dim: 'bg-cyan-500/10', tag: 'bg-cyan-500/15 text-cyan-700/70 dark:text-cyan-300/70' },
  { color: 'border-l-pink-300/50 dark:border-l-pink-700/50', bg: 'bg-pink-500', text: 'text-pink-700/70 dark:text-pink-400/70', dim: 'bg-pink-500/10', tag: 'bg-pink-500/15 text-pink-700/70 dark:text-pink-300/70' },
  { color: 'border-l-indigo-300/50 dark:border-l-indigo-700/50', bg: 'bg-indigo-500', text: 'text-indigo-700/70 dark:text-indigo-400/70', dim: 'bg-indigo-500/10', tag: 'bg-indigo-500/15 text-indigo-700/70 dark:text-indigo-300/70' },
]

export const DEFAULT_COLUMNS = [
  { key: 'ozellik', label: 'Özellik', type: 'text' },
  { key: 'prd', label: 'PRD', type: 'text' },
  { key: 'backend', label: 'Backend', type: 'status' },
  { key: 'frontend', label: 'Frontend', type: 'status' },
  { key: 'test', label: 'Test', type: 'status' },
  { key: 'tarih', label: 'Tarih', type: 'date' },
  { key: 'not', label: 'Not', type: 'text' },
]

export const DEFAULT_GOREV_TURLERI = [
  { key: 'gelistirme', label: 'Gelistirme', color: 'emerald', icon: 'Code2' },
  { key: 'hata', label: 'Hata', color: 'red', icon: 'Bug' },
  { key: 'iyilestirme', label: 'Iyilestirme', color: 'violet', icon: 'Sparkles' },
  { key: 'arastirma', label: 'Arastirma', color: 'cyan', icon: 'Search' },
  { key: 'tasarim', label: 'Tasarim', color: 'pink', icon: 'Palette' },
  { key: 'test', label: 'Test', color: 'amber', icon: 'FlaskConical' },
  { key: 'diger', label: 'Diger', color: 'slate', icon: 'Circle' },
]

export const GOREV_TURU_ICON_OPTIONS = [
  'Code2', 'Bug', 'Sparkles', 'Search', 'Palette', 'FlaskConical',
  'Circle', 'Wrench', 'BookOpen', 'MessageSquare', 'Shield',
  'Zap', 'Globe', 'Database', 'Layout', 'Package',
]

export const GOREV_TURU_COLORS = {
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  red: { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500' },
  pink: { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400', dot: 'bg-pink-500' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  slate: { bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500' },
}

export const DEFAULT_FAZ_CONFIG = {
  faz1: { name: 'PLANLAMA & ALTYAPI', ...FAZ_COLORS[0] },
  faz2: { name: 'TEMEL GELİŞTİRME', ...FAZ_COLORS[1] },
  faz3: { name: 'İLERİ ÖZELLİKLER', ...FAZ_COLORS[2] },
  faz4: { name: 'TEST & YAYIN', ...FAZ_COLORS[3] },
}
