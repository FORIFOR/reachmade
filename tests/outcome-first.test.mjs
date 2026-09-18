import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {renderOrbit,orbitCopy,standaloneOrbit,ORBIT_CSS} from '../public/assets/orbit-study.mjs';
import {renderOutcomeHero,addDirectStarts,DIRECT_STARTS,enhanceOutcomePage} from '../src/outcome-first.mjs';
const ids=Object.keys(DIRECT_STARTS);
for(const lang of ['ja','en']){
 test(`orbit/${lang}: one named controllable artifact, explicit provenance`,()=>{
  const html=renderOrbit(lang);assert.equal((html.match(/<svg\b/g)||[]).length,1);
  assert.match(html,/data-orbit-motion="paused"/);assert.match(html,/data-orbit-controls hidden/);
  assert.match(html,/<noscript>/);assert.match(html,/role="status"/);
  assert.match(html,lang==='ja'?/Genieの生成結果/:/Not a Genie-generated/);
  const all=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(all.length,new Set(all).size);
 });
 test(`hero/${lang}: concrete outcomes, single h1, no invented social proof`,()=>{
  const h=renderOutcomeHero(lang);assert.equal((h.match(/<h1>/g)||[]).length,1);
  assert.ok(h.includes(lang==='ja'?'会話を、タスクに':'Conversations into tasks'));
  assert.match(h,/href="#explore"/);assert.doesNotMatch(h,/<iframe|\bautoplay\b|customer logos|10x faster|100%/);
 });
 test(`export/${lang}: complete executable HTML without external dependencies`,()=>{
  const html=standaloneOrbit(lang);assert.match(html,/<!doctype html>/);
  const matches=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(matches.length,1);
  assert.doesNotThrow(()=>new vm.Script(matches[0][1]));
  assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=|src="https?:|@import|fetch\(/);
 });
 test(`explorer/${lang}: all six destinations keep their own conditions`,()=>{
  const html=ids.map(id=>`<a href="/products/${id}/" data-studio-choice="${id}">link</a>`).join('')+'<a data-lab-detail href="/products/genie/">details</a>';
  const h=addDirectStarts(html,lang);assert.equal((h.match(/data-outcome-start="/g)||[]).length,6);
  for(const id of ids){assert.ok(h.includes(DIRECT_STARTS[id][lang][0]));assert.ok(h.includes(DIRECT_STARTS[id][lang][1]));}
 });
 test(`product/${lang}: proof and original CTA survive; output is idempotent`,()=>{
  const html='<body data-art-direction="20260919"><div class="ad-copy"><h1>Product</h1><a class="owned-primary" href="https://example.com">Setup</a><p class="owned-action-note">Requires setup.</p></div><figure class="owned-film">Original proof.</figure><footer class="container owned-footer">Footer</footer></body>';
  for(const id of ids){const out=enhanceOutcomePage(html,id,lang);assert.ok(out.includes('<figure class="owned-film">Original proof.</figure>'));assert.ok(out.includes('Requires setup.'));assert.ok(out.includes('data-outcome-sample hidden'));assert.equal(enhanceOutcomePage(out,id,lang),out);}
 });
}
test('unsupported values fail closed',()=>{for(const lang of ['de','constructor','__proto__']){assert.throws(()=>orbitCopy(lang),TypeError);assert.throws(()=>renderOutcomeHero(lang),TypeError);}assert.throws(()=>renderOrbit('ja','"><script>'),TypeError);assert.throws(()=>enhanceOutcomePage('','unknown','ja'),TypeError);assert.throws(()=>addDirectStarts('<a></a>','ja'));});
test('motion requires an explicit action and has real pause controls',async()=>{assert.match(ORBIT_CSS,/animation-play-state:paused/);assert.match(ORBIT_CSS,/data-orbit-motion=running/);const source=await fs.readFile(new URL('../public/assets/orbit-study.mjs',import.meta.url),'utf8');assert.match(source,/visibilitychange/);assert.doesNotMatch(source,/getUserMedia|sendBeacon|localStorage|sessionStorage|fetch\(|XMLHttpRequest/);});
test('build order integrates phases before the final finishing pass',async()=>{const source=await fs.readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');const a=source.indexOf('await writeShowcase('),b=source.indexOf('await writeLabExperience('),c=source.indexOf('await writeOutcomeFirst(');assert.ok(a>=0&&b>a&&c>b);});
