/** Final, narrowly scoped page composition. Real proof stays intact. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {escapeHTML as esc} from '../public/assets/orbit-study.mjs';
export const OUTCOME_VERSION='20260919-outcome-1';
const MARK='/* REACHMADE_OUTCOME_FIRST */';
const IDS=['genie','ai-meeting','oathra','aisecure','agent-team','launchloom'];
const arrow='<span aria-hidden="true">↗</span>';
export function renderRecordedResult(lang, video=true){
 if(!['ja','en'].includes(lang))throw new TypeError('Unsupported locale');
 const ja=lang==='ja',t=(a,b)=>ja?a:b,base=ja?'':'/en';
 const artifact='/media/originals/genie/orbit.html',prefix='/media/originals/genie/assets/';
 // The recording carries burned-in Japanese title cards. English pages get the same
 // frame with its caption localized (scripts/make-poster-en.py); the recording itself
 // is untouched, so the scope line below says so instead of hiding it.
 const poster=ja?`${prefix}genie-orbit-poster.jpg`:'/media/derived/genie/orbit-poster-en.jpg';
 const visual=video?`<video data-outcome-real-film controls playsinline preload="none" poster="${poster}" width="1600" height="900" aria-label="${t('Genieで作例を作る実演録画','Recorded workflow creating an example in Genie')}"><source src="${prefix}genie-orbit-web.mp4" type="video/mp4"><track kind="captions" src="${prefix}orbit-${lang}.vtt" srclang="${lang}" label="${t('日本語','English')}" default><a href="${prefix}genie-orbit-web.mp4">${t('録画ファイルを開く','Open recording')}</a></video>`:`<a class="outcome-original-link" href="${artifact}" aria-label="${t('実演で作ったOrbitを開く','Open the recorded Orbit artifact')}"><img src="${poster}" width="1600" height="900" alt="${t('Genieの実演で作った惑星のHTML作例','The interactive planet artifact from the Genie demonstration')}" loading="lazy" decoding="async"></a>`;
 return `<figure class="outcome-real-result" data-outcome-recorded-result><div class="outcome-real-meta"><span>GENIE / FROM REQUEST TO ARTIFACT</span><span>${t('実演と、保存した結果','A recording. A saved result.')}</span></div><div class="outcome-real-visual">${visual}</div><figcaption><div><p class="eyebrow">FROM A SKETCH TO A LITTLE UNIVERSE</p><h2>${t('この落書き、動きます。','That sketch? It moves.')}</h2><p>${t('作成の流れを見て、できたHTMLをそのまま操作。','Watch how it was made. Open the HTML and explore it.')}</p></div><div class="outcome-real-actions"><a class="outcome-open-artifact" href="${artifact}">${t('できたものを動かす','Play with the result')} ${arrow}</a><a href="${base}/products/genie/demos/#prototype">${t('元の実演・成果物を見る','Explore the recording and artifacts')} →</a></div><p class="outcome-real-scope">${t('実アプリの公開実演と、その保存済み作例です。架空の入力を使用し、待ち時間・操作を編集しています。ここで新しいAI生成は行いません。','An original published app demonstration and its saved example. Fictional inputs; actions and waiting are edited. This page does not run a new AI generation. The recording is in Japanese — English captions are on by default, and the saved artifact is Japanese too.')}</p></figcaption></figure>`;
}
export function renderOutcomeHero(lang){
 if(!['ja','en'].includes(lang))throw new TypeError('Unsupported locale');
 const ja=lang==='ja',base=ja?'':'/en',t=(a,b)=>ja?a:b;
 return `<section class="hero container lab-hero outcome-hero"><div class="outcome-opening"><div class="hero-copy"><p class="eyebrow">REACHMADE / INDEPENDENT AI STUDIO</p><h1>${t('思いついたら、<br>使えるかたちに。','From an idea.<br>To something real.')}</h1></div><div class="outcome-intro"><p>${t('メモを、計画に。会話を、タスクに。<br>録画を、伝わる紹介素材に。','Notes into plans. Conversations into tasks.<br>Recordings into launch material.')}</p><div class="hero-actions"><a class="button" href="#explore">${t('プロダクトを選ぶ','Explore six products')}${arrow}</a><a class="outcome-text-link" href="${base}/products/genie/">${t('まずはGenieから','Start with Genie')} →</a></div></div></div>
 <div class="outcome-live" id="live-example">${renderRecordedResult(lang)}</div><div class="outcome-bridge"><span>${t('「使えるかたち」を、まずは手元で。','Something real, right in your browser.')}</span><p>${t('実演、保存した作例、導入手順まで。<br>6つの製品を、実物から選べます。','Recording, saved artifact, and setup.<br>Choose between six products, starting with the real work.')}</p><a href="#explore">${t('プロダクトを見る','Meet the products')} ↓</a></div></section>`;
}
const subtitles={
 genie:['自分のモデルで、メモを成果物に。','Your model. A note becomes an artifact.'],
 'ai-meeting':['会話のあとに、次の一手が残る。','A conversation that leaves a next step.'],
 oathra:['通話の「できた」を、発言で確かめる。','Check the words behind “done.”'],
 aisecure:['送る前も、調べるときも、根拠から。','Before sending. During review. Start with evidence.'],
 'agent-team':['ひとつの依頼に、違う視点を。','One request. More than one perspective.'],
 launchloom:['つくったものを、伝わる素材に。','You made it. Now make it seen.']
};
export const DIRECT_STARTS=Object.freeze({
 genie:{url:'/media/originals/genie/orbit.html',enUrl:'/media/originals/genie/orbit.html',ja:['実演で作ったものを動かす','保存済みのHTMLを開きます。新しいAI実行ではありません。'],en:['Open the recorded artifact','Opens the saved Japanese HTML example, not a new AI run.']},
 'ai-meeting':{url:'https://ai-meeting.web.app/#tasks',ja:['登録なしでタスクを試す','文字入力のタスク画面。音声体験は別条件です。'],en:['Try a task without signing up','Japanese text task UI. Voice has separate access conditions.']},
 oathra:{url:'https://forifor.github.io/oathra/check.html',ja:['サンプルの根拠を照合する','公開サンプルの検証。電話は発信しません。'],en:['Inspect a sample transcript','Public sample verification. No phone call is placed.']},
 aisecure:{url:'https://forifor.github.io/AISecure/try.html',ja:['合成ログの調査を試す','合成データのデモ。実環境の監視・遮断は行いません。'],en:['Investigate a synthetic case','Synthetic-data demo. No monitoring or enforcement.']},
 'agent-team':{url:'https://forifor.github.io/Multibot/ja/',enUrl:'https://forifor.github.io/Multibot/',ja:['実モデルの作業記録を見る','過去の実行記録を開きます。新しいAI実行は始まりません。'],en:['Read a real-model work record','An existing run record, not a new AI execution.']},
 launchloom:{url:'https://forifor.github.io/Launchloom/ja/',enUrl:'https://forifor.github.io/Launchloom/',ja:['生成済みの素材を開く','既存の作例を閲覧。SNSへの投稿は行いません。'],en:['Open generated launch material','Existing examples. Nothing is published to a social account.']}
});
export function addDirectStarts(html,lang){
 if(!['ja','en'].includes(lang))throw new TypeError('Unsupported locale');
 let count=0;const seen=new Set();
 html=html.replace(/<a\b([^>]*\bdata-studio-choice="([^"]+)"[^>]*)>/g,(tag,attrs,id)=>{
  if(!Object.hasOwn(DIRECT_STARTS,id)||seen.has(id))throw new Error('Unknown or repeated product in explorer');const d=DIRECT_STARTS[id];seen.add(id);count++;
  return `<a ${attrs} data-outcome-start="${esc(lang==='en'?(d.enUrl||d.url):d.url)}" data-outcome-label="${esc(d[lang][0])}" data-outcome-note="${esc(d[lang][1])}">`;
 });
 if(count!==6)throw new Error('The explorer must retain six product choices');
 const tag=/<a\b[^>]*data-lab-detail[^>]*>[\s\S]*?<\/a>/;
 if(!tag.test(html))throw new Error('Missing product entry in explorer');
 const d=DIRECT_STARTS.genie;
 return html.replace(tag,match=>`<div class="outcome-direct"><a data-outcome-start-link href="${esc(lang==='en'?d.enUrl:d.url)}" target="_blank" rel="noopener noreferrer">${esc(d[lang][0])} ${arrow}</a><p data-outcome-start-note>${esc(d[lang][1])}</p></div>${match}`);
}
export function enhanceOutcomePage(html,id,lang){
 if(!IDS.includes(id)||!['ja','en'].includes(lang))throw new TypeError('Unknown product or locale');
 if(html.includes(`data-outcome-first="${OUTCOME_VERSION}"`))return html;
 if(!html.includes('data-art-direction="20260919"'))throw new Error('Product art direction must run before outcome finishing');
 const ja=lang==='ja',t=(a,b)=>ja?a:b;
 // Source CTA, claims, scope and proof are not changed by this presentation pass.
 const match=html.match(/<div class="ad-copy">/);
 if(!match)throw new Error('Missing product copy');
 html=html.replace(/<p class="ad-category">[\s\S]*?<\/p>/,()=>`<p class="ad-category">${esc(subtitles[id][ja?0:1])}</p>`);
 const actionNote=html.match(/<p class="owned-action-note">[\s\S]*?<\/p>/);
 if(!actionNote)throw new Error('Missing access explanation');
 const choice=`<div class="outcome-try"><a data-outcome-sample href="#recording">${t('まず、操作サンプルを試す','Try the guided sample first')} <span aria-hidden="true">→</span><small>${t('サンプル内のみ。AI実行・外部送信なし。編集にはJavaScriptが必要です。','Sample only. No AI run or external action. Editing needs JavaScript.')}</small></a></div>`;
 html=html.replace(actionNote[0],()=>actionNote[0]+choice);
 // Put the original recorded output one click away; no invented output claim.
 if(id==='genie'){
  const marker='<footer class="container owned-footer">';
  if(!html.includes(marker))throw new Error('Missing product footer');
  const sample=`<section class="container outcome-kept-example"><div class="outcome-section-heading"><p class="eyebrow">SEE THE WORK. TRY THE RESULT.</p><h2>${t('録画の、その先へ。','Beyond the recording.')}</h2><p>${t('実演で保存したHTMLを、そのまま開いて操作できます。新しいAI実行は行いません。','Open and interact with the saved HTML from the recording. No new AI run is started.')}</p></div>${renderRecordedResult(lang,false)}</section>`;
  html=html.replace(marker,()=>sample+marker);
 }
 return html.replace('<body ',`<body data-outcome-first="${OUTCOME_VERSION}" `);
}
export async function writeOutcomeFirst(dist,products){
 if(products.length!==6||new Set(products.map(p=>p.id)).size!==6||products.some(p=>!IDS.includes(p.id)))throw new TypeError('Expected six products');
 await Promise.all(['media/originals/genie/orbit.html','media/originals/genie/assets/genie-orbit-web.mp4','media/originals/genie/assets/genie-orbit-poster.jpg'].map(file=>fs.access(path.join(dist,file))));
 for(const lang of ['ja','en']){
  const base=lang==='ja'?'':'en';const file=path.join(dist,base,'index.html');let html=await fs.readFile(file,'utf8');
  if(!html.includes('data-lab-experience="20260919-product-lab-1"'))throw new Error('Product Lab must run before outcome finishing');
  const hero=/<section class="hero container lab-hero">[\s\S]*?<\/section>/;
  if(!html.includes(`data-outcome-first="${OUTCOME_VERSION}"`)){
   if(!hero.test(html))throw new Error('Unknown homepage hero; refusing partial update');
   html=addDirectStarts(html.replace(hero,()=>renderOutcomeHero(lang)),lang).replace('<body ',`<body data-outcome-first="${OUTCOME_VERSION}" `);
  }
  await fs.writeFile(file,html);
  for(const p of products){const f=path.join(dist,base,'products',p.id,'index.html');await fs.writeFile(f,enhanceOutcomePage(await fs.readFile(f,'utf8'),p.id,lang));}
 }
 const assets=path.join(dist,'assets');
 const [css,js,finish]=await Promise.all(['showcase.css','showcase.mjs','outcome-first.css'].map(f=>fs.readFile(path.join(assets,f),'utf8')));
 await fs.writeFile(path.join(assets,'showcase.css'),css.split(MARK)[0].trimEnd()+`\n${MARK}\n${finish}`);
 await fs.writeFile(path.join(assets,'showcase.mjs'),js.split(MARK)[0].trimEnd()+`\n${MARK}\nimport('./outcome-controls.mjs').catch(()=>{document.documentElement.dataset.outcomeControls='unavailable';});\n`);
}
