import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { arrayMove } from '@dnd-kit/sortable'
import {
  Plus,
  X,
  Loader2,
  Activity,
  Terminal,
  RotateCcw,
  AlertTriangle,
  FileCode,
  Sparkles,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './components/ui/dialog'
import { cn, buildPrdRef } from './lib/utils'
import { api, state, onMessage } from './api'
import { useTheme } from './lib/theme'
import { useContainerWidth, useIsWide } from './lib/hooks'
import { DEFAULT_COLUMNS, DEFAULT_FAZ_CONFIG, FAZ_COLORS, DEFAULT_GOREV_TURLERI } from './lib/constants'
import { Sidebar } from './components/Sidebar'
import { SortablePhase } from './components/SortableRow'
import { FazTable } from './components/FazTable'
import { DndManager } from './components/DndManager'
import { computeStatusBreakdown, computeDateStats, computeDateDistribution } from './lib/statsUtils'
import { PrdLinePicker } from './components/PrdLinePicker'
import { SettingsView } from './pages/SettingsView'
import { SetupWizard } from './pages/SetupWizard'
import { Titlebar } from './components/Titlebar'
import { ProjectPicker } from './pages/ProjectPicker'
import { KokpitView } from './pages/KokpitView'
import { DashboardView } from './pages/DashboardView'
import { GitView } from './pages/GitView'
import { projectApi } from './bridge'

// === Recursive tree helpers ===
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

function updateItemDeep(items, itemId, field, value) {
  return items.map(item => {
    if (item.id === itemId) return { ...item, [field]: value }
    if (item.children?.length > 0) return { ...item, children: updateItemDeep(item.children, itemId, field, value) }
    return item
  })
}

function deleteItemDeep(items, itemId) {
  return items.filter(i => i.id !== itemId).map(i =>
    i.children?.length > 0 ? { ...i, children: deleteItemDeep(i.children, itemId) } : i
  )
}

function addBelowDeep(items, itemId, newItem) {
  const result = []
  for (const item of items) {
    result.push(item.children?.length > 0
      ? { ...item, children: addBelowDeep(item.children, itemId, newItem) }
      : item)
    if (item.id === itemId) result.push(newItem)
  }
  return result
}

function addChildDeep(items, parentId, newItem) {
  return items.map(item => {
    if (item.id === parentId) return { ...item, children: [...(item.children || []), newItem] }
    if (item.children?.length > 0) return { ...item, children: addChildDeep(item.children, parentId, newItem) }
    return item
  })
}

function isItemComplete(item, statusKeys) {
  if (item.children?.length > 0) return item.children.every(c => isItemComplete(c, statusKeys))
  return statusKeys.every(k => item[k] === '\u2705')
}

function propagateCompletion(items, statusKeys) {
  return items.map(item => {
    if (!item.children?.length) return item
    const updatedChildren = propagateCompletion(item.children, statusKeys)
    const allDone = updatedChildren.every(c => isItemComplete(c, statusKeys))
    if (allDone) {
      const updated = { ...item, children: updatedChildren }
      statusKeys.forEach(k => { updated[k] = '\u2705' })
      return updated
    }
    return { ...item, children: updatedChildren }
  })
}

function filterItemsDeep(items, search) {
  return items.reduce((acc, item) => {
    const matchesSelf = (item.ozellik || '').toLowerCase().includes(search)
      || (item.detay || '').toLowerCase().includes(search)
      || (item.not || '').toLowerCase().includes(search)
    const filteredChildren = item.children?.length > 0
      ? filterItemsDeep(item.children, search)
      : []
    if (matchesSelf || filteredChildren.length > 0) {
      acc.push({ ...item, children: filteredChildren })
    }
    return acc
  }, [])
}

function flattenLeafItems(items) {
  const result = []
  for (const item of items) {
    if (item.children?.length > 0) {
      result.push(...flattenLeafItems(item.children))
    } else {
      result.push(item)
    }
  }
  return result
}

export default function App() {
  const dark = useTheme()
  const [containerRef, isCompact] = useContainerWidth()
  const isWide = useIsWide()
  const [data, setData] = useState({})
  const [fazConfig, setFazConfig] = useState(DEFAULT_FAZ_CONFIG)
  const [fazOrder, setFazOrder] = useState(['faz1', 'faz2', 'faz3', 'faz4'])
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [gorevTurleri, setGorevTurleri] = useState(DEFAULT_GOREV_TURLERI)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [prdPicker, setPrdPicker] = useState(null)
  const [customCommands, setCustomCommands] = useState(() => state.get('customCommands', []))
  const [cmdDialogOpen, setCmdDialogOpen] = useState(false)
  const [newCmdName, setNewCmdName] = useState('')
  const [newCmdText, setNewCmdText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [fileNotFound, setFileNotFound] = useState(false)
  const [viewMode, setViewMode] = useState('dashboard')
  const [settingsData, setSettingsData] = useState(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState('Proje')
  const [appVersion, setAppVersion] = useState('1.0.0')
  const [resetting, setResetting] = useState(false)
  const [firstRunDialog, setFirstRunDialog] = useState(false)
  const [firstRunProcessing, setFirstRunProcessing] = useState(false)
  const [gitDurum, setGitDurum] = useState(null)
  const [needsProject, setNeedsProject] = useState(false)
  const [projectPath, setProjectPath] = useState('')
  const [projectChecked, setProjectChecked] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [projectLogo, setProjectLogo] = useState(null)
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
      const { _fazNames, _fazOrder: loadedFazOrder, _columns: loadedColumns, _firstRun, _projectName, _version, _projectPath: loadedProjectPath, ...fazData } = loadedData
      if (_projectName) setProjectName(_projectName)
      if (_version) setAppVersion(_version)
      if (loadedProjectPath) setProjectPath(loadedProjectPath)
      setData(fazData)
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

  // Proje secimine ihtiyac var mi kontrol et
  useEffect(() => {
    projectApi.hasProject().then(has => {
      if (!has) {
        setNeedsProject(true)
        setLoading(false)
      }
      setProjectChecked(true)
    }).catch(() => setProjectChecked(true))
  }, [])

  useEffect(() => {
    if (!projectChecked || needsProject) return
    loadData()
    api.loadSettings().then(s => {
      setSettingsData(s)
      if (s?.roadmap?.gorevTurleri) setGorevTurleri(s.roadmap.gorevTurleri)
    }).catch(() => {})
  }, [loadData, projectChecked, needsProject])

  // Logo tarama
  useEffect(() => {
    if (!projectChecked || needsProject) return
    api.logoTara().then(setProjectLogo).catch(() => {})
  }, [projectChecked, needsProject])

  useEffect(() => {
    fazOrderRef.current = fazOrder
  }, [fazOrder])

  useEffect(() => {
    if (!projectChecked || needsProject) return
    const cleanup = onMessage('fileChanged', () => {
      loadData()
    })
    return cleanup
  }, [loadData, projectChecked, needsProject])

  const refreshGitDurum = useCallback(async () => {
    try {
      const d = await api.gitDurum()
      setGitDurum(d)
    } catch {
      setGitDurum(null)
    }
  }, [])

  useEffect(() => {
    if (!projectChecked || needsProject) return
    refreshGitDurum()
    const interval = setInterval(refreshGitDurum, 5000)
    return () => clearInterval(interval)
  }, [refreshGitDurum, projectChecked, needsProject])

  const autoSave = useCallback((newData, newFazConfig, newFazOrder) => {
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const orderToSave = newFazOrder || fazOrderRef.current
        await api.save({ ...newData, _fazConfig: newFazConfig, _fazOrder: orderToSave })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 800)
  }, [])

  const statusKeys = useMemo(() => columns.filter(c => c.type === 'status').map(c => c.key), [columns])

  const updateItem = (fazKey, itemId, fieldOrObj, value) => {
    let newItems = data[fazKey] || []
    let needsPropagation = false
    if (typeof fieldOrObj === 'object') {
      for (const [f, v] of Object.entries(fieldOrObj)) {
        newItems = updateItemDeep(newItems, itemId, f, v)
        if (statusKeys.includes(f)) needsPropagation = true
      }
    } else {
      newItems = updateItemDeep(newItems, itemId, fieldOrObj, value)
      needsPropagation = statusKeys.includes(fieldOrObj)
    }
    if (needsPropagation) newItems = propagateCompletion(newItems, statusKeys)
    const newData = { ...data, [fazKey]: newItems }
    setData(newData)
    autoSave(newData, fazConfig)
  }

  const deleteItem = (fazKey, itemId) => {
    const newData = { ...data, [fazKey]: deleteItemDeep(data[fazKey] || [], itemId) }
    setData(newData)
    autoSave(newData, fazConfig)
  }

  const addItem = (fazKey) => {
    const newItem = { id: generateId() }
    columns.forEach(col => {
      newItem[col.key] = col.type === 'status' ? '\u274C' : ''
    })
    const newData = { ...data, [fazKey]: [...(data[fazKey] || []), newItem] }
    setData(newData)
    autoSave(newData, fazConfig)
  }

  const addItemBelow = (fazKey, itemId) => {
    const newItem = { id: generateId() }
    columns.forEach(col => {
      newItem[col.key] = col.type === 'status' ? '\u274C' : ''
    })
    const newData = { ...data, [fazKey]: addBelowDeep(data[fazKey] || [], itemId, newItem) }
    setData(newData)
    autoSave(newData, fazConfig)
  }

  const addSubtask = (fazKey, parentId) => {
    const newItem = { id: generateId() }
    columns.forEach(col => {
      newItem[col.key] = col.type === 'status' ? '\u274C' : ''
    })
    const newData = { ...data, [fazKey]: addChildDeep(data[fazKey] || [], parentId, newItem) }
    setData(newData)
    autoSave(newData, fazConfig)
  }

  const isFilterActive = searchText.trim() !== ''

  const filteredData = useMemo(() => {
    if (!isFilterActive) return data
    const result = {}
    const search = searchText.trim().toLowerCase()
    for (const [fazKey, items] of Object.entries(data)) {
      if (!Array.isArray(items)) continue
      result[fazKey] = filterItemsDeep(items, search)
    }
    return result
  }, [data, searchText, isFilterActive])

  const reorderItems = (fazKey, newItems) => {
    if (isFilterActive) return
    const newData = { ...data, [fazKey]: newItems }
    setData(newData)
    autoSave(newData, fazConfig)
  }

  const updateFazName = (fazKey, newName) => {
    const newConfig = { ...fazConfig, [fazKey]: { ...fazConfig[fazKey], name: newName } }
    setFazConfig(newConfig)
    autoSave(data, newConfig)
  }

  const addNewFaz = () => {
    const fazNum = fazOrder.length + 1
    const newKey = `faz${fazNum}`
    const colorIndex = (fazNum - 1) % FAZ_COLORS.length
    const newConfig = { ...fazConfig, [newKey]: { name: 'YENI FAZ', ...FAZ_COLORS[colorIndex] } }
    setFazConfig(newConfig)
    setFazOrder([...fazOrder, newKey])
    setData({ ...data, [newKey]: [] })
    autoSave({ ...data, [newKey]: [] }, newConfig)
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
    autoSave(newData, newConfig)
  }

  const reorderPhases = useCallback((activeId, overId) => {
    const oldIndex = fazOrder.indexOf(activeId)
    const newIndex = fazOrder.indexOf(overId)
    const newOrder = arrayMove(fazOrder, oldIndex, newIndex)
    setFazOrder(newOrder)
    autoSave(data, fazConfig, newOrder)
  }, [fazOrder, data, fazConfig, autoSave])

  const moveItem = useCallback((itemId, sourceFaz, targetFaz, newSourceItems, newTargetItems) => {
    const newData = { ...data, [sourceFaz]: newSourceItems, [targetFaz]: newTargetItems }
    setData(newData)
    autoSave(newData, fazConfig)
  }, [data, fazConfig, autoSave])

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

  // Stats — only count top-level (root) items
  const allRootItems = useMemo(() => {
    return Object.values(data).filter(Array.isArray).flat()
  }, [data])
  const total = allRootItems.length
  const statusColumns = columns.filter(c => c.type === 'status')
  const dateColumn = columns.find(c => c.type === 'date')

  const statusBreakdowns = useMemo(() => {
    return statusColumns.map(col => ({
      ...col,
      breakdown: computeStatusBreakdown(allRootItems, col.key),
    }))
  }, [allRootItems, statusColumns])

  const dateStats = useMemo(() => {
    if (!dateColumn) return null
    return computeDateStats(allRootItems, dateColumn.key, statusColumns.map(c => c.key))
  }, [allRootItems, dateColumn, statusColumns])

  const dateDist = useMemo(() => {
    if (!dateColumn) return null
    return computeDateDistribution(allRootItems, dateColumn.key, statusColumns.map(c => c.key))
  }, [allRootItems, dateColumn, statusColumns])

  const overallPct = useMemo(() => {
    if (total === 0 || statusColumns.length === 0) return 0
    let sum = 0
    for (const sc of statusColumns) {
      sum += allRootItems.filter(i => i[sc.key] === '\u2705').length
    }
    return Math.round((sum / (total * statusColumns.length)) * 100)
  }, [allRootItems, total, statusColumns])

  const fazProgress = useMemo(() => {
    return fazOrder.map(fazKey => {
      const items = data[fazKey] || []
      const t = items.length
      let d = 0
      if (statusColumns.length > 0) {
        for (const item of items) {
          if (statusColumns.every(sc => item[sc.key] === '\u2705')) d++
        }
      }
      return { key: fazKey, name: fazConfig[fazKey]?.name || fazKey, done: d, total: t, pct: t > 0 ? Math.round((d / t) * 100) : 0 }
    })
  }, [fazOrder, data, fazConfig, statusColumns])

  const handleProjectSwitch = useCallback(async () => {
    const selected = await projectApi.selectProject()
    if (selected) {
      setLoading(true)
      loadData()
    }
  }, [loadData])

  const handleProjectExit = useCallback(() => {
    setNeedsProject(true)
  }, [])

  const claudeMainCmd = settingsData?.claude?.mainCommand || 'claude --dangerously-skip-permissions'
  const claudeFeatureCmd = settingsData?.claude?.featureCommand || 'claude "${ozellik}"'

  const handlePdfExport = useCallback(async () => {
    try {
      await api.pdfOlustur({
        data,
        fazConfig,
        fazOrder,
        columns,
        projectName,
        projectDate: format(new Date(), 'dd.MM.yyyy', { locale: tr }),
      })
    } catch (err) {
      api.bildirimGoster(`PDF hatasi: ${err.message}`)
    }
  }, [data, fazConfig, fazOrder, columns, projectName])

  const sidebarProps = {
    expanded: sidebarExpanded,
    projectName,
    projectPath,
    projectLogo,
    onSwitchProject: handleProjectSwitch,
    onExitProject: handleProjectExit,
    onPdfExport: handlePdfExport,
    pdfDisabled: total === 0,
    searchText,
    onSearchChange: setSearchText,
    viewMode,
    onNavigate: (mode) => setViewMode(mode),
    appVersion,
  }

  const titlebarProps = {
    onToggleSidebar: () => setSidebarExpanded(prev => !prev),
    claudeMainCmd,
    onRunCommand: (cmd, name) => api.runTerminal(cmd, name),
    customCommands,
    onDeleteCommand: deleteCustomCommand,
    onAddCommand: () => setCmdDialogOpen(true),
  }

  // === PROJECT PICKER (Electron) ===
  if (needsProject) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Titlebar />
        <div className="flex-1 overflow-auto">
          <ProjectPicker onProjectSelected={() => {
            setNeedsProject(false)
            setLoading(true)
          }} />
        </div>
      </div>
    )
  }

  // === LOADING ===
  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Titlebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 grid-bg">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-xs font-mono-code text-muted-foreground">yukleniyor...</p>
        </div>
      </div>
    )
  }

  // === FIRST RUN ===
  if (firstRunDialog) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Titlebar />
        <div className="flex-1 grid-bg flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
              <FileCode className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight mb-2">Mevcut Proje Verisi Tespit Edildi</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bu projede zaten proje verisi mevcut. Bu veri eklentiyle uyumlu olmayabilir.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                Devam etmek icin mevcut veri yedeklenecek ve kurulum sihirbaziyla uyumlu yeni bir proje olusturulacak.
                Orijinal verileriniz Ayarlar &gt; Yedekler sekmesinden geri yuklenebilir.
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
      </div>
    )
  }

  // === FILE NOT FOUND — SETUP WIZARD ===
  if (fileNotFound) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Titlebar />
        <div className="flex-1 overflow-auto">
          <SetupWizard onCreated={() => {
            setFileNotFound(false)
            setLoading(true)
            loadData()
          }} />
        </div>
      </div>
    )
  }

  // === PAGE CONTENT (kosullu) ===
  const renderPage = () => {
    switch (viewMode) {
      case 'settings':
        return (
          <div className="flex-1 overflow-auto grid-bg">
            <SettingsView
              onClose={() => {
                setViewMode('dashboard')
                api.loadSettings().then(s => {
                  setSettingsData(s)
                  if (s?.roadmap?.gorevTurleri) setGorevTurleri(s.roadmap.gorevTurleri)
                }).catch(() => {})
              }}
              onSaved={() => {
                setLoading(true)
                api.loadSettings().then(s => {
                  setSettingsData(s)
                  if (s?.roadmap?.gorevTurleri) setGorevTurleri(s.roadmap.gorevTurleri)
                }).catch(() => {})
                loadData()
              }}
              isCompact={isCompact}
              onReset={() => setResetDialogOpen(true)}
            />
          </div>
        )
      case 'kokpit':
        return (
          <KokpitView
            data={data}
            fazConfig={fazConfig}
            fazOrder={fazOrder}
            columns={columns}
            gorevTurleri={gorevTurleri}
            isCompact={isCompact}
            onTaskStatusUpdate={updateItem}
          />
        )
      case 'dashboard':
        return (
          <DashboardView
            overallPct={overallPct}
            fazProgress={fazProgress}
            dateDist={dateDist}
            total={total}
            done={statusBreakdowns.length > 0 ? statusBreakdowns[0].breakdown.done : 0}
            isCompact={isCompact}
            data={data}
            fazConfig={fazConfig}
            fazOrder={fazOrder}
            columns={columns}
            gorevTurleri={gorevTurleri}
            allRootItems={allRootItems}
            statusBreakdowns={statusBreakdowns}
            dateStats={dateStats}
            statusColumns={statusColumns}
            dateColumn={dateColumn}
            isWide={isWide}
            onNavigate={(mode) => setViewMode(mode)}
          />
        )
      case 'git':
        return <GitView durum={gitDurum} onRefresh={refreshGitDurum} />
      default: // 'main' — Roadmap
        return (
          <>
            <main className={cn(
              'flex-1 grid-bg w-full',
              isWide ? 'flex flex-col overflow-hidden' : 'overflow-auto px-3 py-5'
            )}>
              <DndManager
                fazOrder={fazOrder}
                data={filteredData}
                fazConfig={fazConfig}
                isFilterActive={isFilterActive}
                onReorderPhases={reorderPhases}
                onMoveItem={moveItem}
                onReorderItems={reorderItems}
                kanban={isWide}
              >
                {({ overContainerId, activeType }) => (
                  <div className={cn(
                    isWide
                      ? 'flex gap-3 flex-1 px-3 pb-3 pt-1 overflow-hidden'
                      : ''
                  )}>
                    {fazOrder.map((fazKey, idx) =>
                      fazConfig[fazKey] && (
                        <SortablePhase
                          key={fazKey}
                          id={fazKey}
                          disabled={isFilterActive}
                          className={isWide ? 'flex-1 min-w-0 h-full' : ''}
                        >
                          {(dragHandleProps) => (
                            <FazTable
                              fazKey={fazKey}
                              fazConfig={fazConfig[fazKey]}
                              items={filteredData[fazKey] || []}
                              onUpdate={updateItem}
                              onDelete={deleteItem}
                              onAdd={addItem}
                              onAddBelow={addItemBelow}
                              onAddSubtask={addSubtask}
                              onReorder={reorderItems}
                              onPrdClick={(fazKey, itemId, prd) => setPrdPicker({ fazKey, itemId, prd: prd || '' })}
                              onPrdRefUpdate={(fazKey, itemId, newRef) => updateItem(fazKey, itemId, 'prd', newRef)}
                              onFazNameChange={updateFazName}
                              onFazDelete={deleteFaz}
                              index={idx}
                              isFilterActive={isFilterActive}
                              phaseDragHandleProps={dragHandleProps}
                              isCompact={isCompact}
                              columns={columns}
                              claudeFeatureCmd={claudeFeatureCmd}
                              gorevTurleri={gorevTurleri}
                              isDropTarget={activeType === 'item' && overContainerId === fazKey}
                              kanban={isWide}
                            />
                          )}
                        </SortablePhase>
                      )
                    )}

                    {isWide ? (
                      <button
                        onClick={addNewFaz}
                        className="w-10 shrink-0 h-full rounded-lg border-2 border-dashed border-border/50 hover:border-primary/40 flex items-center justify-center text-muted-foreground/40 hover:text-primary transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={addNewFaz}
                        className="w-full h-11 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors mb-5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Yeni Faz Ekle
                      </button>
                    )}
                  </div>
                )}
              </DndManager>

              {!isWide && (
                <div className="mt-6 pb-4 text-center">
                  <p className="text-[10px] font-mono-code text-muted-foreground/60 uppercase tracking-widest">
                    Kairos v{appVersion}
                  </p>
                </div>
              )}
            </main>

            <PrdLinePicker
              open={!!prdPicker}
              onClose={() => setPrdPicker(null)}
              prdRef={prdPicker?.prd || ''}
              onConfirm={(filename, start, end, hash) => {
                updateItem(prdPicker.fazKey, prdPicker.itemId, 'prd', buildPrdRef(filename, start, end, hash))
                setPrdPicker(null)
              }}
              onRefCorrected={(newRef) => {
                if (prdPicker) updateItem(prdPicker.fazKey, prdPicker.itemId, 'prd', newRef)
              }}
            />
          </>
        )
    }
  }

  return (
    <div ref={containerRef} className="flex h-screen overflow-hidden">
      <Sidebar {...sidebarProps} />
      <div className="flex flex-col flex-1 min-w-0">
        <Titlebar {...titlebarProps} />
        {renderPage()}
      </div>

      {/* Komut Ekle Dialog — tum sayfalarda erisilebilir */}
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
              Mevcut verileriniz yedeklenecek ve yeni bos bir proje olusturulacak.
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
