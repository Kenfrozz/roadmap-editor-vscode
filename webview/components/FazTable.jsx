import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
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
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { SortableRow } from './SortableRow'

export function FazTable({ fazKey, fazConfig, items, onUpdate, onDelete, onAdd, onAddBelow, onReorder, onPrdClick, onFazNameChange, onFazDelete, index, isFilterActive, phaseDragHandleProps, isCompact, columns, claudeFeatureCmd }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(fazConfig.name)
  const [collapsed, setCollapsed] = useState(false)
  const inputRef = useRef(null)

  const handleDragEnd = (event) => {
    if (isFilterActive) return
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      onReorder(fazKey, arrayMove(items, oldIndex, newIndex))
    }
  }

  const statusCols = columns.filter(c => c.type === 'status')
  const done = statusCols.length > 0 ? items.filter(i => statusCols.every(sc => i[sc.key] === '✅')).length : 0
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0

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

  return (
    <div
      className={cn(
        'rounded-lg border bg-card mb-5 animate-fade-up',
        'border-l-[3px]',
        fazConfig.color
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div className="sticky top-[56px] z-30 bg-card rounded-t-lg border-b border-border/30">
        <div className={cn('flex items-center justify-between py-2.5', isCompact ? 'px-2 gap-1' : 'px-4')}>
          <div className={cn('flex items-center min-w-0', isCompact ? 'gap-1' : 'gap-2.5')}>
            {phaseDragHandleProps && !isFilterActive && !isCompact && (
              <button
                className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                {...phaseDragHandleProps}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
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
                {!isCompact && (
                  <span className={cn('text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded shrink-0', fazConfig.tag)}>
                    FAZ {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                <span className={cn('text-sm font-bold tracking-tight truncate', fazConfig.text)}>
                  {fazConfig.name}
                </span>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
              </button>
            )}

            <span className={cn(
              'text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full',
              fazConfig.tag
            )}>
              {done}/{items.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', fazConfig.bg)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-mono-code text-muted-foreground font-bold">{pct}%</span>
            </div>

            <Button variant="ghost" size="icon" className="hidden md:inline-flex h-7 w-7" onClick={() => onAdd(fazKey)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onFazDelete(fazKey)} title="Fazi sil">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-7 w-7">
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
          <div className="w-8 shrink-0 flex justify-center py-2">
            <Hash className="w-3 h-3 opacity-40" />
          </div>
          {columns.map(col => {
            if (col.key === 'ozellik') {
              return <div key={col.key} className="flex-1 min-w-0 px-1 md:px-2 py-2">{col.label}</div>
            }
            if (col.key === 'prd') {
              return <div key={col.key} className="hidden md:block w-28 shrink-0 px-2 py-2 text-center">{col.label}</div>
            }
            if (col.type === 'status') {
              const Icon = STATUS_ICONS[col.key] || Activity
              return (
                <div key={col.key} className="shrink-0 py-2 flex items-center justify-center gap-1 w-7 md:w-20">
                  <Icon className="w-3 h-3 opacity-50" />
                  <span className="hidden md:inline">{col.label}</span>
                </div>
              )
            }
            if (col.type === 'date') {
              return <div key={col.key} className="hidden lg:block w-20 shrink-0 px-2 py-2">{col.label}</div>
            }
            return <div key={col.key} className="hidden lg:block flex-1 min-w-0 px-2 py-2">{col.label}</div>
          })}
          <div className="w-8 md:w-[72px] shrink-0"></div>
        </div>
      )}

      {/* Rows */}
      {!collapsed && (
        <div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item, idx) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  fazKey={fazKey}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddBelow={onAddBelow}
                  onPrdClick={onPrdClick}
                  index={idx}
                  isFilterActive={isFilterActive}
                  isCompact={isCompact}
                  columns={columns}
                  claudeFeatureCmd={claudeFeatureCmd}
                />
              ))}
            </SortableContext>
          </DndContext>
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
