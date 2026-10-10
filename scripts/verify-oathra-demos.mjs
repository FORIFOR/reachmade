#!/usr/bin/env node
/** Local Chrome checks for Reachmade's fictional Oathra demo links and native films.
 * Run after npm run build. No app/provider calls, npm packages, or production writes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {findBrowser} from './ui-capture.mjs';
import {products} from '../src/products.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'artifacts/ui/oathra-demos');
const port = Number(process.env.OATHRA_QA_PORT || 4193);
const origin = `http://127.0.0.1:${port}`;
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-oathra-qa-'));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const demos = products.find(p => p.id === 'oathra').conceptDemos;
await fs.mkdir(out, {recursive:true});
const server = spawn(process.execPath, ['scripts/serve.mjs'], {cwd:root, env:{...process.env, PORT:String(port)}, stdio:'ignore'});
const chrome = spawn(findBrowser(), ['--headless=new', '--no-sandbox', '--hide-scrollbars', '--no-first-run', '--disable-background-networking', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], {stdio:['ignore','ignore','pipe']});
let stderr = '', socket, seq = 0, session;
chrome.stderr.on('data', bytes => { stderr += bytes; });
const pending = new Map();
const report = {checkedAt:new Date().toISOString(), revision:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(), sourceState:'working tree; see git diff', scope:'Local Reachmade presentation, native video playback and copied simulation UI. No external phone, provider, or production request.', screenshots:[], playback:[], workflows:[], externalRequests:[], errors:[]};
const call = (method, params = {}, sid = session) => new Promise((resolve, reject) => {
  const id = ++seq, timer = setTimeout(() => {pending.delete(id); reject(Error(`CDP timeout: ${method}`));}, 20000);
  pending.set(id, {resolve,reject,timer});
  socket.send(JSON.stringify({id,method,params,...(sid ? {sessionId:sid} : {})}));
});
const evaluate = async (expression, userGesture = false) => {
  const result = await call('Runtime.evaluate', {expression, userGesture, awaitPromise:true, returnByValue:true});
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
async function waitFor(expression) {
  for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await pause(100); }
  throw Error(`Not ready: ${expression}`);
}
async function screenshot(name) {
  const result = await call('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
  await fs.writeFile(path.join(out,name), Buffer.from(result.data,'base64'));
}
try {
  for (let i = 0; i < 120 && !/DevTools listening on (ws:\/\/[^\s]+)/.test(stderr); i++) await pause(100);
  const endpoint = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];
  if (!endpoint) throw Error('Chrome failed to start: '+stderr.slice(-600));
  socket = new WebSocket(endpoint);
  await new Promise((resolve,reject) => {socket.onopen=resolve; socket.onerror=reject;});
  socket.onmessage = event => {
    const message = JSON.parse(event.data), item = pending.get(message.id);
    if (message.method === 'Network.requestWillBeSent' && /^https?:/.test(message.params.request.url) && !message.params.request.url.startsWith(origin+'/')) report.externalRequests.push(message.params.request.url);
    if (!item) return;
    clearTimeout(item.timer); pending.delete(message.id);
    message.error ? item.reject(Error(JSON.stringify(message.error))) : item.resolve(message.result);
  };
  report.browser = (await call('Browser.getVersion',{},null)).product;
  const {targetId} = await call('Target.createTarget',{url:'about:blank'},null);
  session = (await call('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
  await call('Page.enable');
  await call('Network.enable');
  for (const [width,height,noScript,reduced] of [[1440,1100,false,false],[1024,1100,false,true],[390,1400,false,true],[320,1400,true,true]]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
    await call('Emulation.setScriptExecutionDisabled',{value:noScript});
    await call('Page.navigate',{url:origin+'/products/oathra/#concept-demos'});
    await waitFor('document.readyState === "complete" && !!document.querySelector("#concept-demos")');
    await evaluate('document.querySelector("#concept-demos").scrollIntoView({block:"start",behavior:"instant"})');
    await pause(500);
    const metrics = await evaluate(`(() => {
      const section=document.querySelector('#concept-demos');
      return {overflow:document.documentElement.scrollWidth>innerWidth,links:[...section.querySelectorAll('.olp-demo__action')].map(a=>({href:a.href,width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height})),videos:section.querySelectorAll('video').length,notice:section.querySelector('strong').textContent,scriptTags:document.scripts.length};
    })()`);
    assert.equal(metrics.overflow,false,`${width}px overflow`);
    assert.equal(metrics.videos,3);
    assert.equal(metrics.scriptTags,1);
    assert.equal(metrics.notice,'構想デモ・実際の発信/予約は行いません');
    metrics.links.forEach((link,i) => {assert.equal(link.href,new URL(demos[i].href,origin).href); assert.ok(link.height>=44);});
    const name = `concept-demos-${width}${noScript?'-nojs':''}.png`;
    await screenshot(name);
    report.screenshots.push({name,width,height,noScript,reduced,metrics});
  }
  await call('Emulation.setScriptExecutionDisabled',{value:false});
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/products/oathra/#concept-demos'});
  await waitFor('document.readyState === "complete" && !!document.querySelector("#concept-demos")');
  for (let i = 0; i < demos.length; i++) {
    const playback = await evaluate(`(async () => {
      const video=document.querySelectorAll('#concept-demos video')[${i}];
      video.scrollIntoView({block:'center',behavior:'instant'});
      await video.play(); await new Promise(r=>setTimeout(r,500)); video.pause();
      return {src:video.currentSrc,duration:video.duration,time:video.currentTime,width:video.videoWidth,height:video.videoHeight,error:video.error?.code||null};
    })()`, true);
    assert.equal(playback.src,origin+demos[i].src);
    assert.ok(playback.time>0 && playback.duration>=30 && playback.duration<=60);
    assert.equal(playback.error,null);
    await screenshot(`film-${demos[i].id}.png`);
    report.playback.push({id:demos[i].id,...playback});
  }
  const focus = await evaluate(`(() => {const a=document.querySelector('.olp-demo__action');a.focus();const style=getComputedStyle(a);return {active:document.activeElement===a,outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth};})()`);
  assert.equal(focus.active,true); assert.notEqual(focus.outlineStyle,'none');
  report.focus=focus;
  for (const demo of demos) {
    await call('Page.navigate',{url:origin+demo.href});
    await waitFor('typeof window.demoSnapshot === "function"');
    assert.equal(await evaluate('demoSnapshot().kind'),demo.id);
    assert.equal(await evaluate('demoSnapshot().stage'),'input');
    if (demo.id==='modify') await evaluate('document.querySelector("#scenario").value="declined";document.querySelector("#scenario").dispatchEvent(new Event("change",{bubbles:true}))');
    await evaluate('document.querySelector("[data-testid=review]").click()');
    assert.equal(await evaluate('demoSnapshot().stage'),'review','review cannot begin a call');
    await evaluate('document.querySelector("[data-testid=approve]").click()');
    assert.equal(await evaluate('demoSnapshot().stage'),'calling');
    for (let step=0;step<20 && await evaluate('demoSnapshot().stage === "calling"');step++) {
      await pause(380);
      await evaluate('document.querySelector("[data-testid=next]").click()');
    }
    const state=await evaluate('demoSnapshot()');
    assert.equal(state.stage,'result');
    assert.equal(state.result.status,demo.id==='modify'?'incomplete':'completed');
    if (demo.id==='modify') assert.equal(state.result.originalPreserved,true);
    await screenshot(`local-demo-${demo.id}-result.png`);
    report.workflows.push({kind:demo.id,stage:state.stage,result:state.result});
  }
  assert.equal(report.externalRequests.length,0,'the local presentation and simulation made no external request');
  report.status='PASS';
} catch (error) { report.status='FAIL'; report.errors.push(error.stack); process.exitCode=1; }
finally {
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  socket?.close(); chrome.kill(); server.kill(); await pause(300);
  await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});
}
console.log(JSON.stringify(report,null,2));
