/** A real, hand-authored browser artifact. It does not call or simulate an AI.
 * Shared by the marketing page, the standalone preview and the exported HTML.
 */
export const ORBIT_VERSION='orbit-study-1';
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const words={ja:{label:'触って遊べる、ブラウザー作例',title:'Orbit study',instruction:'速さを変える。止める。好きな色にする。',play:'動かしてみる',pause:'一時停止',speed:'速さ',palette:'配色',paper:'ペーパー',night:'ミッドナイト',save:'この作例をHTMLで保存',saved:'HTMLを保存しました。ブラウザーで開いて遊べます。',failed:'保存できませんでした。もう一度お試しください。',scope:'手書きのブラウザー作例です。Genieの生成結果や、AI実行の証明ではありません。',nojs:'静止した作例を表示しています。操作にはJavaScriptが必要です。',motion:'動きはボタンを押したときだけ始まります。',drawing:'円軌道と3つの惑星を使った抽象的な作例。科学的なシミュレーションではありません。'},en:{label:'A working browser artifact',title:'Orbit study',instruction:'Change the pace. Pause it. Make it yours.',play:'Make it move',pause:'Pause',speed:'Speed',palette:'Palette',paper:'Paper',night:'Midnight',save:'Keep this example as HTML',saved:'HTML saved. Open it in your browser to play.',failed:'Could not save. Please try again.',scope:'A hand-authored browser example. Not a Genie-generated result or evidence of AI execution.',nojs:'Showing the static example. JavaScript is needed for the controls.',motion:'Nothing moves until you press play.',drawing:'An abstract study with circular orbits and three planets, not a scientific simulation.'}};
export function orbitCopy(lang){if(!Object.hasOwn(words,lang))throw new TypeError('Unsupported language');return words[lang];}
export function renderOrbit(lang='ja',prefix='orbit'){
 const t=orbitCopy(lang);if(!/^[a-z][a-z0-9-]{0,30}$/.test(prefix))throw new TypeError('Invalid instance id');
 return `<section class="orbit-study" data-orbit-study data-orbit-theme="paper" data-orbit-motion="paused" aria-labelledby="${prefix}-title">
 <div class="orbit-top"><span class="orbit-edition">INTERACTIVE STUDY / 001</span><h2 id="${prefix}-title">${t.title}</h2><span class="orbit-local">${t.label}</span></div>
 <div class="orbit-canvas"><svg class="orbit-art" viewBox="0 0 880 450" role="img" aria-labelledby="${prefix}-drawing"><title id="${prefix}-drawing">${t.drawing}</title><g class="orbit-guide" fill="none" stroke="currentColor"><circle cx="440" cy="225" r="68"/><circle cx="440" cy="225" r="126"/><circle cx="440" cy="225" r="188"/><path d="M214 225h452M440 15v420" stroke-dasharray="2 7"/></g><g class="orbit-axis" fill="currentColor"><text x="212" y="213">W</text><text x="657" y="213">E</text><text x="451" y="24">N</text><text x="451" y="432">S</text></g><circle class="orbit-sun" cx="440" cy="225" r="29"/><circle class="orbit-sun-ring" cx="440" cy="225" r="36" fill="none"/><g class="orbit-track orbit-track-a"><circle class="orbit-planet-a" cx="508" cy="225" r="11"/><circle cx="508" cy="225" r="17" fill="none" class="orbit-halo"/></g><g class="orbit-track orbit-track-b"><circle class="orbit-planet-b" cx="440" cy="99" r="18"/><path class="orbit-planet-mark" d="M430 96l14 11M437 85l15 12"/></g><g class="orbit-track orbit-track-c"><circle class="orbit-planet-c" cx="278" cy="320" r="24"/><ellipse class="orbit-saturn-ring" cx="278" cy="320" rx="39" ry="9" transform="rotate(-25 278 320)" fill="none"/></g><g class="orbit-annotations" fill="currentColor"><text x="45" y="60">A SMALL IDEA.</text><text x="45" y="79">SOMETHING YOU CAN TOUCH.</text><text x="705" y="365">01 / PLAY</text><text x="705" y="384">02 / CHANGE</text><text x="705" y="403">03 / KEEP</text></g></svg><div class="orbit-stamp" aria-hidden="true">r<span>↗</span></div></div>
 <div class="orbit-controls" data-orbit-controls hidden><button type="button" class="orbit-toggle" data-orbit-toggle aria-pressed="false">${t.play}<span aria-hidden="true">↗</span></button><label class="orbit-speed" for="${prefix}-speed">${t.speed}<input id="${prefix}-speed" data-orbit-speed type="range" min="1" max="4" step="1" value="1"><output data-orbit-speed-value for="${prefix}-speed">1×</output></label><fieldset class="orbit-palette"><legend>${t.palette}</legend><button type="button" data-orbit-palette="paper" aria-pressed="true">${t.paper}</button><button type="button" data-orbit-palette="night" aria-pressed="false">${t.night}</button></fieldset><button type="button" class="orbit-save" data-orbit-save>${t.save}<span aria-hidden="true">↓</span></button></div>
 <div class="orbit-caption"><p>${t.scope}</p><p class="orbit-motion-note">${t.motion}</p><p role="status" data-orbit-status></p><noscript><p>${t.nojs}</p></noscript></div></section>`;
}
export function bindOrbit(root,lang='ja'){
 if(root.dataset.orbitReady)return;
 const t=orbitCopy(lang),doc=root.ownerDocument,win=doc.defaultView;
 const play=root.querySelector('[data-orbit-toggle]'),speed=root.querySelector('[data-orbit-speed]');
 const status=root.querySelector('[data-orbit-status]');let playing=false;
 const setPlaying=on=>{playing=Boolean(on);root.dataset.orbitMotion=playing?'running':'paused';play.setAttribute('aria-pressed',String(playing));play.replaceChildren(doc.createTextNode(playing?t.pause:t.play));};
 play.addEventListener('click',()=>setPlaying(!playing));
 speed.addEventListener('input',()=>{const rate=Math.max(1,Math.min(4,Number(speed.value)||1));root.style.setProperty('--orbit-duration',`${32/rate}s`);root.querySelector('[data-orbit-speed-value]').value=`${rate}×`;});
 root.querySelectorAll('[data-orbit-palette]').forEach(button=>button.addEventListener('click',()=>{root.dataset.orbitTheme=button.dataset.orbitPalette;root.querySelectorAll('[data-orbit-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
 const pauseOffscreen=()=>{if(doc.hidden)setPlaying(false);};doc.addEventListener('visibilitychange',pauseOffscreen);
 if('IntersectionObserver' in win){const observer=new win.IntersectionObserver(entries=>{if(entries.some(e=>!e.isIntersecting))setPlaying(false);});observer.observe(root);}
 root.querySelector('[data-orbit-save]').addEventListener('click',()=>{
  let url;try{const html=standaloneOrbit(lang);url=win.URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));const a=doc.createElement('a');a.href=url;a.download='reachmade-orbit-study.html';doc.body.append(a);a.click();a.remove();status.textContent=t.saved;}catch{status.textContent=t.failed;}finally{if(url)win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);}
 });
 root.querySelector('[data-orbit-controls]').hidden=false;root.dataset.orbitReady='true';
 return ()=>{setPlaying(false);doc.removeEventListener('visibilitychange',pauseOffscreen);};
}
// The export stays portable: no fetched fonts, scripts, trackers or remote models.
// Only known static markup and a validated locale are embedded.
export function standaloneOrbit(lang='ja'){
 const t=orbitCopy(lang),data=JSON.stringify(words).replace(/</g,'\\u003c');
 return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Orbit study — Reachmade</title><style>${ORBIT_CSS}body{margin:0;padding:clamp(12px,4vw,64px);background:#f3f2ec;font-family:Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif}.orbit-study{max-width:1180px;margin:auto}*{box-sizing:border-box}[hidden]{display:none!important}</style></head><body>${renderOrbit(lang,'saved-orbit')}<script>(()=>{const words=${data};const orbitCopy=${orbitCopy.toString()};const renderOrbit=${renderOrbit.toString()};const ORBIT_CSS=${JSON.stringify(ORBIT_CSS)};const standaloneOrbit=${standaloneOrbit.toString()};const bindOrbit=${bindOrbit.toString()};bindOrbit(document.querySelector('[data-orbit-study]'),${JSON.stringify(lang)});})();<\/script></body></html>`;
}
export const ORBIT_CSS=`
.orbit-study{--o-bg:#e6eadd;--o-ink:#233b34;--o-line:#a9b5a3;--orbit-duration:32s;color:var(--o-ink);background:var(--o-bg);border:1px solid #bcc5b4;overflow:hidden;isolation:isolate}
.orbit-study[data-orbit-theme=night]{--o-bg:#142b2a;--o-ink:#e5e9d9;--o-line:#54736a}
.orbit-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;padding:20px 28px;border-bottom:1px solid var(--o-line)}
.orbit-top h2{margin:0;font:500 22px/1.3 Georgia,serif;letter-spacing:-.025em;color:inherit}
.orbit-edition,.orbit-local{font:10px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.04em}.orbit-local{text-align:right}
.orbit-canvas{position:relative;overflow:hidden}.orbit-art{width:100%;height:auto;display:block;max-height:460px}.orbit-guide{color:var(--o-line);stroke-width:.8}.orbit-axis{font:9px ui-monospace,monospace;opacity:.8}.orbit-annotations{font:9px/1.5 ui-monospace,monospace;letter-spacing:1px;opacity:.75}
.orbit-sun{fill:#df7a53}.orbit-sun-ring{stroke:#d68e63;stroke-width:.7}.orbit-planet-a{fill:#67794c}.orbit-planet-b{fill:#779ea3}.orbit-planet-c{fill:#cdb671}.orbit-halo{stroke:#8a9973;stroke-width:.5}.orbit-saturn-ring{stroke:#a3935b;stroke-width:2}.orbit-planet-mark{stroke:#a6c1c1;stroke-width:2;fill:none}
.orbit-track{transform-origin:440px 225px;animation:orbit-revolve var(--orbit-duration) linear infinite;animation-play-state:paused}.orbit-track-b{animation-duration:calc(var(--orbit-duration)*1.7)}.orbit-track-c{animation-duration:calc(var(--orbit-duration)*2.6)}
.orbit-study[data-orbit-motion=running] .orbit-track{animation-play-state:running}@keyframes orbit-revolve{to{transform:rotate(360deg)}}
.orbit-stamp{position:absolute;right:26px;top:22px;width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--o-line);font:600 25px Georgia,serif}.orbit-stamp span{position:absolute;right:4px;top:2px;font:10px Arial,sans-serif}
.orbit-controls{display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px;padding:15px 24px;border-top:1px solid var(--o-line)}
.orbit-controls button{font:500 12px/1.5 Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;color:inherit;min-height:44px;cursor:pointer;border:0;background:transparent;padding:9px 13px;white-space:normal}
.orbit-controls .orbit-toggle{background:var(--o-ink);color:var(--o-bg);display:flex;align-items:center;justify-content:space-between;gap:24px;min-width:140px}
.orbit-speed{display:flex;align-items:center;gap:9px;font:11px Arial,sans-serif}.orbit-speed input{width:85px;accent-color:#557266;min-height:44px}.orbit-speed output{min-width:2ch}
.orbit-palette{display:flex;align-items:center;gap:4px;border:0;padding:0;margin:0}.orbit-palette legend{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.orbit-palette button{border:1px solid transparent}.orbit-palette button[aria-pressed=true]{border-color:var(--o-line)}
.orbit-controls .orbit-save{margin-left:auto;display:flex;gap:16px;align-items:center;border-bottom:1px solid var(--o-line);padding-inline:0}
.orbit-caption{padding:0 24px 16px;font:11px/1.7 Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;opacity:.87}.orbit-caption p{margin:0;max-width:none}.orbit-caption [role=status]:empty{display:none}.orbit-motion-note{font-size:10px}
.orbit-study :is(button,input):focus-visible{outline:3px solid #1b7bca;outline-offset:4px}
@media(max-width:700px){.orbit-top{grid-template-columns:1fr auto;padding:14px 16px;gap:8px}.orbit-local{grid-column:1/-1;text-align:left}.orbit-top h2{font-size:20px}.orbit-edition{font-size:9px}.orbit-art{width:155%;max-width:none;margin-left:-27.5%;height:290px}.orbit-annotations{display:none}.orbit-stamp{right:16px;top:16px}.orbit-controls{padding:13px 15px;gap:8px 16px}.orbit-controls .orbit-toggle{flex:1;min-width:115px}.orbit-speed{margin-left:auto}.orbit-speed input{width:64px}.orbit-palette{flex:1}.orbit-controls .orbit-save{font-size:10px;max-width:48%;gap:9px}.orbit-caption{padding:0 16px 15px;font-size:10px}.orbit-motion-note{display:none}}
@media(forced-colors:active){.orbit-study,.orbit-controls button{border:1px solid CanvasText}.orbit-track circle,.orbit-sun{fill:CanvasText}.orbit-guide{stroke:CanvasText}}
`;
export function initOrbit(doc=document){doc.querySelectorAll('[data-orbit-study]').forEach(root=>bindOrbit(root,doc.documentElement.lang.startsWith('ja')?'ja':'en'));}
if(typeof document!=='undefined')initOrbit();
