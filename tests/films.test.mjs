import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { recordings, serveRecording } from '../src/films.mjs';
const request=(path,init)=>new Request('https://reachmade.com'+path,init);
test('six explicit, HTTPS recordings',()=>{
 assert.equal(Object.keys(recordings).length,6);
 for(const url of Object.values(recordings)){assert.equal(new URL(url).protocol,'https:');assert.match(url,/\.mp4$/);}
});
test('unrelated pages bypass the media proxy',async()=>assert.equal(await serveRecording(request('/products/')),null));
test('unknown IDs cannot create an open proxy',async()=>{
 let calls=0;const mock=()=>{calls++;throw Error('must not fetch');};
 for(const p of ['/media/products/unknown.mp4','/media/products/constructor.mp4','/media/products/https://example.org'])assert.equal((await serveRecording(request(p),mock)).status,404);
 assert.equal(calls,0);
});
test('only GET and HEAD are accepted',async()=>{
 const r=await serveRecording(request('/media/products/genie.mp4',{method:'POST'}),()=>{throw Error('must not fetch');});
 assert.equal(r.status,405);assert.equal(r.headers.get('allow'),'GET, HEAD');
});
test('byte range is preserved, personal request headers are not forwarded',async()=>{
 const r=await serveRecording(request('/media/products/genie.mp4',{headers:{Range:'bytes=0-3',Cookie:'private=secret',Authorization:'Bearer secret',Referer:'https://private.example/','X-Forwarded-For':'192.0.2.1'}}),async(url,init)=>{
  assert.equal(url,recordings.genie);assert.equal(init.headers.get('range'),'bytes=0-3');
  for(const key of ['cookie','authorization','referer','x-forwarded-for'])assert.equal(init.headers.get(key),null);
  return new Response('film',{status:206,headers:{'Content-Type':'video/mp4','Content-Range':'bytes 0-3/4','Accept-Ranges':'bytes','Set-Cookie':'unexpected=1'}});
 });
 assert.equal(r.status,206);assert.equal(await r.text(),'film');assert.equal(r.headers.get('content-range'),'bytes 0-3/4');assert.equal(r.headers.get('set-cookie'),null);assert.equal(r.headers.get('cross-origin-resource-policy'),'same-origin');
});
test('a query cannot select a different upstream',async()=>{
 await serveRecording(request('/media/products/genie.mp4?url=https://evil.example/'),async url=>{assert.equal(url,recordings.genie);return new Response('film',{headers:{'Content-Type':'video/mp4'}});});
});
test('HEAD has no response body and preserves content metadata',async()=>{
 const r=await serveRecording(request('/media/products/launchloom.mp4',{method:'HEAD'}),async(url,init)=>{
  assert.equal(init.method,'HEAD');return new Response(null,{headers:{'Content-Type':'video/mp4','Content-Length':'100','ETag':'"v1"'}});
 });assert.equal(await r.text(),'');assert.equal(r.headers.get('content-length'),'100');assert.equal(r.headers.get('etag'),'"v1"');
});
test('conditional 304 responses preserve status and have no body',async()=>{
 const r=await serveRecording(request('/media/products/oathra.mp4',{headers:{'If-None-Match':'"v1"'}}),async(url,init)=>{
  assert.equal(init.headers.get('if-none-match'),'"v1"');return new Response(null,{status:304,headers:{ETag:'"v1"'}});
 });assert.equal(r.status,304);assert.equal(await r.text(),'');
});
test('multi ranges fail without fetching',async()=>assert.equal((await serveRecording(request('/media/products/genie.mp4',{headers:{Range:'bytes=0-1,2-3'}}),()=>{throw Error('not called');})).status,416));
test('upstream HTML and errors never masquerade as a working video',async()=>{
 for(const mock of [async()=>new Response('<html>login</html>',{headers:{'Content-Type':'text/html'}}),async()=>new Response('missing',{status:404}),async()=>{throw Error('offline');}]){
  const r=await serveRecording(request('/media/products/genie.mp4'),mock);assert.equal(r.status,502);assert.equal(r.headers.get('cache-control'),'no-store');
 }
});
test('player keeps permission denial distinct from unavailable media',async()=>{
 const js=await fs.readFile(new URL('../public/assets/product-films.js',import.meta.url),'utf8');
 assert.match(js,/NotAllowedError/);assert.match(js,/prefers-reduced-motion/);assert.match(js,/saveData/);assert.match(js,/visibilitychange/);
 assert.match(js,/full\.addEventListener\('error',.*fullError\.hidden=false/);
 assert.doesNotMatch(js,/\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|document\.cookie/);
});
test('media CSP allows only the same origin',async()=>{
 const h=await fs.readFile(new URL('../public/_headers',import.meta.url),'utf8');
 assert.match(h,/media-src 'self';/);assert.match(h,/connect-src 'none';/);assert.match(h,/frame-src 'none';/);
});
