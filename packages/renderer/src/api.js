// Electron IPC API bridge
// Tum API metodlari window.kairos.sendMessage uzerinden IPC invoke kullanir

import { getTransport } from './bridge'

// Push mesaj dinleyicileri
const listeners = new Map()

let _pushCleanup = null
function ensurePushListener() {
  if (_pushCleanup) return
  const transport = getTransport()
  _pushCleanup = transport.onPush((message) => {
    if (!message || !message.command) return
    handleIncomingMessage(message)
  })
}

function handleIncomingMessage(message) {
  const cbs = listeners.get(message.command)
  if (cbs) {
    cbs.forEach(cb => cb(message))
  }
}

export function onMessage(command, callback) {
  ensurePushListener()
  if (!listeners.has(command)) {
    listeners.set(command, [])
  }
  listeners.get(command).push(callback)
  return () => {
    const cbs = listeners.get(command)
    if (cbs) {
      const idx = cbs.indexOf(callback)
      if (idx !== -1) cbs.splice(idx, 1)
    }
  }
}

async function sendMessage(message) {
  const transport = getTransport()
  return transport.sendMessage(message)
}

export const api = {
  async load() {
    const response = await sendMessage({ command: 'load' })
    return response.data
  },

  async save(data) {
    const response = await sendMessage({ command: 'save', data })
    return response.success
  },

  async prdLoad(filename) {
    const response = await sendMessage({ command: 'prdLoad', filename })
    return response.data
  },

  async prdLines(start, end, filename, hash) {
    const response = await sendMessage({ command: 'prdLines', start, end, filename, hash })
    return response.data
  },

  async prdUpdate(start, end, content, filename) {
    const response = await sendMessage({ command: 'prdUpdate', start, end, content, filename })
    return response.success
  },

  async dosyaSec() {
    const response = await sendMessage({ command: 'dosyaSec' })
    return response.filename
  },

  async createRoadmap() {
    const response = await sendMessage({ command: 'createRoadmap' })
    return response.success
  },

  runTerminal(cmd, name) {
    sendMessage({ command: 'runTerminal', cmd, name })
  },

  bildirimGoster(mesaj) {
    sendMessage({ command: 'bildirimGoster', mesaj })
  },

  async pdfOlustur(payload) {
    const res = await sendMessage({ command: 'pdfOlustur', payload })
    if (!res.success) throw new Error(res.error)
    return res.filename
  },

  async loadSettings() {
    const response = await sendMessage({ command: 'loadSettings' })
    return response.settings
  },

  async saveSettings(settings) {
    const response = await sendMessage({ command: 'saveSettings', settings })
    return response.success
  },

  async detectTerminals() {
    const response = await sendMessage({ command: 'detectTerminals' })
    return response.terminals
  },

  async createRoadmapWithSettings(settings) {
    const response = await sendMessage({ command: 'createRoadmapWithSettings', settings })
    return response.success
  },

  async resetRoadmap() {
    const response = await sendMessage({ command: 'resetRoadmap' })
    return response.success
  },

  async listBackups() {
    const response = await sendMessage({ command: 'listBackups' })
    return response.backups
  },

  async restoreBackup(filename) {
    const response = await sendMessage({ command: 'restoreBackup', filename })
    return response.success
  },

  async gitDurum() {
    const response = await sendMessage({ command: 'gitDurum' })
    return response.durum
  },

  async gitDegisiklikler() {
    const response = await sendMessage({ command: 'gitDegisiklikler' })
    return response.dosyalar
  },

  async gitKaydet(mesaj) {
    const response = await sendMessage({ command: 'gitKaydet', mesaj })
    if (!response.success) throw new Error(response.error)
    return true
  },

  async gitPaylas() {
    const response = await sendMessage({ command: 'gitPaylas' })
    if (!response.success) throw new Error(response.error)
    return true
  },

  async gitGuncelle() {
    const response = await sendMessage({ command: 'gitGuncelle' })
    if (!response.success) throw new Error(response.error)
    return true
  },

  async claudeDosyaYukle(filename) {
    const response = await sendMessage({ command: 'claudeDosyaYukle', filename })
    return response.data
  },

  async claudeDosyaKaydet(filename, content) {
    const response = await sendMessage({ command: 'claudeDosyaKaydet', filename, content })
    if (!response.success) throw new Error(response.error)
    return true
  },

  async claudePluginKur() {
    const response = await sendMessage({ command: 'claudePluginKur' })
    if (!response.success) throw new Error(response.error)
    return response.created
  },

  async claudeDosyaAc(filename) {
    const response = await sendMessage({ command: 'claudeDosyaAc', filename })
    if (!response.success) throw new Error(response.error)
    return true
  },

  async claudeDosyaEkle() {
    const response = await sendMessage({ command: 'claudeDosyaEkle' })
    return response.filename
  },

  async pluginDurumYukle() {
    const response = await sendMessage({ command: 'pluginDurumYukle' })
    return response.durum
  },

  async pluginKomutKaydet(name, content) {
    const response = await sendMessage({ command: 'pluginKomutKaydet', name, content })
    if (!response.success) throw new Error(response.error)
  },

  async pluginKomutSil(name) {
    const response = await sendMessage({ command: 'pluginKomutSil', name })
    if (!response.success) throw new Error(response.error)
  },

  async pluginYapilandirmaKaydet(pluginJson, marketplaceJson) {
    const response = await sendMessage({ command: 'pluginYapilandirmaKaydet', pluginJson, marketplaceJson })
    if (!response.success) throw new Error(response.error)
  },

  async kokpitBaslat(kuyruk) {
    const response = await sendMessage({ command: 'kokpitBaslat', kuyruk })
    if (!response.success) throw new Error(response.error)
    return true
  },

  async kokpitDurdur() {
    const response = await sendMessage({ command: 'kokpitDurdur' })
    return response.success
  },

  async kokpitAtla() {
    const response = await sendMessage({ command: 'kokpitAtla' })
    return response.success
  },

  async kokpitDurumAl() {
    const response = await sendMessage({ command: 'kokpitDurumAl' })
    return response.durum
  },

  async logoTara() {
    const response = await sendMessage({ command: 'logoTara' })
    return response.logo
  },
}

export const state = {
  get(key, defaultValue) {
    const transport = getTransport()
    const s = transport.getState() || {}
    return s[key] !== undefined ? s[key] : defaultValue
  },
  set(key, value) {
    const transport = getTransport()
    const s = transport.getState() || {}
    s[key] = value
    transport.setState(s)
  },
}
