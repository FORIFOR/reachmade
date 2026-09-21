/**
 * Signature scenes, composed at build time.
 *
 * The opening is a sequence of DOM states rather than a film: the layers are
 * separate elements, the steps are ordinary markup, and the browser animates
 * between them. Nothing here is a video frame, so it stays sharp at every width
 * and every step remains readable with JavaScript off.
 *
 * Honesty rules that shape the copy below:
 * - The six products are separate tools. The scene shows one job moving through
 *   them in sequence and says so; it never implies one automated pipeline.
 * - No step claims a run, a saved record or a published post. The label on every
 *   scene says it is an illustrative UI with fictional data.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {esc} from '../public/assets/lab-core.mjs';

export const SCENE_VERSION = '20260919-signature-1';
const MARK = '/* REACHMADE_SIGNATURE_SCENE */';
const LOCALES = ['ja', 'en'];
const check = lang => { if (!LOCALES.includes(lang)) throw new TypeError('Unsupported locale'); };
const base = lang => (lang === 'ja' ? '' : '/en');
const route = (lang, id) => `${base(lang)}/products/${id}/`;

/** One request, moving through three of the six tools. Sequence, not automation. */
const CHAIN = {
  ja: {
    kicker: '3つの道具の使い分け例',
    label: '打ち合わせから公開用素材を作るときの、3製品の役割',
    note: '説明のための再現UI・架空のデータです。製品ごとに準備・操作が必要です。自動で連携する単一のパイプラインではありません。ここで実行・保存・投稿は行いません。',
    play: '再生', pause: '停止',
    steps: [
      {mark: '選択', name: '必要な道具を選ぶ', line: '整理・制作・紹介。目的に合う製品を選んで使います。', tone: 'idle'},
      {mark: '目的', name: 'たとえば、こんな仕事', line: '「打ち合わせで決めた内容を形にして、紹介する素材を作りたい。」', tone: 'request'},
      {mark: '整理', name: 'AI Meeting', line: '打ち合わせで決めたことを確認し、やることを整理する。', id: 'ai-meeting', tone: 'work'},
      {mark: '制作', name: 'Agent Team', line: '制作・レビュー・修正を、それぞれの担当に分けて進める。', id: 'agent-team', tone: 'work'},
      {mark: '紹介', name: 'Launchloom', line: 'アプリの操作録画から、紹介動画・紹介ページ・投稿文の案を作る。', id: 'launchloom', tone: 'work'},
      {mark: '成果', name: 'この仕事で目指すもの', line: 'やることの一覧、制作した成果物、公開前に確認できる紹介素材。', tone: 'result'}
    ]
  },
  en: {
    kicker: 'THREE TOOLS. THREE ROLES.',
    label: 'Three product roles: from meeting decisions to launch material',
    note: 'Illustrative UI with fictional data. Each product requires its own setup and operation; this is not one automated pipeline. Nothing is executed, stored or published here.',
    play: 'Play', pause: 'Pause',
    steps: [
      {mark: 'USE', name: 'Choose the tool you need', line: 'Organize, create or introduce your work. Pick a product for your task.', tone: 'idle'},
      {mark: 'AIM', name: 'For example', line: '“Build what we agreed in the meeting, then prepare material to introduce it.”', tone: 'request'},
      {mark: '01', name: 'AI Meeting', line: 'Review meeting decisions and organize the tasks.', id: 'ai-meeting', tone: 'work'},
      {mark: '02', name: 'Agent Team', line: 'Assign creation, review and revision to separate roles.', id: 'agent-team', tone: 'work'},
      {mark: '03', name: 'Launchloom', line: 'Use an app recording to draft a video, a landing page and social posts.', id: 'launchloom', tone: 'work'},
      {mark: 'END', name: 'What you are working toward', line: 'A task list, completed work and promotional drafts to review before publishing.', tone: 'result'}
    ]
  }
};

function controls(copy) {
  const dots = CHAIN.ja.steps.map((_, index) => `<button type="button" data-scene-step="${index}" aria-pressed="false">${String(index).padStart(2, '0')}</button>`).join('');
  return `<div class="sig-controls" data-scene-controls hidden><button type="button" class="sig-toggle" data-scene-toggle data-label-play="${esc(copy.play)}" data-label-pause="${esc(copy.pause)}" aria-pressed="false">${esc(copy.play)}</button><div class="sig-dots" data-scene-dots aria-label="${esc(copy.label)}">${dots}</div></div>`;
}

export function renderChainScene(lang) {
  check(lang);
  const copy = CHAIN[lang];
  const steps = copy.steps.map((step, index) => {
    const name = step.id ? `<a href="${route(lang, step.id)}">${esc(step.name)} <span aria-hidden="true">↗</span></a>` : esc(step.name);
    return `<li class="sig-step" data-step="${index}" data-tone="${step.tone}" data-step-state="${index === 0 ? 'current' : 'waiting'}"><span class="sig-mark">${esc(step.mark)}</span><span class="sig-body"><strong>${name}</strong><span>${esc(step.line)}</span></span></li>`;
  }).join('');
  return `<div class="sig-scene" data-signature-scene="chain" data-state="0" role="group" aria-label="${esc(copy.label)}"><div class="sig-field" aria-hidden="true"><span class="sig-orb"></span><span class="sig-trace"></span></div><p class="sig-kicker">${esc(copy.kicker)}</p><ol class="sig-steps">${steps}</ol>${controls(copy)}<p class="sig-note">${esc(copy.note)}</p></div>`;
}

/** Duplicated track, the second copy hidden from assistive technology. */
export function renderMarquee(products, lang) {
  check(lang);
  if (!Array.isArray(products) || products.length < 2) throw new TypeError('Expected the product ledger');
  const ja = lang === 'ja';
  const items = products.map(p => `<li><b>${esc(p.name)}</b><span>${esc(p[lang].outcome)}</span></li>`).join('');
  const heading = ja ? '入力と、残るもの' : 'What goes in. What stays.';
  return `<section class="sig-marquee" aria-label="${esc(heading)}"><div class="sig-marquee-track"><ul class="sig-marquee-list">${items}</ul><ul class="sig-marquee-list" aria-hidden="true">${items}</ul></div></section>`;
}

export async function writeSignatureScenes(dist, products) {
  if (!Array.isArray(products) || products.length < 1) throw new TypeError('Expected the product ledger');
  const pages = [];
  let scene = false, marquee = false;
  for (const lang of LOCALES) {
    const prefix = lang === 'ja' ? '' : 'en';
    const home = path.join(dist, prefix, 'index.html');
    const html = await fs.readFile(home, 'utf8');
    const mounted = html.includes('data-signature-scene="chain"');
    if (!mounted && !html.includes('data-home-task-picker')) throw new Error('The final home pass must compose the signature scene or the task picker first');
    scene ||= mounted;
    marquee ||= html.includes('class="sig-marquee"');
    if (mounted && !html.includes(`data-signature-scene-version="${SCENE_VERSION}"`)) pages.push([home, html.replace('<body ', `<body data-signature-scene-version="${SCENE_VERSION}" `)]);
  }
  const assets = path.join(dist, 'assets');
  const files = ['showcase.css', 'showcase.mjs', 'signature-scene.css', 'signature-marquee.css', 'signature-scene.mjs'];
  const [css, js, sceneCss, marqueeCss, client] = await Promise.all(files.map(file => fs.readFile(path.join(assets, file), 'utf8')));
  // Both parts are validated whichever is mounted, so a stale asset fails the build
  // instead of waiting until something starts using it again.
  if (!sceneCss.includes('.sig-scene') || !client.includes(SCENE_VERSION)) throw new Error('Signature scene assets are missing or stale');
  if (!marqueeCss.includes('.sig-marquee')) throw new Error('Marquee stylesheet is missing or stale');
  if (!scene && !marquee) throw new Error('Neither the scene nor the marquee is composed; the layer would ship unused rules');
  for (const [file, html] of pages) await fs.writeFile(file, html);
  // Ship only what a page actually mounts. The marquee is CSS-only, so a home built
  // without the scene should not pay for its rules or fetch its module at all.
  const layer = [scene ? sceneCss : '', marquee ? marqueeCss : ''].filter(Boolean).join('\n');
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(MARK)[0].trimEnd() + `\n${MARK}\n${layer}`);
  const mount = scene ? `\nimport('./signature-scene.mjs').catch(() => { document.documentElement.dataset.sceneState = 'unavailable'; });\n` : '\n';
  await fs.writeFile(path.join(assets, 'showcase.mjs'), js.split(MARK)[0].trimEnd() + `\n${MARK}${mount}`);
}
