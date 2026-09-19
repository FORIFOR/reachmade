import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {renderRecordedResult,renderOutcomeHero,addDirectStarts,DIRECT_STARTS} from '../src/outcome-first.mjs';
const root=path.resolve(import.meta.dirname,'..');
for(const lang of ['ja','en']){
 test(`real result/${lang}: original video, local saved artifact and captions are all available`,async()=>{
  const html=renderRecordedResult(lang);
  assert.equal((html.match(/<video\b/g)||[]).length,1);
  assert.match(html,/controls playsinline preload="none"/);
  assert.doesNotMatch(html,/\bautoplay\b|data-orbit-study|<iframe/);
  assert.match(html,new RegExp(`orbit-${lang}\\.vtt`));
  for(const file of ['genie/orbit.html','genie/assets/genie-orbit-web.mp4',`genie/assets/orbit-${lang}.vtt`]){
   assert.ok(html.includes('/media/originals/'+file));
   await fs.access(path.join(root,'public/media/originals',file));
  }
  // The recording is one file in both locales; only the poster caption is localized.
  const poster=lang==='ja'?'/media/originals/genie/assets/genie-orbit-poster.jpg':'/media/derived/genie/orbit-poster-en.jpg';
  assert.ok(html.includes(poster));
  await fs.access(path.join(root,'public',poster));
  if(lang==='en')assert.match(html,/The recording is in Japanese/);
  assert.match(html,lang==='ja'?/架空の入力.*待ち時間・操作を編集/:/Fictional inputs; actions and waiting are edited/);
 });
 test(`home/${lang}: the real recorded output is primary, not the optional hand-authored study`,()=>{
  const html=renderOutcomeHero(lang);
  assert.match(html,/data-outcome-recorded-result/);
  assert.doesNotMatch(html,/data-orbit-study|MEDIA PLACEHOLDER|orbit-study\.mjs/);
  assert.ok(html.indexOf('outcome-open-artifact')>html.indexOf('data-outcome-real-film'));
 });
 test(`secondary/${lang}: an actual artifact preview does not add another player`,()=>{
  const html=renderRecordedResult(lang,false);
  assert.doesNotMatch(html,/<video\b/);
  assert.match(html,/loading="lazy"/);
  assert.match(html,/href="\/media\/originals\/genie\/orbit\.html"/);
 });
}
test('direct entries reject prototype keys and repeated choices rather than claiming six distinct products',()=>{
 const keys=Object.keys(DIRECT_STARTS);
 const make=ids=>ids.map(id=>`<a data-studio-choice="${id}" href="/products/${id}/">product</a>`).join('')+'<a data-lab-detail href="/products/genie/">detail</a>';
 assert.throws(()=>addDirectStarts(make(['constructor',...keys.slice(1)]),'ja'),/Unknown/);
 assert.throws(()=>addDirectStarts(make(['genie','genie',...keys.slice(2)]),'ja'),/repeated/);
 assert.doesNotThrow(()=>addDirectStarts(make(keys),'ja'));
});
test('the localized poster stays traceable to the original frame',async()=>{
 const {createHash}=await import('node:crypto');
 const manifest=JSON.parse(await fs.readFile(path.join(root,'public/media/derived/manifest.json'),'utf8'));
 assert.equal(manifest.files.length,1);
 for(const entry of manifest.files){
  const bytes=await fs.readFile(path.join(root,'public',entry.path));
  assert.equal(bytes.length,entry.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,'derived file changed without regenerating the manifest');
  const source=await fs.readFile(path.join(root,'public',entry.source));
  assert.equal(createHash('sha256').update(source).digest('hex'),entry.sourceSha256,'the original frame this was derived from has changed');
  assert.match(entry.change,/Japanese caption/);
  await fs.access(path.join(root,entry.generator));
 }
});
