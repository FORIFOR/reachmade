import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateMp4, downloadRecording, prepareMedia, MAX_BYTES } from '../scripts/prepare-media.mjs';
import { serveStaticRecording } from '../src/static-recordings.mjs';
const request=(p,init)=>new Request('https://reachmade.com'+p,init);
function box(name,n=8){const b=Buffer.alloc(n);b.writeUInt32BE(n);b.write(name,4);return b;}
const mp4=()=>Buffer.concat([box('ftyp',24),box('moov',16),box('mdat',16)]);
const jpeg=()=>Buffer.concat([Buffer.from([0xff,0xd8]),Buffer.alloc(1024),Buffer.from([0xff,0xd9])]);
const fakeRenderer=async({input,output,poster})=>{await fs.copyFile(input,output);await fs.writeFile(poster,jpeg());};
const fakeSignatureRenderer=async({inputs,output,poster})=>{await fs.copyFile(inputs[0],output);await fs.writeFile(poster,jpeg());};
test('MP4 requires complete boxes',()=>{
 validateMp4(mp4());for(const b of [Buffer.from('<html>no</html>'),mp4().subarray(0,40),Buffer.concat([box('ftyp',24),box('mdat',16)])])assert.throws(()=>validateMp4(b));
});
test('downloads reject non-video responses and excess size',async()=>{
 for(const response of [new Response('html',{headers:{'Content-Type':'text/html'}}),new Response(null,{status:302}),new Response('a',{headers:{'Content-Type':'video/mp4','Content-Length':String(MAX_BYTES+1)}})])await assert.rejects(downloadRecording('https://example.org/a.mp4',async()=>response));
 await assert.rejects(downloadRecording('https://user@host/a.mp4',()=>{throw Error('not reached');}));
});
test('failed premium batches preserve the prior packaged files',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'rm-media-'));
 try{
  await fs.writeFile(path.join(dir,'index.html'),'ok');
  const good=async()=>new Response(mp4(),{headers:{'Content-Type':'video/mp4'}});
  const report=await prepareMedia({sourceReader: async()=>null,dist:dir,fetcher:good,renderer:fakeRenderer,signatureRenderer:fakeSignatureRenderer});
  assert.equal(report.recordings.length,6);assert.equal(report.schema,3);assert.equal(report.mode,'premium-site-edits');
  assert.equal(report.signature.duration,12);assert.equal(report.signature.speed,1);assert.equal(report.signature.transition,'hard-cut');
  assert.equal((await fs.readFile(path.join(dir,'assets/reachmade-signature.mp4'))).length,mp4().length);
  const before=await fs.readFile(path.join(dir,'media/products/manifest.json'),'utf8');let count=0;
  await assert.rejects(prepareMedia({sourceReader: async()=>null,dist:dir,renderer:fakeRenderer,signatureRenderer:fakeSignatureRenderer,fetcher:async()=>{if(++count>2)throw Error('offline');return good();}}),/Deployment stopped/);
  assert.equal(await fs.readFile(path.join(dir,'media/products/manifest.json'),'utf8'),before);
  assert.deepEqual(await fs.readdir(path.join(dir,'media')),['products']);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('static serving rejects unknown IDs and write methods while known generated posters use normal ASSETS',async()=>{
 const no={fetch:()=>{throw Error('must not call')}};
 assert.equal(await serveStaticRecording(request('/products/'),no),null);
 assert.equal(await serveStaticRecording(request('/media/products/genie.jpg'),no),null);
 for(const s of ['unknown.mp4','constructor.mp4','unknown.jpg','constructor.jpg'])assert.equal((await serveStaticRecording(request('/media/products/'+s),no)).status,404);
 assert.equal((await serveStaticRecording(request('/media/products/genie.mp4',{method:'POST'}),no)).status,405);
 assert.equal((await serveStaticRecording(request('/media/products/genie.mp4',{headers:{Range:'bytes=0-1,2-3'}}),no)).status,416);
});
test('ASSETS receives only range and conditional headers, with no query or identity',async()=>{
 const r=await serveStaticRecording(request('/media/products/genie.mp4?url=https://example.org',{headers:{Range:'bytes=0-3',Cookie:'private',Authorization:'private',Referer:'https://private.example'}}),{fetch:async req=>{
  assert.equal(new URL(req.url).search,'');assert.equal(req.headers.get('range'),'bytes=0-3');for(const k of ['cookie','authorization','referer'])assert.equal(req.headers.get(k),null);
  return new Response('film',{status:206,headers:{'Content-Type':'video/mp4','Content-Range':'bytes 0-3/100','Set-Cookie':'no'}});
 }});assert.equal(r.status,206);assert.equal(r.headers.get('set-cookie'),null);assert.equal(r.headers.get('content-range'),'bytes 0-3/100');
});
test('HEAD and conditional reads have no body',async()=>{
 for(const [method,status] of [['HEAD',200],['GET',304]]){
  const r=await serveStaticRecording(request('/media/products/genie.mp4',{method}),{fetch:async()=>new Response(null,{status,headers:{'Content-Type':'video/mp4',ETag:'"abc"'}})});
  assert.equal(r.status,status);assert.equal(await r.text(),'');assert.equal(r.headers.get('etag'),'"abc"');
 }
});
test('unavailable static files fail without an external fallback',async()=>{
 for(const assets of [undefined,{fetch:async()=>{throw Error('offline')}},{fetch:async()=>new Response('404',{status:404})},{fetch:async()=>new Response('html',{headers:{'Content-Type':'text/html'}})}]){
  const r=await serveStaticRecording(request('/media/products/genie.mp4'),assets);assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');
 }
});