import { Check, Clock, X, Minus } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { STATUS_OPTIONS } from '../lib/constants'

const ICON_MAP = { Check, Clock, X, Minus }

export function StatusDot({ value, onChange }) {
  const current = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[3]
  const Icon = ICON_MAP[current.icon] || Minus

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          'p-1 rounded-md flex items-center justify-center transition-colors',
          'hover:ring-2',
          current.ring,
          current.value === '-' ? 'bg-muted' : ''
        )}>
          <Icon className={cn('w-3 h-3', current.textColor)} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[140px]">
        {STATUS_OPTIONS.map(opt => {
          const OptIcon = ICON_MAP[opt.icon] || Minus
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="gap-2.5 text-xs"
            >
              <OptIcon className={cn('w-3.5 h-3.5 shrink-0', opt.textColor)} />
              <span>{opt.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
