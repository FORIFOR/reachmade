import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PRODUCTS,CUES,DURATION,demoCopy,renderStory,phaseAt} from '../public/assets/animated-demos.mjs';
import {bundleDemoAssets} from '../src/animated-demo-assets.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFile(path.join(root,file),'utf8');
test('five ordered scenes fit one deterministic 18 second clock',()=>{
 assert.equal(PRODUCTS.length,6);assert.equal(new Set(PRODUCTS).size,6);
 assert.deepEqual(CUES,[0,2600,6000,9600,13600]);assert.equal(DURATION,18000);
 CUES.forEach((cue,i)=>assert.equal(phaseAt(cue),i));
 assert.equal(phaseAt(2599),0);assert.equal(phaseAt(18000),4);
 assert.equal(phaseAt(NaN),0);assert.equal(phaseAt(-1),0);
});
for(const id of PRODUCTS)for(const lang of ['ja','en'])test(`${id}/${lang}: distinct, localized UI story`,()=>{
 const c=demoCopy(id,lang),html=renderStory(id,lang);
 assert.equal(c.steps.length,5);assert.ok(c.prompt.length>10);assert.ok(c.scope.length>20);
 assert.match(html,new RegExp(`data-product="${id}"`));assert.match(html,/data-reveal="4"/);
 assert.doesNotMatch(html,/<script|<iframe|<form|\bonclick=|<video|<audio/);
 if(lang==='en')assert.doesNotMatch(c.prompt+c.steps.join('')+c.scope,/[\u3040-\u30ff]/);
});
test('unknown product and locale cannot become injected markup',()=>{
 for(const id of ['../secrets','<img src=x>','constructor'])assert.throws(()=>renderStory(id),TypeError);
 assert.throws(()=>demoCopy('genie','fr'),TypeError);
});
test('stories retain human approval and unverified boundaries',()=>{
 assert.match(renderStory('oathra','en'),/External booking: unverified/);
 assert.match(renderStory('aisecure','en'),/HYPOTHESIS · UNCONFIRMED/);
 assert.match(renderStory('agent-team','en'),/1 open check/);
 assert.match(renderStory('launchloom','en'),/Nothing is published/);
 assert.match(renderStory('ai-meeting','en'),/Confirm change \(demo\)/);
});
test('engine has no transport, recording, telemetry, storage or timer chains',async()=>{
 const js=await read('public/assets/animated-demos.mjs');
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|getUserMedia|setInterval|setTimeout/);
 for(const term of ['IntersectionObserver','MutationObserver','visibilitychange','pagehide','pageshow','AbortController','cancelAnimationFrame','.owned-film','data-product'])assert.ok(js.includes(term));
 assert.match(js,/mode === 'story'/);assert.match(js,/paused = true/);assert.match(js,/video\?\.pause/);
});
test('CSS freezes continuous effects, respects motion settings, and adapts by container width',async()=>{
 const css=await read('public/assets/animated-demos.css');
 assert.match(css,/animation-play-state:paused!important/);assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/@container rm-story/);assert.match(css,/forced-colors:active/);
 assert.doesNotMatch(css,/@import|url\(https:|linear-gradient|radial-gradient|backdrop-filter/);
});
test('build bundles assets idempotently without adding another HTML entrypoint',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'reachmade-demo-'));
 try{
  const dir=path.join(temp,'assets');await fs.mkdir(dir);
  await fs.writeFile(path.join(dir,'showcase.css'),'body{margin:0}\n');
  await fs.writeFile(path.join(dir,'showcase.mjs'),'// original player remains first\n');
  for(const file of ['animated-demos.css','animated-demos.mjs'])await fs.copyFile(path.join(root,'public/assets',file),path.join(dir,file));
  await bundleDemoAssets(temp);
  const before=await Promise.all(['showcase.css','showcase.mjs'].map(f=>fs.readFile(path.join(dir,f),'utf8')));
  await bundleDemoAssets(temp);
  const after=await Promise.all(['showcase.css','showcase.mjs'].map(f=>fs.readFile(path.join(dir,f),'utf8')));
  assert.deepEqual(after,before);assert.match(after[0],/\.rm-live-demo/);
  assert.equal((after[1].match(/import\('\.\/animated-demos\.mjs'\)/g)||[]).length,1);
  assert.match(after[1],/demoState = 'unavailable'/);
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
