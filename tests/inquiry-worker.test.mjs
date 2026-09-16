import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';
const assets={fetch:async()=>new Response('<!doctype html>',{headers:{'Content-Type':'text/html','Content-Security-Policy':"connect-src 'none'; form-action 'none'"}})};
for(const route of ['/contact/','/en/contact/','/contact/index.html','/en/contact/index.html'])test(`${route} permits only same-origin form fetch`,async()=>{
 const r=await worker.fetch(new Request('https://reachmade.com'+route),{ASSETS:assets});
 assert.match(r.headers.get('Content-Security-Policy'),/connect-src 'self'/);
 assert.match(r.headers.get('Content-Security-Policy'),/form-action 'none'/);
 assert.doesNotMatch(r.headers.get('Content-Security-Policy'),/https:\/\//);
 assert.equal(r.headers.get('Cache-Control'),'no-store');
});
for(const route of ['/','/products/','/privacy/','/assets/site.js'])test(`${route} keeps its existing CSP`,async()=>{
 const r=await worker.fetch(new Request('https://reachmade.com'+route),{ASSETS:assets});
 assert.equal(r.headers.get('Content-Security-Policy'),"connect-src 'none'; form-action 'none'");
});
test('non-production inquiry paths do not contact the upstream',async()=>{
 const r=await worker.fetch(new Request('http://127.0.0.1:8787/api/inquiries/status'),{ASSETS:assets});
 assert.equal(r.status,403);
});
test('www redirects preserve submission methods without contacting intake',async()=>{
 const r=await worker.fetch(new Request('https://www.reachmade.com/api/inquiries',{method:'POST',body:'private'}),{ASSETS:assets});
 assert.equal(r.status,308);assert.equal(r.headers.get('Location'),'https://reachmade.com/api/inquiries');
});
