import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../lib/utils'

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

export function ChangelogSection({ changelog, onUpdate, onDelete, onAdd, isCompact }) {
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
