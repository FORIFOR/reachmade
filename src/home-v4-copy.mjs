/** Interface copy only. Product claims, status, scope and evidence stay in products.mjs. */
export const homeV4Copy = {
  ja: {
    eyebrow: 'AIプロダクトの自主開発と、企業向け開発支援',
    title: ['思いついたら、', '使えるかたちに'], dot: '。',
    lead: '<span>業務の自動化、音声AI、</span><span>新しいプロダクト。</span><br><span>動く試作と検証から、</span><br class="v4-mobile-break"><span>使えるかたちを一緒につくります。</span>',
    consult: '開発を相談する', seeWork: 'つくったものを見る', heroNote: '構想が固まる前から、相談できます。',
    heroFoot: 'つくる。確かめる。使えるかたちへ。', reelTitle: '実際につくったもの',
    reelLabel: n => `${n}つのプロダクトの映像`, selectFilm: '製品映像を選ぶ',
    recording: '実録画', silentEdited: '（無音・編集あり）', treatment: '無音・編集あり', edited: '編集あり',
    stillLabel: kind => `${kind}の静止画`, playLabel: name => `${name}の映像を再生（無音・編集あり）`,
    playCopy: name => `${name}の映像を見る`, excerpt: '元映像から約13秒を抜粋',
    videoFallback: 'この動画は、このブラウザーでは再生できません。',
    reelError: '映像を読み込めませんでした。再生ボタンで再試行できます。',
    recordingNotes: '映像の収録・編集について',
    recordingNote: n => `公開映像から各約13秒を選び、無音・速度変更なしで編集しています。Launchloomは自身で作った紹介映像です。Genieは開発中の次の版のTaskDockの動きを再現した映像、Oathraはイメージ映像、Agent Teamは未実装の画面を含む設計動画、星藍ノアは画面を再現した紹介映像です。これらは実アプリや配信の実録画ではありません。入力や検証の条件は各製品の「映像と利用条件」で確認できます。${n}つは独立した製品で、自動連携しません。`,
    clips: {genie:'呼び出しから結果へ','ai-meeting':'会話からタスクへ',oathra:'会話から証拠へ',aisecure:'兆候から調査へ','agent-team':'依頼から、確かめた版へ',launchloom:'録画から公開素材へ',noa:'管理画面と仕組み'},
    kinds: {genie:'再現映像（開発中の次の版）',oathra:'イメージ映像（演出を含む）','agent-team':'設計動画（画面は再現・未実装を含む）',launchloom:'Launchloomが作った紹介映像',noa:'紹介映像（画面は再現・演出を含む）'},
    clipNotes: {
      genie:'次の版のTaskDock（開発中）の動きを再現した約13秒の映像です。背景は実アプリの紹介映像から切り出した画面で、データは架空です。実アプリの録画ではありません。確認できる記録は「映像と利用条件」と製品ページにあります。',
      oathra:'イメージ映像（演出を含む）から約13秒を切り出したもので、実際の通話の録画ではありません。確認できる記録は「映像と利用条件」と製品ページにあります。',
      'agent-team':'設計ファイルから書き出した設計動画から約13秒を切り出したもので、実アプリの録画ではありません。確認できる記録は「映像と利用条件」と製品ページにあります。'
    },
    setup: '利用条件・セットアップ', setupNote: 'Macとローカル設定が必要', tasks: 'タスク画面を試す', tasksNote: '文字入力のタスク機能は登録不要',
    entryNotes: {oathra:'公開サンプルの照合',aisecure:'合成データの調査','agent-team':'既存の実行記録を閲覧',launchloom:'生成済み素材を閲覧',noa:'YouTubeの公開配信・解説を閲覧'},
    productPage: name => `${name}の製品ページ`, viewProduct: '製品を見る', productDetails: '製品詳細', scope: '映像と利用条件', publishedEvidence: '公開している記録', license: 'ライセンス：',
    film15: '15秒の紹介映像（演出を含む）', noaExplainer: '5:48の解説（演出を含む）を見る',
    nextUi: '次のTaskDockの設計プレビューを見る', nextUiNote: '設計プレビューは未リリースで、実アプリの録画ではありません。',
    accessOriginalLink: '詳しく見る', access: '利用条件を一覧で比べる', accessHint: '状態・ライセンス・入口',
    servicesKicker: '企業向け開発支援', servicesTitle: '変えたい仕事から、<br>はじめましょう。',
    servicesLead: '設計・試作・評価から、必要な連携の実装まで。最初に何を確かめるかを決め、一緒に進めます。', servicesLink: '支援内容と進め方を見る',
    services: [
      ['業務AI・エージェント実装','調査、下書き、レビュー、承認。人とAIの分担を設計し、結果を追える業務フローを試作します。','関連 — Genie · Agent Team'],
      ['音声・電話AIの開発','対話型の練習、音声入力、電話業務。自然さだけでなく、誤認識・同意・人への引き継ぎまで設計します。','関連 — AI Meeting · Oathra'],
      ['新しいAIプロダクトの試作','まだ言葉だけのアイデアを、操作できる試作へ。使い勝手と成立条件を確かめ、次に作る範囲を整理します。','関連 — 複数プロダクトの自主開発経験']
    ],
    productsKicker: '自主開発プロダクト', productsTitle: 'あなたの仕事に、<br>つながるものを。', productsLead: 'できることから選んで、実物を確かめる。<br>試せる範囲と、必要な準備も一緒に。',
    sourceNote: date => `公開情報の確認日 ${date}。各製品は独立しており、自動連携しません。最新の利用条件は製品ページをご確認ください。`,
    principlesKicker: 'REACHMADEのつくり方', principlesTitle: 'つくるだけでなく、<br>確かめるところまで。',
    principlesLead: '自主開発で得た知見を、次の開発へ。<br>コード、実物、検証記録を公開しています。', about: 'ラボ・開発者について', work: '開発・検証記録を見る',
    principles: [
      ['実物で話す。','自主開発のプロダクト、コード、実行記録。言葉だけでなく、確認できるものを見せます。'],
      ['結果を確かめる。','AIの「できました」を、成功の証拠にしない。実行と確認を分け、未完了も残します。'],
      ['使う人に決定権を。','外部への送信、費用、権限、人の承認。使う人が判断できるよう、設計に組み込みます。']
    ],
    contactTitle: 'その「できたら」を、<br>一緒につくりませんか', contactLead: '構想が固まる前の段階から。<br>対象の業務と、試してみたいことを聞かせてください。'
  },
  en: {
    eyebrow: 'Independent AI products and development for companies',
    title: ['From an idea.', 'To something useful'], dot: '.',
    lead: '<span>Workflow automation, voice AI,</span> <span>and new products.</span><br>We build and test working prototypes<br class="v4-mobile-break"> to make your idea useful.',
    consult: 'Discuss a project', seeWork: 'See what we have built', heroNote: 'You can start with an idea, before the brief is settled.',
    heroFoot: 'Build it. Test it. Make it useful.', reelTitle: 'Things we have built',
    reelLabel: n => `Films of ${n} products`, selectFilm: 'Choose a product film',
    recording: 'Real recording', silentEdited: ' (silent · edited)', treatment: 'silent · edited', edited: 'edited',
    stillLabel: kind => `Still · ${kind}`, playLabel: name => `Play the ${name} film (silent · edited)`,
    playCopy: name => `Watch ${name}`, excerpt: 'About 13 seconds from the source film',
    videoFallback: 'This browser cannot play this video.',
    reelError: 'The film could not load. Press play to try again.',
    recordingNotes: 'About the footage and editing',
    recordingNote: n => `Each excerpt uses about 13 seconds of a published film, with no sound or playback-speed change. Launchloom made its own introduction film. Genie is a reconstruction of how the next TaskDock, still in development, moves. Oathra is a staged concept film, Agent Team is a design film with some unimplemented screens, and Noa is an introduction film with recreated screens. Those are not recordings of the live apps or stream. Input and evaluation conditions are in each product’s “Footage and conditions”. The ${n} products are independent and do not connect automatically.`,
    clips: {genie:'Invocation to result','ai-meeting':'Conversation to tasks',oathra:'Conversation to evidence',aisecure:'Signals to investigation','agent-team':'Request to a checked version',launchloom:'Recording to launch material',noa:'The control room and how it works'},
    kinds: {genie:'Illustrative reconstruction (next version, in development)',oathra:'Concept film (includes staging)','agent-team':'Design film (recreated screens, partly not implemented)',launchloom:'Introduction film made by Launchloom',noa:'Introduction film (recreated screens and staging)'},
    clipNotes: {
      genie:'About 13 seconds reconstructing how the next TaskDock (in development) moves. The background is a frame cut from the real app’s introduction film and the data is fictional. It is not a recording of the real app. Published evidence is in “Footage and conditions” and on the product page.',
      oathra:'About 13 seconds from a concept film with staging, not a recording of an actual call. Published evidence is in “Footage and conditions” and on the product page.',
      'agent-team':'About 13 seconds from a design film rendered from design files, not a recording of the real app. Published evidence is in “Footage and conditions” and on the product page.'
    },
    setup: 'Setup and requirements', setupNote: 'Requires a Mac and local setup', tasks: 'Try the task screen', tasksNote: 'Text tasks need no sign-up',
    entryNotes: {oathra:'Inspect a public sample',aisecure:'Investigate synthetic data','agent-team':'Read an existing run record',launchloom:'View generated material',noa:'Watch the public YouTube stream and explainers'},
    productPage: name => `${name} product page`, viewProduct: 'View product', productDetails: 'Product details', scope: 'Footage and conditions', publishedEvidence: 'Published evidence', license: 'License: ',
    film15: '15-second introduction film (includes motion graphics)', noaExplainer: 'Where to watch the 5:48 explainer (includes staging)',
    nextUi: 'See the next TaskDock design preview', nextUiNote: 'This design is not released. It is not a recording of the real app.',
    accessOriginalLink: 'Open', access: 'Compare access and requirements', accessHint: 'Stage · license · entry point',
    servicesKicker: 'DEVELOPMENT FOR COMPANIES', servicesTitle: 'Start with the work<br>you want to change.',
    servicesLead: 'From design, prototypes and evaluation to the integrations you need. We decide what to test first, then build it together.', servicesLink: 'See the support and process',
    services: [
      ['AI workflows and agents','Research, drafts, review and approval. We design how people and AI share the work, then prototype a workflow with results you can trace.','Related — Genie · Agent Team'],
      ['Voice and phone AI','Conversation practice, voice input and phone workflows. We plan for misheard words, consent and human handover, as well as natural conversation.','Related — AI Meeting · Oathra'],
      ['New AI product prototypes','Turn a spoken idea into something you can operate. Test how it works and what it requires, then decide what to build next.','Related — experience building independent products']
    ],
    productsKicker: 'INDEPENDENT PRODUCTS', productsTitle: 'Find a tool<br>for your work.', productsLead: 'Choose by what it does, then inspect the real work.<br>See what you can try and what you need to prepare.',
    sourceNote: date => `Public sources checked ${date}. Each product is independent; they do not connect automatically. Check the product pages for current requirements.`,
    principlesKicker: 'HOW REACHMADE BUILDS', principlesTitle: 'Build it.<br>Then check it.',
    principlesLead: 'What we learn from our own products informs the next project.<br>We share code, working examples and verification records.', about: 'About the lab and developer', work: 'Read the development records',
    principles: [
      ['Show the work.','Independent products, code and run records. We show things you can inspect alongside the description.'],
      ['Check the result.','The AI saying “done” is not evidence of success. We separate execution from verification and retain unfinished results.'],
      ['Keep people in control.','External data transfers, costs, permissions and approval are part of the design, so the person using it can decide.']
    ],
    contactTitle: 'Let’s make your<br>next idea useful', contactLead: 'You can start before the brief is settled.<br>Tell us about the work and what you would like to try.'
  }
};

export function copyFor(lang) {
  if (!Object.hasOwn(homeV4Copy, lang)) throw new TypeError(`Unsupported home language: ${lang}`);
  return homeV4Copy[lang];
}
