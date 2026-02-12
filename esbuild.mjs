import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const isWatch = process.argv.includes('--watch');

// PostCSS ile Tailwind CSS derle
function buildCSS() {
  console.log('[CSS] Tailwind CSS derleniyor...');
  try {
    execSync(
      'npx postcss webview/index.css -o dist/webview.css',
      { cwd: process.cwd(), stdio: 'inherit' }
    );
    console.log('[CSS] Tamamlandi.');
  } catch (err) {
    console.error('[CSS] Hata:', err.message);
  }
}

// dist dizinini olustur
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Extension build (Node.js, CJS)
const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: !isWatch,
};

// Webview build (Browser, IIFE)
const webviewConfig = {
  entryPoints: ['webview/main.jsx'],
  bundle: true,
  outfile: 'dist/webview.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: !isWatch,
  jsx: 'automatic',
  loader: {
    '.jsx': 'jsx',
    '.js': 'js',
  },
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
};

async function build() {
  try {
    if (isWatch) {
      // Watch modu
      const extCtx = await esbuild.context(extensionConfig);
      const webCtx = await esbuild.context(webviewConfig);

      await extCtx.watch();
      await webCtx.watch();

      console.log('[esbuild] Watch modu aktif...');

      // Ilk CSS build
      buildCSS();

      // CSS icin basit dosya izleme
      const cssWatcher = fs.watch('webview', { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.css') || filename.endsWith('.jsx') || filename.endsWith('.js'))) {
          buildCSS();
        }
      });

      process.on('SIGINT', async () => {
        await extCtx.dispose();
        await webCtx.dispose();
        cssWatcher.close();
        process.exit(0);
      });
    } else {
      // Tek seferlik build
      await Promise.all([
        esbuild.build(extensionConfig),
        esbuild.build(webviewConfig),
      ]);
      console.log('[esbuild] Extension ve Webview build tamamlandi.');

      buildCSS();
    }
  } catch (err) {
    console.error('Build hatasi:', err);
    process.exit(1);
  }
}

build();
