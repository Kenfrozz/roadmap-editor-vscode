import { useRef } from 'react'
import {
  ChevronDown,
  Cog,
  FileDown,
  FolderOpen,
  GitBranch,
  Gauge,
  Map,
  LogOut,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

function NavItem({ icon, label, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2.5 w-full h-8 rounded-md px-2 transition-colors disabled:opacity-40 disabled:pointer-events-none ${
        active
          ? 'bg-muted/80 text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[11px] truncate whitespace-nowrap">{label}</span>
    </button>
  )
}

export function Sidebar({
  expanded,
  projectName,
  projectPath,
  projectLogo,
  onSwitchProject,
  onExitProject,
  onPdfExport,
  pdfDisabled,
  searchText,
  onSearchChange,
  viewMode,
  onNavigate,
  appVersion,
}) {
  const searchInputRef = useRef(null)

  return (
    <div
      className={`flex flex-col h-full border-r border-border bg-background shrink-0 overflow-hidden transition-[width] duration-200 ease-out ${
        expanded ? 'w-52' : 'w-0 border-r-0'
      }`}
    >
      {/* Logo — h-9, drag-region (aligns with Titlebar) */}
      <div className="h-9 flex items-center px-3.5 drag-region shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary shrink-0">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.8" />
        </svg>
        <span className="ml-2 text-xs font-bold text-foreground/80 whitespace-nowrap">
          Kairos
        </span>
      </div>

      <div className="mx-2.5 border-t border-border/60" />

      {/* Interactive area — no-drag */}
      <div className="flex-1 flex flex-col no-drag overflow-hidden min-w-[208px]">
        {/* Navigation items */}
        <div className="flex-1 flex flex-col py-1.5 px-1.5 gap-0.5">
          {/* Search — inline with nav items */}
          <div
            className={`flex items-center gap-2.5 w-full h-8 rounded-md px-2 transition-colors group ${
              searchText
                ? 'bg-muted/80 text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
            onClick={() => searchInputRef.current?.focus()}
          >
            <Search className="w-4 h-4 shrink-0" />
            <input
              ref={searchInputRef}
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { onSearchChange(''); e.target.blur() } }}
              placeholder="Ara..."
              className="flex-1 min-w-0 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/40"
            />
            {searchText && (
              <button
                className="shrink-0 w-4 h-4 flex items-center justify-center rounded-sm text-muted-foreground/60 hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); onSearchChange('') }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="mx-0.5 my-0.5 border-t border-border/40" />
          <NavItem
            icon={<Gauge className="w-4 h-4" />}
            label="Dashboard"
            active={viewMode === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          <NavItem
            icon={<Map className="w-4 h-4" />}
            label="Roadmap"
            active={viewMode === 'main'}
            onClick={() => onNavigate('main')}
          />
          <NavItem
            icon={<Sparkles className="w-4 h-4" />}
            label="AI Kokpit"
            active={viewMode === 'kokpit'}
            onClick={() => onNavigate('kokpit')}
          />
          <NavItem
            icon={<GitBranch className="w-4 h-4" />}
            label="Git"
            active={viewMode === 'git'}
            onClick={() => onNavigate('git')}
          />
        </div>

        {/* Project card + Settings */}
        <div className="px-2 pb-2">
          <div className="rounded-lg border border-border/60 bg-card/80 p-2.5">
            <div className="flex items-center gap-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 flex-1 min-w-0 rounded-md hover:bg-muted/60 transition-colors -ml-0.5 px-0.5 py-0.5">
                    {projectLogo ? (
                      <img src={projectLogo} alt="" className="w-5 h-5 rounded-sm object-contain shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-sm bg-primary/15 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <span className="flex-1 text-[11px] font-semibold text-foreground/90 truncate whitespace-nowrap text-left">
                      {projectName}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); onPdfExport?.() }}
                  disabled={pdfDisabled}
                  className="gap-2.5 text-xs"
                >
                  <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
                  PDF'ye Aktar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSwitchProject} className="gap-2.5 text-xs">
                  <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  Proje Degistir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExitProject} className="gap-2.5 text-xs">
                  <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
                  Proje Secimine Don
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => onNavigate('settings')}
                className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                  viewMode === 'settings'
                    ? 'bg-muted/80 text-foreground'
                    : 'text-muted-foreground/50 hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Cog className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
