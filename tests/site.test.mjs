import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root, escapeHTML, validateConfig } from '../scripts/build.mjs';
import { products } from '../src/products.mjs';
import { copy } from '../src/copy.mjs';
import { contactDestination } from '../src/site-experience.mjs';
const dist=path.join(root,'dist');
const config=JSON.parse(await fs.readFile(path.join(root,'site.config.json'),'utf8'));
const routes=JSON.parse(await fs.readFile(path.join(root,'docs/routes.json'),'utf8'));
const htmlByPath=new Map();
for (const r of routes) htmlByPath.set(r.route,await fs.readFile(path.join(dist,r.route,'index.html'),'utf8'));
const clone=()=>structuredClone(config);
const attr=(html,key)=>[...html.matchAll(new RegExp(`(?:^|\\s)${key}="([^"]*)"`,'g'))].map(m=>m[1]);
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
test('configuration is valid',()=>assert.equal(validateConfig(config),config));
test('HTML escaping includes attributes',()=>assert.equal(escapeHTML('<&"\'>'), '&lt;&amp;&quot;&#39;&gt;'));
for(const value of ['http://reachmade.com','https://reachmade.com/path','https://user:pw@reachmade.com','https://reachmade.com/?a=1','https://reachmade.com/#x']) {
 test(`rejects invalid origin ${value}`,()=>{const c=clone();c.origin=value;assert.throws(()=>validateConfig(c));});
}
test('contact must use a known mode',()=>{const c=clone();c.contact.mode='form';assert.throws(()=>validateConfig(c));});
test('rejects non-HTTPS contact',()=>{const c=clone();c.contact.url='javascript:alert(1)';assert.throws(()=>validateConfig(c));});
test('email mode rejects an absent address',()=>{const c=clone();c.contact.email=null;assert.throws(()=>{c.contact.mode='email';validateConfig(c);});});
test('email mode supports an owner-configured address',()=>{const c=clone();c.contact.mode='email';c.contact.email='owner@example.org';assert.doesNotThrow(()=>validateConfig(c));});
test('26 routes represent 7 portfolio and 6 product pages per language',()=>{
 assert.equal(routes.length,26);for(const lang of ['ja','en'])assert.equal(routes.filter(r=>r.lang===lang).length,13);
 assert.equal(routes.filter(r=>r.page.startsWith('product-')).length,12);
});
test('attribute checks do not mistake lazy data-src attributes for active sources',()=>{
 assert.deepEqual(attr('<video data-recording-src="/later.mp4" src="/now.mp4">','src'),['/now.mp4']);
});
test('products have unique identifiers and records',()=>{
 assert.ok(products.length>0);assert.equal(new Set(products.map(p=>p.id)).size,products.length);
});
for(const r of routes){
 test(`${r.route} metadata, structure, navigation and assets`,async()=>{
  const html=htmlByPath.get(r.route);
  assert.match(html,new RegExp(`<html lang="${r.lang}">`));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html,/<main id="main">/);
  assert.match(html,/<a class="skip-link" href="#main">/);
  assert.ok(html.includes(`rel="canonical" href="${config.origin}${r.route}"`));
  assert.match(html,/hreflang="ja"/);assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="x-default"/);
  assert.match(html,/og:image/);assert.match(html,/name="description"/);
  const ids=attr(html,'id');assert.equal(new Set(ids).size,ids.length,'duplicate IDs');
  assert.equal((html.match(/<script\b/g)||[]).length,1);
  assert.ok(!/<iframe|\bonclick=|\bonload=/.test(html),'No inline scripts or external embeds');
  if(r.page==='contact'){
   assert.equal((html.match(/<form\b/g)||[]).length,1);
   assert.match(html,/method="post" action="\/api\/inquiries"/);
   assert.match(html,/name="consent" type="checkbox" required/);
   assert.match(html,/id="inquiry-submit"[^>]*disabled/);
  }else assert.doesNotMatch(html,/<form\b/,'Only contact pages can contain a form');
  assert.ok(!/mailto:/.test(html),'No unconfigured business mailbox');
  for(const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))assert.match(m[0],/rel="noopener noreferrer"/);
  for(const value of attr(html,'href').concat(attr(html,'src'))){
   const u=new URL(decode(value),config.origin+r.route);
   if(u.origin!==config.origin) {assert.equal(u.protocol,'https:');continue;}
   const dest=u.pathname;
   if(htmlByPath.has(dest)){
    if(u.hash)assert.ok(attr(htmlByPath.get(dest),'id').includes(decodeURIComponent(u.hash.slice(1))),`Missing fragment ${u.href}`);
   }else await fs.access(path.join(dist,dest));
  }
 });
}
test('product filter categories match content',()=>{
 const category=new Set(products.map(p=>p.category));
 for(const lang of ['ja','en'])assert.deepEqual(new Set(copy[lang].filters.slice(1).map(p=>p[0])),category);
});
test('each product is rendered exactly once in each product directory',()=>{
 for(const lang of ['ja','en']){
  const html=htmlByPath.get(lang==='ja'?'/products/':'/en/products/');
  for(const p of products)assert.equal((html.match(new RegExp(`id="${p.id}"`,'g'))||[]).length,1);
 }
});
test('home leads with an explorable product and retains source-aware catalogue routes',()=>{
 for(const prefix of ['/','/en/']){
  const html=htmlByPath.get(prefix);
  const hero=html.indexOf('class="hero container lab-hero"'),explore=html.indexOf('id="explore"'),collection=html.indexOf('class="container lab-collection"'),proof=html.indexOf('class="lab-evidence-band"');
  assert.ok(hero>=0&&hero<explore&&explore<collection&&collection<proof);
  assert.equal((html.match(/class="lab-product-card"/g)||[]).length,products.length);
  assert.equal((html.match(/data-studio-choice=/g)||[]).length,products.length);
  for(const p of products){assert.ok(html.includes(`data-studio-choice="${p.id}"`));assert.ok(html.includes(`data-lab-select="${p.id}"`));assert.ok(html.includes(`${prefix}products/${p.id}/`));}
  assert.match(html,/data-lab-proof/);assert.match(html,/data-lab-code/);assert.match(html,/data-lab-begin hidden/);
  assert.doesNotMatch(html,/class="product-ribbon"|class="manifesto/);
 }
});
test('Genie license and setup limits are explicit',()=>{
 const p=products.find(p=>p.id==='genie');assert.match(p.ja.license,/未設定/);assert.match(p.en.license,/no project-wide/);
 assert.equal(p.repo,'https://github.com/FORIFOR/genie');
});
test('Agent Team does not claim a benchmark advantage',()=>{
 const p=products.find(p=>p.id==='agent-team');assert.match(p.ja.scope,/高品質とはまだ言えません/);assert.match(p.en.scope,/advantage.*not been established/i);
});
test('Oathra does not conflate speech with system registration',()=>{
 const p=products.find(p=>p.id==='oathra');assert.match(p.ja.scope,/会話上の合意.*登録は別/);
});
test('AI Secure does not claim production enforcement',()=>{
 const p=products.find(p=>p.id==='aisecure');assert.match(p.ja.scope,/監視/);assert.match(p.ja.scope,/遮断/);
});
test('product previews use real local project assets',async()=>{
 const html=htmlByPath.get('/products/');
 assert.equal((html.match(/class="product-preview/g)||[]).length,products.length);
 for(const p of products){assert.ok(p.preview);await fs.access(path.join(root,'public',p.preview));assert.match(html,new RegExp(`src="${p.preview.replaceAll('/','\\/') }"`));}
});
test('private inquiry is localized, explicit and retains the existing fallback',()=>{
 const html=htmlByPath.get('/contact/');assert.ok(html.includes(contactDestination(config,'ja').replaceAll('&','&amp;')));
 assert.match(html,/送信ボタンを押すまで/);assert.match(html,/保存が完了した後/);
 assert.match(html,/name="consent" type="checkbox" required/);
 assert.doesNotMatch(html,/name="consent"[^>]*checked|id="copy-brief"/);
});
test('general pages keep their no-telemetry script and inquiry requests stay separate',async()=>{
 const js=await fs.readFile(path.join(dist,'assets/site.js'),'utf8');
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie/);
 assert.match(js,/clipboard\.writeText/);assert.match(js,/Automatic copying is unavailable/);
 const form=await fs.readFile(path.join(dist,'assets/inquiry-form.mjs'),'utf8');
 assert.doesNotMatch(form,/sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|https:\/\//);
 assert.match(form,/fetch\('\/api\/inquiries'/);assert.match(form,/r\.status===201/);
});
test('custom 404 is noindex rather than soft-success',async()=>{
 const html=await fs.readFile(path.join(dist,'404.html'),'utf8');assert.match(html,/name="robots" content="noindex"/);
});
test('sitemap has every published route once and excludes 404',async()=>{
 const xml=await fs.readFile(path.join(dist,'sitemap.xml'),'utf8');assert.equal((xml.match(/<loc>/g)||[]).length,routes.length);assert.doesNotMatch(xml,/404\.html/);
 for(const {route}of routes)assert.ok(xml.includes(config.origin+route));
});
test('OG image is an actual 1200 by 630 PNG',async()=>{
 const b=await fs.readFile(path.join(dist,'assets/og.png'));assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),1200);assert.equal(b.readUInt32BE(20),630);
});
test('Cloudflare global security headers and apex redirection are included',async()=>{
 const h=await fs.readFile(path.join(dist,'_headers'),'utf8');assert.match(h,/connect-src 'none'/);assert.match(h,/frame-ancestors 'none'/);assert.match(h,/form-action 'none'/);
 const r=await fs.readFile(path.join(dist,'_redirects'),'utf8');assert.match(r,/^\/ja\/ \/ 301/m);const w=await fs.readFile(path.join(root,'worker.js'),'utf8');assert.match(w,/www\.reachmade\.com/);assert.match(w,/reachmade\.com/);
});
test('deployment config has no account tokens or automatic domain writes',async()=>{
 const w=JSON.parse(await fs.readFile(path.join(root,'wrangler.jsonc'),'utf8'));assert.equal(w.name,'reachmade');assert.equal(w.main,'worker.js');assert.equal(w.assets.directory,'./dist');assert.equal(w.assets.binding,'ASSETS');assert.equal(w.assets.run_worker_first,true);assert.ok(!w.routes&&!w.account_id&&!w.api_token);
});
test('source provenance covers all products',async()=>{
 const s=JSON.parse(await fs.readFile(path.join(root,'docs/content-sources.json'),'utf8'));assert.equal(s.products.length,products.length);assert.match(s.method,/not rerun/);
});