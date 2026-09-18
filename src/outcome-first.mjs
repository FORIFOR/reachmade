/** Final, narrowly scoped page composition. Real proof stays intact. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {renderOrbit,ORBIT_CSS,escapeHTML as esc} from '../public/assets/orbit-study.mjs';
export const OUTCOME_VERSION='20260919-outcome-1';
const MARK='/* REACHMADE_OUTCOME_FIRST */';
const IDS=['genie','ai-meeting','oathra','aisecure','agent-team','launchloom'];
const arrow='<span aria-hidden="true">↗</span>';
export function renderOutcomeHero(lang){
 if(!['ja','en'].includes(lang))throw new TypeError('Unsupported locale');
 const ja=lang==='ja',base=ja?'':'/en',t=(a,b)=>ja?a:b;
 return `<section class="hero container lab-hero outcome-hero"><div class="outcome-opening"><div class="hero-copy"><p class="eyebrow">REACHMADE / INDEPENDENT AI STUDIO</p><h1>${t('思いついたら、<br>使えるかたちに。','From an idea.<br>To something real.')}</h1></div><div class="outcome-intro"><p>${t('メモを、計画に。会話を、タスクに。<br>録画を、伝わる紹介素材に。','Notes into plans. Conversations into tasks.<br>Recordings into launch material.')}</p><div class="hero-actions"><a class="button" href="#explore">${t('プロダクトを選ぶ','Explore six products')}${arrow}</a><a class="outcome-text-link" href="${base}/products/genie/">${t('まずはGenieから','Start with Genie')} →</a></div></div></div>
 <div class="outcome-live" id="live-example">${renderOrbit(lang,'home-orbit')}</div><div class="outcome-bridge"><span>${t('「使えるかたち」を、まずは手元で。','Something real, right in your browser.')}</span><p>${t('上の作例は自由に操作・保存できます。<br>実際のAI製品の録画と導入先は、この下へ。','Play with the example above and keep a copy.<br>Real AI product recordings and setup follow below.')}</p><a href="#explore">${t('プロダクトを見る','Meet the products')} ↓</a></div></section>`;
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
 genie:{url:'https://github.com/FORIFOR/genie/blob/main/docs/TESTING.ja.md',enUrl:'https://github.com/FORIFOR/genie/blob/main/docs/TESTING.md',ja:['セットアップを始める','Mac・ローカルサービス・モデル設定が必要です。'],en:['Open the setup guide','Requires a Mac, local services and a configured model.']},
 'ai-meeting':{url:'https://ai-meeting.web.app/#tasks',ja:['登録なしでタスクを試す','文字入力のタスク画面。音声体験は別条件です。'],en:['Try a task without signing up','Japanese text task UI. Voice has separate access conditions.']},
 oathra:{url:'https://forifor.github.io/oathra/check.html',ja:['サンプルの根拠を照合する','公開サンプルの検証。電話は発信しません。'],en:['Inspect a sample transcript','Public sample verification. No phone call is placed.']},
 aisecure:{url:'https://forifor.github.io/AISecure/try.html',ja:['合成ログの調査を試す','合成データのデモ。実環境の監視・遮断は行いません。'],en:['Investigate a synthetic case','Synthetic-data demo. No monitoring or enforcement.']},
 'agent-team':{url:'https://forifor.github.io/Multibot/ja/',enUrl:'https://forifor.github.io/Multibot/',ja:['実モデルの作業記録を見る','過去の実行記録を開きます。新しいAI実行は始まりません。'],en:['Read a real-model work record','An existing run record, not a new AI execution.']},
 launchloom:{url:'https://forifor.github.io/Launchloom/ja/',enUrl:'https://forifor.github.io/Launchloom/',ja:['生成済みの素材を開く','既存の作例を閲覧。SNSへの投稿は行いません。'],en:['Open generated launch material','Existing examples. Nothing is published to a social account.']}
});
export function addDirectStarts(html,lang){
 if(!['ja','en'].includes(lang))throw new TypeError('Unsupported locale');
 let count=0;
 html=html.replace(/<a\b([^>]*\bdata-studio-choice="([^"]+)"[^>]*)>/g,(tag,attrs,id)=>{
  const d=DIRECT_STARTS[id];if(!d)throw new Error('Unknown product in explorer');count++;
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
 html=html.replace('<div class="ad-copy">',`<div class="ad-copy"><p class="outcome-product-promise">${esc(subtitles[id][ja?0:1])}</p>`);
 const actionNote=html.match(/<p class="owned-action-note">[\s\S]*?<\/p>/);
 if(!actionNote)throw new Error('Missing access explanation');
 const choice=`<div class="outcome-try"><button type="button" data-outcome-sample hidden>${t('まず、操作サンプルを試す','Try the guided sample first')} <span aria-hidden="true">→</span><small>${t('サンプル内のみ。AI実行・外部送信なし。','Sample only. No AI run or external action.')}</small></button></div>`;
 html=html.replace(actionNote[0],()=>actionNote[0]+choice);
 // A secondary kept example, never relabelled as an actual Genie output.
 if(id==='genie'){
  const marker='<footer class="container owned-footer">';
  if(!html.includes(marker))throw new Error('Missing product footer');
  const sample=`<section class="container outcome-kept-example"><div class="outcome-section-heading"><p class="eyebrow">PLAY. CHANGE. KEEP.</p><h2>${t('説明を読むだけでなく、<br>動くものに触れてみる。','Not just an explanation.<br>Something you can touch.')}</h2><p>${t('操作・保存できる、手書きの作例を用意しました。Genie本体の実行は上の導入手順から。','A hand-authored example to play with and keep. Use the setup guide above for Genie itself.')}</p></div>${renderOrbit(lang,'genie-orbit')}</section>`;
  html=html.replace(marker,()=>sample+marker);
 }
 return html.replace('<body ',`<body data-outcome-first="${OUTCOME_VERSION}" `);
}
export async function writeOutcomeFirst(dist,products){
 if(products.length!==6||new Set(products.map(p=>p.id)).size!==6||products.some(p=>!IDS.includes(p.id)))throw new TypeError('Expected six products');
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
 await fs.writeFile(path.join(assets,'showcase.css'),css.split(MARK)[0].trimEnd()+`\n${MARK}\n${ORBIT_CSS}\n${finish}`);
 await fs.writeFile(path.join(assets,'showcase.mjs'),js.split(MARK)[0].trimEnd()+`\n${MARK}\nimport('./outcome-controls.mjs').catch(()=>{document.documentElement.dataset.outcomeControls='unavailable';});\n`);
}
