import type WebSocket from 'ws';
import { MesajGonderilebilir } from '../types';

/**
 * WebSocket baglantisini MesajGonderilebilir arayuzuyle sarmalar.
 * handleMessage() bunu gercek webview sanir, postMessage() cagirildiginda ws.send() yapar.
 */
export class WsAdaptor implements MesajGonderilebilir {
  private _ws: WebSocket;

  constructor(ws: WebSocket) {
    this._ws = ws;
  }

  postMessage(data: unknown): Promise<boolean> {
    return new Promise((resolve) => {
      if (this._ws.readyState === 1 /* OPEN */) {
        this._ws.send(JSON.stringify(data), (err) => resolve(!err));
      } else {
        resolve(false);
      }
    });
  }

  get ws(): WebSocket { return this._ws; }
}
