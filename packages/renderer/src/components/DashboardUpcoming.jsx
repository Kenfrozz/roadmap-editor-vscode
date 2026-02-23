import { AlertTriangle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '../lib/utils'

function TaskRow({ item, dateColumn, fazConfig, fazKey, isCompact }) {
  const cfg = fazConfig[fazKey]
  const dateVal = dateColumn ? item[dateColumn.key] : null
  const formattedDate = dateVal && dateVal !== '-' ? dateVal : null

  return (
    <div className={cn(
      'flex items-center gap-2',
      isCompact ? 'py-1' : 'py-1.5',
    )}>
      {cfg && (
        <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.bg)} />
      )}
      <span className={cn(
        'flex-1 truncate font-mono-code',
        isCompact ? 'text-[10px]' : 'text-[11px]',
        'text-foreground/70',
      )}>
        {item.ozellik || 'Isimsiz gorev'}
      </span>
      {formattedDate && (
        <span className={cn(
          'shrink-0 font-mono-code tabular-nums text-muted-foreground/50',
          isCompact ? 'text-[8px]' : 'text-[9px]',
        )}>
          {formattedDate}
        </span>
      )}
    </div>
  )
}

function Section({ icon: Icon, title, items, dateColumn, fazConfig, data, fazOrder, accentColor, isCompact, maxItems = 5 }) {
  if (!items || items.length === 0) return null

  const visible = items.slice(0, maxItems)
  const remaining = items.length - maxItems

  return (
    <div className={cn(
      'rounded-lg border border-border/40 bg-card/80 overflow-hidden hover:border-border/60 transition-colors',
      isCompact ? 'p-2.5' : 'p-3',
    )}>
      <div className={cn('flex items-center gap-1.5 mb-2', accentColor)}>
        <Icon className={cn(isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        <span className={cn(
          'font-mono-code font-bold',
          isCompact ? 'text-[10px]' : 'text-[11px]',
        )}>
          {title}
        </span>
        <span className={cn(
          'font-mono-code tabular-nums ml-auto',
          isCompact ? 'text-[9px]' : 'text-[10px]',
          'opacity-50',
        )}>
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-border/10">
        {visible.map(({ item, fazKey }) => (
          <TaskRow
            key={item.id}
            item={item}
            dateColumn={dateColumn}
            fazConfig={fazConfig}
            fazKey={fazKey}
            isCompact={isCompact}
          />
        ))}
      </div>
      {remaining > 0 && (
        <div className={cn(
          'font-mono-code text-muted-foreground/40 mt-1.5',
          isCompact ? 'text-[9px]' : 'text-[10px]',
        )}>
          ve {remaining} daha...
        </div>
      )}
    </div>
  )
}

export function DashboardUpcoming({ overdueItems, upcomingItems, dateColumn, fazConfig, data, fazOrder, isCompact }) {
  if ((!overdueItems || overdueItems.length === 0) && (!upcomingItems || upcomingItems.length === 0)) {
    return null
  }

  return (
    <div className={cn(
      'grid gap-3',
      isCompact ? 'grid-cols-1' : 'grid-cols-2',
    )}>
      <Section
        icon={AlertTriangle}
        title="Geciken"
        items={overdueItems}
        dateColumn={dateColumn}
        fazConfig={fazConfig}
        data={data}
        fazOrder={fazOrder}
        accentColor="text-red-500/80 dark:text-red-400/80"
        isCompact={isCompact}
      />
      <Section
        icon={Clock}
        title="Yaklasan"
        items={upcomingItems}
        dateColumn={dateColumn}
        fazConfig={fazConfig}
        data={data}
        fazOrder={fazOrder}
        accentColor="text-amber-500/80 dark:text-amber-400/80"
        isCompact={isCompact}
      />
    </div>
  )
}
