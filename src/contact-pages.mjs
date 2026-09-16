import fs from 'node:fs/promises';
import path from 'node:path';
import { inquiryForm } from './inquiry-form.mjs';
export async function writeContactForms(dist) {
  for(const lang of ['ja','en']) {
    const prefix=lang==='en'?'en/':'';
    const filename=path.join(dist,prefix,'contact/index.html');
    let html=await fs.readFile(filename,'utf8');
    const anchor='<section class="container contact-layout">';
    if(html.split(anchor).length!==2)throw new Error('Contact structure changed');
    html=html.replace(anchor,`<div class="container direct-contact-block">${inquiryForm(lang)}</div>${anchor}`);
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/inquiry-form.css"><script src="/assets/inquiry-form.js" defer></script></head>');
    await fs.writeFile(filename,html);
    const privacy=path.join(dist,prefix,'privacy/index.html');
    let legal=await fs.readFile(privacy,'utf8');
    const title=lang==='ja'?'このサイトから送るご相談':'Inquiries submitted from this site';
    const text=lang==='ja'?'お問い合わせの送信フォームでは、同意後に送信ボタンを押したときだけ、名前・返信先・任意の組織名・相談内容をReachmade運営者のGoogle Cloud受付システムへ送信します。相談対応のため保存し、AIモデルや広告解析には送りません。受付番号は保存が確認できた場合だけ表示します。自動返信メールはありません。任意の下書き欄は別機能で、送信・サーバー保存を行いません。':'The inquiry form sends your name, reply address, optional organization and message to the Reachmade operator’s Google Cloud inbox only after you consent and submit. Information is stored for inquiry follow-up, not sent to AI models or advertising analytics. A receipt appears only after confirmed storage. No automatic email is sent. The separate optional drafting tool does not send or store its text on a server.';
    legal=legal.replace('<article class="legal-content">',`<article class="legal-content"><section><h2>${title}</h2><p>${text}</p></section>`);
    await fs.writeFile(privacy,legal);
  }
}
