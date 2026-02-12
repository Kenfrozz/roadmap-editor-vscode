import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { marked } from 'marked'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Trash2,
  Plus,
  Eye,
  Save,
  Cloud,
  Check,
  X,
  PlusCircle,
  Pencil,
  Loader2,
  ChevronDown,
  ChevronRight,
  Activity,
  Monitor,
  Server,
  TestTube,
  Hash,
  Terminal,
  RefreshCw,
  Search,
  MoreVertical,
  Menu,
  Play,
  Package,
  Sparkles,
  Stethoscope,
  FileCode,
  RotateCcw,
  Smartphone,
  Globe,
  Boxes,
  Zap,
  Wrench,
  Bug,
  Cpu,
  Container,
  FolderOpen,
  GitBranch,
  Rocket,
  Gauge,
  ScrollText,
  Shield,
  Cog,
  ArrowLeft,
  AlertTriangle,
  Radio,
  CircleDot,
  Type,
  CalendarDays,
  Columns3,
  ArrowRight,
  History,
  Download,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from './components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover'
import { Calendar } from './components/ui/calendar'
import { cn } from './lib/utils'
import { api, state, onMessage } from './vscodeApi'

const STATUS_OPTIONS = [
  { value: '✅', label: 'Tamamlandi', color: 'bg-emerald-500', textColor: 'text-emerald-500', ring: 'ring-emerald-500/30' },
  { value: '⚠️', label: 'Devam Ediyor', color: 'bg-amber-500', textColor: 'text-amber-500', ring: 'ring-amber-500/30' },
  { value: '❌', label: 'Yapilmadi', color: 'bg-red-500', textColor: 'text-red-500', ring: 'ring-red-500/30' },
  { value: '-', label: 'N/A', color: 'bg-slate-300 dark:bg-slate-600', textColor: 'text-slate-400', ring: 'ring-slate-300/50 dark:ring-slate-600/50' },
]

const FAZ_COLORS = [
  { color: 'border-teal-300/50 dark:border-teal-700/50', bg: 'bg-teal-500', text: 'text-teal-700/70 dark:text-teal-400/70', dim: 'bg-teal-500/10', tag: 'bg-teal-500/15 text-teal-700/70 dark:text-teal-300/70' },
  { color: 'border-violet-300/50 dark:border-violet-700/50', bg: 'bg-violet-500', text: 'text-violet-700/70 dark:text-violet-400/70', dim: 'bg-violet-500/10', tag: 'bg-violet-500/15 text-violet-700/70 dark:text-violet-300/70' },
  { color: 'border-rose-300/50 dark:border-rose-700/50', bg: 'bg-rose-500', text: 'text-rose-700/70 dark:text-rose-400/70', dim: 'bg-rose-500/10', tag: 'bg-rose-500/15 text-rose-700/70 dark:text-rose-300/70' },
  { color: 'border-amber-300/50 dark:border-amber-700/50', bg: 'bg-amber-500', text: 'text-amber-700/70 dark:text-amber-400/70', dim: 'bg-amber-500/10', tag: 'bg-amber-500/15 text-amber-700/70 dark:text-amber-300/70' },
  { color: 'border-emerald-300/50 dark:border-emerald-700/50', bg: 'bg-emerald-500', text: 'text-emerald-700/70 dark:text-emerald-400/70', dim: 'bg-emerald-500/10', tag: 'bg-emerald-500/15 text-emerald-700/70 dark:text-emerald-300/70' },
  { color: 'border-cyan-300/50 dark:border-cyan-700/50', bg: 'bg-cyan-500', text: 'text-cyan-700/70 dark:text-cyan-400/70', dim: 'bg-cyan-500/10', tag: 'bg-cyan-500/15 text-cyan-700/70 dark:text-cyan-300/70' },
  { color: 'border-pink-300/50 dark:border-pink-700/50', bg: 'bg-pink-500', text: 'text-pink-700/70 dark:text-pink-400/70', dim: 'bg-pink-500/10', tag: 'bg-pink-500/15 text-pink-700/70 dark:text-pink-300/70' },
  { color: 'border-indigo-300/50 dark:border-indigo-700/50', bg: 'bg-indigo-500', text: 'text-indigo-700/70 dark:text-indigo-400/70', dim: 'bg-indigo-500/10', tag: 'bg-indigo-500/15 text-indigo-700/70 dark:text-indigo-300/70' },
]

const DEFAULT_COLUMNS = [
  { key: 'ozellik', label: 'Özellik', type: 'text' },
  { key: 'prd', label: 'PRD', type: 'text' },
  { key: 'backend', label: 'Backend', type: 'status' },
  { key: 'frontend', label: 'Frontend', type: 'status' },
  { key: 'test', label: 'Test', type: 'status' },
  { key: 'tarih', label: 'Tarih', type: 'date' },
  { key: 'not', label: 'Not', type: 'text' },
]

const DEFAULT_FAZ_CONFIG = {
  faz1: { name: 'PLANLAMA & ALTYAPI', ...FAZ_COLORS[0] },
  faz2: { name: 'TEMEL GELİŞTİRME', ...FAZ_COLORS[1] },
  faz3: { name: 'İLERİ ÖZELLİKLER', ...FAZ_COLORS[2] },
  faz4: { name: 'TEST & YAYIN', ...FAZ_COLORS[3] },
}

// Claude AI ikonu
function ClaudeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
    </svg>
  )
}

// Hex/RGB rengi HSL degerine donustur
function cssColorToHSL(color) {
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

const VS_CODE_MAP = [
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

function useContainerWidth(threshold = 350) {
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

function useTheme() {
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

function parseDate(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === '') return null
  const match = dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
  if (!match) return null
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

// ═══════════════════════════════════════════
// STATUS DOT
// ═══════════════════════════════════════════
function StatusDot({ value, onChange }) {
  const current = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[3]

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
          'hover:ring-2',
          current.ring,
          current.value === '-' ? 'bg-muted' : ''
        )}>
          <span className={cn('w-2.5 h-2.5 rounded-full', current.color)} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[140px]">
        {STATUS_OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="gap-2.5 text-xs"
          >
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', opt.color)} />
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ═══════════════════════════════════════════
// DATE PICKER
// ═══════════════════════════════════════════
function DatePickerCell({ value, onChange }) {
  const date = parseDate(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          'h-7 px-2 rounded-md text-xs font-mono-code flex items-center transition-colors',
          'hover:bg-muted',
          date ? 'text-foreground' : 'text-muted-foreground/40'
        )}>
          {date ? format(date, 'd MMM', { locale: tr }) : '—'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => onChange(newDate ? format(newDate, 'yyyy-MM-dd') : '')}
          initialFocus
        />
        {date && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={() => onChange('')}>
              Tarihi Temizle
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ═══════════════════════════════════════════
// DYNAMIC CELL — sutun tipine gore render
// ═══════════════════════════════════════════
function DynamicCell({ col, value, onChange }) {
  if (col.type === 'status') {
    return <StatusDot value={value || '-'} onChange={onChange} />
  }
  if (col.type === 'date') {
    return <DatePickerCell value={value} onChange={onChange} />
  }
  // text
  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
      placeholder="—"
      className="h-7 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30 px-1.5 text-muted-foreground w-full"
    />
  )
}

// ═══════════════════════════════════════════
// SORTABLE ROW
// ═══════════════════════════════════════════
function SortableRow({ item, fazKey, onUpdate, onDelete, onAddBelow, onPrdClick, index, isFilterActive, isCompact, columns, claudeFeatureCmd }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [editing, setEditing] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const statusCols = columns.filter(c => c.type === 'status')
  const claudeCmd = claudeFeatureCmd ? claudeFeatureCmd.replace('${ozellik}', item.ozellik || '') : `claude "${item.ozellik}"`

  // ── Compact iki satirli layout ──
  if (isCompact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group border-b border-border/50 row-hover',
          isDragging && 'opacity-40 bg-muted',
          index % 2 === 0 ? '' : 'bg-muted/20'
        )}
      >
        {/* Ust satir: ozellik */}
        <div className="flex items-center px-2 py-1">
          <Input
            value={item.ozellik}
            onChange={(e) => onUpdate(fazKey, item.id, 'ozellik', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            placeholder="Ozellik adi..."
            className="h-7 flex-1 text-xs font-medium bg-transparent border-none px-1 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
        {/* Alt satir: status dots + actions */}
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-0.5">
            {statusCols.map(col => (
              <StatusDot key={col.key} value={item[col.key] || '-'} onChange={(v) => onUpdate(fazKey, item.id, col.key, v)} />
            ))}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 rounded-md text-[#D97757] hover:bg-[#D97757]/10 transition-colors"
              onClick={() => api.runTerminal(claudeCmd, 'Claude Code')}
              title="Claude Code ile yap"
            >
              <ClaudeIcon className="w-3 h-3" />
            </button>
            <button
              className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => onAddBelow(fazKey, item.id)}
              title="Altina satir ekle"
            >
              <PlusCircle className="w-3 h-3" />
            </button>
            <button
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => onDelete(fazKey, item.id)}
              title="Satiri sil"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Normal tek satirli layout ──
  // Sutunlari bolumlere ayir: ozellik (ilk text), prd (varsa), status'lar, date'ler, diger text'ler
  const ozellikCol = columns.find(c => c.key === 'ozellik')
  const prdCol = columns.find(c => c.key === 'prd')
  const otherCols = columns.filter(c => c.key !== 'ozellik' && c.key !== 'prd')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center row-hover border-b border-border/50',
        isDragging && 'opacity-40 bg-muted',
        editing && 'max-lg:bg-primary/5 max-lg:ring-1 max-lg:ring-inset max-lg:ring-primary/20',
        index % 2 === 0 ? '' : 'bg-muted/20'
      )}
    >
      {/* Drag Handle */}
      <div className={cn('w-6 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity', editing && 'max-lg:hidden')}>
        {!isFilterActive && (
          <button
            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* No */}
      <div className={cn('w-8 shrink-0 flex items-center justify-center', editing && 'max-lg:hidden')}>
        <span className="text-[10px] font-mono-code text-muted-foreground/70 select-none">{String(index + 1).padStart(2, '0')}</span>
      </div>

      {/* Ozellik */}
      {ozellikCol && (
        <div className={cn('min-w-0 px-1 md:px-2 py-1.5', editing ? 'flex-1' : 'flex-1')}>
          <Input
            value={item.ozellik || ''}
            onChange={(e) => onUpdate(fazKey, item.id, 'ozellik', e.target.value)}
            onFocus={() => setEditing(true)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            placeholder="Ozellik adi..."
            className={cn(
              'h-7 text-xs md:text-[13px] font-medium bg-transparent border-none px-1 md:px-1.5',
              editing ? 'focus-visible:ring-1 focus-visible:ring-primary/40' : 'focus-visible:ring-1 focus-visible:ring-primary/30'
            )}
          />
        </div>
      )}

      {/* PRD — buyuk ekranda input + icon, kucuk ekranda sadece hover icon */}
      {prdCol && (
        <>
          {/* Buyuk ekran: input + goz ikonu */}
          <div className={cn('hidden md:block w-28 shrink-0 px-1', editing && 'max-lg:!hidden')}>
            <div className="flex items-center gap-0.5">
              <Input
                value={item.prd || ''}
                onChange={(e) => onUpdate(fazKey, item.id, 'prd', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                placeholder="—"
                className="h-7 w-[72px] text-center font-mono-code text-[11px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30"
              />
              {item.prd && (
                <button
                  onClick={() => onPrdClick(item.prd)}
                  className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          {/* Kucuk ekran: sadece hover'da goz ikonu */}
          {item.prd && (
            <div className="md:hidden w-6 shrink-0 flex items-center justify-center">
              <button
                onClick={() => onPrdClick(item.prd)}
                className="p-1 rounded-md text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 transition-all"
                title={`PRD: ${item.prd}`}
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Dynamic Columns (status, date, text — ozellik/prd haric) */}
      {otherCols.map(col => {
        if (col.type === 'status') {
          return (
            <div key={col.key} className={cn('w-7 md:w-20 shrink-0 flex justify-center', editing && 'max-lg:hidden')}>
              <StatusDot value={item[col.key] || '-'} onChange={(v) => onUpdate(fazKey, item.id, col.key, v)} />
            </div>
          )
        }
        if (col.type === 'date') {
          return (
            <div key={col.key} className="hidden lg:block w-20 shrink-0 px-1">
              <DatePickerCell value={item[col.key] || ''} onChange={(v) => onUpdate(fazKey, item.id, col.key, v)} />
            </div>
          )
        }
        // text
        return (
          <div key={col.key} className="hidden lg:flex flex-1 min-w-0 px-2">
            <Input
              value={item[col.key] || ''}
              onChange={(e) => onUpdate(fazKey, item.id, col.key, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              placeholder="—"
              className="h-7 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30 px-1.5 text-muted-foreground w-full"
            />
          </div>
        )
      })}

      {/* Actions */}
      <div className={cn('w-8 md:w-[72px] shrink-0 pr-1 md:pr-2', editing && 'max-lg:hidden')}>
        {/* Buyuk ekran: ayri butonlar */}
        <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded-md text-[#D97757] hover:bg-[#D97757]/10 transition-colors"
            onClick={() => api.runTerminal(claudeCmd, 'Claude Code')}
            title="Claude Code ile yap"
          >
            <ClaudeIcon className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={() => onAddBelow(fazKey, item.id)}
            title="Altina satir ekle"
          >
            <PlusCircle className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => onDelete(fazKey, item.id)}
            title="Satiri sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Kucuk ekran: 3 nokta menusu */}
        <div className="md:hidden opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={() => api.runTerminal(claudeCmd, 'Claude Code')} className="gap-2 text-xs text-[#D97757] focus:text-[#D97757]">
                <ClaudeIcon className="w-3.5 h-3.5" />
                Claude ile Yap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddBelow(fazKey, item.id)} className="gap-2 text-xs">
                <PlusCircle className="w-3.5 h-3.5" />
                Ekle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(fazKey, item.id)} className="gap-2 text-xs text-destructive focus:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// SORTABLE PHASE WRAPPER
// ═══════════════════════════════════════════
function SortablePhase({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandleProps = disabled ? null : { ...attributes, ...listeners }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-40')}>
      {children(dragHandleProps)}
    </div>
  )
}

// ═══════════════════════════════════════════
// FAZ TABLE
// ═══════════════════════════════════════════
function FazTable({ fazKey, fazConfig, items, onUpdate, onDelete, onAdd, onAddBelow, onReorder, onPrdClick, onFazNameChange, onFazDelete, index, isFilterActive, phaseDragHandleProps, isCompact, columns, claudeFeatureCmd }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(fazConfig.name)
  const [collapsed, setCollapsed] = useState(false)
  const inputRef = useRef(null)

  const handleDragEnd = (event) => {
    if (isFilterActive) return
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      onReorder(fazKey, arrayMove(items, oldIndex, newIndex))
    }
  }

  const statusCols = columns.filter(c => c.type === 'status')
  const done = statusCols.length > 0 ? items.filter(i => statusCols.every(sc => i[sc.key] === '✅')).length : 0
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0

  const handleNameSave = () => {
    if (tempName.trim()) onFazNameChange(fazKey, tempName.trim())
    setEditingName(false)
  }

  useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingName])

  // Dinamik sutun header'lari: status sutunlari icin ikon + kisaltma
  const STATUS_ICONS = { backend: Server, frontend: Monitor, test: TestTube }
  const otherCols = columns.filter(c => c.key !== 'ozellik' && c.key !== 'prd')

  return (
    <div
      className={cn(
        'rounded-lg border bg-card mb-5 animate-fade-up',
        'border-l-[3px]',
        fazConfig.color
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div className="sticky top-[56px] z-30 bg-card rounded-t-lg border-b border-border/30">
        <div className={cn('flex items-center justify-between py-2.5', isCompact ? 'px-2 gap-1' : 'px-4')}>
          <div className={cn('flex items-center min-w-0', isCompact ? 'gap-1' : 'gap-2.5')}>
            {phaseDragHandleProps && !isFilterActive && !isCompact && (
              <button
                className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                {...phaseDragHandleProps}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-0.5 rounded-md hover:bg-muted transition-colors"
            >
              {collapsed
                ? <ChevronRight className={cn('w-4 h-4', fazConfig.text)} />
                : <ChevronDown className={cn('w-4 h-4', fazConfig.text)} />
              }
            </button>

            {editingName ? (
              <Input
                ref={inputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave()
                  if (e.key === 'Escape') { setTempName(fazConfig.name); setEditingName(false) }
                }}
                className={cn('h-7 text-sm font-bold border-primary/30', isCompact ? 'w-full max-w-64' : 'w-64')}
              />
            ) : (
              <button
                className="flex items-center gap-2 group/name min-w-0"
                onClick={() => { setTempName(fazConfig.name); setEditingName(true) }}
              >
                {!isCompact && (
                  <span className={cn('text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded shrink-0', fazConfig.tag)}>
                    FAZ {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                <span className={cn('text-sm font-bold tracking-tight truncate', fazConfig.text)}>
                  {fazConfig.name}
                </span>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
              </button>
            )}

            <span className={cn(
              'text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full',
              fazConfig.tag
            )}>
              {done}/{items.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', fazConfig.bg)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-mono-code text-muted-foreground font-bold">{pct}%</span>
            </div>

            <Button variant="ghost" size="icon" className="hidden md:inline-flex h-7 w-7" onClick={() => onAdd(fazKey)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onFazDelete(fazKey)} title="Fazi sil">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[130px]">
                <DropdownMenuItem onClick={() => onAdd(fazKey)} className="gap-2 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Ozellik Ekle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFazDelete(fazKey)} className="gap-2 text-xs text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                  Fazi Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </div>

      {/* Column Headers — compact modda gizle */}
      {!collapsed && !isCompact && (
        <div className="sticky top-[100px] z-20 flex items-center border-b border-border/50 bg-card/95 backdrop-blur-sm shadow-sm text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="w-6 shrink-0"></div>
          <div className="w-8 shrink-0 flex justify-center py-2">
            <Hash className="w-3 h-3 opacity-40" />
          </div>
          {columns.map(col => {
            if (col.key === 'ozellik') {
              return <div key={col.key} className="flex-1 min-w-0 px-1 md:px-2 py-2">{col.label}</div>
            }
            if (col.key === 'prd') {
              return <div key={col.key} className="hidden md:block w-28 shrink-0 px-2 py-2 text-center">{col.label}</div>
            }
            if (col.type === 'status') {
              const Icon = STATUS_ICONS[col.key] || Activity
              return (
                <div key={col.key} className="shrink-0 py-2 flex items-center justify-center gap-1 w-7 md:w-20">
                  <Icon className="w-3 h-3 opacity-50" />
                  <span className="hidden md:inline">{col.label}</span>
                </div>
              )
            }
            if (col.type === 'date') {
              return <div key={col.key} className="hidden lg:block w-20 shrink-0 px-2 py-2">{col.label}</div>
            }
            // text (not, vb)
            return <div key={col.key} className="hidden lg:block flex-1 min-w-0 px-2 py-2">{col.label}</div>
          })}
          <div className="w-8 md:w-[72px] shrink-0"></div>
        </div>
      )}

      {/* Rows */}
      {!collapsed && (
        <div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item, idx) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  fazKey={fazKey}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddBelow={onAddBelow}
                  onPrdClick={onPrdClick}
                  index={idx}
                  isFilterActive={isFilterActive}
                  isCompact={isCompact}
                  columns={columns}
                  claudeFeatureCmd={claudeFeatureCmd}
                />
              ))}
            </SortableContext>
          </DndContext>
          {items.length === 0 && (
            <div className="py-10 text-center">
              <Terminal className="w-5 h-5 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground/50 font-mono-code mb-3">bos — satir eklemek icin + butonuna tikla</p>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => onAdd(fazKey)}>
                <Plus className="w-3 h-3" />
                Ozellik Ekle
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// STAT ITEM
// ═══════════════════════════════════════════
function StatItem({ label, value, total, icon: Icon, isCompact }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className={cn('flex flex-col min-w-0', isCompact ? 'gap-1 flex-1 min-w-[70px]' : 'gap-1.5 flex-1 min-w-[90px]')}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground/20 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono-code font-medium text-muted-foreground shrink-0">{value}/{total}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// PRD MODAL
// ═══════════════════════════════════════════
function PrdModal({ prdRange, open, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!prdRange || !open) return
    setLoading(true)
    const parts = prdRange.split('-').map(Number)
    const start = parts[0] || 1
    const end = parts[1] || start

    api.prdLines(start, end)
      .then(data => { setContent(data.excerpt || ''); setLoading(false) })
      .catch(() => { setContent('Hata olustu'); setLoading(false) })
  }, [prdRange, open])

  const renderedHtml = useMemo(() => {
    if (!content) return ''
    return marked.parse(content, { breaks: true, gfm: true })
  }, [content])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono-code text-sm">
            <Eye className="w-4 h-4 text-primary" />
            PRD Satir {prdRange}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm font-mono-code">Yukleniyor...</div>
          ) : (
            <div
              className="prd-prose w-full h-[400px] p-5 rounded-md border bg-muted/10 text-sm overflow-auto select-text"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="sm">Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════
// CHANGELOG
// ═══════════════════════════════════════════
function ChangelogRow({ entry, onUpdate, onDelete, isCompact }) {
  return (
    <div className="group flex items-center border-b border-border/30 row-hover">
      <div className={cn('p-2 shrink-0', isCompact ? 'w-24' : 'w-36')}>
        <Input
          value={entry.tarih}
          onChange={(e) => onUpdate(entry.id, 'tarih', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          placeholder="YYYY-MM-DD"
          className="h-7 font-mono-code text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30"
        />
      </div>
      <div className="p-2 flex-1">
        <Input
          value={entry.degisiklik}
          onChange={(e) => onUpdate(entry.id, 'degisiklik', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          placeholder="Degisiklik aciklamasi..."
          className="h-7 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30"
        />
      </div>
      <div className="p-2 w-12 shrink-0">
        <button
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function ChangelogSection({ changelog, onUpdate, onDelete, onAdd, isCompact }) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Degisiklik Gecmisi</span>
          <span className="text-[10px] font-mono-code text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{changelog.length}</span>
        </button>
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Ekle
        </Button>
      </div>
      {!collapsed && (
        <>
          <div className="flex items-center border-b border-border/30 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <div className={cn('p-2 shrink-0', isCompact ? 'w-24' : 'w-36')}>Tarih</div>
            <div className="p-2 flex-1">Degisiklik</div>
            <div className="p-2 w-12 shrink-0"></div>
          </div>
          {changelog.map(entry => (
            <ChangelogRow key={entry.id} entry={entry} onUpdate={onUpdate} onDelete={onDelete} isCompact={isCompact} />
          ))}
          {changelog.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground/50 font-mono-code">
              henuz kayit yok
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// SETTINGS: SORTABLE COLUMN ROW
// ═══════════════════════════════════════════
function SortableColumnRow({ col, index, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.key })
  const isOzellik = col.key === 'ozellik'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 border-b border-border/40',
        isDragging && 'opacity-40 bg-muted',
      )}
    >
      <button
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <span className="text-[10px] font-mono-code text-muted-foreground/50 w-5 shrink-0 text-center">{index + 1}</span>

      <Input
        value={col.label}
        onChange={(e) => onUpdate(col.key, 'label', e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        disabled={isOzellik}
        className={cn('h-7 text-xs flex-1', isOzellik && 'opacity-60')}
      />

      <select
        value={col.type}
        onChange={(e) => onUpdate(col.key, 'type', e.target.value)}
        disabled={isOzellik}
        className={cn(
          'h-7 px-2 rounded-md border text-xs bg-background',
          isOzellik && 'opacity-60'
        )}
      >
        <option value="status">Durum</option>
        <option value="text">Metin</option>
        <option value="date">Tarih</option>
      </select>

      <button
        className={cn(
          'p-1 rounded-md transition-colors shrink-0',
          isOzellik ? 'opacity-0 pointer-events-none' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
        )}
        onClick={() => !isOzellik && onDelete(col.key)}
        disabled={isOzellik}
        title={isOzellik ? 'Bu sutun silinemez' : 'Sutunu sil'}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
// SETTINGS VIEW
// ═══════════════════════════════════════════
function SettingsView({ onClose, onSaved, isCompact, onReset }) {
  const [activeTab, setActiveTab] = useState('terminal')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const originalSettingsRef = useRef(null)

  useEffect(() => {
    api.loadSettings().then(s => {
      originalSettingsRef.current = JSON.stringify(s)
      setSettings(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const isDirty = settings && originalSettingsRef.current && JSON.stringify(settings) !== originalSettingsRef.current

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await api.saveSettings(settings)
      originalSettingsRef.current = JSON.stringify(settings)
      onSaved()
    } catch (err) {
      console.error('Settings save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDetectTerminals = async () => {
    setScanning(true)
    try {
      const terminals = await api.detectTerminals()
      setSettings(prev => ({ ...prev, terminal: { ...prev.terminal, availableTerminals: terminals } }))
    } catch (err) {
      console.error('Detect terminals error:', err)
    } finally {
      setScanning(false)
    }
  }

  // Column DnD
  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleColumnDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const cols = settings.roadmap.columns
    const oldIndex = cols.findIndex(c => c.key === active.id)
    const newIndex = cols.findIndex(c => c.key === over.id)
    setSettings(prev => ({
      ...prev,
      roadmap: { ...prev.roadmap, columns: arrayMove(prev.roadmap.columns, oldIndex, newIndex) },
    }))
  }

  const updateColumn = (key, field, value) => {
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: prev.roadmap.columns.map(c => c.key === key ? { ...c, [field]: value } : c),
      },
    }))
  }

  const deleteColumn = (key) => {
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: prev.roadmap.columns.filter(c => c.key !== key),
      },
    }))
  }

  const addColumn = () => {
    const newKey = `custom_${Date.now()}`
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: [...prev.roadmap.columns, { key: newKey, label: 'Yeni Sutun', type: 'text' }],
      },
    }))
  }

  const [backups, setBackups] = useState([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(null)

  useEffect(() => {
    if (activeTab === 'backups') loadBackups()
  }, [activeTab])

  const loadBackups = async () => {
    setLoadingBackups(true)
    try {
      const list = await api.listBackups()
      setBackups(list || [])
    } catch {
      setBackups([])
    } finally {
      setLoadingBackups(false)
    }
  }

  const handleRestore = async (filename) => {
    setRestoringBackup(filename)
    try {
      await api.restoreBackup(filename)
      onSaved()
    } catch (err) {
      console.error('Restore error:', err)
    } finally {
      setRestoringBackup(null)
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'claude', label: 'Claude Code', icon: () => <ClaudeIcon className="w-3.5 h-3.5" /> },
    { id: 'roadmap', label: 'Roadmap', icon: Columns3 },
    { id: 'backups', label: 'Yedekler', icon: History },
  ]

  return (
    <div className="min-h-screen">
      {/* Settings Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Cog className="w-4 h-4 text-muted-foreground" />
              <h1 className="text-sm font-bold tracking-tight">Ayarlar</h1>
            </div>
          </div>
          <div className="w-7" />
        </div>
      </header>

      <div className={cn('mx-auto py-5 px-3', isCompact ? 'max-w-full' : 'max-w-2xl')}>
        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg bg-muted/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {!isCompact && tab.label}
            </button>
          ))}
        </div>

        {/* ── Terminal Sekmesi ── */}
        {activeTab === 'terminal' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Terminal Ayarlari</h2>

            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Varsayilan Terminal</label>
                <div className="flex items-center gap-2">
                  <select
                    value={settings.terminal.defaultTerminalId || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, terminal: { ...prev.terminal, defaultTerminalId: e.target.value || null } }))}
                    className="h-8 flex-1 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  >
                    <option value="">VS Code Varsayilani</option>
                    {settings.terminal.availableTerminals.map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleDetectTerminals}
                    disabled={scanning}
                    title="Terminalleri Tara"
                  >
                    {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                {settings.terminal.defaultTerminalId && (() => {
                  const selected = settings.terminal.availableTerminals.find(t => t.id === settings.terminal.defaultTerminalId)
                  return selected ? (
                    <p className="text-[10px] text-muted-foreground/60 font-mono-code mt-1.5 truncate">{selected.path}</p>
                  ) : null
                })()}
                {settings.terminal.availableTerminals.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                    Kurulu terminalleri tespit etmek icin "Tara" butonuna tiklayin
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Claude Code Sekmesi ── */}
        {activeTab === 'claude' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Claude Code Ayarlari</h2>

            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Ana Claude Komutu</label>
                <Input
                  value={settings.claude.mainCommand}
                  onChange={(e) => setSettings(prev => ({ ...prev, claude: { ...prev.claude, mainCommand: e.target.value } }))}
                  className="h-8 text-xs font-mono-code"
                  placeholder="claude --dangerously-skip-permissions"
                />
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Header'daki Claude butonuna tiklandiginda calistirilacak komut
                </p>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Ozellik Claude Komutu</label>
                <Input
                  value={settings.claude.featureCommand}
                  onChange={(e) => setSettings(prev => ({ ...prev, claude: { ...prev.claude, featureCommand: e.target.value } }))}
                  className="h-8 text-xs font-mono-code"
                  placeholder='claude "${ozellik}"'
                />
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Satirdaki Claude butonuna tiklandiginda calistirilacak komut. <code className="px-1 py-0.5 rounded bg-muted text-[10px]">{'${ozellik}'}</code> ozellik adiyla degistirilir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Roadmap Sekmesi ── */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Roadmap Sutunlari</h2>

            {/* Uyari */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Sutun degisiklikleri kaydedildiginde ROADMAP.md yeniden yazilir. Mevcut veriler yeni sutun yapisina gore guncellenir.
              </p>
            </div>

            {/* Column List */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-center border-b border-border/40 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">
                <div className="w-8 shrink-0"></div>
                <div className="w-5 shrink-0"></div>
                <div className="flex-1 px-1">Isim</div>
                <div className="w-24 text-center">Tip</div>
                <div className="w-8"></div>
              </div>

              <DndContext sensors={columnSensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                <SortableContext items={settings.roadmap.columns.map(c => c.key)} strategy={verticalListSortingStrategy}>
                  {settings.roadmap.columns.map((col, idx) => (
                    <SortableColumnRow
                      key={col.key}
                      col={col}
                      index={idx}
                      onUpdate={updateColumn}
                      onDelete={deleteColumn}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add Column */}
              <button
                onClick={addColumn}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-t border-dashed border-border/60"
              >
                <Plus className="w-3.5 h-3.5" />
                Sutun Ekle
              </button>
            </div>
          </div>
        )}

        {/* ── Yedekler Sekmesi ── */}
        {activeTab === 'backups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Yedekler</h2>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={loadBackups}
                disabled={loadingBackups}
              >
                {loadingBackups ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Yenile
              </Button>
            </div>

            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
              <History className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Roadmap sifirlandiginda veya yedekten geri yuklendiginde mevcut dosya otomatik olarak yedeklenir.
                Hicbir veri kaybolmaz.
              </p>
            </div>

            {backups.length === 0 && !loadingBackups && (
              <div className="rounded-lg border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                  <History className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Henuz yedek bulunmuyor</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Roadmap sifirlandiginda yedekler burada goruntulenir</p>
                </div>
              </div>
            )}

            {loadingBackups && (
              <div className="rounded-lg border bg-card p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {backups.length > 0 && (
              <div className="rounded-lg border bg-card overflow-hidden divide-y divide-border/40">
                {backups.map((backup) => {
                  const date = new Date(backup.timestamp)
                  const sizeKB = (backup.size / 1024).toFixed(1)
                  return (
                    <div key={backup.filename} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {format(date, 'dd MMM yyyy, HH:mm:ss', { locale: tr })}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono-code mt-0.5">
                          {sizeKB} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 shrink-0 ml-3"
                        onClick={() => handleRestore(backup.filename)}
                        disabled={restoringBackup === backup.filename}
                      >
                        {restoringBackup === backup.filename
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Download className="w-3 h-3" />
                        }
                        Geri Yukle
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Roadmap Sifirla */}
            <div className="pt-4 border-t border-border/40 mt-4">
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Roadmap Sifirla
              </button>
              <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
                Mevcut dosya yedeklenir, yeni bos roadmap olusturulur
              </p>
            </div>
          </div>
        )}

        {/* Kaydet Butonu — sadece degisiklik varsa gorunur */}
        {isDirty && (
          <div className="pt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// SETUP WIZARD
// ═══════════════════════════════════════════
function SetupWizard({ onCreated }) {
  const [step, setStep] = useState(0)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.loadSettings().then(s => {
      setSettings(s)
      setLoading(false)
    }).catch(() => {
      setSettings({
        version: 1,
        terminal: { defaultTerminalId: null, availableTerminals: [] },
        claude: { mainCommand: 'claude --dangerously-skip-permissions', featureCommand: 'claude "${ozellik}"' },
        roadmap: { columns: [...DEFAULT_COLUMNS] },
      })
      setLoading(false)
    })
  }, [])

  const handleDetectTerminals = async () => {
    setScanning(true)
    try {
      const terminals = await api.detectTerminals()
      setSettings(prev => ({ ...prev, terminal: { ...prev.terminal, availableTerminals: terminals } }))
    } catch (err) {
      console.error('Detect terminals error:', err)
    } finally {
      setScanning(false)
    }
  }

  // Column DnD
  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleColumnDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const cols = settings.roadmap.columns
    const oldIndex = cols.findIndex(c => c.key === active.id)
    const newIndex = cols.findIndex(c => c.key === over.id)
    setSettings(prev => ({
      ...prev,
      roadmap: { ...prev.roadmap, columns: arrayMove(prev.roadmap.columns, oldIndex, newIndex) },
    }))
  }

  const updateColumn = (key, field, value) => {
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: prev.roadmap.columns.map(c => c.key === key ? { ...c, [field]: value } : c),
      },
    }))
  }

  const deleteColumn = (key) => {
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: prev.roadmap.columns.filter(c => c.key !== key),
      },
    }))
  }

  const addColumn = () => {
    const newKey = `custom_${Date.now()}`
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: [...prev.roadmap.columns, { key: newKey, label: 'Yeni Sutun', type: 'text' }],
      },
    }))
  }

  const handleCreate = async () => {
    if (!settings) return
    setCreating(true)
    try {
      await api.createRoadmapWithSettings(settings)
      onCreated()
    } catch (err) {
      console.error('Create roadmap error:', err)
    } finally {
      setCreating(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const steps = [
    { label: 'Hosgeldin', icon: Rocket },
    { label: 'Terminal', icon: Terminal },
    { label: 'Sutunlar', icon: Columns3 },
    { label: 'Olustur', icon: Check },
  ]

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-0 py-6 px-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all',
                i === step && 'bg-primary text-primary-foreground shadow-sm',
                i < step && 'bg-primary/15 text-primary cursor-pointer hover:bg-primary/25',
                i > step && 'bg-muted/50 text-muted-foreground/40',
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                i === step && 'bg-primary-foreground/20',
                i < step && 'bg-primary/20',
                i > step && 'bg-muted-foreground/10',
              )}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-8 h-px mx-1',
                i < step ? 'bg-primary/40' : 'bg-border',
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-lg">

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center gap-6 py-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <Rocket className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight mb-2">Roadmap Editor'e Hosgeldiniz</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  Bu sihirbaz ile projeniz icin bir ROADMAP.md dosyasi olusturabilirsiniz.
                  Terminal, sutun ve diger ayarlari yapilandirip hemen baslayin.
                </p>
              </div>
              <Button onClick={() => setStep(1)} className="gap-2">
                Baslayalim
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* ── Step 1: Terminal Selection ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold tracking-tight mb-1">Terminal Ayarlari</h2>
                <p className="text-xs text-muted-foreground">Komutlari calistirmak icin kullanilacak terminali secin</p>
              </div>

              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Varsayilan Terminal</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={settings.terminal.defaultTerminalId || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, terminal: { ...prev.terminal, defaultTerminalId: e.target.value || null } }))}
                      className="h-8 flex-1 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    >
                      <option value="">VS Code Varsayilani</option>
                      {settings.terminal.availableTerminals.map(term => (
                        <option key={term.id} value={term.id}>{term.name}</option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleDetectTerminals}
                      disabled={scanning}
                      title="Terminalleri Tara"
                    >
                      {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  {settings.terminal.defaultTerminalId && (() => {
                    const selected = settings.terminal.availableTerminals.find(t => t.id === settings.terminal.defaultTerminalId)
                    return selected ? (
                      <p className="text-[10px] text-muted-foreground/60 font-mono-code mt-1.5 truncate">{selected.path}</p>
                    ) : null
                  })()}
                  {settings.terminal.availableTerminals.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                      Kurulu terminalleri tespit etmek icin "Tara" butonuna tiklayin
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setStep(0)} className="gap-1.5 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Geri
                </Button>
                <Button size="sm" onClick={() => setStep(2)} className="gap-1.5 text-xs">
                  Devam
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Column Customization ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold tracking-tight mb-1">Sutun Yapilandirmasi</h2>
                <p className="text-xs text-muted-foreground">Roadmap tablonuzun sutunlarini duzenleyin, ekleyin veya siralayin</p>
              </div>

              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center border-b border-border/40 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">
                  <div className="w-8 shrink-0"></div>
                  <div className="w-5 shrink-0"></div>
                  <div className="flex-1 px-1">Isim</div>
                  <div className="w-24 text-center">Tip</div>
                  <div className="w-8"></div>
                </div>

                <DndContext sensors={columnSensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                  <SortableContext items={settings.roadmap.columns.map(c => c.key)} strategy={verticalListSortingStrategy}>
                    {settings.roadmap.columns.map((col, idx) => (
                      <SortableColumnRow
                        key={col.key}
                        col={col}
                        index={idx}
                        onUpdate={updateColumn}
                        onDelete={deleteColumn}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <button
                  onClick={addColumn}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-t border-dashed border-border/60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Sutun Ekle
                </button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1.5 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Geri
                </Button>
                <Button size="sm" onClick={() => setStep(3)} className="gap-1.5 text-xs">
                  Devam
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm & Create ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold tracking-tight mb-1">Ozet & Olustur</h2>
                <p className="text-xs text-muted-foreground">Ayarlarinizi kontrol edin ve ROADMAP.md dosyasini olusturun</p>
              </div>

              {/* Summary Card */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                {/* Terminal */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Terminal className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground">Terminal</p>
                    <p className="text-xs font-bold truncate">
                      {settings.terminal.defaultTerminalId
                        ? (settings.terminal.availableTerminals.find(t => t.id === settings.terminal.defaultTerminalId)?.name || 'Secili')
                        : 'VS Code Varsayilani'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40" />

                {/* Columns */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Columns3 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Sutunlar ({settings.roadmap.columns.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {settings.roadmap.columns.map(col => (
                        <span key={col.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium">
                          {col.type === 'status' && <CircleDot className="w-2.5 h-2.5 text-emerald-500" />}
                          {col.type === 'text' && <Type className="w-2.5 h-2.5 text-blue-500" />}
                          {col.type === 'date' && <CalendarDays className="w-2.5 h-2.5 text-amber-500" />}
                          {col.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1.5 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Geri
                </Button>
                <Button onClick={handleCreate} disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  ROADMAP.md Olustur
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const dark = useTheme()
  const [containerRef, isCompact] = useContainerWidth()
  const [data, setData] = useState({})
  const [fazConfig, setFazConfig] = useState(DEFAULT_FAZ_CONFIG)
  const [fazOrder, setFazOrder] = useState(['faz1', 'faz2', 'faz3', 'faz4'])
  const [changelog, setChangelog] = useState([])
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [prdModal, setPrdModal] = useState(null)
  const [customCommands, setCustomCommands] = useState(() => state.get('customCommands', []))
  const [cmdDialogOpen, setCmdDialogOpen] = useState(false)
  const [newCmdName, setNewCmdName] = useState('')
  const [newCmdText, setNewCmdText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef(null)
  const [fileNotFound, setFileNotFound] = useState(false)
  const [fileChangedBanner, setFileChangedBanner] = useState(false)
  const [activePhaseDrag, setActivePhaseDrag] = useState(null)
  const [viewMode, setViewMode] = useState('main') // 'main' | 'settings'
  const [settingsData, setSettingsData] = useState(null) // cached settings for claude commands
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [firstRunDialog, setFirstRunDialog] = useState(false)
  const [firstRunProcessing, setFirstRunProcessing] = useState(false)
  const saveTimer = useRef(null)
  const fazOrderRef = useRef(fazOrder)

  const loadData = useCallback(async () => {
    try {
      const loadedData = await api.load()
      if (loadedData._notFound) {
        setFileNotFound(true)
        setLoading(false)
        return
      }
      setFileNotFound(false)
      if (loadedData._firstRun) {
        setFirstRunDialog(true)
      }
      const { _fazNames, _changelog, _fazOrder: loadedFazOrder, _columns: loadedColumns, _firstRun, ...fazData } = loadedData
      setData(fazData)
      setChangelog(_changelog || [])
      if (loadedColumns) setColumns(loadedColumns)
      if (_fazNames) {
        const newConfig = { ...DEFAULT_FAZ_CONFIG }
        Object.entries(_fazNames).forEach(([key, name]) => {
          const fazNum = parseInt(key.replace('faz', '')) || 1
          const colorIndex = (fazNum - 1) % FAZ_COLORS.length
          newConfig[key] = { name, ...FAZ_COLORS[colorIndex] }
        })
        setFazConfig(newConfig)
      }
      if (loadedFazOrder && loadedFazOrder.length > 0) {
        setFazOrder(loadedFazOrder)
      } else {
        const keys = Object.keys(fazData).filter(k => k.startsWith('faz'))
        if (keys.length > 0) {
          setFazOrder(keys.sort((a, b) => {
            const numA = parseInt(a.replace('faz', '')) || 0
            const numB = parseInt(b.replace('faz', '')) || 0
            return numA - numB
          }))
        }
      }
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Settings'i bir kere yukle (claude komutlari icin)
  useEffect(() => {
    api.loadSettings().then(s => setSettingsData(s)).catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    fazOrderRef.current = fazOrder
  }, [fazOrder])

  useEffect(() => {
    const cleanup = onMessage('fileChanged', () => {
      setFileChangedBanner(true)
    })
    return cleanup
  }, [])

  const autoSave = useCallback((newData, newFazConfig, newChangelog, newFazOrder) => {
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const orderToSave = newFazOrder || fazOrderRef.current
        await api.save({ ...newData, _fazConfig: newFazConfig, _changelog: newChangelog, _fazOrder: orderToSave })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 800)
  }, [])


  const updateItem = (fazKey, itemId, field, value) => {
    const newData = { ...data, [fazKey]: data[fazKey].map(item => item.id === itemId ? { ...item, [field]: value } : item) }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const deleteItem = (fazKey, itemId) => {
    const newData = { ...data, [fazKey]: data[fazKey].filter(item => item.id !== itemId) }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const addItem = (fazKey) => {
    const newItem = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }
    columns.forEach(col => {
      newItem[col.key] = col.type === 'status' ? '❌' : ''
    })
    const newData = { ...data, [fazKey]: [...(data[fazKey] || []), newItem] }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const addItemBelow = (fazKey, itemId) => {
    const newItem = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }
    columns.forEach(col => {
      newItem[col.key] = col.type === 'status' ? '❌' : ''
    })
    const items = data[fazKey] || []
    const index = items.findIndex(i => i.id === itemId)
    const newItems = [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)]
    const newData = { ...data, [fazKey]: newItems }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const isFilterActive = searchText.trim() !== ''

  const filteredData = useMemo(() => {
    if (!isFilterActive) return data
    const result = {}
    const search = searchText.trim().toLowerCase()
    for (const [fazKey, items] of Object.entries(data)) {
      if (!Array.isArray(items)) continue
      const filtered = items.filter(item => {
        return (item.ozellik || '').toLowerCase().includes(search)
          || (item.not || '').toLowerCase().includes(search)
      })
      result[fazKey] = filtered
    }
    return result
  }, [data, searchText, isFilterActive])

  const reorderItems = (fazKey, newItems) => {
    if (isFilterActive) return
    const newData = { ...data, [fazKey]: newItems }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const updateFazName = (fazKey, newName) => {
    const newConfig = { ...fazConfig, [fazKey]: { ...fazConfig[fazKey], name: newName } }
    setFazConfig(newConfig)
    autoSave(data, newConfig, changelog)
  }

  const addNewFaz = () => {
    const fazNum = fazOrder.length + 1
    const newKey = `faz${fazNum}`
    const colorIndex = (fazNum - 1) % FAZ_COLORS.length
    const newConfig = { ...fazConfig, [newKey]: { name: 'YENI FAZ', ...FAZ_COLORS[colorIndex] } }
    setFazConfig(newConfig)
    setFazOrder([...fazOrder, newKey])
    setData({ ...data, [newKey]: [] })
    autoSave({ ...data, [newKey]: [] }, newConfig, changelog)
  }

  const deleteFaz = (fazKey) => {
    const newConfig = { ...fazConfig }
    delete newConfig[fazKey]
    const newData = { ...data }
    delete newData[fazKey]
    const newOrder = fazOrder.filter(k => k !== fazKey)
    setFazConfig(newConfig)
    setFazOrder(newOrder)
    setData(newData)
    autoSave(newData, newConfig, changelog)
  }

  const updateChangelog = (entryId, field, value) => {
    const newChangelog = changelog.map(entry => entry.id === entryId ? { ...entry, [field]: value } : entry)
    setChangelog(newChangelog)
    autoSave(data, fazConfig, newChangelog)
  }

  const deleteChangelog = (entryId) => {
    const newChangelog = changelog.filter(entry => entry.id !== entryId)
    setChangelog(newChangelog)
    autoSave(data, fazConfig, newChangelog)
  }

  const addChangelog = () => {
    const today = new Date().toISOString().split('T')[0]
    const newEntry = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), tarih: today, degisiklik: '' }
    const newChangelog = [newEntry, ...changelog]
    setChangelog(newChangelog)
    autoSave(data, fazConfig, newChangelog)
  }

  const phaseSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handlePhaseDragStart = (event) => {
    setActivePhaseDrag(event.active.id)
  }

  const handlePhaseDragEnd = (event) => {
    setActivePhaseDrag(null)
    if (isFilterActive) return
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = fazOrder.indexOf(active.id)
      const newIndex = fazOrder.indexOf(over.id)
      const newOrder = arrayMove(fazOrder, oldIndex, newIndex)
      setFazOrder(newOrder)
      autoSave(data, fazConfig, changelog, newOrder)
    }
  }

  // Custom commands
  const addCustomCommand = () => {
    if (!newCmdName.trim() || !newCmdText.trim()) return
    const updated = [...customCommands, { id: Date.now().toString(), name: newCmdName.trim(), cmd: newCmdText.trim() }]
    setCustomCommands(updated)
    state.set('customCommands', updated)
    setNewCmdName('')
    setNewCmdText('')
    setCmdDialogOpen(false)
  }

  const deleteCustomCommand = (id) => {
    const updated = customCommands.filter(c => c.id !== id)
    setCustomCommands(updated)
    state.set('customCommands', updated)
  }

  // Dinamik Stats — tum sutunlari destekle
  const COLUMN_TYPE_ICONS = { status: CircleDot, text: Type, date: CalendarDays }
  const allStatsColumns = columns.filter(c => c.key !== 'ozellik')
  const stats = Object.values(data).flat()
  const total = stats.length

  const columnStats = useMemo(() => {
    return allStatsColumns.map(col => {
      let filled = 0
      if (col.type === 'status') {
        filled = stats.filter(i => i[col.key] === '✅').length
      } else {
        filled = stats.filter(i => i[col.key] && i[col.key].trim() !== '' && i[col.key] !== '-').length
      }
      return { ...col, filled }
    })
  }, [stats, total, allStatsColumns])

  const statusColumns = columns.filter(c => c.type === 'status')
  const overallPct = useMemo(() => {
    if (total === 0 || statusColumns.length === 0) return 0
    let sum = 0
    for (const sc of statusColumns) {
      sum += stats.filter(i => i[sc.key] === '✅').length
    }
    return Math.round((sum / (total * statusColumns.length)) * 100)
  }, [stats, total, statusColumns])

  const claudeMainCmd = settingsData?.claude?.mainCommand || 'claude --dangerously-skip-permissions'
  const claudeFeatureCmd = settingsData?.claude?.featureCommand || 'claude "${ozellik}"'

  // ═══ LOADING ═══
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 grid-bg">
        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary-foreground animate-pulse" />
        </div>
        <p className="text-xs font-mono-code text-muted-foreground">yukleniyor...</p>
      </div>
    )
  }

  // ═══ FIRST RUN — Mevcut ROADMAP.md tespit edildi ═══
  if (firstRunDialog) {
    return (
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
            <FileCode className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight mb-2">Mevcut ROADMAP.md Tespit Edildi</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bu projede zaten bir ROADMAP.md dosyasi mevcut. Bu dosya eklentiyle uyumlu olmayabilir.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              Devam etmek icin mevcut dosya yedeklenecek ve kurulum sihirbaziyla uyumlu yeni bir ROADMAP.md olusturulacak.
              Orijinal dosyaniz Ayarlar &gt; Yedekler sekmesinden geri yuklenebilir.
            </p>
          </div>
          <button
            onClick={async () => {
              setFirstRunProcessing(true)
              try {
                await api.resetRoadmap()
                setFirstRunDialog(false)
                setFileNotFound(true)
              } catch (err) {
                console.error('First run reset error:', err)
              } finally {
                setFirstRunProcessing(false)
              }
            }}
            disabled={firstRunProcessing}
            className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {firstRunProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Yedekle ve Devam Et
          </button>
        </div>
      </div>
    )
  }

  // ═══ FILE NOT FOUND — SETUP WIZARD ═══
  if (fileNotFound) {
    return (
      <SetupWizard onCreated={() => {
        setFileNotFound(false)
        setLoading(true)
        loadData()
      }} />
    )
  }

  // ═══ SETTINGS VIEW ═══
  if (viewMode === 'settings') {
    return (
      <div ref={containerRef} className="min-h-screen grid-bg">
        <SettingsView
          onClose={() => setViewMode('main')}
          onSaved={() => {
            setLoading(true)
            api.loadSettings().then(s => setSettingsData(s)).catch(() => {})
            loadData()
          }}
          isCompact={isCompact}
          onReset={() => setResetDialogOpen(true)}
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen grid-bg">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="w-full flex h-14 items-center justify-between px-1">
          {/* Left: Title + Progress */}
          <div className="flex items-center gap-3 min-w-0">
            {!isCompact && (
              <div>
                <h1 className="text-xs font-semibold tracking-tight leading-none text-muted-foreground">ROADMAP</h1>
                <p className="text-[10px] font-mono-code text-muted-foreground leading-none mt-0.5">
                  {format(new Date(), 'dd.MM.yyyy', { locale: tr })}
                </p>
              </div>
            )}

            {/* Progress */}
            <div className={cn('flex items-center gap-1.5', !isCompact && 'pl-3 border-l')}>
              <div className="hidden md:block w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${overallPct}%` }} />
              </div>
              <span className="text-[11px] font-mono-code font-bold text-primary">{overallPct}%</span>
            </div>

          </div>

          {/* Right: Actions */}
          <div className={cn('flex items-center gap-1.5', isCompact ? 'flex-1 justify-end' : 'shrink-0')}>
            {/* Search */}
            {searchOpen ? (
              <div className={cn('relative flex items-center h-7 rounded-md bg-muted/50 overflow-hidden ring-1 ring-primary/40 animate-fade-up', isCompact ? 'flex-1' : 'w-36 md:w-44')} style={{ animationDuration: '0.15s' }}>
                <Search className="absolute left-2 w-3 h-3 text-muted-foreground/50 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setSearchText(''); setSearchOpen(false) }
                  }}
                  onBlur={() => { if (!searchText) setSearchOpen(false) }}
                  placeholder="Ara..."
                  className="flex-1 h-full pl-7 pr-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/40"
                  autoFocus
                />
                <button
                  className="flex items-center justify-center h-4 w-4 mr-1 rounded-sm text-muted-foreground/60 hover:text-foreground transition-colors"
                  onClick={() => { setSearchText(''); setSearchOpen(false) }}
                  title="Kapat"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                title="Ara"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={() => { setLoading(true); loadData() }}
              className={cn(
                'group/ref relative flex items-center justify-center h-7 w-7 rounded-md transition-colors cursor-pointer overflow-hidden',
                saveStatus === 'saved' && 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10',
                saveStatus === 'saving' && 'text-amber-600 dark:text-amber-400',
                saveStatus === 'unsaved' && 'text-muted-foreground hover:bg-muted'
              )}
              title={saveStatus === 'saved' ? 'Kaydedildi — tikla yenile' : saveStatus === 'saving' ? 'Kaydediliyor...' : 'Kaydedilmedi — tikla yenile'}
            >
              {saveStatus === 'saving' ? (
                <Cloud className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 absolute opacity-0 group-hover/ref:opacity-100 transition-opacity" />
                  {saveStatus === 'saved'
                    ? <Check className="w-3.5 h-3.5 group-hover/ref:opacity-0 transition-opacity" />
                    : <RefreshCw className="w-3.5 h-3.5" />
                  }
                </>
              )}
            </button>

            {/* Claude Code — compact modda gizle */}
            {!isCompact && (
              <button
                onClick={() => api.runTerminal(claudeMainCmd, 'Claude Code')}
                className="flex items-center justify-center h-7 w-7 rounded-md text-[#D97757] hover:text-[#E8956F] hover:bg-muted transition-colors"
                title="Claude Code"
              >
                <ClaudeIcon className="w-3.5 h-3.5" />
              </button>
            )}

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                  <Menu className="h-4 w-4 text-muted-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* ── Ozel Komutlar ── */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                    Ozel Komutlar
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {customCommands.length === 0 && (
                      <div className="px-2 py-3 text-[10px] text-muted-foreground/50 text-center font-mono-code">
                        henuz komut eklenmedi
                      </div>
                    )}
                    {customCommands.map(cmd => (
                      <DropdownMenuItem key={cmd.id} onClick={() => api.runTerminal(cmd.cmd, cmd.name)} className="gap-2.5 text-xs group/cmd">
                        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{cmd.name}</span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteCustomCommand(cmd.id) }}
                          className="p-0.5 rounded opacity-0 group-hover/cmd:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCmdDialogOpen(true)} className="gap-2.5 text-xs">
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      Komut Ekle
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* ── Ayarlar & Sifirla ── */}
                <DropdownMenuItem onClick={() => setViewMode('settings')} className="gap-2.5 text-xs">
                  <Cog className="w-3.5 h-3.5 text-muted-foreground" />
                  Ayarlar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ═══ FILE CHANGED BANNER ═══ */}
      {fileChangedBanner && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-1 py-2 flex items-center justify-between">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Dosya disaridan degistirildi. Verileri yenilemek ister misiniz?
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
              onClick={() => { setFileChangedBanner(false); setLoading(true); loadData() }}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Yenile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-amber-700 dark:text-amber-300"
              onClick={() => setFileChangedBanner(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="w-full px-0.5 py-5">
        {/* Stats Card */}
        {total > 0 && columnStats.length > 0 && (
          <div className={cn('grid rounded-lg border border-border/60 bg-card/80 mb-5', isCompact ? 'grid-cols-2 gap-3 px-3 py-3' : 'grid-cols-3 gap-4 px-4 py-4')}>
            {columnStats.map((col) => (
              <StatItem
                key={col.key}
                label={col.label}
                value={col.filled}
                total={total}
                icon={COLUMN_TYPE_ICONS[col.type] || Activity}
                isCompact={isCompact}
              />
            ))}
          </div>
        )}

        {/* Faz Tables */}
        <DndContext
          sensors={phaseSensors}
          collisionDetection={closestCenter}
          onDragStart={handlePhaseDragStart}
          onDragEnd={handlePhaseDragEnd}
        >
          <SortableContext items={fazOrder} strategy={verticalListSortingStrategy}>
            {fazOrder.map((fazKey, idx) =>
              fazConfig[fazKey] && (
                <SortablePhase key={fazKey} id={fazKey} disabled={isFilterActive}>
                  {(dragHandleProps) => (
                    <FazTable
                      fazKey={fazKey}
                      fazConfig={fazConfig[fazKey]}
                      items={filteredData[fazKey] || []}
                      onUpdate={updateItem}
                      onDelete={deleteItem}
                      onAdd={addItem}
                      onAddBelow={addItemBelow}
                      onReorder={reorderItems}
                      onPrdClick={setPrdModal}
                      onFazNameChange={updateFazName}
                      onFazDelete={deleteFaz}
                      index={idx}
                      isFilterActive={isFilterActive}
                      phaseDragHandleProps={dragHandleProps}
                      isCompact={isCompact}
                      columns={columns}
                      claudeFeatureCmd={claudeFeatureCmd}
                    />
                  )}
                </SortablePhase>
              )
            )}
          </SortableContext>

          <DragOverlay>
            {activePhaseDrag && fazConfig[activePhaseDrag] ? (
              <div className={cn(
                'px-4 py-2.5 rounded-lg border bg-card shadow-lg border-l-[3px]',
                fazConfig[activePhaseDrag].color
              )}>
                <span className={cn('text-sm font-bold tracking-tight', fazConfig[activePhaseDrag].text)}>
                  {fazConfig[activePhaseDrag].name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add New Faz */}
        <button
          onClick={addNewFaz}
          className="w-full h-11 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors mb-5"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Faz Ekle
        </button>

        {/* Changelog */}
        <ChangelogSection
          changelog={changelog}
          onUpdate={updateChangelog}
          onDelete={deleteChangelog}
          onAdd={addChangelog}
          isCompact={isCompact}
        />

        {/* Footer */}
        <div className="mt-6 pb-4 text-center">
          <p className="text-[10px] font-mono-code text-muted-foreground/60 uppercase tracking-widest">
            Roadmap Editor v2.0 — VS Code
          </p>
        </div>
      </main>

      {/* PRD Modal */}
      <PrdModal prdRange={prdModal} open={!!prdModal} onClose={() => setPrdModal(null)} />

      {/* Komut Ekle Dialog */}
      <Dialog open={cmdDialogOpen} onOpenChange={setCmdDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4 text-primary" />
              Ozel Komut Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Komut Adi</label>
              <Input
                value={newCmdName}
                onChange={(e) => setNewCmdName(e.target.value)}
                placeholder="orn: Dev Server"
                className="h-8 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addCustomCommand()}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Komut</label>
              <Input
                value={newCmdText}
                onChange={(e) => setNewCmdText(e.target.value)}
                placeholder="orn: npm run dev"
                className="h-8 text-xs font-mono-code"
                onKeyDown={(e) => e.key === 'Enter' && addCustomCommand()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCmdDialogOpen(false)} className="text-xs">Iptal</Button>
            <Button size="sm" onClick={addCustomCommand} disabled={!newCmdName.trim() || !newCmdText.trim()} className="text-xs">Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Roadmap Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Roadmap Sifirla
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mevcut ROADMAP.md dosyaniz yedeklenecek ve yeni bos bir roadmap olusturulacak.
              Yedekler "Ayarlar &gt; Yedekler" sekmesinden geri yuklenebilir.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(false)} className="text-xs">Iptal</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                setResetting(true)
                try {
                  await api.resetRoadmap()
                  setResetDialogOpen(false)
                  setLoading(true)
                  loadData()
                } catch (err) {
                  console.error('Reset roadmap error:', err)
                } finally {
                  setResetting(false)
                }
              }}
              disabled={resetting}
              className="text-xs gap-1.5"
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Sifirla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
