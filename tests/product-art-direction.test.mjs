import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {directions,artDirectProductHero,writeArtDirectionStyles} from '../src/product-art-direction.mjs';
const root=path.resolve(import.meta.dirname,'..');
const fixture=id=>`<!doctype html><html><head><title>Test</title></head><body class="owned-product owned-product--${id}"><main><section class="container owned-hero-grid"><p class="owned-kicker">Preview</p><h1>A real product</h1><p class="owned-lead">Description</p><div class="owned-actions"><a class="owned-primary" href="https://example.org/setup">Set up the product</a></div><p class="owned-action-note">Setup, not instant execution.</p><p class="owned-try-now"><span>Try first</span><strong>Make one thing.</strong></p><details class="owned-access"><summary>Conditions</summary><p class="owned-requirements">No guarantee.</p></details><figure class="owned-film owned-film--hero" id="recording"><div class="owned-film__screen"><img src="/assets/products/${id}.jpg" alt="Existing screenshot"><video controls muted playsinline preload="none" data-recording-src="/media/products/${id}.mp4"></video><button class="owned-film__play" type="button">Play</button></div><figcaption>Original proof; no success claim. <a href="https://example.org/source">Source</a></figcaption><p class="owned-film__status" role="status" hidden></p></figure></section><section id="flow">Unchanged lower page.</section></main></body></html>`;

test('six compositions have distinct structure, not only different colors',()=>{
 assert.equal(Object.keys(directions).length,6);
 assert.equal(new Set(Object.values(directions)).size,6);
});
for(const [id,direction] of Object.entries(directions))for(const lang of ['ja','en']){
 test(`render ${id}/${lang}: original evidence, one CTA and accessible native player survive`,()=>{
  const input=fixture(id),output=artDirectProductHero(input,{id},lang);
  assert.match(output,new RegExp(`data-direction="${direction}"`));
  assert.equal((output.match(/<h1>/g)||[]).length,1);
  assert.equal((output.match(/class="owned-primary"/g)||[]).length,1);
  assert.equal((output.match(/<video\b/g)||[]).length,1);
  assert.equal((output.match(/id="recording"/g)||[]).length,1);
  assert.ok(output.includes(input.match(/<figure[\s\S]*?<\/figure>/)[0]));
  assert.ok(output.includes('<section id="flow">Unchanged lower page.</section>'));
  for(const token of ['owned-action-note','owned-try-now','owned-access','owned-film__status']) assert.ok(output.includes(token));
  assert.doesNotMatch(output,/<iframe|<form|\bautoplay\b|\bonclick=|<script/);
  assert.equal(artDirectProductHero(output,{id},lang),output);
 });
 test(`integration ${id}/${lang}: final built page contains the active composition`,async()=>{
  const html=await fs.readFile(path.join(root,'dist',lang==='en'?'en':'','products',id,'index.html'),'utf8');
  assert.match(html,new RegExp(`data-direction="${direction}"`));
  assert.match(html,/data-art-direction="20260919"/);
  assert.equal((html.match(/<script\b/g)||[]).length,1);
  assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
  assert.match(html,new RegExp(`data-recording-src="/media/products/${id}\\.mp4"`));
 });
}
test('unknown input and changed templates fail closed',()=>{
 for(const id of ['constructor','__proto__','../../secret']) assert.throws(()=>artDirectProductHero('',{id},'ja'),TypeError);
 assert.throws(()=>artDirectProductHero('',{id:'genie'},'de'),TypeError);
 assert.throws(()=>artDirectProductHero('<html></html>',{id:'genie'},'ja'),/missing product hero/);
 assert.throws(()=>artDirectProductHero(fixture('genie').replace('owned-access','renamed-access'),{id:'genie'},'ja'),/access conditions/);
});
test('replacement tokens in preserved source do not become substitution instructions',()=>{
 const html=fixture('genie').replace('Description',()=> 'Price $& $$ $1');
 assert.ok(artDirectProductHero(html,{id:'genie'},'ja').includes('Price $& $$ $1'));
});
test('security preflight and archived investigation are labelled separately in both languages',()=>{
 const ja=artDirectProductHero(fixture('aisecure'),{id:'aisecure'},'ja');
 const en=artDirectProductHero(fixture('aisecure'),{id:'aisecure'},'en');
 assert.match(ja,/index\.ja\.html#workbench/);
 assert.match(ja,/合成ログの調査デモ/);
 assert.match(en,/synthetic-log investigation demo/);
 assert.match(en,/href="https:\/\/forifor.github.io\/AISecure\/#workbench"/);
});
test('usage examples, role guides and output indexes cannot be confused with real execution',()=>{
 assert.match(artDirectProductHero(fixture('ai-meeting'),{id:'ai-meeting'},'ja'),/実際の発言ログではありません/);
 assert.match(artDirectProductHero(fixture('agent-team'),{id:'agent-team'},'ja'),/実行中の状態ではありません/);
 assert.match(artDirectProductHero(fixture('launchloom'),{id:'launchloom'},'en'),/not four newly generated artifacts/);
});
test('source styles use reduced motion, mobile compositions and contain real screenshots',async()=>{
 const css=await fs.readFile(path.join(root,'public/assets/product-art-direction.css'),'utf8');
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/max-width:800px/);assert.match(css,/max-width:500px/);
 assert.match(css,/object-fit:contain/);
 assert.doesNotMatch(css,/linear-gradient|radial-gradient|backdrop-filter|url\(https:|@import/);
});
test('stylesheet assembly is repeatable and delivers one stylesheet',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'reachmade-art-'));
 try{
  await fs.mkdir(path.join(dir,'assets'));
  await writeArtDirectionStyles(dir);
  const first=await fs.readFile(path.join(dir,'assets/showcase.css'),'utf8');
  await writeArtDirectionStyles(dir);
  assert.equal(await fs.readFile(path.join(dir,'assets/showcase.css'),'utf8'),first);
  assert.equal((first.match(/Product-specific compositions\./g)||[]).length,1);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
