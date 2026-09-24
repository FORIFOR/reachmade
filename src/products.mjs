/** Public source statements checked 2026-09-15. These are NOT a fresh runtime audit. */
export const products = [
  {
    id: 'genie', name: 'Genie', index: '01', category: 'work', discipline: 'AMBIENT AI WORKSPACE',
    repo: 'https://github.com/FORIFOR/genie', labSite: 'https://genie.reachmade.com/', site: 'https://reachmade.com/products/genie/',
    preview: '/assets/products/genie.jpg', previewSource: 'genie/docs/golden-screenshots/workspace-ux/home-1162-light.png', hero: true,
    source: 'https://github.com/FORIFOR/genie/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/genie/blob/main/docs/ENTERPRISE_READINESS.md',
    demo: 'https://reachmade.com/products/genie/demos/#prototype',
    sourceSha: 'b432b390dc50225743135e400afe9f7fba81ea31',
    ja: {
      headline: '作業を止めずに、考えを前へ。', demoLabel: '録画・画面を見る', previewLabel: '実アプリのワークスペース',
      short: 'いま見ている仕事から離れず、問いかけ、結果をその場で使うMacのAIワークスペース。',
      description: 'TaskDockを呼び出し、必要なら画面を添えて質問。別の作業画面へ移らずに回答を確認し、コピーや保存で仕事へ戻せます。',
      status: '開発者プレビュー', license: 'ソース公開・全体ライセンス未設定',
      outcome: 'いまの作業 → 質問 → その場で使える結果',
      scope: 'アプリだけでは利用が完結しません。ローカルサービスとモデルの設定が必要です。以前の名称はAstraです。',
      proof: '実アプリの録画と、保存された成果物。待ち時間は編集されています。',
      consult: '社内向けAIワークスペースや、ローカルモデルを含む業務アシスタントの試作。'
    },
    en: {
      headline: 'Stay in the work. Move the thinking forward.', demoLabel: 'See the recorded workspace', previewLabel: 'Real app workspace',
      short: 'A Mac AI workspace for asking about the work in front of you and using the answer without switching away.',
      description: 'Bring up TaskDock, optionally attach the screen in front of you, ask one focused question, then copy or save the answer without moving into a separate AI workspace.',
      status: 'Developer preview', license: 'Public source · no project-wide license',
      outcome: 'Current work → question → usable result',
      scope: 'The app needs local services and a configured model. The download alone is not a hosted service. Previously Astra.',
      proof: 'Real app recordings and saved artifacts. Waiting is condensed.',
      consult: 'Prototype an internal AI workspace or an assistant using local and external models.'
    }
  },
  {
    id: 'ai-meeting', name: 'AI Meeting', index: '02', category: 'voice', discipline: 'VOICE & INTERACTION',
    repo: 'https://github.com/FORIFOR/AI-meeting', labSite: 'https://ai-meeting.reachmade.com/', site: 'https://reachmade.com/products/ai-meeting/', appSite: 'https://ai-meeting.web.app/',
    preview: '/assets/products/ai-meeting.jpg', previewSource: 'AI-meeting/docs/reports/img/gate7-result.png', featured: true,
    source: 'https://github.com/FORIFOR/AI-meeting/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/AI-meeting/blob/main/docs/validation.md',
    demo: 'https://youtu.be/qLenE6R7-nI', sourceSha: '3b269e92d9d8126f2506409ebd52d4add0781c6e',
    ja: {
      headline: '話したことが、次の行動になる。', demoLabel: '45秒の実演を見る', previewLabel: '検証レポートの実画面',
      short: '割り込めるAI会話から、確認済みのタスクを残す。',
      description: 'AIキャラクターと話し、途中で方向を変え、必要なタスクを残す。聞き違いがあり得る変更は、確認を挟んでから保存します。',
      status: 'ベータ', license: 'Apache-2.0 · 素材などは別条件',
      outcome: '会話 → 変更 → 確認 → タスク',
      scope: '登録不要のタスク機能と、メール認証・時間制限のある音声体験は別です。外部会議への接続は個別の設定と検証が必要です。',
      proof: '実Gemini応答を用いた45秒の録画。入力は合成音声で、一部の確認操作はスクリプトです。',
      consult: '対話型の練習・研修、音声からの業務入力、キャラクターを使ったAIサービスの試作。'
    },
    en: {
      headline: 'What you say becomes the next step.', demoLabel: 'Watch the 45-second demo', previewLabel: 'Validation report',
      short: 'An interruptible AI conversation that leaves confirmed tasks.',
      description: 'Talk with an AI character, change direction, and keep the tasks that matter. Uncertain changes stay pending until they are confirmed.',
      status: 'Beta', license: 'Apache-2.0 · separate asset terms',
      outcome: 'Conversation → change → confirmation → tasks',
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
      headline: 'AIの「できた」ではなく、相手の言葉で確かめる。', demoLabel: 'サンプルログを検証する', previewLabel: '完了判定の画面',
      short: '電話の完了判定を、AIの自己申告から切り離す。',
      description: 'AIの電話交渉と、その結果を証拠で確認するランタイム。日時・人数・金額・確定を、相手側の発言と結びつけます。',
      status: '開発版', license: 'Apache-2.0',
      outcome: '通話 → 相手の発言 → 検証済み結果',
      scope: '会話上の合意と、店舗システムへの登録は別です。シミュレーターと実電話の検証も区別します。実電話には設定と費用が必要です。',
      proof: '文字起こしの判定画面、シミュレーター、実通話の開発記録。100件の実電話検証は未完了です。',
      consult: '電話業務の試作、既存音声AIへの完了判定の組み込み、同意と人への引き継ぎの設計。'
    },
    en: {
      headline: 'Not the AI saying “done.” The other party’s words.', demoLabel: 'Inspect a sample call', previewLabel: 'Completion evidence',
      short: 'Take completion judgment away from the agent’s self-report.',
      description: 'A runtime for AI phone negotiations and evidence-based completion checks. Tie dates, party size, amounts and confirmation to the other party’s words.',
      status: 'Developer release', license: 'Apache-2.0',
      outcome: 'Call → other-party evidence → verified result',
      scope: 'A spoken agreement does not prove a booking exists in a business system. Simulation and real-call evidence are separate. Real calls need configuration and incur costs.',
      proof: 'Transcript checks, simulation, and documented real-call development. The 100-real-call evaluation is not complete.',
      consult: 'Prototype a phone workflow, add completion checks to a voice agent, or design consent and human handoff.'
    }
  },
  {
    id: 'aisecure', name: 'AI Secure', index: '04', category: 'trust', discipline: 'SECURITY & PREFLIGHT',
    repo: 'https://github.com/FORIFOR/AISecure', labSite: 'https://aisecure.reachmade.com/', site: 'https://forifor.github.io/AISecure/',
    preview: '/assets/products/aisecure.jpg', previewSource: 'AISecure/docs/screenshots/audit.png',
    source: 'https://github.com/FORIFOR/AISecure/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/AISecure/blob/main/docs/security/DETECTION_MEASUREMENT.md',
    demo: 'https://forifor.github.io/AISecure/', sourceSha: '357abc6d30d32a317be62c738d36550febb08167',
    ja: {
      headline: '送る前に、ローカルで確かめる。', demoLabel: '送信前検査の実演を見る', previewLabel: '送信前検査ワークベンチ',
      short: 'AIへ渡す文書を、送信前にローカル検査。',
      description: '文書を外へ送る前にローカルで検査し、判定・理由・検査範囲をレポートとして残す。見つけられないカテゴリも測定結果として明示します。',
      status: 'アルファ / 検証中', license: 'MIT',
      outcome: '文書 → ローカル検査 → 判断・レポート',
      scope: '送信前の明示的な検査です。常時監視や自動遮断ではなく、OCR、アンチウイルス、全ブラウザDLP、完全な漏えい防止や本番認証を保証しません。公開測定では見逃すカテゴリがあります。',
      proof: '実ワークベンチのデモと、60ケースのラベル付き合成コーパスで公開している検出測定。',
      consult: 'AI利用前のデータ検査、文書preflight、判断理由と監査記録を残す業務フローの試作。'
    },
    en: {
      headline: 'Inspect it locally before it leaves.', demoLabel: 'Watch the preflight workflow', previewLabel: 'Document preflight workbench',
      short: 'Inspect a document locally before sending it to an AI service.',
      description: 'Inspect a document locally before it leaves, then keep the decision, reasons and inspection coverage together in a report. Published measurements also show categories the current detector misses.',
      status: 'Alpha / under evaluation', license: 'MIT',
      outcome: 'Document → local preflight → decision and report',
      scope: 'Explicit preflight, not blanket browser DLP. No OCR, antivirus, guaranteed leak prevention or production certification is claimed, and published measurements include categories the detector misses.',
      proof: 'A real workbench demo plus published detection measurements on a 60-case labelled synthetic corpus.',
      consult: 'Prototype AI-data preflight, document inspection, and workflows that preserve reasons and audit metadata.'
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
      headline: 'ひとつ頼む。チームが作り、確かめ、直す。', demoLabel: '実行記録を見る', previewLabel: 'エージェント実行記録',
      short: '作成・レビュー・修正を、成果物の版と一緒に残す。',
      description: '依頼に合わせてAIが役割を分担。成果物の版と、誰が何を確かめたかを結びつけ、完成した部分も未完了の部分も残します。',
      status: '開発・評価中', license: 'MIT · リポジトリ名はMultibot',
      outcome: '依頼 → 作成 → レビュー → 修正 → 再確認',
      scope: '単一エージェントより高品質とはまだ言えません。公開比較には失敗や実行環境による制約があり、顧客環境での本番受け入れは別評価です。',
      proof: '実モデルの作業記録と、失敗も含めた評価記録。紹介映像の研究タスクは部分完了です。',
      consult: '業務の役割分担、成果物の検証、予算・権限・人の承認を含むエージェント基盤の試作。'
    },
    en: {
      headline: 'One request. The team drafts, checks, and revises.', demoLabel: 'Read the run record', previewLabel: 'Agent work trail',
      short: 'Draft, review and revise with every check tied to an artifact revision.',
      description: 'AI agents share the work. Revisions stay connected to who checked what, and unfinished work is reported alongside completed artifacts.',
      status: 'Under evaluation', license: 'MIT · repository: Multibot',
      outcome: 'Request → draft → review → revision → re-check',
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
      headline: '作ったものを、公開できる素材へ。', demoLabel: 'ローンチキットを見る', previewLabel: '生成されたLP',
      short: '実録画から、動画・LP・投稿案をひとつの制作フローで。',
      description: 'ひとつの製品説明と実際の操作録画から、横動画、縦動画、LP、SNSの投稿案を作るローカル制作基盤です。',
      status: 'アルファ', license: 'Apache-2.0 · 外部ツールは別条件',
      outcome: '実録画 → 映像・LP・投稿案',
      scope: '単一利用者向けです。素材の生成とSNSへの公開は別工程で、実アカウントへの投稿は検証未完了。成果や反響は保証しません。',
      proof: '自身で作った紹介映像、実際のローンチキット、ローカルの制作・検証記録。',
      consult: '操作録画と公開素材をつなぐ制作フロー、ブランドに合わせたテンプレート、確認工程の設計。'
    },
    en: {
      headline: 'Turn what you built into material ready to publish.', demoLabel: 'Open the launch kit', previewLabel: 'Generated launch page',
      short: 'Turn one real product recording into films, a landing page and social drafts in one production flow.',
      description: 'Make a landscape film, a vertical cut, a landing page, and social drafts from one product brief and a real recording, locally.',
      status: 'Alpha', license: 'Apache-2.0 · separate integration terms',
      outcome: 'Real recording → film, page, social drafts',
      scope: 'Single-operator alpha. Generating material is not publishing it. Real social-account publishing remains unverified; engagement and business outcomes are not guaranteed.',
      proof: 'A film made by the tool itself, a real launch kit, and local verification records.',
      consult: 'Design a recording-to-launch workflow, brand-specific templates, and approval steps.'
    }
  }
];
