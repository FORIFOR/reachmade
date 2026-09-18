import test from 'node:test';
import assert from 'node:assert/strict';
import {serveOwnedRecording} from '../src/owned-recording-response.mjs';
const url='https://reachmade.com/media/originals/genie/assets/genie-orbit-web.mp4';
const bytes=new Uint8Array(Array.from({length:100},(_,i)=>i));
const assets={fetch:async req=>{assert.equal(new URL(req.url).pathname,new URL(url).pathname);return new Response(req.method==='HEAD'?null:bytes,{headers:{'content-type':'video/mp4','content-length':'100','etag':'"owned"'}});}};
test('original Range, suffix, HEAD and missing routes retain streaming boundaries',async()=>{
 let response=await serveOwnedRecording(new Request(url,{headers:{Range:'bytes=2-5'}}),assets);
 assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 2-5/100');assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes.slice(2,6));
 response=await serveOwnedRecording(new Request(url,{headers:{Range:'bytes=-4'}}),assets);assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,4);
 response=await serveOwnedRecording(new Request(url,{method:'HEAD'}),assets);assert.equal(response.status,200);assert.equal((await response.arrayBuffer()).byteLength,0);
 response=await serveOwnedRecording(new Request(url,{headers:{Range:'bytes=1000-'}}),assets);assert.equal(response.status,416);
 assert.equal(await serveOwnedRecording(new Request('https://reachmade.com/media/originals/unknown.mp4'),assets),null);
});
