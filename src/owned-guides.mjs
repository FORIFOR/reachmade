/** Git-owned supporting pages. Real source recordings are separate from edited teasers. */
import fs from 'node:fs/promises';
import path from 'node:path';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const films = [
  ['prototype', 'genie-orbit-web.mp4', '小さなHTMLを作る', 'Build a small HTML prototype'],
  ['proposal', 'genie-web-proposal-web.mp4', 'Webページの伝え方を見直す', 'Improve a website message'],
  ['priorities', 'genie-product-film-web.mp4', '次にすることを決める', 'Choose the next steps'],
];
function frame(lang, product, suffix, title, body) {
  const ja=lang==='ja', home=ja?'/':'/en/', route=`${home}products/${product}/${suffix}/`;
  const other=`${ja?'/en/':'/'}products/${product}/${suffix}/`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | Reachmade</title><meta name="description" content="${escape(title)}"><link rel="canonical" href="https://reachmade.com${route}"><link rel="alternate" hreflang="ja" href="https://reachmade.com/products/${product}/${suffix}/"><link rel="alternate" hreflang="en" href="https://reachmade.com/en/products/${product}/${suffix}/"><link rel="alternate" hreflang="x-default" href="https://reachmade.com/products/${product}/${suffix}/"><link rel="icon" href="/assets/mark.svg"><link rel="stylesheet" href="/assets/owned-guides.css"><meta property="og:type" content="website"><meta property="og:url" content="https://reachmade.com${route}"><meta property="og:title" content="${escape(title)}"><meta property="og:image" content="https://reachmade.com/assets/products/${product}.jpg"></head><body><a class="skip-link" href="#main">${ja?'本文へ':'Skip to content'}</a><header><a href="${home}">Reachmade</a><nav aria-label="${ja?'ナビゲーション':'Navigation'}"><a href="${home}products/${product}/">${product==='genie'?'Genie':'AI Meeting'}</a><a href="${other}" lang="${ja?'en':'ja'}">${ja?'English':'日本語'}</a></nav></header><main id="main"><p class="eyebrow">${product==='genie'?'GENIE / REAL WORKFLOWS':'AI MEETING / GET STARTED'}</p><h1>${escape(title)}</h1>${body}</main><footer><a href="${home}products/${product}/">${ja?'製品ページへ戻る':'Back to the product'}</a><a href="${home}contact/">${ja?'開発を相談する':'Discuss a project'}</a><small>Reachmade · ${ja?'ページと録画はGitHubで管理しています。':'Pages and recordings are managed in GitHub.'}</small></footer></body></html>\n`;
}
export async function writeOwnedGuides(dist) {
  const manifest=JSON.parse(await fs.readFile(path.join(dist,'media/originals/manifest.json'),'utf8'));
  const has=href=>manifest.files.some(item=>item.path===href);
  const routes=[];
  for(const lang of ['ja','en']) {
    const ja=lang==='ja', home=ja?'/':'/en/';
    const cards=films.map(([id,name,titleJa,titleEn])=>{
      const src=`/media/originals/genie/assets/${name}`;
      if(!has(src))throw new Error(`Missing imported recording: ${src}`);
      const item=manifest.files.find(f=>f.path===src);
      const duration=Math.round(item.duration);
      const caption=id==='prototype'?'orbit':id==='proposal'?'proposal':'product';
      const captionPath=caption?`/media/originals/genie/assets/${caption}-${lang}.vtt`:null;
      const track=captionPath&&has(captionPath)?`<track kind="captions" srclang="${lang}" label="${ja?'日本語':'English'}" src="${captionPath}" default>`:'';
      return `<section id="${id}"><p class="eyebrow">${String(films.findIndex(f=>f[0]===id)+1).padStart(2,'0')} / ${duration}${ja?'秒':' sec'}</p><h2>${escape(ja?titleJa:titleEn)}</h2><video controls playsinline preload="none" poster="/assets/products/genie.jpg" aria-label="${escape(ja?titleJa:titleEn)}"><source src="${src}" type="video/mp4">${track}<a href="${src}">${ja?'録画ファイルを開く':'Open recording'}</a></video><p class="note">${ja?'実アプリの録画です。収録時に待ち時間・操作を編集しています。モデルの速度や結果は環境により異なります。':'Recorded in the real app. Actions and waiting were condensed for the recording. Model performance varies.'}</p><a href="${src}">${ja?'この録画を開く':'Open this recording'} ↗</a></section>`;
    }).join('');
    const outputs=manifest.files.filter(f=>f.path.startsWith('/media/originals/genie/')&&/\.(md|html)$/.test(f.path));
    const outputLinks=outputs.map(f=>`<li><a href="${encodeURI(f.path)}">${escape(decodeURIComponent(f.path.split('/').at(-1)))}</a></li>`).join('');
    const genie=`<p class="lead">${ja?'実アプリで、依頼から成果物まで。紹介用の13秒版ではなく、元の実演を確認できます。':'From a request to an artifact in the real app. These are the original published demonstrations, not the 13-second site edits.'}</p><nav class="chapters" aria-label="${ja?'実演の一覧':'Demonstrations'}">${films.map(([id,,j,e])=>`<a href="#${id}">${escape(ja?j:e)}</a>`).join('')}</nav>${cards}<section><h2>${ja?'実演で作ったもの':'Recorded outputs'}</h2><p>${ja?'録画のための架空の入力から作った成果物です。自動公開や業務成果の保証ではありません。':'Artifacts produced from fictional demonstration inputs. They do not demonstrate automatic deployment or guarantee business results.'}</p><ul>${outputLinks}</ul></section><section><h2>${ja?'自分のMacで試す':'Try it on your Mac'}</h2><p>${ja?'開発者プレビューです。アプリに加え、ローカルサービスと利用するモデルの設定が必要です。':'Developer preview. The app requires local services and a configured model.'}</p><a class="button" href="https://github.com/FORIFOR/genie/blob/main/docs/TESTING${ja?'.ja':''}.md">${ja?'セットアップ手順':'Setup guide'} ↗</a></section>`;
    const meetingVideo='/media/originals/ai-meeting/demo.mp4';
    if(!has(meetingVideo))throw new Error('Missing original AI Meeting demo');
    const meeting=`<p class="lead">${ja?'タスクを試す入口と、AIと音声で話す入口は別です。用途に合わせて選べます。':'Trying saved tasks and speaking with the AI are separate entry points. Choose the path you need.'}</p><section id="tasks"><h2>${ja?'まず、タスクを1件残す':'Save one task first'}</h2><p>${ja?'文字入力のタスク機能は登録不要です。追加・完了・延期を試し、ページを開き直して保存状態を確認してください。保存先はこのブラウザーです。':'The text task flow needs no account. Add, complete or defer a task, then reopen the page to check the saved state. This path stores tasks in this browser.'}</p><a class="button" href="https://ai-meeting.web.app/#tasks">${ja?'登録なしでタスクを試す':'Try tasks without an account'} ↗</a></section><section id="voice"><h2>${ja?'音声で会話する':'Speak with the AI'}</h2><p>${ja?'ホスト版の音声体験にはメール確認と利用時間・共有容量の条件があります。最新の利用可能状態はアプリで確認してください。タスク体験と同じ条件ではありません。':'The hosted voice experience requires verified email and is subject to time and shared-capacity limits. Check current availability in the app. It has different conditions from the text task flow.'}</p><a class="button" href="https://ai-meeting.web.app/">${ja?'音声アプリを開く':'Open the voice app'} ↗</a><p class="note">${ja?'アプリは従来の公開先で動作します。認証・保存データの移行は行っていません。':'The application keeps its existing hosting origin. Authentication and stored data have not been migrated.'}</p></section><section id="demo"><h2>${ja?'会話から保存までの実演':'A recorded voice-to-task workflow'}</h2><video controls playsinline preload="none" poster="/media/originals/ai-meeting/demo-poster.jpg" aria-label="${ja?'AI Meetingの実演':'AI Meeting demonstration'}"><source src="${meetingVideo}" type="video/mp4"><track kind="captions" srclang="${lang}" label="${ja?'日本語':'English'}" src="/media/originals/ai-meeting/demo-${lang}.vtt" default><a href="${meetingVideo}">${ja?'録画を開く':'Open recording'}</a></video><p class="note">${ja?'収録用の合成日本語入力、実Gemini応答、一部スクリプトによる提案確認を含む録画です。人による連続利用や、別のMeet・Zoom参加者への送受信を実証するものではありません。':'Recorded with synthetic Japanese input, real Gemini responses and some scripted proposal confirmations. It does not prove sustained human use or audio/video delivery to a separate Meet or Zoom participant.'}</p><a href="https://github.com/FORIFOR/AI-meeting/blob/main/docs/validation.md">${ja?'収録方法と検証範囲':'Recording method and validation scope'} ↗</a></section><section id="local"><h2>${ja?'ローカル環境で試す':'Run it locally'}</h2><p>${ja?'アバターと音声再生のプレビュー、AIとの会話、外部会議への接続では、必要な設定が異なります。':'Avatar/audio playback, AI conversation and external meeting connections require different setup.'}</p><a class="button" href="https://github.com/FORIFOR/AI-meeting/blob/main/README${ja?'.ja':''}.md">${ja?'READMEと導入手順':'README and installation'} ↗</a></section>`;
    for(const [product,suffix,title,body] of [['genie','demos',ja?'使える結果まで、実演で見る。':'See the work reach a usable result.',genie],['ai-meeting','guide',ja?'話す前に、試し方を選ぶ。':'Choose your first experience.',meeting]]) {
      const route=`${home}products/${product}/${suffix}/`,target=path.join(dist,route,'index.html');
      await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,frame(lang,product,suffix,title,body));
      routes.push({route,lang,page:`${product}-${suffix}`});
    }
  }
  return routes;
}
