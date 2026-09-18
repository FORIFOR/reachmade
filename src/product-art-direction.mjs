/** Six product-specific compositions around existing, unmodified recording evidence.
 * Build-time only: no simulated product execution, tracking or external requests.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const directions = Object.freeze({
  genie: 'workspace-spread',
  'ai-meeting': 'conversation-room',
  oathra: 'evidence-ledger',
  aisecure: 'preflight-desk',
  'agent-team': 'editorial-handoff',
  launchloom: 'output-cinema'
});
const copy = {
 ja: {
  category: {genie:'自分のモデルで使う、MacのAIワークスペース','ai-meeting':'話して動かすタスク管理',oathra:'発言を根拠にする、AI電話の実行基盤',aisecure:'AI利用前の確認と、根拠を辿る調査','agent-team':'Agent Team / Multibot — コードや資料をつくるAI作業アプリ',launchloom:'実録画から、公開前の素材をつくる制作基盤'},
  scope:'試す前に知っておくこと', cue:'録画の見どころ', sample:'使い方の例 · 実際の発言ログではありません',
  request:'メモから始める。', requestBody:'何を作りたいかを伝えて、結果を開く。依頼と成果物を、同じ作業場所に。',
  output:['メモ・依頼','計画・下書き・HTML'],
  voice:'「メール返信は、明日にして。」', voiceBody:'会話の内容を、確認できるタスクの変更へ。',
  voiceSteps:['話す','変更を確かめる','タスクを残す'],
  call:'相手は、何と言った？', callBody:'結果から発言まで、同じ画面で辿る。',
  evidence:[['01','発言','AIの返答ではなく、相手側の言葉。'],['02','条件','日時・金額・確定表現を見比べる。'],['03','判定','会話上の合意と、外部への登録を分ける。']],
  pre:'AIへ送る前', preBody:'内容・送信先・操作を確認する。', preLink:'送信前チェックの説明へ',
  post:'兆候を調べる', postBody:'観測・仮説・不明点を分ける。', postLink:'調査の録画を見る',
  investigation:'ここで見るのは、調査側の実演。', investigationBody:'この録画は合成ログの調査デモです。送信前チェックや実環境の遮断を示すものではありません。',
  handoff:'作る。確かめる。磨く。', roleLabel:'役割の案内 · 実行中の状態ではありません',
  roles:[['01','作成','まず、成果物の初稿を。'],['02','レビュー','確かめる視点を変える。'],['03','修正','指摘と差分を、次の版へ。']],
  teamNote:'作業記録を読む前に、何ができたかを見る。未完了の部分も残します。',
  cinema:'一つの素材。伝え方は、いくつも。', cinemaNote:'出力形式の案内です。生成済みの作例は上の録画・元資料で確認できます。',
  formats:[['01','横動画','製品を紹介する'],['02','縦動画','モバイルへ届ける'],['03','LP','価値を一ページに'],['04','投稿案','公開前に見直す']]
 },
 en: {
  category: {genie:'A Mac AI workspace for your own model','ai-meeting':'Voice-driven task management',oathra:'AI phone calls with evidence-led results',aisecure:'Preflight checks and evidence-led investigation','agent-team':'Agent Team / Multibot — an AI work app for code and documents',launchloom:'A local production workflow, from recording to launch material'},
  scope:'Before you try it', cue:'WHAT TO LOOK FOR', sample:'Usage example · not an actual conversation log',
  request:'Start with a note.', requestBody:'Describe the output. Open the result. Keep the request and the artifact in one place.',
  output:['Notes & requests','Plans, drafts & HTML'],
  voice:'“Move the email reply to tomorrow.”', voiceBody:'Turn a conversation into a task change you can review.', voiceSteps:['Speak','Review the change','Keep the task'],
  call:'What did the other party say?', callBody:'Follow the result back to the words that support it.',
  evidence:[['01','Words','The other party’s words, not the agent’s claim.'],['02','Terms','Compare dates, amounts and confirmation.'],['03','Result','Separate spoken agreement from external registration.']],
  pre:'Before sending to AI',preBody:'Review content, destination and action.',preLink:'Explore preflight checks',
  post:'Investigate a signal',postBody:'Separate observations, hypotheses and unknowns.',postLink:'Watch the investigation',
  investigation:'This recording shows investigation.',investigationBody:'A synthetic-log investigation demo. It does not demonstrate preflight checks or enforcement in a live environment.',
  handoff:'Draft. Review. Refine.',roleLabel:'Role guide · not a live execution status',
  roles:[['01','Draft','Make the first artifact.'],['02','Review','Look at it from another angle.'],['03','Revise','Keep the feedback and the changes.']],
  teamNote:'See what was made, then inspect the work behind it. Unfinished work stays visible.',
  cinema:'One source. More ways to show it.',cinemaNote:'An index of output formats, not four newly generated artifacts. Inspect the recording and source for published examples.',
  formats:[['01','Landscape film','Introduce the product'],['02','Vertical cut','Made for mobile'],['03','Landing page','Put the value on a page'],['04','Social draft','Review before publishing']]
 }
};
const paragraph = (text, cls='ad-note') => `<p class="${cls}">${escapeHTML(text)}</p>`;
const link = (url, label) => `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>`;
function required(html, pattern, label) {
 const match = html.match(pattern);
 if (!match) throw new Error(`Art direction: missing ${label}; refusing a partial hero rewrite`);
 return match[0];
}
function rail(items, cls) {
 return `<ol class="${cls}">${items.map(([index,title,body])=>`<li><span aria-hidden="true">${escapeHTML(index)}</span><div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(body)}</p></div></li>`).join('')}</ol>`;
}
/** Transform only the known generated hero. Everything after it remains untouched. */
export function artDirectProductHero(html, product, lang) {
 if (!Object.hasOwn(directions,product.id) || !Object.hasOwn(copy,lang)) throw new TypeError('Unknown art direction or locale');
 if (html.includes('data-art-direction="20260919"')) return html;
 const id=product.id, t=copy[lang];
 const section=required(html,/<section class="container owned-hero-grid">[\s\S]*?<\/section>/,'product hero');
 const heading=required(section,/<h1>[\s\S]*?<\/h1>/,'heading');
 const kicker=required(section,/<p class="owned-kicker">[\s\S]*?<\/p>/,'maturity label');
 const lead=required(section,/<p class="owned-lead">[\s\S]*?<\/p>/,'description');
 const actions=required(section,/<div class="owned-actions">[\s\S]*?<\/div>/,'CTA');
 const actionNote=required(section,/<p class="owned-action-note">[\s\S]*?<\/p>/,'post-click expectations');
 const tryNow=required(section,/<p class="owned-try-now">[\s\S]*?<\/p>/,'first-task description');
 const access=required(section,/<details class="owned-access">[\s\S]*?<\/details>/,'access conditions');
 const film=required(section,/<figure class="owned-film[\s\S]*?<\/figure>/,'original recording and provenance');
 // Keep the exact original figure: its poster, recording, source, caveats and player hooks.
 const intro=`<div class="ad-copy">${kicker}${paragraph(t.category[id],'ad-category')}${heading}${lead}<div class="ad-entry">${actions}${actionNote}</div></div>`;
 let scene;
 switch(id) {
  case 'genie':
   scene=`<div class="ad-workspace">${intro}<div class="ad-workspace-proof"><div class="ad-paper-edge">${paragraph(t.cue,'ad-label')}<strong>${escapeHTML(t.request)}</strong></div>${film}<div class="ad-workspace-result"><span>${escapeHTML(t.output[0])}</span><span aria-hidden="true">→</span><strong>${escapeHTML(t.output[1])}</strong></div></div></div>${paragraph(t.requestBody,'ad-afterword')}`;
   break;
  case 'ai-meeting':
   scene=`<div class="ad-room-head">${intro}<aside class="ad-utterance" aria-label="${escapeHTML(t.sample)}">${paragraph(t.sample,'ad-label')}<blockquote>${escapeHTML(t.voice)}</blockquote>${paragraph(t.voiceBody)}<ol>${t.voiceSteps.map((s,i)=>`<li><span aria-hidden="true">0${i+1}</span>${escapeHTML(s)}</li>`).join('')}</ol></aside></div><div class="ad-room-screen">${film}</div>`;
   break;
  case 'oathra':
   scene=`<div class="ad-call-head">${intro}<div class="ad-call-question">${paragraph(t.cue,'ad-label')}<p>${escapeHTML(t.call)}</p>${paragraph(t.callBody)}</div></div><div class="ad-ledger">${film}<aside class="ad-evidence">${rail(t.evidence,'ad-evidence-list')}</aside></div>`;
   break;
  case 'aisecure': {
   const preflight=lang==='ja'?'https://forifor.github.io/AISecure/index.ja.html#workbench':'https://forifor.github.io/AISecure/#workbench';
   scene=`<div class="ad-secure-head">${intro}<nav class="ad-security-routes" aria-label="${escapeHTML(t.category[id])}"><div><span class="ad-route-index" aria-hidden="true">01 / PREFLIGHT</span><h2>${escapeHTML(t.pre)}</h2>${paragraph(t.preBody)}${link(preflight,t.preLink)}</div><div><span class="ad-route-index" aria-hidden="true">02 / INVESTIGATION</span><h2>${escapeHTML(t.post)}</h2>${paragraph(t.postBody)}<a href="#recording">${escapeHTML(t.postLink)} <span aria-hidden="true">↓</span></a></div></nav></div><div class="ad-investigation"><aside>${paragraph('INVESTIGATION / SYNTHETIC DATA','ad-label')}<h2>${escapeHTML(t.investigation)}</h2>${paragraph(t.investigationBody)}</aside>${film}</div>`;
   break;
  }
  case 'agent-team':
   scene=`<div class="ad-team-head">${intro}</div><div class="ad-handoff">${film}<aside class="ad-role-guide">${paragraph(t.roleLabel,'ad-label')}<h2>${escapeHTML(t.handoff)}</h2>${rail(t.roles,'ad-role-list')}${paragraph(t.teamNote)}</aside></div>`;
   break;
  case 'launchloom':
   scene=`<div class="ad-cinema-head">${intro}</div><div class="ad-cinema-screen">${film}</div><div class="ad-output-wall"><h2>${escapeHTML(t.cinema)}</h2>${rail(t.formats,'ad-output-index')}${paragraph(t.cinemaNote)}</div>`;
   break;
 }
 const scope=`<div class="ad-access-row">${tryNow}${access}</div>`;
 const next=`<section class="container owned-hero-grid ad-hero" data-direction="${directions[id]}">${scene}${scope}</section>`;
 return html.replace(section,()=>next).replace('<body ', '<body data-art-direction="20260919" ');
}
/** One delivered stylesheet. Read the canonical sources so repeated builds do not append twice. */
export async function writeArtDirectionStyles(dist) {
 const assets=path.resolve(import.meta.dirname,'../public/assets');
 const [base,direction]=await Promise.all(['showcase.css','product-art-direction.css'].map(file=>fs.readFile(path.join(assets,file),'utf8')));
 await fs.writeFile(path.join(dist,'assets/showcase.css'),`${base}\n${direction}\n`);
}
