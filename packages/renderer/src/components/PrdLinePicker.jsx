import { useState, useEffect, useRef, useMemo } from 'react'
import { FileText, FolderOpen, Check } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { api } from '../api'
import { cn, parsePrdRef, buildPrdRef, computePrdHash } from '../lib/utils'

export function PrdLinePicker({ open, onClose, prdRef, onConfirm, onRefCorrected }) {
  const [filename, setFilename] = useState('')
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(false)
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const containerRef = useRef(null)
  const didScroll = useRef(false)

  // Reset state when opened
  useEffect(() => {
    if (open) {
      const p = parsePrdRef(prdRef)
      setFilename(p ? p.filename : '')
      setStart(p ? p.start : null)
      setEnd(p ? p.end : null)
      didScroll.current = false
    }
  }, [open, prdRef])

  // Hash dogrulamasi: mevcut referansta hash varsa arka planda dogrula
  useEffect(() => {
    if (!open || !prdRef) return
    const p = parsePrdRef(prdRef)
    if (!p || !p.hash) return
    api.prdLines(p.start, p.end, p.filename, p.hash).then(result => {
      if (result.duzeltildi) {
        setStart(result.start)
        setEnd(result.end)
        if (onRefCorrected) {
          onRefCorrected(buildPrdRef(p.filename, result.start, result.end, result.hash))
        }
      }
    }).catch(() => {})
  }, [open, prdRef])

  // Load file content
  useEffect(() => {
    if (!open || !filename) { setLines([]); return }
    setLoading(true)
    api.prdLoad(filename)
      .then(data => { setLines(data.lines || []); setLoading(false) })
      .catch(() => { setLines([]); setLoading(false) })
  }, [filename, open])

  // Scroll to start line after initial load
  useEffect(() => {
    if (!loading && lines.length > 0 && start && !didScroll.current) {
      didScroll.current = true
      setTimeout(() => {
        const el = containerRef.current?.querySelector(`[data-line="${start}"]`)
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 50)
    }
  }, [loading, lines.length])

  const handleLineClick = (lineNum) => {
    if (start === null || (start !== null && end !== null)) {
      // Yeni secim baslat
      setStart(lineNum)
      setEnd(null)
    } else {
      // Bitis satirini sec
      if (lineNum >= start) {
        setEnd(lineNum)
      } else {
        setEnd(start)
        setStart(lineNum)
      }
    }
  }

  const handleFileChange = async () => {
    const f = await api.dosyaSec()
    if (f) {
      setFilename(f)
      setStart(null)
      setEnd(null)
      didScroll.current = false
    }
  }

  const handleConfirm = () => {
    if (start !== null && filename) {
      const finalEnd = end || start
      const selectedLines = lines.slice(start - 1, finalEnd)
      const hash = computePrdHash(selectedLines.join('\n'))
      onConfirm(filename, start, finalEnd, hash)
    }
  }

  const isInRange = (lineNum) => {
    if (start === null) return false
    if (end === null) return lineNum === start
    return lineNum >= start && lineNum <= end
  }

  const waitingEnd = start !== null && end === null

  const selectionText = start !== null
    ? end !== null && end !== start
      ? `Satir ${start} – ${end}`
      : `Satir ${start}`
    : null

  const hint = !filename
    ? null
    : start === null
      ? 'Baslangic satirina tiklayin'
      : end === null
        ? 'Bitis satirina tiklayin'
        : 'Secim tamamlandi — onaylayabilirsiniz'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            {filename ? (
              <span className="font-mono-code truncate text-foreground">{filename}</span>
            ) : (
              <span className="text-muted-foreground">Dosya seciniz</span>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 ml-auto shrink-0" onClick={handleFileChange}>
              <FolderOpen className="w-3 h-3" />
              {filename ? 'Degistir' : 'Sec'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="flex-1 overflow-auto rounded-md border bg-muted/10 font-mono-code text-[12px] leading-relaxed min-h-[300px] max-h-[450px]"
        >
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Yukleniyor...</div>
          ) : !filename ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground/60 mb-4">Referans icin bir dosya secin</p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleFileChange}>
                <FolderOpen className="w-3.5 h-3.5" />
                Dosya Sec
              </Button>
            </div>
          ) : lines.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Dosya bos veya okunamadi</div>
          ) : (
            lines.map((line, i) => {
              const num = i + 1
              const inRange = isInRange(num)
              const isStart = num === start
              const isEnd = num === (end || start)
              return (
                <div
                  key={i}
                  data-line={num}
                  onClick={() => handleLineClick(num)}
                  className={cn(
                    'flex cursor-pointer select-none border-l-2 border-transparent transition-colors',
                    inRange
                      ? 'bg-primary/10 border-l-primary'
                      : 'hover:bg-muted/50',
                    (isStart || isEnd) && inRange && 'bg-primary/20',
                  )}
                >
                  <span
                    className={cn(
                      'w-12 shrink-0 text-right pr-3 py-px select-none transition-colors',
                      inRange
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground/40 hover:text-primary/60',
                    )}
                  >
                    {num}
                  </span>
                  <span className={cn('flex-1 py-px pr-3 whitespace-pre', inRange && 'text-foreground')}>
                    {line || ' '}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-3">
          <div className="flex flex-col items-start gap-0.5 min-w-0">
            {selectionText && (
              <span className="text-xs font-mono-code text-primary font-bold">{selectionText}</span>
            )}
            {hint && (
              <span className={cn('text-[11px]', waitingEnd ? 'text-amber-500' : 'text-muted-foreground/60')}>{hint}</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onClose}>Iptal</Button>
            <Button size="sm" onClick={handleConfirm} disabled={start === null || !filename} className="gap-1">
              <Check className="w-3 h-3" />
              Onayla
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
