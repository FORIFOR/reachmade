import test from 'node:test';
import assert from 'node:assert/strict';
import { serveStaticRecording } from '../src/static-recordings.mjs';
const request=range=>new Request('https://reachmade.com/media/products/genie.mp4',{headers:{Range:range}});
const assets=()=>({fetch:async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([0,1,2,3]));c.enqueue(new Uint8Array([4,5,6,7]));c.close();}}),{headers:{'Content-Type':'video/mp4'}})});
test('chunked static assets produce byte-exact ranges with a computed total',async()=>{
 for(const [value,expected] of [['bytes=2-5',[2,3,4,5]],['bytes=-2',[6,7]],['bytes=6-',[6,7]]]){
  const r=await serveStaticRecording(request(value),assets());assert.equal(r.status,206);
  assert.equal(r.headers.get('Content-Length'),String(expected.length));
  assert.match(r.headers.get('Content-Range'),/\/8$/);
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],expected);
 }
});
test('absent length does not turn invalid ranges into success',async()=>{
 const r=await serveStaticRecording(request('bytes=99-'),assets());
 assert.equal(r.status,416);assert.equal(r.headers.get('Content-Range'),'bytes */8');
});
test('chunked data remains bounded if the packaged source violates its size limit',async()=>{
 let cancelled=false;
 const a={fetch:async()=>new Response(new ReadableStream({pull(c){c.enqueue(new Uint8Array(1024*1024));},cancel(){cancelled=true;}}),{headers:{'Content-Type':'video/mp4'}})};
 const r=await serveStaticRecording(request('bytes=0-63'),a);assert.equal(r.status,503);assert.equal(cancelled,true);
});
