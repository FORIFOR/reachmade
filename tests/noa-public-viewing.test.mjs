import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {noaVideos} from '../src/noa-videos.mjs';

const read = route => fs.readFile(new URL(`../dist/${route}index.html`, import.meta.url), 'utf8');

test('Noa JA/EN first action opens an actual stream edit before the recreated film', async () => {
  for (const prefix of ['', 'en/']) {
    const html = await read(prefix + 'products/noa/');
    const hero = html.match(/<section class="rd-phero">[\s\S]*?<\/section>/)?.[0];
    assert.ok(hero);
    const firstAction = hero.match(/<a class="rd-btn rd-btn--ink"[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(firstAction?.includes(`href="${noaVideos.liveEdit}"`));
    assert.match(firstAction, prefix ? /Watch gameplay \(4:12\)/ : /実況を見る（4分12秒）/);
    // One action in the first view (2026-10-19); the viewing list follows directly after it.
    assert.ok(html.indexOf('id="noa-viewing"') - html.indexOf('</section>', html.indexOf('<section class="rd-outcome"')) < 200);
    assert.doesNotMatch(hero, /href="[^\"]*contact/);
    assert.ok(html.indexOf('id="noa-viewing"') < html.indexOf('id="film"'));
    assert.match(html, new RegExp(`href="/${prefix}contact/#product-noa"`));
    assert.match(html, prefix ? /recreated screens/ : /無音・画面は再現/);
    assert.doesNotMatch(html, /<iframe|youtube\.com\/embed\//);
  }
});

test('Noa choices distinguish short, edited footage and the resumed archive without stale claims', async () => {
  for (const prefix of ['', 'en/']) {
    const html = await read(prefix + 'products/noa/');
    const viewing = html.match(/<section class="rd-noa-viewing"[\s\S]*?<\/section>/)?.[0];
    assert.ok(viewing);
    for (const id of ['5PdIxtbHsJ0', 'jyWm8zfy1q4', 'mWGPfLFQsYU']) assert.ok(viewing.includes(id));
    assert.match(viewing, /4:12/);
    assert.match(viewing, /4:08:22/);
    assert.match(viewing, prefix ? /~22 SEC.*SHORT/ : /約22秒.*SHORT/);
    assert.match(viewing, prefix ? /resumed after an interruption/ : /中断後に再開した配信/);
    assert.match(viewing, prefix ? /does not establish uninterrupted operation/ : /無停止の運転を示すものではありません/);
    assert.match(html, /<meta name="description" content="[^\"]*(?:公開ゲーム実況|public videos)/);
    assert.match(html, /hreflang="ja" href="https:\/\/reachmade.com\/products\/noa\/"/);
    assert.match(html, /hreflang="en" href="https:\/\/reachmade.com\/en\/products\/noa\/"/);
    for (const route of ['products/noa/', 'products/', 'work/']) {
      const page = await read(prefix + route);
      assert.doesNotMatch(page, /個別の動画リンクは準備中|実録画は未公開|実録画は、まだ公開|A recording of a full live run has not been published/);
    }
  }
});
