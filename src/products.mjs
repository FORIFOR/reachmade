/** Public source statements checked 2026-09-15. These are NOT a fresh runtime audit.
 *  2026-09-27: Genie's macOS 14 / optional-screenshot statement and Oathra's simulator agents were
 *  added from genie/README.md and oathra/README.md, for the fifteen-second films.
 *  2026-09-27: highlights/features per product were checked against each repository's README, docs and
 *  implementation (genie, AI-meeting, oathra, AISecure, Multibot, Launchloom). Only implemented behaviour is
 *  listed; timing and integration claims without a measurement were removed or qualified. */
/** Date the highlights/features of every product were checked against its repository. */
export const capabilitiesCheckedAt = '2026-09-27';
export const products = [
  {
    id: 'genie', name: 'Genie', index: '01', category: 'work', discipline: 'AI WORKSPACE',
    repo: 'https://github.com/FORIFOR/genie', labSite: 'https://genie.reachmade.com/', site: 'https://reachmade.com/products/genie/',
    preview: '/assets/products/genie.jpg', previewSource: 'genie/docs/golden-screenshots/workspace-ux/home-1162-light.png', hero: true,
    source: 'https://github.com/FORIFOR/genie/blob/main/README.md',
    evidence: 'https://github.com/FORIFOR/genie/blob/main/docs/ENTERPRISE_READINESS.md',
    demo: 'https://reachmade.com/products/genie/demos/#prototype',
    sourceSha: 'b432b390dc50225743135e400afe9f7fba81ea31',
    ja: {
      headline: '考えを、手元に残る仕事へ。', demoLabel: '録画・画面を見る', previewLabel: '実アプリのワークスペース',
      short: '自分のAIモデルと作る、Macのワークスペース。',
      description: 'メモから実行計画、Webコピー、小さなHTMLの試作まで。接続したモデルと作業し、結果を開き直したり、Markdownとして保存したりできます。',
      status: '開発者プレビュー', license: 'ソース公開・全体ライセンス未設定',
      outcome: 'メモ → 計画・コピー・HTML',
      scope: 'アプリだけでは利用が完結しません。ローカルサービスとモデルの設定が必要で、macOS 14以降が対象です。スクリーンショットは任意で、質問を送ったときだけ接続したモデルへ送られます。以前の名称はAstraです。',
      proof: '実アプリの録画と、保存された成果物。待ち時間は編集されています。',
      consult: '社内向けAIワークスペースや、ローカルモデルを含む業務アシスタントの試作。',
      highlights: [{value:'⌥+Space',label:'常駐のTaskDockを、どのアプリからも呼び出す'},{value:'Ollama対応',label:'ローカルモデル構成なら外部送信なし。画面添付は接続先へ送る'},{value:'Markdown保存',label:'結果をコピー、またはMarkdownとして保存'}],
      features: [
        {code:'F-01 / TASKDOCK',title:'常駐TaskDock（⌥+Space）',body:'macOS全体のショートカットで常駐オーバーレイを開き、作業中のアプリを離れずに依頼できます。既定はOption+Spaceです。',tags:['常駐UI','グローバルショートカット','macOS 14以降']},
        {code:'F-02 / SCREENSHOT',title:'スクリーンショットを添えて質問',body:'⌘⇧4で撮った画面を自動で検出し、貼り付けなしに質問へ添えられます。撮っただけでは送らず、質問を送ったときだけ接続したモデルへ送られます。',tags:['画面添付','送信は明示操作','接続先は設定次第']},
        {code:'F-03 / ARTIFACT',title:'成果物を手元に残す',body:'生成された計画・コピー・HTMLを開き直し、ボタン1つでコピー、またはMarkdownとして保存できます。',tags:['コピー','Markdown出力','開き直し']}
      ]
    },
    en: {
      headline: 'Give an idea somewhere to become work.', demoLabel: 'See the recorded workspace', previewLabel: 'Real app workspace',
      short: 'A Mac workspace for working with your own AI model.',
      description: 'Turn rough notes into a plan, website copy, or a small HTML prototype. Reopen the result, copy it, or save it as Markdown.',
      status: 'Developer preview', license: 'Public source · no project-wide license',
      outcome: 'Notes → plans, copy, HTML',
      scope: 'The app needs local services and a configured model, on macOS 14 or later. The download alone is not a hosted service. A screenshot is optional and goes to the connected model only when you send a question. Previously Astra.',
      proof: 'Real app recordings and saved artifacts. Waiting is condensed.',
      consult: 'Prototype an internal AI workspace or an assistant using local and external models.',
      highlights: [{value:'⌥+Space',label:'A resident TaskDock, reachable from any app'},{value:'Ollama-ready',label:'No egress with a local model; screenshots go to the configured endpoint'},{value:'Markdown',label:'Copy the result or save it as Markdown'}],
      features: [
        {code:'F-01 / TASKDOCK',title:'Resident TaskDock (⌥+Space)',body:'A system-wide shortcut opens the resident overlay, so you can ask without leaving the app you are in. Option+Space is the default.',tags:['Resident overlay','Global shortcut','macOS 14+']},
        {code:'F-02 / SCREENSHOT',title:'Ask with a screenshot',body:'A ⌘⇧4 capture is detected and offered as context, with no pasting. Nothing is sent until you submit a question, and it goes to the model endpoint you configured.',tags:['Screenshot context','Explicit send','Configured endpoint']},
        {code:'F-03 / ARTIFACT',title:'Keep the artifact',body:'Reopen generated plans, copy and HTML, copy them with one action, or save them as Markdown.',tags:['Copy','Markdown','Reopen']}
      ]
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
      headline: '話して整理。次の行動まで。', demoLabel: '45秒の実演を見る', previewLabel: '検証レポートの実画面',
      short: '会話から生まれたタスクを、確認して残す。',
      description: 'AIキャラクターと話し、途中で方向を変え、必要なタスクを残す。聞き違いがあり得る変更は、確認を挟んでから保存します。',
      status: 'ベータ', license: 'Apache-2.0 · 素材などは別条件',
      outcome: '会話 → 確認 → タスク',
      scope: '登録不要のタスク機能と、メール認証・時間制限のある音声体験は別です。外部会議への接続は個別の設定と検証が必要です。',
      proof: '実Gemini応答を用いた45秒の録画。入力は合成音声で、一部の確認操作はスクリプトです。',
      consult: '対話型の練習・研修、音声からの業務入力、キャラクターを使ったAIサービスの試作。',
      highlights: [{value:'登録不要',label:'ブラウザでタスクの追加・完了・延期を試せる'},{value:'引用が根拠',label:'タスクと期限は発言の引用から作り、確認まで保留'},{value:'JSON書き出し',label:'保存したタスクをJSONで持ち出せる。自動同期はしない'}],
      features: [
        {code:'F-01 / TALK',title:'AIキャラクターと音声で整理',body:'1対1の音声会話で、途中で方向を変えながらやることを整理します。音声体験はメール確認と利用時間の条件がある別入口です。',tags:['音声会話','途中で割り込める','条件付きの入口']},
        {code:'F-02 / TASKS',title:'発言の引用からタスク化',body:'タスク名と期限は会話にある言葉をそのまま使い、会話にない担当者や期限は作りません。聞き違いがあり得る変更は、確認するまで保存しません。',tags:['引用ベース','確認してから保存','担当者欄なし']},
        {code:'F-03 / KEEP',title:'次に開いたときも続きから',body:'確定したタスクはこのブラウザに保存され、JSONとして書き出せます。会議ツールや外部サービスへの自動同期はありません。',tags:['ブラウザ保存','JSON書き出し','自動同期なし']}
      ]
    },
    en: {
      headline: 'Think out loud. Keep the next step.', demoLabel: 'Watch the 45-second demo', previewLabel: 'Validation report',
      short: 'An interruptible conversation that leaves confirmed tasks.',
      description: 'Talk with an AI character, change direction, and keep the tasks that matter. Uncertain changes stay pending until they are confirmed.',
      status: 'Beta', license: 'Apache-2.0 · separate asset terms',
      outcome: 'Conversation → confirmation → tasks',
      scope: 'Account-free tasks and the verified-email, time-limited voice trial are different experiences. External meeting connections require setup and evaluation.',
      proof: '45-second recording with real Gemini responses, synthetic speech input, and some scripted confirmations.',
      consult: 'Prototype voice-based training, task capture, or an AI character experience.',
      highlights: [{value:'No sign-up',label:'Add, complete and defer tasks in the browser'},{value:'Quoted, not guessed',label:'Tasks and due dates come from the spoken words and wait for review'},{value:'JSON export',label:'Take saved tasks out as JSON; nothing syncs automatically'}],
      features: [
        {code:'F-01 / TALK',title:'Talk it through with an AI character',body:'A one-to-one voice conversation you can redirect part-way. Voice is a separate verified-email, time-limited entry point.',tags:['Voice conversation','Interruptible','Gated entry']},
        {code:'F-02 / TASKS',title:'Tasks from quoted speech',body:'Task titles and due dates reuse the words that were said; owners or deadlines that were not spoken are never invented. Possibly misheard changes stay pending until confirmed.',tags:['Quote-based','Confirm before save','No assignee field']},
        {code:'F-03 / KEEP',title:'Pick up where you left off',body:'Confirmed tasks stay in this browser and can be exported as JSON. There is no automatic sync to meeting tools or external services.',tags:['Browser storage','JSON export','No auto-sync']}
      ]
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
      proof: '文字起こしの判定画面、シミュレーター（組み込みAI・GPT-4o mini・Gemini Flashが電話した記録）、実通話の開発記録。100件の実電話検証は未完了です。',
      consult: '電話業務の試作、既存音声AIへの完了判定の組み込み、同意と人への引き継ぎの設計。',
      highlights: [{value:'ミリ秒で紐付け',label:'確認済みの項目を、相手の発言区間に結びつける'},{value:'発言だけが証拠',label:'検証は会話上の合意まで。システム登録は検証しない'},{value:'Apache-2.0',label:'ランタイム・CLI・評価ハーネスを公開'}],
      features: [
        {code:'F-01 / CALL',title:'AIが電話で交渉する',body:'予約や注文のためにAIエージェントが電話をかけ、日時・金額・条件を相手とやり取りします。実電話には設定と費用が必要で、100件の実電話検証は未完了です。',tags:['音声通話','予約・注文','実電話は条件付き']},
        {code:'F-02 / EVIDENCE',title:'発言区間と結びつけた根拠',body:'日時・金額・確定表現を、相手側の発言の開始・終了時刻つきで記録します。エージェントの「できました」だけでは完了扱いにしません。',tags:['タイムスタンプ','相手側の発言','自己申告を信用しない']},
        {code:'F-03 / BOUNDARY',title:'合意と登録を混同しない',body:'検証できるのは会話上の合意までです。店舗システムやCRMへの登録・自動反映は行わず、その確認は別工程として残します。',tags:['範囲を明示','CRM連携なし','別工程']}
      ]
    },
    en: {
      headline: 'A phone call. A result you can inspect.', demoLabel: 'Inspect a sample call', previewLabel: 'Completion evidence',
      short: 'The agent saying “done” is not evidence.',
      description: 'A runtime for AI phone negotiations and evidence-based completion checks. Tie dates, amounts, and confirmation to the other party’s words.',
      status: 'Developer release', license: 'Apache-2.0',
      outcome: 'Call → evidence → result',
      scope: 'A spoken agreement does not prove a booking exists in a business system. Simulation and real-call evidence are separate. Real calls need configuration and incur costs.',
      proof: 'Transcript checks, simulation (recorded calls by the built-in agent, GPT-4o mini and Gemini Flash), and documented real-call development. The 100-real-call evaluation is not complete.',
      consult: 'Prototype a phone workflow, add completion checks to a voice agent, or design consent and human handoff.',
      highlights: [{value:'Millisecond spans',label:'Each verified field points to the other party’s speech span'},{value:'Speech is the evidence',label:'Only the spoken agreement is verified, never a system record'},{value:'Apache-2.0',label:'Runtime, CLI and evaluation harness are public'}],
      features: [
        {code:'F-01 / CALL',title:'An AI agent makes the call',body:'The agent phones a business to book or order, negotiating dates, amounts and conditions. Real calls need configuration and cost money, and the 100-call evaluation is not complete.',tags:['Voice calls','Booking and ordering','Real calls are conditional']},
        {code:'F-02 / EVIDENCE',title:'Evidence tied to speech spans',body:'Dates, amounts and confirmation are recorded with the start and end time of the other party’s words. The agent saying “done” does not count.',tags:['Timestamps','Callee speech','No self-report']},
        {code:'F-03 / BOUNDARY',title:'Agreement is not registration',body:'Verification stops at the spoken agreement. Nothing is written to a booking system or CRM; that check stays a separate step.',tags:['Explicit boundary','No CRM sync','Separate step']}
      ]
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
      consult: 'ログ取り込みや判断の根拠を扱う設計の試作・評価。独立した本番セキュリティ対策の代替とはしません。',
      highlights: [{value:'相関ルール',label:'公開状態・特権ログイン・ファイルアクセスを1件に統合'},{value:'観測 / 仮説 / 不明',label:'根拠のイベントIDを添えて、分けて扱う'},{value:'分析は手元で',label:'デモと分析は外部送信なし。対応実行やOkta連携は設定先へ通信'}],
      features: [
        {code:'F-01 / CORRELATION',title:'散らばった警告を1つの調査ケースに',body:'公開状態・特権ログイン・大量の機密ファイルアクセスを1つのルールで結びつけます。公開している比較は合成ログ上のもので、本番の性能保証ではありません。',tags:['相関ルール','単独ルールとの比較','合成データ']},
        {code:'F-02 / REASONING',title:'観測・仮説・不明点を分ける',body:'各所見には元になったイベントIDを付け、観測した事実、推論上の仮説、まだ分からないことを別の状態として保持します。',tags:['根拠のID','仮説を分離','過剰対応の抑制']},
        {code:'F-03 / LOCAL',title:'分析は外部に送らない',body:'デモと分析の経路はローカルかつオフラインで動き、アカウントもテレメトリも要りません。任意の対応実行やOkta監視を設定した場合だけ、その送信先へ通信します。',tags:['ローカル実行','テレメトリなし','任意の連携は別']}
      ]
    },
    en: {
      headline: 'From scattered alerts to one reviewable case.', demoLabel: 'Inspect a synthetic case', previewLabel: 'Investigation case',
      short: 'A local prototype for following the evidence.',
      description: 'Connect exposure, privileged access, and file activity. Keep observations, hypotheses, and unknowns distinct as you investigate.',
      status: 'Research prototype', license: 'MIT',
      outcome: 'Logs → correlation → review',
      scope: 'Snapshot analysis, not continuous monitoring or enforcement. It does not confirm exfiltration. Published evaluations use synthetic data, not production performance guarantees.',
      proof: 'An interactive synthetic case and reproducible single-rule versus correlation evaluation.',
      consult: 'Prototype log ingestion and evidence-aware investigation. Not a replacement for production security controls.',
      highlights: [{value:'Correlation rule',label:'Exposure, privileged login and file access become one case'},{value:'Observed / hypothesis / unknown',label:'Each finding keeps its source event IDs and its status'},{value:'Analysis stays local',label:'Demo and analysis send nothing; optional execute or Okta paths talk to what you configure'}],
      features: [
        {code:'F-01 / CORRELATION',title:'Scattered alerts into one case',body:'One rule links exposure, privileged login and large sensitive-file access. The published comparison runs on synthetic logs and is not a production performance guarantee.',tags:['Correlation rule','Single-rule comparison','Synthetic data']},
        {code:'F-02 / REASONING',title:'Observed, hypothesis, unknown',body:'Every finding carries the event IDs it was built from and keeps observed facts, inferred hypotheses and unknowns as separate states.',tags:['Source IDs','Separated hypotheses','Fewer over-reactions']},
        {code:'F-03 / LOCAL',title:'Analysis without egress',body:'The demo and analysis paths run locally and offline with no account and no telemetry. Only the optional execute and Okta-watch paths send data, and only to the endpoints you configure.',tags:['Local run','No telemetry','Optional connectors']}
      ]
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
      consult: '業務の役割分担、成果物の検証、予算・権限・人の承認を含むエージェント基盤の試作。',
      highlights: [{value:'4つの役割',label:'Master・Researcher・Builder・Reviewerが分担'},{value:'出典を照合',label:'Reviewerが原典と食い違う記述を検出し、修正案を出す'},{value:'追記専用の記録',label:'会話・タイムライン・報告はすべてイベント記録から生成'}],
      features: [
        {code:'F-01 / ROLES',title:'役割を分けて実行する',body:'Masterが成果物を計画し、Researcher・Builder・Reviewerが作業します。単一エージェントより高品質とはまだ言えず、公開比較には失敗も含みます。',tags:['マルチエージェント','Master / Researcher / Builder / Reviewer','比較は失敗も公開']},
        {code:'F-02 / REVIEW',title:'原典と照らして査読する',body:'出典URL付きの主張はReviewerが原典を取得して照合し、取得できなければunverifiedとします。指摘には最小の修正案を添えます。',tags:['出典照合','unverifiedを残す','最小修正案']},
        {code:'F-03 / TRAIL',title:'経緯を消さない',body:'すべてを追記専用のイベント記録に書き、版ごとの成果物とレビュー文書を並べて残します。部分完了もそのまま報告します。',tags:['追記専用','版ごとの成果物','部分完了も報告']}
      ]
    },
    en: {
      headline: 'The deliverable. And how it got there.', demoLabel: 'Read the run record', previewLabel: 'Agent work trail',
      short: 'Draft, review, revise — with a work trail.',
      description: 'AI agents share the work. Revisions stay connected to who checked what, and unfinished work is reported alongside completed artifacts.',
      status: 'Under evaluation', license: 'MIT · repository: Multibot',
      outcome: 'Request → draft → review → revision',
      scope: 'A quality advantage over a single agent has not been established. Published comparisons include failures and provider constraints. Production acceptance is separate.',
      proof: 'Real-model work records and evaluation results including failures. The featured research replay ended partial.',
      consult: 'Prototype agent workflows with explicit roles, artifact checks, budgets, permissions, and human approval.',
      highlights: [{value:'Four roles',label:'Master, Researcher, Builder and Reviewer share the work'},{value:'Source-checked',label:'The Reviewer fetches cited sources and proposes fixes'},{value:'Append-only trail',label:'Chat, timeline and report are projections of one event log'}],
      features: [
        {code:'F-01 / ROLES',title:'Explicit roles',body:'A Master plans the deliverables while a Researcher, a Builder and a Reviewer do the work. No quality advantage over a single agent is claimed, and published comparisons include failures.',tags:['Multi-agent','Master / Researcher / Builder / Reviewer','Failures published']},
        {code:'F-02 / REVIEW',title:'Review against the source',body:'Claims with a source URL are fetched and compared by the Reviewer; anything it cannot fetch is marked unverified. Each finding comes with a minimal fix.',tags:['Source check','Unverified stays visible','Minimal fix']},
        {code:'F-03 / TRAIL',title:'Nothing is overwritten',body:'Everything goes to an append-only event store, with per-revision artifacts and review documents kept side by side. Partial completion is reported as such.',tags:['Append-only','Per-revision artifacts','Partial reported']}
      ]
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
      consult: '操作録画と公開素材をつなぐ制作フロー、ブランドに合わせたテンプレート、確認工程の設計。',
      highlights: [{value:'1つの説明から',label:'横動画・縦動画・LP・SNS投稿案を一括生成'},{value:'同梱サンプルで1分未満',label:'自動計測の例。利用者ごとの所要時間ではない'},{value:'Remotion',label:'別ツールとして、コードでフレーム単位に組む'}],
      features: [
        {code:'F-01 / KIT',title:'ひと揃いのローンチキット',body:'製品説明と実録画から、横動画、縦動画、LP、SNS投稿案を一括で書き出します。編集後に各成果物を自動で再連携することは、標準では保証しません。',tags:['一括生成','LPも同時出力','再連携は保証なし']},
        {code:'F-02 / FOOTAGE',title:'実録画で組むプロダクトCM',body:'スライド化せず、実際の画面録画の区間を指定して映像にします。製品ごとにコードで構成を書く必要があり、任意の録画から自動で仕上がるものではありません。',tags:['実録画','区間指定','製品ごとに構成']},
        {code:'F-03 / CODE',title:'React / TypeScriptで調整',body:'Remotionを使う別ツールで、各フレームを時間の関数として定義します。タイミングや文字組をコードで調整できます。',tags:['Remotion','フレーム単位','別ツール']}
      ]
    },
    en: {
      headline: 'You built it. Now let people see it.', demoLabel: 'Open the launch kit', previewLabel: 'Generated launch page',
      short: 'A product recording becomes a launch kit.',
      description: 'Make a landscape film, a vertical cut, a landing page, and social drafts from one product brief and a real recording, locally.',
      status: 'Alpha', license: 'Apache-2.0 · separate integration terms',
      outcome: 'Product → film, page, social drafts',
      scope: 'Single-operator alpha. Generating material is not publishing it. Real social-account publishing remains unverified; engagement and business outcomes are not guaranteed.',
      proof: 'A film made by the tool itself, a real launch kit, and local verification records.',
      consult: 'Design a recording-to-launch workflow, brand-specific templates, and approval steps.',
      highlights: [{value:'One brief',label:'Landscape film, vertical cut, landing page and social drafts in one run'},{value:'Under a minute on the sample',label:'Automated timing on the bundled sample, not a user measurement'},{value:'Remotion',label:'A separate code-driven tool for frame-level control'}],
      features: [
        {code:'F-01 / KIT',title:'A complete launch kit',body:'From a product brief and a real recording, one run writes a landscape film, a vertical cut, a landing page and social drafts. Re-syncing every deliverable after edits is not guaranteed by default.',tags:['Batch output','LP included','Re-sync not guaranteed']},
        {code:'F-02 / FOOTAGE',title:'Commercials from real footage',body:'Instead of slides, the film is cut from named spans of an actual screen recording. Each product needs its composition written in code; it is not automatic for any recording.',tags:['Real footage','Named spans','Per-product code']},
        {code:'F-03 / CODE',title:'Tuned in React and TypeScript',body:'A separate Remotion tool defines every frame as a function of time, so timing and typography are adjusted in code.',tags:['Remotion','Frame-level','Separate tool']}
      ]
    }
  }
];
