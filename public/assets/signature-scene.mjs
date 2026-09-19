/**
 * Signature scenes: a composed sequence of DOM states, not a video file.
 *
 * A scene is authored at build time as ordinary markup. Every step is present in
 * the HTML, so the whole story is readable with JavaScript turned off — the
 * engine only decides which step is "current" and lets CSS do the motion.
 *
 * This is not a second product-sample engine. It never simulates a model call,
 * never reads a microphone, never stores anything and never touches the network.
 * `animated-demos.mjs` keeps owning the per-product UI story inside the films.
 */
export const SCENE_VERSION = '20260919-signature-1';
const STEP_MS = 1500;
const HOLD_MS = 2600;

const media = (win, query) => (typeof win.matchMedia === 'function' ? win.matchMedia(query) : null);

export function sceneTimeline(count, { step = STEP_MS, hold = HOLD_MS } = {}) {
  if (!Number.isInteger(count) || count < 2 || count > 12) throw new TypeError('A scene needs between two and twelve steps');
  return { count, step, hold, duration: count * step + hold };
}

export function stateAt(elapsed, timeline) {
  if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
  return Math.min(timeline.count - 1, Math.floor((elapsed % timeline.duration) / timeline.step));
}

/** Viewport progress of an element, 0 before it is read and 1 once it is past. */
export function scrollProgress(rect, viewport) {
  if (!Number.isFinite(viewport) || viewport <= 0) return 0;
  const travel = rect.height + viewport;
  if (travel <= 0) return 0;
  return Math.min(1, Math.max(0, (viewport - rect.top) / travel));
}

export function mountScene(root, { win = window, doc = document } = {}) {
  if (!root || root.dataset.sceneVersion === SCENE_VERSION) return null;
  const steps = [...root.querySelectorAll('[data-step]')];
  if (steps.length < 2) return null;
  const timeline = sceneTimeline(steps.length);
  const scrollDriven = root.hasAttribute('data-scene-scroll');
  const controls = root.querySelector('[data-scene-controls]');
  const toggle = controls?.querySelector('[data-scene-toggle]');
  const dots = controls?.querySelector('[data-scene-dots]');
  const abort = new AbortController();
  const on = (target, type, handler) => target?.addEventListener(type, handler, { signal: abort.signal });

  const motion = media(win, '(prefers-reduced-motion: reduce)');
  const connection = win.navigator?.connection;
  const quiet = () => motion?.matches === true || connection?.saveData === true;

  let state = -1, elapsed = 0, previous = null, raf = 0, visible = false, paused = false, manual = false, dead = false;
  const running = () => !dead && !paused && !quiet() && visible && !doc.hidden && !scrollDriven;

  function paint(next) {
    const value = Math.min(timeline.count - 1, Math.max(0, next));
    if (value === state) return;
    state = value;
    root.dataset.state = String(state);
    steps.forEach((node, index) => {
      node.dataset.stepState = index < state ? 'done' : index === state ? 'current' : 'waiting';
    });
    if (dots) for (const dot of dots.querySelectorAll('button')) dot.setAttribute('aria-pressed', String(Number(dot.dataset.sceneStep) === state));
  }

  function stop() { if (raf) win.cancelAnimationFrame(raf); raf = 0; previous = null; }

  function syncToggle() {
    if (!toggle) return;
    const active = running();
    toggle.setAttribute('aria-pressed', String(active));
    toggle.dataset.scenePlaying = String(active);
    toggle.textContent = toggle.dataset[active ? 'labelPause' : 'labelPlay'] || (active ? 'Pause' : 'Play');
  }

  function frame(now) {
    raf = 0;
    if (!running()) { if (quiet()) paint(timeline.count - 1); stop(); syncToggle(); return; }
    if (previous !== null) elapsed = (elapsed + Math.min(120, Math.max(0, now - previous))) % timeline.duration;
    previous = now;
    paint(stateAt(elapsed, timeline));
    raf = win.requestAnimationFrame(frame);
  }

  function reconcile() {
    stop(); syncToggle();
    if (quiet()) { paint(timeline.count - 1); return; }
    if (running()) raf = win.requestAnimationFrame(frame);
  }

  function fromScroll() {
    if (!scrollDriven || dead || manual) return;
    if (quiet()) { paint(timeline.count - 1); return; }
    const progress = scrollProgress(root.getBoundingClientRect(), win.innerHeight || 0);
    paint(Math.round(progress * (timeline.count - 1)));
  }

  if (controls) {
    controls.hidden = false;
    on(toggle, 'click', () => {
      manual = true;
      if (scrollDriven) { root.removeAttribute('data-scene-scroll'); }
      paused = running();
      reconcile();
    });
    on(dots, 'click', event => {
      const button = event.target.closest('button[data-scene-step]');
      if (!button) return;
      manual = true; paused = true;
      elapsed = Number(button.dataset.sceneStep) * timeline.step;
      paint(Number(button.dataset.sceneStep));
      reconcile();
    });
  }

  const observer = 'IntersectionObserver' in win
    ? new win.IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); reconcile(); }, { threshold: [0, 0.25] })
    : null;
  if (observer) observer.observe(root); else visible = true;

  on(doc, 'visibilitychange', reconcile);
  on(win, 'pagehide', () => { visible = false; reconcile(); });
  on(win, 'pageshow', () => { visible = true; reconcile(); });
  on(motion, 'change', reconcile);
  if (scrollDriven) {
    on(win, 'scroll', () => { if (!raf) raf = win.requestAnimationFrame(() => { raf = 0; fromScroll(); }); });
    on(win, 'resize', fromScroll);
  }

  root.dataset.sceneVersion = SCENE_VERSION;
  paint(quiet() ? timeline.count - 1 : 0);
  if (scrollDriven) fromScroll();
  reconcile();

  return {
    timeline,
    state: () => ({ state, elapsed, paused, running: running(), scrollDriven }),
    destroy() {
      dead = true; stop(); abort.abort(); observer?.disconnect();
      delete root.dataset.sceneVersion; delete root.dataset.state;
      if (controls) controls.hidden = true;
    }
  };
}

export function initScenes(doc = document, win = window) {
  return [...doc.querySelectorAll('[data-signature-scene]')].map(root => mountScene(root, { doc, win })).filter(Boolean);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initScenes(), { once: true });
  else initScenes();
}
