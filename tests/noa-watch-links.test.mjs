import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = route => fs.readFile(new URL(`../dist/${route}index.html`, import.meta.url), 'utf8');

test('Noa watch section opens verified individual videos with matching kinds', async () => {
  const html = await read('products/noa/');
  const watch = html.match(/<section[^>]*id="watch"[\s\S]*?<\/section>/)?.[0];
  assert.ok(watch, 'watch section exists');
  for (const id of ['A6eJSOnGj1Q', 'NtrGg4zRqQM', '3yosX4frOgM', 'OfRHH5nBHAI']) {
    assert.ok(watch.includes(`href="https://www.youtube.com/watch?v=${id}"`), `${id} is directly reachable`);
  }
  assert.doesNotMatch(watch, /準備中|nlp-watch__pending/);
  assert.match(watch, /4:08.*テスト収録.*編集版/);
  assert.match(watch, /5:49.*解説/);
  assert.match(watch, /0:34.*自己紹介/);
  assert.match(watch, /通し運転の実録画ではありません/);
  assert.match(html, /配信の通し運転を記録した実録画は、まだ公開していません/);
});

test('Noa JA and EN proof/demo paths distinguish an edited test from the intro film', async () => {
  for (const prefix of ['', 'en/']) {
    for (const route of ['products/noa/', 'products/', 'work/']) {
      const html = await read(prefix + route);
      assert.ok(html.includes('href="https://www.youtube.com/watch?v=A6eJSOnGj1Q"'), `${prefix}${route}: edited test`);
      assert.ok(html.includes('href="https://www.youtube.com/watch?v=NtrGg4zRqQM"'), `${prefix}${route}: explainer`);
      const explainerLinks = html.match(/<a\b[^>]*href="https:\/\/www\.youtube\.com\/watch\?v=NtrGg4zRqQM"[^>]*>[\s\S]*?<\/a>/g) || [];
      assert.ok(explainerLinks.length > 0);
      for (const link of explainerLinks) {
        assert.match(link, prefix ? /explainer/ : /解説/, `${prefix}${route}: label matches video`);
        assert.doesNotMatch(link, /YouTubeチャンネル|YouTube channel|検証資料|検証記録|evaluation record/);
      }
      assert.doesNotMatch(html, /Direct links to the explainer.*will be added once confirmed/);
      assert.match(html, prefix ? /not a recording of a live stream/ : /配信の実録画ではありません/);
    }
  }
});
