import { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '../lib/utils'

function customCollisionDetection(args) {
  const { active } = args
  const type = active.data?.current?.type

  if (type === 'phase') {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        c => c.data?.current?.type === 'phase'
      ),
    })
  }

  // Item: pointerWithin first, fallback to rectIntersection
  const pointerHits = pointerWithin(args)
  if (pointerHits.length > 0) return pointerHits
  return rectIntersection(args)
}

export function DndManager({
  fazOrder,
  data,
  fazConfig,
  isFilterActive,
  onReorderPhases,
  onMoveItem,
  onReorderItems,
  children,
  kanban = false,
}) {
  const [activeType, setActiveType] = useState(null)
  const [activeDragData, setActiveDragData] = useState(null)
  const [overContainerId, setOverContainerId] = useState(null)

  // Track items state during drag for cross-phase moves
  const dragItemsRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = useCallback((event) => {
    const { active } = event
    const type = active.data?.current?.type

    if (type === 'phase') {
      setActiveType('phase')
      setActiveDragData({ id: active.id })
    } else if (type === 'item') {
      setActiveType('item')
      setActiveDragData(active.data.current)
      dragItemsRef.current = null
    }
  }, [])

  const handleDragOver = useCallback((event) => {
    if (isFilterActive) return
    const { active, over } = event
    if (!over || active.data?.current?.type !== 'item') {
      setOverContainerId(null)
      return
    }

    const activeItem = active.data.current

    // Subtask'lar fazlar arasi tasinamaz
    if (activeItem.depth > 0) return

    const sourceFaz = activeItem.fazKey

    // Determine target faz
    let targetFaz = null
    const overType = over.data?.current?.type
    if (overType === 'phase') {
      // SortablePhase sortable (id=fazKey)
      targetFaz = over.id
    } else if (overType === 'phase-container') {
      // FazTable droppable (id=droppable-fazKey, data.fazKey)
      targetFaz = over.data.current.fazKey
    } else if (overType === 'item') {
      targetFaz = over.data.current.fazKey
    }

    if (!targetFaz) {
      setOverContainerId(null)
      return
    }

    setOverContainerId(targetFaz)

    // Cross-phase move: move the item from source to target in real-time
    if (sourceFaz !== targetFaz) {
      const sourceItems = [...(data[sourceFaz] || [])]
      const targetItems = [...(data[targetFaz] || [])]
      const activeIndex = sourceItems.findIndex(i => i.id === active.id)

      if (activeIndex === -1) return

      const [movedItem] = sourceItems.splice(activeIndex, 1)

      // Find where to insert in target
      let targetIndex = targetItems.length
      if (over.data?.current?.type === 'item') {
        const overIndex = targetItems.findIndex(i => i.id === over.id)
        if (overIndex !== -1) targetIndex = overIndex
      }

      targetItems.splice(targetIndex, 0, movedItem)

      // Update the item's fazKey in the active data
      active.data.current.fazKey = targetFaz

      dragItemsRef.current = { sourceFaz, targetFaz, sourceItems, targetItems }
      onMoveItem(active.id, sourceFaz, targetFaz, sourceItems, targetItems)
    }
  }, [isFilterActive, data, onMoveItem])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event

    setActiveType(null)
    setActiveDragData(null)
    setOverContainerId(null)
    dragItemsRef.current = null

    if (isFilterActive || !over) return

    const type = active.data?.current?.type

    if (type === 'phase') {
      if (active.id !== over.id) {
        onReorderPhases(active.id, over.id)
      }
      return
    }

    if (type === 'item') {
      // Subtask'lar fazlar arasi tasinamaz
      if (active.data.current.depth > 0) return

      // Same-faz reorder
      const activeFaz = active.data.current.fazKey
      let targetFaz = null

      if (over.data?.current?.type === 'item') {
        targetFaz = over.data.current.fazKey
      } else if (over.data?.current?.type === 'phase') {
        targetFaz = over.id
      } else if (over.data?.current?.type === 'phase-container') {
        targetFaz = over.data.current.fazKey
      }

      if (targetFaz && activeFaz === targetFaz && active.id !== over.id) {
        const items = data[activeFaz] || []
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          onReorderItems(activeFaz, arrayMove(items, oldIndex, newIndex))
        }
      }
      // Cross-phase moves are already handled in onDragOver + final save triggered
    }
  }, [isFilterActive, data, onReorderPhases, onReorderItems])

  const handleDragCancel = useCallback(() => {
    setActiveType(null)
    setActiveDragData(null)
    setOverContainerId(null)
    dragItemsRef.current = null
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={fazOrder} strategy={kanban ? horizontalListSortingStrategy : verticalListSortingStrategy}>
        {children({ overContainerId, activeType })}
      </SortableContext>

      <DragOverlay>
        {activeType === 'phase' && activeDragData && fazConfig[activeDragData.id] ? (
          <div className={cn(
            'px-4 py-2.5 rounded-lg border bg-card shadow-lg border-l-[3px]',
            fazConfig[activeDragData.id].color
          )}>
            <span className={cn('text-sm font-bold tracking-tight', fazConfig[activeDragData.id].text)}>
              {fazConfig[activeDragData.id].name}
            </span>
          </div>
        ) : null}

        {activeType === 'item' && activeDragData ? (
          <div className="px-3 py-2 rounded-md border bg-card shadow-lg text-xs font-medium truncate max-w-xs">
            {activeDragData.item?.ozellik || 'Oge'}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
