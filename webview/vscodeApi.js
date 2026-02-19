// acquireVsCodeApi wrapper + promise-based postMessage bridge

const vscode = acquireVsCodeApi()

const pendingRequests = new Map()
let requestId = 0

// Push mesaj dinleyicileri (extension -> webview, response olmayan mesajlar icin)
const listeners = new Map()

export function onMessage(command, callback) {
  if (!listeners.has(command)) {
    listeners.set(command, [])
  }
  listeners.get(command).push(callback)
  // Cleanup fonksiyonu dondur
  return () => {
    const cbs = listeners.get(command)
    if (cbs) {
      const idx = cbs.indexOf(callback)
      if (idx !== -1) cbs.splice(idx, 1)
    }
  }
}

// Extension'dan gelen mesajlari dinle
window.addEventListener('message', (event) => {
  const message = event.data
  if (!message || !message.command) return

  // Bekleyen promise varsa resolve et (kuyruktan en eskisini al)
  const queue = pendingRequests.get(message.command)
  if (queue && queue.length > 0) {
    const entry = queue.shift()
    if (queue.length === 0) pendingRequests.delete(message.command)
    clearTimeout(entry.timer)
    entry.resolve(message)
  }

  // Push mesaj dinleyicilerini bildir
  const cbs = listeners.get(message.command)
  if (cbs) {
    cbs.forEach(cb => cb(message))
  }
})

function sendAndWait(message, responseCommand, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (!pendingRequests.has(responseCommand)) {
      pendingRequests.set(responseCommand, [])
    }
    const entry = { resolve }
    entry.timer = setTimeout(() => {
      const queue = pendingRequests.get(responseCommand)
      if (queue) {
        const idx = queue.indexOf(entry)
        if (idx !== -1) queue.splice(idx, 1)
        if (queue.length === 0) pendingRequests.delete(responseCommand)
      }
      reject(new Error(`Timeout: ${responseCommand} yaniti alinamadi`))
    }, timeoutMs)
    pendingRequests.get(responseCommand).push(entry)
    vscode.postMessage(message)
  })
}

// Ilk yukleme icin retry mekanizmasi — extension host hazir olmayabilir
async function sendWithRetry(message, responseCommand, { timeoutMs = 10000, retries = 2, retryDelay = 1000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await sendAndWait(message, responseCommand, timeoutMs)
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, retryDelay))
      } else {
        throw err
      }
    }
  }
}

export const api = {
  async load() {
    const response = await sendWithRetry(
      { command: 'load' },
      'loadResponse',
      { timeoutMs: 10000, retries: 2, retryDelay: 1500 }
    )
    return response.data
  },

  async save(data) {
    const response = await sendAndWait(
      { command: 'save', data },
      'saveResponse'
    )
    return response.success
  },

  async prdLoad(filename) {
    const response = await sendAndWait(
      { command: 'prdLoad', filename },
      'prdLoadResponse'
    )
    return response.data
  },

  async prdLines(start, end, filename) {
    const response = await sendAndWait(
      { command: 'prdLines', start, end, filename },
      'prdLinesResponse'
    )
    return response.data
  },

  async prdUpdate(start, end, content, filename) {
    const response = await sendAndWait(
      { command: 'prdUpdate', start, end, content, filename },
      'prdUpdateResponse'
    )
    return response.success
  },

  async dosyaSec() {
    const response = await sendAndWait(
      { command: 'dosyaSec' },
      'dosyaSecResponse'
    )
    return response.filename
  },

  async createRoadmap() {
    const response = await sendAndWait(
      { command: 'createRoadmap' },
      'createRoadmapResponse'
    )
    return response.success
  },

  runTerminal(cmd, name) {
    vscode.postMessage({ command: 'runTerminal', cmd, name })
  },

  bildirimGoster(mesaj) {
    vscode.postMessage({ command: 'bildirimGoster', mesaj })
  },

  async pdfOlustur(payload) {
    const res = await sendAndWait(
      { command: 'pdfOlustur', payload },
      'pdfOlusturResponse',
      30000
    )
    if (!res.success) throw new Error(res.error)
    return res.filename
  },

  async loadSettings() {
    const response = await sendWithRetry(
      { command: 'loadSettings' },
      'loadSettingsResponse',
      { timeoutMs: 10000, retries: 2, retryDelay: 1500 }
    )
    return response.settings
  },

  async saveSettings(settings) {
    const response = await sendAndWait(
      { command: 'saveSettings', settings },
      'saveSettingsResponse'
    )
    return response.success
  },

  async detectTerminals() {
    const response = await sendAndWait(
      { command: 'detectTerminals' },
      'detectTerminalsResponse'
    )
    return response.terminals
  },

  async createRoadmapWithSettings(settings) {
    const response = await sendAndWait(
      { command: 'createRoadmapWithSettings', settings },
      'createRoadmapWithSettingsResponse'
    )
    return response.success
  },

  async resetRoadmap() {
    const response = await sendAndWait(
      { command: 'resetRoadmap' },
      'resetRoadmapResponse'
    )
    return response.success
  },

  async listBackups() {
    const response = await sendAndWait(
      { command: 'listBackups' },
      'listBackupsResponse'
    )
    return response.backups
  },

  async restoreBackup(filename) {
    const response = await sendAndWait(
      { command: 'restoreBackup', filename },
      'restoreBackupResponse'
    )
    return response.success
  },

  async gitDurum() {
    const response = await sendAndWait(
      { command: 'gitDurum' },
      'gitDurumResponse'
    )
    return response.durum
  },

  async gitDegisiklikler() {
    const response = await sendAndWait(
      { command: 'gitDegisiklikler' },
      'gitDegisikliklerResponse'
    )
    return response.dosyalar
  },

  async gitKaydet(mesaj) {
    const response = await sendAndWait(
      { command: 'gitKaydet', mesaj },
      'gitKaydetResponse',
      30000
    )
    if (!response.success) throw new Error(response.error)
    return true
  },

  async gitPaylas() {
    const response = await sendAndWait(
      { command: 'gitPaylas' },
      'gitPaylasResponse',
      30000
    )
    if (!response.success) throw new Error(response.error)
    return true
  },

  async gitGuncelle() {
    const response = await sendAndWait(
      { command: 'gitGuncelle' },
      'gitGuncelleResponse',
      30000
    )
    if (!response.success) throw new Error(response.error)
    return true
  },

  async claudeDosyaYukle(filename) {
    const response = await sendAndWait(
      { command: 'claudeDosyaYukle', filename },
      'claudeDosyaYukleResponse'
    )
    return response.data
  },

  async claudeDosyaKaydet(filename, content) {
    const response = await sendAndWait(
      { command: 'claudeDosyaKaydet', filename, content },
      'claudeDosyaKaydetResponse'
    )
    if (!response.success) throw new Error(response.error)
    return true
  },

  async claudePluginKur() {
    const response = await sendAndWait(
      { command: 'claudePluginKur' },
      'claudePluginKurResponse'
    )
    if (!response.success) throw new Error(response.error)
    return response.created
  },

  async claudeDosyaAc(filename) {
    const response = await sendAndWait(
      { command: 'claudeDosyaAc', filename },
      'claudeDosyaAcResponse'
    )
    if (!response.success) throw new Error(response.error)
    return true
  },

  async claudeDosyaEkle() {
    const response = await sendAndWait(
      { command: 'claudeDosyaEkle' },
      'claudeDosyaEkleResponse'
    )
    return response.filename
  },

  async pluginDurumYukle() {
    const response = await sendAndWait(
      { command: 'pluginDurumYukle' },
      'pluginDurumYukleResponse'
    )
    return response.durum
  },

  async pluginKomutKaydet(name, content) {
    const response = await sendAndWait(
      { command: 'pluginKomutKaydet', name, content },
      'pluginKomutKaydetResponse'
    )
    if (!response.success) throw new Error(response.error)
  },

  async pluginKomutSil(name) {
    const response = await sendAndWait(
      { command: 'pluginKomutSil', name },
      'pluginKomutSilResponse'
    )
    if (!response.success) throw new Error(response.error)
  },

  async pluginYapilandirmaKaydet(pluginJson, marketplaceJson) {
    const response = await sendAndWait(
      { command: 'pluginYapilandirmaKaydet', pluginJson, marketplaceJson },
      'pluginYapilandirmaKaydetResponse'
    )
    if (!response.success) throw new Error(response.error)
  },

  async kokpitBaslat(kuyruk) {
    const response = await sendAndWait(
      { command: 'kokpitBaslat', kuyruk },
      'kokpitBaslatResponse',
      30000
    )
    if (!response.success) throw new Error(response.error)
    return true
  },

  async kokpitDurdur() {
    const response = await sendAndWait(
      { command: 'kokpitDurdur' },
      'kokpitDurdurResponse'
    )
    return response.success
  },

  async kokpitAtla() {
    const response = await sendAndWait(
      { command: 'kokpitAtla' },
      'kokpitAtlaResponse'
    )
    return response.success
  },

  async kokpitDurumAl() {
    const response = await sendAndWait(
      { command: 'kokpitDurumAl' },
      'kokpitDurumAlResponse'
    )
    return response.durum
  },

}

export const state = {
  get(key, defaultValue) {
    const s = vscode.getState() || {}
    return s[key] !== undefined ? s[key] : defaultValue
  },
  set(key, value) {
    const s = vscode.getState() || {}
    s[key] = value
    vscode.setState(s)
  },
}
