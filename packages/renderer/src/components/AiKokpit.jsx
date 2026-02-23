import { useState, useEffect, useMemo } from 'react'
import {
  Zap, Play, Square, SkipForward, Loader2,
  CheckCircle2, XCircle, ChevronRight, Layers,
  RotateCcw,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { api, onMessage } from '../api'
import { getGorevTuruIcon } from './TaskTypeBadge'
import { GOREV_TURU_COLORS } from '../lib/constants'

export function AiKokpit({ data, fazConfig, fazOrder, columns, gorevTurleri, isCompact, onTaskStatusUpdate }) {
  const [kokpitDurum, setKokpitDurum] = useState(null)
  const [secilenler, setSecilenler] = useState(new Set())
  const [baslatiliyor, setBaslatiliyor] = useState(false)
  const [aktifSekme, setAktifSekme] = useState('tumu')

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

  const statusKeys = useMemo(
    () => columns.filter(c => c.type === 'status').map(c => c.key),
    [columns]
  )

  // Tamamlanmamis yaprak gorevleri topla — parentOzellik ile birlikte
  const tumGorevler = useMemo(() => {
    const isDone = (node) => statusKeys.length > 0 && statusKeys.every(k => node[k] === '\u2705')
    const result = []
    for (const fazKey of fazOrder) {
      const items = data[fazKey] || []
      for (const item of items) {
        if (item.children?.length > 0) {
          for (const child of item.children) {
            if (child.children?.length > 0) {
              for (const gc of child.children) {
                if (!isDone(gc)) result.push({
                  id: gc.id, fazKey,
                  ozellik: gc.ozellik || gc.id,
                  prd: gc.prd || child.prd || item.prd || '',
                  tur: gc.tur || '',
                  parentOzellik: item.ozellik || null,
                })
              }
            } else {
              if (!isDone(child)) result.push({
                id: child.id, fazKey,
                ozellik: child.ozellik || child.id,
                prd: child.prd || item.prd || '',
                tur: child.tur || '',
                parentOzellik: item.ozellik || null,
              })
            }
          }
        } else {
          if (!isDone(item)) result.push({
            id: item.id, fazKey,
            ozellik: item.ozellik || item.id,
            prd: item.prd || '',
            tur: item.tur || '',
            parentOzellik: null,
          })
        }
      }
    }
    return result
  }, [data, fazOrder, statusKeys])

  // Parent arama tablosu (calisiyor/tamamlanan durumda kullanilir)
  const parentLookup = useMemo(() => {
    const map = new Map()
    for (const g of tumGorevler) map.set(g.id, g.parentOzellik)
    return map
  }, [tumGorevler])

  // Sekme tanimlari — sadece gorev iceren turler
  const sekmeler = useMemo(() => {
    const counts = {}
    for (const g of tumGorevler) {
      if (g.tur) counts[g.tur] = (counts[g.tur] || 0) + 1
    }
    const tabs = [{ key: 'tumu', label: 'Tumu', count: tumGorevler.length, color: null, icon: null }]
    for (const t of gorevTurleri) {
      if (counts[t.key] > 0) tabs.push({ key: t.key, label: t.label, count: counts[t.key], color: t.color, icon: t.icon })
    }
    return tabs
  }, [tumGorevler, gorevTurleri])

  // Aktif sekmeye gore filtrele
  const filtrelenmis = useMemo(() => {
    if (aktifSekme === 'tumu') return tumGorevler
    return tumGorevler.filter(g => g.tur === aktifSekme)
  }, [tumGorevler, aktifSekme])

  // Parent'a gore grupla
  const gruplar = useMemo(() => {
    const groups = []
    const map = new Map()
    for (const g of filtrelenmis) {
      const key = g.parentOzellik || '__standalone__'
      if (!map.has(key)) {
        const group = { parent: g.parentOzellik, gorevler: [] }
        map.set(key, group)
        groups.push(group)
      }
      map.get(key).gorevler.push(g)
    }
    return groups
  }, [filtrelenmis])

  const toggleGorev = (id) => {
    setSecilenler(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleFiltreli = () => {
    const ids = filtrelenmis.map(g => g.id)
    const hepsi = ids.length > 0 && ids.every(id => secilenler.has(id))
    setSecilenler(prev => {
      const next = new Set(prev)
      if (hepsi) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  const handleBaslat = async () => {
    const kuyruk = tumGorevler
      .filter(g => secilenler.has(g.id))
      .map(({ id, fazKey, ozellik, prd, tur }) => ({ id, fazKey, ozellik, prd, tur }))
    if (kuyruk.length === 0) return
    setBaslatiliyor(true)
    try { await api.kokpitBaslat(kuyruk) }
    catch { setBaslatiliyor(false) }
  }

  const calisiyor = kokpitDurum?.durum === 'calisiyor'
  const bitti = kokpitDurum?.durum === 'tamamlandi'
  const aktifGorev = kokpitDurum?.kuyruk?.[kokpitDurum?.aktifGorevIndex]
  const tamamlananlar = kokpitDurum?.tamamlananlar || []
  const toplam = kokpitDurum?.toplam || 0
  const ilerleme = toplam > 0 ? Math.round((tamamlananlar.length / toplam) * 100) : 0
  const toplamSecim = tumGorevler.filter(g => secilenler.has(g.id)).length
  const hepsiSecili = filtrelenmis.length > 0 && filtrelenmis.every(g => secilenler.has(g.id))

  return (
    <div className={cn(
      'mb-4 rounded-lg border bg-card overflow-hidden transition-colors',
      calisiyor && 'border-amber-500/25',
      bitti && 'border-emerald-500/25',
    )}>
      {/* Gradient accent */}
      <div className={cn(
        'h-px',
        calisiyor ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
          : bitti ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
          : 'bg-gradient-to-r from-transparent via-primary/40 to-transparent'
      )} />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-6 h-6 rounded-md flex items-center justify-center',
            calisiyor ? 'bg-amber-500/10' : bitti ? 'bg-emerald-500/10' : 'bg-muted/80'
          )}>
            <Zap className={cn(
              'w-3.5 h-3.5',
              calisiyor ? 'text-amber-500 animate-pulse' : bitti ? 'text-emerald-500' : 'text-muted-foreground'
            )} />
          </div>
          <span className="text-xs font-bold tracking-tight">AI Kokpit</span>
        </div>
        {calisiyor && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium tabular-nums">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            {tamamlananlar.length + 1}/{toplam}
          </span>
        )}
        {bitti && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Tamamlandi
          </span>
        )}
      </div>

      {/* ─── BOSTA ─── */}
      {!calisiyor && !bitti && (
        <>
          {/* Tur sekmeleri */}
          {sekmeler.length > 1 && (
            <div
              className="flex items-center gap-0.5 px-2 pb-2 overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {sekmeler.map(tab => {
                const active = aktifSekme === tab.key
                const colors = tab.color ? GOREV_TURU_COLORS[tab.color] : null
                const TabIcon = tab.icon ? getGorevTuruIcon(tab.icon) : Layers
                return (
                  <button
                    key={tab.key}
                    onClick={() => setAktifSekme(tab.key)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all shrink-0',
                      active
                        ? colors ? cn(colors.bg, colors.text) : 'bg-muted text-foreground'
                        : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <TabIcon className="w-3 h-3" />
                    {!isCompact && <span>{tab.label}</span>}
                    <span className="font-mono opacity-70">{tab.count}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Sec cubugu */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-dashed border-border/60">
            <label className="flex items-center gap-2 cursor-pointer text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors select-none">
              <input
                type="checkbox"
                checked={hepsiSecili}
                onChange={toggleFiltreli}
                className="rounded border-border accent-primary"
              />
              Tumunu sec
            </label>
            {toplamSecim > 0 && (
              <span className="text-[10px] font-mono text-primary/80 tabular-nums">{toplamSecim} secili</span>
            )}
          </div>

          {/* Gorev listesi */}
          {filtrelenmis.length > 0 ? (
            <div className="max-h-64 overflow-y-auto px-2 py-1.5 space-y-2">
              {gruplar.map((grup, i) => (
                <div key={grup.parent || i}>
                  {grup.parent && (
                    <div className="flex items-center gap-1.5 px-1 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 shrink-0" />
                      <span className="text-[10px] font-semibold text-muted-foreground/50 truncate">{grup.parent}</span>
                    </div>
                  )}
                  <div className={cn(grup.parent && 'ml-2.5 border-l border-border/40 pl-1.5')}>
                    {grup.gorevler.map(g => {
                      const tc = gorevTurleri.find(t => t.key === g.tur)
                      const tColor = tc ? GOREV_TURU_COLORS[tc.color] : null
                      const TIcon = tc ? getGorevTuruIcon(tc.icon) : null
                      const checked = secilenler.has(g.id)
                      return (
                        <label
                          key={g.id}
                          className={cn(
                            'flex items-center gap-2 py-1 px-1.5 rounded-md cursor-pointer transition-colors',
                            checked ? 'bg-primary/5' : 'hover:bg-muted/40'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleGorev(g.id)}
                            className="rounded border-border accent-primary shrink-0"
                          />
                          {TIcon && aktifSekme === 'tumu' && (
                            <TIcon className={cn('w-3 h-3 shrink-0', tColor?.text || 'text-muted-foreground/40')} />
                          )}
                          <span className="text-[11px] truncate">{g.ozellik}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center">
              <Zap className="w-5 h-5 text-muted-foreground/15 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground/40">Tamamlanmamis gorev yok</p>
            </div>
          )}

          {/* Baslat */}
          <div className="px-3 py-2.5 border-t">
            <button
              onClick={handleBaslat}
              disabled={toplamSecim === 0 || baslatiliyor}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-8 rounded-lg text-[11px] font-semibold transition-all',
                toplamSecim > 0
                  ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                  : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              {baslatiliyor
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Play className="w-3.5 h-3.5" />
              }
              Baslat
              {toplamSecim > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-primary-foreground/20 text-[9px] font-mono">{toplamSecim}</span>
              )}
            </button>
          </div>
        </>
      )}

      {/* ─── CALISIYOR ─── */}
      {calisiyor && (
        <div className="border-t px-3 py-3 space-y-3">
          {/* Ilerleme */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-medium">Ilerleme</span>
              <div>
                <span className="text-base font-bold tabular-nums">{ilerleme}</span>
                <span className="text-[10px] text-muted-foreground/50">%</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 transition-all duration-700 ease-out"
                style={{ width: `${ilerleme}%` }}
              />
            </div>
            <p className="text-[9px] font-mono text-muted-foreground/35 mt-1 tabular-nums">{tamamlananlar.length} / {toplam} gorev</p>
          </div>

          {/* Aktif gorev */}
          {aktifGorev && (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-2.5">
              {parentLookup.get(aktifGorev.id) && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] text-muted-foreground/40 truncate">{parentLookup.get(aktifGorev.id)}</span>
                  <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/20 shrink-0" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                <span className="text-[11px] font-medium truncate">{aktifGorev.ozellik}</span>
              </div>
            </div>
          )}

          {/* Kontroller */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => api.kokpitAtla()}
              className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md border text-[11px] font-medium hover:bg-muted/80 transition-colors"
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
        </div>
      )}

      {/* ─── TAMAMLANANLAR ─── */}
      {tamamlananlar.length > 0 && (
        <div className="border-t px-3 py-2.5">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-medium mb-1.5">Tamamlanan</p>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {tamamlananlar.map(t => {
              const parent = parentLookup.get(t.id)
              return (
                <div key={t.id} className="flex items-center gap-2 py-0.5">
                  {t.basarili
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    : <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  }
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    {parent && (
                      <>
                        <span className="text-[9px] text-muted-foreground/30 shrink-0 max-w-[70px] truncate">{parent}</span>
                        <ChevronRight className="w-2 h-2 text-muted-foreground/15 shrink-0" />
                      </>
                    )}
                    <span className={cn(
                      'text-[10px] truncate',
                      t.basarili ? 'text-foreground/60' : 'text-red-500/50 line-through'
                    )}>
                      {t.ozellik}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── BITTI — Sifirla ─── */}
      {bitti && (
        <div className="border-t px-3 py-2.5">
          <button
            onClick={() => { api.kokpitDurdur(); setKokpitDurum(null); setSecilenler(new Set()) }}
            className="w-full flex items-center justify-center gap-1.5 h-7 rounded-md border text-[11px] font-medium hover:bg-muted/80 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Sifirla
          </button>
        </div>
      )}
    </div>
  )
}
