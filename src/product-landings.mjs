/** Video-first owned product pages. Real recordings, current scope and future design studies stay distinct. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { capabilitiesCheckedAt } from './products.mjs';
const e = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const landingIds = Object.freeze(['genie','ai-meeting','oathra','aisecure','agent-team','launchloom','noa']);
export function landingRoute(id, lang) {
  if (!landingIds.includes(id) || !['ja','en'].includes(lang)) throw new TypeError('Unknown product landing');
  return `${lang === 'en' ? '/en' : ''}/products/${id}/`;
}

export const landingExperience = Object.freeze({
  genie: {
    ja: {
      title:'作業の途中で、Genieを呼び出す。',
      primary:['成果物を作る手順を見る','https://github.com/FORIFOR/genie/blob/main/docs/TESTING.ja.md'],
      secondary:['実演をもっと見る','https://reachmade.com/products/genie/demos/#prototype'],
      tryNow:'架空のメモから、行動計画や下書きをひとつ作る。',
      actionNote:'最初のボタンはMac向けセットアップ手順を開きます。ブラウザーだけで即時実行する製品ではありません。',
      startTitle:'まず、ひとつの成果物を作る。',
      startBody:'Genieはアプリ単体では完結しません。Gateway・Task Worker・Agent Hostと利用するモデルを準備し、架空のメモから小さな仕事を試してください。',
      beats:[['依頼する','短いメモから、何を手元に残したいかを指定します。'],['作業を見る','接続したモデルが作業し、途中の状態と成果物を同じワークスペースで確認します。'],['成果物を残す','結果を開き直し、コピーまたはMarkdownとして次の作業へ持ち出します。']],
      // icon: FORIFOR/genie apps/genie-macos/Resources/AppIcon-1024.png at 45d5dd1, scaled to 128px (2026-09-28).
      //   That commit is on the unmerged branch feat/genie-stage0-5; main has no macOS app icon yet.
      // frames: "TaskDock Continuous Surface.dc.html" from the 2026-09-28 design handoff (sha256 4975d8e3d1ee2ecf…),
      //   driven through its demo events (idle, listening, agent, confirm, result), its mock browser window
      //   hidden, and the 800×450 area around the dock captured at 2× (1600×900).
      //   The five screens exist on genie main; the one-surface redesign is on an unmerged branch and unverified
      //   on a device, so the label says "not released", not "not implemented".
      icon:'/assets/products/genie/icon-128.png',
      iconNote:'ページ見出しのアイコンは開発中のもので、現行版のアプリにはまだ入っていません。',
      nextUi:{label:'設計プレビュー · 未リリース',studyLabel:'別に公開している設計動画（Launchloom）',intro:'TaskDockを、状態ごとに窓を切り替えるのではなく、一つの面が形を変えていくUIへ作り直す設計です。各コマは設計ファイルを撮影した再現図で、実アプリの録画ではありません。コマの中の内容は架空の例です。この設計は開発ブランチで試作中で、現行の製品にはまだ入っていません。実機での動作は未確認です。',frames:[
          {src:'/assets/products/genie/next-ui-01.jpg',title:'待機',body:'小さく、動かない。作業の邪魔をしない。',alt:'画面上部中央に、小さなランプの印だけが出ている待機状態の設計図。'},
          {src:'/assets/products/genie/next-ui-02.jpg',title:'聞き取り',body:'呼んだときだけ広がり、声に合わせて揺れる。',alt:'上部の面が横に広がり、「聞いています」と音量の波形を表示している設計図。'},
          {src:'/assets/products/genie/next-ui-03.jpg',title:'作業中',body:'何をしていて、いまどの工程か。架空の％は出さない。',alt:'上部の面に「ページを要約して下書き」と工程「ページを読み取り中」、停止ボタンを表示している設計図。'},
          {src:'/assets/products/genie/next-ui-04.jpg',title:'確認',body:'書き込む前に、同じ面で対象と内容を示す。',alt:'「確認が必要です」と、書き込み先と実行内容、取り消しと作成するのボタンを表示している設計図。'},
          {src:'/assets/products/genie/next-ui-05.jpg',title:'結果',body:'何ができたかをその場で示し、そのまま使える。',alt:'「下書きができました」と成果物の題名、開く・コピー・保存先を表示のボタンを表示している設計図。'}
      ]}
    },
    en: {
      title:'In the middle of something? Call up Genie.',
      lead:'A question about the page you’re reading. A draft that needs a starting point. Call up Genie on your Mac, attach the current screen, and work with the model you choose.',
      featuresTitle:'From a quick question to a draft you can use.',
      flowTitle:'Ask here. Take the result with you.',
      consultTitle:'Put Genie to work on your everyday tasks.',
      primary:['Open the Mac setup guide','https://github.com/FORIFOR/genie/blob/main/docs/TESTING.md'],
      secondary:['Watch more real workflows','https://reachmade.com/en/products/genie/demos/#prototype'],
      tryNow:'Turn fictional notes into one action plan or draft.',
      actionNote:'The first button opens the Mac setup guide. Genie is not an instant browser-only product.',
      startTitle:'Start with one useful artifact.',
      startBody:'Genie is not a standalone hosted app. Prepare the Gateway, Task Worker, Agent Host and a model, then try a small task with fictional notes.',
      beats:[['Ask','Describe the useful output you want from a short set of notes.'],['Watch the work','The connected model works while the request and artifact stay in one workspace.'],['Keep the result','Reopen the artifact, copy it, or save Markdown for the next step.']],
      icon:'/assets/products/genie/icon-128.png',
      iconNote:'The icon beside the heading is from development and is not yet in the current app.',
      nextUi:{label:'Design preview · not released',studyLabel:'The separate design film (Launchloom)',intro:'A redesign of TaskDock as one surface that changes shape, instead of switching windows for each state. Each frame is a render of the design file, not a recording of the app. The content inside the frames is fictional. The design is being prototyped on a development branch and is not in the current product. It has not been checked on a real Mac.',frames:[
          {src:'/assets/products/genie/next-ui-01.jpg',title:'Idle',body:'Small and still. It stays out of the way.',alt:'Design render of the idle state: only a small lamp mark at the top centre of the screen.'},
          {src:'/assets/products/genie/next-ui-02.jpg',title:'Listening',body:'It opens only when called and moves with the voice.',alt:'Design render: the top surface widens and shows “Listening” with a level waveform.'},
          {src:'/assets/products/genie/next-ui-03.jpg',title:'Working',body:'What it is doing and which step it is on. No invented percentages.',alt:'Design render: the surface shows the task “Summarise the page as a draft”, its current step and a Stop button.'},
          {src:'/assets/products/genie/next-ui-04.jpg',title:'Confirm',body:'Before anything is written, the same surface shows the target and the content.',alt:'Design render: “Confirmation needed” with the destination, what will be written, and Cancel and Create buttons.'},
          {src:'/assets/products/genie/next-ui-05.jpg',title:'Result',body:'It shows what was made, right there, ready to use.',alt:'Design render: “Draft ready” with the artifact title and Open, Copy and Show location buttons.'}
      ]}
    }
  },
  'ai-meeting': {
    ja: {
      title:'考えは、話しながら変えていい。',
      lead:'やることも、期限も、まだ決まっていなくていい。AIキャラクターと話しながら整理し、予定が変わったら言い直す。決まった内容はタスクに残せます。',
      featuresTitle:'思いつきも、言い直しも、会話の途中で。',
      flowTitle:'「やっぱり、明日にして。」その先まで。',
      consultTitle:'話して整理する時間を、あなたの仕事にも。',
      primary:['文字でタスクを試す（登録不要）','https://ai-meeting.web.app/#tasks'],
      secondary:['音声体験の条件を見る','https://reachmade.com/products/ai-meeting/guide/'],
      tryNow:'タスクを1件追加し、完了・延期まで文字入力で触ってみる。',
      actionNote:'最初のボタンで登録不要のタスク画面が開きます。音声体験はメール確認と利用時間の条件がある別入口です。',
      startTitle:'まずは、明日やることをひとつ。',
      startBody:'登録せずに、文字でタスクを追加・完了・延期できます。声で話す体験には、メール確認と利用時間の条件があります。詳しくは「音声体験の条件を見る」へ。',
      beats:[['話す・書く','やることや期限を会話または文字入力で整理します。'],['変更を確かめる','聞き違いがあり得る変更は、保存済みタスクと分けて確認します。'],['次回へ残す','確定したタスクを保存し、次に開いたときもその状態から続けます。']]
    },
    en: {
      title:'Talk it through. Change your mind.',
      lead:'You don’t need a finished plan to start talking. Work through what’s next with an AI character, say when your plans change, and save what you decide as tasks.',
      featuresTitle:'Room for a thought. And a second thought.',
      flowTitle:'“Actually, make that tomorrow.”',
      consultTitle:'Make room to think out loud at work.',
      primary:['Try text tasks — no sign-up','https://ai-meeting.web.app/#tasks'],
      secondary:['Read the voice-access conditions','https://reachmade.com/products/ai-meeting/guide/'],
      tryNow:'Add one task, then try completing or deferring it in the text UI.',
      actionNote:'The first button opens the account-free task UI in Japanese. Voice is a separate verified-email, time-limited entry point.',
      startTitle:'Start with one thing to do tomorrow.',
      startBody:'Add, complete or defer a task in the Japanese text UI without signing up. To try voice, first read the separate verified-email and time-limit conditions.',
      beats:[['Speak or type','Capture work and optional deadlines in a conversation or text.'],['Review the change','Potentially misheard changes remain distinct from saved tasks until confirmed.'],['Keep the next step','Return to the saved task state instead of losing the outcome of the conversation.']]
    }
  },
  oathra: {
    ja: {
      title:'「できました」を、根拠にしない。',
      primary:['サンプルの根拠を照合する','https://forifor.github.io/oathra/check.html'],
      secondary:['シミュレーター全体を見る','https://forifor.github.io/oathra/'],
      tryNow:'公開サンプルから、日時・金額・確定表現の根拠を照合する。',
      actionNote:'照合するのは公開サンプルだけです。電話はかからず、お店のシステムにも登録しません。',
      startTitle:'まず、会話と証拠を見比べる。',
      startBody:'公開シミュレーターでは、相手の発言から日時・金額・確定表現を抽出し、結果判定と結びつける流れを確認できます。実電話や店舗システム登録の証明ではありません。',
      beats:[['会話する','電話エージェントと相手側のやり取りを記録します。'],['証拠を拾う','日時・金額・確定表現を、相手側の実際の発言に結びつけます。'],['結果を分ける','話した合意と、外部システムへ本当に登録された事実を混同しません。']]
    },
    en: {
      title:'“Done” is not evidence.',
      lead:'The phone agent says the booking is confirmed. What did the person on the other end actually say? Oathra links each date, amount and confirmation to their words in the call transcript.',
      featuresTitle:'See which claims the conversation supports.',
      flowTitle:'From the reported result back to the conversation.',
      consultTitle:'Decide what counts as a completed call.',
      primary:['Inspect a sample transcript','https://forifor.github.io/oathra/check.html'],
      secondary:['Open the full simulator','https://forifor.github.io/oathra/'],
      tryNow:'Match dates, amounts and confirmation language to a public sample transcript.',
      actionNote:'The first button opens a public sample check. It does not place a live call or create a booking in an external system.',
      startTitle:'Start by comparing the claim with the evidence.',
      startBody:'The public simulator ties dates, amounts and confirmation language to the other party’s words. It is not proof of a live call or an external booking-system entry.',
      beats:[['Converse','Keep the exchange between the phone agent and the other party.'],['Extract evidence','Tie dates, prices and confirmation to the actual transcript.'],['Separate the result','Do not confuse spoken agreement with a record created in an external business system.']]
    }
  },
  aisecure: {
    ja: {
      title:'このログの前に、何があった？',
      lead:'公開状態の変化。特権ログイン。ファイルへのアクセス。別々に見える兆候を、ひとつの調査でたどります。分かったことと、まだ推測のことを分けながら。',
      featuresTitle:'出来事のつながりを、ログからたどる。',
      flowTitle:'ひとつの警告で、結論を出さない。',
      consultTitle:'あなたの現場で、何を調べるべきか。',
      primary:['サンプルケースを調べる','https://forifor.github.io/AISecure/try.html'],
      secondary:['AI Secureの説明を見る','https://forifor.github.io/AISecure/'],
      tryNow:'合成ログから、観測・仮説・不明点が分かれる調査ケースを見る。',
      actionNote:'最初のボタンで合成データのブラウザーデモが開きます。実環境の常時監視や遮断には接続しません。',
      startTitle:'調査の入口は、3つの兆候。',
      startBody:'公開デモは合成データを使うスナップショット分析です。常時監視や遮断ではなく、観測・仮説・不明点を分けて調査する流れを確認できます。',
      beats:[['兆候を見る','公開状態、特権ログイン、ファイルアクセスなどの観測を集めます。'],['関連づける','単独の警告ではなく、同じ調査ケースとして根拠をつなぎます。'],['判断を分ける','観測した事実、仮説、まだ分からないことを別の状態で扱います。']]
    },
    en: {
      title:'What happened before this alert?',
      lead:'A change in exposure. A privileged login. Access to a file. Follow separate signals through one investigation, keeping what you know distinct from what you suspect.',
      featuresTitle:'Follow the connections in the logs.',
      flowTitle:'One alert is a starting point.',
      consultTitle:'Work out what your team needs to investigate.',
      primary:['Investigate a sample case','https://forifor.github.io/AISecure/try.html'],
      secondary:['Read about AI Secure','https://forifor.github.io/AISecure/'],
      tryNow:'Use synthetic logs to see observations, hypotheses and unknowns separated in one case.',
      actionNote:'The first button opens a browser demo on synthetic data. It does not connect to live monitoring or enforcement.',
      startTitle:'Three signals. Somewhere to start.',
      startBody:'The public demo is snapshot analysis on synthetic data. It demonstrates how observations, hypotheses and unknowns stay distinct; it is not continuous monitoring or enforcement.',
      beats:[['Observe','Collect exposure, privileged access and file-activity signals.'],['Correlate','Connect related evidence into one case instead of reading alerts in isolation.'],['Separate judgment','Keep observed facts, hypotheses and unknowns explicitly distinct.']]
    }
  },
  'agent-team': {
    ja: {
      title:'その一文に、もうひとりの目を。',
      lead:'書いたAIとは別のAIが、資料と照らし合わせる。指摘を受けて直し、どの版をどこまで確認したかを、コードや資料と一緒に残します。',
      featuresTitle:'書く担当と、読み直す担当がいる。',
      flowTitle:'指摘された一文が、次の版で変わる。',
      consultTitle:'あなたの仕事に、レビューの工程を。',
      primary:['作成から修正までの記録を読む','https://forifor.github.io/Multibot/ja/#proof'],
      secondary:['コードと役割分担を見る','https://github.com/FORIFOR/Multibot'],
      tryNow:'作成→レビュー→修正の実行記録を、未完了の箇所も含めて読む。',
      actionNote:'過去の実モデルの作業記録を開きます。新しいAI実行は始まりません。',
      startTitle:'直す前と、直した後を読んでみる。',
      startBody:'Agent Teamは作成・レビュー・修正の役割を分け、成果物と作業記録を結びつけます。公開例には失敗や部分完了も残しており、単一エージェントより高品質だとはまだ主張していません。',
      beats:[['依頼する','目的と成果物を書き、資料を添えます。まとめ役が進め方と完了条件を決めます。'],['つくって、別の担当が確かめる','つくる係が版を公開し、確かめる係がその版を条件ごとに確認します。指摘は次の版で直します。'],['確認済みの版を受け取る','どの版が何に合格したかと未完了の部分を残したまま、選んだ版を記録ごと保存します。']],
      // frames and film: exported from the "Agent Team LP video" design file (Claude design project, 2026-09-29),
      //   30 s, 1920×1080, silent. The film was re-supplied as agent-team-lp-ja.mp4 with the 1b shape characters
      //   (audio removed on import, see public/media/films/manifest.json); the five frames still show the earlier animals.
      // These supplied design renders are not evidence of the current implementation status.
      nextUi:{label:'設計プレビュー · 架空の例',studyLabel:'別に公開している設計動画（Launchloom）',intro:'サイドバー、会話と成果物を並べる作業室、指摘と修正箇所の表示を見直す設計です。動画と各コマは設計ファイルから書き出した再現図で、実アプリの録画ではありません。依頼・会話・確認の内容は架空の例です。この設計映像だけでは、各機能の現在の実装状況は判断できません。',
        film:{src:'/media/films/agent-team-design-30s.mp4',poster:'/assets/products/agent-team/next-ui-01.jpg',label:'30秒の設計動画（演出を含む・無音・自動再生しません）'},
        frames:[
          {src:'/assets/products/agent-team/next-ui-01.jpg',title:'依頼',body:'ひとことと資料だけで、お願いできる。',alt:'サイドバーのある画面で、依頼文と添付した product.md、「チームにお願いする」ボタンを表示している設計図。'},
          {src:'/assets/products/agent-team/next-ui-02.jpg',title:'分担',body:'だれが何を、だれに渡したかが会話で見える。',alt:'キャラクターのぽん・まめ・むぎが吹き出しで作業を引き継ぎ、右に guide.md の第1版が開いている設計図。'},
          {src:'/assets/products/agent-team/next-ui-03.jpg',title:'指摘',body:'確かめる係の指摘が、該当する文に付く。',alt:'第1版の一文が黄色く示され、「るるの指摘：資料の範囲を超えています」と表示されている設計図。'},
          {src:'/assets/products/agent-team/next-ui-04.jpg',title:'確認',body:'第2版で直り、4つの条件をすべて通過。',alt:'第2版で直った文が緑で示され、4つの確認項目に通過の印が付いている設計図。'},
          {src:'/assets/products/agent-team/next-ui-05.jpg',title:'保存',body:'選んだ版を、確認の記録と一緒にZIPで。',alt:'guide.md 第2版、manifest.json、report.md、events.jsonl の4つを含むZIPの一覧を表示している設計図。'}
      ]}
    },
    en: {
      title:'Give that draft a second pair of eyes.',
      lead:'One AI agent writes. Another checks the draft against your source. Findings go back for revision, and the code or document keeps a record of what was checked in each version.',
      featuresTitle:'A draft. A review. A reason to revise.',
      flowTitle:'See what changed after the review.',
      consultTitle:'Build a review step into your team’s work.',
      primary:['Read a draft-to-revision example','https://forifor.github.io/Multibot/#proof'],
      secondary:['Inspect the roles and code','https://github.com/FORIFOR/Multibot'],
      tryNow:'Read a draft → review → revision trail, including what remained unfinished.',
      actionNote:'The public page is a record of a real-model run. Clicking it does not start a new model run in the browser.',
      startTitle:'Read the before. Then the after.',
      startBody:'Agent Team separates drafting, review and revision while keeping artifacts connected to the work trail. Public examples retain failures and partial completion; no quality advantage over a single agent is claimed.',
      beats:[['Ask','Describe the goal and the artifact, and attach your source. The coordinator sets the plan and the finish conditions.'],['Made, then checked by someone else','The maker publishes a revision and the reviewer checks that revision condition by condition. Findings are fixed in the next revision.'],['Keep the checked version','Save the chosen revision with its record, including which checks it passed and what remained unfinished.']],
      nextUi:{label:'Design preview · fictional example',studyLabel:'The separate design film (Launchloom)',intro:'A redesign with a sidebar, a workroom that keeps conversation and result side by side, and marked findings and fixes. The frames are renders of a design file, not recordings of the app. The request, messages and checks are fictional, and the stills show the Japanese interface. These design renders do not establish the current implementation status of each feature.',
        // English design film not delivered yet (2026-09-29); the English page shows the five stills only.
        frames:[
          {src:'/assets/products/agent-team/next-ui-01.jpg',title:'Ask',body:'One sentence and a source file are enough.',alt:'Design render: a sidebar layout with the request, the attached product.md and the “Ask the team” button.'},
          {src:'/assets/products/agent-team/next-ui-02.jpg',title:'Share the work',body:'Who handed what to whom, in the conversation.',alt:'Design render: the Pon, Mame and Mugi characters hand work over in chat bubbles, with guide.md version 1 open on the right.'},
          {src:'/assets/products/agent-team/next-ui-03.jpg',title:'Finding',body:'The reviewer’s finding sits on the sentence it is about.',alt:'Design render: one sentence of version 1 is marked in amber with “Lulu’s finding: goes beyond the source”.'},
          {src:'/assets/products/agent-team/next-ui-04.jpg',title:'Checked',body:'Fixed in version 2; all four conditions pass.',alt:'Design render: the fixed sentence is marked in green and four check items show a pass mark.'},
          {src:'/assets/products/agent-team/next-ui-05.jpg',title:'Save',body:'The chosen version, zipped with its check record.',alt:'Design render: a ZIP list with guide.md version 2, manifest.json, report.md and events.jsonl.'}
      ]}
    }
  },
  launchloom: {
    ja: {
      title:'作った。次は、見てもらう番だ。',
      lead:'動画を撮って、紹介ページを書いて、投稿を考える。製品ができたあとにも、仕事は続く。Launchloomは製品説明と操作録画をもとに、動画・LP・SNS投稿案の制作をまとめます。',
      featuresTitle:'動画も、ページも、投稿案も。',
      flowTitle:'作った人の説明から、見せる準備を始める。',
      consultTitle:'あなたの製品を、どう紹介しよう。',
      primary:['動画・LP・投稿案の作例を見る','https://forifor.github.io/Launchloom/ja/#proof'],
      secondary:['ローカル制作フローを見る','https://github.com/FORIFOR/Launchloom'],
      tryNow:'実録画から作った動画・LP・SNS投稿案を、ひとつのローンチキットで見る。',
      actionNote:'最初のボタンは生成済みのローンチキットを開きます。実SNSアカウントへの投稿は行いません。',
      startTitle:'まずは、ひとつの製品の紹介一式を。',
      startBody:'公開済みの作例で、横動画・縦動画・LP・SNS投稿案を見比べられます。制作には製品説明と操作録画を使い、製品ごとの構成をコードで組みます。外部アカウントへの公開は別工程です。',
      beats:[['素材を入れる','製品説明と実際の操作録画を制作の起点にします。'],['用途別に作る','横動画、縦動画、LP、SNS投稿案へ同じ内容を展開します。'],['公開前に確認する','生成物を確認してから使います。外部SNSへの実投稿を自動成功として扱いません。']]
    },
    en: {
      title:'You built it. Now let people see it.',
      lead:'Record a demo. Write the page. Draft the posts. There’s more to do after the product works. Launchloom brings that work together, using your product brief and real screen recording to create videos, a landing page and social drafts.',
      featuresTitle:'The video. The page. The posts.',
      flowTitle:'Start with the product you know best.',
      consultTitle:'Let’s work out how to introduce your product.',
      primary:['See the generated launch kit','https://forifor.github.io/Launchloom/#proof'],
      secondary:['Inspect the local production flow','https://github.com/FORIFOR/Launchloom'],
      tryNow:'See the film, landing page and social drafts produced from a real recording in one launch kit.',
      actionNote:'The first button opens already-generated launch material. It does not publish to a real social account.',
      startTitle:'Explore a sample launch kit.',
      startBody:'Compare the landscape video, vertical video, landing page and social drafts in a published example. Production uses a brief and real recording, with compositions coded for each product. Publishing to external accounts is a separate step.',
      beats:[['Bring the source','Start from a product brief and an actual product recording.'],['Adapt the material','Create landscape, vertical, landing-page and social-draft variants from the same source.'],['Review before publishing','Inspect the generated assets; external social publishing is not treated as an automatic success.']]
    }
  },
  noa: {
    ja: {
      title:'プレイ中も、話しかけて。',
      lead:'ゲームを進めながら、コメントには声と表情で返事。星藍ノアは、プレイとおしゃべりをいっしょに届けるAIキャラクターです。',
      primary:['配信を見る（YouTube）','https://youtube.com/channel/UCjX52bV1kfUgSuqf3vv_rTQ'],
      secondary:['解説・自己紹介の動画を見る','https://youtube.com/channel/UCjX52bV1kfUgSuqf3vv_rTQ'],
      tryNow:'YouTubeの配信で、コメントへの返事と声・表情を見る。',
      actionNote:'ソースは公開していません。配信とYouTubeの動画で、実際の動きを確かめられます。',
      startTitle:'動いているところは、配信と動画で。',
      startBody:'実際の配信では、コメントへの返事はその場で作られます。解説（5:48）と自己紹介PV（0:30）は、演出を含む映像です。',
      beats:[['返事','Jevが判定して、返事を決める'],['声','コハクの声で読み上げる'],['見た目','画像を重ねて、表情を動かす']]
    },
    en: {
      title:'The game’s on. Say hello.',
      lead:'Noa plays games and responds to stream comments with her voice and expressions. Drop into a stream, leave a comment, and be part of the conversation.',
      featuresTitle:'Gameplay and conversation, side by side.',
      flowTitle:'From your comment to Noa’s response.',
      consultTitle:'Bring your own character to the screen.',
      primary:['Open the YouTube channel','https://youtube.com/channel/UCjX52bV1kfUgSuqf3vv_rTQ'],
      secondary:['Watch the introduction film','#recording'],
      tryNow:'Open Noa’s YouTube channel to explore streams and videos.',
      actionNote:'The source is not public. This link opens Noa’s YouTube channel.',
      startTitle:'Explore Noa’s streams and videos.',
      startBody:'The channel is available below. Direct links to the explainer (5:48) and introduction film (0:30) will be added once confirmed. Both films include staging.',
      beats:[['Reply','Jev judges the comment and decides the reply'],['Voice','The reply is read out in the Kohaku voice'],['Look','Image layers are switched to move the face']]
    }
  }
});

function experienceFor(product, lang) {
  const value = landingExperience[product.id]?.[lang];
  if (!value) throw new Error(`Missing landing experience: ${product.id}/${lang}`);
  return value;
}

/** Optional design film: plain controls, no autoplay, poster first; works without JavaScript. */
function nextUiFilm(f, label) {
  return `<figure class="owned-next-ui__film"><video controls muted playsinline preload="none" poster="${e(f.poster)}" width="1920" height="1080"><source src="${e(f.src)}" type="video/mp4"></video><figcaption><span class="owned-next-ui__label">${e(label)}</span> ${e(f.label)}</figcaption></figure>`;
}
/** Genie and Agent Team: stills of the next interface design. Renders of a design file, labelled as unreleased; no script. */
function nextUiArticle(n, ja, prototypeLink) {
  return `<article class="owned-next-ui" id="next-ui"><h3>${ja?'次のUI設計':'Proposed interface design'}</h3><p>${e(n.intro)}</p>${n.film?nextUiFilm(n.film,n.label):''}<ol class="owned-next-ui__frames">${n.frames.map((f,i)=>`<li class="owned-next-ui__frame"><figure><a href="${e(f.src)}"><img src="${e(f.src)}" width="1600" height="900" loading="lazy" decoding="async" alt="${e(f.alt)}"></a><figcaption><span class="owned-next-ui__label">${e(n.label)}</span><strong>0${i+1} ${e(f.title)}</strong><span>${e(f.body)}</span></figcaption></figure></li>`).join('')}</ol>${prototypeLink}</article>`;
}

export const DESIGN_STUDIES = new Set(['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']);

export function renderProductLanding(product, lang, config, recordingSource) {
  const route = landingRoute(product.id, lang), x = experienceFor(product, lang), ja = lang === 'ja';
  const origin = config.origin.replace(/\/$/, ''), home = ja ? '/' : '/en/';
  const opposite = ja ? 'en' : 'ja';
  const external = (href,label,klass='') => !href ? '' : `<a${klass ? ` class="${e(klass)}"` : ''} href="${e(href)}"${href.startsWith('#')?'':' target="_blank" rel="noopener noreferrer"'}>${e(label)} <span aria-hidden="true">${href.startsWith('#')?'↓':'↗'}</span></a>`;
  const canonical = origin + route;
  // Launchloom publishes design studies for these products only (checked on its gh-pages branch, 2026-09-29).
  const hasDesignStudy = DESIGN_STUDIES.has(product.id);
  const prototype = `https://forifor.github.io/Launchloom/design/index.html?product=${product.id}`;
  const poster = `/media/products/${product.id}.jpg`;
  const p = product[lang];
  return `<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(product.name)} — ${e(x.title)} | Reachmade</title><meta name="description" content="${e(x.lead || p.description)}"><meta name="theme-color" content="#f6f5f0"><link rel="canonical" href="${canonical}">${['ja','en'].map(l=>`<link rel="alternate" hreflang="${l}" href="${origin}${landingRoute(product.id,l)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${origin}${landingRoute(product.id,'ja')}"><meta property="og:type" content="website"><meta property="og:title" content="${e(product.name)} — ${e(x.title)}"><meta property="og:description" content="${e(x.lead || p.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}${poster}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/product-landings.css"><script src="/assets/product-landings.js" defer></script></head>
<body class="owned-product owned-product--${product.id}" data-product-id="${product.id}" id="top"><a class="skip-link" href="#main">${ja?'本文へ移動':'Skip to content'}</a><header class="owned-header"><div class="container"><a class="owned-brand" href="${home}">Reachmade<span> / ${e(product.name)}</span></a><nav aria-label="${ja?'ページナビゲーション':'Page navigation'}"><a href="#recording">${ja?'実演':'Recording'}</a><a href="#features">${ja?'機能':'Features'}</a><a href="#flow">${ja?'流れ':'Flow'}</a><a href="#start">${ja?'試す':'Try it'}</a><a lang="${opposite}" hreflang="${opposite}" href="${landingRoute(product.id,opposite)}">${ja?'English':'日本語'}</a></nav></div></header>
<main id="main"><section class="container owned-hero-grid"><p class="owned-kicker">${e(product.index)} / ${e(product.discipline)} / ${e(p.status)}</p><h1>${x.icon?`<img class="owned-product-icon" src="${e(x.icon)}" width="128" height="128" alt="">`:''}${e(x.title)}</h1><figure class="owned-film owned-film--hero" id="recording"><div class="owned-film__bar"><span>${e(product.name)}</span><span>${product.filmKind==='intro'?(ja?'紹介映像 · 画面は再現 / 約13秒 / 1×':'INTRO FILM · RECREATED SCREENS / ~13 SEC / 1×'):(ja?'REAL PRODUCT / 約13秒 / 1×':'REAL PRODUCT / ~13 SEC / 1×')}</span></div><div class="owned-film__screen"><video controls muted playsinline preload="none" poster="${poster}" data-recording-src="/media/products/${product.id}.mp4" aria-label="${e(product.name)} ${product.filmKind==='intro'?(ja?'紹介映像（画面は再現）':'introduction film (recreated screens)'):(ja?'実演録画':'recorded workflow')}"></video><button type="button" class="owned-film__play">${ja?'13秒で実演を見る':'See it in 13 seconds'} <span aria-hidden="true">▶</span></button></div><figcaption><span>${e(p.proof)} ${ja?'サイト用に約13秒へ編集しています。再生速度は変えていません。':'This site edit is about 13 seconds; playback speed is unchanged.'}</span>${external(recordingSource,product.filmKind==='intro'?(ja?'元の映像':'Source film'):(ja?'元の録画':'Source recording'))}</figcaption><p class="owned-film__status" role="status" aria-live="polite" hidden></p></figure><p class="owned-lead">${e(x.lead || p.description)}</p><p class="owned-try-now"><span>${ja?'最初に試せること':'FIRST THING TO TRY'}</span><strong>${e(x.tryNow)}</strong></p><div class="owned-actions">${external(x.primary[1],x.primary[0],'owned-primary')}${external(x.secondary[1],x.secondary[0],'owned-secondary')}</div><p class="owned-action-note">${e(x.actionNote)}</p><p class="owned-requirements">${e(p.license)} · ${e(p.scope)}</p></section>
<div class="owned-hero-badges-bar"><div class="container"><ul class="owned-hero-badges">${p.highlights.map(h=>`<li><strong>${e(h.value)}</strong><span>${e(h.label)}</span></li>`).join('')}</ul></div></div>
<section class="container owned-features" id="features"><div class="owned-section-head"><p class="owned-kicker">${ja?'主要機能・できること':'KEY CAPABILITIES'}</p><h2>${x.featuresTitle?e(x.featuresTitle):(ja?'いま確かめられる、<br>主な機能。':'What it does today.')}</h2></div><div class="owned-features__grid">${p.features.map(fc=>`<article class="owned-feature-card"><span class="owned-feature-card__code">${e(fc.code)}</span><h3>${e(fc.title)}</h3><p>${e(fc.body)}</p><ul class="owned-feature-card__tags">${fc.tags.map(t=>`<li>${e(t)}</li>`).join('')}</ul></article>`).join('')}</div><p class="owned-features__source">${product.closedSource?(ja?`出典: 非公開のリポジトリ ・ ${e(product.capabilitiesCheckedAt||capabilitiesCheckedAt)}に照合`:`Source: the private repository · checked on ${e(product.capabilitiesCheckedAt||capabilitiesCheckedAt)}`):`${ja?`出典: `:`Source: `}${external(product.source,ja?'READMEで確かめる':'Check the README')}${ja?` ・ ${e(product.capabilitiesCheckedAt||capabilitiesCheckedAt)}にリポジトリと照合`:` · checked against the repository on ${e(product.capabilitiesCheckedAt||capabilitiesCheckedAt)}`}`}${product.sourceSha?` (${e(product.sourceSha.slice(0,7))})`:''}</p></section>
<section class="container owned-flow" id="flow" aria-labelledby="flow-title"><div class="owned-section-head"><p class="owned-kicker">${ja?'この実演で見ること':'WHAT THE FILM SHOWS'}</p><h2 id="flow-title">${e(x.flowTitle || p.outcome)}</h2></div><ol>${x.beats.map(([title,body],i)=>`<li><span class="owned-step-index" aria-hidden="true">0${i+1}</span><h3>${e(title)}</h3><p>${e(body)}</p></li>`).join('')}</ol></section>
<section class="container owned-outcome"><p class="owned-kicker">${ja?'この製品の役割':'THE PRODUCT ROLE'}</p><h2>${e(p.headline)}</h2><p>${e(p.short)} ${e(x.lead || p.description)}</p></section>
<section class="container owned-start" id="start"><div><p class="owned-kicker">${ja?'試す':'TRY IT'}</p><h2>${e(x.startTitle)}</h2><p>${e(x.startBody)}</p></div><div class="owned-start__actions">${external(x.primary[1],x.primary[0],'owned-primary')}${external(product.repo,ja?'GitHubで確認する':'Inspect on GitHub','owned-secondary')}</div></section>
<section class="container owned-boundaries"><div class="owned-section-head"><p class="owned-kicker">${ja?'現在地':'CURRENT BOUNDARIES'}</p><h2>${ja?'利用条件と開発状況。':'Availability and development.'}</h2></div><div class="owned-boundaries__grid"><article><h3>${ja?'現在の範囲':'Current scope'}</h3><p>${e(p.scope)}</p><p>${e(p.license)}</p>${x.iconNote?`<p class="owned-icon-note">${e(x.iconNote)}</p>`:''}${external(product.evidence,product.closedSource?(ja?'YouTubeチャンネルを開く':'Open Noa’s YouTube channel'):(ja?'検証資料を見る':'Read the evidence'))}</article>${x.nextUi?nextUiArticle(x.nextUi,ja,external(prototype,x.nextUi.studyLabel)):!hasDesignStudy?'':`<article><h3>${ja?'次のUI設計':'Proposed interface design'}</h3><p>${ja?'別公開の設計動画は、次のUIを考えるためのプレビューです。現行製品の実演や、新UIの実装完了を示すものではありません。':'The separate design film is a proposal for a future interface. It is not a demonstration of the current product or proof that the proposed UI has shipped.'}</p>${external(prototype,ja?'ラベル付き設計プレビュー':'Open the labelled design study')}</article>`}</div></section>
<section class="container owned-consult"><div><p class="owned-kicker">${ja?'業務への応用':'BUILD WITH IT'}</p><h2>${e(x.consultTitle || (ja?'この仕組みを、実際の業務に合わせる。':'Adapt the mechanism to a real workflow.'))}</h2><p>${e(p.consult)}</p></div><a class="owned-primary" href="${home}contact/">${ja?'開発を相談する':'Discuss a project'} <span aria-hidden="true">→</span></a></section>
<footer class="container owned-footer"><p><a href="${home}products/">${ja?'すべてのプロダクト':'All products'}</a>${external(product.site,ja?'製品サイト':'Product site')}${external(product.repo,'GitHub')}</p><small>Reachmade / Shuhei Horio · ${ja?'実製品・実録画・設計案を区別して公開しています。':'Current products, real recordings and design proposals are labelled separately.'}</small></footer></main></body></html>\n`;
}

export async function writeProductLandings(dist, products, config, recordings) {
  const routes = [];
  for (const id of landingIds) {
    const product = products.find(p=>p.id===id);
    if (!product || !recordings[id]) throw new Error(`Missing landing source: ${id}`);
    for (const lang of ['ja','en']) {
      const x = experienceFor(product, lang);
      for (const src of [x.icon, x.nextUi?.film?.src, x.nextUi?.film?.poster, ...(x.nextUi?.frames || []).map(f => f.src)].filter(Boolean)) {
        await fs.access(path.join(dist, src)).catch(() => { throw new Error(`Missing landing asset for ${id}/${lang}: ${src}`); });
      }
    }
    for (const lang of ['ja','en']) {
      const route = landingRoute(id,lang), target = path.join(dist,route,'index.html');
      await fs.mkdir(path.dirname(target),{recursive:true});
      await fs.writeFile(target,renderProductLanding(product,lang,config,recordings[id]));
      routes.push({route,lang,page:`product-${id}`});
    }
  }
  return routes;
}

const CAPABILITIES_MARK = '/* REACHMADE_PRODUCT_CAPABILITIES */';
/** Appends the capability layer (hero badges, feature cards) to the shared stylesheet. Idempotent. */
export async function writeProductCapabilityStyles(dist) {
  const assets = path.join(dist, 'assets');
  const [css, layer] = await Promise.all(['showcase.css', 'product-capabilities.css'].map(f => fs.readFile(path.join(assets, f), 'utf8')));
  if (!layer.includes('.owned-product .owned-hero-badges') || !layer.includes('.owned-product .owned-feature-card')) throw new Error('Product capability stylesheet is missing or stale');
  await fs.writeFile(path.join(assets, 'showcase.css'), css.split(CAPABILITIES_MARK)[0].trimEnd() + `\n${CAPABILITIES_MARK}\n${layer}`);
}
