import { useState, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import { Eye } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { api } from '../vscodeApi'
import { parsePrdRef } from '../lib/utils'

export function PrdModal({ prdRange, open, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const parsed = useMemo(() => parsePrdRef(prdRange), [prdRange])

  useEffect(() => {
    if (!parsed || !open) return
    setLoading(true)

    api.prdLines(parsed.start, parsed.end, parsed.filename)
      .then(data => { setContent(data.excerpt || ''); setLoading(false) })
      .catch(() => { setContent('Hata olustu'); setLoading(false) })
  }, [prdRange, open])

  const renderedHtml = useMemo(() => {
    if (!content) return ''
    return marked.parse(content, { breaks: true, gfm: true })
  }, [content])

  const displayName = parsed ? parsed.filename : 'PRD.md'
  const displayRange = parsed ? `${parsed.start}${parsed.end !== parsed.start ? `-${parsed.end}` : ''}` : ''

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono-code text-sm">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">{displayName}</span>
            <span>Satir {displayRange}</span>
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
