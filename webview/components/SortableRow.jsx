import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, PlusCircle, Eye, MoreVertical } from 'lucide-react'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { StatusDot } from './StatusDot'
import { DatePickerCell } from './DatePickerCell'
import { ClaudeIcon } from './ClaudeIcon'
import { api } from '../vscodeApi'

export function SortablePhase({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled, data: { type: 'phase' } })

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

export function SortableRow({ item, fazKey, onUpdate, onDelete, onAddBelow, onPrdClick, index, isFilterActive, isCompact, columns, claudeFeatureCmd }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, data: { type: 'item', fazKey, item } })
  const [editing, setEditing] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const statusCols = columns.filter(c => c.type === 'status')
  const claudeCmd = claudeFeatureCmd ? claudeFeatureCmd.replace('${ozellik}', item.ozellik || '') : `claude "/kairos:build ${item.ozellik || ''}"`
  const claudeTerminalName = item.ozellik ? `Claude: ${item.ozellik}` : 'Claude Code'

  // Compact iki satirli layout
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
        <div className="flex items-center px-2 py-1">
          <Input
            value={item.ozellik}
            onChange={(e) => onUpdate(fazKey, item.id, 'ozellik', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            placeholder="Ozellik adi..."
            className="h-7 flex-1 text-xs font-medium bg-transparent border-none px-1 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-0.5">
            {statusCols.map(col => (
              <StatusDot key={col.key} value={item[col.key] || '-'} onChange={(v) => onUpdate(fazKey, item.id, col.key, v)} />
            ))}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 rounded-md text-[#D97757] hover:bg-[#D97757]/10 transition-colors"
              onClick={() => api.runTerminal(claudeCmd, claudeTerminalName)}
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

  // Normal tek satirli layout
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

      {/* PRD */}
      {prdCol && (
        <>
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

      {/* Dynamic Columns */}
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
        <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded-md text-[#D97757] hover:bg-[#D97757]/10 transition-colors"
            onClick={() => api.runTerminal(claudeCmd, claudeTerminalName)}
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
        <div className="md:hidden opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={() => api.runTerminal(claudeCmd, claudeTerminalName)} className="gap-2 text-xs text-[#D97757] focus:text-[#D97757]">
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
