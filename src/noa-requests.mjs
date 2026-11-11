/** 星藍ノア's request pages: contact, stream advertising and game requests. Every form is the site's one inquiry form. */
import { products } from './products.mjs';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list = items => `<ul>${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;

export function noaRequestPages(lang) {
  const ja = lang === 'ja', home = ja ? '/' : '/en/', page = suffix => `${home}products/noa/${suffix}/`;
  const noa = products.find(p => p.id === 'noa');
  const facts = noa?.requests?.[lang];
  if (!facts?.sponsorSlot?.length || !facts?.games?.length) throw new Error('Noa request pages need ledger facts');
  const form = (anchor, label) => `<a class="button" href="${home}contact/#use-${anchor}">${escape(label)}</a>`;
  const contact = ja ? `
<p class="lead">コラボ・出演・取材など、星藍ノアへのご連絡はこちらから。</p>
<p class="note">ノアはAIで動く配信キャラクターです。運営はReachmade Labで、お返事は運営者がメールでお送りします。</p>
<section id="topics"><h2>内容に合わせて選んでください</h2>
<ul><li><a href="${page('sponsor')}">配信への広告掲載・タイアップ</a></li><li><a href="${page('games')}">やって欲しいゲームのリクエスト</a></li></ul></section>
<section id="send"><h2>そのほかのお問い合わせ</h2><p>最初のご連絡に、個人情報や機密情報は必要ありません。</p>${form('noa-contact','ノアに問い合わせる')}</section>` : `
<p class="lead">Collaborations, appearances, press and more: contact 星藍ノア (Noa) here.</p>
<p class="note">Noa is an AI-driven streaming character run by Reachmade Lab. The operator replies by email.</p>
<section id="topics"><h2>Choose what fits</h2>
<ul><li><a href="${page('sponsor')}">Advertising or tie-ups on the stream</a></li><li><a href="${page('games')}">Requesting a game</a></li></ul></section>
<section id="send"><h2>Anything else</h2><p>Personal or confidential information is not needed for a first message.</p>${form('noa-contact','Contact Noa')}</section>`;
  const sponsor = ja ? `
<p class="lead">ノアの配信画面に、企業・サービスの広告を掲載できます。</p>
<section id="slot"><h2>掲載のしかた</h2>${list(facts.sponsorSlot)}</section>
<section id="terms"><h2>料金・期間</h2><p>ご相談のうえで決めます。内容によっては、お受けできないことがあります。</p>${form('noa-sponsor','広告掲載を相談する')}</section>` : `
<p class="lead">Companies and services can advertise on Noa’s stream.</p>
<section id="slot"><h2>How it appears</h2>${list(facts.sponsorSlot)}</section>
<section id="terms"><h2>Price and period</h2><p>Agreed case by case. Some requests may be declined.</p>${form('noa-sponsor','Discuss advertising')}</section>`;
  const games = ja ? `
<p class="lead">ノアに遊んで欲しいゲームを、教えてください。</p>
<section id="now"><h2>今あそんでいるゲーム</h2>${list(facts.games)}</section>
<section id="request"><h2>リクエストについて</h2><ul><li>配信が認められているゲームに限ります。</li><li>ゲームによっては、人が操作してノアが実況します。</li><li>すべてのリクエストにはお応えできません。</li></ul>${form('noa-game','ゲームをリクエストする')}</section>` : `
<p class="lead">Tell us a game you would like Noa to play.</p>
<section id="now"><h2>Playing now</h2>${list(facts.games)}</section>
<section id="request"><h2>About requests</h2><ul><li>Only games whose publishers allow streaming.</li><li>For some games a person plays and Noa commentates.</li><li>Not every request can be taken up.</li></ul>${form('noa-game','Request a game')}</section>`;
  return [
    {product:'noa', suffix:'contact', title:ja?'星藍ノアへのお問い合わせ':'Contact 星藍ノア (Noa)', description:ja?'星藍ノアへのコラボ・出演・取材などのお問い合わせ窓口。':'Contact 星藍ノア (Noa) about collaborations, appearances and press.', eyebrow:'星藍ノア / CONTACT', body:contact},
    {product:'noa', suffix:'sponsor', title:ja?'配信への広告掲載を募集しています':'Advertise on Noa’s stream', description:ja?'星藍ノアの配信画面に、企業・サービスの広告を掲載できます。':'Companies and services can advertise on 星藍ノア (Noa)’s stream.', eyebrow:'星藍ノア / ADVERTISING', body:sponsor},
    {product:'noa', suffix:'games', title:ja?'やって欲しいゲームを募集中':'Request a game for Noa', description:ja?'星藍ノアに遊んで欲しいゲームのリクエストを受け付けています。':'Suggest a game for 星藍ノア (Noa) to play on stream.', eyebrow:'星藍ノア / GAME REQUESTS', body:games},
  ];
}
