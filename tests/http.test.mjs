import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {root} from '../scripts/build.mjs';
const port=4181;
const server=spawn(process.execPath,[path.join(root,'scripts/serve.mjs')],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(new Error('preview server start timed out')),5000);
 server.stdout.once('data',()=>{clearTimeout(timer);resolve();});server.once('error',reject);
});
test.after(()=>server.kill());
const request=(p,options={})=>fetch(`http://127.0.0.1:${port}${p}`,{redirect:'manual',...options});
for(const path of ['/','/en/','/products/','/contact/','/assets/site.css','/assets/site.js','/assets/og.png']){
 test(`HTTP GET ${path}`,async()=>{const r=await request(path);assert.equal(r.status,200);assert.ok((await r.arrayBuffer()).byteLength>0);});
}
test('HTTP HEAD omits body',async()=>{const r=await request('/',{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'');});
test('redirect adds trailing slash and retains query',async()=>{const r=await request('/products?x=1');assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/products/?x=1');});
test('unknown pages have HTTP 404',async()=>{const r=await request('/does-not-exist/');assert.equal(r.status,404);assert.match(await r.text(),/404/);});
test('POST is rejected rather than accepting private data',async()=>{const r=await request('/contact/',{method:'POST',body:'test'});assert.equal(r.status,405);});
for(const p of ['/site.config.json','/.env','/src/copy.mjs','/_headers','/_redirects','/%00','/%E0%A4%A']){
 test(`non-public path is refused: ${p}`,async()=>{const r=await request(p);assert.ok([400,403,404].includes(r.status));});
}
test('local HTTP security headers are present',async()=>{const r=await request('/');assert.match(r.headers.get('content-security-policy'),/form-action 'none'/);assert.equal(r.headers.get('x-frame-options'),'DENY');});
