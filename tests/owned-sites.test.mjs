import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readOwnedRecording} from '../src/owned-media.mjs';
import {ownedAliasTarget} from '../src/owned-aliases.mjs';
import {writeOwnedGuides} from '../src/owned-guides.mjs';
test('Genie aliases stay owned, preserving the app origin separately',()=>{
 assert.equal(ownedAliasTarget(new URL('https://genie.reachmade.com/?x=1')).href,'https://reachmade.com/products/genie/?x=1');
 assert.equal(ownedAliasTarget(new URL('https://genie.reachmade.com/ja')).pathname,'/products/genie/');
 assert.equal(ownedAliasTarget(new URL('https://genie.reachmade.com/en')).pathname,'/en/products/genie/');
 assert.equal(ownedAliasTarget(new URL('https://genie.reachmade.com/assets/genie-orbit-web.mp4')).pathname,'/media/originals/genie/assets/genie-orbit-web.mp4');
 assert.equal(ownedAliasTarget(new URL('https://ai-meeting.reachmade.com/')),null);
});
test('owned recordings load offline and reject missing or tampered originals',async()=>{
 const repositoryRoot=await fs.mkdtemp(path.join(os.tmpdir(),'owned-original-'));
 const route='/media/originals/genie/assets/genie-orbit-web.mp4', bytes=Buffer.from('owned-test-fixture');
 const file=path.join(repositoryRoot,'public',route), inventory=path.join(repositoryRoot,'public/media/originals/manifest.json');
 try{
  await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);
  await fs.writeFile(inventory,JSON.stringify({files:[{path:route,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}]}));
  assert.deepEqual(await readOwnedRecording('https://reachmade.com'+route,{repositoryRoot}),bytes);
  assert.equal(await readOwnedRecording('https://example.com/test.mp4',{repositoryRoot}),null);
  await assert.rejects(readOwnedRecording('https://reachmade.com/media/originals/unknown.mp4',{repositoryRoot}));
  await fs.writeFile(file,'changed');await assert.rejects(readOwnedRecording('https://reachmade.com'+route,{repositoryRoot}),/hash mismatch/);
  await fs.rm(file);await assert.rejects(readOwnedRecording('https://reachmade.com'+route,{repositoryRoot}));
 }finally{await fs.rm(repositoryRoot,{recursive:true,force:true});}
});
test('four bilingual support pages use owned media and correct app links',async()=>{
 const dist=await fs.mkdtemp(path.join(os.tmpdir(),'owned-guides-'));
 try{
  const files=['genie/assets/genie-orbit-web.mp4','genie/assets/genie-web-proposal-web.mp4','genie/assets/genie-product-film-web.mp4','ai-meeting/demo.mp4'].map(p=>({path:'/media/originals/'+p,duration:33}));
  await fs.mkdir(path.join(dist,'media/originals'),{recursive:true});await fs.writeFile(path.join(dist,'media/originals/manifest.json'),JSON.stringify({files}));
  const routes=await writeOwnedGuides(dist);assert.equal(routes.length,4);
  for(const {route,lang} of routes){
   const html=await fs.readFile(path.join(dist,route,'index.html'),'utf8');
   assert.ok(html.includes(`lang="${lang}"`));assert.ok(html.includes(`href="https://reachmade.com${route}"`));
   assert.ok(!html.includes('chatgpt.site'));assert.ok(html.includes('preload="none"'));
   if(route.includes('ai-meeting'))assert.ok(html.includes('https://ai-meeting.web.app/#tasks'));
  }
 }finally{await fs.rm(dist,{recursive:true,force:true});}
});
