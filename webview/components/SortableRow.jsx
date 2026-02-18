import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, PlusCircle, FileText, MoreVertical, ChevronDown, ChevronRight, ListTree } from 'lucide-react'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn, parsePrdRef } from '../lib/utils'
import { StatusDot } from './StatusDot'
import { DatePickerCell } from './DatePickerCell'
import { ClaudeIcon } from './ClaudeIcon'
import { TaskTypeBadge } from './TaskTypeBadge'
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

export function SortableRow({
  item, fazKey, onUpdate, onDelete, onAddBelow, onAddSubtask, onPrdClick,
  index, isFilterActive, isCompact, columns, claudeFeatureCmd, gorevTurleri,
  depth = 0, hasChildren = false, expanded = true, onToggleExpand, displayIndex,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'item', fazKey, item, depth },
  })
  const [editing, setEditing] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isSubtask = depth > 0
  const statusCols = columns.filter(c => c.type === 'status')
  const claudeCmd = claudeFeatureCmd ? claudeFeatureCmd.replace('${ozellik}', item.ozellik || '') : `claude "/kairos:build ${item.ozellik || ''}"`
  const claudeTerminalName = item.ozellik ? `Claude: ${item.ozellik}` : 'Claude Code'
  const idx = displayIndex || String(index + 1).padStart(2, '0')

  // Actions dropdown — shared across all layouts
  const ActionsMenu = () => (
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
        {onAddSubtask && (
          <DropdownMenuItem onClick={() => onAddSubtask(fazKey, item.id)} className="gap-2 text-xs">
            <ListTree className="w-3.5 h-3.5" />
            Alt Gorev Ekle
          </DropdownMenuItem>
        )}
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
  )

  // === SUBTASK ROW (depth > 0): baslik + detay + tur + tek status toggle ===
  if (isSubtask) {
    const allDone = statusCols.length > 0 && statusCols.every(sc => item[sc.key] === '\u2705')
    const setAllStatus = (val) => {
      const updates = {}
      statusCols.forEach(sc => { updates[sc.key] = val })
      onUpdate(fazKey, item.id, updates)
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center row-hover border-b border-border/30',
          isDragging && 'opacity-40 bg-muted',
          depth === 1 && 'bg-muted/30',
          depth >= 2 && 'bg-muted/50',
        )}
      >
        {/* Drag / Chevron */}
        <div className="w-6 shrink-0 flex items-center justify-center">
          {hasChildren ? (
            <button onClick={onToggleExpand} className="p-1 rounded-md hover:bg-muted transition-colors">
              {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
          ) : !isFilterActive ? (
            <button
              className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3" />
            </button>
          ) : null}
        </div>

        {/* Type Badge */}
        {gorevTurleri && (
          <div className="shrink-0 mr-1">
            <TaskTypeBadge value={item.tur} gorevTurleri={gorevTurleri} onChange={(v) => onUpdate(fazKey, item.id, 'tur', v)} />
          </div>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0 px-1">
          <Input
            value={item.ozellik || ''}
            onChange={(e) => onUpdate(fazKey, item.id, 'ozellik', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            placeholder="Alt gorev..."
            className={cn(
              'h-7 text-[11px] font-normal bg-transparent border-none px-1 text-foreground/80',
              'focus-visible:ring-1 focus-visible:ring-primary/30',
              allDone && 'line-through text-muted-foreground/50',
            )}
          />
        </div>

        {/* Detail */}
        <div className="hidden md:block flex-1 min-w-0 px-1">
          <Input
            value={item.detay || ''}
            onChange={(e) => onUpdate(fazKey, item.id, 'detay', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            placeholder="Detay..."
            className="h-7 text-xs bg-transparent border-none px-1 text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>

        {/* Status Toggle */}
        {statusCols.length > 0 && (
          <div className="w-7 shrink-0 flex justify-center">
            <StatusDot value={allDone ? '\u2705' : (statusCols.some(sc => item[sc.key] === '\u26A0\uFE0F') ? '\u26A0\uFE0F' : '\u274C')} onChange={(v) => setAllStatus(v)} />
          </div>
        )}

        {/* Actions */}
        <div className="w-8 shrink-0 pr-1">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionsMenu />
          </div>
        </div>
      </div>
    )
  }

  // === COMPACT LAYOUT (depth === 0) ===
  if (isCompact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group border-b border-border/50 row-hover',
          isDragging && 'opacity-40 bg-muted',
          index % 2 === 0 ? '' : 'bg-muted/20',
        )}
      >
        <div className="flex items-center px-2 py-1 gap-1">
          {hasChildren && (
            <button onClick={onToggleExpand} className="p-0.5 rounded-md hover:bg-muted transition-colors shrink-0">
              {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
          )}
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
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionsMenu />
          </div>
        </div>
      </div>
    )
  }

  // === NORMAL LAYOUT (depth === 0) ===
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
        index % 2 === 0 ? '' : 'bg-muted/20',
      )}
    >
      {/* Drag Handle */}
      <div className={cn('w-6 shrink-0 flex items-center justify-center', editing && 'max-lg:hidden')}>
        {!isFilterActive ? (
          <button
            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Expand Toggle */}
      <div className={cn('w-5 shrink-0 flex items-center justify-center', editing && 'max-lg:hidden')}>
        {hasChildren && (
          <button onClick={onToggleExpand} className="p-0.5 rounded hover:bg-muted transition-colors">
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </button>
        )}
      </div>

      {/* No */}
      <div className={cn('w-8 shrink-0 flex items-center justify-center', editing && 'max-lg:hidden')}>
        <span className="text-[10px] font-mono-code text-muted-foreground/70 select-none">{idx}</span>
      </div>

      {/* Ozellik */}
      {ozellikCol && (
        <div className={cn('min-w-0 px-1 md:px-2 py-1.5 flex-1')}>
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
          <div className={cn('hidden md:flex w-36 shrink-0 px-1 items-center justify-center', editing && 'max-lg:!hidden')}>
            <button
              onClick={() => onPrdClick(fazKey, item.id, item.prd)}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2 rounded-md transition-colors max-w-full',
                item.prd
                  ? 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  : 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted'
              )}
              title={item.prd || 'PRD referansi ekle'}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              {item.prd && (() => {
                const parsed = parsePrdRef(item.prd)
                if (!parsed) return null
                return (
                  <span className="font-mono-code text-[11px] truncate">
                    {parsed.filename !== 'PRD.md' && (
                      <span className="text-muted-foreground/50">{parsed.filename.split('/').pop()} </span>
                    )}
                    <span>({parsed.start}{parsed.end !== parsed.start ? `-${parsed.end}` : ''})</span>
                  </span>
                )
              })()}
            </button>
          </div>
          <div className="md:hidden w-6 shrink-0 flex items-center justify-center">
            <button
              onClick={() => onPrdClick(fazKey, item.id, item.prd)}
              className={cn(
                'p-1 rounded-md transition-all',
                item.prd
                  ? 'text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10'
                  : 'text-muted-foreground/20 opacity-0 group-hover:opacity-100 hover:text-muted-foreground hover:bg-muted'
              )}
              title={item.prd || 'PRD'}
            >
              <FileText className="w-3 h-3" />
            </button>
          </div>
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

      {/* Actions — dropdown menu */}
      <div className={cn('w-8 shrink-0 pr-1', editing && 'max-lg:hidden')}>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionsMenu />
        </div>
      </div>
    </div>
  )
}
