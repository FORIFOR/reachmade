/** Localized entry points and factual page sections. No browser side effects. */
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route = (language, page) => `${language === 'en' ? '/en' : ''}/${page}/`;
const entries = {
  genie: { ja: ['https://genie.reachmade.com/ja.html', 'https://genie-forifor.forifor.chatgpt.site/ja#demo', '操作動画を見る'], en: ['https://genie.reachmade.com/?lang=en', 'https://genie-forifor.forifor.chatgpt.site/?lang=en#demo', 'Watch the workflow'] },
  'ai-meeting': { ja: ['https://ai-meeting.forifor.chatgpt.site/ja', 'https://ai-meeting.web.app/#tasks', '文字入力でタスクを試す'], en: ['https://ai-meeting.forifor.chatgpt.site/', 'https://ai-meeting.web.app/#tasks', 'Try text tasks (Japanese UI)'] },
  oathra: { ja: ['https://oathra.reachmade.com/', 'https://oathra.reachmade.com/#sim', 'ブラウザーで判定を試す'], en: ['https://oathra.reachmade.com/en/', 'https://oathra.reachmade.com/en/#sim', 'Try the evidence engine'] },
  aisecure: { ja: ['https://aisecure.reachmade.com/index.ja.html', 'https://aisecure.reachmade.com/index.ja.html#case', 'サンプル事例を調べる'], en: ['https://aisecure.reachmade.com/', 'https://aisecure.reachmade.com/#case', 'Inspect a sample case'] },
  'agent-team': { ja: ['https://multibot.reachmade.com/ja/', 'https://multibot.reachmade.com/ja/#guide', '3ステップの使い方を見る'], en: ['https://multibot.reachmade.com/', 'https://multibot.reachmade.com/#workflow', 'See the three-step workflow'] },
  launchloom: { ja: ['https://launchloom.reachmade.com/ja/', 'https://launchloom.reachmade.com/ja/#kit', '完成した公開素材を見る'], en: ['https://launchloom.reachmade.com/', 'https://launchloom.reachmade.com/#kit', 'Explore the launch kit'] },
};
export function productNavigation(product, language) {
  if (!['ja', 'en'].includes(language)) throw new TypeError('Unsupported language');
  const [site, demo, demoLabel] = (Object.hasOwn(entries, product.id) ? entries[product.id][language] : null) || [product.labSite || product.site, product.demo, product[language].demoLabel];
  return { site, demo, demoLabel };
}
export function contactDestination(config, language) {
  if (config.contact.mode === 'email') return `mailto:${config.contact.email}`;
  const url = new URL(config.contact.url);
  if (url.origin === 'https://ai-meeting.forifor.chatgpt.site' && ['/', '/ja', '/ja/'].includes(url.pathname)) url.pathname = language === 'ja' ? '/ja' : '/';
  return url.href;
}
export function improveCopy(original) {
  const copy = structuredClone(original);
  Object.assign(copy.ja, {
    tagline: '会話をタスクに。<br>録画を公開素材に。',
    heroText: '音声・仕事・制作のためのAIプロダクト。<br>実演を見て、用途に合うものから試せます。企業向けの設計・実装も相談できます。',
    heroPrimary: 'プロダクトを見る', productSite: '詳しく見る',
    productsTitle: 'やりたいことから、<br>プロダクトを選ぶ。',
    productsLead: '会話、作成、電話、調査、レビュー、発信。<br>まずは用途を選び、実演と利用条件を確認してください。',
    contactPrimary: '相談フォームを開く',
    contactNote: '開発者の既存フォーム（AI Meetingのサイト内）で、そのまま相談できます。このページで下書きを作る必要はありません。送信先は移動後の画面で確認できます。',
    draftTitle: '送る内容を整理する（任意）',
    draftNote: '必要なときだけ使う下書きです。コピーした文章をリンク先のフォームに貼り付けられます。入力はブラウザー内だけで処理され、送信・保存しません。',
  });
  Object.assign(copy.en, {
    tagline: 'Conversations into tasks.<br>Recordings into launch materials.',
    heroText: 'AI products for conversations, work and creation.<br>See a demonstration, check the requirements, and choose what fits. Implementation support is also available.',
    heroPrimary: 'Explore products', productSite: 'Learn more',
    productsTitle: 'Start with what<br>you want to do.',
    productsLead: 'Conversation, drafting, calls, investigation, review and publishing.<br>Choose a task, then explore the demonstration and requirements.',
    contactPrimary: 'Open the inquiry form',
    contactNote: 'Contact the developer directly using the existing form on the AI Meeting site. You do not need to draft or copy anything here first. Review the destination before submitting.',
    draftTitle: 'Prepare a brief (optional)',
    draftNote: 'Use this optional local draft only when helpful. Copy it into the linked form. Nothing entered here is sent to or stored on a server.',
  });
  const media = {
    ja: '広告・アクセス解析タグや外部フォントは読み込みません。製品動画は公開時に検査・同梱した録画を、このサイトと同じドメインから配信します。画面内の動画だけを無音再生し、停止・拡大できます。動きを減らす設定や対応するデータ節約設定では自動再生しません。ホスティング事業者は配信・セキュリティのため接続情報を処理する場合があります。',
    en: 'No advertising, analytics tags or external fonts are loaded. Recordings are checked and packaged before deployment, then served from this site’s own domain. Only a visible preview plays, without sound, with pause and expand controls. Reduced-motion and supported data-saving preferences disable autoplay. Hosting providers may process connection information for delivery and security.',
  };
  for (const language of ['ja', 'en']) {
    copy[language].privacySections[1][1] = language === 'ja' ? '相談フォーム、製品サイト、GitHubを開くと外部サービスへ移動します。入力・送信前に、リンク先の方針と送信先を確認してください。サイト内の動画表示とは別の操作です。' : 'Opening an inquiry form, product site or GitHub link takes you to another service. Check its privacy information and destination before entering or sending information. This is separate from watching videos on this site.';
    copy[language].privacySections[2][1] = media[language];
  }
  return copy;
}
export function productIndex(products, language) {
  const title = language === 'ja' ? '何をしたいですか？' : 'What would you like to do?';
  return `<nav class="container purpose-index" aria-label="${title}"><h2>${title}</h2><div>${products.map(p => `<a href="#${escape(p.id)}"><span>${escape(p[language].short)}</span><b>${escape(p.name)} <span aria-hidden="true">↓</span></b></a>`).join('')}</div></nav>`;
}
const stories = [
  { id: 'oathra', ja: ['AIの「予約できた」だけでは、結果を確定しない。', '相手が保留していても、AIが成功と要約する可能性がある。', '日時・人数・確定の根拠を相手側の発言に結び付ける。', 'ブラウザーの証拠ラボで、返答と判定を一緒に確かめられる。', '会話上の確認は、店舗の予約台帳への登録証明ではない。'], en: ['Do not accept the agent’s “booked” as proof.', 'An agent can summarize success while the other party has only offered to check.', 'Attach dates, party size and confirmation to the other party’s words.', 'Inspect the reply and its verdict together in the browser evidence lab.', 'Spoken confirmation does not prove a booking-system entry.'] },
  { id: 'ai-meeting', ja: ['聞き取った変更と、保存したタスクを分ける。', '聞き違えた期限や完了状態を、そのまま保存したくない。', '不確かな変更を提案として確認し、保存済みの状態と区別する。', '公開の操作録画で、会話からタスク変更までを確認できる。', '録画には合成した入力と、一部スクリプトによる操作が含まれる。'], en: ['Separate a proposed change from a saved task.', 'A misheard deadline should not silently become the saved state.', 'Review uncertain changes before they are applied to the task ledger.', 'The published recording shows conversation and task changes together.', 'The recording includes synthetic input and some scripted operations.'] },
  { id: 'aisecure', ja: ['警告を並べるだけでなく、一件として調べる。', '単独の警告だけでは、調べるべき経路を追いにくい。', '公開機器・特権ログイン・ファイル参照を関連付ける。', '観測された事実、仮説、不明な点を分けてサンプルを表示する。', '合成データの結果であり、実環境の検知性能を保証しない。'], en: ['Investigate a case, not a disconnected alert list.', 'An isolated alert does not show the path worth investigating.', 'Connect exposed assets, privileged logins and file access.', 'The sample separates observations, hypotheses and unknowns.', 'Synthetic examples do not establish real-world detection performance.'] },
];
export function caseStudies(products, language) {
  const labels = language === 'ja' ? ['課題', '設計', '確認できるもの', '残る限界'] : ['Problem', 'Design', 'Inspect', 'Limit'];
  return `<section class="container case-studies"><h2>${language === 'ja' ? '解いた問題と、残している限界。' : 'The problem, the design, and its limits.'}</h2><p>${language === 'ja' ? '自主開発の設計例です。顧客の導入事例ではありません。' : 'Examples from independent development, not client deployment case studies.'}</p><div class="story-grid">${stories.map(s => {
    const p = products.find(p => p.id === s.id); if (!p) return '';
    const [title, ...details] = s[language];
    return `<article><p class="eyebrow">${escape(p.name)}</p><h3>${escape(title)}</h3><dl>${details.map((text, i) => `<dt>${labels[i]}</dt><dd>${escape(text)}</dd>`).join('')}</dl><a class="text-link" href="${escape(p.evidence)}" target="_blank" rel="noopener noreferrer">${language === 'ja' ? '公開記録を確認する' : 'Inspect the public record'} ↗</a></article>`;
  }).join('')}</div></section>`;
}
export function serviceExamples(language) {
  const ja = language === 'ja';
  const examples = ja ? [
    ['予約変更の受付', 'AIが集める情報、スタッフが確定する内容、聞き取れなかった場合の引き継ぎを決めます。'],
    ['資料作成とレビュー', '入力資料と完成条件を決め、生成物・修正箇所・未確認の点を一緒に確認できる試作にします。'],
    ['新しい製品の実演', 'ひとつの操作を実装・収録し、体験と成立条件を確かめてから次の範囲を決めます。'],
  ] : [
    ['Reservation-change intake', 'Define what the AI collects, what staff confirms, and how an unclear request is handed over.'],
    ['Drafting and review', 'Agree on inputs and completion criteria, then inspect the draft, revisions and unknowns together.'],
    ['A new product experience', 'Build and record one interaction, evaluate the experience and its constraints, then choose the next scope.'],
  ];
  return `<section class="container service-examples"><h2>${ja ? '最初は、ひとつの仕事から。' : 'Start with one piece of work.'}</h2><p>${ja ? '相談・試作の例です。費用・期間・納品範囲は個別に確認します。' : 'Scoping examples. Fees, timing and deliverables are agreed individually.'}</p><div class="story-grid">${examples.map(([h,p]) => `<article><h3>${h}</h3><p>${p}</p></article>`).join('')}</div></section>`;
}
export function profileProof(language) {
  const ja = language === 'ja';
  return `<section class="container profile-proof"><h2>${ja ? '担当できることを、実物から。' : 'Explore the work behind the capabilities.'}</h2><p>${ja ? '設計・実装・評価のどの部分を相談するか、公開しているプロダクトと記録を見ながら整理できます。' : 'Use the public products and records to discuss which parts of design, implementation and evaluation fit your project.'}</p><div class="story-grid">${(ja ? [['音声と業務入力','AI Meeting / Oathra'],['作成とレビューの体験','Genie / Agent Team'],['検証と公開素材','AI Secure / Launchloom']] : [['Voice and task capture','AI Meeting / Oathra'],['Drafting and review','Genie / Agent Team'],['Investigation and launch assets','AI Secure / Launchloom']]).map(([h,p]) => `<article><h3>${h}</h3><p>${p}</p><a class="text-link" href="${route(language,'products')}">${ja ? 'プロダクトを見る' : 'Explore products'} →</a></article>`).join('')}</div><a class="text-link" href="${route(language,'work')}">${ja ? '判断と検証の事例を見る' : 'See design and evaluation examples'} →</a></section>`;
}
