import './site.js';
const form=document.querySelector('#reachmade-inquiry');
if (form) {
  const ja=form.dataset.language==='ja', t=(a,b)=>ja?a:b;
  const submit=document.querySelector('#inquiry-submit'), readiness=document.querySelector('#inquiry-readiness'), result=document.querySelector('#inquiry-result'), reconnect=document.querySelector('#inquiry-reconnect'), fields=form.querySelector('fieldset');
  let available=false, busy=false, checking=false, previous=null, unresolved=false;
  const say=(message)=>{result.textContent=message;result.focus();};
  async function check() {
    if(checking||busy)return;
    checking=true; reconnect.disabled=true;submit.disabled=true;
    try {
      const r=await fetch('/api/inquiries/status',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
      const data=await r.json();available=r.ok&&data.available===true&&typeof crypto.randomUUID==='function';
    }catch{available=false;}
    readiness.textContent=available?t('受付に接続できます。入力内容は送信ボタンを押すまで送信しません。','Connected. Form contents are transmitted only when you press Send.'):t('現在、受付に接続できません。入力を保ったまま接続を再確認できます。','The inquiry service is unavailable. Your input is retained; check the connection again.');
    checking=false;reconnect.disabled=false;submit.disabled=!available||unresolved;
  }
  reconnect.addEventListener('click',check);
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy||unresolved||!available||!form.reportValidity())return;
    const data=new FormData(form);
    const content={name:String(data.get('name')||'').trim(),email:String(data.get('email')||'').trim(),organization:String(data.get('organization')||'').trim(),useCase:String(data.get('useCase')||'custom'),message:String(data.get('message')||'').trim(),consent:data.get('consent')==='on',website:String(data.get('website')||''),language:ja?'ja':'en'};
    if(!content.name||!content.email||content.message.length<10||!content.consent||content.website){say(t('入力内容と同意欄を確認してください。','Please check your input and consent.'));return;}
    const fingerprint=JSON.stringify(content);
    if(!previous||previous.fingerprint!==fingerprint)previous={fingerprint,requestId:crypto.randomUUID()};
    const requestId=previous.requestId;
    delete result.dataset.receipt;
    form.dataset.state='sending';busy=true;fields.disabled=true;submit.disabled=true;reconnect.disabled=true;form.setAttribute('aria-busy','true');
    result.textContent=t('送信しています。受付番号が出るまで、このページを閉じないでください。','Sending. Keep this page open until a receipt appears.');
    try {
      const r=await fetch('/api/inquiries',{method:'POST',credentials:'omit',cache:'no-store',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId,...content}),signal:AbortSignal.timeout(18000)});
      const answer=await r.json();
      if(r.status===201&&/^AM-[A-F\d]{8}$/.test(answer.receipt||'')){
        form.dataset.state='accepted';form.reset();previous=null;result.dataset.receipt=answer.receipt;
        say(t(`相談を受け付けました。受付番号：${answer.receipt}。自動返信メールはありません。`,`Inquiry received. Receipt: ${answer.receipt}. No automatic email is sent.`));
      }else if(r.status===429){form.dataset.state='rejected';say(t('受付件数の上限に達しています。入力は残しています。時間を置いて再試行してください。','The intake limit was reached. Your input is retained. Please retry later.'));}
      else if(r.status===400||r.status===413){form.dataset.state='rejected';say(t('入力の長さ・メールアドレス・同意欄を確認してください。内容は残しています。','Check the message length, email and consent. Your input is retained.'));}
      else if(r.status===409){throw Error('conflict');}
      else throw Error('unconfirmed');
    }catch{unresolved=true;form.dataset.state='unconfirmed';say(t(`受付結果を確認できません。すでに届いている可能性があるため、このページからの再送信を停止しました。照合用ID：${requestId}。入力を手元にコピーし、運営者による照合を待ってください。再読み込みや別タブからの再送信でも重複する可能性があります。`,`The result is unconfirmed and may already have been received. Sending again from this page is disabled. Reference ID: ${requestId}. Copy your input locally and wait for the operator to reconcile it. Reloading or using another tab can still create a duplicate.`));}
    finally{busy=false;fields.disabled=false;submit.disabled=!available||unresolved;reconnect.disabled=false;form.removeAttribute('aria-busy');}
  });
  check();
}
