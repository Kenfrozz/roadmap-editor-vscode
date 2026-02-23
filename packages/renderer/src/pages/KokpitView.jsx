import { AiKokpit } from '../components/AiKokpit'

export function KokpitView({ data, fazConfig, fazOrder, columns, gorevTurleri, isCompact, onTaskStatusUpdate }) {
  return (
    <main className="flex-1 overflow-auto grid-bg p-4">
      <AiKokpit
        data={data}
        fazConfig={fazConfig}
        fazOrder={fazOrder}
        columns={columns}
        gorevTurleri={gorevTurleri}
        isCompact={isCompact}
        onTaskStatusUpdate={onTaskStatusUpdate}
      />
    </main>
  )
}
