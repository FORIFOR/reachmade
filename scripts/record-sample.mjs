#!/usr/bin/env node
/**
 * Record the guided sample by actually operating it.
 *
 * There is no screen-capture library here and no npm dependency. The script drives the
 * real built site in an installed Chrome over the DevTools protocol, performs the real
 * actions a visitor performs — real keystrokes, the real download button, the real file
 * input — and captures a frame after each one. ffmpeg assembles those frames.
 *
 * What that means for honesty, and what the site must therefore say:
 * - Every frame comes from the live session. None is drawn, generated or re-titled.
 * - Frames are captured one by one and assembled at a fixed rate, so this is a faithful
 *   reconstruction of a real session rather than a continuous screen capture. Nothing is
 *   sped up and no waiting is removed, because the sample has no waiting to remove.
 * - Captions are injected into the page as real DOM before each segment, so they are part
 *   of the capture. They are editorial; the page next to the video says so.
 * - This records the guided sample, which uses fictional data and runs no AI. It is not a
 *   recording of the Genie application.
 *
 *     npm run build && node scripts/record-sample.mjs
 *
 * Requires ffmpeg on PATH and an installed Chrome (CHROME_BIN overrides the search).
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findBrowser } from './ui-capture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = path.join(root, 'artifacts/ui/video');
const frames = path.join(work, 'frames');
const outDir = path.join(root, 'public/media/derived/sample');
const port = Number(process.env.RECORD_PORT || 4198);
const origin = `http://127.0.0.1:${port}`;
const FPS = 12;
// Two real passes. The vertical cut is recorded at a phone viewport so the site's own
// responsive layout composes it, instead of centre-cropping a desktop frame.
const COPY = {
  ja: { route: '/products/genie/', sub: '操作サンプル・架空データ・AI実行なし',
    result: '残るのは、あなたが書いた .md ファイル1つ', input: '例文を、自分の内容に書き換える',
    review: '書いた文章を、そのまま確認する', export: 'Markdown でダウンロードする',
    reopen: '保存したファイルから復元できる', entry: 'reachmade.com で試せます',
    typed: ['来週の打ち合わせ用に、', '要点を3つだけ先に決める。', '\n\n・何を見せるか\n', '・何を保留にするか\n', '・次に誰が動くか'] },
  en: { route: '/en/products/genie/', sub: 'Guided sample · fictional data · no AI run',
    result: 'What you keep: one .md file you wrote', input: 'Replace the example with your own text',
    review: 'Read your own text back', export: 'Download it as Markdown',
    reopen: 'Reopen the file you saved', entry: 'Try it at reachmade.com',
    typed: ['For next week\'s meeting, ', 'decide just three things first.', '\n\n- what to show\n', '- what to hold back\n', '- who moves next'] }
};
// Each language gets its own real recording: the English page's own UI, not a translation
// caption over a Japanese screen.
const PASSES = [
  { name: 'ja-wide', lang: 'ja', width: 1000, height: 562, dsf: 1.6, caption: 17, sub: 9, out: 'sample-16x9.mp4', scale: 'scale=1280:-2:flags=lanczos', crf: '25' },
  { name: 'ja-vertical', lang: 'ja', width: 720, height: 1280, dsf: 1, caption: 30, sub: 15, out: 'sample-9x16.mp4', scale: 'scale=720:-2:flags=lanczos', crf: '26' },
  { name: 'en-wide', lang: 'en', width: 1000, height: 562, dsf: 1.6, caption: 17, sub: 9, out: 'sample-16x9-en.mp4', scale: 'scale=1280:-2:flags=lanczos', crf: '25' },
  { name: 'en-vertical', lang: 'en', width: 720, height: 1280, dsf: 1, caption: 30, sub: 15, out: 'sample-9x16-en.mp4', scale: 'scale=720:-2:flags=lanczos', crf: '26' }
];
const pause = ms => new Promise(r => setTimeout(r, ms));

if (!spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).stdout) {
  console.error('[record] ffmpeg is required and was not found on PATH.');
  process.exit(1);
}
await fs.access(path.join(root, 'dist/products/genie/index.html')).catch(() => {
  console.error('[record] dist/ is missing. Run "npm run build" first.');
  process.exit(1);
});

await fs.rm(frames, { recursive: true, force: true });
await fs.mkdir(frames, { recursive: true });
await fs.mkdir(outDir, { recursive: true });
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-rec-'));
const server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
const binary = process.env.CHROME_BIN || findBrowser();
const chrome = spawn(binary, ['--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--no-first-run', '--disable-background-networking', '--disable-component-update',
  '--force-prefers-reduced-motion', `--window-size=${PASSES[0].width},${PASSES[0].height}`,
  `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });

let stderr = '', socket, seq = 0, session, frame = 0;
const pending = new Map();
chrome.stderr.on('data', b => { stderr += b; });
const call = (method, params = {}, sid = session) => new Promise((resolve, reject) => {
  const id = ++seq, timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 20000);
  pending.set(id, { resolve, reject, timer });
  socket.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) }));
});
const evaluate = async expression => {
  const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const waitFor = async expression => {
  for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(100); }
  throw Error(`Not ready: ${expression}`);
};
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);

/** One captured frame. Held frames repeat the same PNG, which is what a still moment is. */
async function shoot(count = 1) {
  const r = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buf = Buffer.from(r.data, 'base64');
  for (let i = 0; i < count; i++) {
    await fs.writeFile(path.join(frames, pass.name, `f${String(frame++).padStart(5, '0')}.png`), buf);
  }
}

/** The caption is real DOM, styled with the site's own type, so it burns into the capture. */
const captionCss = pass => `#rec-caption{position:fixed;left:0;right:0;bottom:${pass.name === 'vertical' ? 74 : 54}px;z-index:2147483647;
 padding:${Math.round(pass.caption * .7)}px 24px ${Math.round(pass.caption * .8)}px;
 background:linear-gradient(180deg,#20231f00,#20231ff2 34%);
 color:#f5f4ef;font:600 ${pass.caption}px/1.45 Inter,"Hiragino Kaku Gothic ProN","Noto Sans CJK JP",sans-serif;
 letter-spacing:-.02em;text-align:center;pointer-events:none}
 #rec-caption small{display:block;margin-top:8px;font:400 ${pass.sub}px/1.6 ui-monospace,monospace;
 letter-spacing:.04em;color:#cdd1c6}`;

const settings = { capturedAt: new Date().toISOString(), fps: FPS, passes: [] };
let segments = [], pass = PASSES[0];
const mark = (name, from) => segments.push({ name, frames: frame - from, seconds: +((frame - from) / FPS).toFixed(2) });
async function caption(text) {
  await evaluate(`(()=>{let s=document.getElementById('rec-style');
   if(!s){s=document.createElement('style');s.id='rec-style';document.head.append(s);}
   s.textContent=${JSON.stringify(captionCss(pass))};
   let c=document.getElementById('rec-caption');
   if(!c){c=document.createElement('div');c.id='rec-caption';document.body.append(c);}
   c.innerHTML=${JSON.stringify(`${text}<small>${COPY[pass.lang].sub}</small>`)};return true;})()`);
}

try {
  for (let i = 0; i < 120 && !/DevTools listening on (ws:\/\/[^\s]+)/.test(stderr); i++) await pause(100);
  const endpoint = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];
  if (!endpoint) throw Error(`Chrome did not start: ${stderr.slice(-800)}`);
  socket = new WebSocket(endpoint);
  await new Promise((res, rej) => { socket.onopen = res; socket.onerror = rej; });
  socket.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (!msg.id) return;
    const item = pending.get(msg.id); if (!item) return;
    clearTimeout(item.timer); pending.delete(msg.id);
    msg.error ? item.reject(Error(JSON.stringify(msg.error))) : item.resolve(msg.result);
  };
  settings.browser = (await call('Browser.getVersion', {}, null)).product;
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' }, null);
  session = (await call('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId;
  await call('Page.enable'); await call('Runtime.enable');
  // The site sends style-src 'self', which blocks the injected caption stylesheet. Bypass
  // applies to this recording session only; the served site and its headers are unchanged.
  await call('Page.setBypassCSP', { enabled: true });
  settings.cspBypassedForCaptions = true;
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: work, eventsEnabled: true }, null);

 for (pass of PASSES) {
  frame = 0; segments = [];
  await fs.rm(path.join(frames, pass.name), { recursive: true, force: true });
  await fs.mkdir(path.join(frames, pass.name), { recursive: true });
  await call('Emulation.setDeviceMetricsOverride', { width: pass.width, height: pass.height, deviceScaleFactor: pass.dsf, mobile: pass.name === 'vertical' });

  const copy = COPY[pass.lang];
  await call('Page.navigate', { url: origin + copy.route });
  await waitFor(`document.readyState==='complete' && !!document.querySelector('[data-outcome-sample]')`);
  await click('[data-outcome-sample]');
  await waitFor(`!!document.querySelector('[data-draft-text]')`);
  await evaluate(`document.querySelector('.lab-hands').scrollIntoView({block:'center',behavior:'instant'})`);
  await pause(300);

  // 1. Result first: what the visitor ends up with.
  let from = frame;
  await caption(copy.result);
  await shoot(FPS * 3);
  mark('result-first', from);

  // 2. Real keystrokes replacing the example text.
  from = frame;
  await caption(copy.input);
  await evaluate(`document.querySelector('[data-draft-text]').focus();document.querySelector('[data-draft-text]').select()`);
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
  await shoot(4);
  for (const chunk of copy.typed) {
    await call('Input.insertText', { text: chunk });
    await shoot(9);
  }
  await shoot(FPS);
  mark('input', from);

  // 3. Review the visitor's own text. The practice question is skipped, as the UI allows.
  from = frame;
  await caption(copy.review);
  await click('[data-next]');
  await pause(250); await shoot(8);
  if (await evaluate(`!!document.querySelector('[data-skip-exercise]')`)) {
    await click('[data-skip-exercise]');
    await pause(250);
  }
  await waitFor(`!!document.querySelector('[data-draft-preview]')`);
  await evaluate(`document.querySelector('.lab-hands').scrollIntoView({block:'center',behavior:'instant'})`);
  await shoot(FPS * 4);
  mark('review', from);

  // 4. The real export, including the real download.
  from = frame;
  await caption(copy.export);
  await click('[data-next]');
  await waitFor(`!!document.querySelector('[data-download]')`);
  await evaluate(`document.querySelector('.lab-hands').scrollIntoView({block:'center',behavior:'instant'})`);
  await shoot(FPS * 2);
  await click('[data-download]');
  await pause(900);
  await shoot(FPS * 3);
  mark('export', from);

  // 5. Reopen the file that was actually written to disk.
  from = frame;
  const saved = (await fs.readdir(work)).find(f => f.endsWith('.md'));
  if (saved) {
    await caption(copy.reopen);
    await click('[data-reset]');
    await waitFor(`!!document.querySelector('[data-import]')`);
    await call('DOM.enable');
    const { root: doc } = await call('DOM.getDocument');
    const { nodeId } = await call('DOM.querySelector', { nodeId: doc.nodeId, selector: '[data-draft-file]' });
    await call('DOM.setFileInputFiles', { nodeId, files: [path.join(work, saved)] });
    await pause(700);
    await evaluate(`document.querySelector('.lab-hands').scrollIntoView({block:'center',behavior:'instant'})`);
    await shoot(FPS * 3);
    settings.reopenedFile = saved;
  } else {
    settings.reopenedFile = null;
    settings.note = 'The download did not produce a file in this environment; the reopen segment was skipped rather than faked.';
  }
  await caption(copy.entry);
  await shoot(FPS * 2);
  mark('reopen-and-entry', from);
  settings.passes.push({ ...pass, frames: frame, seconds: +(frame / FPS).toFixed(2), segments });
  if (frame < FPS * 12) throw Error(`Too few frames in the ${pass.name} pass (${frame}); refusing to publish a stub video.`);
 }
} finally {
  try { socket?.close(); } catch { /* already closed */ }
  chrome.kill(); server.kill();
  await fs.rm(profile, { recursive: true, force: true });
}

// ---- Encode each pass from its own frames. ----
const run = (args, label) => {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw Error(`ffmpeg failed (${label}): ${(r.stderr || '').split('\n').slice(-6).join(' ')}`);
};
settings.outputs = {};
const probe = file => spawnSync('ffprobe', ['-v', 'error', '-show_entries',
  'format=duration:stream=width,height,codec_name,codec_type', '-of', 'default=noprint_wrappers=1', file],
  { encoding: 'utf8' }).stdout.trim();
for (const p of settings.passes) {
  const file = path.join(outDir, p.out);
  run(['-y', '-framerate', String(FPS), '-i', path.join(frames, p.name, 'f%05d.png'),
    '-vf', `${p.scale},format=yuv420p`, '-an', '-c:v', 'libx264', '-preset', 'slow',
    '-crf', p.crf, '-movflags', '+faststart', file], p.name);
  settings.outputs[p.out] = { bytes: fsSync.statSync(file).size, probe: probe(file) };
}
for (const [lang, file] of [['ja', 'sample-poster.jpg'], ['en', 'sample-poster-en.jpg']]) {
  const src = settings.passes.find(p => p.lang === lang && p.name.endsWith('wide'));
  if (!src) continue;
  const poster = path.join(outDir, file);
  run(['-y', '-i', path.join(outDir, src.out), '-vf', 'select=eq(n\\,0),scale=1280:-2',
    '-frames:v', '1', '-q:v', '5', poster], `poster ${lang}`);
  settings.outputs[file] = { bytes: fsSync.statSync(poster).size };
}
settings.ffmpeg = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).stdout.split('\n')[0];
await fs.writeFile(path.join(work, 'capture-settings.json'), JSON.stringify(settings, null, 2) + '\n');

for (const p of settings.passes) console.log(`[record] ${p.name}: ${p.frames} real frames -> ${p.seconds}s at ${FPS}fps (${p.width}x${p.height})`);
for (const [name, info] of Object.entries(settings.outputs)) console.log(`[record] ${name} ${info.bytes} bytes`);
console.log(`[record] settings and raw frames: artifacts/ui/video/`);
