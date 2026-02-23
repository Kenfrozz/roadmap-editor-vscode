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
  FileText,
  Pencil,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'
import { GOREV_TURU_COLORS, GOREV_TURU_ICON_OPTIONS, LOCKED_COLUMN_KEYS } from '../lib/constants'
import { getGorevTuruIcon } from '../components/TaskTypeBadge'
import { ClaudeIcon } from '../components/ClaudeIcon'
import { api } from '../api'

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
  const [activeTab, setActiveTab] = useState('araclar')
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

  const handleDosyaAc = async (filename) => {
    try { await api.claudeDosyaAc(filename) } catch (e) { console.error(e) }
  }

  const handleDosyaEkle = async () => {
    try {
      const filename = await api.claudeDosyaEkle()
      if (!filename) return
      const dosyalar = settings.claude.dosyalar || []
      if (dosyalar.includes(filename)) return
      const updated = { ...settings, claude: { ...settings.claude, dosyalar: [...dosyalar, filename] } }
      setSettings(updated)
      await api.saveSettings(updated)
      originalSettingsRef.current = JSON.stringify(updated)
    } catch (e) { console.error(e) }
  }

  const handleDosyaSil = async (filename) => {
    const dosyalar = (settings.claude.dosyalar || []).filter(f => f !== filename)
    const updated = { ...settings, claude: { ...settings.claude, dosyalar } }
    setSettings(updated)
    await api.saveSettings(updated)
    originalSettingsRef.current = JSON.stringify(updated)
  }

  const [pluginInstalling, setPluginInstalling] = useState(false)
  const [pluginResult, setPluginResult] = useState(null)
  const [pluginDurum, setPluginDurum] = useState(null)
  const [pluginLoading, setPluginLoading] = useState(false)
  const [configEditing, setConfigEditing] = useState(null)
  const [configSaving, setConfigSaving] = useState(false)
  const [showNewCommand, setShowNewCommand] = useState(false)
  const [newCmdName, setNewCmdName] = useState('')
  const [newCmdContent, setNewCmdContent] = useState('')
  const [newCmdSaving, setNewCmdSaving] = useState(false)

  const loadPluginDurum = async () => {
    setPluginLoading(true)
    try {
      const durum = await api.pluginDurumYukle()
      setPluginDurum(durum)
      if (durum.installed && durum.pluginJson && durum.marketplaceJson) {
        setConfigEditing({
          pluginJson: { ...durum.pluginJson },
          marketplaceJson: { ...durum.marketplaceJson },
        })
      }
    } catch {
      setPluginDurum(null)
    } finally {
      setPluginLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'araclar') loadPluginDurum()
  }, [activeTab])

  const handlePluginInstall = async () => {
    setPluginInstalling(true)
    setPluginResult(null)
    try {
      const created = await api.claudePluginKur()
      setPluginResult({ success: true, created })
      await loadPluginDurum()
    } catch (e) {
      setPluginResult({ success: false, error: e.message })
    } finally {
      setPluginInstalling(false)
    }
  }

  const handleConfigSave = async () => {
    if (!configEditing) return
    setConfigSaving(true)
    try {
      await api.pluginYapilandirmaKaydet(configEditing.pluginJson, configEditing.marketplaceJson)
      await loadPluginDurum()
    } catch (e) {
      console.error('Config save error:', e)
    } finally {
      setConfigSaving(false)
    }
  }

  const handleEditCommand = async (name) => {
    try {
      await api.claudeDosyaAc(`kairos/plugins/kairos/commands/${name}.md`)
    } catch (e) {
      console.error('Command open error:', e)
    }
  }

  const handleDeleteCommand = async (name) => {
    try {
      await api.pluginKomutSil(name)
      await loadPluginDurum()
    } catch (e) {
      console.error('Command delete error:', e)
    }
  }

  const handleCreateCommand = async () => {
    if (!newCmdName.trim()) return
    setNewCmdSaving(true)
    try {
      await api.pluginKomutKaydet(newCmdName.trim(), newCmdContent)
      setShowNewCommand(false)
      setNewCmdName('')
      setNewCmdContent('')
      await loadPluginDurum()
    } catch (e) {
      console.error('Command create error:', e)
    } finally {
      setNewCmdSaving(false)
    }
  }

  const [backups, setBackups] = useState([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [restoringBackup, setRestoringBackup] = useState(null)

  useEffect(() => {
    if (activeTab === 'dosyalar') loadBackups()
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
    { id: 'araclar', label: 'Araclar', icon: Terminal },
    { id: 'dosyalar', label: 'Dosyalar', icon: FileCode2 },
    { id: 'proje', label: 'Proje', icon: Columns3 },
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

        {/* ══════════════════════════════════════ */}
        {/* ARACLAR: Terminal + Claude Code       */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 'araclar' && (
          <div className="space-y-8">
            {/* Terminal */}
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

            {/* Claude Code */}
            <div className="space-y-6">
              {/* Komut Ayarlari */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Claude Code</h2>
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
                        {pluginDurum?.installed
                          ? `v${pluginDurum.pluginJson?.version || '?'} · ${pluginDurum.komutlar.length} komut`
                          : '/kairos:build ve /kairos:test komutlarini projeye kurar'
                        }
                      </p>
                      <div className="mt-1">
                        {pluginLoading ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" /> Kontrol ediliyor...
                          </span>
                        ) : pluginDurum?.installed ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Kurulu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                            Kurulu degil
                          </span>
                        )}
                      </div>
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

              {/* Yapilandirma — sadece kuruluysa */}
              {pluginDurum?.installed && configEditing && (
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Yapilandirma</h2>
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Plugin Adi</label>
                      <Input
                        value={configEditing.pluginJson.name}
                        onChange={(e) => setConfigEditing(prev => ({ ...prev, pluginJson: { ...prev.pluginJson, name: e.target.value } }))}
                        className="h-8 text-xs font-mono-code"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Plugin Aciklama</label>
                      <Input
                        value={configEditing.pluginJson.description}
                        onChange={(e) => setConfigEditing(prev => ({ ...prev, pluginJson: { ...prev.pluginJson, description: e.target.value } }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Plugin Versiyon</label>
                      <Input
                        value={configEditing.pluginJson.version}
                        onChange={(e) => setConfigEditing(prev => ({ ...prev, pluginJson: { ...prev.pluginJson, version: e.target.value } }))}
                        className="h-8 text-xs font-mono-code"
                      />
                    </div>
                    <div className="border-t border-border/40 pt-3">
                      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Marketplace Adi</label>
                      <Input
                        value={configEditing.marketplaceJson.name}
                        onChange={(e) => setConfigEditing(prev => ({ ...prev, marketplaceJson: { ...prev.marketplaceJson, name: e.target.value } }))}
                        className="h-8 text-xs font-mono-code"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Marketplace Aciklama</label>
                      <Input
                        value={configEditing.marketplaceJson.description}
                        onChange={(e) => setConfigEditing(prev => ({ ...prev, marketplaceJson: { ...prev.marketplaceJson, description: e.target.value } }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={handleConfigSave}
                        disabled={configSaving}
                      >
                        {configSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Kaydet
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Komutlar — sadece kuruluysa */}
              {pluginDurum?.installed && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Komutlar</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => { setShowNewCommand(true); setNewCmdName(''); setNewCmdContent('---\ndescription: Aciklama\n---\n\nKomut icerigi...\n'); }}
                    >
                      <Plus className="w-3 h-3" />
                      Yeni Komut
                    </Button>
                  </div>

                  {pluginDurum.komutlar.length === 0 && !showNewCommand && (
                    <div className="rounded-lg border bg-card p-6 text-center">
                      <p className="text-xs text-muted-foreground/60">Henuz komut bulunmuyor</p>
                    </div>
                  )}

                  {pluginDurum.komutlar.length > 0 && (
                    <div className="rounded-lg border bg-card overflow-hidden divide-y divide-border/40">
                      {pluginDurum.komutlar.map((komut) => (
                        <div key={komut.name}>
                          <div className="px-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <p className="text-xs font-bold font-mono-code">/kairos:{komut.name}</p>
                                </div>
                                {komut.description && (
                                  <p className="text-[11px] text-muted-foreground mt-1 ml-5">{komut.description}</p>
                                )}
                                {komut.argumentHint && (
                                  <p className="text-[10px] text-muted-foreground/60 font-mono-code mt-0.5 ml-5">hint: {komut.argumentHint}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditCommand(komut.name)}
                                  title="VS Code'da Ac"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteCommand(komut.name)}
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                  {/* Yeni Komut Formu */}
                  {showNewCommand && (
                    <div className="rounded-lg border bg-card p-4 space-y-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Yeni Komut Ekle</h3>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Komut Adi</label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={newCmdName}
                            onChange={(e) => setNewCmdName(e.target.value)}
                            className="h-8 text-xs font-mono-code"
                            placeholder="deploy"
                          />
                          <span className="text-[10px] text-muted-foreground/60 shrink-0">orn: deploy</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Icerik</label>
                        <textarea
                          value={newCmdContent}
                          onChange={(e) => setNewCmdContent(e.target.value)}
                          className="w-full h-40 px-3 py-2 rounded-md border border-input bg-background text-xs font-mono-code resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                          spellCheck={false}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setShowNewCommand(false); setNewCmdName(''); setNewCmdContent(''); }}
                        >
                          Iptal
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          onClick={handleCreateCommand}
                          disabled={newCmdSaving || !newCmdName.trim()}
                        >
                          {newCmdSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Olustur
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* DOSYALAR: Proje Dosyalari + Yedekler  */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 'dosyalar' && (
          <div className="space-y-8">
            {/* Proje Dosyalari */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proje Dosyalari</h2>

              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
                <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Claude Code'un proje baglaminda kullandigi dosyalar. Dosya adina tiklayarak VS Code editorunde acabilirsiniz.
                </p>
              </div>

              <div className="rounded-lg border bg-card overflow-hidden">
                {(settings.claude.dosyalar || []).length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <p className="text-xs text-muted-foreground/60">Henuz dosya eklenmemis</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {(settings.claude.dosyalar || []).map((dosya) => (
                      <div key={dosya} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors group">
                        <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <button
                          className="flex-1 text-left text-xs font-mono-code text-foreground hover:text-primary transition-colors truncate"
                          onClick={() => handleDosyaAc(dosya)}
                          title={`${dosya} dosyasini VS Code'da ac`}
                        >
                          {dosya}
                        </button>
                        <button
                          className="p-1 rounded-md text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive hover:bg-destructive/10 transition-all shrink-0"
                          onClick={() => handleDosyaSil(dosya)}
                          title="Listeden kaldir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleDosyaEkle}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-t border-dashed border-border/60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Dosya Ekle
                </button>
              </div>
            </div>

            {/* Yedekler */}
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
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* PROJE: Plan Sutunlari + Gorev Turleri */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 'proje' && (
          <div className="space-y-8">
            {/* Plan Sutunlari */}
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

            {/* Gorev Turleri */}
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
