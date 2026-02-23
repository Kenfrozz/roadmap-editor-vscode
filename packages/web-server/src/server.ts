import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as chokidar from 'chokidar';
import {
  setProjectRoot, setHost, KairosHost, handleMessage, MesajGonderilebilir,
  consumeSuppression, setTerminalSaglayici, setDiyalogSaglayici, setDosyaAciciSaglayici,
  WebviewMessage,
} from '@kairos/shared';

// CLI argumanlari
const args = process.argv.slice(2);
let projectPath = args.find(a => !a.startsWith('-') && !a.startsWith('--'));
const portArg = args.find(a => a.startsWith('--port='));
const port = portArg ? parseInt(portArg.split('=')[1], 10) : 4800;

if (!projectPath) {
  console.error('Kullanim: kairos-web /proje/yolu [--port=4800]');
  process.exit(1);
}

projectPath = path.resolve(projectPath);

// Proje koku ayarla
setProjectRoot(projectPath);

// KairosHost
const host: KairosHost = {
  getProjectName: () => path.basename(projectPath!),
  getVersion: () => require('../package.json').version,
  showNotification: (msg: string) => {
    console.log(`[Bildirim] ${msg}`);
    // WS ile tum istemcilere bildir
    broadcast({ command: 'bildirimGosterResponse', mesaj: msg });
  },
};
setHost(host);

// Web'de terminal ve diyalog saglayicilari sinirli
setTerminalSaglayici({
  calistir: () => { throw new Error('Terminal web modunda desteklenmiyor'); },
  kapat: () => {},
  onKapandi: () => () => {},
});
setDiyalogSaglayici({
  dosyaSec: async () => null, // Web'de dosya secici devre disi
});
setDosyaAciciSaglayici({
  dosyaAc: async () => { throw new Error('Dosya acma web modunda desteklenmiyor'); },
});

// Express
const app = express();
app.use(express.json());

// Statik dosyalar (renderer dist)
const rendererDist = path.join(__dirname, '..', '..', 'renderer', 'dist');
if (fs.existsSync(rendererDist)) {
  app.use(express.static(rendererDist));
}

// WS Adaptor
class HttpAdaptor implements MesajGonderilebilir {
  private _response: unknown = null;
  postMessage(msg: unknown): Promise<boolean> {
    this._response = msg;
    return Promise.resolve(true);
  }
  getResponse(): unknown { return this._response; }
}

// API route
app.post('/api/message', async (req, res) => {
  try {
    const adaptor = new HttpAdaptor();
    await handleMessage(adaptor, req.body as WebviewMessage);
    res.json(adaptor.getResponse());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sunucu hatasi';
    res.status(500).json({ error: msg });
  }
});

// SPA fallback
app.get('*', (_req, res) => {
  const indexPath = path.join(rendererDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Renderer build bulunamadi. "npm run build:renderer" calistirin.');
  }
});

// HTTP server
const server = http.createServer(app);

// WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('message', async (raw) => {
    try {
      const msg: WebviewMessage = JSON.parse(raw.toString());
      const adaptor = new HttpAdaptor();
      await handleMessage(adaptor, msg);
      const response = adaptor.getResponse();
      if (response && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(response));
      }
    } catch {
      // Gecersiz mesajlari sessizce yoksay
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(msg: unknown): void {
  const data = JSON.stringify(msg);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// File watcher
const dataJsonPath = path.join(projectPath, 'kairos', 'data.json');
const watcher = chokidar.watch(dataJsonPath, {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
});

watcher.on('change', () => {
  if (consumeSuppression()) return;
  broadcast({ command: 'fileChanged' });
});

watcher.on('add', () => {
  if (consumeSuppression()) return;
  broadcast({ command: 'fileChanged' });
});

// Sunucu baslat
server.listen(port, '0.0.0.0', () => {
  console.log(`Kairos Web Sunucu: http://localhost:${port}`);
  console.log(`Proje: ${projectPath}`);
});

process.on('SIGINT', () => {
  watcher.close();
  server.close();
  process.exit(0);
});
