/**
 * Genie privacy policy (/products/genie/privacy/ and /en/products/genie/privacy/).
 *
 * Written 2026-10-23 for the Google OAuth consent screen, which needs a privacy policy and a homepage that links to it.
 * The text follows what the Genie code does, read from genie/docs/privacy-egress.md, services/connectors/src/scopes.ts,
 * packages/oauth/src/store.ts (tokens in the macOS Keychain) and the LINE relay (services/line-hub). It makes no claim
 * the code does not back. Built from the site privacy page so the header, footer and metadata stay the site's own.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export const GENIE_PRIVACY_VERSION = '20261023-genie-privacy-2';
const ROUTES = Object.freeze({ja: '/products/genie/privacy/', en: '/en/products/genie/privacy/'});
const BASES = Object.freeze({ja: '/privacy/', en: '/en/privacy/'});
const GENIE = Object.freeze({ja: '/products/genie/', en: '/en/products/genie/'});
const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext = (href, label) => `<a href="${e(href)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`;
// A body is inline HTML; a list inside it closes the paragraph around it.
const paragraphs = body => body.split(/(<ul>[^]*?<\/ul>)/).filter(s => s.trim()).map(s => s.startsWith('<ul>') ? s : `<p>${s}</p>`).join('');
const USER_DATA_POLICY = 'https://developers.google.com/terms/api-services-user-data-policy';
const GOOGLE_PERMISSIONS = 'https://myaccount.google.com/permissions';

export const COPY = Object.freeze({
  ja: {
    title: 'Genie のプライバシーポリシー',
    lead: 'Mac で動く AI ワークスペース「Genie」が、どの情報を、どこで、何のために扱うかを説明します。',
    updated: '制定・最終更新: 2026年10月23日',
    sections: [
      ['対象と運営者', `このポリシーは、macOS アプリ「Genie」と、Genie の LINE 公式アカウント・Slack などのチャット連携、Genie が出す通話のページに適用します。運営者は Reachmade Lab / Shuhei Horio（FORIFOR）です。このサイト自体の情報の扱いは<a href="/privacy/">サイトのプライバシー</a>をご覧ください。`],
      ['Mac の中で扱うもの', 'Genie は利用者の Mac で動きます。会話、依頼したタスク、作った成果物、予定・家計簿・買い物リストなどの記録は、その Mac の中のデータベースに保存し、運営者のサーバへは送りません。API キーと接続の鍵は macOS のキーチェーンに保存します。音声入力の履歴は Mac の中だけに残し、音声そのものは残しません。'],
      ['Google アカウントのデータ', `利用者が Genie の設定で Google アカウントを接続したときだけ、利用者が許可した範囲で次のデータを扱います。<ul><li><strong>Gmail:</strong> メールを読み、「今日、気にした方がいいこと」やまとめ、依頼への答えを作ります。下書き・送信・整理は、利用者が頼み、内容を確認したときだけ行います。</li><li><strong>Google カレンダー:</strong> 予定を読み、まとめや依頼への答えに使います。予定の追加は、利用者が頼んだときだけ行います。</li><li><strong>Google コンタクト・Google ドライブ:</strong> 接続した場合に限り、利用者の依頼に答えるために読みます。</li></ul>接続の鍵（アクセストークン・リフレッシュトークン）は、利用者の Mac のキーチェーンにだけ保存し、運営者のサーバには保存しません。Genie で接続を解除すると、その鍵を削除します。${ext(GOOGLE_PERMISSIONS, 'Google アカウントの設定')}からも、いつでも許可を取り消せます。`],
      ['Google のデータの使い方の制限', `Genie が Google API から受け取った情報の利用と他への移転は、${ext(USER_DATA_POLICY, 'Google API サービスのユーザーデータに関するポリシー')}（Limited Use の要件を含む）に従います。Google のデータは、利用者が使っている Genie の機能を提供するためだけに使います。販売せず、広告に使わず、汎用の AI モデルの学習に使いません。運営者がその内容を読むことはありません（利用者が明示的に同意した場合、セキュリティ上の調査、法令に従う場合を除きます）。`],
      ['AI と外部のサービスへ送るもの', '答えを作るために、必要な分だけを次の提供元へ送ります。<ul><li><strong>AI モデル:</strong> 利用者が依頼したとき、その依頼に要る内容（依頼の文、添えた画面や写真、関係するメールや予定の内容など）を、利用者が設定した AI モデル（Anthropic の Claude、Google の Gemini など）へ送り、答えを受け取ります。</li><li><strong>声の会話・通話:</strong> 利用者が会話や通話を始めた間の声と、利用者がカメラや画面を共有している間の映像（1 秒に 1 枚の画像）を Google の Gemini Live へ送ります。月の利用上限（分）を超えると始めません。</li><li><strong>通話の議事録:</strong> 通話を終えたら、その通話の文字起こしと頼みの結果を Anthropic の Claude へ送り、簡単な議事録を作って LINE のトークに送ります。文字起こしそのものは保存しません。</li><li><strong>LINE などで送った写真・外国語の文:</strong> 読み取りや翻訳のために Anthropic の Claude へ送ります。写真そのものは保存しません。</li><li><strong>天気・ニュース・株価・近くの店:</strong> 地名や丸めた位置、検索語、銘柄コードなど、調べるのに要るものだけを送ります。メールや会話の内容は送りません。</li><li><strong>音声認識:</strong> Mac の音声認識（Apple）を使います。言語によっては Apple のサーバで認識されます。</li></ul>これらの提供元での扱いは、各提供元のポリシーに従います。'],
      ['LINE・Slack などのチャット連携', 'Genie の LINE 公式アカウントに送ったメッセージは、運営者が置く中継を通って、利用者の Mac の Genie へ届きます。中継は、届け先を決めるために LINE の利用者 ID・グループ ID と、どの Genie へ届けるかの対応を保存します。メッセージの本文は Mac へ届けるまでしか持たず、受け取りを確認したら削除します（Mac が届かない場合も 24 時間で削除します）。連携コードはハッシュだけを保存します。Genie で連携を解除すると、中継もその人のメッセージをその Genie へ届けなくなります。'],
      ['広告・解析・販売', 'Genie は広告を表示せず、広告やアクセス解析のための追跡を行いません。利用者の情報を第三者に販売しません。'],
      ['利用者ができること', 'Google アカウントやチャットの連携は、Genie の設定からいつでも解除できます。Mac の中の記録は、Genie の画面で削除でき、Genie を削除すると Mac の中のデータも削除できます。キーチェーンの鍵は、Genie の設定、または macOS の「キーチェーンアクセス」から削除できます。'],
      ['変更とお問い合わせ', `扱う情報や送り先を変えるときは、このページを更新してから公開します。ご質問は<a href="/contact/">相談ページ</a>からお送りください。`]
    ],
    back: 'Genie のページへ戻る',
    footerLink: 'Genie のプライバシーポリシー'
  },
  en: {
    title: 'Genie Privacy Policy',
    lead: 'What Genie, the AI workspace that runs on your Mac, handles, where, and why.',
    updated: 'Effective and last updated: October 23, 2026',
    sections: [
      ['Scope and operator', `This policy covers the macOS app “Genie”, Genie’s chat connections such as its LINE official account and Slack, and the call pages Genie opens. The operator is Reachmade Lab / Shuhei Horio (FORIFOR). For this website itself, see the <a href="/en/privacy/">site privacy page</a>.`],
      ['What stays on your Mac', 'Genie runs on your Mac. Conversations, tasks you ask for, the files Genie makes, and records such as schedules, household expenses and shopping lists are stored in a database on that Mac and are not sent to the operator’s servers. API keys and connection credentials are stored in the macOS Keychain. Dictation history stays on the Mac, and the audio itself is not kept.'],
      ['Google account data', `Only when you connect a Google account in Genie’s settings, and only within the access you grant, Genie handles:<ul><li><strong>Gmail:</strong> reads email to show what needs your attention today, write summaries and answer your requests. It drafts, sends or organizes email only when you ask and confirm the content.</li><li><strong>Google Calendar:</strong> reads events for summaries and answers. It adds events only when you ask.</li><li><strong>Google Contacts and Google Drive:</strong> read only if you connect them, to answer your requests.</li></ul>Access and refresh tokens are stored only in your Mac’s Keychain, never on the operator’s servers. Disconnecting in Genie deletes them. You can also revoke access at any time in your ${ext(GOOGLE_PERMISSIONS, 'Google Account settings')}.`],
      ['Limited use of Google data', `Genie’s use and transfer of information received from Google APIs adheres to the ${ext(USER_DATA_POLICY, 'Google API Services User Data Policy')}, including the Limited Use requirements. Google data is used only to provide the Genie features you use. It is not sold, not used for advertising, and not used to train generalized AI models. The operator does not read it, except with your explicit consent, for security investigations, or to comply with the law.`],
      ['What is sent to AI and other services', 'To produce an answer, Genie sends only what is needed to these providers:<ul><li><strong>AI models:</strong> when you make a request, the content it needs (your request, an attached screen or photo, related email or calendar content) goes to the AI model you configured (such as Anthropic’s Claude or Google’s Gemini), and the answer comes back.</li><li><strong>Voice conversations and calls:</strong> your voice while a conversation or call is active, and, while you share your camera or screen, one image per second, go to Google’s Gemini Live. A monthly minute limit stops new sessions once reached.</li><li><strong>Call minutes:</strong> when a call ends, its transcript and the results of your requests go to Anthropic’s Claude to write short minutes, which are sent to your LINE chat. The transcript itself is not stored.</li><li><strong>Photos and foreign-language text sent through LINE and similar apps:</strong> sent to Anthropic’s Claude to read or translate. Photos themselves are not stored.</li><li><strong>Weather, news, stock prices and nearby places:</strong> only what the lookup needs, such as a place name, a rounded location, a search term or a ticker. Email and conversation content is not sent.</li><li><strong>Speech recognition:</strong> uses the Mac’s speech recognition (Apple). For some languages, Apple recognizes speech on its servers.</li></ul>Each provider handles this data under its own policy.'],
      ['LINE, Slack and other chat connections', 'Messages sent to Genie’s LINE official account pass through a relay run by the operator and reach Genie on your Mac. To route them, the relay stores LINE user and group IDs and which Genie each one goes to. Message content is held only until it is delivered to your Mac and deleted once receipt is confirmed (or after 24 hours if the Mac cannot be reached). Link codes are stored only as hashes. When you unlink in Genie, the relay stops delivering that person’s messages to that Genie.'],
      ['Advertising, analytics and sale', 'Genie shows no advertising and does no advertising or analytics tracking. Your information is not sold to third parties.'],
      ['Your choices', 'You can disconnect Google accounts and chat connections in Genie’s settings at any time. Records on your Mac can be deleted in Genie, and removing Genie lets you delete its data on the Mac. Keychain credentials can be deleted in Genie’s settings or in macOS Keychain Access.'],
      ['Changes and contact', `Before Genie changes what it handles or where it sends it, this page is updated first. Questions can be sent from the <a href="/en/contact/">contact page</a>.`]
    ],
    back: 'Back to Genie',
    footerLink: 'Genie Privacy Policy'
  }
});

const swap = (html, from, to) => {
  if (!html.includes(from)) throw new Error(`Genie privacy: template is missing ${from}`);
  return html.split(from).join(to);
};

export function renderGeniePrivacy(template, lang, origin) {
  const c = COPY[lang];
  const other = lang === 'ja' ? 'en' : 'ja';
  const main = `<main id="main"><section class="page-intro container"><p class="eyebrow">GENIE / PRIVACY</p><h1>${e(c.title)}</h1><p class="lead">${e(c.lead)}</p><p>${e(c.updated)}</p></section><div class="container"><article class="legal-content" data-genie-privacy="${GENIE_PRIVACY_VERSION}">${c.sections.map(([h, body]) => `<section><h2>${e(h)}</h2>${paragraphs(body)}</section>`).join('')}<a class="text-link" href="${GENIE[lang]}">${e(c.back)}<span aria-hidden="true">↗</span></a></article></div></main>`;
  const start = template.indexOf('<main id="main">'), end = template.indexOf('</main>');
  if (start < 0 || end < 0) throw new Error('Genie privacy: template has no <main>');
  let html = template.slice(0, start) + main + template.slice(end + '</main>'.length);
  const titleAt = html.indexOf('<title>'), titleEnd = html.indexOf('</title>');
  html = html.slice(0, titleAt) + `<title>${e(c.title)} | Reachmade Lab</title>` + html.slice(titleEnd + '</title>'.length);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${e(c.lead)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${e(c.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${e(c.lead)}">`);
  html = swap(html, `rel="canonical" href="${origin}${BASES[lang]}"`, `rel="canonical" href="${origin}${ROUTES[lang]}"`);
  html = swap(html, `content="${origin}${BASES[lang]}"`, `content="${origin}${ROUTES[lang]}"`);
  html = swap(html, `hreflang="ja" href="${origin}${BASES.ja}"`, `hreflang="ja" href="${origin}${ROUTES.ja}"`);
  html = swap(html, `hreflang="en" href="${origin}${BASES.en}"`, `hreflang="en" href="${origin}${ROUTES.en}"`);
  html = swap(html, `hreflang="x-default" href="${origin}${BASES.ja}"`, `hreflang="x-default" href="${origin}${ROUTES.ja}"`);
  // The header language switch points at the other language of this page, not of the site privacy page.
  html = html.replace(new RegExp(`(hreflang="${other}" href=")${BASES[other].replace(/\//g, '\\/')}"`, 'g'), `$1${ROUTES[other]}"`);
  return html;
}

/** Links the Genie product page to its privacy policy (Google checks that the homepage links to it). */
export function linkFromGeniePage(html, lang) {
  if (html.includes(`href="${ROUTES[lang]}"`)) return html;
  const link = `<p class="container genie-privacy-link" data-genie-privacy-link><a class="text-link" href="${ROUTES[lang]}">${e(COPY[lang].footerLink)}</a></p>`;
  return swap(html, '</main>', `${link}</main>`);
}

export async function writeGeniePrivacy(dist, origin) {
  const routes = [];
  for (const lang of ['ja', 'en']) {
    const template = await fs.readFile(path.join(dist, BASES[lang], 'index.html'), 'utf8');
    const target = path.join(dist, ROUTES[lang], 'index.html');
    await fs.mkdir(path.dirname(target), {recursive: true});
    await fs.writeFile(target, renderGeniePrivacy(template, lang, origin));
    const page = path.join(dist, GENIE[lang], 'index.html');
    await fs.writeFile(page, linkFromGeniePage(await fs.readFile(page, 'utf8'), lang));
    routes.push({route: ROUTES[lang], lang, page: 'genie-privacy'});
  }
  return routes;
}
