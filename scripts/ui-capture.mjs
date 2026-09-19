#!/usr/bin/env node
/**
 * Capture the screens the UI gate requires, with the conditions recorded.
 *
 * Dependency-free on purpose: this repository ships no npm packages, so the
 * capture drives an existing Chrome/Chromium binary directly instead of adding
 * a browser automation library. Point CHROME_BIN at a binary to override the
 * search, or install one of the paths listed in `candidates()`.
 *
 * A screenshot is evidence only if you open it. This writes the file and the
 * conditions; reading the image is still a separate step.
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'artifacts/ui');
const PORT = Number(process.env.UI_CAPTURE_PORT || 4179);
const ORIGIN = `http://127.0.0.1:${PORT}`;

export const SHOTS = Object.freeze([
  { file: 'home-desktop.png', route: '/', width: 1440, height: 1000, state: 'default' },
  { file: 'home-mobile.png', route: '/', width: 390, height: 844, state: 'default' },
  { file: 'home-reduced-motion.png', route: '/', width: 1440, height: 1000, state: 'prefers-reduced-motion: reduce', reducedMotion: true },
  { file: 'home-narrow.png', route: '/', width: 320, height: 900, state: 'default' },
  { file: 'home-en-desktop.png', route: '/en/', width: 1440, height: 1000, state: 'default' },
  { file: 'product-desktop.png', route: '/products/genie/', width: 1440, height: 1100, state: 'default' },
  { file: 'product-mobile.png', route: '/products/oathra/', width: 390, height: 900, state: 'default' }
]);

function candidates() {
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const found = [];
  if (process.env.CHROME_BIN) found.push(process.env.CHROME_BIN);
  if (fsSync.existsSync(cache)) {
    for (const entry of fsSync.readdirSync(cache).filter(name => name.startsWith('chromium_headless_shell-')).sort().reverse()) {
      const dir = path.join(cache, entry);
      for (const inner of fsSync.existsSync(dir) ? fsSync.readdirSync(dir) : []) {
        found.push(path.join(dir, inner, 'chrome-headless-shell'), path.join(dir, inner, 'headless_shell'));
      }
    }
  }
  found.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium');
  return found;
}

export function findBrowser(exists = fsSync.existsSync) {
  const binary = candidates().find(candidate => exists(candidate));
  if (!binary) throw new Error('No Chrome/Chromium binary found. Set CHROME_BIN to one.');
  return binary;
}

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(ORIGIN + '/', { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch { /* not up yet */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Preview server did not answer on ${ORIGIN}. Run "npm run build" first.`);
}

export async function capture() {
  await fs.access(path.join(root, 'dist/index.html')).catch(() => { throw new Error('dist/ is missing. Run "npm run build" first.'); });
  const binary = findBrowser();
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8' }).stdout?.trim() || 'unknown';
  await fs.mkdir(OUT, { recursive: true });

  const server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  const shots = [];
  try {
    await waitForServer();
    for (const shot of SHOTS) {
      const target = path.join(OUT, shot.file);
      const args = [
        '--headless', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
        `--window-size=${shot.width},${shot.height}`,
        '--virtual-time-budget=6000',
        `--screenshot=${target}`,
        ...(shot.reducedMotion ? ['--force-prefers-reduced-motion'] : []),
        ORIGIN + shot.route
      ];
      const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 120000 });
      const bytes = fsSync.existsSync(target) ? fsSync.statSync(target).size : 0;
      if (!bytes) throw new Error(`Capture failed for ${shot.file}: ${(result.stderr || '').split('\n').slice(-3).join(' ')}`);
      shots.push({ ...shot, bytes, url: ORIGIN + shot.route });
      console.error(`[ui-capture] ${shot.file} ${shot.width}x${shot.height} (${bytes} bytes)`);
    }
  } finally {
    server.kill();
  }

  const manifest = {
    capturedAt: new Date().toISOString(),
    browser: { binary, version },
    server: { origin: ORIGIN, source: 'dist/', note: 'Local build over HTTP, not the production deployment.' },
    note: 'Files written here are not reviewed until a person or the ui-reviewer opens them as images.',
    shots
  };
  await fs.writeFile(path.join(OUT, 'capture.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  capture().then(manifest => console.log(`Captured ${manifest.shots.length} screens into artifacts/ui/ with ${manifest.browser.version}.`))
    .catch(error => { console.error(`[ui-capture] ${error.message}`); process.exitCode = 1; });
}
