import test from 'node:test';
import assert from 'node:assert/strict';
import { byteRange, serveStaticRecording } from '../src/static-recordings.mjs';
const req=headers=>new Request('https://reachmade.com/media/products/genie.mp4',{headers});
const asset=()=>({fetch:async()=>new Response(new Uint8Array([0,1,2,3,4,5,6,7,8,9]),{headers:{'Content-Type':'video/mp4','Content-Length':'10','ETag':'"v1"'}})});
test('bounded, open and suffix ranges are normalized',()=>{
 assert.deepEqual(byteRange('bytes=2-5',10),[2,5]);assert.deepEqual(byteRange('bytes=8-',10),[8,9]);
 assert.deepEqual(byteRange('bytes=-3',10),[7,9]);assert.deepEqual(byteRange('bytes=0-999999999999999999',10),[0,9]);
 for(const v of ['bytes=10-','bytes=5-3','bytes=-0','bytes=','bytes=0-1,4-5'])assert.equal(byteRange(v,10),null);
});
test('complete-asset fallback returns exact requested bytes and matching lengths',async()=>{
 for(const [range,expected] of [['bytes=2-5',[2,3,4,5]],['bytes=-3',[7,8,9]],['bytes=8-',[8,9]]]){
  const r=await serveStaticRecording(req({Range:range}),asset());assert.equal(r.status,206);
  assert.equal(r.headers.get('content-length'),String(expected.length));
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],expected);
 }
});
test('unsatisfiable range is 416 with the complete resource length',async()=>{
 const r=await serveStaticRecording(req({Range:'bytes=50-'}),asset());
 assert.equal(r.status,416);assert.equal(r.headers.get('content-range'),'bytes */10');
});
test('If-Range only selects partial data for the matching strong validator',async()=>{
 for(const [value,status] of [['"v1"',206],['"v2"',200],['W/"v1"',200]]){
  const r=await serveStaticRecording(req({Range:'bytes=2-5','If-Range':value}),asset());assert.equal(r.status,status);
  assert.equal((await r.arrayBuffer()).byteLength,status===206?4:10);
 }
});
