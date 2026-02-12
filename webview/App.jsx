import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Plus,
  X,
  Loader2,
  Activity,
  Terminal,
  Search,
  Menu,
  Zap,
  RotateCcw,
  Cog,
  AlertTriangle,
  CircleDot,
  FileCode,
  Sparkles,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from './components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './components/ui/dialog'
import { cn } from './lib/utils'
import { api, state, onMessage } from './vscodeApi'
import { useTheme } from './lib/theme'
import { useContainerWidth } from './lib/hooks'
import { DEFAULT_COLUMNS, DEFAULT_FAZ_CONFIG, FAZ_COLORS } from './lib/constants'
import { ClaudeIcon } from './components/ClaudeIcon'
import { SortablePhase } from './components/SortableRow'
import { FazTable } from './components/FazTable'
import { StatusStatCard } from './components/StatusStatCard'
import { DateStatCard } from './components/DateStatCard'
import { computeStatusBreakdown, computeDateStats } from './lib/statsUtils'
import { ChangelogSection } from './components/ChangelogSection'
import { PrdModal } from './components/PrdModal'
import { SettingsView } from './pages/SettingsView'
import { SetupWizard } from './pages/SetupWizard'
import { GitStatusBadge, GitPanel } from './components/GitPanel'

export default function App() {
  const dark = useTheme()
  const [containerRef, isCompact] = useContainerWidth()
  const [data, setData] = useState({})
  const [fazConfig, setFazConfig] = useState(DEFAULT_FAZ_CONFIG)
  const [fazOrder, setFazOrder] = useState(['faz1', 'faz2', 'faz3', 'faz4'])
  const [changelog, setChangelog] = useState([])
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [prdModal, setPrdModal] = useState(null)
  const [customCommands, setCustomCommands] = useState(() => state.get('customCommands', []))
  const [cmdDialogOpen, setCmdDialogOpen] = useState(false)
  const [newCmdName, setNewCmdName] = useState('')
  const [newCmdText, setNewCmdText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef(null)
  const [fileNotFound, setFileNotFound] = useState(false)
  const [activePhaseDrag, setActivePhaseDrag] = useState(null)
  const [viewMode, setViewMode] = useState('main')
  const [settingsData, setSettingsData] = useState(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [firstRunDialog, setFirstRunDialog] = useState(false)
  const [firstRunProcessing, setFirstRunProcessing] = useState(false)
  const [gitPanelOpen, setGitPanelOpen] = useState(false)
  const [gitDurum, setGitDurum] = useState(null)
  const saveTimer = useRef(null)
  const fazOrderRef = useRef(fazOrder)

  const loadData = useCallback(async () => {
    try {
      const loadedData = await api.load()
      if (loadedData._notFound) {
        setFileNotFound(true)
        setLoading(false)
        return
      }
      setFileNotFound(false)
      if (loadedData._firstRun) {
        setFirstRunDialog(true)
      }
      const { _fazNames, _changelog, _fazOrder: loadedFazOrder, _columns: loadedColumns, _firstRun, ...fazData } = loadedData
      setData(fazData)
      setChangelog(_changelog || [])
      if (loadedColumns) setColumns(loadedColumns)
      if (_fazNames) {
        const newConfig = { ...DEFAULT_FAZ_CONFIG }
        Object.entries(_fazNames).forEach(([key, name]) => {
          const fazNum = parseInt(key.replace('faz', '')) || 1
          const colorIndex = (fazNum - 1) % FAZ_COLORS.length
          newConfig[key] = { name, ...FAZ_COLORS[colorIndex] }
        })
        setFazConfig(newConfig)
      }
      if (loadedFazOrder && loadedFazOrder.length > 0) {
        setFazOrder(loadedFazOrder)
      } else {
        const keys = Object.keys(fazData).filter(k => k.startsWith('faz'))
        if (keys.length > 0) {
          setFazOrder(keys.sort((a, b) => {
            const numA = parseInt(a.replace('faz', '')) || 0
            const numB = parseInt(b.replace('faz', '')) || 0
            return numA - numB
          }))
        }
      }
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    api.loadSettings().then(s => setSettingsData(s)).catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    fazOrderRef.current = fazOrder
  }, [fazOrder])

  useEffect(() => {
    const cleanup = onMessage('fileChanged', () => {
      loadData()
    })
    return cleanup
  }, [loadData])

  const refreshGitDurum = useCallback(async () => {
    try {
      const d = await api.gitDurum()
      setGitDurum(d)
    } catch {
      setGitDurum(null)
    }
  }, [])

  useEffect(() => {
    refreshGitDurum()
    const interval = setInterval(refreshGitDurum, 5000)
    return () => clearInterval(interval)
  }, [refreshGitDurum])

  const autoSave = useCallback((newData, newFazConfig, newChangelog, newFazOrder) => {
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const orderToSave = newFazOrder || fazOrderRef.current
        await api.save({ ...newData, _fazConfig: newFazConfig, _changelog: newChangelog, _fazOrder: orderToSave })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 800)
  }, [])

  const updateItem = (fazKey, itemId, field, value) => {
    const newData = { ...data, [fazKey]: data[fazKey].map(item => item.id === itemId ? { ...item, [field]: value } : item) }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const deleteItem = (fazKey, itemId) => {
    const newData = { ...data, [fazKey]: data[fazKey].filter(item => item.id !== itemId) }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const addItem = (fazKey) => {
    const newItem = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }
    columns.forEach(col => {
      newItem[col.key] = col.type === 'status' ? '❌' : ''
    })
    const newData = { ...data, [fazKey]: [...(data[fazKey] || []), newItem] }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const addItemBelow = (fazKey, itemId) => {
    const newItem = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }
    columns.forEach(col => {
      newItem[col.key] = col.type === 'status' ? '❌' : ''
    })
    const items = data[fazKey] || []
    const index = items.findIndex(i => i.id === itemId)
    const newItems = [...items.slice(0, index + 1), newItem, ...items.slice(index + 1)]
    const newData = { ...data, [fazKey]: newItems }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const isFilterActive = searchText.trim() !== ''

  const filteredData = useMemo(() => {
    if (!isFilterActive) return data
    const result = {}
    const search = searchText.trim().toLowerCase()
    for (const [fazKey, items] of Object.entries(data)) {
      if (!Array.isArray(items)) continue
      const filtered = items.filter(item => {
        return (item.ozellik || '').toLowerCase().includes(search)
          || (item.not || '').toLowerCase().includes(search)
      })
      result[fazKey] = filtered
    }
    return result
  }, [data, searchText, isFilterActive])

  const reorderItems = (fazKey, newItems) => {
    if (isFilterActive) return
    const newData = { ...data, [fazKey]: newItems }
    setData(newData)
    autoSave(newData, fazConfig, changelog)
  }

  const updateFazName = (fazKey, newName) => {
    const newConfig = { ...fazConfig, [fazKey]: { ...fazConfig[fazKey], name: newName } }
    setFazConfig(newConfig)
    autoSave(data, newConfig, changelog)
  }

  const addNewFaz = () => {
    const fazNum = fazOrder.length + 1
    const newKey = `faz${fazNum}`
    const colorIndex = (fazNum - 1) % FAZ_COLORS.length
    const newConfig = { ...fazConfig, [newKey]: { name: 'YENI FAZ', ...FAZ_COLORS[colorIndex] } }
    setFazConfig(newConfig)
    setFazOrder([...fazOrder, newKey])
    setData({ ...data, [newKey]: [] })
    autoSave({ ...data, [newKey]: [] }, newConfig, changelog)
  }

  const deleteFaz = (fazKey) => {
    const newConfig = { ...fazConfig }
    delete newConfig[fazKey]
    const newData = { ...data }
    delete newData[fazKey]
    const newOrder = fazOrder.filter(k => k !== fazKey)
    setFazConfig(newConfig)
    setFazOrder(newOrder)
    setData(newData)
    autoSave(newData, newConfig, changelog)
  }

  const updateChangelog = (entryId, field, value) => {
    const newChangelog = changelog.map(entry => entry.id === entryId ? { ...entry, [field]: value } : entry)
    setChangelog(newChangelog)
    autoSave(data, fazConfig, newChangelog)
  }

  const deleteChangelog = (entryId) => {
    const newChangelog = changelog.filter(entry => entry.id !== entryId)
    setChangelog(newChangelog)
    autoSave(data, fazConfig, newChangelog)
  }

  const addChangelog = () => {
    const today = new Date().toISOString().split('T')[0]
    const newEntry = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), tarih: today, degisiklik: '' }
    const newChangelog = [newEntry, ...changelog]
    setChangelog(newChangelog)
    autoSave(data, fazConfig, newChangelog)
  }

  const phaseSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handlePhaseDragStart = (event) => {
    setActivePhaseDrag(event.active.id)
  }

  const handlePhaseDragEnd = (event) => {
    setActivePhaseDrag(null)
    if (isFilterActive) return
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = fazOrder.indexOf(active.id)
      const newIndex = fazOrder.indexOf(over.id)
      const newOrder = arrayMove(fazOrder, oldIndex, newIndex)
      setFazOrder(newOrder)
      autoSave(data, fazConfig, changelog, newOrder)
    }
  }

  // Custom commands
  const addCustomCommand = () => {
    if (!newCmdName.trim() || !newCmdText.trim()) return
    const updated = [...customCommands, { id: Date.now().toString(), name: newCmdName.trim(), cmd: newCmdText.trim() }]
    setCustomCommands(updated)
    state.set('customCommands', updated)
    setNewCmdName('')
    setNewCmdText('')
    setCmdDialogOpen(false)
  }

  const deleteCustomCommand = (id) => {
    const updated = customCommands.filter(c => c.id !== id)
    setCustomCommands(updated)
    state.set('customCommands', updated)
  }

  // Stats
  const GRID_COLS_MAP = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }
  const allItems = Object.values(data).flat()
  const total = allItems.length
  const statusColumns = columns.filter(c => c.type === 'status')
  const dateColumn = columns.find(c => c.type === 'date')

  const statusBreakdowns = useMemo(() => {
    return statusColumns.map(col => ({
      ...col,
      breakdown: computeStatusBreakdown(allItems, col.key),
    }))
  }, [allItems, statusColumns])

  const dateStats = useMemo(() => {
    if (!dateColumn) return null
    return computeDateStats(allItems, dateColumn.key, statusColumns.map(c => c.key))
  }, [allItems, dateColumn, statusColumns])

  const overallPct = useMemo(() => {
    if (total === 0 || statusColumns.length === 0) return 0
    let sum = 0
    for (const sc of statusColumns) {
      sum += allItems.filter(i => i[sc.key] === '✅').length
    }
    return Math.round((sum / (total * statusColumns.length)) * 100)
  }, [allItems, total, statusColumns])

  const claudeMainCmd = settingsData?.claude?.mainCommand || 'claude --dangerously-skip-permissions'
  const claudeFeatureCmd = settingsData?.claude?.featureCommand || 'claude "${ozellik}"'

  // === LOADING ===
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 grid-bg">
        <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary-foreground animate-pulse" />
        </div>
        <p className="text-xs font-mono-code text-muted-foreground">yukleniyor...</p>
      </div>
    )
  }

  // === FIRST RUN ===
  if (firstRunDialog) {
    return (
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
            <FileCode className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight mb-2">Mevcut KAIROS.md Tespit Edildi</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bu projede zaten bir KAIROS.md dosyasi mevcut. Bu dosya eklentiyle uyumlu olmayabilir.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              Devam etmek icin mevcut dosya yedeklenecek ve kurulum sihirbaziyla uyumlu yeni bir KAIROS.md olusturulacak.
              Orijinal dosyaniz Ayarlar &gt; Yedekler sekmesinden geri yuklenebilir.
            </p>
          </div>
          <button
            onClick={async () => {
              setFirstRunProcessing(true)
              try {
                await api.resetRoadmap()
                setFirstRunDialog(false)
                setFileNotFound(true)
              } catch (err) {
                console.error('First run reset error:', err)
              } finally {
                setFirstRunProcessing(false)
              }
            }}
            disabled={firstRunProcessing}
            className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {firstRunProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Yedekle ve Devam Et
          </button>
        </div>
      </div>
    )
  }

  // === FILE NOT FOUND — SETUP WIZARD ===
  if (fileNotFound) {
    return (
      <SetupWizard onCreated={() => {
        setFileNotFound(false)
        setLoading(true)
        loadData()
      }} />
    )
  }

  // === SETTINGS VIEW ===
  if (viewMode === 'settings') {
    return (
      <div ref={containerRef} className="min-h-screen grid-bg">
        <SettingsView
          onClose={() => setViewMode('main')}
          onSaved={() => {
            setLoading(true)
            api.loadSettings().then(s => setSettingsData(s)).catch(() => {})
            loadData()
          }}
          isCompact={isCompact}
          onReset={() => setResetDialogOpen(true)}
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen grid-bg">
      {/* === HEADER === */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="w-full flex h-14 items-center justify-between px-1">
          {/* Left: Title + Progress */}
          <div className="flex items-center gap-3 min-w-0">
            {!isCompact && (
              <div>
                <h1 className="text-xs font-semibold tracking-tight leading-none text-muted-foreground">KAIROS</h1>
                <p className="text-[10px] font-mono-code text-muted-foreground leading-none mt-0.5">
                  {format(new Date(), 'dd.MM.yyyy', { locale: tr })}
                </p>
              </div>
            )}

            <div className="pl-2 border-l border-border/50">
              <GitStatusBadge durum={gitDurum} onClick={() => setGitPanelOpen(!gitPanelOpen)} />
            </div>
          </div>

          {/* Right: Actions */}
          <div className={cn('flex items-center gap-1.5', isCompact ? 'flex-1 justify-end' : 'shrink-0')}>
            {/* Search */}
            {searchOpen ? (
              <div className={cn('relative flex items-center h-7 rounded-md bg-muted/50 overflow-hidden ring-1 ring-primary/40 animate-fade-up', isCompact ? 'flex-1' : 'w-36 md:w-44')} style={{ animationDuration: '0.15s' }}>
                <Search className="absolute left-2 w-3 h-3 text-muted-foreground/50 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setSearchText(''); setSearchOpen(false) }
                  }}
                  onBlur={() => { if (!searchText) setSearchOpen(false) }}
                  placeholder="Ara..."
                  className="flex-1 h-full pl-7 pr-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/40"
                  autoFocus
                />
                <button
                  className="flex items-center justify-center h-4 w-4 mr-1 rounded-sm text-muted-foreground/60 hover:text-foreground transition-colors"
                  onClick={() => { setSearchText(''); setSearchOpen(false) }}
                  title="Kapat"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                title="Ara"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                  <Menu className="h-4 w-4 text-muted-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => api.runTerminal(claudeMainCmd, 'Claude Code')} className="gap-2.5 text-xs">
                  <ClaudeIcon className="w-3.5 h-3.5 text-[#D97757]" />
                  Claude Code
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                    Ozel Komutlar
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {customCommands.length === 0 && (
                      <div className="px-2 py-3 text-[10px] text-muted-foreground/50 text-center font-mono-code">
                        henuz komut eklenmedi
                      </div>
                    )}
                    {customCommands.map(cmd => (
                      <DropdownMenuItem key={cmd.id} onClick={() => api.runTerminal(cmd.cmd, cmd.name)} className="gap-2.5 text-xs group/cmd">
                        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{cmd.name}</span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteCustomCommand(cmd.id) }}
                          className="p-0.5 rounded opacity-0 group-hover/cmd:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCmdDialogOpen(true)} className="gap-2.5 text-xs">
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      Komut Ekle
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setViewMode('settings')} className="gap-2.5 text-xs">
                  <Cog className="w-3.5 h-3.5 text-muted-foreground" />
                  Ayarlar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* === GIT PANEL === */}
      <GitPanel open={gitPanelOpen} onClose={() => setGitPanelOpen(false)} durum={gitDurum} onRefresh={refreshGitDurum} />


      {/* === MAIN CONTENT === */}
      <main className="w-full px-0.5 py-5">
        {/* Stats Card */}
        {total > 0 && (statusBreakdowns.length > 0 || dateStats) && (
          <div className="rounded-lg border border-border/60 bg-card/80 mb-5 overflow-hidden">
            {/* Overall Progress Bar */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Genel Ilerleme</span>
                <span className="text-xs font-mono-code font-bold text-primary">{overallPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${overallPct}%` }} />
              </div>
            </div>
            {/* Stat Columns */}
            <div className={cn(
              'grid',
              isCompact
                ? 'grid-cols-1 gap-3 px-3 py-3'
                : `${GRID_COLS_MAP[statusBreakdowns.length + (dateStats ? 1 : 0)] || 'grid-cols-4'} gap-4 px-4 py-3`
            )}>
              {statusBreakdowns.map(col => (
                <StatusStatCard
                  key={col.key}
                  label={col.label}
                  breakdown={col.breakdown}
                  icon={CircleDot}
                  isCompact={isCompact}
                />
              ))}
              {dateStats && (
                <DateStatCard dateStats={dateStats} isCompact={isCompact} />
              )}
            </div>
          </div>
        )}

        {/* Faz Tables */}
        <DndContext
          sensors={phaseSensors}
          collisionDetection={closestCenter}
          onDragStart={handlePhaseDragStart}
          onDragEnd={handlePhaseDragEnd}
        >
          <SortableContext items={fazOrder} strategy={verticalListSortingStrategy}>
            {fazOrder.map((fazKey, idx) =>
              fazConfig[fazKey] && (
                <SortablePhase key={fazKey} id={fazKey} disabled={isFilterActive}>
                  {(dragHandleProps) => (
                    <FazTable
                      fazKey={fazKey}
                      fazConfig={fazConfig[fazKey]}
                      items={filteredData[fazKey] || []}
                      onUpdate={updateItem}
                      onDelete={deleteItem}
                      onAdd={addItem}
                      onAddBelow={addItemBelow}
                      onReorder={reorderItems}
                      onPrdClick={setPrdModal}
                      onFazNameChange={updateFazName}
                      onFazDelete={deleteFaz}
                      index={idx}
                      isFilterActive={isFilterActive}
                      phaseDragHandleProps={dragHandleProps}
                      isCompact={isCompact}
                      columns={columns}
                      claudeFeatureCmd={claudeFeatureCmd}
                    />
                  )}
                </SortablePhase>
              )
            )}
          </SortableContext>

          <DragOverlay>
            {activePhaseDrag && fazConfig[activePhaseDrag] ? (
              <div className={cn(
                'px-4 py-2.5 rounded-lg border bg-card shadow-lg border-l-[3px]',
                fazConfig[activePhaseDrag].color
              )}>
                <span className={cn('text-sm font-bold tracking-tight', fazConfig[activePhaseDrag].text)}>
                  {fazConfig[activePhaseDrag].name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add New Faz */}
        <button
          onClick={addNewFaz}
          className="w-full h-11 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors mb-5"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Faz Ekle
        </button>

        {/* Changelog */}
        <ChangelogSection
          changelog={changelog}
          onUpdate={updateChangelog}
          onDelete={deleteChangelog}
          onAdd={addChangelog}
          isCompact={isCompact}
        />

        {/* Footer */}
        <div className="mt-6 pb-4 text-center">
          <p className="text-[10px] font-mono-code text-muted-foreground/60 uppercase tracking-widest">
            Kairos v2.0 — VS Code
          </p>
        </div>
      </main>

      {/* PRD Modal */}
      <PrdModal prdRange={prdModal} open={!!prdModal} onClose={() => setPrdModal(null)} />

      {/* Komut Ekle Dialog */}
      <Dialog open={cmdDialogOpen} onOpenChange={setCmdDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4 text-primary" />
              Ozel Komut Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Komut Adi</label>
              <Input
                value={newCmdName}
                onChange={(e) => setNewCmdName(e.target.value)}
                placeholder="orn: Dev Server"
                className="h-8 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addCustomCommand()}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Komut</label>
              <Input
                value={newCmdText}
                onChange={(e) => setNewCmdText(e.target.value)}
                placeholder="orn: npm run dev"
                className="h-8 text-xs font-mono-code"
                onKeyDown={(e) => e.key === 'Enter' && addCustomCommand()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCmdDialogOpen(false)} className="text-xs">Iptal</Button>
            <Button size="sm" onClick={addCustomCommand} disabled={!newCmdName.trim() || !newCmdText.trim()} className="text-xs">Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Kairos Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Kairos Sifirla
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mevcut KAIROS.md dosyaniz yedeklenecek ve yeni bos bir kairos olusturulacak.
              Yedekler "Ayarlar &gt; Yedekler" sekmesinden geri yuklenebilir.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(false)} className="text-xs">Iptal</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                setResetting(true)
                try {
                  await api.resetRoadmap()
                  setResetDialogOpen(false)
                  setLoading(true)
                  loadData()
                } catch (err) {
                  console.error('Reset kairos error:', err)
                } finally {
                  setResetting(false)
                }
              }}
              disabled={resetting}
              className="text-xs gap-1.5"
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Sifirla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
