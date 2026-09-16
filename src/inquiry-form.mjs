/** Render a private inquiry form. Submission is explicit and handled separately. */
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function inquiryForm(language) {
  if (!['ja','en'].includes(language)) throw new TypeError('Unsupported language');
  const ja = language === 'ja';
  const t = ja ? {
    heading:'このページから相談する', name:'お名前', email:'返信先メールアドレス', organization:'会社・組織名（任意）', message:'相談したいこと',
    help:'10〜2,000文字。パスワード、APIキー、顧客の個人情報は入力しないでください。',
    consent:'入力した情報を、Reachmade運営者のGoogle Cloud受付システムへ送信することに同意します。',
    privacy:'送信ボタンを押すまで入力は送信されません。相談対応のために保存し、AIモデルには送りません。受付番号は保存が確認できた場合だけ表示します。自動返信メールはありません。',
    submit:'相談を送る', loading:'受付の接続状態を確認しています。', unavailable:'このフォームは現在利用できません。下の既存窓口をご利用ください。',
    fallback:'既存の相談窓口を開く', nojs:'送信にはJavaScriptが必要です。下の既存窓口からも相談できます。'
  } : {
    heading:'Send an inquiry here', name:'Your name', email:'Reply email address', organization:'Company or organization (optional)', message:'What would you like to discuss?',
    help:'10–2,000 characters. Do not include passwords, API keys or customer personal data.',
    consent:'I agree to send this information to the Reachmade operator’s Google Cloud inquiry system.',
    privacy:'Nothing is sent before you submit. Information is stored for inquiry follow-up, not sent to an AI model. A receipt is shown only after confirmed storage. No automatic email is sent.',
    submit:'Send inquiry', loading:'Checking inquiry availability.', unavailable:'This form is currently unavailable. Use the existing inquiry page below.',
    fallback:'Open the existing inquiry page', nojs:'JavaScript is required to submit here. You can also use the existing inquiry page below.'
  };
  const fallback = `https://ai-meeting.forifor.chatgpt.site/${ja?'ja':''}#business`;
  return `<section class="direct-inquiry" aria-labelledby="inquiry-heading"><h2 id="inquiry-heading">${escape(t.heading)}</h2><p class="inquiry-privacy">${escape(t.privacy)}</p><form id="direct-inquiry" method="post" action="/api/inquiry" data-language="${language}"><fieldset disabled><div class="inquiry-fields"><label>${escape(t.name)}<input name="name" autocomplete="name" required maxlength="80"></label><label>${escape(t.email)}<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label class="wide">${escape(t.organization)}<input name="organization" autocomplete="organization" maxlength="120"></label><label class="wide">${escape(t.message)}<textarea name="message" required minlength="10" maxlength="2000" rows="6" aria-describedby="inquiry-help"></textarea><small id="inquiry-help">${escape(t.help)}</small></label></div><label class="inquiry-trap" aria-hidden="true">Website<input name="website" autocomplete="off" tabindex="-1"></label><label class="inquiry-consent"><input name="consent" type="checkbox" required><span>${escape(t.consent)}</span></label><button class="button" type="submit">${escape(t.submit)} <span aria-hidden="true">→</span></button></fieldset><p id="inquiry-status" role="status" aria-live="polite" aria-atomic="true" tabindex="-1" data-unavailable="${escape(t.unavailable)}">${escape(t.loading)}</p><noscript>${escape(t.nojs)}</noscript></form><a class="text-link" href="${fallback}" target="_blank" rel="noopener noreferrer">${escape(t.fallback)} ↗</a></section>`;
}
