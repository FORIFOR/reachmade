/** Runs the shipped form controller with a deterministic DOM fixture, not a browser. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {inquiryContext,canInsertInquiryTemplate} from '../public/assets/inquiry-context.mjs';
const source=(await fs.readFile(new URL('../public/assets/inquiry-form.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
class Element {
 constructor(value=''){this.value=value;this.dataset={};this.listeners={};this.checked=false;this.disabled=false;this.hidden=false;this.textContent='';this.attributes={};}
 addEventListener(type,fn){this.listeners[type]=fn;}
 async fire(type){await this.listeners[type]?.({preventDefault(){}});}
 focus(){this.focused=true;}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
}
async function fixture({hash='#service-ai-character',search='',lang='ja',reply=async()=>new Response('{"receipt":"AM-1234ABCD"}',{status:201})}={}){
 const fields=Object.fromEntries(['name','email','organization','useCase','message','consent','website'].map(k=>[k,new Element(k==='useCase'?'custom':'')]));
 const nodes=Object.fromEntries(['reachmade-inquiry','inquiry-submit','inquiry-readiness','inquiry-result','inquiry-reconnect','inquiry-entry','inquiry-entry-label','inquiry-use-template','inquiry-template-status'].map(k=>[k,new Element()]));
 const form=nodes['reachmade-inquiry'],fieldset=new Element();form.dataset.language=lang;
 form.elements={namedItem:k=>fields[k]};form.querySelector=()=>fieldset;form.reportValidity=()=>true;
 form.reset=()=>{for(const [key,field]of Object.entries(fields)){field.value=key==='useCase'?'custom':'';field.checked=false;}};
 const location={hash,search},window=new Element(),requests=[];let serial=0;
 vm.runInNewContext(source,{
  document:{querySelector:s=>nodes[s.slice(1)]},window,location,inquiryContext,canInsertInquiryTemplate,AbortSignal,
  crypto:{randomUUID:()=>`12345678-1234-4123-8123-${String(++serial).padStart(12,'0')}`},
  FormData:class {get(k){return k==='consent'?(fields[k].checked?'on':null):fields[k].value;}},
  fetch:async(url,init)=>{requests.push({url,init});return url.endsWith('/status')?new Response('{"available":true}',{status:200}):reply();},
 });
 await flush();
 return {fields,nodes,form,fieldset,location,window,requests,template:()=>nodes['inquiry-use-template'].fire('click'),navigate:async hash=>{location.hash=hash;await window.fire('hashchange');},submit:()=>form.fire('submit')};
}
for(const lang of ['ja','en']){
 test(`${lang}: shipped form controller requires template intent and preserves drafts across context navigation`,async()=>{
  const f=await fixture({lang});
  assert.equal(f.nodes['inquiry-entry'].hidden,false);assert.equal(f.fields.message.value,'');assert.equal(f.fields.consent.checked,false);
  assert.deepEqual(f.requests.map(x=>x.url),['/api/inquiries/status']);
  await f.template();assert.equal(f.fields.message.value,inquiryContext('#service-ai-character','',lang).message);
  assert.equal(f.fields.message.focused,true);f.fields.message.value+='\nUser-owned detail';const saved=f.fields.message.value;
  await f.template();await f.navigate('#product-ai-meeting');await f.template();assert.equal(f.fields.message.value,saved);assert.equal(f.fields.useCase.value,'custom');
  await f.navigate('#reachmade-inquiry');assert.equal(f.nodes['inquiry-entry'].hidden,false);assert.equal(f.fields.message.value,saved);
  await f.navigate('#service-ai-character');await f.navigate('#product-ai-meeting');assert.equal(f.fields.message.value,saved);
  assert.equal(f.requests.length,1);assert.equal(f.fields.consent.checked,false);
 });
 test(`${lang}: legacy product query survives the new form and maps to the approved backend topic`,async()=>{
  for(const [product,expected]of [['ai-meeting','tasks'],['noa','custom'],['genie','genie']]){
   const f=await fixture({hash:'',search:`?product=${product}`,lang});await f.template();assert.equal(f.fields.useCase.value,expected);assert.equal(f.requests.length,1);
  }
 });
}
test('pending and unconfirmed submissions retain work and cannot be templated or sent again',async()=>{
 let release;const f=await fixture({reply:()=>new Promise(resolve=>{release=resolve;})});
 await f.template();f.fields.name.value='Local QA';f.fields.email.value='qa@example.invalid';f.fields.consent.checked=true;const saved=f.fields.message.value;
 const pending=f.submit();await flush();assert.equal(f.fieldset.disabled,true);assert.equal(f.form.dataset.state,'sending');
 await f.navigate('#product-genie');await f.template();await f.submit();assert.equal(f.fields.message.value,saved);assert.equal(f.requests.filter(x=>x.url==='/api/inquiries').length,1);
 release(new Response('{"error":"UNAVAILABLE"}',{status:503}));await pending;
 assert.equal(f.form.dataset.state,'unconfirmed');assert.equal(f.nodes['inquiry-submit'].disabled,true);assert.equal(f.fields.message.value,saved);
 await f.submit();await f.template();assert.equal(f.requests.filter(x=>x.url==='/api/inquiries').length,1);assert.equal(f.fields.message.value,saved);
});
test('accepted receipt resets consent/message and template cannot silently repopulate accepted inquiry',async()=>{
 const f=await fixture({hash:'#product-noa'});await f.template();f.fields.name.value='Local QA';f.fields.email.value='qa@example.invalid';f.fields.consent.checked=true;await f.submit();
 assert.equal(f.form.dataset.state,'accepted');assert.equal(f.nodes['inquiry-result'].dataset.receipt,'AM-1234ABCD');assert.equal(f.fields.message.value,'');assert.equal(f.fields.consent.checked,false);
 await f.template();assert.equal(f.fields.message.value,'');assert.equal(f.fields.consent.checked,false);
 const payload=JSON.parse(f.requests.find(x=>x.url==='/api/inquiries').init.body);assert.equal(payload.useCase,'custom');
 assert.deepEqual(Object.keys(payload).sort(),['consent','email','language','message','name','organization','requestId','useCase','website'].sort());
});

test('same-page form jump preserves newer fragment context over an older query',async()=>{
 const f=await fixture({hash:'',search:'?product=genie'});
 await f.navigate('#product-noa');await f.navigate('#reachmade-inquiry');await f.template();
 assert.equal(f.fields.useCase.value,'custom');assert.match(f.fields.message.value,/Noa/);assert.doesNotMatch(f.fields.message.value,/Genie/);
});

test('existing non-default topic prevents template insertion even with an empty message',async()=>{
 const f=await fixture();f.fields.useCase.value='genie';await f.template();assert.equal(f.fields.useCase.value,'genie');assert.equal(f.fields.message.value,'');
});
for(const [status,payload]of [[200,{receipt:'AM-1234ABCD'}],[201,{receipt:'invalid'}]])test(`controller rejects false receipt boundary ${status}/${payload.receipt}`,async()=>{
 const f=await fixture({reply:async()=>new Response(JSON.stringify(payload),{status})});await f.template();f.fields.name.value='Local QA';f.fields.email.value='qa@example.invalid';f.fields.consent.checked=true;await f.submit();
 assert.equal(f.form.dataset.state,'unconfirmed');assert.equal(f.nodes['inquiry-result'].dataset.receipt,undefined);assert.equal(f.nodes['inquiry-submit'].disabled,true);
});
