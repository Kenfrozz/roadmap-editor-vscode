import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { ClaudeIcon } from './ClaudeIcon'
import { api } from '../vscodeApi'

export function EkTablo({ title, icon: Icon, iconColor, borderColor, items, onAdd, onUpdate, onDelete, isCompact }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn('rounded-lg border bg-card mb-5 border-l-[3px]', borderColor)}>
      {/* Header */}
      <div className="flex items-center justify-between py-2.5 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-0.5 rounded-md hover:bg-muted transition-colors"
          >
            {collapsed
              ? <ChevronRight className={cn('w-4 h-4', iconColor)} />
              : <ChevronDown className={cn('w-4 h-4', iconColor)} />
            }
          </button>
          <Icon className={cn('w-4 h-4 shrink-0', iconColor)} />
          <span className={cn('text-sm font-bold tracking-tight', iconColor)}>{title}</span>
          <span className={cn(
            'text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground'
          )}>
            {items.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      {!collapsed && (
        <div>
          {/* Column Headers */}
          {!isCompact && items.length > 0 && (
            <div className="flex items-center border-b border-t border-border/50 bg-card/95 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2">
              <div className="w-[40%] min-w-0">Baslik</div>
              <div className="flex-1 min-w-0">Aciklama</div>
              <div className="w-16 shrink-0"></div>
            </div>
          )}

          {/* Rows */}
          {items.map((item) => (
            <EkTabloRow
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isCompact={isCompact}
              title={title}
            />
          ))}

          {/* Empty State */}
          {items.length === 0 && (
            <div className="py-8 text-center border-t border-border/30">
              <Icon className={cn('w-5 h-5 mx-auto mb-2 opacity-20', iconColor)} />
              <p className="text-xs text-muted-foreground/50 font-mono-code mb-3">henuz kayit yok</p>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onAdd}>
                <Plus className="w-3 h-3" />
                Ekle
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EkTabloRow({ item, onUpdate, onDelete, isCompact, title }) {
  const [editingField, setEditingField] = useState(null)
  const [tempValue, setTempValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingField])

  const startEdit = (field) => {
    setEditingField(field)
    setTempValue(item[field] || '')
  }

  const saveEdit = () => {
    if (editingField) {
      onUpdate(item.id, editingField, tempValue)
      setEditingField(null)
    }
  }

  const sendToClaude = () => {
    const baslik = item.baslik || ''
    const aciklama = item.aciklama || ''
    if (!baslik && !aciklama) return
    const prompt = aciklama ? `${baslik}: ${aciklama}` : baslik
    const cmd = `claude "${prompt}"`
    const terminalName = baslik ? `Claude: ${baslik}` : `Claude: ${title}`
    api.runTerminal(cmd, terminalName)
  }

  const renderCell = (field, placeholder, className) => {
    if (editingField === field) {
      return (
        <input
          ref={inputRef}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') setEditingField(null)
          }}
          className="w-full h-7 px-2 bg-muted/50 rounded text-xs outline-none ring-1 ring-primary/30"
          placeholder={placeholder}
        />
      )
    }
    return (
      <button
        className={cn(
          'w-full text-left text-xs truncate px-2 py-1.5 rounded hover:bg-muted/50 transition-colors min-h-[28px]',
          !item[field] && 'text-muted-foreground/30 italic',
          className
        )}
        onClick={() => startEdit(field)}
      >
        {item[field] || placeholder}
      </button>
    )
  }

  if (isCompact) {
    return (
      <div className="border-t border-border/30 px-3 py-2 space-y-1">
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            {renderCell('baslik', 'Baslik...', 'font-medium')}
          </div>
          <button
            onClick={sendToClaude}
            disabled={!item.baslik && !item.aciklama}
            className="p-1 rounded-md text-muted-foreground/30 hover:text-[#D97757] transition-colors shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
            title="Claude'a gonder"
          >
            <ClaudeIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        <div>{renderCell('aciklama', 'Aciklama...')}</div>
      </div>
    )
  }

  return (
    <div className="flex items-center border-t border-border/30 px-4 group/row hover:bg-muted/30 transition-colors">
      <div className="w-[40%] min-w-0 py-0.5">
        {renderCell('baslik', 'Baslik...', 'font-medium')}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        {renderCell('aciklama', 'Aciklama...')}
      </div>
      <div className="w-16 shrink-0 flex justify-end gap-0.5">
        <button
          onClick={sendToClaude}
          disabled={!item.baslik && !item.aciklama}
          className="p-1 rounded-md text-muted-foreground/30 opacity-0 group-hover/row:opacity-100 hover:text-[#D97757] transition-all disabled:opacity-0 disabled:cursor-not-allowed"
          title="Claude'a gonder"
        >
          <ClaudeIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 rounded-md text-muted-foreground/30 opacity-0 group-hover/row:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
