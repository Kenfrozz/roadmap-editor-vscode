import { GitPanel } from '../components/GitPanel'

export function GitView({ durum, onRefresh }) {
  return (
    <main className="flex-1 overflow-auto grid-bg p-4">
      <GitPanel open={true} standalone={true} durum={durum} onRefresh={onRefresh} />
    </main>
  )
}
