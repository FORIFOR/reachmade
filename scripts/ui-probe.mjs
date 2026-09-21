#!/usr/bin/env node
/**
 * Measure the things a screenshot cannot show.
 *
 * This browser produces exactly one animation frame and then stops — measured:
 * `requestAnimationFrame` fired once with elapsed 0ms while `setInterval` fired
 * ten times over the same budget. Timers do advance. So the probe serves a copy
 * of the real build with one substitution — the frame source becomes a timer —
 * and then drives the real page: it opens every FAQ entry, works the scene
 * controls and the mobile menu, focuses every interactive element, and measures
 * hit areas, contrast and horizontal overflow from the live layout.
 *
 * What it proves: the shipped markup, CSS and modules behave as intended in a
 * real browser. What it does not prove: how the page behaves when the browser
 * supplies its own frames, how it feels on a real phone, or that anyone can use
 * it. Those stay unverified until a person checks them.
 *
 *     npm run build && npm run ui:probe
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findBrowser } from './ui-capture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'artifacts/ui');
const PORT = Number(process.env.UI_PROBE_PORT || 4187);
export const WIDTHS = [320, 390, 768, 960, 1024, 1440, 1920];

// The preview server sends `script-src 'self'`, exactly as production does, so
// these run as same-origin files. Inline scripts are blocked and would silently
// leave the probe empty.
const FRAME_SHIM_JS = `window.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 16);
window.cancelAnimationFrame = id => clearTimeout(id);`;

const PROBE_HTML = `<div id="probe" style="position:fixed;left:0;top:0;z-index:99999;background:#fff;font:11px monospace;white-space:pre;padding:8px;max-width:100%"></div>
<script src="/ui-probe-client.js"></script>`;

const PROBE_JS = `
function lum(c){const m=c.match(/[\\d.]+/g).map(Number);const f=m.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*f[0]+0.7152*f[1]+0.0722*f[2];}
function ratio(a,b){const x=lum(a),y=lum(b),hi=Math.max(x,y),lo=Math.min(x,y);return (hi+0.05)/(lo+0.05);}
// A translucent layer is not the background: keep walking until something opaque.
function bgOf(el){let n=el;while(n&&n!==document.documentElement){const c=getComputedStyle(n).backgroundColor;const m=c.match(/[\\d.]+/g);if(m){const a=m.length>3?parseFloat(m[3]):1;if(a>=0.5)return c;}n=n.parentElement;}return getComputedStyle(document.body).backgroundColor;}
setTimeout(()=>{
  const out={width:window.innerWidth};
  const faq=[...document.querySelectorAll('.rm-faq-item')];
  out.faq={count:faq.length,openInitially:faq.filter(d=>d.open).length,answersWithText:faq.filter(d=>(d.querySelector('p')||{}).textContent?.trim().length>20).length};
  faq.forEach(d=>{const s=d.querySelector('summary');s&&s.click();});
  out.faq.openAfterClickingEach=faq.filter(d=>d.open).length;
  const scene=document.querySelector('.sig-scene');
  out.scene={mounted:scene?scene.dataset.sceneVersion:null,statesSeen:[]};
  if(scene){
    const dots=[...document.querySelectorAll('[data-scene-dots] button')];
    if(dots[3]){dots[3].click();out.scene.stateAfterChoosingStep4=scene.dataset.state;}
    const toggle=document.querySelector('[data-scene-toggle]');
    if(toggle){const before=toggle.textContent;toggle.click();out.scene.toggle=before+' -> '+toggle.textContent;}
  }
  const navToggle=document.querySelector('.nav-toggle'),nav=document.querySelector('#main-nav');
  if(navToggle&&nav){
    const shown=()=>getComputedStyle(nav).display!=='none';
    const before=shown();navToggle.click();
    out.nav={collapsedBefore:!before,openAfterClick:shown(),aria:navToggle.getAttribute('aria-expanded')};
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
    out.nav.closedByEscape=!shown();out.nav.ariaAfterEscape=navToggle.getAttribute('aria-expanded');
  }
  const inter=[...document.querySelectorAll('a[href],button,summary,[tabindex]')].filter(e=>e.offsetParent!==null);
  const small=inter.map(e=>{const r=e.getBoundingClientRect();return{text:(e.textContent||'').trim().slice(0,24),w:Math.round(r.width),h:Math.round(r.height)};}).filter(o=>o.h>0&&o.h<44);
  out.hitAreas={interactive:inter.length,under44:small.length,smallest:small.sort((a,b)=>a.h-b.h).slice(0,8)};
  let focused=0;inter.forEach(e=>{e.focus();if(document.activeElement===e)focused++;});
  out.focusable=focused+'/'+inter.length;
  out.contrast=[['.sig-body>span','scene line'],['.sig-note','scene note'],['.rm-faq-item p','FAQ answer'],['.rm-access-note','access note'],['.rm-foot-col a','footer link'],['.rm-hero-lead','hero lead'],['.rm-access-table td','table cell'],['.rm-foot-bottom small','copyright']]
    .map(([sel,name])=>{const el=document.querySelector(sel);if(!el)return name+': n/a';const cs=getComputedStyle(el);return name+' '+Math.round(parseFloat(cs.fontSize))+'px '+ratio(cs.color,bgOf(el)).toFixed(2)+':1';});
  const past=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>window.innerWidth+1&&getComputedStyle(e).position!=='fixed';});
  out.overflow={scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,
    clipped:past.map(e=>typeof e.className==='string'?e.className.split(' ')[0]:e.tagName).filter((v,i,a)=>a.indexOf(v)===i).slice(0,6)};
  document.getElementById('probe').textContent=JSON.stringify(out);
},2500);
`;

async function copyBuild(target) {
  await fs.rm(target, { recursive: true, force: true });
  await fs.cp(path.join(root, 'dist'), target, { recursive: true });
  const page = path.join(target, 'index.html');
  const html = await fs.readFile(page, 'utf8');
  if (!html.includes('<head>') || !html.includes('</body>')) throw new Error('Unexpected page shell');
  await fs.writeFile(path.join(target, 'ui-frame-shim.js'), FRAME_SHIM_JS);
  await fs.writeFile(path.join(target, 'ui-probe-client.js'), PROBE_JS);
  await fs.writeFile(page, html
    .replace('<head>', '<head><script src="/ui-frame-shim.js"></script>')
    .replace('</body>', PROBE_HTML + '</body>'));
}

function serve(relativeRoot) {
  // Reuse the preview server the capture already depends on. A second minimal
  // server held connections open and the browser never exited.
  const server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], {
    cwd: root, env: { ...process.env, PORT: String(PORT), SERVE_ROOT: relativeRoot }, stdio: 'ignore'
  });
  return server;
}

async function waitForServer(origin, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok) return; } catch { /* not up */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Probe server did not answer on ${origin}`);
}

export async function probe({ widths = WIDTHS } = {}) {
  const binary = findBrowser();
  const target = path.join(OUT, '.probe');
  await fs.mkdir(OUT, { recursive: true });
  await copyBuild(target);
  const server = serve(path.relative(root, target));
  const origin = `http://127.0.0.1:${PORT}/`;
  const results = [];
  try {
    await waitForServer(origin);
    for (const width of widths) {
      const result = spawnSync(binary, ['--headless', '--disable-gpu', '--no-sandbox', '--run-all-compositor-stages-before-draw',
        `--window-size=${width},900`, '--virtual-time-budget=9000', '--dump-dom', origin], { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
      const match = /<div id="probe"[^>]*>([\s\S]*?)<\/div>/.exec(result.stdout || '');
      if (!match) throw new Error(`No probe output at ${width}px`);
      const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
      results.push(JSON.parse(decoded));
      console.error(`[ui-probe] ${width}px measured`);
    }
  } finally {
    server.kill();
    if (!process.env.UI_PROBE_KEEP) await fs.rm(target, { recursive: true, force: true });
  }
  const report = {
    probedAt: new Date().toISOString(),
    browser: spawnSync(binary, ['--version'], { encoding: 'utf8' }).stdout?.trim() || 'unknown',
    substitution: 'requestAnimationFrame is backed by a timer: this browser emits one frame and stops. Everything else is the shipped build.',
    notVerified: ['real animation frames', 'real iPhone or Safari', 'VoiceOver', 'user testing'],
    widths: results
  };
  await fs.writeFile(path.join(OUT, 'probe.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  probe().then(report => {
    for (const r of report.widths) {
      const ok = r.overflow.scrollWidth <= r.overflow.innerWidth + 1 ? 'no overflow' : 'OVERFLOW';
      console.log(`${String(r.width).padStart(5)}px  ${ok}  hit-areas under 44px: ${r.hitAreas.under44}/${r.hitAreas.interactive}  focusable ${r.focusable}  FAQ ${r.faq.answersWithText}/${r.faq.count}`);
    }
    console.log(`\nWrote artifacts/ui/probe.json (${report.browser}).`);
  }).catch(error => { console.error(`[ui-probe] ${error.message}`); process.exitCode = 1; });
}
