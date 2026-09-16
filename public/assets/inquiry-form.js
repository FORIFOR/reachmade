(() => {
  'use strict';
  const form=document.getElementById('direct-inquiry'); if(!form)return;
  const fieldset=form.querySelector('fieldset'), status=document.getElementById('inquiry-status');
  const ja=form.dataset.language==='ja'; let busy=false, previousKey='', requestId='';
  const say=(text)=>{status.textContent=text;};
  const timeout=ms=>AbortSignal.timeout(ms);
  form.addEventListener('submit', async event=>{
    event.preventDefault(); if(busy || fieldset.disabled || !form.reportValidity())return;
    const data=new FormData(form);
    const body={name:String(data.get('name')||'').trim(),email:String(data.get('email')||'').trim(),organization:String(data.get('organization')||'').trim(),message:String(data.get('message')||'').trim(),consent:data.get('consent')==='on',website:String(data.get('website')||''),language:ja?'ja':'en'};
    const key=JSON.stringify(body);
    if(key!==previousKey){requestId=crypto.randomUUID();previousKey=key;}
    busy=true;fieldset.disabled=true;say(ja?'送信しています…':'Sending your inquiry…');
    try {
      const response=await fetch('/api/inquiry',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,requestId}),signal:timeout(15000),cache:'no-store',redirect:'error'});
      const result=await response.json();
      if(response.status!==201 || !/^AM-[0-9A-F]{8}$/.test(result.receipt||'')) {
        const text=response.status===429 ? (ja?'受付件数の上限に達しています。時間をおいて再試行してください。':'The inbox has reached its current limit. Please retry later.') : response.status===400 ? (ja?'入力内容と同意を確認してください。':'Please check your input and consent.') : (ja?'受付を確認できませんでした。入力は残しています。同じ内容で再試行できます。':'We could not confirm receipt. Your input is retained; you can retry the same inquiry.');
        throw new Error(text);
      }
      say((ja?'受け付けました。受付番号：':'Your inquiry was accepted. Receipt: ')+result.receipt+(ja?'。自動返信メールはありません。':'. No automatic email is sent.'));
      form.reset();previousKey='';requestId='';status.focus();
    } catch(error) {
      say(error.name==='TimeoutError' || error.name==='AbortError' || error instanceof TypeError ? (ja?'通信を確認できませんでした。入力は残しています。再試行しても、同じ受付番号の重複保存は行いません。':'The connection could not be confirmed. Your input is retained. Retrying this unchanged inquiry reuses its request identifier.') : error.message);
      status.focus();
    } finally {busy=false;fieldset.disabled=false;}
  });
  fetch('/api/inquiry',{credentials:'omit',cache:'no-store',redirect:'error',signal:timeout(10000)})
    .then(async response=>{const result=await response.json();if(!response.ok || result.available!==true)throw new Error();fieldset.disabled=false;say(ja?'このページから送信できます。':'You can submit from this page.');})
    .catch(()=>{fieldset.disabled=true;say(status.dataset.unavailable);});
})();
