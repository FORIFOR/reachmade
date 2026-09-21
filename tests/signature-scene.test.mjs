import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {SCENE_VERSION, sceneTimeline, stateAt, scrollProgress, mountScene} from '../public/assets/signature-scene.mjs';
import {renderChainScene, renderMarquee, writeSignatureScenes} from '../src/signature-scene.mjs';
import {products} from '../src/products.mjs';

/* A scene is only ever a sequence of DOM states, so a small stand-in for the
   parts of the DOM the engine touches is enough to test it honestly. */
class FakeNode {
  constructor(attrs = {}) { this.dataset = {...attrs}; this.children = []; this.attributes = {}; this.hidden = false; this.textContent = ''; this.rect = {top: 0, height: 100}; }
  add(node) { this.children.push(node); return node; }
  all() { return this.children.flatMap(child => [child, ...child.all()]); }
  querySelectorAll(selector) { return this.all().filter(node => node.matches(selector)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  matches(selector) {
    if (selector === '[data-step]') return 'step' in this.dataset;
    if (selector === '[data-scene-controls]') return 'sceneControls' in this.dataset;
    if (selector === '[data-scene-toggle]') return 'sceneToggle' in this.dataset;
    if (selector === '[data-scene-dots]') return 'sceneDots' in this.dataset;
    if (selector === 'button') return this.tag === 'button';
    if (selector === 'button[data-scene-step]') return this.tag === 'button' && 'sceneStep' in this.dataset;
    return false;
  }
  hasAttribute(name) { return name in this.attributes; }
  removeAttribute(name) { delete this.attributes[name]; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  getBoundingClientRect() { return this.rect; }
  addEventListener(type, handler) { (this.listeners ??= {})[type] = handler; }
  fire(type, event = {}) { this.listeners?.[type]?.(event); }
}

function harness({steps = 4, reduced = false, scroll = false} = {}) {
  const root = new FakeNode();
  if (scroll) root.setAttribute('data-scene-scroll', '');
  for (let i = 0; i < steps; i += 1) root.add(new FakeNode({step: String(i)}));
  const controls = root.add(new FakeNode({sceneControls: ''}));
  controls.hidden = true;
  const toggle = controls.add(new FakeNode({sceneToggle: '', labelPlay: 'Play', labelPause: 'Pause'}));
  toggle.tag = 'button';
  const dots = controls.add(new FakeNode({sceneDots: ''}));
  for (let i = 0; i < steps; i += 1) { const dot = dots.add(new FakeNode({sceneStep: String(i)})); dot.tag = 'button'; }
  const frames = [];
  const win = {
    innerHeight: 800,
    matchMedia: () => ({matches: reduced, addEventListener() {}}),
    navigator: {},
    requestAnimationFrame(fn) { frames.push(fn); return frames.length; },
    cancelAnimationFrame() {},
    listeners: {},
    addEventListener(type, handler) { this.listeners[type] = handler; },
    IntersectionObserver: class { constructor(fn) { this.fn = fn; } observe() { this.fn([{isIntersecting: true}]); } disconnect() {} }
  };
  const doc = {hidden: false, addEventListener() {}};
  const scene = mountScene(root, {win, doc});
  // The engine caps each frame delta so a backgrounded tab cannot skip the scene.
  // Pumping realistic frames is therefore part of the contract being tested.
  let clock = 0;
  const advance = ms => {
    for (let spent = 0; spent < ms; spent += 16) {
      const fn = frames.pop(); frames.length = 0;
      clock += 16; fn?.(clock);
    }
  };
  return {root, controls, toggle, dots, scene, advance, win};
}

test('a scene timeline needs a sane number of steps', () => {
  for (const count of [0, 1, 13, 2.5, '4']) assert.throws(() => sceneTimeline(count), TypeError);
  const timeline = sceneTimeline(6);
  assert.equal(timeline.count, 6);
  assert.ok(timeline.duration > timeline.count * timeline.step, 'the last step must be held before looping');
});

test('the step for a moment in time is stable and never leaves the scene', () => {
  const timeline = sceneTimeline(4);
  assert.equal(stateAt(0, timeline), 0);
  assert.equal(stateAt(timeline.step - 1, timeline), 0);
  assert.equal(stateAt(timeline.step, timeline), 1);
  assert.equal(stateAt(timeline.step * 3.5, timeline), 3);
  assert.equal(stateAt(timeline.duration - 1, timeline), 3, 'the hold keeps the last step');
  assert.equal(stateAt(timeline.duration, timeline), 0, 'then it loops');
  for (const bad of [NaN, -1, Infinity]) assert.equal(stateAt(bad, timeline), 0);
});

test('scroll progress is clamped to the readable range', () => {
  assert.equal(scrollProgress({top: 900, height: 200}, 800), 0);
  assert.equal(scrollProgress({top: -400, height: 200}, 800), 1);
  assert.ok(scrollProgress({top: 400, height: 200}, 800) > 0);
  assert.equal(scrollProgress({top: 0, height: 100}, 0), 0);
});

test('the engine starts at the first step, advances, and exposes real controls', () => {
  const {root, controls, toggle, dots, scene, advance} = harness({steps: 4});
  assert.equal(root.dataset.state, '0');
  assert.equal(root.dataset.sceneVersion, SCENE_VERSION);
  assert.equal(controls.hidden, false, 'controls are only offered once the engine runs');
  assert.equal(toggle.textContent, 'Pause');
  advance(scene.timeline.step + 40);
  assert.equal(root.dataset.state, '1');
  assert.equal(root.querySelectorAll('[data-step]')[0].dataset.stepState, 'done');
  assert.equal(root.querySelectorAll('[data-step]')[1].dataset.stepState, 'current');
  assert.equal(root.querySelectorAll('[data-step]')[2].dataset.stepState, 'waiting');
  assert.equal(dots.children[1].getAttribute('aria-pressed'), 'true');
});

test('choosing a step pauses the scene on it, and mounting twice is refused', () => {
  const {root, dots, scene} = harness({steps: 4});
  dots.fire('click', {target: {closest: () => dots.children[2]}});
  assert.equal(root.dataset.state, '2');
  assert.equal(scene.state().paused, true);
  assert.equal(mountScene(root, {win: {}, doc: {}}), null);
});

test('reduced motion shows the finished scene instead of animating it', () => {
  const {root, toggle, scene} = harness({steps: 5, reduced: true});
  assert.equal(root.dataset.state, '4');
  assert.equal(scene.state().running, false);
  assert.equal(toggle.textContent, 'Play');
});

test('a scroll-driven scene follows the reader instead of its own clock', () => {
  const {root, scene, win, advance} = harness({steps: 4, scroll: true});
  assert.equal(scene.state().scrollDriven, true);
  assert.equal(scene.state().running, false, 'the reader is the playhead, so no timer runs');
  root.rect = {top: 900, height: 200};
  win.listeners.scroll?.();
  advance(32);
  assert.equal(root.dataset.state, '0', 'below the fold the scene waits');
  root.rect = {top: -400, height: 200};
  win.listeners.scroll?.();
  advance(32);
  assert.equal(root.dataset.state, '3', 'scrolled past, the scene is complete');
});

test('destroying a scene leaves the markup as the build wrote it', () => {
  const {root, controls, scene} = harness({steps: 3});
  scene.destroy();
  assert.equal(root.dataset.sceneVersion, undefined);
  assert.equal(root.dataset.state, undefined);
  assert.equal(controls.hidden, true);
});

for (const lang of ['ja', 'en']) {
  test(`chain/${lang}: six states, real links and no claimed execution`, () => {
    const html = renderChainScene(lang);
    assert.equal((html.match(/data-step="/g) || []).length, 6);
    assert.equal((html.match(/data-step-state="current"/g) || []).length, 1, 'the no-script state is the opening step');
    assert.match(html, /data-scene-controls hidden/);
    for (const id of ['ai-meeting', 'agent-team', 'launchloom']) assert.ok(html.includes(`${lang === 'ja' ? '' : '/en'}/products/${id}/`));
    assert.match(html, lang === 'ja' ? /自動で連携する単一のパイプラインではありません/ : /not one automated pipeline/);
    assert.match(html, lang === 'ja' ? /実行・保存・投稿は行いません/ : /Nothing is executed, stored or published/);
    assert.doesNotMatch(html, /<script|<iframe|<video|onclick=|\bautoplay\b/);
  });

  test(`marquee/${lang}: one visible track and one copy hidden from assistive tech`, () => {
    const html = renderMarquee(products, lang);
    assert.equal((html.match(/class="sig-marquee-list"/g) || []).length, 2);
    assert.equal((html.match(/aria-hidden="true"/g) || []).length, 1);
    for (const p of products) assert.equal((html.match(new RegExp(`<b>${p.name}</b>`, 'g')) || []).length, 2);
    assert.ok(html.includes(products[0][lang].outcome));
  });


}

test('unsupported locales and shells fail closed', () => {
  for (const lang of ['de', 'constructor', '__proto__']) {
    assert.throws(() => renderChainScene(lang), TypeError);
    assert.throws(() => renderMarquee(products, lang), TypeError);
  }
  assert.throws(() => renderMarquee([], 'ja'), TypeError);
});

test('build integration appends one layer, repeats cleanly and needs the scene present', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-scene-'));
  const home = lang => `<html lang="${lang}"><body data-outcome-first="x">${renderChainScene(lang)}</body></html>`;
  try {
    await fs.mkdir(path.join(tmp, 'assets'), {recursive: true});
    await fs.mkdir(path.join(tmp, 'en'), {recursive: true});
    for (const [prefix, lang] of [['', 'ja'], ['en', 'en']]) {
      await fs.writeFile(path.join(tmp, prefix, 'index.html'), home(lang));
    }
    await fs.writeFile(path.join(tmp, 'assets/showcase.css'), '/* earlier layers */');
    await fs.writeFile(path.join(tmp, 'assets/showcase.mjs'), '// earlier layers');
    for (const file of ['signature-scene.css', 'signature-marquee.css', 'signature-scene.mjs']) await fs.copyFile(new URL(`../public/assets/${file}`, import.meta.url), path.join(tmp, 'assets', file));
    await writeSignatureScenes(tmp, products);
    const first = await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8');
    await writeSignatureScenes(tmp, products);
    const second = await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8');
    assert.equal(first, second);
    assert.equal((second.match(/REACHMADE_SIGNATURE_SCENE/g) || []).length, 1);
    assert.match(await fs.readFile(path.join(tmp, 'assets/showcase.mjs'), 'utf8'), /import\('\.\/signature-scene\.mjs'\)/);
    await fs.writeFile(path.join(tmp, 'index.html'), '<html><body>no scene</body></html>');
    await assert.rejects(writeSignatureScenes(tmp, products), /must compose the signature scene/);
  } finally {
    await fs.rm(tmp, {recursive: true, force: true});
  }
});

/** An unmounted scene used to cost every page its stylesheet block and a module fetch. */
test('a home without the scene ships neither the scene rules nor its module', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-scene-'));
  const home = lang => `<html lang="${lang}"><body data-outcome-first="x"><nav data-home-task-picker></nav>${renderMarquee(products, lang)}</body></html>`;
  try {
    await fs.mkdir(path.join(tmp, 'assets'), {recursive: true});
    await fs.mkdir(path.join(tmp, 'en'), {recursive: true});
    for (const [prefix, lang] of [['', 'ja'], ['en', 'en']]) {
      await fs.writeFile(path.join(tmp, prefix, 'index.html'), home(lang));
    }
    await fs.writeFile(path.join(tmp, 'assets/showcase.css'), '/* earlier layers */');
    await fs.writeFile(path.join(tmp, 'assets/showcase.mjs'), '// earlier layers');
    for (const file of ['signature-scene.css', 'signature-marquee.css', 'signature-scene.mjs']) await fs.copyFile(new URL(`../public/assets/${file}`, import.meta.url), path.join(tmp, 'assets', file));
    await writeSignatureScenes(tmp, products);
    const css = await fs.readFile(path.join(tmp, 'assets/showcase.css'), 'utf8');
    const js = await fs.readFile(path.join(tmp, 'assets/showcase.mjs'), 'utf8');
    assert.match(css, /\.sig-marquee\{/, 'the band that is on the page keeps its rules');
    assert.doesNotMatch(css, /\.sig-scene/);
    assert.doesNotMatch(js, /signature-scene\.mjs/);
    // The body attribute belongs to a mounted scene, not to every home.
    assert.doesNotMatch(await fs.readFile(path.join(tmp, 'index.html'), 'utf8'), /data-signature-scene-version/);
    // A stale asset still fails the build even while nothing mounts it.
    await fs.writeFile(path.join(tmp, 'assets/signature-scene.css'), '/* emptied */');
    await assert.rejects(writeSignatureScenes(tmp, products), /missing or stale/);
  } finally {
    await fs.rm(tmp, {recursive: true, force: true});
  }
});

test('the signature pass leaves product pages alone', async () => {
  const source = await fs.readFile(new URL('../src/signature-scene.mjs', import.meta.url), 'utf8');
  // The product hero already carries the film story and the "what this demo shows"
  // flow. A third copy with its own play button made the page ambiguous, so this
  // pass only composes the home.
  assert.doesNotMatch(source, /sig-rail|refineProduct|ad-access-row/);
  const css = await fs.readFile(new URL('../public/assets/signature-scene.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /sig-rail/);
});

test('the client stays dependency-free, storage-free and respects visitor settings', async () => {
  const js = await fs.readFile(new URL('../public/assets/signature-scene.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|getUserMedia|document\.cookie|innerHTML/);
  assert.match(js, /prefers-reduced-motion/);
  assert.match(js, /saveData/);
  assert.match(js, /visibilitychange/);
  const css = await fs.readFile(new URL('../public/assets/signature-scene.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /url\(\s*['"]?https?:|@import|backdrop-filter/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
});
