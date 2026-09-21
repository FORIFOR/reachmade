/** A small, local product lab. These guided samples never execute an AI workflow. */
export const LAB_VERSION = '20260919-product-lab-1';
export const IDS = Object.freeze(['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']);
export const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const LAB = Object.freeze({
 genie: {ja:['考えを形に','メモから、\n仕事が始まる。','考えを渡す。下書きを開く。次の作業へ持ち出す。自分のモデルと進めるMacのワークスペース。','手元に残る下書き','メモ → 構成 → 成果物'],en:['Make something','From a note\nto a next step.','Give an idea a place to become work. A Mac workspace for drafting and revisiting artifacts with your own model.','A draft you can keep','Notes → structure → artifact']},
 'ai-meeting':{ja:['話して整理','話したことを、\n次の行動に。','考えを声にして、やることを整理。聞き違いがあり得る変更は、確認してから残します。','確認して残すタスク','会話 → 確認 → タスク'],en:['Think out loud','A conversation.\nA clear next step.','Talk through an idea and keep the work that matters. Review uncertain changes before saving them.','A confirmed next step','Conversation → review → task']},
 oathra:{ja:['電話を確かめる','「できました」に、\n確かめる手がかりを。','相手は何と言ったのか。実際に登録されたのか。電話の発言と結果を、分けて確かめる。','発言まで辿れる結果','会話 → 発言の根拠 → 確認'],en:['Check a call','Not just “done.”\nSomething to check.','What did the other party say? What was actually registered? Keep the words and the external result distinct.','A traceable call result','Conversation → evidence → review']},
 aisecure:{ja:['根拠を調べる','散らばった兆候を、\nひとつの調査に。','ログを関連づけ、観測した事実・仮説・不明点を整理。次に何を確認するかが見える。','読み返せる調査ケース','ログ → 関連づけ → 調査'],en:['Follow the evidence','Scattered signals.\nOne reviewable case.','Connect log entries without confusing observations with hypotheses. Keep the unanswered questions visible.','A reviewable investigation','Logs → correlation → review']},
 'agent-team':{ja:['チームで作る','つくる。確かめる。\nもう一度、よくする。','下書き・レビュー・修正に、それぞれの担当を。成果物だけでなく、そこまでの仕事も残す。','経緯のわかる成果物','下書き → レビュー → 修正'],en:['Work as a team','Draft. Review.\nMake it better.','Give drafting, review and revision their own roles. Keep the work trail alongside the deliverable.','An artifact with a work trail','Draft → review → revision']},
 launchloom:{ja:['作ったものを届ける','つくった。\nその次へ。','ひとつの操作録画から、動画・LP・投稿案へ。公開前に、伝える素材を揃える。','公開前の素材セット','録画 → 制作 → 素材の確認'],en:['Show your work','You built it.\nNow show it.','Turn one product recording into film, page and social drafts. Review the material before you publish.','A pre-publish launch kit','Recording → creation → review']}
});
export function copyFor(id,lang){
 if(!IDS.includes(id)||!['ja','en'].includes(lang))throw new TypeError('Unknown lab product or locale');
 const [verb,title,description,result,flow]=LAB[id][lang];return {verb,title,description,result,flow};
}
export function mark(id){
 if(!IDS.includes(id))throw new TypeError('Unknown product mark');
 const paths={genie:'M7 8h15v18H7z M12 3h15v18 M11 13h7 M11 18h5','ai-meeting':'M9 11v10 M14 6v20 M19 3v26 M24 9v14 M29 13v6',oathra:'M8 5H4v6c0 10 7 17 17 17h6v-4l-6-4-3 3-9-9 3-3z',aisecure:'M16 3L5 7v10c0 7 11 12 11 12s11-5 11-12V7z M11 16l4 4 7-8','agent-team':'M4 6h10v10H4z M18 6h10v10H18z M11 20h10v10H11z',launchloom:'M5 4h22v24H5z M5 10h22 M11 4v6 M21 4v6 M13 15l8 5-8 5z'};
 return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id]}"/></svg>`;
}
/** The choices deliberately distinguish what a sample can and cannot prove. */
export function exercise(id,lang){
 copyFor(id,lang);const ja=lang==='ja',t=(a,b)=>ja?a:b;
 const data={
  genie:[t('下書きに残す内容を選ぶ','Choose what to keep in the draft'),[t('見出し・説明・次のアクション','Headline, description and next action'),t('架空の導入社数を足す','Add a made-up customer count')],t('未確認の数字は加えず、メモの範囲で構成します。','Keep to the notes. Do not invent proof.'),t('下書きを開く','Open the draft'),t('成果物を確認する','Review the artifact')],
  'ai-meeting':[t('このタスクを残しますか？','Keep this task?'),[t('「料金案を3つ比較」を確認する','Confirm “Compare three pricing options”'),t('まだ確定しない','Do not confirm yet')],t('まだ確認待ちです。未確認のタスクを保存済みとは表示しません。','Still pending. An unconfirmed task is not shown as saved.'),t('変更内容を見る','Review the change'),t('確認して残す（サンプル）','Confirm in this sample')],
  oathra:[t('日時の根拠になる発言は？','Which words support the date and time?'),[t('「はい、金曜日の14時ですね」','“Yes, Friday at 14:00.”'),t('「お問い合わせありがとうございます」','“Thank you for calling.”')],t('その発言だけでは日時を確認できません。日時を含む発言を選びます。','That sentence does not establish a date or time.'),t('根拠を照合する','Match the evidence'),t('確認できた範囲を見る','See what is verified')],
  aisecure:[t('「権限の不適切な利用の可能性」は？','“Possible misuse of privilege” is…'),[t('追加確認が必要な仮説','A hypothesis requiring more review'),t('確定した事実','A confirmed fact')],t('このログだけでは断定できません。仮説として残し、追加確認につなげます。','These logs do not establish that claim. Keep it as a hypothesis.'),t('調査メモを見る','Open case notes'),t('不明点を残す','Keep the open question')],
  'agent-team':[t('公開日が未確認。どう扱いますか？','The release date is unverified. What next?'),[t('断定を避け、確認待ちとして残す','Revise the claim and keep an open check'),t('確認済みとして公開する','Publish it as verified')],t('レビューの指摘は消さず、成果物と一緒に残します。','Keep the review note attached to the artifact.'),t('レビューを反映する','Apply the review'),t('修正版を確認する','Review the revision')],
  launchloom:[t('素材が揃ったら、次は？','The materials are ready. What next?'),[t('公開前に内容を確認する','Review before publishing'),t('実際のSNSへ今すぐ投稿する','Publish to a real social account now')],t('このサンプルは実投稿しません。素材の確認と公開は別の工程です。','This sample cannot publish. Creation and publication are separate.'),t('素材セットを見る','Inspect the kit'),t('公開前の確認に進む','Review the materials')]
 };
 const [question,options,feedback,action,finish]=data[id];return {question,options,feedback,action,finish};
}
export function sampleResult(id,lang){
 const c=copyFor(id,lang),ja=lang==='ja',t=(a,b)=>ja?a:b;
 const items={
  genie:[t('見出し：考えを、かたちに。','Headline: Make room for your ideas.'),t('説明：メモから次の仕事を始める。','Description: Start the next piece of work from a note.'),'landing-page.md'],
  'ai-meeting':[t('タスク：料金案を3つ比較','Task: Compare three pricing options'),t('状態：このサンプル内で確認済み','State: confirmed within this sample'),t('実アプリへの保存：なし','Stored in the actual app: no')],
  oathra:[t('日時：金曜日 14:00','When: Friday 14:00'),t('根拠：相手の発言 00:18','Source: other party at 00:18'),t('外部システムへの登録：未確認','External booking: unverified')],
  aisecure:[t('観測：3件の関連したログ','Observed: three related log entries'),t('仮説：権限の不適切な利用の可能性','Hypothesis: possible misuse of privilege'),t('不明点：正当な業務か、追加確認が必要','Unknown: was this authorized work?')],
  'agent-team':['announcement.md · v2',t('表現を修正。公開日の確認待ちを保持。','Copy revised. Release-date verification remains open.'),t('未完了の確認：1件','Open verification items: 1')],
  launchloom:['16:9 / 9:16 / Web / Social',t('上記は制作対象の例。実ファイルは未生成。','These are example outputs, not generated media files.'),t('実際のSNS投稿：なし','Real social publishing: none')]
 };
 return {title:c.result,lines:items[id],text:`# ${c.result}\n\n${t('Reachmade 操作サンプル。架空データ・AI実行なし。','Reachmade guided sample. Fictional data, no AI execution.')}\n\n${items[id].map(x=>`- ${x}`).join('\n')}\n`};
}
export function decision(id,index){if(!IDS.includes(id)||![0,1].includes(index))throw new TypeError('Invalid sample choice');return index===0;}
