import { useState, useEffect } from 'react'
import { FolderOpen, Clock, ChevronRight, Activity } from 'lucide-react'
import { projectApi } from '../bridge'

export function ProjectPicker({ onProjectSelected }) {
  const [recentProjects, setRecentProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectApi.getRecentProjects().then(projects => {
      setRecentProjects(projects || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSelectFolder = async () => {
    const selected = await projectApi.selectProject()
    if (selected) onProjectSelected()
  }

  const handleOpenRecent = async (projectPath) => {
    const result = await projectApi.openRecentProject(projectPath)
    if (result) onProjectSelected()
  }

  const getProjectName = (fullPath) => {
    const parts = fullPath.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1] || fullPath
  }

  const getProjectDir = (fullPath) => {
    const normalized = fullPath.replace(/\\/g, '/')
    const parts = normalized.split('/')
    parts.pop()
    return parts.join('/')
  }

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

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-8">
        {/* Logo / Baslik */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kairos</h1>
            <p className="text-xs text-muted-foreground mt-1">Proje gelistirme kokpiti</p>
          </div>
        </div>

        {/* Proje Sec Butonu */}
        <button
          onClick={handleSelectFolder}
          className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card/50 hover:bg-card transition-all group"
        >
          <div className="w-11 h-11 rounded-lg bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold">Proje Klasoru Sec</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Calisma dizinini sec veya olustur</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto shrink-0" />
        </button>

        {/* Son Projeler */}
        {recentProjects.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Son Projeler</span>
            </div>
            <div className="space-y-1">
              {recentProjects.map((projectPath, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenRecent(projectPath)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group text-left"
                >
                  <div className="w-8 h-8 rounded-md bg-muted/70 group-hover:bg-muted flex items-center justify-center shrink-0 transition-colors">
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{getProjectName(projectPath)}</p>
                    <p className="text-[10px] text-muted-foreground/50 truncate font-mono-code">{getProjectDir(projectPath)}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
