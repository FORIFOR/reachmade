import {LAB_VERSION, IDS, esc, copyFor, exercise, decision} from './lab-core.mjs';
export * from './lab-core.mjs';
import {createDraft, exportDraft, decodeDraft, DraftError, MAX_FILE_BYTES} from './sample-draft.mjs';
function wireGuide(figure,lang){
 if(figure.dataset.labWired)return;
 const root=figure.querySelector('.rm-live-demo'),toolbar=figure.querySelector('.rm-demo-modes');if(!root||!toolbar)return;
 figure.dataset.labWired='true';const doc=figure.ownerDocument,ja=lang==='ja',t=(a,b)=>ja?a:b;
 const workbench=figure.closest('.studio-workbench');
 const idOf=()=>workbench?.dataset.product||doc.body.dataset.productId;
 let id=idOf(),step=0,choice=null,active=false, editRevision=0, reading=false;
 const drafts=new Map(), notices=new Map();
 const textFor=()=>drafts.has(id)?drafts.get(id):createDraft({product:id,language:lang}).text;
 const currentDraft=()=>createDraft({product:id,language:lang,text:textFor()});
 const errorText=error=>{
  const messages={INVALID_ENCODING:t('UTF-8として読み取れませんでした。元の文章は残しています。UTF-8で保存し直してください。','The file is not valid UTF-8. Your text is retained. Save the file as UTF-8 and try again.'),READ_FAILED:t('ファイルを読み取れませんでした。元の文章を保ったまま、別のファイルを選べます。','The file could not be read. Your text is retained; choose another file.'),EMPTY:t('文章を入力してください。','Enter some text.'),TOO_LONG:t('4,000文字以内にしてください。','Use 4,000 characters or fewer.'),TOO_LARGE:t('ファイルは32KB以内にしてください。','Choose a file up to 32KB.'),MISMATCH:t('この製品・言語で保存したファイルを選んでください。','Choose a file saved for this product and language.'),UNSUPPORTED_VERSION:t('このファイルの版には対応していません。','This file version is not supported.')};
  return messages[error.code]||t('この操作サンプルから保存したMarkdownを選んでください。元の文章は残っています。','Choose Markdown exported by this guided sample. Your current text is retained.');
 };
 const notify=message=>{notices.set(id,message);const node=box.querySelector('[data-draft-status]');if(node)node.textContent=message;};
 const syncRead=()=>{
  box.dataset.importState=reading?'reading':'idle';
  const next=box.querySelector('[data-next]');if(next&&step===0)next.disabled=reading;
  const cancel=box.querySelector('[data-cancel-import]');if(cancel)cancel.hidden=!reading;
  const picker=box.querySelector('[data-import]');if(picker)picker.disabled=reading;
 };
 const cancelRead=(message='')=>{editRevision++;reading=false;syncRead();notify(message);};
 const tryButton=doc.createElement('button');tryButton.type='button';tryButton.dataset.labTry='';tryButton.textContent=t('操作してみる','Try the steps');tryButton.setAttribute('aria-pressed','false');toolbar.append(tryButton);
 const box=doc.createElement('div');box.className='lab-hands';box.hidden=true;box.setAttribute('aria-label',t('サンプルを操作する','Guided sample'));root.querySelector('.rm-demo-visual').after(box);
 doc.querySelector('[data-lab-begin]')?.removeAttribute('hidden');
 const updateIntro=()=>{
  const c=copyFor(id,lang),choiceLink=workbench?.querySelector(`[data-studio-choice="${id}"]`),side=doc.querySelector('.lab-current');if(!side||!choiceLink)return;
  side.querySelector('[data-lab-name]').textContent=choiceLink.dataset.name;
  side.querySelector('[data-lab-title]').textContent=c.title;
  side.querySelector('[data-lab-description]').textContent=c.description;
  side.querySelector('[data-lab-flow]').textContent=c.flow;
  side.querySelector('[data-lab-detail]').href=choiceLink.href;
  side.querySelector('[data-lab-detail]').setAttribute('aria-label',`${choiceLink.dataset.name} ${t('の詳細','details')}`);
  side.querySelector('[data-lab-code]').href=choiceLink.dataset.repo;
  side.querySelector('[data-lab-proof]').href=choiceLink.dataset.evidence;
  side.querySelector('[data-lab-status]').textContent=choiceLink.dataset.status;
  side.dataset.product=id;
 };
 function cue(n){root.querySelector(`[data-cue="${n}"]`)?.click();}
 function exit(){cancelRead();active=false;box.hidden=true;delete figure.dataset.labGuided;tryButton.setAttribute('aria-pressed','false');}
 function paint(focus=false){
  editRevision++;reading=false;
  const x=exercise(id,lang);
  const label=step===0?t('文章を編集して、Markdownで持ち出す','Edit a draft. Keep it as Markdown.'):step===1?x.question:step===2?t('内容を確認する','Review the draft'):t('手元に持ち出す','Keep a local copy');
  const editor=`<label class="lab-draft-label">${t('編集できるサンプルの文章','Editable sample text')}<textarea data-draft-text rows="5" aria-describedby="lab-draft-help"></textarea></label>`;
  box.innerHTML=`<div class="lab-hands-heading" tabindex="-1"><span>${t('操作サンプル','GUIDED SAMPLE')} · ${step+1} / 4</span><b>${esc(label)}</b></div>
   <p id="lab-draft-help">${t('例文を自分で編集 → 確認 → Markdownで持ち出す。無料・登録不要。AI生成も外部送信も行いません。4,000文字まで。文章はこのタブ内だけに保持され、再読み込みで消えます。','Edit the example → review → export Markdown. Free, no account. No AI generation or external transmission. Up to 4,000 characters. Text stays in this tab and is lost on reload.')}</p>
   ${step===0?editor:step===1?`<p class="lab-practice-note">${t('元の例文についての練習問題です。編集した文章の採点ではありません。例題はスキップできます。','This is a practice question about the original example, not an evaluation of your edited text. You may skip it.')}</p><div class="lab-decisions" role="group" aria-label="${esc(x.question)}">${x.options.map((v,i)=>`<button type="button" data-answer="${i}" aria-pressed="${choice===i}">${esc(v)}</button>`).join('')}</div><p class="lab-feedback" role="status">${choice===1?esc(x.feedback):choice===0?t('この選択で次へ進みます。','Continue with this choice.'):t('選択して、判断の理由を確かめます。文章は自動変更されません。','Choose to explore the decision. Your text is not changed automatically.')}</p>`:`<div class="lab-output"><b>${t('手動編集したサンプル・AI生成なし','Manually edited sample · no AI generation')}</b><pre data-draft-preview></pre></div>`}
   ${step===3?`<label class="lab-draft-label">${t('持ち出す内容（コピー用）','Export content (copy fallback)')}<textarea data-draft-export readonly rows="6"></textarea></label>`:''}
   <div class="lab-hands-actions">${step<3?`<button class="lab-primary" type="button" data-next ${step===1&&choice!==0?'disabled':''}>${esc(step===0?t('この文章で進む','Continue with this draft'):step===1?t('内容を確認する','Review the draft'):t('持ち出す内容を見る','Prepare export'))} →</button>`:`<button class="lab-primary" type="button" data-download>${t('Markdownをダウンロード','Download Markdown')}</button><button type="button" data-select-export>${t('全文を選択してコピー','Select text to copy')}</button>`}
   ${step===1?`<button type="button" data-skip-exercise>${t('例題をスキップして内容を確認','Skip practice and review my text')}</button>`:''}
   ${step>0?`<button type="button" data-reset>${t('文章の編集に戻る','Back to editing')}</button>`:''}
   ${step===0?`<button type="button" data-import>${t('保存したMarkdownを読み戻す','Reopen saved Markdown')}</button><button type="button" data-cancel-import hidden>${t('読み戻しを取り消す','Cancel reopen')}</button><input type="file" data-draft-file accept=".md,text/markdown,text/plain" hidden>`:''}
   </div><p data-draft-status role="status" aria-live="polite">${esc(notices.get(id)||'')}</p>`;
  const editorNode=box.querySelector('[data-draft-text]');if(editorNode)editorNode.value=textFor();
  const preview=box.querySelector('[data-draft-preview]');if(preview)preview.textContent=textFor();
  const output=box.querySelector('[data-draft-export]');if(output)output.value=exportDraft(currentDraft()).text;
  box.querySelector('[data-draft-text]')?.addEventListener('input',event=>{drafts.set(id,event.target.value);cancelRead();});
  box.querySelector('[data-draft-file]')?.addEventListener('change',async event=>{
   const file=event.target.files?.[0];if(!file)return;
   const selectedId=id, revision=++editRevision;
   reading=true;syncRead();notify(t('ファイルを読み込んでいます。取り消すか、文章を編集すると読み戻しを中止します。','Reading the file. Cancel or edit the text to stop applying its contents.'));
   try{
    if(file.size>MAX_FILE_BYTES)throw new DraftError('TOO_LARGE');
    const restored=decodeDraft(new Uint8Array(await file.arrayBuffer()));
    if(restored.product!==selectedId||restored.language!==lang)throw new DraftError('MISMATCH');
    if(id!==selectedId||!active||revision!==editRevision)return;
    drafts.set(id,restored.text);notices.set(id,t('ファイルから文章を復元しました。送信はしていません。','Text restored from the file. Nothing was sent.'));paint();box.querySelector('[data-draft-text]')?.focus();
   }catch(error){if(id===selectedId&&revision===editRevision)notify(errorText(error instanceof DraftError?error:new DraftError('READ_FAILED')));}
   finally{if(id===selectedId&&revision===editRevision){reading=false;syncRead();}event.target.value='';}
  });
  syncRead();
  if(focus){const heading=box.querySelector('.lab-hands-heading');heading?.focus();heading?.scrollIntoView({block:'center',behavior:'instant'});}
 }
 function begin(){notices.delete(id);figure.querySelector('[data-mode="story"]').click();step=0;choice=null;cue(0);active=true;figure.dataset.labGuided='true';box.hidden=false;toolbar.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed','false'));tryButton.setAttribute('aria-pressed','true');paint(true);}
 tryButton.addEventListener('click',begin);
 box.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target||!active)return;
  if(target.hasAttribute('data-answer')){choice=Number(target.dataset.answer);const index=choice;paint();box.querySelector(`[data-answer="${index}"]`)?.focus({preventScroll:true});return;}
  if(target.hasAttribute('data-next')){
   if(reading)return;
   try{currentDraft();}catch(error){notify(errorText(error));box.querySelector('[data-draft-text]')?.focus();return;}
   if(step===1&&!decision(id,choice))return;step++;cue([0,2,3,4][step]);paint(true);
  }
  if(target.hasAttribute('data-skip-exercise')){step=2;cue(3);paint(true);}
  if(target.hasAttribute('data-cancel-import')){cancelRead(t('読み戻しを取り消しました。元の文章を残しています。','Reopen cancelled. Your original text is retained.'));box.querySelector('[data-import]')?.focus();}
  if(target.hasAttribute('data-reset'))begin();
  if(target.hasAttribute('data-import'))box.querySelector('[data-draft-file]').click();
  if(target.hasAttribute('data-select-export')){const output=box.querySelector('[data-draft-export]');output.focus();output.select();notify(t('選択した文章をCtrl+C / ⌘Cでコピーできます。','Press Ctrl+C / ⌘C to copy the selected text.'));}
  if(target.hasAttribute('data-download')){
   try{
    const output=exportDraft(currentDraft()),blob=new Blob([output.text],{type:output.mimeType}),url=URL.createObjectURL(blob),a=doc.createElement('a');
    try{a.href=url;a.download=output.filename;doc.body.append(a);a.click();}
    finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    notify(t('ダウンロードを要求しました。保存先のファイルを確認してください。保存できない場合は、上の全文をコピーできます。','Download requested. Check the file in your downloads. If saving is unavailable, copy the full text above.'));
   }catch{notify(t('ダウンロードを開始できませんでした。上の全文を選択してコピーしてください。文章は残っています。','Download could not start. Select and copy the full text above. Your draft is retained.'));}
  }
 });
 toolbar.addEventListener('click',event=>{if(event.target.closest('[data-mode]'))exit();});
 doc.querySelector('[data-lab-begin]')?.addEventListener('click',begin);
 if(workbench)new MutationObserver(()=>{const next=idOf();if(next===id||!IDS.includes(next))return;id=next;exit();updateIntro();}).observe(workbench,{attributes:true,attributeFilter:['data-product']});
 updateIntro();
}
export function initLab(doc=document){
 const lang=doc.documentElement.lang.startsWith('ja')?'ja':'en';
 if(!doc.body.hasAttribute('data-lab-experience'))return;
 const figures=[...doc.querySelectorAll('.studio-player,.owned-film')];
 const mount=()=>figures.forEach(f=>wireGuide(f,lang));mount();
 if(figures.some(f=>!f.dataset.labWired)){
  const observer=new MutationObserver(()=>{mount();if(figures.every(f=>f.dataset.labWired))observer.disconnect();});observer.observe(doc.body,{childList:true,subtree:true});
 }
 const choose=id=>{
  const link=doc.querySelector(`[data-studio-choice="${id}"]`);if(!link)return;
  link.click();link.focus({preventScroll:true});doc.querySelector('.lab-explorer')?.scrollIntoView({block:'start',behavior:'auto'});
 };
 doc.querySelectorAll('[data-lab-select]').forEach(link=>link.addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  if(!doc.querySelector('[data-studio-choice]'))return;event.preventDefault();choose(link.dataset.labSelect);
 }));
 // Decorative entrances never hide no-script content or hijack scrolling.
 if(!doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in doc.defaultView){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('lab-entered');observer.unobserve(e.target);}}),{threshold:.08});
  doc.querySelectorAll('[data-lab-reveal]').forEach(el=>observer.observe(el));
 }
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initLab(),{once:true});else initLab();}
