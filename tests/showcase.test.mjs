import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {showcase,renderStudioHome,refineProductPage} from '../src/showcase.mjs';
import {products} from '../src/products.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFile(path.join(root,file),'utf8');
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('each product has an explicit, different art direction',()=>{
 assert.equal(Object.keys(showcase).length,products.length);
 assert.equal(new Set(Object.values(showcase).map(x=>x.theme)).size,products.length);
});
for(const lang of ['ja','en']){
 test(`home/${lang}: six real sources and useful no-JavaScript links`,()=>{
  const html=renderStudioHome(products,lang);
  assert.equal((html.match(/data-studio-choice=/g)||[]).length,products.length);
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.doesNotMatch(html,/\bautoplay\b|\bonclick=|<iframe|<form/);
  for(const p of products)assert.ok(html.includes(`${lang==='en'?'/en':''}/products/${p.id}/`));
  assert.match(html,/width="1600" height="1000"/);
  assert.match(html,/fetchpriority="high"/);
 });
 for(const p of products)test(`${lang}/${p.id}: preserve access, evidence, native recording and SEO`,async()=>{
  const html=await read(`dist/${lang==='en'?'en/':''}products/${p.id}/index.html`);
  assert.match(html,/data-showcase="20260918"/);
  assert.equal((html.match(/<script\b/g)||[]).length,1);
  assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
  assert.match(html,/src="\/assets\/showcase.mjs"/);
  assert.match(html,/class="owned-access"/);
  assert.match(html,/class="owned-action-note"/);
  assert.ok(html.includes(escapeHTML(p.preview)));
  assert.ok(html.includes(escapeHTML(p.evidence)));
  assert.match(html,/data-recording-src="\/media\/products\//);
  assert.match(html,/rel="canonical"/);
  assert.match(html,/class="studio-related"/);
 });
}
test('dynamic strings are escaped, not treated as HTML',()=>{
 const fixture=structuredClone(products);fixture[0].name='<img onerror="x">';
 const html=renderStudioHome(fixture,'ja');
 assert.ok(html.includes('&lt;img onerror=&quot;x&quot;&gt;'));
 assert.doesNotMatch(html,/<img onerror=/);
});
test('unknown locales and product identifiers fail closed',()=>{
 assert.throws(()=>renderStudioHome(products,'fr'),TypeError);
 assert.throws(()=>refineProductPage('',{id:'../secrets'},'ja'),TypeError);
});
test('new presentation has no autoplay, analytics or persistent visitor data',async()=>{
 const js=await read('public/assets/showcase.mjs');
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|\.autoplay\s*=/);
 assert.match(js,/role','tab'/);assert.match(js,/ArrowRight/);assert.match(js,/aria-selected/);
 assert.match(js,/setTimeout\(fail,10000\)/);assert.match(js,/visibilitychange/);
});
test('one self-contained style owns the new presentation and respects reduced motion',async()=>{
 const css=await read('public/assets/showcase.css');
 assert.doesNotMatch(css,/@import|url\(https:|linear-gradient|radial-gradient|backdrop-filter/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 for(const p of products)assert.ok(css.includes(`.owned-product--${p.id}`));
});
