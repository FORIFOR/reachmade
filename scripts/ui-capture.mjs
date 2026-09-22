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
  { file: 'product-mobile.png', route: '/products/oathra/', width: 390, height: 900, state: 'default' },
  // Below the first view: the sections a viewport shot never reaches.
  //
  // These are captured with reduced motion on purpose. Entrance animations start at
  // `opacity:.6` (lab-explorer.css `@keyframes lab-arrive`) and this browser produces
  // no animation frames, so a default-motion capture can freeze mid-entrance and make
  // a section look washed out that is not. Reduced motion disables those animations
  // outright, so the colours in these files are the settled ones.
  { file: 'home-tall-ja.png', route: '/', width: 1440, height: 8400, state: 'whole page, reduced motion', reducedMotion: true },
  { file: 'home-tall-en.png', route: '/en/', width: 1440, height: 8400, state: 'whole page, reduced motion', reducedMotion: true },
  { file: 'product-tall-genie.png', route: '/products/genie/', width: 1440, height: 5600, state: 'whole page, reduced motion', reducedMotion: true },
  // Widths between the phone and the desktop shots, where layouts usually break.
  { file: 'home-768.png', route: '/', width: 768, height: 1200, state: 'default' },
  { file: 'home-960.png', route: '/', width: 960, height: 900, state: 'default, narrowest two-column width' },
  { file: 'home-1024.png', route: '/', width: 1024, height: 900, state: 'default' },
  { file: 'home-1920.png', route: '/', width: 1920, height: 1080, state: 'default' },
  // Whole page on a phone. Anchor routes are useless here: `html{scroll-behavior:smooth}`
  // needs animation frames, which this headless browser does not produce, so a
  // `/#faq` capture silently returns the top of the page instead.
  { file: 'home-mobile-tall.png', route: '/', width: 390, height: 12200, state: 'whole page, reduced motion', reducedMotion: true },
  // The English page at phone widths. Its copy is longer than the Japanese, so a
  // badge or label that wraps here does not show up in any of the shots above.
  { file: 'home-en-mobile.png', route: '/en/', width: 390, height: 844, state: 'default' },
  { file: 'home-en-narrow.png', route: '/en/', width: 320, height: 900, state: 'default' },
  // Lower bands at a readable size. A whole-page shot is 8400px tall, so anything
  // below the first view is unreadable in it; `offset` scrolls the page up by that
  // many CSS px through an injected stylesheet, because this browser produces no
  // animation frames and `/#anchor` silently returns the top of the page.
  { file: 'home-band-lab.png', route: '/', width: 1440, height: 1000, offset: 2450, state: 'product lab band, reduced motion', reducedMotion: true },
  { file: 'home-band-cards.png', route: '/', width: 1440, height: 1000, offset: 3500, state: 'product card grid, reduced motion', reducedMotion: true },
  { file: 'home-band-access.png', route: '/', width: 1440, height: 1000, offset: 4800, state: 'access table, reduced motion', reducedMotion: true },
  { file: 'home-band-close.png', route: '/', width: 1440, height: 1000, offset: 6400, state: 'FAQ and closing CTA, reduced motion', reducedMotion: true },
  // The recording band and the try band at full resolution. A 8400px whole-page shot
  // renders too small to read, so the bands that carry the proof get their own frames.
  { file: 'home-band-proof.png', route: '/', width: 1440, height: 1000, offset: 780, state: 'real app recording band, reduced motion', reducedMotion: true },
  { file: 'home-band-try.png', route: '/', width: 1440, height: 1000, offset: 1700, state: 'shortest-path band, reduced motion', reducedMotion: true },
  // Phone widths below the fold, because home-mobile-tall.png is unreadable as one image.
  { file: 'home-m-nav.png', route: '/', width: 390, height: 844, offset: 820, state: 'phone, task navigation, reduced motion', reducedMotion: true },
  { file: 'home-m-proof.png', route: '/', width: 390, height: 844, offset: 1700, state: 'phone, recording band, reduced motion', reducedMotion: true },
  { file: 'home-m-cards.png', route: '/', width: 390, height: 844, offset: 4200, state: 'phone, product cards, reduced motion', reducedMotion: true },
  { file: 'home-m-access.png', route: '/', width: 390, height: 844, offset: 7000, state: 'phone, access table, reduced motion', reducedMotion: true }
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

  // Offset shots are served from a mirror of dist with one extra stylesheet, so the
  // real build is never modified and `style-src 'self'` still holds.
  const offsets = [...new Set(SHOTS.filter(shot => shot.offset).map(shot => shot.offset))];
  const mirror = path.join(os.tmpdir(), `reachmade-capture-${process.pid}`);
  if (offsets.length) {
    await fs.rm(mirror, { recursive: true, force: true });
    await fs.cp(path.join(root, 'dist'), mirror, { recursive: true });
    for (const offset of offsets) {
      await fs.writeFile(path.join(mirror, `assets/offset-${offset}.css`), `html{margin-top:-${offset}px}\n`);
      for (const [route, file] of [['/', 'index.html'], ['/en/', 'en/index.html']]) {
        const page = await fs.readFile(path.join(mirror, file), 'utf8');
        const name = `${route === '/' ? '' : 'en/'}offset-${offset}.html`;
        await fs.writeFile(path.join(mirror, name), page.replace('</head>', `<link rel="stylesheet" href="/assets/offset-${offset}.css"></head>`));
      }
    }
  }
  const server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  const offsetServer = offsets.length
    ? spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], { cwd: root, env: { ...process.env, PORT: String(PORT + 1), SERVE_ROOT: mirror }, stdio: 'ignore' })
    : null;
  const shots = [];
  try {
    await waitForServer();
    for (const shot of SHOTS) {
      const target = path.join(OUT, shot.file);
      const url = shot.offset
        ? `http://127.0.0.1:${PORT + 1}${shot.route === '/' ? '' : shot.route.replace(/\/$/, '')}/offset-${shot.offset}.html`
        : ORIGIN + shot.route;
      const args = [
        '--headless', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
        `--window-size=${shot.width},${shot.height}`,
        '--virtual-time-budget=6000',
        `--screenshot=${target}`,
        ...(shot.reducedMotion ? ['--force-prefers-reduced-motion'] : []),
        url
      ];
      const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 120000 });
      const bytes = fsSync.existsSync(target) ? fsSync.statSync(target).size : 0;
      if (!bytes) throw new Error(`Capture failed for ${shot.file}: ${(result.stderr || '').split('\n').slice(-3).join(' ')}`);
      shots.push({ ...shot, bytes, url });
      console.error(`[ui-capture] ${shot.file} ${shot.width}x${shot.height} (${bytes} bytes)`);
    }
  } finally {
    server.kill();
    offsetServer?.kill();
    await fs.rm(mirror, { recursive: true, force: true });
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
