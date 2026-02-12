import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Calendar } from './ui/calendar'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { parseDate } from '../lib/hooks'

export function DatePickerCell({ value, onChange }) {
  const date = parseDate(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          'h-7 px-2 rounded-md text-xs font-mono-code flex items-center transition-colors',
          'hover:bg-muted',
          date ? 'text-foreground' : 'text-muted-foreground/40'
        )}>
          {date ? format(date, 'd MMM', { locale: tr }) : '—'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => onChange(newDate ? format(newDate, 'yyyy-MM-dd') : '')}
          initialFocus
        />
        {date && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={() => onChange('')}>
              Tarihi Temizle
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
