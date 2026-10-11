#!/usr/bin/env node
/** Chrome checks for the localized Oathra introduction and preserved demo entry.
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
const out = path.join(root, process.env.INTRO_QA_OUT || 'artifacts/ui/oathra-intro');
const port = Number(process.env.INTRO_QA_PORT || 4195);
const origin = process.env.INTRO_QA_ORIGIN || `http://127.0.0.1:${port}`;
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'reachmade-oathra-qa-'));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const product = products.find(p => p.id === 'oathra');
await fs.mkdir(out, {recursive:true});
const server = process.env.INTRO_QA_ORIGIN ? null : spawn(process.execPath, ['scripts/serve.mjs'], {cwd:root, env:{...process.env, PORT:String(port)}, stdio:'ignore'});
const chrome = spawn(findBrowser(), ['--headless=new', '--no-sandbox', '--hide-scrollbars', '--no-first-run', '--disable-background-networking', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], {stdio:['ignore','ignore','pipe']});
let stderr = '', socket, seq = 0, session;
chrome.stderr.on('data', bytes => { stderr += bytes; });
const pending = new Map();
const report = {checkedAt:new Date().toISOString(), revision:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(), sourceState:'working tree; see git diff', scope:'Read-only Reachmade introduction presentation and native video playback. No phone/provider requests or publication.', origin, screenshots:[], playback:[], externalRequests:[], networkFailures:[], externalResponses:[], errors:[]};
const call = (method, params = {}, sid = session) => new Promise((resolve, reject) => {
  const id = ++seq, timer = setTimeout(() => {pending.delete(id); reject(Error(`CDP timeout: ${method}`));}, 45000);
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
    if (message.method === 'Network.requestWillBeSent' && /^https?:/.test(message.params.request.url) && !message.params.request.url.startsWith(origin+'/')) report.externalRequests.push({id:message.params.requestId,url:message.params.request.url,method:message.params.request.method});
    if (message.method === 'Network.loadingFailed') report.networkFailures.push(message.params);
    if (message.method === 'Network.responseReceived' && /^https?:/.test(message.params.response.url) && !message.params.response.url.startsWith(origin+'/')) report.externalResponses.push({id:message.params.requestId,url:message.params.response.url,status:message.params.response.status});
    if (!item) return;
    clearTimeout(item.timer); pending.delete(message.id);
    message.error ? item.reject(Error(JSON.stringify(message.error))) : item.resolve(message.result);
  };
  report.browser = (await call('Browser.getVersion',{},null)).product;
  const {targetId} = await call('Target.createTarget',{url:'about:blank'},null);
  session = (await call('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
  await call('Page.enable');
  await call('Network.enable');
  for (const lang of ['ja','en']) {
    const route = (lang==='en'?'/en':'')+'/products/oathra/#experience-film';
    const film = product.experienceFilms[lang];
    for (const [width,height,noScript,reduced] of [[1440,1100,false,false],[768,1100,false,true],[390,1000,false,true],[320,1100,true,true]]) {
      await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
      await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
      await call('Emulation.setScriptExecutionDisabled',{value:noScript});
      await call('Page.navigate',{url:origin+route});
      await waitFor('document.readyState === "complete" && !!document.querySelector("#experience-film")');
      await evaluate('document.querySelector("#experience-film").scrollIntoView({block:"start",behavior:"instant"})');
      await pause(400);
      const metrics=await evaluate(`(() => {
        const s=document.querySelector('#experience-film'), v=s.querySelector('video');
        return {overflow:document.documentElement.scrollWidth>innerWidth,notice:s.querySelector('#experience-film-note').textContent,src:v.querySelector('source').getAttribute('src'),poster:v.getAttribute('poster'),paused:v.paused,time:v.currentTime,controls:v.controls,autoplay:v.autoplay,preload:v.preload,links:[...s.querySelectorAll('a')].map(a=>({href:a.getAttribute('href'),lang:a.lang,height:a.getBoundingClientRect().height})),demoCount:document.querySelectorAll('#concept-demos video').length};
      })()`);
      assert.equal(metrics.overflow,false,`${lang}/${width}px overflow`);
      assert.equal(metrics.notice,film.notice);
      assert.equal(metrics.src,film.src); assert.equal(metrics.poster,film.poster);
      assert.equal(metrics.paused,true); assert.equal(metrics.time,0);
      assert.equal(metrics.controls,true); assert.equal(metrics.autoplay,false); assert.equal(metrics.preload,'none');
      const other=(lang==='ja'?'/en':'')+'/products/oathra/#experience-film';
      assert.ok(metrics.links.some(a=>a.href===other && a.lang===(lang==='ja'?'en':'ja') && a.height>=44));
      if (lang==='ja') assert.equal(metrics.demoCount,3);
      const name=`intro-${lang}-${width}${noScript?'-nojs':''}.png`;
      await screenshot(name); report.screenshots.push({name,lang,width,height,noScript,reduced,metrics});
    }
    await call('Emulation.setScriptExecutionDisabled',{value:false});
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:origin+route});
    await waitFor('document.readyState === "complete" && !!document.querySelector("#experience-film")');
    const playback=await evaluate(`(async () => {
      const video=document.querySelector('#experience-film video');video.scrollIntoView({block:'center',behavior:'instant'});
      await video.play(); await new Promise(r=>setTimeout(r,1100));video.pause();
      const first={time:video.currentTime,frames:video.getVideoPlaybackQuality().totalVideoFrames};
      // The lightweight local server has no Range response; verify full playback there.
      // Hosted preview/production uses the Worker Range contract and also verifies seeking.
      const seekTested=${Boolean(process.env.INTRO_QA_ORIGIN)};
      if(seekTested)await new Promise((resolve,reject)=>{video.addEventListener('seeked',resolve,{once:true});setTimeout(()=>reject(Error('Seek timed out')),8000);video.currentTime=22.8;});
      await video.play();await new Promise((resolve,reject)=>{if(video.ended)return resolve();video.addEventListener('ended',resolve,{once:true});setTimeout(()=>reject(Error('Ending timed out: '+video.currentTime)),30000);});
      return {src:video.currentSrc,duration:video.duration,width:video.videoWidth,height:video.videoHeight,first,seekTested,ended:video.ended,error:video.error?.code||null,decodedFrames:video.getVideoPlaybackQuality().totalVideoFrames};
    })()`,true);
    assert.equal(playback.src,origin+film.src);assert.equal(playback.duration,24);
    assert.equal(playback.width,1920);assert.equal(playback.height,1080);
    assert.ok(playback.first.time>0 && playback.first.frames>0);assert.equal(playback.ended,true);assert.equal(playback.error,null);
    await screenshot(`intro-${lang}-ended.png`);report.playback.push({lang,...playback});
    await evaluate("document.querySelector('.rd-experience-details').open=true");
    const focus=await evaluate("(() => {const a=document.querySelector('.rd-experience-links a');a.focus();return {active:document.activeElement===a,outline:getComputedStyle(a).outlineStyle};})()");
    assert.equal(focus.active,true);assert.notEqual(focus.outline,'none');
    await screenshot(`intro-${lang}-details.png`);
  }
  // The custom production domain may inject this pre-existing Cloudflare script.
  // Classify only the observed URL and require CSP to block it; never allow arbitrary external requests.
  const beacon='https://static.cloudflareinsights.com/beacon.min.js/v4bc70e2c01a94c73b74392e4234840661791215815920';
  for (const req of report.externalRequests) {
    assert.equal(req.url,beacon);assert.equal(req.method,'GET');
    assert.ok(report.networkFailures.some(f=>f.requestId===req.id && f.blockedReason==='csp'));
  }
  assert.equal(report.externalResponses.length,0);
  report.preExistingCspBlocked=report.externalRequests.length;
  report.status='PASS';
} catch (error) { report.status='FAIL'; report.errors.push(error.stack); process.exitCode=1; }
finally {
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  socket?.close(); chrome.kill(); server?.kill(); await pause(300);
  await fs.rm(profile,{recursive:true,force:true}).catch(()=>{});
}
console.log(JSON.stringify(report,null,2));
