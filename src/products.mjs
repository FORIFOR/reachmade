/** Public source statements checked 2026-09-15. These are NOT a fresh runtime audit. */
export const products = [
  {
    id: 'genie', name: 'Genie', index: '01', category: 'work', discipline: 'AI WORKSPACE',
    repo: 'https://github.com/FORIFOR/genie', labSite: 'https://genie.reachmade.com/', site: 'https://genie-forifor.forifor.chatgpt.site',
    preview: '/assets/products/genie.jpg', previewSource: 'genie/docs/golden-screenshots/workspace-ux/home-1162-light.png', hero: true,
    source: 'https://github.com/FORIFOR/genie/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/genie/blob/main/docs/ENTERPRISE_READINESS.md',
    demo: 'https://genie-forifor.forifor.chatgpt.site/#demo',
    sourceSha: 'b432b390dc50225743135e400afe9f7fba81ea31',
    ja: {
      headline: '考えを、手元に残る仕事へ。', demoLabel: '録画・画面を見る', previewLabel: '実アプリのワークスペース',
      short: '自分のAIモデルと作る、Macのワークスペース。',
      description: 'メモから実行計画、Webコピー、小さなHTMLの試作まで。接続したモデルと作業し、結果を開き直したり、Markdownとして保存したりできます。',
      status: '開発者プレビュー', license: 'ソース公開・全体ライセンス未設定',
      outcome: 'メモ → 計画・コピー・HTML',
      scope: 'アプリだけでは利用が完結しません。ローカルサービスとモデルの設定が必要です。以前の名称はAstraです。',
      proof: '実アプリの録画と、保存された成果物。待ち時間は編集されています。',
      consult: '社内向けAIワークスペースや、ローカルモデルを含む業務アシスタントの試作。'
    },
    en: {
      headline: 'Give an idea somewhere to become work.', demoLabel: 'See the recorded workspace', previewLabel: 'Real app workspace',
      short: 'A Mac workspace for working with your own AI model.',
      description: 'Turn rough notes into a plan, website copy, or a small HTML prototype. Reopen the result, copy it, or save it as Markdown.',
      status: 'Developer preview', license: 'Public source · no project-wide license',
      outcome: 'Notes → plans, copy, HTML',
      scope: 'The app needs local services and a configured model. The download alone is not a hosted service. Previously Astra.',
      proof: 'Real app recordings and saved artifacts. Waiting is condensed.',
      consult: 'Prototype an internal AI workspace or an assistant using local and external models.'
    }
  },
  {
    id: 'ai-meeting', name: 'AI Meeting', index: '02', category: 'voice', discipline: 'VOICE & INTERACTION',
    repo: 'https://github.com/FORIFOR/AI-meeting', labSite: 'https://ai-meeting.reachmade.com/', site: 'https://ai-meeting.web.app/',
    preview: '/assets/products/ai-meeting.jpg', previewSource: 'AI-meeting/docs/reports/img/gate7-result.png', featured: true,
    source: 'https://github.com/FORIFOR/AI-meeting/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/AI-meeting/blob/main/docs/validation.md',
    demo: 'https://youtu.be/qLenE6R7-nI', sourceSha: '3b269e92d9d8126f2506409ebd52d4add0781c6e',
    ja: {
      headline: '話して整理。次の行動まで。', demoLabel: '45秒の実演を見る', previewLabel: '検証レポートの実画面',
      short: '会話から生まれたタスクを、確認して残す。',
      description: 'AIキャラクターと話し、途中で方向を変え、必要なタスクを残す。聞き違いがあり得る変更は、確認を挟んでから保存します。',
      status: 'ベータ', license: 'Apache-2.0 · 素材などは別条件',
      outcome: '会話 → 確認 → タスク',
      scope: '登録不要のタスク機能と、メール認証・時間制限のある音声体験は別です。外部会議への接続は個別の設定と検証が必要です。',
      proof: '実Gemini応答を用いた45秒の録画。入力は合成音声で、一部の確認操作はスクリプトです。',
      consult: '対話型の練習・研修、音声からの業務入力、キャラクターを使ったAIサービスの試作。'
    },
    en: {
      headline: 'Think out loud. Keep the next step.', demoLabel: 'Watch the 45-second demo', previewLabel: 'Validation report',
      short: 'An interruptible conversation that leaves confirmed tasks.',
      description: 'Talk with an AI character, change direction, and keep the tasks that matter. Uncertain changes stay pending until they are confirmed.',
      status: 'Beta', license: 'Apache-2.0 · separate asset terms',
      outcome: 'Conversation → confirmation → tasks',
      scope: 'Account-free tasks and the verified-email, time-limited voice trial are different experiences. External meeting connections require setup and evaluation.',
      proof: '45-second recording with real Gemini responses, synthetic speech input, and some scripted confirmations.',
      consult: 'Prototype voice-based training, task capture, or an AI character experience.'
    }
  },
  {
    id: 'oathra', name: 'Oathra', index: '03', category: 'voice', discipline: 'PHONE & EVIDENCE',
    repo: 'https://github.com/FORIFOR/oathra', labSite: 'https://oathra.reachmade.com/', site: 'https://forifor.github.io/oathra/',
    preview: '/assets/products/oathra.jpg', previewSource: 'oathra/docs/media/arena-confirmed.png', featured: true,
    source: 'https://github.com/FORIFOR/oathra/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/oathra/blob/main/docs/ENTERPRISE_READINESS.md',
    demo: 'https://forifor.github.io/oathra/check.html',
    ja: {
      headline: '電話の結果に、確かめられる根拠を。', demoLabel: 'サンプルログを検証する', previewLabel: '完了判定の画面',
      short: 'AIの「できました」を、完了の根拠にしない。',
      description: 'AIの電話交渉と、その結果を確認するための基盤。日時・金額・確定の根拠を、相手側の発言と結びつけます。',
      status: '開発版', license: 'Apache-2.0',
      outcome: '通話 → 発言の根拠 → 結果',
      scope: '会話上の合意と、店舗システムへの登録は別です。シミュレーターと実電話の検証も区別します。実電話には設定と費用が必要です。',
      proof: '文字起こしの判定画面、シミュレーター、実通話の開発記録。100件の実電話検証は未完了です。',
      consult: '電話業務の試作、既存音声AIへの完了判定の組み込み、同意と人への引き継ぎの設計。'
    },
    en: {
      headline: 'A phone call. A result you can inspect.', demoLabel: 'Inspect a sample call', previewLabel: 'Completion evidence',
      short: 'The agent saying “done” is not evidence.',
      description: 'A runtime for AI phone negotiations and evidence-based completion checks. Tie dates, amounts, and confirmation to the other party’s words.',
      status: 'Developer release', license: 'Apache-2.0',
      outcome: 'Call → evidence → result',
      scope: 'A spoken agreement does not prove a booking exists in a business system. Simulation and real-call evidence are separate. Real calls need configuration and incur costs.',
      proof: 'Transcript checks, simulation, and documented real-call development. The 100-real-call evaluation is not complete.',
      consult: 'Prototype a phone workflow, add completion checks to a voice agent, or design consent and human handoff.'
    }
  },
  {
    id: 'aisecure', name: 'AI Secure', index: '04', category: 'trust', discipline: 'SECURITY & INVESTIGATION',
    repo: 'https://github.com/FORIFOR/AISecure', labSite: 'https://aisecure.reachmade.com/', site: 'https://forifor.github.io/AISecure/',
    preview: '/assets/products/aisecure.jpg', previewSource: 'AISecure/docs/screenshots/audit.png',
    source: 'https://github.com/FORIFOR/AISecure/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/AISecure/blob/main/docs/TUNING.md',
    demo: 'https://forifor.github.io/AISecure/try.html', sourceSha: '357abc6d30d32a317be62c738d36550febb08167',
    ja: {
      headline: '点のアラートを、調べられる一件に。', demoLabel: '合成ケースを調べる', previewLabel: '調査ケースの画面',
      short: '判断の根拠を辿る、ローカル分析プロトタイプ。',
      description: '公開状態、特権ログイン、ファイルアクセスを関連づけ、根拠と一緒に調べる。観測したこと、仮説、不明なことを分けて扱います。',
      status: '検証用プロトタイプ', license: 'MIT',
      outcome: 'ログ → 関連付け → 調査',
      scope: 'スナップショット分析です。常時監視、実際の遮断、漏えいの確定は行いません。公開検証は合成データで、本番の性能保証ではありません。',
      proof: '合成データを使う操作デモと、単独ルール・相関ルールの比較手順。',
      consult: 'ログ取り込みや判断の根拠を扱う設計の試作・評価。独立した本番セキュリティ対策の代替とはしません。'
    },
    en: {
      headline: 'From scattered alerts to one reviewable case.', demoLabel: 'Inspect a synthetic case', previewLabel: 'Investigation case',
      short: 'A local prototype for following the evidence.',
      description: 'Connect exposure, privileged access, and file activity. Keep observations, hypotheses, and unknowns distinct as you investigate.',
      status: 'Research prototype', license: 'MIT',
      outcome: 'Logs → correlation → review',
      scope: 'Snapshot analysis, not continuous monitoring or enforcement. It does not confirm exfiltration. Published evaluations use synthetic data, not production performance guarantees.',
      proof: 'An interactive synthetic case and reproducible single-rule versus correlation evaluation.',
      consult: 'Prototype log ingestion and evidence-aware investigation. Not a replacement for production security controls.'
    }
  },
  {
    id: 'agent-team', name: 'Agent Team', index: '05', category: 'work', discipline: 'MULTI-AGENT SYSTEMS',
    repo: 'https://github.com/FORIFOR/Multibot', labSite: 'https://multibot.reachmade.com/', site: 'https://forifor.github.io/Multibot/',
    preview: '/assets/products/agent-team.jpg', previewSource: 'Multibot/docs/media/timeline.png',
    source: 'https://github.com/FORIFOR/Multibot/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/Multibot/blob/main/docs/evidence/readiness-2026-09-14/README.md',
    demo: 'https://forifor.github.io/Multibot/',
    ja: {
      headline: '成果物も、そこまでの仕事も。', demoLabel: '実行記録を見る', previewLabel: 'エージェント実行記録',
      short: '作成・レビュー・修正を、経緯と一緒に残す。',
      description: '依頼に合わせてAIが役割を分担。成果物の版と、誰が何を確かめたかを結びつけ、完成した部分も未完了の部分も残します。',
      status: '開発・評価中', license: 'MIT · リポジトリ名はMultibot',
      outcome: '依頼 → 作成 → レビュー → 修正',
      scope: '単一エージェントより高品質とはまだ言えません。公開比較には失敗や実行環境による制約があり、顧客環境での本番受け入れは別評価です。',
      proof: '実モデルの作業記録と、失敗も含めた評価記録。紹介映像の研究タスクは部分完了です。',
      consult: '業務の役割分担、成果物の検証、予算・権限・人の承認を含むエージェント基盤の試作。'
    },
    en: {
      headline: 'The deliverable. And how it got there.', demoLabel: 'Read the run record', previewLabel: 'Agent work trail',
      short: 'Draft, review, revise — with a work trail.',
      description: 'AI agents share the work. Revisions stay connected to who checked what, and unfinished work is reported alongside completed artifacts.',
      status: 'Under evaluation', license: 'MIT · repository: Multibot',
      outcome: 'Request → draft → review → revision',
      scope: 'A quality advantage over a single agent has not been established. Published comparisons include failures and provider constraints. Production acceptance is separate.',
      proof: 'Real-model work records and evaluation results including failures. The featured research replay ended partial.',
      consult: 'Prototype agent workflows with explicit roles, artifact checks, budgets, permissions, and human approval.'
    }
  },
  {
    id: 'launchloom', name: 'Launchloom', index: '06', category: 'creation', discipline: 'PRODUCT & MEDIA',
    repo: 'https://github.com/FORIFOR/Launchloom', labSite: 'https://launchloom.reachmade.com/', site: 'https://forifor.github.io/Launchloom/',
    preview: '/assets/products/launchloom.jpg', previewSource: 'Launchloom/homepage/generated-page.png',
    source: 'https://github.com/FORIFOR/Launchloom/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/Launchloom/blob/main/docs/VERIFICATION.md',
    demo: 'https://forifor.github.io/Launchloom/', sourceSha: 'b32d110aa187d4865817411cfa011d47e668ab20',
    ja: {
      headline: '作ったものを、伝わる素材へ。', demoLabel: 'ローンチキットを見る', previewLabel: '生成されたLP',
      short: '実録画から、動画・LP・投稿案をひと揃い。',
      description: 'ひとつの製品説明と実際の操作録画から、横動画、縦動画、LP、SNSの投稿案を作るローカル制作基盤です。',
      status: 'アルファ', license: 'Apache-2.0 · 外部ツールは別条件',
      outcome: '製品 → 映像・LP・投稿案',
      scope: '単一利用者向けです。素材の生成とSNSへの公開は別工程で、実アカウントへの投稿は検証未完了。成果や反響は保証しません。',
      proof: '自身で作った紹介映像、実際のローンチキット、ローカルの制作・検証記録。',
      consult: '操作録画と公開素材をつなぐ制作フロー、ブランドに合わせたテンプレート、確認工程の設計。'
    },
    en: {
      headline: 'You built it. Now let people see it.', demoLabel: 'Open the launch kit', previewLabel: 'Generated launch page',
      short: 'A product recording becomes a launch kit.',
      description: 'Make a landscape film, a vertical cut, a landing page, and social drafts from one product brief and a real recording, locally.',
      status: 'Alpha', license: 'Apache-2.0 · separate integration terms',
      outcome: 'Product → film, page, social drafts',
      scope: 'Single-operator alpha. Generating material is not publishing it. Real social-account publishing remains unverified; engagement and business outcomes are not guaranteed.',
      proof: 'A film made by the tool itself, a real launch kit, and local verification records.',
      consult: 'Design a recording-to-launch workflow, brand-specific templates, and approval steps.'
    }
  }
];
