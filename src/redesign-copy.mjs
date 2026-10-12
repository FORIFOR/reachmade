/**
 * Interface copy for the 2026-10 redesign (owner's "Reachmade home redesign" handoff).
 * Product claims, status, scope and evidence stay in products.mjs; home section copy stays in home-v4-copy.mjs.
 * Only labels, meta lines and film captions live here.
 */
export const redesignCopy = {
  ja: {
    skip: '本文へ移動', menu: 'メニュー', home: 'トップ',
    nav: [['#products', 'プロダクト'], ['#services', '企業向け支援'], ['#principles', 'つくり方'], ['#contact', '相談']],
    tokyo: 'TOKYO', langSwitch: '言語',
    meta: ['Reachmade / Independent AI Studio', n => `(01—${String(n).padStart(2, '0')}) Products · Tokyo`],
    scroll: ['SCROLL', '構想が固まる前から。'],
    reelKicker: '(02) 実際につくったもの',
    // reachmade-15s.mp4: motion graphics rendered from film.html, with a soundtrack (films/manifest.json). Made when there were six products.
    reelCaption: '15秒の紹介映像（画面は再現・演出を含む）· 音声あり · 制作時点の6製品を紹介',
    reelLabel: 'Reachmadeの15秒紹介映像',
    productsKicker: '(03) 自主開発プロダクト',
    servicesKicker: '(04) 企業向け開発支援',
    principlesKicker: '(05) Reachmadeのつくり方',
    contactKicker: '(06) 相談する',
    keptKicker: '(+) 利用条件とよくある質問',
    records: '検証記録と映像', recordLink: '検証記録',
    footCols: [['SITE', [['/products/', 'プロダクト'], ['/services/', '企業向け支援'], ['/work/', '開発記録'], ['/about/', 'ラボについて']]], ['CODE', [['https://github.com/FORIFOR', 'GitHub ↗'], ['/privacy/', 'プライバシー']]]],
    lang: ['LANG', '日本語', 'English'],
    copyright: '© 2026 REACHMADE LAB', top: 'BACK TO TOP ↑', homeLink: '← REACHMADE HOME',
    preview: '製品の画面',
    stillLabels: {'agent-team': '設計動画の一場面（画面は再現・未実装を含む）'},
    // Product page
    productOf: (i, n) => `Product ${i} / ${String(n).padStart(2, '0')}`,
    allProducts: 'すべてのプロダクト', consultNav: '相談', consultHero: 'この技術で相談する',
    whatItDoes: 'What it does', film: name => `(03) ${name} — Film`,
    highlights: '(04) 要点', features: '(05) できること', featuresNote: d => `機能は各リポジトリと照合済み（${d}）`,
    detailKicker: '(+) くわしく見る',
    scopeKicker: '(06) 試せる範囲と根拠', scopeTitle: 'できないことも、<br>先に書いておく。',
    scopeNote: d => `公開情報の確認日 ${d}。最新の利用条件は各リポジトリと製品ページでご確認ください。`,
    scopeLabel: 'SCOPE / 範囲', proofLabel: 'PROOF / 公開している根拠',
    linkKinds: { demo: 'DEMO', source: 'SOURCE', evidence: 'EVIDENCE' }, sourceLabel: 'コードをGitHubで読む', evidenceLabel: '検証資料を読む',
    consultKicker: '(07) この技術で相談する', consultCta: '開発を相談する',
    next: 'NEXT', fig: 'FIG.',
    filmKinds: {
      recording: '実録画（無音・編集あり）',
      launchloom: 'Launchloomが作った紹介映像（無音・編集あり）',
      noa: '紹介映像（約35秒・無音・画面は再現・演出を含む）',
      'agent-team': '設計動画（30秒・無音・画面は再現・未実装を含む）'
    },
    filmNotes: {
      'agent-team': '設計ファイルから書き出した映像で、実アプリの録画ではありません。依頼・会話・確認の内容は架空の例です。',
    },
    agentTeamRecording: '実アプリの作業記録（録画）を見る', stillKind: '静止画（実録画と紹介映像はこのページの「実録画」に）', filmBelow: '静止画です。実録画と紹介映像は、このページの「実録画」で再生できます',
    play: name => `${name}の映像を再生`, videoFallback: 'この動画は、このブラウザーでは再生できません。'
  },
  en: {
    skip: 'Skip to content', menu: 'Menu', home: 'home',
    nav: [['#products', 'Products'], ['#services', 'For companies'], ['#principles', 'How we build'], ['#contact', 'Contact']],
    tokyo: 'TOKYO', langSwitch: 'Language',
    meta: ['Reachmade / Independent AI Studio', n => `(01—${String(n).padStart(2, '0')}) Products · Tokyo`],
    scroll: ['SCROLL', 'Before the brief is settled.'],
    reelKicker: '(02) Things we have built',
    reelCaption: '15-second introduction film (recreated screens and staging) · with sound · shows the six products at the time it was made',
    reelLabel: 'Reachmade 15-second introduction film',
    productsKicker: '(03) Independent products',
    servicesKicker: '(04) Development for companies',
    principlesKicker: '(05) How Reachmade builds',
    contactKicker: '(06) Contact',
    keptKicker: '(+) Access and questions',
    records: 'Records and films', recordLink: 'Work notes',
    footCols: [['SITE', [['/en/products/', 'Products'], ['/en/services/', 'For companies'], ['/en/work/', 'Work notes'], ['/en/about/', 'About']]], ['CODE', [['https://github.com/FORIFOR', 'GitHub ↗'], ['/en/privacy/', 'Privacy']]]],
    lang: ['LANG', '日本語', 'English'],
    copyright: '© 2026 REACHMADE LAB', top: 'BACK TO TOP ↑', homeLink: '← REACHMADE HOME',
    preview: 'Product screen',
    stillLabels: {'agent-team': 'A frame from the design film (recreated screens, partly not implemented)'},
    productOf: (i, n) => `Product ${i} / ${String(n).padStart(2, '0')}`,
    allProducts: 'All products', consultNav: 'Contact', consultHero: 'Discuss this technology',
    whatItDoes: 'What it does', film: name => `(03) ${name} — Film`,
    highlights: '(04) Highlights', features: '(05) What it can do', featuresNote: d => `Features checked against each repository (${d})`,
    detailKicker: '(+) In detail',
    scopeKicker: '(06) Scope and evidence', scopeTitle: 'What it cannot do,<br>stated up front.',
    scopeNote: d => `Public sources checked ${d}. Check each repository and product page for current terms.`,
    scopeLabel: 'SCOPE', proofLabel: 'PROOF / PUBLISHED EVIDENCE',
    linkKinds: { demo: 'DEMO', source: 'SOURCE', evidence: 'EVIDENCE' }, sourceLabel: 'Read the code on GitHub', evidenceLabel: 'Read the evaluation record',
    consultKicker: '(07) Build with it', consultCta: 'Discuss a project',
    next: 'NEXT', fig: 'FIG.',
    filmKinds: {
      recording: 'Real recording (silent · edited)',
      launchloom: 'Introduction film made by Launchloom (silent · edited)',
      noa: 'Introduction film (about 35 s · silent · recreated screens and staging)',
      'agent-team': 'Design film (30 s · silent · recreated screens, partly not implemented)'
    },
    filmNotes: {
      'agent-team': 'Rendered from design files; not a recording of the real app. The request, conversation and checks are fictional examples.',
    },
    agentTeamRecording: 'Watch a recording of a real run', stillKind: 'Still image (the recording and film are further down)', filmBelow: 'Still image. Play the recording and the film further down this page',
    play: name => `Play the ${name} film`, videoFallback: 'This browser cannot play this video.'
  }
};

export function redesignCopyFor(lang) {
  if (!Object.hasOwn(redesignCopy, lang)) throw new TypeError(`Unsupported redesign language: ${lang}`);
  return redesignCopy[lang];
}
