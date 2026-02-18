import { useState, useEffect } from 'react'
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
  Loader2,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Rocket,
  Check,
  CircleDot,
  Type,
  CalendarDays,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { cn } from '../lib/utils'
import { api } from '../vscodeApi'
import { DEFAULT_COLUMNS } from '../lib/constants'

// ═══════════════════════════════════════════
// SORTABLE COLUMN ROW (shared with SetupWizard)
// ═══════════════════════════════════════════
function SortableColumnRow({ col, index, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.key })
  const isOzellik = col.key === 'ozellik'

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
      <button
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <span className="text-[10px] font-mono-code text-muted-foreground/50 w-5 shrink-0 text-center">{index + 1}</span>

      <Input
        value={col.label}
        onChange={(e) => onUpdate(col.key, 'label', e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        disabled={isOzellik}
        className={cn('h-7 text-xs flex-1', isOzellik && 'opacity-60')}
      />

      <select
        value={col.type}
        onChange={(e) => onUpdate(col.key, 'type', e.target.value)}
        disabled={isOzellik}
        className={cn(
          'h-7 px-2 rounded-md border text-xs bg-background',
          isOzellik && 'opacity-60'
        )}
      >
        <option value="status">Durum</option>
        <option value="text">Metin</option>
        <option value="date">Tarih</option>
      </select>

      <button
        className={cn(
          'p-1 rounded-md transition-colors shrink-0',
          isOzellik ? 'opacity-0 pointer-events-none' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
        )}
        onClick={() => !isOzellik && onDelete(col.key)}
        disabled={isOzellik}
        title={isOzellik ? 'Bu sutun silinemez' : 'Sutunu sil'}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
// SETUP WIZARD
// ═══════════════════════════════════════════
export function SetupWizard({ onCreated }) {
  const [step, setStep] = useState(0)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.loadSettings().then(s => {
      setSettings(s)
      setLoading(false)
    }).catch(() => {
      setSettings({
        version: 1,
        terminal: { defaultTerminalId: null, availableTerminals: [] },
        claude: { mainCommand: 'claude --dangerously-skip-permissions', featureCommand: 'claude "/kairos:build ${ozellik}"' },
        roadmap: { columns: [...DEFAULT_COLUMNS] },
      })
      setLoading(false)
    })
  }, [])

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
    const cols = settings.roadmap.columns
    const oldIndex = cols.findIndex(c => c.key === active.id)
    const newIndex = cols.findIndex(c => c.key === over.id)
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

  const handleCreate = async () => {
    if (!settings) return
    setCreating(true)
    try {
      await api.createRoadmapWithSettings(settings)
      onCreated()
    } catch (err) {
      console.error('Create kairos error:', err)
    } finally {
      setCreating(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const steps = [
    { label: 'Hosgeldin', icon: Rocket },
    { label: 'Terminal', icon: Terminal },
    { label: 'Sutunlar', icon: Columns3 },
    { label: 'Olustur', icon: Check },
  ]

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-0 py-6 px-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all',
                i === step && 'bg-primary text-primary-foreground shadow-sm',
                i < step && 'bg-primary/15 text-primary cursor-pointer hover:bg-primary/25',
                i > step && 'bg-muted/50 text-muted-foreground/40',
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                i === step && 'bg-primary-foreground/20',
                i < step && 'bg-primary/20',
                i > step && 'bg-muted-foreground/10',
              )}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-8 h-px mx-1',
                i < step ? 'bg-primary/40' : 'bg-border',
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-lg">

          {/* -- Step 0: Welcome -- */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center gap-6 py-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <Rocket className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight mb-2">Kairos'a Hosgeldiniz</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  Bu sihirbaz ile projeniz icin proje verilerini olusturabilirsiniz.
                  Terminal, sutun ve diger ayarlari yapilandirip hemen baslayin.
                </p>
              </div>
              <Button onClick={() => setStep(1)} className="gap-2">
                Baslayalim
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* -- Step 1: Terminal Selection -- */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold tracking-tight mb-1">Terminal Ayarlari</h2>
                <p className="text-xs text-muted-foreground">Komutlari calistirmak icin kullanilacak terminali secin</p>
              </div>

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

              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setStep(0)} className="gap-1.5 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Geri
                </Button>
                <Button size="sm" onClick={() => setStep(2)} className="gap-1.5 text-xs">
                  Devam
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* -- Step 2: Column Customization -- */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold tracking-tight mb-1">Sutun Yapilandirmasi</h2>
                <p className="text-xs text-muted-foreground">Kairos tablonuzun sutunlarini duzenleyin, ekleyin veya siralayin</p>
              </div>

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

                <button
                  onClick={addColumn}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-t border-dashed border-border/60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Sutun Ekle
                </button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1.5 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Geri
                </Button>
                <Button size="sm" onClick={() => setStep(3)} className="gap-1.5 text-xs">
                  Devam
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* -- Step 3: Confirm & Create -- */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold tracking-tight mb-1">Ozet & Olustur</h2>
                <p className="text-xs text-muted-foreground">Ayarlarinizi kontrol edin ve projeyi olusturun</p>
              </div>

              {/* Summary Card */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                {/* Terminal */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Terminal className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground">Terminal</p>
                    <p className="text-xs font-bold truncate">
                      {settings.terminal.defaultTerminalId
                        ? (settings.terminal.availableTerminals.find(t => t.id === settings.terminal.defaultTerminalId)?.name || 'Secili')
                        : 'VS Code Varsayilani'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40" />

                {/* Columns */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Columns3 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Sutunlar ({settings.roadmap.columns.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {settings.roadmap.columns.map(col => (
                        <span key={col.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium">
                          {col.type === 'status' && <CircleDot className="w-2.5 h-2.5 text-emerald-500" />}
                          {col.type === 'text' && <Type className="w-2.5 h-2.5 text-blue-500" />}
                          {col.type === 'date' && <CalendarDays className="w-2.5 h-2.5 text-amber-500" />}
                          {col.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1.5 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Geri
                </Button>
                <Button onClick={handleCreate} disabled={creating} className="gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Projeyi Olustur
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
