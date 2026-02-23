import { LayoutDashboard, ArrowRight } from 'lucide-react'

export function DashboardEmptyState({ onNavigate }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
          <LayoutDashboard className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight mb-2">Henuz Veri Yok</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dashboard'u gormek icin once roadmap'e gorev ekleyin.
            Gorevlerinizi ekledikten sonra ilerleme, faz dagilimi ve tarih
            istatistikleri burada goruntulenecek.
          </p>
        </div>
        <button
          onClick={() => onNavigate('main')}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Roadmap'e Git
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
