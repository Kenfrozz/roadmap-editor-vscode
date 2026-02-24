import { useState, useEffect, useRef } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableRow } from './SortableRow'
import { state } from '../api'

const MAX_DEPTH = 2

export function SubtaskTree({
  item, fazKey, depth = 0, onUpdate, onDelete, onAddBelow,
  onAddSubtask, onReorderSubtasks, onPrdClick, onPrdRefUpdate, index, isFilterActive,
  isCompact, columns, claudeFeatureCmd, gorevTurleri, parentIndex, kanban, onItemClick,
}) {
  const [expanded, setExpanded] = useState(() => state.get(`subtask_${item.id}_expanded`, false))
  const prevChildrenLen = useRef(item.children?.length || 0)

  useEffect(() => {
    const currentLen = item.children?.length || 0
    if (currentLen > prevChildrenLen.current && !expanded) {
      setExpanded(true)
      state.set(`subtask_${item.id}_expanded`, true)
    }
    prevChildrenLen.current = currentLen
  }, [item.children?.length])
  const hasChildren = item.children?.length > 0
  const canAddChild = depth < MAX_DEPTH

  const displayIndex = parentIndex
    ? `${parentIndex}.${index + 1}`
    : String(index + 1).padStart(2, '0')

  return (
    <>
      <SortableRow
        item={item}
        fazKey={fazKey}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddBelow={onAddBelow}
        onAddSubtask={canAddChild ? onAddSubtask : null}
        onPrdClick={onPrdClick}
        onPrdRefUpdate={onPrdRefUpdate}
        index={index}
        isFilterActive={isFilterActive}
        isCompact={isCompact}
        columns={columns}
        claudeFeatureCmd={claudeFeatureCmd}
        gorevTurleri={gorevTurleri}
        depth={depth}
        hasChildren={hasChildren}
        expanded={expanded}
        onToggleExpand={() => { const next = !expanded; setExpanded(next); state.set(`subtask_${item.id}_expanded`, next) }}
        displayIndex={displayIndex}
        kanban={kanban}
        onItemClick={onItemClick}
      />

      {hasChildren && expanded && (
        <div className="relative" style={{ paddingLeft: '16px' }}>
          <div
            className="absolute top-0 bottom-0 border-l-2 border-muted-foreground/15"
            style={{ left: `${depth === 0 ? 19 : 15}px` }}
          />
          <SortableContext
            items={item.children.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {item.children.map((child, childIdx) => (
              <SubtaskTree
                key={child.id}
                item={child}
                fazKey={fazKey}
                depth={depth + 1}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddBelow={onAddBelow}
                onAddSubtask={onAddSubtask}
                onReorderSubtasks={onReorderSubtasks}
                onPrdClick={onPrdClick}
                onPrdRefUpdate={onPrdRefUpdate}
                index={childIdx}
                isFilterActive={isFilterActive}
                isCompact={isCompact}
                columns={columns}
                claudeFeatureCmd={claudeFeatureCmd}
                gorevTurleri={gorevTurleri}
                parentIndex={displayIndex}
                kanban={kanban}
                onItemClick={onItemClick}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </>
  )
}
