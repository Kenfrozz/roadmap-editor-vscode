import { useState, useEffect, useCallback, useRef } from 'react'
import {
  GitBranch,
  ArrowUp,
  ArrowDown,
  Loader2,
  X,
  FileEdit,
  FilePlus,
  FileX,
  FileQuestion,
  FileDiff,
  ChevronDown,
  ChevronUp,
  Send,
  Download,
  Check,
  AlertCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { api } from '../api'

const DURUM_ICON = {
  modified: FileEdit,
  added: FilePlus,
  deleted: FileX,
  renamed: FileDiff,
  untracked: FileQuestion,
}

const DURUM_LABEL = {
  modified: 'Duzenlendi',
  added: 'Eklendi',
  deleted: 'Silindi',
  renamed: 'Yeniden adlandirildi',
  untracked: 'Yeni dosya',
}

const DURUM_COLOR = {
  modified: 'text-amber-500',
  added: 'text-emerald-500',
  deleted: 'text-red-500',
  renamed: 'text-blue-500',
  untracked: 'text-muted-foreground',
}

// Header'daki kucuk git durum gostergesi (sadece gosterim, state disaridan gelir)
export function GitStatusBadge({ durum, onClick }) {
  if (!durum || !durum.isRepo) return null

  const hasChanges = durum.changedCount > 0
  const canPush = durum.ahead > 0
  const canPull = durum.behind > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] font-mono-code transition-colors',
        hasChanges
          ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
          : 'text-muted-foreground hover:bg-muted'
      )}
      title="Git panelini ac"
    >
      <GitBranch className="w-3 h-3" />
      <span className="max-w-[80px] truncate">{durum.branch}</span>
      {hasChanges && (
        <span className="px-1 min-w-[16px] h-4 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center">
          {durum.changedCount}
        </span>
      )}
      {canPush && (
        <span className="flex items-center text-[10px] text-emerald-500">
          <ArrowUp className="w-2.5 h-2.5" />{durum.ahead}
        </span>
      )}
      {canPull && (
        <span className="flex items-center text-[10px] text-blue-500">
          <ArrowDown className="w-2.5 h-2.5" />{durum.behind}
        </span>
      )}
    </button>
  )
}

// Acilir git paneli (durum disaridan gelir, sadece dosya listesini kendi ceker)
export function GitPanel({ open, onClose, durum, onRefresh, standalone = false }) {
  const [dosyalar, setDosyalar] = useState([])
  const [mesaj, setMesaj] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [dosyalarOpen, setDosyalarOpen] = useState(false)
  const inputRef = useRef(null)

  const loadDosyalar = useCallback(async () => {
    setLoading(true)
    try {
      const f = await api.gitDegisiklikler()
      setDosyalar(f)
    } catch {
      setDosyalar([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open || standalone) {
      loadDosyalar()
      if (!standalone) setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, standalone, loadDosyalar])

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const afterAction = async () => {
    onRefresh?.()
    await loadDosyalar()
  }

  const handleKaydet = async () => {
    if (!mesaj.trim()) return
    setActionLoading('kaydet')
    try {
      await api.gitKaydet(mesaj.trim())
      setMesaj('')
      showToast('success', 'Degisiklikler kaydedildi')
      await afterAction()
    } catch (err) {
      showToast('error', err.message || 'Kaydetme basarisiz')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePaylas = async () => {
    setActionLoading('paylas')
    try {
      await api.gitPaylas()
      showToast('success', 'Degisiklikler paylasildi')
      await afterAction()
    } catch (err) {
      showToast('error', err.message || 'Paylasma basarisiz')
    } finally {
      setActionLoading(null)
    }
  }

  const handleGuncelle = async () => {
    setActionLoading('guncelle')
    try {
      await api.gitGuncelle()
      showToast('success', 'Guncel hale getirildi')
      await afterAction()
    } catch (err) {
      showToast('error', err.message || 'Guncelleme basarisiz')
    } finally {
      setActionLoading(null)
    }
  }

  if (!open && !standalone) return null

  const hasChanges = durum?.changedCount > 0
  const canPush = durum?.ahead > 0
  const canPull = durum?.behind > 0

  return (
    <div className={cn(
      standalone
        ? 'bg-card rounded-lg border border-border'
        : 'border-b bg-card/95 backdrop-blur-sm animate-fade-up'
    )} style={standalone ? undefined : { animationDuration: '0.15s' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">Kaynak Kontrol</span>
          {durum && (
            <span className="text-[10px] font-mono-code text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
              {durum.branch}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          {!standalone && (
            <button
              onClick={onClose}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium',
          toast.type === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          toast.type === 'error' && 'bg-red-500/10 text-red-600 dark:text-red-400',
        )}>
          {toast.type === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {toast.text}
        </div>
      )}

      {/* Body */}
      <div className="px-3 py-3 space-y-3">
        {/* Commit Section */}
        {hasChanges && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                value={mesaj}
                onChange={(e) => setMesaj(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKaydet()}
                placeholder="Degisiklik aciklamasi..."
                className="flex-1 h-8 px-2.5 rounded-md border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50"
                disabled={actionLoading !== null}
              />
              <button
                onClick={handleKaydet}
                disabled={!mesaj.trim() || actionLoading !== null}
                className={cn(
                  'h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors',
                  mesaj.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {actionLoading === 'kaydet' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Kaydet
              </button>
            </div>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-2">
          {durum?.hasRemote && (
            <>
              <button
                onClick={handlePaylas}
                disabled={actionLoading !== null || (!canPush && !hasChanges)}
                className={cn(
                  'flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors',
                  canPush
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                    : 'text-muted-foreground hover:bg-muted disabled:opacity-40'
                )}
              >
                {actionLoading === 'paylas' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Paylas
                {canPush && <span className="text-[10px] font-mono-code">({durum.ahead})</span>}
              </button>

              <button
                onClick={handleGuncelle}
                disabled={actionLoading !== null}
                className={cn(
                  'flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors',
                  canPull
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                    : 'text-muted-foreground hover:bg-muted disabled:opacity-40'
                )}
              >
                {actionLoading === 'guncelle' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                Guncelle
                {canPull && <span className="text-[10px] font-mono-code">({durum.behind})</span>}
              </button>
            </>
          )}

          {!hasChanges && !canPush && !canPull && (
            <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-500" />
              Her sey guncel
            </span>
          )}
        </div>

        {/* Changed Files (collapsed by default) */}
        {hasChanges && (
          <div>
            <button
              onClick={() => setDosyalarOpen(!dosyalarOpen)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {dosyalarOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{dosyalar.length} degisen dosya</span>
            </button>

            {dosyalarOpen && (
              <div className="mt-1.5 max-h-40 overflow-y-auto space-y-0.5">
                {dosyalar.map((d, i) => {
                  const Icon = DURUM_ICON[d.durum] || FileEdit
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-mono-code hover:bg-muted/50"
                    >
                      <Icon className={cn('w-3 h-3 shrink-0', DURUM_COLOR[d.durum])} />
                      <span className="truncate text-muted-foreground">{d.dosya}</span>
                      <span className="text-[9px] text-muted-foreground/50 shrink-0 ml-auto">
                        {DURUM_LABEL[d.durum]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
