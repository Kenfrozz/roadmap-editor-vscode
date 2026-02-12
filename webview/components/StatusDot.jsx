import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { STATUS_OPTIONS } from '../lib/constants'

export function StatusDot({ value, onChange }) {
  const current = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[3]

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
          'hover:ring-2',
          current.ring,
          current.value === '-' ? 'bg-muted' : ''
        )}>
          <span className={cn('w-2.5 h-2.5 rounded-full', current.color)} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[140px]">
        {STATUS_OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="gap-2.5 text-xs"
          >
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', opt.color)} />
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
