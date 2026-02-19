# Claude Runner — Otonom Gorev Calistirma Plani

Bu belge, Kairos eklentisine Claude Code CLI entegrasyonunu `child_process` uzerinden eklemeyi ve ileride tam otonom gorev akisina donusturmeyi planlar.

---

## Mevcut Durum

- Terminal entegrasyonu fire-and-forget (`terminal.sendText`)
- Cikti yakalanmiyor, bitis algilanmiyor
- Kullanici sonucu sadece VS Code terminal panelinde goruyor
- Eklenti Claude'un ne yaptigini ve ne zaman bitirdigini bilmiyor

## Hedef

Claude Code CLI'i `child_process.spawn` ile arka planda calistirip:
1. Ciktiyi gercek zamanli webview'e aktarmak
2. Bitisi ve basari durumunu algilamak
3. Gorev durumunu otomatik guncellemek
4. Ileride sirali gorev otomasyonu saglamak

---

## Faz 1 — Tekli Gorev Calistirma

### 1.1 Backend: `src/backend/claude/calistir.ts`

Yeni backend modulu. `child_process.spawn` ile Claude CLI calistirir.

```
execute(prompt, cwd, webview) {
  const proc = spawn('claude', ['-p', prompt], { cwd, shell: true })

  proc.stdout.on('data', chunk => {
    webview.postMessage({ command: 'claudeOutput', text: chunk.toString() })
  })

  proc.stderr.on('data', chunk => {
    webview.postMessage({ command: 'claudeOutput', text: chunk.toString(), isError: true })
  })

  proc.on('close', exitCode => {
    webview.postMessage({ command: 'claudeDone', exitCode })
  })

  return proc  // iptal icin referans
}
```

**Claude CLI Parametreleri:**
- `-p` (--print): interaktif olmayan mod, stdout'a basar
- `--output-format text`: duz metin cikti (varsayilan)
- `--max-turns N`: maksimum ajanttik tur sayisi (guvenlik limiti)
- `--allowedTools`: izin verilen araclar (dosya yazma, terminal vb.)

### 1.2 Backend: `src/backend/claude/iptal.ts`

Calisan sureci durdurmak icin:

```
execute(proc) {
  proc.kill('SIGTERM')
}
```

### 1.3 Proses Yonetimi: `src/backend/claude/manager.ts`

Aktif Claude surecini takip eden singleton:

```
let activeProc = null
let activeTaskId = null

function start(prompt, cwd, webview, taskId) { ... }
function stop() { ... }
function isRunning() { return activeProc !== null }
function getActiveTaskId() { return activeTaskId }
```

Neden singleton: Ayni anda birden fazla Claude sureci calistirmak kaynak israfina ve cakismalara yol acar. Tek surecli yaklasim daha guvenli.

### 1.4 Tipler: `src/types.ts`

```ts
// Webview -> Extension
| { command: 'claudeRun'; prompt: string; taskId?: string }
| { command: 'claudeStop' }
| { command: 'claudeStatus' }

// Extension -> Webview
| { command: 'claudeOutput'; text: string; isError?: boolean }
| { command: 'claudeDone'; exitCode: number; taskId?: string }
| { command: 'claudeStatusResponse'; running: boolean; taskId?: string }
```

### 1.5 API Router: `src/api/index.ts`

```ts
case 'claudeRun': {
  const proc = claudeManager.start(message.prompt, workspaceRoot, webview, message.taskId)
  break
}

case 'claudeStop': {
  claudeManager.stop()
  break
}

case 'claudeStatus': {
  webview.postMessage({
    command: 'claudeStatusResponse',
    running: claudeManager.isRunning(),
    taskId: claudeManager.getActiveTaskId(),
  })
  break
}
```

### 1.6 Frontend API: `webview/vscodeApi.js`

```js
claudeRun(prompt, taskId) {
  vscode.postMessage({ command: 'claudeRun', prompt, taskId })
},

claudeStop() {
  vscode.postMessage({ command: 'claudeStop' })
},

async claudeStatus() {
  return sendAndWait({ command: 'claudeStatus' }, 'claudeStatusResponse')
},
```

### 1.7 Frontend Bilesen: `webview/components/ClaudeRunner.jsx`

Webview icerisinde canli cikti gosteren panel:

```
┌─────────────────────────────────────────────┐
│ ● Claude Calisiyor: "Login sayfasi yap"     │
│─────────────────────────────────────────────│
│ > src/pages/Login.tsx olusturuluyor...      │
│ > Form bileseni ekleniyor...                │
│ > Tailwind stilleri yaziliyor...            │
│ > ✓ Tamamlandi                              │
│─────────────────────────────────────────────│
│                              [Durdur] [Kapat]│
└─────────────────────────────────────────────┘
```

Ozellikler:
- Canli cikti akisi (scroll-to-bottom)
- Calisiyor/Bitti/Hata durum gostergesi
- Durdur butonu (proc.kill)
- Otomatik scroll + manuel scroll kilidi
- Monospace font, terminal gorunumu

### 1.8 Tetikleme: Mevcut "Claude ile Yap" Butonu

SortableRow'daki mevcut "Claude ile Yap" dropdown secenegi:
- Simdiki: `api.runTerminal(cmd, name)` → VS Code terminali
- Yeni: `api.claudeRun(prompt, taskId)` → child_process + canli panel

Eski terminal yontemi de kalabilir (ayarlardan secim: "Terminal" vs "Dahili").

---

## Faz 2 — Gorev Kuyrugu

### 2.1 Kuyruk Mantigi: `src/backend/claude/kuyruk.ts`

```
Kuyruk Durumu:
  - tasks: GorevItem[]       // siralanmis gorev listesi
  - currentIndex: number     // simdiki gorev
  - status: 'idle' | 'running' | 'paused' | 'done'
  - mode: 'sequential'       // ileride 'smart' eklenebilir

Akis:
  1. Kullanici fazdan "Tum Gorerleri Calistir" der
  2. Tamamlanmamis gorevler siraya eklenir
  3. Ilk gorev baslar (Faz 1 mekanizmasi)
  4. Bitti → durum guncellenir → sonraki gorev baslar
  5. Hata → kullaniciya sor (Tekrarla / Atla / Dur)
  6. Tum gorevler bitti → ozet goster
```

### 2.2 Frontend: Kuyruk Paneli

```
┌─────────────────────────────────────────────┐
│ Gorev Kuyrugu (3/8)           [Duraklat] [X]│
│─────────────────────────────────────────────│
│ ✅ 1. Login sayfasi               tamamlandi│
│ ✅ 2. Kayit formu                 tamamlandi│
│ ● → 3. API entegrasyonu           calisiyor │
│ ○  4. Dashboard                   bekliyor  │
│ ○  5. Profil sayfasi              bekliyor  │
│─────────────────────────────────────────────│
│ > API client olusturuluyor...               │
│ > axios kurulumu...                         │
└─────────────────────────────────────────────┘
```

### 2.3 Tipler

```ts
// Webview -> Extension
| { command: 'claudeQueueStart'; tasks: QueueTask[] }
| { command: 'claudeQueuePause' }
| { command: 'claudeQueueResume' }
| { command: 'claudeQueueSkip' }
| { command: 'claudeQueueStop' }

// Extension -> Webview
| { command: 'claudeQueueProgress'; current: number; total: number; taskId: string }
| { command: 'claudeQueueTaskDone'; taskId: string; exitCode: number }
| { command: 'claudeQueueDone'; summary: QueueSummary }
| { command: 'claudeQueueError'; taskId: string; error: string }

interface QueueTask {
  taskId: string
  prompt: string
  ozellik: string
}

interface QueueSummary {
  total: number
  done: number
  failed: number
  skipped: number
  duration: number  // ms
}
```

---

## Faz 3 — Akilli Baglam

### 3.1 Prompt Olusturucu: `src/backend/claude/prompt.ts`

Her gorev icin zengin prompt olusturur:

```
execute(task, fazName, prdContent, previousResults) {
  return `
    Proje: ${projectName}
    Faz: ${fazName}
    Gorev: ${task.ozellik}

    PRD Baglami:
    ${prdContent}

    Onceki Gorevlerin Ozeti:
    ${previousResults}

    Talimatlar:
    - Sadece bu gorevi tamamla
    - Gereksiz degisiklik yapma
    - Bittiginde ozet ver
  `
}
```

### 3.2 PRD Icerik Ekleme

Gorev PRD referansi varsa (ornegin `README.md:5-10`):
1. Dosyayi oku
2. Ilgili satirlari cikar
3. Prompt'a "PRD Baglami" olarak ekle

### 3.3 Onceki Gorev Sonuclari

Her basarili gorevden sonra Claude'un son ciktisinin ozeti saklanir.
Sonraki gorevlerin prompt'una "Onceki gorevler soyle tamamlandi..." olarak eklenir.
Bu sayede Claude baglam kaybetmez.

### 3.4 Proje Yapisini Tanimla

CLAUDE.md ve proje yapisini prompt'a dahil et:
- Teknoloji stack'i
- Dosya yapisi
- Kodlama kurallari

---

## Faz 4 — Tam Otonom Mod

### 4.1 "Fazi Calistir" Butonu

Her faz basliginda bir "oynat" butonu:
- Tiklayinca o fazdaki tum tamamlanmamis gorevleri siraya koyar
- Onay dialog: "8 gorev sirayla calistirilacak. Devam?"
- Baslatir

### 4.2 "Tum Projeyi Calistir" Butonu

Navbar'da bir master buton:
- Tum fazlardaki tum tamamlanmamis gorevleri siralar
- Faz sirasi korunur (Faz 1 → Faz 2 → ...)
- Uzun islem: tahmini sure gostergesi

### 4.3 Kuru Calistirma (Dry Run)

Gercekte calistirmadan once:
- Hangi gorevlerin calistirilacagini goster
- Prompt onizlemesi
- Tahmini sure (gorev basi ~2-5 dk)
- Kullanici onaylasin

### 4.4 Hata Kurtarma

```
Gorev basarisiz olursa:
  ├─ Kullaniciya sor:
  │   ├─ [Tekrarla]  → ayni gorevi tekrar calistir
  │   ├─ [Atla]      → durumu ⚠️ yap, sonraki goreve gec
  │   ├─ [Dur]       → kuyruyu durdur
  │   └─ [Duzenle]   → prompt'u duzenleyip tekrar dene
  │
  └─ Otomatik mod (ayarlardan):
      ├─ 1 kez tekrarla, basarisizsa atla
      └─ Veya hemen dur
```

---

## Teknik Notlar

### Claude CLI Gereksinimleri

- Kullanicinin `claude` komutunun PATH'te olmasi gerekir
- Claude Code'un sisteme kurulu ve giris yapilmis olmasi gerekir
- Minimum Claude Code surumu: kontrol edilecek

### Guvenlik

- `--max-turns` ile sonsuz donguyu onle (varsayilan: 10)
- `--allowedTools` ile izin verilen araclari sinirla
- Her gorev icin ayri cwd (workspace root)
- Timeout: gorev basi maksimum sure (varsayilan: 5 dakika, ayarlanabilir)

### Performans

- Ayni anda tek Claude sureci (singleton)
- Gorev arasi bekleme suresi (rate limiting, varsayilan: 2 saniye)
- Bellek: cikti log'unu makul boyutta tut (son 1000 satir)
- Uzun gorevlerde periodic progress ping

### Ayarlar Entegrasyonu

`settings.claude` altina yeni alanlar:

```json
{
  "claude": {
    "featureCmd": "claude \"/kairos:build ${ozellik}\"",
    "mainCmd": "claude",
    "runner": {
      "enabled": true,
      "mode": "builtin",          // "builtin" | "terminal"
      "maxTurns": 10,
      "timeout": 300000,          // 5 dk (ms)
      "delayBetweenTasks": 2000,  // 2 sn (ms)
      "onError": "ask",           // "ask" | "skip" | "stop" | "retry-once"
      "allowedTools": []          // bos = hepsine izin
    }
  }
}
```

---

## Uygulama Sirasi

| Adim | Faz | Dosyalar | Aciklama |
|------|-----|----------|----------|
| 1 | F1 | `src/backend/claude/calistir.ts` | spawn + cikti yakalama |
| 2 | F1 | `src/backend/claude/iptal.ts` | surec durdurma |
| 3 | F1 | `src/backend/claude/manager.ts` | singleton surecyonetimi |
| 4 | F1 | `src/types.ts` | yeni mesaj tipleri |
| 5 | F1 | `src/api/index.ts` | router case'leri |
| 6 | F1 | `webview/vscodeApi.js` | API bridge |
| 7 | F1 | `webview/components/ClaudeRunner.jsx` | canli cikti paneli |
| 8 | F1 | `webview/components/SortableRow.jsx` | tetikleme butonu |
| 9 | F2 | `src/backend/claude/kuyruk.ts` | gorev kuyrugu mantigi |
| 10 | F2 | `webview/components/ClaudeQueue.jsx` | kuyruk UI |
| 11 | F3 | `src/backend/claude/prompt.ts` | akilli prompt olusturucu |
| 12 | F3 | PRD + baglam entegrasyonu | prompt zenginlestirme |
| 13 | F4 | Faz/proje calistir butonlari | toplu tetikleme |
| 14 | F4 | Kuru calistirma + hata kurtarma | guvenlik katmani |

---

## Ozet

```
Faz 1: Tek gorev calistir, cikti goster, bitis algila
Faz 2: Gorevleri siraya koy, biri bitince sonraki baslasin
Faz 3: PRD + onceki gorev baglami prompt'a eklensin
Faz 4: "Tum fazi calistir" butonu, kuru calistirma, hata yonetimi
```

Her faz bir oncekinin uzerine insa edilir. Faz 1 temel altyapiyi saglar, geri kalani uzerine eklenir.
