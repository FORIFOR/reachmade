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
import {esc} from '../public/assets/lab-explorer.mjs';

export const SCENE_VERSION = '20260919-signature-1';
const MARK = '/* REACHMADE_SIGNATURE_SCENE */';
const LOCALES = ['ja', 'en'];
const check = lang => { if (!LOCALES.includes(lang)) throw new TypeError('Unsupported locale'); };
const base = lang => (lang === 'ja' ? '' : '/en');
const route = (lang, id) => `${base(lang)}/products/${id}/`;

/** One request, moving through three of the six tools. Sequence, not automation. */
const CHAIN = {
  ja: {
    kicker: 'ONE JOB. SIX TOOLS.',
    label: '一つの仕事が、道具を渡り歩く様子の再現',
    note: '説明のための再現UI・架空のデータです。6つは独立した製品で、自動で連携する単一のパイプラインではありません。ここで実行・保存・投稿は行いません。',
    play: '再生', pause: '停止',
    steps: [
      {mark: '00', name: 'Reachmade Lab', line: '6つの道具が、待っている。', tone: 'idle'},
      {mark: '01', name: 'あなた', line: '「打ち合わせの内容から、公開用の素材まで作りたい。」', tone: 'request'},
      {mark: '02', name: 'AI Meeting', line: '話したことを、確認してからタスクに。', id: 'ai-meeting', tone: 'work'},
      {mark: '03', name: 'Agent Team', line: 'つくる・たしかめる・なおすを、分けて進める。', id: 'agent-team', tone: 'work'},
      {mark: '04', name: 'Launchloom', line: '操作録画から、映像・LP・投稿案へ。', id: 'launchloom', tone: 'work'},
      {mark: '05', name: '手元に残るもの', line: '確認済みのタスク / 経緯の残る成果物 / 公開前の素材。', tone: 'result'}
    ]
  },
  en: {
    kicker: 'ONE JOB. SIX TOOLS.',
    label: 'An illustration of one job moving between tools',
    note: 'Illustrative UI with fictional data. The six are separate products used in sequence, not one automated pipeline. Nothing is executed, stored or published here.',
    play: 'Play', pause: 'Pause',
    steps: [
      {mark: '00', name: 'Reachmade Lab', line: 'Six tools, waiting.', tone: 'idle'},
      {mark: '01', name: 'You', line: '“Turn what we discussed into something we can publish.”', tone: 'request'},
      {mark: '02', name: 'AI Meeting', line: 'A conversation becomes tasks you confirmed.', id: 'ai-meeting', tone: 'work'},
      {mark: '03', name: 'Agent Team', line: 'Draft, review and revise, kept apart.', id: 'agent-team', tone: 'work'},
      {mark: '04', name: 'Launchloom', line: 'One recording becomes film, page and posts.', id: 'launchloom', tone: 'work'},
      {mark: '05', name: 'What stays with you', line: 'Confirmed tasks / artifacts with a trail / launch material.', tone: 'result'}
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
  for (const lang of LOCALES) {
    const prefix = lang === 'ja' ? '' : 'en';
    const home = path.join(dist, prefix, 'index.html');
    const html = await fs.readFile(home, 'utf8');
    if (!html.includes('data-signature-scene="chain"')) throw new Error('The final home pass must compose the signature scene first');
    if (!html.includes(`data-signature-scene-version="${SCENE_VERSION}"`)) pages.push([home, html.replace('<body ', `<body data-signature-scene-version="${SCENE_VERSION}" `)]);
  }
  const assets = path.join(dist, 'assets');
  const [css, js, extra, client] = await Promise.all(['showcase.css', 'showcase.mjs', 'signature-scene.css', 'signature-scene.mjs'].map(file => fs.readFile(path.join(assets, file), 'utf8')));
  if (!extra.includes('.sig-scene') || !client.includes(SCENE_VERSION)) throw new Error('Signature scene assets are missing or stale');
  for (const [file, html] of pages) await fs.writeFile(file, html);
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(MARK)[0].trimEnd() + `\n${MARK}\n${extra}`);
  await fs.writeFile(path.join(assets, 'showcase.mjs'), js.split(MARK)[0].trimEnd() + `\n${MARK}\nimport('./signature-scene.mjs').catch(() => { document.documentElement.dataset.sceneState = 'unavailable'; });\n`);
}
