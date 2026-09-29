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
import { createHash } from 'node:crypto';
import { fingerprint, loadConfig } from './ui-quality.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'artifacts/ui');
const PORT = Number(process.env.UI_CAPTURE_PORT || 4179);
const ORIGIN = `http://127.0.0.1:${PORT}`;

export const SHOTS = Object.freeze([
  // The Japanese and English homes share seven product cards, a manual reel and native details.
  // Real-time CDP capture scrolls and clicks the unmodified build as a visitor would.
  // fullPage scrolls through once first so lazy images and intersection observers advance.
  { file: 'home-desktop.png', route: '/', width: 1440, height: 1000, state: 'default, real time', realtime: true },
  { file: 'home-mobile.png', route: '/', width: 390, height: 844, state: 'default, real time', realtime: true },
  { file: 'home-reduced-motion.png', route: '/', width: 1440, height: 1000, state: 'prefers-reduced-motion: reduce, real time', reducedMotion: true, realtime: true },
  { file: 'home-narrow.png', route: '/', width: 320, height: 900, state: 'default, real time', realtime: true },
  { file: 'home-768.png', route: '/', width: 768, height: 1200, state: 'default, real time', realtime: true },
  { file: 'home-960.png', route: '/', width: 960, height: 900, state: 'default, real time', realtime: true },
  { file: 'home-1024.png', route: '/', width: 1024, height: 900, state: 'default, real time', realtime: true },
  { file: 'home-1920.png', route: '/', width: 1920, height: 1080, state: 'default, real time', realtime: true },
  { file: 'home-tall-ja.png', route: '/', width: 1440, height: 1000, state: 'whole page after scrolling through, reduced motion, real time', reducedMotion: true, realtime: true, fullPage: true },
  { file: 'home-mobile-tall.png', route: '/', width: 390, height: 844, state: 'whole page after scrolling through, reduced motion, real time', reducedMotion: true, realtime: true, fullPage: true },
  { file: 'home-band-reel.png', route: '/', width: 1440, height: 1000, scrollTo: '#reel', state: 'seven-product manual reel, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-band-chapter-genie.png', route: '/', width: 1440, height: 1000, openDetails: '[data-v4-chapter="genie"] .v4-scope', scrollTo: '[data-v4-chapter="genie"] .v4-figure', assertVisible: '[data-v4-chapter="genie"] .v4-proof', state: 'Genie card with footage and evidence disclosure open, real time', realtime: true },
  { file: 'home-band-chapter-oathra.png', route: '/', width: 1440, height: 1000, openDetails: '[data-v4-chapter="oathra"] .v4-scope', scrollTo: '[data-v4-chapter="oathra"] .v4-figure', assertVisible: '[data-v4-chapter="oathra"] .v4-proof', state: 'Oathra card with illustrative footage and evidence disclosure open, real time', realtime: true },
  { file: 'home-band-chapter-launchloom.png', route: '/', width: 1440, height: 1000, openDetails: '[data-v4-chapter="launchloom"] .v4-scope', scrollTo: '[data-v4-chapter="launchloom"] .v4-figure', assertVisible: '[data-v4-chapter="launchloom"] .v4-proof', state: 'Launchloom card with footage and evidence disclosure open, real time', realtime: true },
  { file: 'home-band-principles.png', route: '/', width: 1440, height: 1000, scrollTo: '#principles', state: 'principles, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-band-services.png', route: '/', width: 1440, height: 1000, scrollTo: '#services', state: 'services band, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-band-access.png', route: '/', width: 1440, height: 1000, openDetails: '#access > details', scrollTo: '#access', assertVisible: '#access details[open] .rm-access-table', state: 'open access table, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-band-close.png', route: '/', width: 1440, height: 1000, scrollTo: '#faq', state: 'FAQ and contact, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-m-reel.png', route: '/', width: 390, height: 844, scrollTo: '#reel', state: 'phone, seven-product manual reel, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-m-chapter.png', route: '/', width: 390, height: 844, openDetails: '[data-v4-chapter="ai-meeting"] .v4-scope', scrollTo: '[data-v4-chapter="ai-meeting"] .v4-figure', assertVisible: '[data-v4-chapter="ai-meeting"] .v4-proof', state: 'phone, AI Meeting card with footage and evidence disclosure open, real time', realtime: true },
  // The two home clips cut from illustrative films (2026-09-30): their label and the caption under the video.
  { file: 'home-m-chapter-oathra.png', route: '/', width: 390, height: 1100, openDetails: '[data-v4-chapter="oathra"] .v4-scope', scrollTo: '[data-v4-chapter="oathra"] .v4-figure', assertVisible: '[data-v4-chapter="oathra"] .v4-proof', state: 'phone, Oathra card, illustrative footage and evidence disclosure open, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-m-chapter-agent-team.png', route: '/', width: 390, height: 1100, openDetails: '[data-v4-chapter="agent-team"] .v4-scope', scrollTo: '[data-v4-chapter="agent-team"] .v4-figure', assertVisible: '[data-v4-chapter="agent-team"] .v4-proof', state: 'phone, Agent Team card, design-film footage and evidence disclosure open, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-m-services.png', route: '/', width: 390, height: 844, scrollTo: '#services', state: 'phone, services band, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-m-access.png', route: '/', width: 390, height: 844, openDetails: '#access > details', scrollTo: '#access', assertVisible: '#access details[open] .rm-access-table', state: 'phone, open access table, reduced motion, real time', reducedMotion: true, realtime: true },
  // Japanese Genie page (LP re-composition): its sections at a readable size, real time.
  // Japanese Oathra page (2026-09-29 brief): each section, real time.
  // Agent Team page (2026-09-29 patch): hero, capabilities and the next-UI design with its film.
  { file: 'agent-team-hero.png', route: '/products/agent-team/', width: 1440, height: 1000, state: 'Agent Team hero, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'agent-team-features.png', route: '/products/agent-team/', width: 1440, height: 1000, scrollTo: '#features', state: 'Agent Team capabilities, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'agent-team-next-ui.png', route: '/products/agent-team/', width: 1440, height: 1400, scrollTo: '#next-ui', state: 'Agent Team next-UI design film and frames, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'agent-team-next-ui-en.png', route: '/en/products/agent-team/', width: 1440, height: 1200, scrollTo: '#next-ui', state: 'Agent Team next-UI frames, English, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'agent-team-m-next-ui.png', route: '/products/agent-team/', width: 390, height: 1400, scrollTo: '#next-ui', state: 'phone, Agent Team next-UI, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'agent-team-m-hero.png', route: '/products/agent-team/', width: 390, height: 1000, state: 'phone, Agent Team hero, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-band-chapter-agent-team.png', route: '/', width: 1440, height: 1000, openDetails: '[data-v4-chapter="agent-team"] .v4-scope', scrollTo: '[data-v4-chapter="agent-team"] .v4-figure', assertVisible: '[data-v4-chapter="agent-team"] .v4-proof', state: 'home v4 Agent Team card with design-film evidence disclosure open, real time', realtime: true },
  { file: 'oathra-lp-hero.png', route: '/products/oathra/', width: 1440, height: 1000, state: 'Oathra first view, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'oathra-lp-ring.png', route: '/products/oathra/', width: 1440, height: 1000, scrollTo: '#ring', state: 'Oathra ring, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'oathra-lp-steps.png', route: '/products/oathra/', width: 1440, height: 1000, scrollTo: '#steps', state: 'Oathra request-to-report design stills, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'oathra-lp-trust.png', route: '/products/oathra/', width: 1440, height: 1000, scrollTo: '#trust', state: 'Oathra delegation design, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'oathra-lp-rec.png', route: '/products/oathra/', width: 1440, height: 1000, scrollTo: '#recordings', state: 'Oathra recordings, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'oathra-lp-status.png', route: '/products/oathra/', width: 1440, height: 1000, scrollTo: '#status', state: 'Oathra where it stands, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'oathra-lp-m-hero.png', route: '/products/oathra/', width: 390, height: 1200, state: 'phone, Oathra first view, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'oathra-lp-m-steps.png', route: '/products/oathra/', width: 390, height: 1400, scrollTo: '#steps', state: 'phone, Oathra design stills, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'oathra-lp-tall.png', route: '/products/oathra/', width: 1440, height: 1000, state: 'Oathra whole page, reduced motion, real time', reducedMotion: true, realtime: true, fullPage: true },
  { file: 'oathra-lp-nojs-390.png', route: '/products/oathra/', width: 390, height: 1400, scrollTo: '#trust', state: 'phone, JavaScript disabled, Oathra delegation and recordings, real time', realtime: true, noScript: true },
  { file: 'genie-lp-hero.png', route: '/products/genie/', width: 1440, height: 1000, state: 'Genie LP hero, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'genie-lp-features.png', route: '/products/genie/', width: 1440, height: 1000, scrollTo: '#features', state: 'Genie LP features with stills, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'genie-lp-demos.png', route: '/products/genie/', width: 1440, height: 1000, scrollTo: '#demos', state: 'Genie LP three demos, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'genie-lp-artifacts.png', route: '/products/genie/', width: 1440, height: 1000, scrollTo: '#artifacts', state: 'Genie LP saved artifacts, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'genie-lp-trust.png', route: '/products/genie/', width: 1440, height: 1000, scrollTo: '#trust', state: 'Genie LP scope, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'genie-lp-start.png', route: '/products/genie/', width: 1440, height: 1000, scrollTo: '#start', state: 'Genie LP first task, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'genie-lp-m-hero.png', route: '/products/genie/', width: 390, height: 844, state: 'phone, Genie LP hero, reduced motion, real time', reducedMotion: true, realtime: true },
  // JavaScript disabled, at phone width, section by section (a whole-page shot is too small to read).
  { file: 'genie-lp-nojs-demos.png', route: '/products/genie/', width: 390, height: 1400, scrollTo: '#demos', state: 'phone, JavaScript disabled, three demos, real time', realtime: true, noScript: true },
  { file: 'genie-lp-nojs-artifacts.png', route: '/products/genie/', width: 390, height: 1400, scrollTo: '#artifacts', state: 'phone, JavaScript disabled, saved artifacts, real time', realtime: true, noScript: true },
  { file: 'genie-lp-nojs-next-ui.png', route: '/products/genie/', width: 390, height: 1400, scrollTo: '#next-ui', state: 'phone, JavaScript disabled, next-UI frames, real time', realtime: true, noScript: true },
  { file: 'home-nojs-chapter.png', route: '/', width: 390, height: 1400, openDetails: '[data-v4-chapter="launchloom"] .v4-scope', scrollTo: '[data-v4-chapter="launchloom"] .v4-figure', assertVisible: '[data-v4-chapter="launchloom"] .v4-proof', state: 'phone, JavaScript disabled, Launchloom card with footage and evidence disclosure open, real time', realtime: true, noScript: true },
  { file: 'genie-lp-m-features.png', route: '/products/genie/', width: 390, height: 1900, scrollTo: '#features', state: 'phone, Genie LP 01 with the next-TaskDock figure (4:3), reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'genie-lp-nojs-features.png', route: '/products/genie/', width: 390, height: 1900, scrollTo: '#features', state: 'phone, JavaScript disabled, Genie LP 01, real time', realtime: true, noScript: true },
  { file: 'genie-lp-return-motion.png', route: '/products/genie/', width: 1440, height: 1000, scrollTo: '[data-glp-return]', state: 'Genie LP closing line, normal motion, after it ran once, real time', realtime: true },
  { file: 'genie-lp-return.png', route: '/products/genie/', width: 1440, height: 1000, scrollTo: '[data-glp-return]', state: 'Genie LP closing line returning to the mark, real time', realtime: true },
  { file: 'genie-lp-m-demos.png', route: '/products/genie/', width: 390, height: 844, scrollTo: '#demos', state: 'phone, Genie LP demos, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'home-en-desktop.png', route: '/en/', width: 1440, height: 1000, state: 'default, English seven-product home, real time', realtime: true },
  { file: 'product-desktop.png', route: '/products/genie/', width: 1440, height: 1100, state: 'default, real time', realtime: true },
  { file: 'product-mobile.png', route: '/products/oathra/', width: 390, height: 900, state: 'default, real time', realtime: true },
  // Below the first view: the sections a viewport shot never reaches.
  //
  // These are captured with reduced motion on purpose. Entrance animations start at
  // `opacity:.6` (lab-explorer.css `@keyframes lab-arrive`) and this browser produces
  // no animation frames, so a default-motion capture can freeze mid-entrance and make
  // a section look washed out that is not. Reduced motion disables those animations
  // outright, so the colours in these files are the settled ones.
  { file: 'home-tall-en.png', route: '/en/', width: 1440, height: 1000, state: 'whole English home after scrolling through, reduced motion, real time', reducedMotion: true, realtime: true, fullPage: true },
  { file: 'product-tall-genie.png', route: '/products/genie/', width: 1440, height: 1000, state: 'whole product page after scrolling through, reduced motion, real time', reducedMotion: true, realtime: true, fullPage: true },
  // Ledger capabilities under the hero: badges bar and three feature cards, in both languages and at phone width.
  { file: 'product-capabilities-en.png', route: '/en/products/oathra/', width: 1440, height: 1000, offset: 1000, state: 'English capability badges and cards, reduced motion', reducedMotion: true },
  { file: 'product-m-capabilities.png', route: '/products/ai-meeting/', width: 390, height: 1400, offset: 1450, state: 'phone, capability badges and cards, reduced motion', reducedMotion: true },
  // Genie only: the next-UI design frames under "current boundaries", and the app icon beside the heading.
  { file: 'product-next-ui-ja.png', route: '/products/genie/', width: 1440, height: 1000, scrollTo: '#next-ui', state: 'Genie next-UI design frames, Japanese, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'product-next-ui-en.png', route: '/en/products/genie/', width: 1440, height: 1000, offset: 2850, state: 'Genie next-UI design frames, English, reduced motion', reducedMotion: true },
  { file: 'product-next-ui-760.png', route: '/products/genie/', width: 760, height: 1600, scrollTo: '#next-ui', state: '760px, Genie next-UI frames in one column, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'product-next-ui-380.png', route: '/products/genie/', width: 380, height: 1600, scrollTo: '#next-ui', state: '380px, Genie next-UI frames, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'product-next-ui-768.png', route: '/products/genie/', width: 768, height: 1400, scrollTo: '#next-ui', state: '768px, Genie next-UI frames in three columns, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'product-next-ui-1024.png', route: '/products/genie/', width: 1024, height: 1100, scrollTo: '#next-ui', state: '1024px, Genie next-UI frames in three columns, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'product-next-ui-1920.png', route: '/products/genie/', width: 1920, height: 1100, scrollTo: '#next-ui', state: '1920px, Genie next-UI frames in five columns, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'product-next-ui-320.png', route: '/products/genie/', width: 320, height: 1800, scrollTo: '#next-ui', state: '320px, Genie next-UI frames, reduced motion, real time', reducedMotion: true, realtime: true },
  { file: 'product-next-ui-320-en.png', route: '/en/products/genie/', width: 320, height: 1800, offset: 4700, state: '320px English, Genie next-UI frames, reduced motion', reducedMotion: true },
  { file: 'product-boundaries-oathra.png', route: '/products/oathra/', width: 1440, height: 1000, offset: 3000, state: 'Oathra current boundaries, unchanged external design link, reduced motion', reducedMotion: true },
  { file: 'product-genie-380.png', route: '/products/genie/', width: 380, height: 900, state: '380px, Genie hero with app icon, reduced motion', reducedMotion: true },
  { file: 'product-genie-760-tall.png', route: '/products/genie/', width: 760, height: 7000, state: '760px whole page (to locate bands), reduced motion', reducedMotion: true },
  { file: 'product-genie-380-tall.png', route: '/products/genie/', width: 380, height: 9000, state: '380px whole page (to locate bands), reduced motion', reducedMotion: true },
  { file: 'product-capabilities-ja.png', route: '/products/genie/', width: 1440, height: 1000, offset: 1000, state: 'Japanese capability badges and cards, reduced motion', reducedMotion: true },
  { file: 'product-capabilities-dark.png', route: '/en/products/ai-meeting/', width: 1440, height: 1000, offset: 1000, state: 'dark palette capability badges and cards, reduced motion', reducedMotion: true },
  // Widths between the phone and the desktop shots, where layouts usually break.
  // Whole page on a phone. Anchor routes are useless here: `html{scroll-behavior:smooth}`
  // needs animation frames, which this headless browser does not produce, so a
  // `/#faq` capture silently returns the top of the page instead.
  // The English page at phone widths. Its copy is longer than the Japanese, so a
  // badge or label that wraps here does not show up in any of the shots above.
  { file: 'home-en-mobile.png', route: '/en/', width: 390, height: 844, state: 'default, English seven-product home, real time', realtime: true },
  { file: 'home-en-narrow.png', route: '/en/', width: 320, height: 900, state: 'default, English seven-product home, real time', realtime: true },
  // Lower bands at a readable size. A whole-page shot is 8400px tall, so anything
  // below the first view is unreadable in it; `offset` scrolls the page up by that
  // many CSS px through an injected stylesheet, because this browser produces no
  // animation frames and `/#anchor` silently returns the top of the page.
  // The recording band and the try band at full resolution. A 8400px whole-page shot
  // renders too small to read, so the bands that carry the proof get their own frames.
  // Phone widths below the fold, because home-mobile-tall.png is unreadable as one image.
  // The fifteen-second film band (Japanese home only), desktop and phone.
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

export function selectShots(config, requiredOnly = process.env.UI_CAPTURE_REQUIRED_ONLY === '1') {
  const byPath = new Map();
  for (const shot of SHOTS) {
    const relative = `artifacts/ui/${shot.file}`;
    if (byPath.has(relative)) throw new Error(`Duplicate capture mapping: ${relative}`);
    byPath.set(relative, shot);
  }
  // Validate the gate contract in both modes. A renamed or new required image
  // must have a concrete route, viewport and capture state before Chrome starts.
  const required = config.requiredImages.map(relative => {
    const shot = byPath.get(relative);
    if (!shot) throw new Error(`Required image has no capture mapping: ${relative}`);
    if (!shot.realtime || shot.offset) throw new Error(`Required image must capture the unmodified build in real time: ${relative}`);
    return shot;
  });
  if (new Set(config.requiredImages).size !== required.length) throw new Error('Duplicate required image path');
  return requiredOnly ? required : [...SHOTS];
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function gitValue(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 10000 });
  if (result.status !== 0) throw new Error(`Cannot record capture source: git ${args.join(' ')}`);
  return result.stdout.trim();
}

async function pngRecord(target) {
  const raw = await fs.readFile(target);
  if (raw.length < 32 || raw.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`Browser did not produce a valid PNG: ${target}`);
  }
  return { bytes: raw.length, sha256: sha256(raw), pngWidth: raw.readUInt32BE(16), pngHeight: raw.readUInt32BE(20) };
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

// Real-time capture over the Chrome DevTools Protocol (Node's built-in WebSocket, no dependency).
// Frames and IntersectionObserver advance, unlike --screenshot with a virtual time budget.
async function captureRealtime(binary, shots, results = []) {
  const port = PORT + 7;
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-rt-'));
  const chrome = spawn(binary, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-sandbox', 'about:blank'], { stdio: 'ignore' });
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  try {
    let targets = [];
    for (let i = 0; i < 100 && !targets.some(t => t.type === 'page'); i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(100); } }
    const page = targets.find(t => t.type === 'page');
    if (!page) throw new Error('Real-time capture: no browser page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
    let seq = 0; const pending = new Map(); let loaded = false;
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) {
        const request = pending.get(d.id); pending.delete(d.id); clearTimeout(request.timer);
        if (d.error) request.reject(new Error(`${request.method}: ${d.error.message}`));
        else request.resolve(d);
      } else if (d.method === 'Page.loadEventFired') loaded = true;
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Capture command timed out: ${method}`)); }, 30000);
      pending.set(id, { resolve, reject, timer, method });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (response.result.exceptionDetails) throw new Error(`Capture evaluation failed: ${response.result.exceptionDetails.text}`);
      return response.result.result.value;
    };
    const queryNode = async selector => {
      const document = await send('DOM.getDocument', { depth: 0 });
      const node = await send('DOM.querySelector', { nodeId: document.result.root.nodeId, selector });
      if (!node.result.nodeId) throw new Error(`Capture target does not exist: ${selector}`);
      return node.result.nodeId;
    };
    const openDetails = async selector => {
      const nodeId = await queryNode(selector);
      const attrs = await send('DOM.getAttributes', { nodeId });
      if (attrs.result.attributes.filter((_, i) => i % 2 === 0).includes('open')) return;
      const summaryId = await queryNode(`${selector} > summary`);
      await send('DOM.scrollIntoViewIfNeeded', { nodeId: summaryId });
      const box = await send('DOM.getBoxModel', { nodeId: summaryId });
      const quad = box.result.model.content;
      const x = (quad[0] + quad[2] + quad[4] + quad[6]) / 4;
      const y = (quad[1] + quad[3] + quad[5] + quad[7]) / 4;
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      const opened = await send('DOM.getAttributes', { nodeId });
      if (!opened.result.attributes.filter((_, i) => i % 2 === 0).includes('open')) {
        throw new Error(`Native disclosure did not open after clicking its summary: ${selector}`);
      }
    };
    await send('Page.enable');
    for (const shot of shots) {
      await send('Emulation.setDeviceMetricsOverride', { width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: shot.width < 600 });
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: shot.reducedMotion ? 'reduce' : 'no-preference' }] });
      await send('Emulation.setScriptExecutionDisabled', { value: Boolean(shot.noScript) });
      loaded = false;
      const navigation = await send('Page.navigate', { url: ORIGIN + shot.route });
      if (navigation.result.errorText) throw new Error(`Navigation failed: ${navigation.result.errorText}`);
      for (let i = 0; i < 150 && !loaded; i++) await sleep(100);
      if (!loaded) throw new Error(`Real-time capture: ${shot.file} did not finish loading`);
      await sleep(1200);
      if (shot.openDetails) await openDetails(shot.openDetails);
      if (shot.fullPage) {
        await evaluate(`(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += innerHeight / 2) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); } scrollTo({ top: 0, behavior: 'instant' }); })()`);
        await sleep(800);
      }
      if (shot.scrollTo) {
        const found = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(shot.scrollTo)}); if (!e) return false; e.scrollIntoView({ block: 'start', behavior: 'instant' }); return true; })()`);
        if (!found) throw new Error(`Real-time capture: ${shot.file} has no ${shot.scrollTo}`);
        await sleep(1600);
      }
      if (shot.assertVisible) {
        const visible = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(shot.assertVisible)}); if (!e) return false; const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0; })()`);
        if (!visible) throw new Error(`Real-time capture: ${shot.file} does not show ${shot.assertVisible}`);
      }
      const overflow = shot.noScript ? null : await evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth');
      let clip;
      if (shot.fullPage) { const m = await send('Page.getLayoutMetrics'); clip = { x: 0, y: 0, width: shot.width, height: Math.ceil(m.result.cssContentSize.height), scale: 1 }; }
      const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) });
      const target = path.join(OUT, shot.file);
      await fs.writeFile(target, Buffer.from(r.result.data, 'base64'));
      const image = await pngRecord(target);
      if (image.pngWidth !== shot.width || image.pngHeight !== (clip?.height || shot.height)) {
        throw new Error(`Unexpected browser PNG dimensions for ${shot.file}: ${image.pngWidth}x${image.pngHeight}`);
      }
      results.push({ ...shot, ...image, url: ORIGIN + shot.route, horizontalOverflow: overflow, ...(clip ? { capturedHeight: clip.height } : {}) });
      console.error(`[ui-capture] ${shot.file} ${shot.width}x${clip ? clip.height : shot.height} real time${overflow ? ' OVERFLOW' : ''} (${image.bytes} bytes)`);
    }
    ws.close();
  } finally {
    chrome.kill();
    await sleep(300);
    await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
  return results;
}

export async function capture() {
  await fs.access(path.join(root, 'dist/index.html')).catch(() => { throw new Error('dist/ is missing. Run "npm run build" first.'); });
  const config = loadConfig(root);
  const requiredOnly = process.env.UI_CAPTURE_REQUIRED_ONLY === '1';
  const requested = selectShots(config, requiredOnly);
  const sourceFingerprint = fingerprint(root, config);
  const source = {
    commit: gitValue(['rev-parse', 'HEAD']),
    tree: gitValue(['rev-parse', 'HEAD^{tree}']),
    dirty: Boolean(gitValue(['status', '--porcelain', '--untracked-files=normal'])),
    sourceFingerprint,
    ciRunId: process.env.GITHUB_RUN_ID || null,
    ciRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
  };
  const builtPages = await Promise.all([...new Set(requested.map(shot => shot.route))].map(async route => {
    const relative = path.posix.join(route, 'index.html');
    return { path: `dist${relative}`, sha256: sha256(await fs.readFile(path.join(root, 'dist', relative))) };
  }));
  const binary = findBrowser();
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8' }).stdout?.trim() || 'unknown';
  await fs.mkdir(OUT, { recursive: true });
  for (const shot of requested) await fs.rm(path.join(OUT, shot.file), { force: true });
  await fs.rm(path.join(OUT, 'capture.json'), { force: true });

  // Offset shots are served from a mirror of dist with one extra stylesheet, so the
  // real build is never modified and `style-src 'self'` still holds.
  const offsets = [...new Set(requested.filter(shot => shot.offset).map(shot => shot.offset))];
  const mirror = path.join(os.tmpdir(), `reachmade-capture-${process.pid}`);
  if (offsets.length) {
    await fs.rm(mirror, { recursive: true, force: true });
    await fs.cp(path.join(root, 'dist'), mirror, { recursive: true });
    for (const offset of offsets) {
      await fs.writeFile(path.join(mirror, `assets/offset-${offset}.css`), `html{margin-top:-${offset}px}\n`);
    }
    // One offset page per (route, offset) pair, so any built route can be captured below the fold.
    // The page is shifted instead of scrolled, so lazy images would never start loading; the mirror
    // (evidence only, never deployed) loads them eagerly so the shot shows the state a reader sees after scrolling.
    for (const shot of requested.filter(shot => shot.offset)) {
      const dir = shot.route.replace(/^\//, '');
      const page = await fs.readFile(path.join(mirror, dir, 'index.html'), 'utf8');
      await fs.writeFile(path.join(mirror, dir, `offset-${shot.offset}.html`), page.replace('</head>', `<link rel="stylesheet" href="/assets/offset-${shot.offset}.css"></head>`).replaceAll(' loading="lazy"', '').replaceAll(' decoding="async"', ''));
    }
  }
  const server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  const offsetServer = offsets.length
    ? spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], { cwd: root, env: { ...process.env, PORT: String(PORT + 1), SERVE_ROOT: mirror }, stdio: 'ignore' })
    : null;
  const shots = [];
  let captureError;
  try {
    await waitForServer();
    for (const shot of requested.filter(shot => !shot.realtime)) {
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
      if (result.status !== 0 || !fsSync.existsSync(target)) throw new Error(`Capture failed for ${shot.file}: ${(result.stderr || '').split('\n').slice(-3).join(' ')}`);
      const image = await pngRecord(target);
      shots.push({ ...shot, ...image, url });
      console.error(`[ui-capture] ${shot.file} ${shot.width}x${shot.height} (${image.bytes} bytes)`);
    }
    await captureRealtime(binary, requested.filter(shot => shot.realtime), shots);
  } catch (error) {
    captureError = error;
  } finally {
    server.kill();
    offsetServer?.kill();
    await fs.rm(mirror, { recursive: true, force: true });
  }

  const manifest = {
    capturedAt: new Date().toISOString(),
    source,
    sourceFingerprint,
    sourceFingerprintAfterCapture: fingerprint(root, config),
    builtPages,
    selection: requiredOnly ? 'required-images' : 'all-mapped-shots',
    requestedImages: requested.map(shot => `artifacts/ui/${shot.file}`),
    browser: { binary, version },
    server: { origin: ORIGIN, source: 'dist/', note: 'Local build over HTTP, not the production deployment.' },
    note: 'Files written here are not reviewed until a person or the ui-reviewer opens them as images.',
    shots,
    ...(captureError ? { captureError: captureError.message } : {}),
  };
  await fs.writeFile(path.join(OUT, 'capture.json'), JSON.stringify(manifest, null, 2) + '\n');
  if (captureError) throw captureError;
  if (manifest.sourceFingerprintAfterCapture !== sourceFingerprint) throw new Error('Source changed during capture. The images must be captured again from stable source.');
  if (shots.some(shot => shot.horizontalOverflow)) throw new Error('Captured page has horizontal overflow; see capture.json and the real images.');
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  capture().then(manifest => console.log(`Captured ${manifest.shots.length} screens into artifacts/ui/ with ${manifest.browser.version}.`))
    .catch(error => { console.error(`[ui-capture] ${error.message}`); process.exitCode = 1; });
}
