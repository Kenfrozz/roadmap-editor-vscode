import { Input } from './ui/input'
import { StatusDot } from './StatusDot'
import { DatePickerCell } from './DatePickerCell'

export function DynamicCell({ col, value, onChange }) {
  if (col.type === 'status') {
    return <StatusDot value={value || '-'} onChange={onChange} />
  }
  if (col.type === 'date') {
    return <DatePickerCell value={value} onChange={onChange} />
  }
  // text
  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
      placeholder="—"
      className="h-7 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/30 px-1.5 text-muted-foreground w-full"
    />
  )
}
