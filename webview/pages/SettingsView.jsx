import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Trash2,
  Plus,
  Terminal,
  Columns3,
  Save,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Cog,
  AlertTriangle,
  History,
  Download,
  RotateCcw,
  Tag,
  FileCode2,
  Puzzle,
  Check,
  X,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'
import { GOREV_TURU_COLORS, GOREV_TURU_ICON_OPTIONS, LOCKED_COLUMN_KEYS } from '../lib/constants'
import { getGorevTuruIcon } from '../components/TaskTypeBadge'
import { ClaudeIcon } from '../components/ClaudeIcon'
import { api } from '../vscodeApi'

// ═══════════════════════════════════════════
// SETTINGS: SORTABLE COLUMN ROW
// ═══════════════════════════════════════════
function SortableColumnRow({ col, index, onUpdate, onDelete }) {
  const isLocked = LOCKED_COLUMN_KEYS.includes(col.key)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.key, disabled: isLocked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 border-b border-border/40',
        isDragging && 'opacity-40 bg-muted',
      )}
    >
      <div className="p-1 shrink-0">
        {isLocked ? (
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/10" />
        ) : (
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <span className="text-[10px] font-mono-code text-muted-foreground/50 w-5 shrink-0 text-center">{index + 1}</span>

      <Input
        value={col.label}
        onChange={(e) => onUpdate(col.key, 'label', e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        disabled={isLocked}
        className={cn('h-7 text-xs flex-1', isLocked && 'opacity-60')}
      />

      <select
        value={col.type}
        onChange={(e) => onUpdate(col.key, 'type', e.target.value)}
        disabled={isLocked}
        className={cn(
          'h-7 px-2 rounded-md border text-xs bg-background',
          isLocked && 'opacity-60'
        )}
      >
        <option value="status">Durum</option>
        <option value="text">Metin</option>
        <option value="date">Tarih</option>
      </select>

      <button
        className={cn(
          'p-1 rounded-md transition-colors shrink-0',
          isLocked ? 'opacity-0 pointer-events-none' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
        )}
        onClick={() => !isLocked && onDelete(col.key)}
        disabled={isLocked}
        title={isLocked ? 'Bu sutun silinemez' : 'Sutunu sil'}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
// SETTINGS VIEW
// ═══════════════════════════════════════════
export function SettingsView({ onClose, onSaved, isCompact, onReset }) {
  const [activeTab, setActiveTab] = useState('terminal')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const originalSettingsRef = useRef(null)

  useEffect(() => {
    api.loadSettings().then(s => {
      originalSettingsRef.current = JSON.stringify(s)
      setSettings(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const isDirty = settings && originalSettingsRef.current && JSON.stringify(settings) !== originalSettingsRef.current

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await api.saveSettings(settings)
      originalSettingsRef.current = JSON.stringify(settings)
      onSaved()
    } catch (err) {
      console.error('Settings save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDetectTerminals = async () => {
    setScanning(true)
    try {
      const terminals = await api.detectTerminals()
      setSettings(prev => ({ ...prev, terminal: { ...prev.terminal, availableTerminals: terminals } }))
    } catch (err) {
      console.error('Detect terminals error:', err)
    } finally {
      setScanning(false)
    }
  }

  // Column DnD
  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleColumnDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    if (LOCKED_COLUMN_KEYS.includes(active.id)) return
    const cols = settings.roadmap.columns
    const oldIndex = cols.findIndex(c => c.key === active.id)
    const newIndex = cols.findIndex(c => c.key === over.id)
    const lockedCount = cols.filter(c => LOCKED_COLUMN_KEYS.includes(c.key)).length
    if (newIndex < lockedCount) return
    setSettings(prev => ({
      ...prev,
      roadmap: { ...prev.roadmap, columns: arrayMove(prev.roadmap.columns, oldIndex, newIndex) },
    }))
  }

  const updateColumn = (key, field, value) => {
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: prev.roadmap.columns.map(c => c.key === key ? { ...c, [field]: value } : c),
      },
    }))
  }

  const deleteColumn = (key) => {
    if (LOCKED_COLUMN_KEYS.includes(key)) return
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: prev.roadmap.columns.filter(c => c.key !== key),
      },
    }))
  }

  const addColumn = () => {
    const newKey = `custom_${Date.now()}`
    setSettings(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap,
        columns: [...prev.roadmap.columns, { key: newKey, label: 'Yeni Sutun', type: 'text' }],
      },
    }))
  }

  // Claude dosya duzenleyicileri
  const [claudeMd, setClaudeMd] = useState(null)
  const [archMd, setArchMd] = useState(null)
  const [claudeMdLoading, setClaudeMdLoading] = useState(false)
  const [archMdLoading, setArchMdLoading] = useState(false)
  const [claudeMdSaving, setClaudeMdSaving] = useState(false)
  const [archMdSaving, setArchMdSaving] = useState(false)
  const [pluginInstalling, setPluginInstalling] = useState(false)
  const [pluginResult, setPluginResult] = useState(null)

  const loadClaudeFiles = async () => {
    setClaudeMdLoading(true)
    setArchMdLoading(true)
    try {
      const c = await api.claudeDosyaYukle('CLAUDE.md')
      setClaudeMd(c ? c.content : '')
    } catch { setClaudeMd('') }
    finally { setClaudeMdLoading(false) }
    try {
      const a = await api.claudeDosyaYukle('ARCHITECTURE.md')
      setArchMd(a ? a.content : '')
    } catch { setArchMd('') }
    finally { setArchMdLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'claude' && claudeMd === null) loadClaudeFiles()
  }, [activeTab])

  const handleClaudeMdSave = async () => {
    setClaudeMdSaving(true)
    try { await api.claudeDosyaKaydet('CLAUDE.md', claudeMd) } catch (e) { console.error(e) }
    finally { setClaudeMdSaving(false) }
  }

  const handleArchMdSave = async () => {
    setArchMdSaving(true)
    try { await api.claudeDosyaKaydet('ARCHITECTURE.md', archMd) } catch (e) { console.error(e) }
    finally { setArchMdSaving(false) }
  }

  const handlePluginInstall = async () => {
    setPluginInstalling(true)
    setPluginResult(null)
    try {
      const created = await api.claudePluginKur()
      setPluginResult({ success: true, created })
    } catch (e) {
      setPluginResult({ success: false, error: e.message })
    } finally {
      setPluginInstalling(false)
    }
  }

  const [backups, setBackups] = useState([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(null)

  useEffect(() => {
    if (activeTab === 'backups') loadBackups()
  }, [activeTab])

  const loadBackups = async () => {
    setLoadingBackups(true)
    try {
      const list = await api.listBackups()
      setBackups(list || [])
    } catch {
      setBackups([])
    } finally {
      setLoadingBackups(false)
    }
  }

  const handleRestore = async (filename) => {
    setRestoringBackup(filename)
    try {
      await api.restoreBackup(filename)
      onSaved()
    } catch (err) {
      console.error('Restore error:', err)
    } finally {
      setRestoringBackup(null)
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'claude', label: 'Claude Code', icon: () => <ClaudeIcon className="w-3.5 h-3.5" /> },
    { id: 'roadmap', label: 'Plan', icon: Columns3 },
    { id: 'gorevTurleri', label: 'Gorev Turleri', icon: Tag },
    { id: 'backups', label: 'Yedekler', icon: History },
  ]

  return (
    <div className="min-h-screen">
      {/* Settings Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Cog className="w-4 h-4 text-muted-foreground" />
              <h1 className="text-sm font-bold tracking-tight">Ayarlar</h1>
            </div>
          </div>
          <div className="w-7" />
        </div>
      </header>

      <div className={cn('mx-auto py-5 px-3', isCompact ? 'max-w-full' : 'max-w-2xl')}>
        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg bg-muted/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {!isCompact && tab.label}
            </button>
          ))}
        </div>

        {/* -- Terminal Sekmesi -- */}
        {activeTab === 'terminal' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Terminal Ayarlari</h2>

            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Varsayilan Terminal</label>
                <div className="flex items-center gap-2">
                  <select
                    value={settings.terminal.defaultTerminalId || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, terminal: { ...prev.terminal, defaultTerminalId: e.target.value || null } }))}
                    className="h-8 flex-1 px-2.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  >
                    <option value="">VS Code Varsayilani</option>
                    {settings.terminal.availableTerminals.map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleDetectTerminals}
                    disabled={scanning}
                    title="Terminalleri Tara"
                  >
                    {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                {settings.terminal.defaultTerminalId && (() => {
                  const selected = settings.terminal.availableTerminals.find(t => t.id === settings.terminal.defaultTerminalId)
                  return selected ? (
                    <p className="text-[10px] text-muted-foreground/60 font-mono-code mt-1.5 truncate">{selected.path}</p>
                  ) : null
                })()}
                {settings.terminal.availableTerminals.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                    Kurulu terminalleri tespit etmek icin "Tara" butonuna tiklayin
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -- Claude Code Sekmesi -- */}
        {activeTab === 'claude' && (
          <div className="space-y-6">
            {/* Komut Ayarlari */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Komut Ayarlari</h2>
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Ana Claude Komutu</label>
                  <Input
                    value={settings.claude.mainCommand}
                    onChange={(e) => setSettings(prev => ({ ...prev, claude: { ...prev.claude, mainCommand: e.target.value } }))}
                    className="h-8 text-xs font-mono-code"
                    placeholder="claude --dangerously-skip-permissions"
                  />
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Header'daki Claude butonuna tiklandiginda calistirilacak komut
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Ozellik Claude Komutu</label>
                  <Input
                    value={settings.claude.featureCommand}
                    onChange={(e) => setSettings(prev => ({ ...prev, claude: { ...prev.claude, featureCommand: e.target.value } }))}
                    className="h-8 text-xs font-mono-code"
                    placeholder='claude "${ozellik}"'
                  />
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Satirdaki Claude butonuna tiklandiginda calistirilacak komut. <code className="px-1 py-0.5 rounded bg-muted text-[10px]">{'${ozellik}'}</code> ozellik adiyla degistirilir.
                  </p>
                </div>
              </div>
            </div>

            {/* Plugin Yonetimi */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plugin Yonetimi</h2>
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Puzzle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">Kairos Plugin</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      /kairos:build ve /kairos:test komutlarini projeye kurar
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 shrink-0"
                    onClick={handlePluginInstall}
                    disabled={pluginInstalling}
                  >
                    {pluginInstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Puzzle className="w-3 h-3" />}
                    Kur / Guncelle
                  </Button>
                </div>
                {pluginResult && (
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-[11px]',
                    pluginResult.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                  )}>
                    {pluginResult.success ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    {pluginResult.success ? `Plugin kuruldu (${pluginResult.created.length} dosya)` : pluginResult.error}
                  </div>
                )}
              </div>
            </div>

            {/* CLAUDE.md Duzenleme */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5" />
                  CLAUDE.md
                </span>
              </h2>
              <div className="rounded-lg border bg-card overflow-hidden">
                {claudeMdLoading ? (
                  <div className="p-8 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <textarea
                      value={claudeMd || ''}
                      onChange={(e) => setClaudeMd(e.target.value)}
                      className="w-full min-h-[200px] p-3 text-xs font-mono-code bg-background resize-y focus:outline-none"
                      placeholder="# CLAUDE.md&#10;&#10;Proje kurallari, mimari yapilandirma ve konvansiyonlari buraya yazin.&#10;Claude Code bu dosyayi okuyarak projenize uygun calisir."
                      spellCheck={false}
                    />
                    <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/30">
                      <p className="text-[10px] text-muted-foreground/60">
                        Claude Code bu dosyayi proje baglaminda kullanir
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2"
                        onClick={handleClaudeMdSave}
                        disabled={claudeMdSaving}
                      >
                        {claudeMdSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Kaydet
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ARCHITECTURE.md Duzenleme */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5" />
                  ARCHITECTURE.md
                </span>
              </h2>
              <div className="rounded-lg border bg-card overflow-hidden">
                {archMdLoading ? (
                  <div className="p-8 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <textarea
                      value={archMd || ''}
                      onChange={(e) => setArchMd(e.target.value)}
                      className="w-full min-h-[200px] p-3 text-xs font-mono-code bg-background resize-y focus:outline-none"
                      placeholder="# ARCHITECTURE.md&#10;&#10;Projenin mimari yapisini, katman izolasyonunu ve onemli dosya yollarini buraya yazin."
                      spellCheck={false}
                    />
                    <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/30">
                      <p className="text-[10px] text-muted-foreground/60">
                        Proje mimarisini tanimlar, opsiyoneldir
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2"
                        onClick={handleArchMdSave}
                        disabled={archMdSaving}
                      >
                        {archMdSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Kaydet
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -- Plan Sekmesi -- */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan Sutunlari</h2>

            {/* Uyari */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Sutun degisiklikleri kaydedildiginde veriler yeniden yazilir. Mevcut veriler yeni sutun yapisina gore guncellenir.
              </p>
            </div>

            {/* Column List */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-center border-b border-border/40 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">
                <div className="w-8 shrink-0"></div>
                <div className="w-5 shrink-0"></div>
                <div className="flex-1 px-1">Isim</div>
                <div className="w-24 text-center">Tip</div>
                <div className="w-8"></div>
              </div>

              <DndContext sensors={columnSensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                <SortableContext items={settings.roadmap.columns.map(c => c.key)} strategy={verticalListSortingStrategy}>
                  {settings.roadmap.columns.map((col, idx) => (
                    <SortableColumnRow
                      key={col.key}
                      col={col}
                      index={idx}
                      onUpdate={updateColumn}
                      onDelete={deleteColumn}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add Column */}
              <button
                onClick={addColumn}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-t border-dashed border-border/60"
              >
                <Plus className="w-3.5 h-3.5" />
                Sutun Ekle
              </button>
            </div>
          </div>
        )}

        {/* -- Gorev Turleri Sekmesi -- */}
        {activeTab === 'gorevTurleri' && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gorev Turleri</h2>

            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
              <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Gorev turleri, her goreve atanabilecek kategorilerdir. Varsayilan listede degisiklik yapabilir, yeni turler ekleyebilir veya mevcut turleri kaldirabilirsiniz.
              </p>
            </div>

            {/* Tur Listesi */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-center border-b border-border/40 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">
                <div className="w-8 shrink-0 text-center">Icon</div>
                <div className="w-8 shrink-0 text-center">Renk</div>
                <div className="flex-1 px-2">Isim</div>
                <div className="w-8"></div>
              </div>

              {(settings.roadmap.gorevTurleri || []).map((tur) => {
                const colorSet = GOREV_TURU_COLORS[tur.color] || GOREV_TURU_COLORS.slate
                const TurIcon = getGorevTuruIcon(tur.icon)
                return (
                  <div key={tur.key} className="flex items-center gap-2 px-3 py-2 border-b border-border/40 last:border-b-0">
                    <div className="w-8 shrink-0 flex items-center justify-center">
                      <TurIcon className={cn('w-4 h-4', colorSet.text)} />
                    </div>
                    <div className="w-8 shrink-0 flex items-center justify-center">
                      <div className={cn('w-3.5 h-3.5 rounded-full', colorSet.dot)} />
                    </div>
                    <Input
                      value={tur.label}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          roadmap: {
                            ...prev.roadmap,
                            gorevTurleri: prev.roadmap.gorevTurleri.map(t =>
                              t.key === tur.key ? { ...t, label: e.target.value } : t
                            ),
                          },
                        }))
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                      className="h-7 text-xs flex-1"
                    />
                    <button
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          roadmap: {
                            ...prev.roadmap,
                            gorevTurleri: prev.roadmap.gorevTurleri.filter(t => t.key !== tur.key),
                          },
                        }))
                      }}
                      title="Turu sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}

              {(settings.roadmap.gorevTurleri || []).length === 0 && (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs text-muted-foreground/60">Henuz gorev turu eklenmemis</p>
                </div>
              )}
            </div>

            {/* Yeni Tur Ekle */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Yeni Tur Ekle</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Isim</label>
                  <Input
                    id="new-tur-label"
                    placeholder="Ornegin: Dokumantasyon"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Icon</label>
                  <div className="flex flex-wrap gap-1">
                    {GOREV_TURU_ICON_OPTIONS.map(iconKey => {
                      const IconComp = getGorevTuruIcon(iconKey)
                      return (
                        <button
                          key={iconKey}
                          className={cn(
                            'w-7 h-7 rounded-md flex items-center justify-center border transition-all',
                            'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground',
                          )}
                          onClick={(e) => {
                            const parent = e.target.closest('.flex')
                            parent.querySelectorAll('button').forEach(b => { b.classList.remove('ring-2', 'ring-primary', 'bg-primary/10'); b.classList.add('border-border') })
                            const btn = e.target.closest('button')
                            btn.classList.add('ring-2', 'ring-primary', 'bg-primary/10')
                            btn.classList.remove('border-border')
                            const hidden = document.getElementById('new-tur-icon')
                            if (hidden) hidden.value = iconKey
                          }}
                          title={iconKey}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </button>
                      )
                    })}
                    <input type="hidden" id="new-tur-icon" defaultValue="Circle" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Renk</label>
                  <div className="flex items-center gap-1.5">
                    {Object.keys(GOREV_TURU_COLORS).map(colorKey => (
                      <button
                        key={colorKey}
                        className={cn(
                          'w-6 h-6 rounded-full transition-all ring-offset-1 ring-offset-background',
                          GOREV_TURU_COLORS[colorKey].dot,
                          'hover:ring-2 hover:ring-primary/40',
                        )}
                        onClick={(e) => {
                          const parent = e.target.closest('.flex')
                          parent.querySelectorAll('button').forEach(b => b.classList.remove('ring-2', 'ring-primary'))
                          e.target.classList.add('ring-2', 'ring-primary')
                          const hidden = document.getElementById('new-tur-color')
                          if (hidden) hidden.value = colorKey
                        }}
                        title={colorKey}
                      />
                    ))}
                    <input type="hidden" id="new-tur-color" defaultValue="slate" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 w-full"
                  onClick={() => {
                    const input = document.getElementById('new-tur-label')
                    const label = input?.value?.trim()
                    if (!label) return
                    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
                    if (!key) return
                    const exists = (settings.roadmap.gorevTurleri || []).some(t => t.key === key)
                    if (exists) return
                    const selectedColor = document.getElementById('new-tur-color')?.value || 'slate'
                    const selectedIcon = document.getElementById('new-tur-icon')?.value || 'Circle'
                    setSettings(prev => ({
                      ...prev,
                      roadmap: {
                        ...prev.roadmap,
                        gorevTurleri: [...(prev.roadmap.gorevTurleri || []), { key, label, color: selectedColor, icon: selectedIcon }],
                      },
                    }))
                    if (input) input.value = ''
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ekle
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* -- Yedekler Sekmesi -- */}
        {activeTab === 'backups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Yedekler</h2>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={loadBackups}
                disabled={loadingBackups}
              >
                {loadingBackups ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Yenile
              </Button>
            </div>

            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
              <History className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Kairos sifirlandiginda veya yedekten geri yuklendiginde mevcut dosya otomatik olarak yedeklenir.
                Hicbir veri kaybolmaz.
              </p>
            </div>

            {backups.length === 0 && !loadingBackups && (
              <div className="rounded-lg border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                  <History className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Henuz yedek bulunmuyor</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Kairos sifirlandiginda yedekler burada goruntulenir</p>
                </div>
              </div>
            )}

            {loadingBackups && (
              <div className="rounded-lg border bg-card p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {backups.length > 0 && (
              <div className="rounded-lg border bg-card overflow-hidden divide-y divide-border/40">
                {backups.map((backup) => {
                  const date = new Date(backup.timestamp)
                  const sizeKB = (backup.size / 1024).toFixed(1)
                  return (
                    <div key={backup.filename} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {format(date, 'dd MMM yyyy, HH:mm:ss', { locale: tr })}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono-code mt-0.5">
                          {sizeKB} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 shrink-0 ml-3"
                        onClick={() => handleRestore(backup.filename)}
                        disabled={restoringBackup === backup.filename}
                      >
                        {restoringBackup === backup.filename
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Download className="w-3 h-3" />
                        }
                        Geri Yukle
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Kairos Sifirla */}
            <div className="pt-4 border-t border-border/40 mt-4">
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Kairos Sifirla
              </button>
              <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
                Mevcut dosya yedeklenir, yeni bos plan olusturulur
              </p>
            </div>
          </div>
        )}

        {/* Kaydet Butonu -- sadece degisiklik varsa gorunur */}
        {isDirty && (
          <div className="pt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
