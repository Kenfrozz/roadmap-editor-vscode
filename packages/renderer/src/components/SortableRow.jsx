import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, PlusCircle, MoreVertical, ChevronDown, ChevronRight, ListTree } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { StatusDot } from './StatusDot'
import { ClaudeIcon } from './ClaudeIcon'
import { TaskTypeBadge } from './TaskTypeBadge'
import { api } from '../api'

export function SortablePhase({ id, children, disabled, className }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled, data: { type: 'phase' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandleProps = disabled ? null : { ...attributes, ...listeners }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-40', className)}>
      {children(dragHandleProps)}
    </div>
  )
}

export function SortableRow({
  item, fazKey, onUpdate, onDelete, onAddBelow, onAddSubtask, onPrdClick, onPrdRefUpdate,
  index, isFilterActive, isCompact, columns, claudeFeatureCmd, gorevTurleri,
  depth = 0, hasChildren = false, expanded = true, onToggleExpand, displayIndex, kanban,
  onItemClick,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'item', fazKey, item, depth },
  })
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

  // === KANBAN TABLE ROW ===
  if (kanban) {
    const allDone = statusCols.length > 0 && statusCols.every(sc => item[sc.key] === '\u2705')

    if (isSubtask) {
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
          <div className="w-5 shrink-0 flex items-center justify-center">
            {hasChildren ? (
              <button onClick={onToggleExpand} className="p-0.5 rounded hover:bg-muted transition-colors">
                {expanded ? <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" /> : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />}
              </button>
            ) : !isFilterActive ? (
              <button
                className="p-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-2.5 h-2.5" />
              </button>
            ) : null}
          </div>
          {gorevTurleri && (
            <div className="shrink-0">
              <TaskTypeBadge value={item.tur} gorevTurleri={gorevTurleri} onChange={(v) => onUpdate(fazKey, item.id, 'tur', v)} />
            </div>
          )}
          <div className="flex-1 min-w-0 px-1">
            <button
              onClick={() => onItemClick?.(fazKey, item)}
              className={cn(
                'h-6 text-[10px] font-normal px-1 text-left truncate w-full rounded-md hover:bg-muted/50 transition-colors text-foreground/80',
              )}
            >
              {item.ozellik || <span className="text-muted-foreground/40">Alt gorev...</span>}
            </button>
          </div>
          {statusCols.length > 0 && (
            <div className="w-7 shrink-0 flex justify-center">
              <StatusDot value={allDone ? '\u2705' : (statusCols.some(sc => item[sc.key] === '\u26A0\uFE0F') ? '\u26A0\uFE0F' : '\u274C')} onChange={(v) => setAllStatus(v)} />
            </div>
          )}
          <div className="w-6 shrink-0">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionsMenu />
            </div>
          </div>
        </div>
      )
    }

    // Root item in kanban table
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center row-hover border-b border-border/50',
          isDragging && 'opacity-40 bg-muted',
          index % 2 === 0 ? '' : 'bg-muted/20',
        )}
      >
        <div className="w-5 shrink-0 flex items-center justify-center">
          {hasChildren ? (
            <button onClick={onToggleExpand} className="p-0.5 rounded hover:bg-muted transition-colors">
              {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
          ) : !isFilterActive ? (
            <button
              className="p-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3" />
            </button>
          ) : null}
        </div>
        <div className="flex-1 min-w-0 px-1 py-0.5">
          <button
            onClick={() => onItemClick?.(fazKey, item)}
            className={cn(
              'h-6 text-[11px] font-medium px-1 text-left truncate w-full rounded-md hover:bg-muted/50 transition-colors',
                          )}
          >
            {item.ozellik || <span className="text-muted-foreground/40">Ozellik adi...</span>}
          </button>
        </div>
        {statusCols.map(col => (
          <div key={col.key} className="w-7 shrink-0 flex justify-center">
            <StatusDot value={item[col.key] || '-'} onChange={(v) => onUpdate(fazKey, item.id, col.key, v)} />
          </div>
        ))}
        <div className="w-6 shrink-0">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionsMenu />
          </div>
        </div>
      </div>
    )
  }

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

        {/* Title — tıklanabilir */}
        <div className="flex-1 min-w-0 px-1">
          <button
            onClick={() => onItemClick?.(fazKey, item)}
            className={cn(
              'h-7 text-[11px] font-normal px-1 text-left truncate w-full rounded-md hover:bg-muted/50 transition-colors text-foreground/80',
                          )}
          >
            {item.ozellik || <span className="text-muted-foreground/40">Alt gorev...</span>}
          </button>
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
          <button
            onClick={() => onItemClick?.(fazKey, item)}
            className="h-7 flex-1 text-xs font-medium text-left truncate px-1 rounded-md hover:bg-muted/50 transition-colors min-w-0"
          >
            {item.ozellik || <span className="text-muted-foreground/40">Ozellik adi...</span>}
          </button>
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center row-hover border-b border-border/50',
        isDragging && 'opacity-40 bg-muted',
        index % 2 === 0 ? '' : 'bg-muted/20',
      )}
    >
      {/* Drag Handle */}
      <div className="w-6 shrink-0 flex items-center justify-center">
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
      <div className="w-5 shrink-0 flex items-center justify-center">
        {hasChildren && (
          <button onClick={onToggleExpand} className="p-0.5 rounded hover:bg-muted transition-colors">
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </button>
        )}
      </div>

      {/* No */}
      <div className="w-8 shrink-0 flex items-center justify-center">
        <span className="text-[10px] font-mono-code text-muted-foreground/70 select-none">{idx}</span>
      </div>

      {/* Ozellik — tiklanabilir */}
      {ozellikCol && (
        <div className={cn('min-w-0 px-1 md:px-2 py-1.5 flex-1')}>
          <button
            onClick={() => onItemClick?.(fazKey, item)}
            className={cn(
              'h-7 text-xs md:text-[13px] font-medium px-1 md:px-1.5 text-left truncate w-full rounded-md hover:bg-muted/50 transition-colors',
            )}
          >
            {item.ozellik || <span className="text-muted-foreground/40">Ozellik adi...</span>}
          </button>
        </div>
      )}

      {/* Status Columns — inline kalir */}
      {statusCols.map(col => (
        <div key={col.key} className="w-7 md:w-20 shrink-0 flex justify-center">
          <StatusDot value={item[col.key] || '-'} onChange={(v) => onUpdate(fazKey, item.id, col.key, v)} />
        </div>
      ))}

      {/* Actions — dropdown menu */}
      <div className="w-8 shrink-0 pr-1">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionsMenu />
        </div>
      </div>
    </div>
  )
}
