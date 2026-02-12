import { useState, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import { Eye } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { api } from '../vscodeApi'

export function PrdModal({ prdRange, open, onClose }) {
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
