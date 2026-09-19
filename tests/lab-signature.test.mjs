import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {gzipSync} from 'node:zlib';
import {SIGNATURE_VERSION,MOMENTS,momentFor,phaseProgress} from '../public/assets/lab-signature.mjs';
import {renderSignature,refineSignature,writeSignature} from '../src/lab-signature.mjs';
const root=path.resolve(import.meta.dirname,'..');
const shell=lang=>`<!doctype html><html lang="${lang}"><head><title>Old title</title><meta property="og:title" content="Old title"><link rel="stylesheet" href="/assets/showcase.css"><script type="module" src="/assets/showcase.mjs"></script></head><body data-lab-experience="20260919-product-lab-1"><main id="main"><section class="hero container lab-hero"><div class="hero-copy"><h1>Old headline</h1></div></section>\n <section class="container lab-explorer" id="explore"></section></main></body></html>`;
for(const id of Object.keys(MOMENTS))for(const lang of ['ja','en'])test(`${id}/${lang}: a localized request and sample result`,()=>{
 const m=momentFor(id,lang);assert.ok(m.request.length>7);assert.ok(m.result.length>3);assert.ok(m.action.length>3);assert.ok(m.index>=1&&m.index<=6);
 if(lang==='en')assert.doesNotMatch(Object.values(m).join(''),/[\u3040-\u30ff]/);
});
test('unknown inputs do not become markup or object properties',()=>{
 for(const id of ['constructor','__proto__','<img src=x>'])assert.throws(()=>momentFor(id),TypeError);
 assert.throws(()=>momentFor('genie','fr'),TypeError);assert.throws(()=>refineSignature('', 'fr'),TypeError);
});
test('phase progress is finite, bounded and derived from the existing five scenes',()=>{
 for(let i=0;i<5;i++)assert.equal(phaseProgress(i),i/4);
 for(const n of [-1,5,Infinity,NaN,'4',undefined])assert.equal(phaseProgress(n),0);
});
for(const lang of ['ja','en'])test(`${lang}: hero integration preserves one headline and one asset entrypoint`,()=>{
 const html=refineSignature(shell(lang),lang);
 assert.equal((html.match(/<h1>/g)||[]).length,1);assert.equal((html.match(/<script /g)||[]).length,1);assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
 assert.match(html,/class="lab-signature"/);assert.match(html,new RegExp(SIGNATURE_VERSION));
 assert.equal(refineSignature(html,lang),html);
 assert.equal((html.match(/data-signature-cue="[04]" hidden/g)||[]).length,2);
 assert.match(html,lang==='ja'?/AIを、<br>動く仕事に。/:/AI that moves<br>your work forward\./);
 assert.match(renderSignature(lang),lang==='ja'?/再現UI・サンプルデータ/:/ILLUSTRATIVE UI · SAMPLE DATA/);
});
test('unsupported home fails instead of silently shipping a half-upgraded hero',()=>{
 assert.throws(()=>refineSignature('<body>bad</body>'));
 assert.throws(()=>refineSignature(shell('ja').replace('</div></section>','</section>')));
 const detail=refineSignature(shell('ja').replace('hero container lab-hero','owned-hero-grid'));
 assert.doesNotMatch(detail,/class="lab-signature"/);assert.match(detail,/data-lab-signature=/);
});
test('presentation adds no tracking, calls, forms, storage, or scroll interception',async()=>{
 const client=await fs.readFile(path.join(root,'public/assets/lab-signature.mjs'),'utf8');
 assert.doesNotMatch(client,/\bfetch\s*\(|XMLHttpRequest|WebSocket|getUserMedia|localStorage|sessionStorage|sendBeacon|preventDefault|setInterval|setTimeout|scrollIntoView/);
 assert.match(client,/prefers-reduced-motion/);assert.match(client,/pagehide/);assert.match(client,/visibilitychange/);assert.match(client,/AbortController/);
 assert.ok(gzipSync(client).length<5000,'Signature JS gzip budget');
});
test('touch and motion do not depend on a mouse or unsupported navigation transitions',async()=>{
 const css=await fs.readFile(path.join(root,'public/assets/lab-signature.css'),'utf8');
 assert.match(css,/safe-area-inset/);assert.match(css,/min-height:44px/);assert.match(css,/hover:hover/);assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/backdrop-filter|linear-gradient|radial-gradient|@import|url\(http|cursor:none|scroll-snap-type/);
 assert.ok(gzipSync(css).length<6500,'Signature CSS gzip budget');
});
test('fourteen-page pass is idempotent and validates before any write',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'rm-signature-')),ids=Object.keys(MOMENTS),products=ids.map(id=>({id}));
 try{
  await fs.mkdir(path.join(tmp,'assets'));
  for(const file of ['lab-signature.css','lab-signature.mjs'])await fs.copyFile(path.join(root,'public/assets',file),path.join(tmp,'assets',file));
  await fs.writeFile(path.join(tmp,'assets/showcase.css'),'/* ORIGINAL CSS */');
  await fs.writeFile(path.join(tmp,'assets/showcase.mjs'),'/* ORIGINAL JS */');
  for(const prefix of ['','en/'])for(const page of ['',...ids.map(id=>`products/${id}/`)]){
   const dir=path.join(tmp,prefix,page);await fs.mkdir(dir,{recursive:true});
   await fs.writeFile(path.join(dir,'index.html'),page?shell(prefix?'en':'ja').replace('hero container lab-hero','owned-hero-grid'):shell(prefix?'en':'ja'));
  }
  await writeSignature(tmp,products);
  const before=await fs.readFile(path.join(tmp,'assets/showcase.mjs'),'utf8');
  await writeSignature(tmp,products);assert.equal(await fs.readFile(path.join(tmp,'assets/showcase.mjs'),'utf8'),before);
  assert.match(before,/ORIGINAL JS/);assert.equal((before.match(/import\('\.\/lab-signature\.mjs'\)/g)||[]).length,1);
  await fs.writeFile(path.join(tmp,'en/index.html'),'<body>unsupported</body>');
  await assert.rejects(()=>writeSignature(tmp,products));assert.equal(await fs.readFile(path.join(tmp,'assets/showcase.mjs'),'utf8'),before);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
