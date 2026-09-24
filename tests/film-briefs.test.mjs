import test from 'node:test';
import assert from 'node:assert/strict';
import { FILM_SYSTEM_VERSION, filmFormats, filmRules, productFilmBriefs } from '../src/film-briefs.mjs';

const ids = ['genie','ai-meeting','oathra','aisecure','agent-team','launchloom'];

test('film system is explicit about real UI and normal playback speed', () => {
  assert.equal(FILM_SYSTEM_VERSION, '2026-09-25');
  assert.equal(filmRules.productPixels, 'real-capture-only');
  assert.equal(filmRules.playbackRate, 1);
  assert.equal(filmRules.syntheticProductScreens, false);
});

test('every product has a 55-second master story and a hero loop', () => {
  assert.deepEqual(Object.keys(productFilmBriefs), ids);
  for (const id of ids) {
    const brief = productFilmBriefs[id];
    assert.ok(brief.promise.ja && brief.promise.en);
    assert.ok(brief.signatureMoment.ja && brief.signatureMoment.en);
    assert.ok(brief.heroLoop.length >= 3);
    assert.ok(brief.productFilm.length >= 6);
    assert.equal(brief.productFilm[0].from, 0);
    assert.equal(brief.productFilm.at(-1).to, filmFormats.productFilm.targetSeconds);
    for (const shots of [brief.heroLoop, brief.productFilm]) {
      for (let i = 0; i < shots.length; i++) {
        assert.ok(shots[i].to > shots[i].from, `${id}: shot must have positive duration`);
        if (i) assert.equal(shots[i].from, shots[i - 1].to, `${id}: shots must be contiguous`);
      }
    }
  }
});
