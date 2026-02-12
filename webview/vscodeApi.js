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

  // Bekleyen promise varsa resolve et
  const resolver = pendingRequests.get(message.command)
  if (resolver) {
    pendingRequests.delete(message.command)
    resolver(message)
  }

  // Push mesaj dinleyicilerini bildir
  const cbs = listeners.get(message.command)
  if (cbs) {
    cbs.forEach(cb => cb(message))
  }
})

function sendAndWait(message, responseCommand, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    pendingRequests.set(responseCommand, resolve)
    vscode.postMessage(message)

    setTimeout(() => {
      if (pendingRequests.has(responseCommand)) {
        pendingRequests.delete(responseCommand)
        reject(new Error(`Timeout: ${responseCommand} yaniti alinamadi`))
      }
    }, timeoutMs)
  })
}

export const api = {
  async load() {
    const response = await sendAndWait(
      { command: 'load' },
      'loadResponse'
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

  async prdLoad() {
    const response = await sendAndWait(
      { command: 'prdLoad' },
      'prdLoadResponse'
    )
    return response.data
  },

  async prdLines(start, end) {
    const response = await sendAndWait(
      { command: 'prdLines', start, end },
      'prdLinesResponse'
    )
    return response.data
  },

  async prdUpdate(start, end, content) {
    const response = await sendAndWait(
      { command: 'prdUpdate', start, end, content },
      'prdUpdateResponse'
    )
    return response.success
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

  async loadSettings() {
    const response = await sendAndWait(
      { command: 'loadSettings' },
      'loadSettingsResponse'
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
