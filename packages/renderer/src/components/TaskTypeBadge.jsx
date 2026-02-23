import {
  Code2, Bug, Sparkles, Search, Palette, FlaskConical,
  Circle, Wrench, BookOpen, MessageSquare, Shield,
  Zap, Globe, Database, Layout, Package,
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { GOREV_TURU_COLORS } from '../lib/constants'

const ICON_MAP = {
  Code2, Bug, Sparkles, Search, Palette, FlaskConical,
  Circle, Wrench, BookOpen, MessageSquare, Shield,
  Zap, Globe, Database, Layout, Package,
}

export function getGorevTuruIcon(iconName) {
  return ICON_MAP[iconName] || Circle
}

export function TaskTypeBadge({ value, gorevTurleri, onChange }) {
  const current = gorevTurleri.find(t => t.key === value)
  const colorConfig = current ? GOREV_TURU_COLORS[current.color] || GOREV_TURU_COLORS.slate : null
  const Icon = current ? getGorevTuruIcon(current.icon) : null

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {current ? (
          <button
            className={cn(
              'h-5 w-5 rounded-md flex items-center justify-center transition-colors',
              colorConfig.bg, colorConfig.text,
            )}
            title={current.label}
          >
            <Icon className="w-3 h-3" />
          </button>
        ) : (
          <button className="h-5 w-5 rounded border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[150px]">
        {current && (
          <DropdownMenuItem onClick={() => onChange('')} className="gap-2 text-xs text-muted-foreground">
            Tur Kaldir
          </DropdownMenuItem>
        )}
        {gorevTurleri.map(t => {
          const tc = GOREV_TURU_COLORS[t.color] || GOREV_TURU_COLORS.slate
          const TIcon = getGorevTuruIcon(t.icon)
          return (
            <DropdownMenuItem key={t.key} onClick={() => onChange(t.key)} className="gap-2 text-xs">
              <TIcon className={cn('w-3.5 h-3.5 shrink-0', tc.text)} />
              {t.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
