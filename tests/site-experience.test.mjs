import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { products } from '../src/products.mjs';
import { copy } from '../src/copy.mjs';
import { improveCopy, productNavigation, contactDestination } from '../src/site-experience.mjs';
const config=JSON.parse(await fs.readFile(new URL('../site.config.json',import.meta.url),'utf8'));
const read=path=>fs.readFile(new URL('../dist/'+path,import.meta.url),'utf8');
const escape=s=>s.replaceAll('&','&amp;');
for(const language of ['ja','en']) {
 const prefix=language==='ja'?'':'en/';
 test(`${language}: all six destinations appear in generated product actions`,async()=>{
  const html=await read(prefix+'products/index.html');
  for(const product of products) {
   const n=productNavigation(product,language);
   assert.ok(html.includes(`href="${escape(n.site)}"`),product.id);
   assert.ok(html.includes(`href="${escape(n.demo)}"`),product.id);
   assert.ok(html.includes(n.demoLabel),product.id);
  }
  assert.match(html,/purpose-index/);
  assert.doesNotMatch(html,/href="https:\/\/ai-meeting\.reachmade\.com\/"/);
 });
 test(`${language}: inquiry is on-page, consented and has a localized owned destination`,async()=>{
  const html=await read(prefix+'contact/index.html');
  assert.ok(html.includes(escape(contactDestination(config,language))));
  assert.match(html,/id="reachmade-inquiry"/);
  assert.match(html,new RegExp(`data-language="${language}"`));
  assert.match(html,/action="\/api\/inquiries"/);
  assert.match(html,/id="inquiry-result" role="status"/);
  assert.doesNotMatch(html,/name="consent"[^>]*checked/);
 });
 test(`${language}: privacy describes embedded same-origin media and intake storage`,async()=>{
  const html=await read(prefix+'privacy/index.html');
  assert.match(html,language==='ja'?/同じドメイン/:/own domain/);
  assert.match(html,/Google Cloud/);
  assert.doesNotMatch(html,/動画埋め込みを入れていません|no advertising or analytics tags, external fonts, or embedded video/);
 });
 test(`${language}: examples and profile are generated with their limitations`,async()=>{
  assert.match(await read(prefix+'work/index.html'),/case-studies/);
  assert.match(await read(prefix+'services/index.html'),/service-examples/);
  assert.match(await read(prefix+'about/index.html'),/profile-proof/);
 });
}
test('copy enhancement does not mutate the original registry',()=>{
 const before=structuredClone(copy);const after=improveCopy(copy);
 assert.deepEqual(copy,before);assert.notEqual(after.ja.tagline,copy.ja.tagline);
 assert.throws(()=>productNavigation(products[0],'fr'),TypeError);
 const unknown={id:'constructor',site:'https://example.org/',demo:'https://example.org/demo',ja:{demoLabel:'Demo'}};
 assert.equal(productNavigation(unknown,'ja').site,unknown.site);
});
