import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {products} from '../src/products.mjs';
import {oathraExperienceFilm} from '../src/oathra-experience-films.mjs';
import {serveOwnedRecording} from '../src/owned-recording-response.mjs';

const oathra = products.find(p => p.id === 'oathra');
test('localized introduction is visible without JS, with a transcript and working language/demo links', async () => {
  for (const lang of ['ja', 'en']) {
    const html = await fs.readFile(new URL(`../dist/${lang === 'en' ? 'en/' : ''}products/oathra/index.html`, import.meta.url), 'utf8');
    const section = oathraExperienceFilm(oathra, lang), film = oathra.experienceFilms[lang];
    assert.ok(html.includes(section), 'the final page includes the complete introduction');
    assert.match(html, /href="#experience-film"/);
    assert.ok(section.includes(`poster="${film.poster}"`));
    assert.ok(section.includes(`<source src="${film.src}" type="video/mp4">`));
    assert.ok(section.includes(film.notice));
    assert.ok(section.includes(film.transcript));
    assert.match(section, /<video controls playsinline preload="none"/);
    assert.doesNotMatch(section, /autoplay|<script|<iframe|<form|tel:/);
    assert.match(section, /href="\/media\/films\/oathra-voiced-v3-credits.txt"/);
    assert.match(section, lang === 'ja' ? /href="\/en\/products\/oathra\/#experience-film" lang="en" hreflang="en"/ : /href="\/products\/oathra\/#experience-film" lang="ja" hreflang="ja"/);
    assert.match(section, lang === 'ja' ? /href="#concept-demos"/ : /href="\/products\/oathra\/#concept-demos"/);
    if (lang === 'ja') for (const demo of oathra.conceptDemos) {
      assert.ok(html.includes(`href="${demo.href}"`));
      assert.ok(html.includes(`<source src="${demo.src}" type="video/mp4">`));
    }
  }
  assert.equal(oathraExperienceFilm(products[0], 'ja'), '');
  assert.throws(() => oathraExperienceFilm(oathra, 'fr'), /missing language/);
});

test('both narrated films keep the Worker bounded Range/HEAD contract', async () => {
  const data = new Uint8Array(Array.from({length:100}, (_, i) => i));
  for (const film of Object.values(oathra.experienceFilms)) {
    const assets = {fetch:async request => {
      assert.equal(new URL(request.url).pathname, film.src);
      return new Response(request.method === 'HEAD' ? null : data, {headers:{'content-type':'video/mp4','content-length':'100'}});
    }};
    const url = 'https://reachmade.com' + film.src;
    const range = await serveOwnedRecording(new Request(url, {headers:{Range:'bytes=10-19'}}), assets);
    assert.equal(range.status, 206);
    assert.equal(range.headers.get('content-type'), 'video/mp4');
    assert.equal(range.headers.get('content-range'), 'bytes 10-19/100');
    assert.deepEqual(new Uint8Array(await range.arrayBuffer()), data.slice(10,20));
    const head = await serveOwnedRecording(new Request(url, {method:'HEAD'}), assets);
    assert.equal(head.status, 200);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal((await serveOwnedRecording(new Request(url, {headers:{Range:'bytes=100-'}}), assets)).status, 416);
  }
});
