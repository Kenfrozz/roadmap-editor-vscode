import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { WebSocketServer, WebSocket } from 'ws';
import { WebviewMessage, MesajGonderilebilir } from '../types';
import { handleMessage } from '../api';
import { WsAdaptor } from './wsAdaptor';
import { KokpitYonetici } from '../kokpit/yonetici';

let _server: http.Server | null = null;
let _wss: WebSocketServer | null = null;
let _port: number = 4800;
let _adaptorler: Set<WsAdaptor> = new Set();

function lokalIpAl(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function mobilHtmlOlustur(contentPath: string): string {
  const indexPath = path.join(contentPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return fs.readFileSync(indexPath, 'utf8');
  }
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Kairos</title>
</head>
<body>
  <div id="root"></div>
  <p>Renderer dist bulunamadi: ${contentPath}</p>
</body>
</html>`;
}

export async function execute(options: { port?: number; contentPath?: string }): Promise<{ url: string; port: number; ip: string }> {
  if (_server) {
    throw new Error('Sunucu zaten calisiyor');
  }

  _port = options.port || 4800;
  const ip = lokalIpAl();

  const contentPath = options.contentPath || '';

  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(mobilHtmlOlustur(contentPath));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const adaptor = new WsAdaptor(ws);
    _adaptorler.add(adaptor);
    KokpitYonetici.getInstance().registerWebview(adaptor as unknown as MesajGonderilebilir);

    ws.on('message', async (raw: Buffer) => {
      try {
        const message: WebviewMessage = JSON.parse(raw.toString());
        await handleMessage(adaptor as unknown as MesajGonderilebilir, message);
      } catch {
        // Gecersiz mesajlari sessizce yoksay
      }
    });

    ws.on('close', () => {
      _adaptorler.delete(adaptor);
      KokpitYonetici.getInstance().unregisterWebview(adaptor as unknown as MesajGonderilebilir);
    });
  });

  return new Promise((resolve, reject) => {
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${_port} kullanimda. Farkli bir port deneyin.`));
      } else {
        reject(err);
      }
    });

    server.listen(_port, '0.0.0.0', () => {
      _server = server;
      _wss = wss;
      resolve({ url: `http://${ip}:${_port}`, port: _port, ip });
    });
  });
}

export async function sunucuDurdur(): Promise<void> {
  if (_wss) {
    for (const adaptor of _adaptorler) {
      KokpitYonetici.getInstance().unregisterWebview(adaptor as unknown as MesajGonderilebilir);
    }
    _wss.close();
    _wss = null;
  }
  if (_server) {
    _server.close();
    _server = null;
  }
  _adaptorler.clear();
}

export function sunucuAktifMi(): boolean { return _server !== null; }
export function bagliIstemciSayisi(): number { return _adaptorler.size; }
export function sunucuPortu(): number { return _port; }
export function sunucuUrl(): string { return `http://${lokalIpAl()}:${_port}`; }

export function mobilFileChanged(): void {
  for (const adaptor of _adaptorler) {
    adaptor.postMessage({ command: 'fileChanged' });
  }
}
