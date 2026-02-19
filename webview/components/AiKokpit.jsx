import { useState, useEffect, useMemo } from 'react'
import {
  Zap, Play, Square, SkipForward, Loader2,
  CheckCircle2, XCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { api, onMessage } from '../vscodeApi'

export function AiKokpit({ data, fazConfig, fazOrder, columns, gorevTurleri, onTaskStatusUpdate }) {
  const [kokpitDurum, setKokpitDurum] = useState(null)
  const [secilenler, setSecilenler] = useState(new Set())
  const [baslatiliyor, setBaslatiliyor] = useState(false)

  // Push dinleyicileri
  useEffect(() => {
    const c1 = onMessage('kokpitDurumDegisti', (msg) => {
      setKokpitDurum(msg.durum)
      if (msg.durum.durum !== 'calisiyor') setBaslatiliyor(false)
    })
    const c2 = onMessage('kokpitGorevTamamlandi', (msg) => {
      if (msg.basarili && onTaskStatusUpdate) {
        onTaskStatusUpdate(msg.fazKey, msg.gorevId, { durum: '\u2705' })
      }
    })
    return () => { c1(); c2() }
  }, [onTaskStatusUpdate])

  // Ilk durum yukle
  useEffect(() => {
    api.kokpitDurumAl().then(d => setKokpitDurum(d)).catch(() => {})
  }, [])

  // Status sutunlari
  const statusKeys = useMemo(() => columns.filter(c => c.type === 'status').map(c => c.key), [columns])

  // Tamamlanmamis yaprak gorevleri topla (3 seviye derinlik)
  const gorevlerByFaz = useMemo(() => {
    const isDone = (node) => statusKeys.length > 0 && statusKeys.every(k => node[k] === '\u2705')
    const toGorev = (node, fazKey, parentPrd) => ({
      id: node.id, fazKey,
      ozellik: node.ozellik || node.id,
      prd: node.prd || parentPrd || '',
      tur: node.tur || '',
    })

    const result = {}
    for (const fazKey of fazOrder) {
      const items = data[fazKey] || []
      const gorevler = []
      for (const item of items) {
        if (item.children?.length > 0) {
          for (const child of item.children) {
            if (child.children?.length > 0) {
              for (const grandchild of child.children) {
                if (!isDone(grandchild)) gorevler.push(toGorev(grandchild, fazKey, child.prd || item.prd))
              }
            } else {
              if (!isDone(child)) gorevler.push(toGorev(child, fazKey, item.prd))
            }
          }
        } else {
          if (!isDone(item)) gorevler.push(toGorev(item, fazKey, ''))
        }
      }
      if (gorevler.length > 0) result[fazKey] = gorevler
    }
    return result
  }, [data, fazOrder, statusKeys])

  const tumGorevler = useMemo(() => Object.values(gorevlerByFaz).flat(), [gorevlerByFaz])

  const toggleGorev = (id) => {
    setSecilenler(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const tumunuSec = () => {
    if (secilenler.size === tumGorevler.length) setSecilenler(new Set())
    else setSecilenler(new Set(tumGorevler.map(g => g.id)))
  }

  const handleBaslat = async () => {
    const kuyruk = tumGorevler.filter(g => secilenler.has(g.id))
    if (kuyruk.length === 0) return
    setBaslatiliyor(true)
    try {
      await api.kokpitBaslat(kuyruk)
    } catch {
      setBaslatiliyor(false)
    }
  }

  const calisiyor = kokpitDurum?.durum === 'calisiyor'
  const bitti = kokpitDurum?.durum === 'tamamlandi'
  const aktifGorev = kokpitDurum?.kuyruk?.[kokpitDurum?.aktifGorevIndex]
  const tamamlananlar = kokpitDurum?.tamamlananlar || []
  const toplam = kokpitDurum?.toplam || 0
  const ilerleme = toplam > 0 ? Math.round((tamamlananlar.length / toplam) * 100) : 0

  return (
    <div className="mb-4 rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Zap className={cn('w-3.5 h-3.5', calisiyor ? 'text-amber-500 animate-pulse' : 'text-muted-foreground')} />
          <span className="text-xs font-bold tracking-tight">AI Kokpit</span>
          {calisiyor && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              {tamamlananlar.length + 1}/{toplam}
            </span>
          )}
          {bitti && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Tamamlandi
            </span>
          )}
        </div>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Gorev secimi (bosta iken) */}
        {!calisiyor && !bitti && (
          <>
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={secilenler.size === tumGorevler.length && tumGorevler.length > 0}
                onChange={tumunuSec}
                className="rounded border-border accent-primary"
              />
              Tumunu sec ({tumGorevler.length})
            </label>

            <div className="max-h-60 overflow-y-auto space-y-2 -mx-1 px-1">
              {fazOrder.map(fazKey => {
                const gorevler = gorevlerByFaz[fazKey]
                if (!gorevler) return null
                return (
                  <div key={fazKey}>
                    <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">
                      {fazConfig[fazKey]?.name || fazKey}
                    </div>
                    <div className="space-y-px">
                      {gorevler.map(g => (
                        <label
                          key={g.id}
                          className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={secilenler.has(g.id)}
                            onChange={() => toggleGorev(g.id)}
                            className="rounded border-border accent-primary shrink-0"
                          />
                          <span className="text-[11px] truncate">{g.ozellik}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleBaslat}
              disabled={secilenler.size === 0 || baslatiliyor}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {baslatiliyor ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Baslat ({secilenler.size})
            </button>
          </>
        )}

        {/* Calisiyor */}
        {calisiyor && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-mono">{tamamlananlar.length}/{toplam}</span>
                <span className="text-[10px] text-muted-foreground font-mono">%{ilerleme}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${ilerleme}%` }}
                />
              </div>
            </div>

            {aktifGorev && (
              <div className="flex items-center gap-2 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                <span className="text-[11px] font-medium truncate">{aktifGorev.ozellik}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => api.kokpitAtla()}
                className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md border text-[11px] font-medium hover:bg-muted transition-colors"
              >
                <SkipForward className="w-3 h-3" />
                Atla
              </button>
              <button
                onClick={() => api.kokpitDurdur()}
                className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md border border-destructive/30 text-destructive text-[11px] font-medium hover:bg-destructive/10 transition-colors"
              >
                <Square className="w-3 h-3" />
                Durdur
              </button>
            </div>
          </>
        )}

        {/* Tamamlananlar listesi */}
        {tamamlananlar.length > 0 && (
          <div className="space-y-0.5">
            {tamamlananlar.map(t => (
              <div key={t.id} className="flex items-center gap-2 py-0.5">
                {t.basarili
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                }
                <span className={cn(
                  'text-[11px] truncate',
                  t.basarili ? 'text-foreground/80' : 'text-red-500/70 line-through'
                )}>
                  {t.ozellik}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sifirla butonu */}
        {bitti && (
          <button
            onClick={() => { api.kokpitDurdur(); setKokpitDurum(null); setSecilenler(new Set()) }}
            className="w-full flex items-center justify-center gap-1.5 h-7 rounded-md border text-[11px] font-medium hover:bg-muted transition-colors"
          >
            Sifirla
          </button>
        )}
      </div>
    </div>
  )
}
