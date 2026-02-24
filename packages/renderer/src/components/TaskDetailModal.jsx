import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { FileText, ChevronLeft, ChevronRight, ListTree, CalendarDays, Check, Clock, X, Minus, Loader2, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Calendar } from './ui/calendar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { TaskTypeBadge } from './TaskTypeBadge'
import { cn, parsePrdRef } from '../lib/utils'
import { STATUS_OPTIONS } from '../lib/constants'
import { parseDate } from '../lib/hooks'

const STATUS_ICON_MAP = { Check, Clock, X, Minus }

function findItemDeep(items, itemId) {
  for (const item of items) {
    if (item.id === itemId) return item
    if (item.children?.length > 0) {
      const found = findItemDeep(item.children, itemId)
      if (found) return found
    }
  }
  return null
}

export function TaskDetailModal({
  itemId,
  fazKey,
  data,
  columns,
  gorevTurleri,
  open,
  onClose,
  onUpdate,
  onPrdClick,
  saveStatus,
  onAddSubtask,
  onDelete,
}) {
  const [history, setHistory] = useState([])

  const currentId = history.length > 0 ? history[history.length - 1] : itemId
  const item = useMemo(() => {
    if (!fazKey || !currentId || !data?.[fazKey]) return null
    return findItemDeep(data[fazKey], currentId)
  }, [data, fazKey, currentId])

  const statusCols = useMemo(() => columns.filter(c => c.type === 'status'), [columns])
  const dateCols = useMemo(() => columns.filter(c => c.type === 'date'), [columns])
  const textCols = useMemo(() => columns.filter(c => c.type === 'text' && c.key !== 'ozellik' && c.key !== 'prd' && c.key !== 'detay' && c.key !== 'not'), [columns])

  const handleClose = () => {
    setHistory([])
    onClose()
  }

  const navigateToChild = (childId) => {
    setHistory(prev => [...prev, childId])
  }

  const navigateBack = () => {
    setHistory(prev => prev.slice(0, -1))
  }

  if (!item) return null

  const isNavigated = history.length > 0
  const hasChildren = item.children?.length > 0

  const handlePrdClick = () => {
    if (onPrdClick) onPrdClick(fazKey, item.id, item.prd)
  }

  const allDoneForChild = (child) => {
    return statusCols.length > 0 && statusCols.every(sc => child[sc.key] === '\u2705')
  }

  const getStatusSummary = (child) => {
    if (statusCols.length === 0) return null
    const allDone = statusCols.every(sc => child[sc.key] === '\u2705')
    const anyProgress = statusCols.some(sc => child[sc.key] === '\u26A0\uFE0F')
    if (allDone) return STATUS_OPTIONS[0]
    if (anyProgress) return STATUS_OPTIONS[1]
    return STATUS_OPTIONS[2]
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogDescription className="sr-only">Gorev detaylarini duzenle</DialogDescription>
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2 pr-6">
            {isNavigated && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={navigateBack}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            {gorevTurleri && isNavigated && (
              <TaskTypeBadge
                value={item.tur}
                gorevTurleri={gorevTurleri}
                onChange={(v) => onUpdate(fazKey, item.id, 'tur', v)}
              />
            )}
            <DialogTitle className="text-sm font-bold flex-1 min-w-0">
              <Input
                value={item.ozellik || ''}
                onChange={(e) => onUpdate(fazKey, item.id, 'ozellik', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                placeholder="Gorev adi..."
                className="h-8 text-sm font-bold bg-transparent border-none px-1 focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Kayit Gostergesi */}
        <div className="flex items-center justify-end px-5 pt-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            {saveStatus === 'saving' && (
              <><Loader2 className="w-3 h-3 animate-spin" /><span>Kaydediliyor...</span></>
            )}
            {saveStatus === 'saved' && (
              <><CheckCircle2 className="w-3 h-3 text-emerald-500/60" /><span>Kaydedildi</span></>
            )}
            {saveStatus === 'unsaved' && (
              <><span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" /><span>Kaydedilmedi</span></>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          {/* Detay */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Detay</label>
            <textarea
              value={item.detay || ''}
              onChange={(e) => onUpdate(fazKey, item.id, 'detay', e.target.value)}
              placeholder="Aciklama ekle..."
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* PRD Referansi */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">PRD Referansi</label>
            <button
              onClick={handlePrdClick}
              className={cn(
                'flex items-center gap-2 h-8 px-3 rounded-md border transition-colors w-full',
                item.prd
                  ? 'border-input text-foreground hover:bg-muted'
                  : 'border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-muted-foreground/50 hover:text-muted-foreground'
              )}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              {item.prd ? (
                <span className="font-mono-code text-xs truncate">
                  {(() => {
                    const parsed = parsePrdRef(item.prd)
                    if (!parsed) return item.prd
                    return `${parsed.filename}:${parsed.start}${parsed.end !== parsed.start ? `-${parsed.end}` : ''}`
                  })()}
                </span>
              ) : (
                <span className="text-xs">PRD referansi ekle</span>
              )}
            </button>
          </div>

          {/* Durum + Tarih — ayni satir */}
          {(statusCols.length > 0 || dateCols.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {statusCols.map(col => {
                const current = STATUS_OPTIONS.find(o => o.value === (item[col.key] || '-')) || STATUS_OPTIONS[3]
                const Icon = STATUS_ICON_MAP[current.icon] || Minus
                return (
                  <div key={col.key}>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{col.label}</label>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 h-8 px-3 rounded-md border border-input w-full transition-colors hover:bg-muted/50">
                          <Icon className={cn('w-3.5 h-3.5 shrink-0', current.textColor)} />
                          <span className={cn('text-xs', current.textColor)}>{current.label}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[140px]">
                        {STATUS_OPTIONS.map(opt => {
                          const OptIcon = STATUS_ICON_MAP[opt.icon] || Minus
                          return (
                            <DropdownMenuItem
                              key={opt.value}
                              onClick={() => onUpdate(fazKey, item.id, col.key, opt.value)}
                              className="gap-2.5 text-xs"
                            >
                              <OptIcon className={cn('w-3.5 h-3.5 shrink-0', opt.textColor)} />
                              <span>{opt.label}</span>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
              {dateCols.map(col => {
                const date = parseDate(item[col.key])
                return (
                  <div key={col.key}>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{col.label}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn(
                          'flex items-center gap-2 h-8 px-3 rounded-md border border-input w-full transition-colors hover:bg-muted/50',
                          date ? 'text-foreground' : 'text-muted-foreground/40'
                        )}>
                          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs">
                            {date ? format(date, 'd MMMM yyyy', { locale: tr }) : 'Tarih sec...'}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => onUpdate(fazKey, item.id, col.key, newDate ? format(newDate, 'yyyy-MM-dd') : '')}
                          initialFocus
                        />
                        {date && (
                          <div className="p-2 border-t">
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={() => onUpdate(fazKey, item.id, col.key, '')}>
                              Tarihi Temizle
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                )
              })}
            </div>
          )}

          {/* Metin Sutunlari */}
          {textCols.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Ek Alanlar</label>
              <div className="space-y-2">
                {textCols.map(col => (
                  <div key={col.key} className="space-y-1">
                    <span className="text-[10px] text-muted-foreground/70">{col.label}</span>
                    <Input
                      value={item[col.key] || ''}
                      onChange={(e) => onUpdate(fazKey, item.id, col.key, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                      placeholder="—"
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* Alt Gorevler */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <ListTree className="w-3 h-3" />
              Alt Gorevler {hasChildren && `(${item.children.length})`}
            </label>
            <div className="rounded-md border border-input overflow-hidden">
              {hasChildren && item.children.map((child) => {
                const status = getStatusSummary(child)
                return (
                  <div
                    key={child.id}
                    className="group/child flex items-center border-b border-border/50"
                  >
                    <button
                      onClick={() => navigateToChild(child.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 px-3 h-9 text-left hover:bg-muted/50 transition-colors"
                    >
                      {status && (
                        <div className={cn('w-2 h-2 rounded-full shrink-0', status.color)} />
                      )}
                      <span className="text-xs flex-1 min-w-0 truncate">
                        {child.ozellik || 'Isimsiz'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(fazKey, child.id)}
                        className="p-1.5 mr-1.5 rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover/child:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )
              })}
              {onAddSubtask && (
                <button
                  onClick={() => onAddSubtask(fazKey, item.id)}
                  className="flex items-center gap-2 w-full px-3 h-9 text-left hover:bg-muted/50 transition-colors text-muted-foreground/50 hover:text-primary"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs">Alt gorev ekle</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
