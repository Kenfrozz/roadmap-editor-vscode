import { useState, useEffect } from 'react'
import { Minus, Square, X, Copy, PanelLeft, TerminalSquare, Plus, Terminal } from 'lucide-react'
import { ClaudeIcon } from './ClaudeIcon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function Titlebar({
  onToggleSidebar,
  claudeMainCmd,
  onRunCommand,
  customCommands,
  onDeleteCommand,
  onAddCommand,
  children,
}) {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.kairos.windowIsMaximized().then(setMaximized)
    const cleanup = window.kairos.onWindowMaximizeChanged(setMaximized)
    return cleanup
  }, [])

  return (
    <div className="titlebar relative flex items-center h-9 bg-background border-b border-border select-none shrink-0">
      {/* Left: sidebar toggle */}
      <div className="flex items-center h-full no-drag pl-1">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Sidebar"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Drag region */}
      <div className="flex-1 h-full drag-region" />

      {/* Right: app controls + window buttons */}
      <div className="flex items-center h-full no-drag gap-0.5 pr-0.5 z-10">
        {children}

        {/* Commands dropdown (Claude Code + custom commands) */}
        {onRunCommand && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Komutlar"
              >
                <TerminalSquare className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Yeni Terminal */}
              <DropdownMenuItem onClick={() => onRunCommand('', 'Terminal')} className="gap-2.5 text-xs">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="flex-1">Yeni Terminal</span>
              </DropdownMenuItem>
              {/* Claude Code */}
              {claudeMainCmd && (
                <DropdownMenuItem onClick={() => onRunCommand(claudeMainCmd, 'Claude Code')} className="gap-2.5 text-xs">
                  <ClaudeIcon className="w-3.5 h-3.5 text-[#D97757]" />
                  <span className="flex-1">Claude Code</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {/* Custom commands */}
              {customCommands?.map(cmd => (
                <DropdownMenuItem key={cmd.id} onClick={() => onRunCommand(cmd.cmd, cmd.name)} className="gap-2.5 text-xs group/cmd">
                  <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{cmd.name}</span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteCommand?.(cmd.id) }}
                    className="p-0.5 rounded opacity-0 group-hover/cmd:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddCommand} className="gap-2.5 text-xs">
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                Komut Ekle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center h-full ml-1">
          <button
            onClick={() => window.kairos.windowMinimize()}
            className="h-full w-11 flex items-center justify-center text-muted-foreground/70 hover:bg-muted/80 hover:text-foreground transition-colors"
            title="Kucult"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => window.kairos.windowMaximize()}
            className="h-full w-11 flex items-center justify-center text-muted-foreground/70 hover:bg-muted/80 hover:text-foreground transition-colors"
            title={maximized ? 'Geri Yukle' : 'Buyut'}
          >
            {maximized
              ? <Copy className="w-3 h-3" strokeWidth={1.5} />
              : <Square className="w-3 h-3" strokeWidth={1.5} />
            }
          </button>
          <button
            onClick={() => window.kairos.windowClose()}
            className="h-full w-11 flex items-center justify-center text-muted-foreground/70 hover:bg-[#e81123] hover:text-white transition-colors"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
