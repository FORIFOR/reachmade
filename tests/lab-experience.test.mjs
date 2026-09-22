import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {IDS,LAB_VERSION,copyFor,exercise,sampleResult,decision,mark} from '../public/assets/lab-explorer.mjs';
import {renderLabHome,writeLabExperience,art} from '../src/lab-experience.mjs';
const fixtures=()=>IDS.map((id,i)=>({id,index:String(i+1).padStart(2,'0'),name:id,preview:`/assets/products/${id}.jpg`,repo:`https://github.com/example/${id}`,evidence:`https://github.com/example/${id}/evidence`,ja:{status:'開発版',proof:'サンプルの検証資料',previewLabel:'製品画面'},en:{status:'Developer preview',proof:'Sample evidence',previewLabel:'Product screen'}}));
for(const lang of ['ja','en'])for(const id of IDS)test(`${id}/${lang}: interactive choices and source-aware result`,()=>{
 const c=copyFor(id,lang),x=exercise(id,lang),r=sampleResult(id,lang);
 assert.ok(c.title);assert.equal(x.options.length,2);assert.ok(x.feedback);
 assert.ok(r.lines.length>=3);assert.match(r.text,/Reachmade/);
 assert.ok(decision(id,0));assert.equal(decision(id,1),false);
 assert.doesNotMatch(art(id,lang),/<script|<iframe|<video|onclick/);
 assert.ok(mark(id).startsWith('<svg'));
 if(lang==='en')assert.doesNotMatch([c.title,x.question,...x.options,r.text].join(''),/[\u3040-\u30ff]/);
});
test('invalid identifiers and locales are rejected before rendering',()=>{
 for(const id of ['../a','constructor','<script>']){assert.throws(()=>copyFor(id,'ja'),TypeError);assert.throws(()=>mark(id),TypeError);assert.throws(()=>decision(id,0),TypeError);}
 assert.throws(()=>copyFor('genie','fr'),TypeError);assert.throws(()=>decision('genie',null),TypeError);
 assert.throws(()=>renderLabHome(fixtures().slice(1),'ja'),TypeError);
 const duplicate=fixtures();duplicate[5]=duplicate[0];assert.throws(()=>renderLabHome(duplicate,'ja'),TypeError);
});
for(const lang of ['ja','en'])test(`home/${lang}: six useful no-script paths and one primary headline`,()=>{
 const html=renderLabHome(fixtures(),lang);
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.equal((html.match(/data-studio-choice=/g)||[]).length,6);
 assert.equal((html.match(/class="lab-product-card"/g)||[]).length,6);
 assert.match(html,/<a class="lab-begin" data-lab-begin href="#studio-player">/);assert.doesNotMatch(html,/data-lab-begin hidden/);
 assert.match(html,/width="1600" height="1000" fetchpriority="high"/);
 assert.doesNotMatch(html,/<script|<style|<iframe|<form|\bautoplay\b|\bonclick=/);
 for(const id of IDS)assert.ok(html.includes(`${lang==='en'?'/en':''}/products/${id}/`));
});
test('registry content is escaped in text and attributes',()=>{
 const p=fixtures();p[0].name='<img onerror="run">';p[0].ja.proof='" onmouseover="run';
 const html=renderLabHome(p,'ja');assert.match(html,/&lt;img onerror=&quot;run&quot;&gt;/);
 assert.doesNotMatch(html,/<img onerror=/);
});
test('sample outputs never assert external success or actual generated media',()=>{
 assert.match(sampleResult('oathra','en').text,/unverified/);
 assert.match(sampleResult('ai-meeting','en').text,/actual app: no/);
 assert.match(sampleResult('launchloom','en').text,/not generated media/);
 assert.match(sampleResult('aisecure','en').text,/Hypothesis:/);
 assert.match(sampleResult('agent-team','en').text,/Open verification items: 1/);
});
test('build extension preserves entrypoints, product pages and is idempotent',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'reachmade-lab-'));
 const shell='<html><head><script type="module" src="/assets/showcase.mjs"></script><link rel="stylesheet" href="/assets/showcase.css"></head><body data-showcase="20260918"><header>preserved</header><main id="main">old</main><footer>preserved</footer></body></html>';
 try{
  await fs.mkdir(path.join(tmp,'assets'),{recursive:true});
  for(const [name,content] of [['showcase.css','/* original CSS */'],['showcase.mjs','// original player'],['lab-explorer.css','.lab-hero{display:block}']])await fs.writeFile(path.join(tmp,'assets',name),content);
  const routes=['','en/',...IDS.flatMap(id=>[`products/${id}/`,`en/products/${id}/`])];
  for(const route of routes){await fs.mkdir(path.join(tmp,route),{recursive:true});await fs.writeFile(path.join(tmp,route,'index.html'),shell);}
  await writeLabExperience(tmp,fixtures());
  const before=await fs.readFile(path.join(tmp,'index.html'),'utf8');
  await writeLabExperience(tmp,fixtures());
  assert.equal(await fs.readFile(path.join(tmp,'index.html'),'utf8'),before);
  assert.equal((before.match(/<script\b/g)||[]).length,1);assert.equal((before.match(/rel="stylesheet"/g)||[]).length,1);
  assert.match(before,/<header>preserved<\/header>/);assert.match(before,/<footer>preserved<\/footer>/);
  for(const route of routes)assert.ok((await fs.readFile(path.join(tmp,route,'index.html'),'utf8')).includes(LAB_VERSION));
  const product=await fs.readFile(path.join(tmp,'products/genie/index.html'),'utf8');assert.match(product,/<main id="main">old<\/main>/);
  const js=await fs.readFile(path.join(tmp,'assets/showcase.mjs'),'utf8');assert.equal((js.match(/import\('\.\/lab-explorer.mjs'\)/g)||[]).length,1);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
test('client has no workflow transport or persistent tracking',async()=>{
 const js=await fs.readFile(new URL('../public/assets/lab-explorer.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|getUserMedia|document\.cookie/);
 assert.match(js,/URL\.revokeObjectURL/);assert.match(js,/prefers-reduced-motion/);assert.match(js,/aria-pressed/);
 const css=await fs.readFile(new URL('../public/assets/lab-explorer.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/url\(https:|@import|backdrop-filter|radial-gradient/);
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/forced-colors:active/);
});
