#!/usr/bin/env node
/** Optional real-browser QA. Node >=22 + installed Chrome; no npm dependencies. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {findBrowser} from './ui-capture.mjs';
import {createDraft,exportDraft} from '../public/assets/sample-draft.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(root,process.env.SAMPLE_QA_OUT||'artifacts/ui/oss');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const port=Number(process.env.SAMPLE_QA_PORT||4186),origin=`http://127.0.0.1:${port}`;
const report={status:'FAIL',command:'node scripts/verify-sample.mjs',revision:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(),environment:{node:process.version,os:`${os.platform()} ${os.release()} ${os.arch()}`},checks:[],blocked:['real OS Japanese IME','real browser 200% zoom (CSS zoom proxy is measured separately)','physical iPhone/Safari and VoiceOver','human usability and comparative editor run','actual inquiry backend persistence/idempotency']};
await fs.mkdir(out,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'reachmade-qa-'));
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:'ignore'});
const chrome=spawn(process.env.CHROME_BIN||findBrowser(),['--headless','--no-sandbox','--disable-gpu','--no-first-run','--disable-background-networking','--disable-component-update','--disable-sync','--disable-default-apps','--metrics-recording-only','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='',socket,seq=0,session,postMode='unknown',postCount=0;
const pending=new Map(),events=new Map();
chrome.stderr.on('data',b=>{stderr+=b;});
const call=(method,params={},sid=session)=>new Promise((resolve,reject)=>{
 const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error(`CDP timeout: ${method}`));},15000);
 pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));
});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const waitFor=async expression=>{for(let i=0;i<80;i++){if(await evaluate(expression))return;await pause(100);}throw Error(`Not ready: ${expression}`);};
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const key=async(key,code=key,extra={})=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{}),windowsVirtualKeyCode:({Tab:9,Enter:13,Backspace:8})[key]||0,...extra});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:({Tab:9,Enter:13,Backspace:8})[key]||0,...extra});};
const fill=async(selector,text)=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus();document.querySelector(${JSON.stringify(selector)}).select()`);await key('Backspace');if(text)await call('Input.insertText',{text});};
const shot=async name=>{await evaluate(`document.querySelector('.lab-hands')?.scrollIntoView({block:'start',behavior:'instant'})`);const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,name),Buffer.from(r.data,'base64'));};
const record=(name,observed)=>report.checks.push({name,status:'PASS',observed});
async function navigate(route){await call('Page.navigate',{url:origin+route});await waitFor(`document.readyState==='complete' && !!document.querySelector('[data-lab-try]')`);}
async function importFile(filename){await call('DOM.enable');const {root:doc}=await call('DOM.getDocument');const {nodeId}=await call('DOM.querySelector',{nodeId:doc.nodeId,selector:'[data-draft-file]'});await call('DOM.setFileInputFiles',{nodeId,files:[filename]});}
try{
 for(let i=0;i<100&&!/DevTools listening on (ws:\/\/[^\s]+)/.test(stderr);i++)await pause(100);
 const endpoint=/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];if(!endpoint)throw Error(`Chrome did not start: ${stderr.slice(-1000)}`);
 socket=new WebSocket(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
 socket.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id){const item=pending.get(msg.id);if(!item)return;clearTimeout(item.timer);pending.delete(msg.id);msg.error?item.reject(Error(JSON.stringify(msg.error))):item.resolve(msg.result);}else events.get(msg.method)?.(msg.params,msg.sessionId);};
 report.environment.browser=await call('Browser.getVersion',{},null);
 const {targetId}=await call('Target.createTarget',{url:'about:blank'},null);session=(await call('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
 await call('Page.enable');await call('Runtime.enable');
 const consoleErrors=[];events.set('Runtime.exceptionThrown',e=>consoleErrors.push(e.exceptionDetails));
 events.set('Fetch.requestPaused',async e=>{
  try{
   const url=new URL(e.request.url);
   if(url.origin!==origin){await call('Fetch.failRequest',{requestId:e.requestId,errorReason:'BlockedByClient'});return;}
   if(url.pathname.startsWith('/api/inquiries')){
    const statusOnly=url.pathname.endsWith('/status');if(!statusOnly)postCount++;
    const code=statusOnly?200:postMode==='accepted'?201:postMode==='rejected'?400:503;
    const data=statusOnly?{available:true}:code===201?{receipt:'AM-1234ABCD'}:{error:code===400?'INVALID_INPUT':'UNAVAILABLE'};
    await call('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:code,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(data)).toString('base64')});return;
   }
   await call('Fetch.continueRequest',{requestId:e.requestId});
  }catch(error){report.interceptionError=error.message;}
 });
 await call('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await call('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out,eventsEnabled:true},null);
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 for(let i=0;i<60;i++){try{if((await fetch(origin)).ok)break;}catch{}await pause(100);}
 await navigate('/');await click('[data-lab-begin]');await waitFor(`!!document.querySelector('[data-draft-text]')`);
 record('home sample entry',{editable:true});await shot('sample-home.png');
 await navigate('/products/genie/');await click('[data-outcome-sample]');await waitFor(`!!document.querySelector('[data-draft-text]')`);
 assert.equal(await evaluate(`document.activeElement.className`),'lab-hands-heading');
 await key('Tab');assert.equal(await evaluate(`document.activeElement.hasAttribute('data-draft-text')`),true);
 // Empty failure, recover using real browser text input (no textarea value assignment).
 await fill('[data-draft-text]','');await key('Tab');await key('Enter');
 assert.match(await evaluate(`document.querySelector('[data-draft-status]').textContent`),/入力/);
 const tooLong='長'.repeat(4001);await fill('[data-draft-text]',tooLong);await click('[data-next]');
 assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value.length`),4001);
 assert.match(await evaluate(`document.querySelector('[data-draft-status]').textContent`),/4,000/);
 record('empty and oversized recovery',{oversizedRetained:4001});
 const text='\n日本語の手動編集 😀\n\n<script>alert("not executed")</script>\n'+('長い説明と確認事項。'.repeat(60))+'\n末尾  ';
 await fill('[data-draft-text]',text);
 await call('Input.imeSetComposition',{text:'にほんご',selectionStart:5,selectionEnd:5});await call('Input.insertText',{text:'日本語'});
 assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),text+'日本語');
 record('CDP composition commit',{retained:true,osIME:'BLOCKED'});
 // Restore exact fixture after exercising browser composition; OS candidate UI not tested.
 await fill('[data-draft-text]',text);await key('Tab');await key('Enter');
 assert.equal(await evaluate(`document.activeElement.className`),'lab-hands-heading');
 await key('Tab');await key('Tab');await key('Enter');
 assert.equal(await evaluate(`document.querySelector('[data-next]').disabled`),true);
 await key('Tab','Tab',{modifiers:8});await key('Enter');await key('Tab');await key('Tab');await key('Enter');
 assert.equal(await evaluate(`document.querySelector('[data-draft-preview]').textContent`),text);
 await shot('sample-review-ja.png');await key('Tab');await key('Enter');
 const exported=await evaluate(`document.querySelector('[data-draft-export]').value`);
 assert.equal(exported,exportDraft(createDraft({product:'genie',language:'ja',text})).text);
 await shot('sample-export-ja.png');
 await fs.rm(path.join(out,'reachmade-genie-sample.md'),{force:true});await click('[data-download]');
 let downloaded;for(let i=0;i<80;i++){try{downloaded=await fs.readFile(path.join(out,'reachmade-genie-sample.md'),'utf8');if(downloaded===exported)break;}catch{}await pause(100);}
 assert.equal(downloaded,exported);record('keyboard edit-review-export',{bytes:Buffer.byteLength(downloaded),download:'reachmade-genie-sample.md',leadingNewlinePreserved:true});
 // Explicitly inject a browser download failure; the actual UI catches it and leaves copyable text.
 await evaluate(`window.originalCreateObjectURL=URL.createObjectURL;URL.createObjectURL=()=>{throw Error('synthetic failure')}`);await click('[data-download]');
 assert.match(await evaluate(`document.querySelector('[data-draft-status]').textContent`),/開始できません/);
 assert.equal(await evaluate(`document.querySelector('[data-draft-export]').value`),exported);
 await click('[data-select-export]');assert.equal(await evaluate(`document.activeElement.selectionEnd-document.activeElement.selectionStart`),exported.length);
 await evaluate(`URL.createObjectURL=window.originalCreateObjectURL`);record('failed download copy fallback',{textRetained:true});
 await click('[data-reset]');assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),text);
 await click('[data-mode="story"]');await click('[data-lab-try]');assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),text);
 await fill('[data-draft-text]','Other text');await importFile(path.join(out,'reachmade-genie-sample.md'));
 await waitFor(`document.querySelector('[data-draft-text]').value===${JSON.stringify(text)}`);
 const bad=path.join(out,'invalid.md');await fs.writeFile(bad,'# unrelated file');await importFile(bad);
 await waitFor(`document.querySelector('[data-draft-status]').textContent.includes('元の文章')`);
 assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),text);
 await evaluate(`document.querySelector('[data-draft-file]').dispatchEvent(new Event('cancel'))`);
 assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),text);
 // Exercise a slow read while a newer edit occurs.
 await evaluate(`window.originalFileRead=File.prototype.arrayBuffer;File.prototype.arrayBuffer=function(){return new Promise(resolve=>window.finishFileRead=()=>window.originalFileRead.call(this).then(resolve))}`);
 await importFile(path.join(out,'reachmade-genie-sample.md'));await waitFor(`typeof window.finishFileRead==='function'`);
 await fill('[data-draft-text]','Newer edit must win');await evaluate(`window.finishFileRead()`);await pause(100);
 assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),'Newer edit must win');await evaluate(`File.prototype.arrayBuffer=window.originalFileRead`);
 record('back, mode, file recovery',{invalidRetainsText:true,cancelEventRetainsText:true,lateImportDoesNotOverwrite:true});
 // Read-state controls, cancellation and strict decoding must retain existing work.
 await evaluate(`File.prototype.arrayBuffer=function(){return new Promise(resolve=>window.finishFileRead=()=>window.originalFileRead.call(this).then(resolve))}`);
 await importFile(path.join(out,'reachmade-genie-sample.md'));
 assert.equal(await evaluate(`document.querySelector('.lab-hands').dataset.importState`),'reading');
 assert.equal(await evaluate(`document.querySelector('[data-next]').disabled`),true);
 await click('[data-next]');assert.ok(await evaluate(`!!document.querySelector('[data-draft-text]')`));
 await shot('sample-import-reading.png');await click('[data-cancel-import]');
 assert.equal(await evaluate(`document.querySelector('[data-next]').disabled`),false);
 await evaluate(`window.finishFileRead()`);await pause(100);
 assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),'Newer edit must win');
 assert.match(await evaluate(`document.querySelector('[data-draft-status]').textContent`),/取り消し/);
 await shot('sample-import-cancelled.png');
 await evaluate(`File.prototype.arrayBuffer=()=>Promise.reject(Error('synthetic file failure'))`);
 await importFile(path.join(out,'reachmade-genie-sample.md'));
 await waitFor(`document.querySelector('[data-draft-status]').textContent.includes('読み取れません')`);
 assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),'Newer edit must win');
 await evaluate(`File.prototype.arrayBuffer=window.originalFileRead`);
 const corruptFile=path.join(out,'invalid-utf8.md');await fs.writeFile(corruptFile,Buffer.concat([Buffer.from(exported),Buffer.from([0xff])]));
 await importFile(corruptFile);await waitFor(`document.querySelector('[data-draft-status]').textContent.includes('UTF-8')`);
 assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),'Newer edit must win');
 await shot('sample-invalid-utf8.png');
 await importFile(path.join(out,'reachmade-genie-sample.md'));await waitFor(`document.querySelector('[data-draft-text]').value===${JSON.stringify(text)}`);
 record('pending import cancel, read failure, invalid UTF-8 and recovery',{originalRetained:true,nextDisabledWhileReading:true});
 await click('[data-next]');await click('[data-skip-exercise]');
 assert.equal(await evaluate(`document.querySelector('[data-draft-preview]').textContent`),text);
 await click('[data-next]');await click('[data-download]');await click('[data-reset]');
 assert.equal(await evaluate(`document.querySelector('[data-draft-status]').textContent`),'');
 record('optional practice and context-specific notices',{skipPreservesText:true,staleExportNoticeCleared:true});

 // Language-specific asynchronous recovery contract, including leaving during a read.
 for(const language of ['ja','en']){
  await navigate(`${language==='en'?'/en':''}/products/genie/`);await click('[data-outcome-sample]');
  const file=path.join(out,`pending-${language}.md`);
  await fs.writeFile(file,exportDraft(createDraft({product:'genie',language,text:'Imported replacement'})).text);
  await fill('[data-draft-text]','Retained draft');
  await evaluate(`window.originalFileRead=File.prototype.arrayBuffer;File.prototype.arrayBuffer=function(){return new Promise(resolve=>window.finishFileRead=()=>window.originalFileRead.call(this).then(resolve))}`);
  for(const action of ['cancel','typing','mode']){
   await importFile(file);
   assert.equal(await evaluate(`document.querySelector('.lab-hands').dataset.importState`),'reading');
   assert.equal(await evaluate(`document.querySelector('[data-next]').disabled`),true);
   if(action==='cancel')await click('[data-cancel-import]');
   if(action==='typing')await fill('[data-draft-text]','Newer draft');
   if(action==='mode'){await click('[data-mode="story"]');await click('[data-lab-try]');}
   await evaluate(`window.finishFileRead()`);await pause(100);
   assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),action==='cancel'?'Retained draft':'Newer draft');
   assert.equal(await evaluate(`document.querySelector('[data-next]').disabled`),false);
  }
  await evaluate(`File.prototype.arrayBuffer=()=>Promise.reject(Error('synthetic file failure'))`);
  await importFile(file);await waitFor(`document.querySelector('.lab-hands').dataset.importState!=='reading'`);
  assert.ok(await evaluate(`document.querySelector('[data-draft-status]').textContent.length>0`));
  assert.equal(await evaluate(`document.querySelector('[data-draft-text]').value`),'Newer draft');
  await evaluate(`File.prototype.arrayBuffer=window.originalFileRead`);
  await importFile(file);await waitFor(`document.querySelector('[data-draft-text]').value==='Imported replacement'`);
  record(`pending read recovery ${language}`,{cancel:true,newTyping:true,modeSwitch:true,readFailure:true,validRecovery:true});
 }

 // Responsive states, both languages, ordinary animation frames (no frame substitution).
 for(const lang of ['ja','en'])for(const width of [320,390,768,1024,1440,1920]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:width===390?'reduce':'no-preference'}]});
  await navigate(`${lang==='en'?'/en':''}/products/genie/`);await click('[data-outcome-sample]');await fill('[data-draft-text]',text);
  await evaluate(`document.querySelector('.lab-hands').scrollIntoView({block:'start',behavior:'instant'})`);
  const metrics=await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,editorWidth:document.querySelector('[data-draft-text]').getBoundingClientRect().width,focusOutline:getComputedStyle(document.activeElement).outlineStyle})`);
  assert.ok(metrics.scrollWidth<=metrics.width+1,JSON.stringify(metrics));assert.ok(metrics.editorWidth>100);
  await shot(`sample-${lang}-${width}.png`);record(`layout ${lang} ${width}`,metrics);
  await click('[data-next]');await click('[data-answer="0"]');await click('[data-next]');
  // Scroll down as a reader would, then activate the next action with keyboard.
  await evaluate(`document.querySelector('[data-next]').focus()`);await key('Enter');
  const bounds=await evaluate(`(()=>{const r=document.activeElement.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight,focused:document.activeElement.className};})()`);
  assert.equal(bounds.focused,'lab-hands-heading');assert.ok(bounds.top>=0&&bounds.bottom<=bounds.height,JSON.stringify(bounds));
  await evaluate(`document.querySelector('[data-reset]').focus()`);await key('Enter');
  const back=await evaluate(`(()=>{const r=document.activeElement.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight};})()`);
  assert.ok(back.top>=0&&back.bottom<=back.height,JSON.stringify(back));
  record(`focus before screenshot ${lang} ${width}`,{export:bounds,back});
 }
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.documentElement.style.zoom='2'`);
 const zoom=await evaluate(`({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,editorWidth:document.querySelector('[data-draft-text]').getBoundingClientRect().width})`);
 assert.ok(zoom.scrollWidth<=zoom.width+1);await shot('sample-css-zoom-200.png');record('CSS zoom 200% proxy (not browser zoom)',zoom);
 // No-JS evidence route still exists; editing intentionally not available.
 await call('Emulation.setScriptExecutionDisabled',{value:true});await call('Page.navigate',{url:origin+'/products/genie/'});await pause(400);
 const response=await fetch(origin+'/products/genie/'),html=response.status;assert.equal(html,200);const staticHTML=await response.text();assert.ok(staticHTML.includes('/media/originals/genie/orbit.html'));assert.ok(staticHTML.includes('data-outcome-sample hidden')); await call('Emulation.setScriptExecutionDisabled',{value:false});
 record('no-script static route',{http:html,interactiveEditing:'NOT_APPLICABLE'});
 // Local injected service responses only. No production network allowed.
 for(const mode of ['unknown','rejected','accepted']){
  postMode=mode;const before=postCount;await call('Page.navigate',{url:origin+'/contact/'});
  await waitFor(`document.querySelector('#inquiry-submit') && !document.querySelector('#inquiry-submit').disabled`);
  await fill('[name="name"]','Synthetic QA');await fill('[name="email"]','qa@example.invalid');await fill('[name="message"]','Synthetic local inquiry. Never sent externally.');await click('[name="consent"]');await click('#inquiry-submit');
  await waitFor(`document.querySelector('#reachmade-inquiry').dataset.state===${JSON.stringify(mode==='unknown'?'unconfirmed':mode)}`);
  if(mode==='unknown'){
   await click('#inquiry-reconnect');await waitFor(`!document.querySelector('#inquiry-reconnect').disabled`);
   assert.equal(await evaluate(`document.querySelector('#inquiry-submit').disabled`),true);
   await evaluate(`document.querySelector('#reachmade-inquiry').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))`);await pause(100);assert.equal(postCount,before+1);
   assert.match(await evaluate(`document.querySelector('[name="message"]').value`),/Synthetic/);
  }
  if(mode==='rejected'){
   postMode='accepted';await click('#inquiry-submit');await waitFor(`document.querySelector('#reachmade-inquiry').dataset.state==='accepted'`);
  }
  record(`inquiry ${mode}`,{mockedLocally:true,posts:postCount-before,receipt:await evaluate(`document.querySelector('#inquiry-result').dataset.receipt||null`)});
 }
 assert.equal(consoleErrors.length,0,JSON.stringify(consoleErrors));assert.equal(report.interceptionError,undefined);
 record('no uncaught browser exceptions',{count:consoleErrors.length});report.status='PASS';report.exitCode=0;
}catch(error){report.error=error.stack;report.exitCode=1;process.exitCode=1;console.error(error);}
finally{
 report.finishedAt=new Date().toISOString();
 const files=spawnSync('git',['ls-files','-co','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).stdout.split('\0').filter(Boolean);
 report.sourceHashes={};for(const file of [...new Set(files)].sort()){try{report.sourceHashes[file]=createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex');}catch{}}
 report.imageHashes={};for(const file of (await fs.readdir(out)).filter(f=>f.startsWith('sample-')&&f.endsWith('.png')).sort())report.imageHashes[file]=createHash('sha256').update(await fs.readFile(path.join(out,file))).digest('hex');await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
 if(socket){try{await call('Browser.close',{},null);}catch{}socket.close();}
 chrome.kill();server.kill();for(const item of pending.values())clearTimeout(item.timer);
 await pause(200);await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});
 console.log(`${report.status}: ${report.checks.length} checks; ${path.relative(root,out)}/browser-report.json`);
}
