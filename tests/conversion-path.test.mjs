import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {inquiryContext,inquiryContextIds,canInsertInquiryTemplate} from '../public/assets/inquiry-context.mjs';
import {parseInquiry} from '../src/inquiries.mjs';
import {products} from '../src/products.mjs';
import {serviceRouteFor} from '../src/site-content.mjs';
const read=route=>fs.readFile(new URL('../dist/'+route,import.meta.url),'utf8');
const valid={requestId:'12345678-1234-4123-8123-123456789abc',name:'Test visitor',email:'qa@example.invalid',organization:'',consent:true,website:'',language:'ja'};
for (const lang of ['ja','en']) {
 const b=lang==='ja'?'':'en/';
 test(`${lang}: every product has an evidence-to-contextual-inquiry route`,async()=>{
  const home=await read(b+'index.html'),work=await read(b+'work/index.html'),services=await read(b+'services/index.html'),contact=await read(b+'contact/index.html');
  for(const p of products){
   assert.ok(home.includes(`href="/${b}work/#${p.id}"`));
   assert.ok(work.includes(`href="/${b}contact/#product-${p.id}"`));
   assert.ok(work.includes(`href="/${b}services/#${serviceRouteFor(p.id)}"`));
   assert.ok(services.includes(`id="${serviceRouteFor(p.id)}"`));
   const ctx=inquiryContext(`#product-${p.id}`,'',lang);
   assert.doesNotThrow(()=>parseInquiry({...valid,language:lang,useCase:ctx.useCase,message:ctx.message}));
  }
  for(const id of inquiryContextIds)assert.ok(contact.includes(`id="${id}"`));
  for(const type of ['voice-ai','ai-character'])assert.ok(services.includes(`href="/${b}contact/#service-${type}"`));
  assert.match(contact,/href="#reachmade-inquiry"/);
  assert.doesNotMatch(contact,/href="https:\/\/reachmade\.com[^"\n]*#reachmade-inquiry"/);
  assert.doesNotMatch(contact,/name="consent"[^>]*checked/);
 });
 test(`${lang}: old query links and new exact fragments use the same local context`,()=>{
  for(const p of products)assert.deepEqual(inquiryContext('',`?product=${p.id}`,lang),inquiryContext(`#product-${p.id}`,'',lang));
  for(const id of ['01','02','03'])assert.deepEqual(inquiryContext('',`?service=${id}`,lang),inquiryContext(`#service-${id}`,'',lang));
  assert.equal(inquiryContext('#product-ai-meeting','',lang).useCase,'tasks');
  assert.equal(inquiryContext('#product-noa','',lang).useCase,'custom');
  for(const id of ['voice-ai','ai-character'])assert.equal(inquiryContext(`#service-${id}`,'',lang).useCase,'custom');
 });
}
test('unknown or hostile URL input never becomes a context or message',()=>{
 for(const [hash,search] of [['#service-constructor',''],['#product-__proto__',''],['','?product=%3Cscript%3E'],['#service-voice-ai%0Asecret',''],['#product-genie/../../',''],['','?message=private&email=private'],['#service-toString','']])assert.equal(inquiryContext(hash,search),null);
 assert.throws(()=>inquiryContext('','','fr'),TypeError);
 assert.equal(inquiryContext('#product-noa','?product=genie').id,'product-noa');
});
test('template only fills untouched generic inquiry; repeated and busy states preserve work',()=>{
 const empty={message:'',useCase:'custom',busy:false,unresolved:false,accepted:false};
 assert.equal(canInsertInquiryTemplate(empty),true);
 for(const patch of [{message:'User draft'},{message:inquiryContext('#service-voice-ai').message},{useCase:'genie'},{busy:true},{unresolved:true},{accepted:true}])assert.equal(canInsertInquiryTemplate({...empty,...patch}),false);
});
test('context module has no storage, networking, tracking or credential side effects',async()=>{
 const code=await fs.readFile(new URL('../public/assets/inquiry-context.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\b(fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|cookie|innerHTML)\b/);
 const form=await read('contact/index.html');assert.equal((form.match(/<script\b/g)||[]).length,1);
});
