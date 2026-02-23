// Electron IPC iletisim katmani

let _transport = null

// Electron transport
function createElectronTransport() {
  return {
    type: 'electron',
    async sendMessage(msg) {
      return window.kairos.sendMessage(msg)
    },
    onPush(callback) {
      return window.kairos.onPush(callback)
    },
    getState() {
      return window.kairos.getState()
    },
    setState(s) {
      window.kairos.setState(s)
    },
  }
}

export function getTransport() {
  if (_transport) return _transport
  _transport = createElectronTransport()
  return _transport
}

export function getTransportType() {
  return 'electron'
}

export function isDirectResponse() {
  return true
}

// Proje secim API'leri
export const projectApi = {
  async hasProject() {
    return window.kairos.hasProject()
  },
  async selectProject() {
    return window.kairos.selectProject()
  },
  async getRecentProjects() {
    return window.kairos.getRecentProjects()
  },
  async openRecentProject(projectPath) {
    return window.kairos.openRecentProject(projectPath)
  },
  needsProjectSelection() {
    return true
  },
}
