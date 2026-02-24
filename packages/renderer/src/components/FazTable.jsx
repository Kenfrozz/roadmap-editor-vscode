import { useState, useEffect, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Activity,
  Monitor,
  Server,
  TestTube,
  Hash,
  Terminal,
  Pencil,
  MoreVertical,
  ListTree,
  PlusCircle,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { state, api } from '../api'
import { SubtaskTree } from './SubtaskTree'
import { StatusDot } from './StatusDot'
import { TaskTypeBadge } from './TaskTypeBadge'
import { ClaudeIcon } from './ClaudeIcon'

function countLeafItems(items, statusCols) {
  let total = 0, done = 0
  for (const item of items) {
    if (item.children?.length > 0) {
      const sub = countLeafItems(item.children, statusCols)
      total += sub.total
      done += sub.done
    } else {
      total++
      if (statusCols.every(sc => item[sc.key] === '\u2705')) done++
    }
  }
  return { total, done }
}

function KanbanCard({ item, fazKey, onUpdate, onDelete, onAddBelow, onAddSubtask, columns, claudeFeatureCmd, gorevTurleri, isFilterActive }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'item', fazKey, item, depth: 0 },
  })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const statusCols = columns.filter(c => c.type === 'status')
  const allDone = statusCols.length > 0 && statusCols.every(sc => item[sc.key] === '\u2705')
  const claudeCmd = claudeFeatureCmd ? claudeFeatureCmd.replace('${ozellik}', item.ozellik || '') : `claude "/kairos:build ${item.ozellik || ''}"`
  const childCount = item.children?.length || 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-lg border bg-card/80 hover:bg-card p-2.5 mb-2 transition-colors',
        isDragging && 'opacity-40 shadow-lg',
      )}
    >
      <div className="flex items-start gap-1.5 mb-2">
        {!isFilterActive && (
          <button
            className="p-0.5 mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0 opacity-0 group-hover:opacity-100"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3 h-3" />
          </button>
        )}
        <span className="text-xs font-medium leading-tight line-clamp-2 flex-1 min-w-0">
          {item.ozellik || 'Isimsiz'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {statusCols.map(col => (
          <StatusDot key={col.key} value={item[col.key] || '-'} onChange={(v) => onUpdate(fazKey, item.id, col.key, v)} />
        ))}
        {childCount > 0 && (
          <span className="text-[9px] font-mono-code text-muted-foreground/40 ml-1">
            <ListTree className="w-2.5 h-2.5 inline mr-0.5" />{childCount}
          </span>
        )}
        <div className="flex-1" />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MoreVertical className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem onClick={() => api.runTerminal(claudeCmd, item.ozellik ? `Claude: ${item.ozellik}` : 'Claude Code')} className="gap-2 text-xs text-[#D97757] focus:text-[#D97757]">
                <ClaudeIcon className="w-3.5 h-3.5" />
                Claude ile Yap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSubtask(fazKey, item.id)} className="gap-2 text-xs">
                <ListTree className="w-3.5 h-3.5" />
                Alt Gorev Ekle
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

export function FazTable({ fazKey, fazConfig, items, onUpdate, onDelete, onAdd, onAddBelow, onAddSubtask, onReorder, onPrdClick, onPrdRefUpdate, onFazNameChange, onFazDelete, index, isFilterActive, phaseDragHandleProps, isCompact, columns, claudeFeatureCmd, gorevTurleri, isDropTarget, kanban, onItemClick }) {
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `droppable-${fazKey}`, data: { type: 'phase-container', fazKey } })
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(fazConfig.name)
  const [collapsed, setCollapsed] = useState(() => state.get(`faz_${fazKey}_collapsed`, true))
  const inputRef = useRef(null)

  const statusCols = columns.filter(c => c.type === 'status')
  const { total: leafTotal, done: leafDone } = countLeafItems(items, statusCols)
  const pct = leafTotal > 0 ? Math.round((leafDone / leafTotal) * 100) : 0

  const handleNameSave = () => {
    if (tempName.trim()) onFazNameChange(fazKey, tempName.trim())
    setEditingName(false)
  }

  useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingName])

  const STATUS_ICONS = { backend: Server, frontend: Monitor, test: TestTube }
  const otherCols = columns.filter(c => c.key !== 'ozellik' && c.key !== 'prd')

  // === KANBAN COLUMN MODE ===
  if (kanban) {
    return (
      <div
        ref={setDroppableRef}
        className={cn(
          'rounded-lg border bg-card/50 flex flex-col h-full min-w-0 animate-fade-up',
          isDropTarget && 'ring-2 ring-primary/40 ring-inset'
        )}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Kanban Header */}
        <div className="bg-card/80 rounded-t-lg border-b border-border/30 shrink-0">
          <div className="group/faz flex items-center justify-between py-2 px-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {phaseDragHandleProps && !isFilterActive && (
                <button
                  className="p-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                  {...phaseDragHandleProps}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
              )}

              {editingName ? (
                <Input
                  ref={inputRef}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave()
                    if (e.key === 'Escape') { setTempName(fazConfig.name); setEditingName(false) }
                  }}
                  className="h-6 text-xs font-bold border-primary/30 w-full"
                />
              ) : (
                <button
                  className="flex items-center gap-1.5 group/name min-w-0"
                  onClick={() => { setTempName(fazConfig.name); setEditingName(true) }}
                >
                  <span className={cn('text-xs font-bold tracking-tight truncate', fazConfig.text)}>
                    {fazConfig.name}
                  </span>
                  <Pencil className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono-code text-muted-foreground/40 tabular-nums">
                {leafDone}<span className="opacity-30">/</span>{leafTotal}
              </span>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[130px]">
                  <DropdownMenuItem onClick={() => onAdd(fazKey)} className="gap-2 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Ozellik Ekle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFazDelete(fazKey)} className="gap-2 text-xs text-destructive focus:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                    Fazi Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Progress bar */}
          <div className="px-3 pb-2">
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-500', fazConfig.bg)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex items-center border-b border-border/50 bg-card/95 text-[8px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="w-5 shrink-0" />
          <div className="flex-1 min-w-0 px-1 py-1.5">Ozellik</div>
          {statusCols.map(col => {
            const Icon = STATUS_ICONS[col.key] || Activity
            return (
              <div key={col.key} className="w-7 shrink-0 flex justify-center py-1.5" title={col.label}>
                <Icon className="w-2.5 h-2.5 opacity-50" />
              </div>
            )
          })}
          <div className="w-6 shrink-0" />
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-y-auto kanban-scroll">
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <SubtaskTree
                key={item.id}
                item={item}
                fazKey={fazKey}
                depth={0}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddBelow={onAddBelow}
                onAddSubtask={onAddSubtask}
                onPrdClick={onPrdClick}
                onPrdRefUpdate={onPrdRefUpdate}
                index={idx}
                isFilterActive={isFilterActive}
                isCompact={false}
                columns={columns}
                claudeFeatureCmd={claudeFeatureCmd}
                gorevTurleri={gorevTurleri}
                kanban
                onItemClick={onItemClick}
              />
            ))}
          </SortableContext>
          {items.length === 0 && (
            <div className="py-6 text-center">
              <Terminal className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground/30" />
              <p className="text-[10px] text-muted-foreground/40 font-mono-code">bos</p>
            </div>
          )}
        </div>

        {/* Kanban Add Button */}
        <div className="shrink-0 p-2 pt-0">
          <button
            onClick={() => onAdd(fazKey)}
            className="w-full h-7 rounded-md border border-dashed border-border/60 hover:border-primary/40 flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted-foreground/50 hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3" />
            Ekle
          </button>
        </div>
      </div>
    )
  }

  // === LIST MODE (varsayilan) ===
  return (
    <div
      ref={setDroppableRef}
      className={cn(
        'rounded-lg border bg-card mb-5 animate-fade-up',
        isDropTarget && 'ring-2 ring-primary/40 ring-inset'
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div className="sticky top-[56px] z-30 bg-card rounded-t-lg border-b border-border/30">
        <div className={cn('group/faz flex items-center justify-between py-2.5', isCompact ? 'px-2 gap-1' : 'px-4')}>
          <div className={cn('flex items-center min-w-0 flex-1', isCompact ? 'gap-1' : 'gap-2.5')}>
            {phaseDragHandleProps && !isFilterActive && !isCompact && (
              <button
                className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                {...phaseDragHandleProps}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            {!isCompact && (
              <span className="text-[10px] font-mono-code text-muted-foreground/30 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
            <button
              onClick={() => { const next = !collapsed; setCollapsed(next); state.set(`faz_${fazKey}_collapsed`, next) }}
              className="p-0.5 rounded-md hover:bg-muted transition-colors"
            >
              {collapsed
                ? <ChevronRight className={cn('w-4 h-4', fazConfig.text)} />
                : <ChevronDown className={cn('w-4 h-4', fazConfig.text)} />
              }
            </button>

            {editingName ? (
              <Input
                ref={inputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave()
                  if (e.key === 'Escape') { setTempName(fazConfig.name); setEditingName(false) }
                }}
                className={cn('h-7 text-sm font-bold border-primary/30', isCompact ? 'w-full max-w-64' : 'w-64')}
              />
            ) : (
              <button
                className="flex items-center gap-2 group/name min-w-0"
                onClick={() => { setTempName(fazConfig.name); setEditingName(true) }}
              >
                <span className={cn('text-sm font-bold tracking-tight truncate', fazConfig.text)}>
                  {fazConfig.name}
                </span>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono-code text-muted-foreground/35 tabular-nums">
              {leafDone}<span className="opacity-40">/</span>{leafTotal}
            </span>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', fazConfig.bg)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-mono-code text-muted-foreground font-bold">{pct}%</span>
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn('h-7 w-7 transition-opacity', collapsed ? 'opacity-0 group-hover/faz:opacity-100' : 'opacity-100')}>
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[130px]">
                <DropdownMenuItem onClick={() => onAdd(fazKey)} className="gap-2 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Ozellik Ekle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFazDelete(fazKey)} className="gap-2 text-xs text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                  Fazi Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      {!collapsed && !isCompact && (
        <div className="sticky top-[100px] z-20 flex items-center border-b border-border/50 bg-card/95 backdrop-blur-sm shadow-sm text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="w-6 shrink-0"></div>
          <div className="w-5 shrink-0"></div>
          <div className="w-8 shrink-0 flex justify-center py-2">
            <Hash className="w-3 h-3 opacity-40" />
          </div>
          <div className="flex-1 min-w-0 px-1 md:px-2 py-2">Ozellik</div>
          {statusCols.map(col => {
            const Icon = STATUS_ICONS[col.key] || Activity
            return (
              <div key={col.key} className="shrink-0 py-2 flex items-center justify-center gap-1 w-7 md:w-20">
                <Icon className="w-3 h-3 opacity-50" />
                <span className="hidden md:inline">{col.label}</span>
              </div>
            )
          })}
          <div className="w-8 shrink-0"></div>
        </div>
      )}

      {/* Rows */}
      {!collapsed && (
        <div>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <SubtaskTree
                key={item.id}
                item={item}
                fazKey={fazKey}
                depth={0}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddBelow={onAddBelow}
                onAddSubtask={onAddSubtask}
                onPrdClick={onPrdClick}
                onPrdRefUpdate={onPrdRefUpdate}
                index={idx}
                isFilterActive={isFilterActive}
                isCompact={isCompact}
                columns={columns}
                claudeFeatureCmd={claudeFeatureCmd}
                gorevTurleri={gorevTurleri}
                onItemClick={onItemClick}
              />
            ))}
          </SortableContext>
          {items.length === 0 && (
            <div className="py-10 text-center">
              <Terminal className="w-5 h-5 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground/50 font-mono-code mb-3">bos — satir eklemek icin + butonuna tikla</p>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => onAdd(fazKey)}>
                <Plus className="w-3 h-3" />
                Ozellik Ekle
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
