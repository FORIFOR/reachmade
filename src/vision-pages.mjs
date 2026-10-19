/**
 * Vision sections for product pages, following the Oathra page: three use-case concept demos you can try, then one
 * moving diagram of the idea the product is built on. The current state stays further down the page (recording,
 * status, scope), so these sections speak to what the product is for.
 *
 * Each scene is drawn in HTML and animated with CSS only when JavaScript marks it as in view; without JavaScript,
 * or with reduced motion, the finished state is shown. The scenes and the demo pages use the product's own words
 * and states, taken from its repository (cited per product below). Data is fictional; the one label says so.
 */
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// AI Meeting (FORIFOR/AI-meeting origin/main): README.ja.md「会話で決めたTODOを、次回へ残す。」and its spoken example;
// TaskList.tsx proposal card wording; CalendarActions.tsx draft → approve → confirmed flow; MeetingMemory.ts
// (quotes are unconfirmed candidates, owner and due date unknown unless quoted); tasks.ts (never add by guessing).
export const VISION = Object.freeze({
  'ai-meeting': {
    demo: '/demos/ai-meeting/',
    ja: {
      kicker: '用途別の構想デモ', title: '話して、<br>決まったことだけ残す。', lead: '言い直しても、予定にしても、チームで決めても。確かめてから残ります。',
      label: '構想デモ・架空データ', uiNote: '',
      demos: [
        {id: 'reschedule', kind: '言い直し', title: '「やっぱり、明日にして。」', body: '話しながら言い直しても、反映するのは確かめてから。', tryLabel: '言い直しを試す',
          scene: [['task', 'メール返信', '今日', '明日 · 延期', 5], ['task', '資料確認', '今日'], ['say', 'メール返信は今日中に……いや、やっぱり明日にして。'], ['card', '確認待ちの変更案', 'メール返信　今日 → 明日', '「やっぱり明日にして」', 'この変更を反映', '反映しました', 5]]},
        {id: 'calendar', kind: '会話から予定へ', title: '決まったことを、予定に。', body: '登録案を作り、承認したときだけ登録。招待やメールは送りません。', tryLabel: '予定への登録を試す',
          scene: [['task', '企画レビュー', '日時は未定', '金曜 15:00 · 登録済み', 4], ['say', 'これ、金曜の15時に入れておいて。'], ['card', '登録案（まだ送信しません）', '企画レビュー　金曜 15:00–15:30', '招待・メール：送りません', '承認して登録', '登録を確認しました', 4]]},
        {id: 'team', kind: 'チームで', title: '会議の決定を、チームのタスクに。', body: '発言の引用つきで候補に。担当と期限は、言われていなければ「不明」のまま。', tryLabel: 'チームでの共有を試す',
          scene: [['say', '見積もりは来週までに出しましょう。'], ['say', 'デザイン案はAとBで比べたいですね。'], ['card', 'タスク候補（未確認）', '見積もりを出す　期限：来週 · 担当：不明', '「見積もりは来週までに」', '確認して共有', '共有しました', 4], ['new', '見積もりを出す', 'チームで共有 · 担当は未定']]}
      ],
      mechKicker: 'しくみ', mechTitle: '原文が、根拠になる。', mechLead: '推測では足さない。あなたの言葉を引用した変更案だけを、確かめてから残します。',
      mech: [['話す', 'いつもの言葉で'], ['引用する', '発言の原文をそのまま'], ['保留する', 'まだ反映していません'], ['確かめる', '反映か、取り消すか'], ['次回へ', '決まったことだけ']]
    },
    en: {
      kicker: 'Concept demos by use', title: 'Talk it through.<br>Keep only what was decided.', lead: 'Changing your mind, booking it, or deciding as a team: it is kept only after you confirm.',
      label: 'Concept demo · fictional data', uiNote: 'The demos run in Japanese.',
      demos: [
        {id: 'reschedule', kind: 'Changing your mind', title: '“Actually, make it tomorrow.”', body: 'Rephrase as you talk; nothing changes until you confirm.', tryLabel: 'Try rephrasing',
          scene: [['task', 'Reply to email', 'Today', 'Tomorrow · postponed', 5], ['task', 'Review the deck', 'Today'], ['say', 'Reply to the email today… no, actually, make it tomorrow.'], ['card', 'Change waiting for you', 'Reply to email　today → tomorrow', '“actually, make it tomorrow”', 'Apply this change', 'Applied', 5]]},
        {id: 'calendar', kind: 'From talk to calendar', title: 'Put what was decided on the calendar.', body: 'A draft first, booked only when you approve. No invitations or emails are sent.', tryLabel: 'Try booking it',
          scene: [['task', 'Plan review', 'No time yet', 'Fri 15:00 · booked', 4], ['say', 'Put this in for Friday at three.'], ['card', 'Draft (not sent yet)', 'Plan review　Fri 15:00–15:30', 'Invitations and email: none', 'Approve and book', 'Booking confirmed', 4]]},
        {id: 'team', kind: 'As a team', title: 'Turn a meeting’s decisions into team tasks.', body: 'Candidates carry the quote. Owner and due date stay “unknown” unless someone said them.', tryLabel: 'Try sharing with the team',
          scene: [['say', 'Let’s send the estimate by next week.'], ['say', 'I’d like to compare designs A and B.'], ['card', 'Task candidate (unconfirmed)', 'Send the estimate　due next week · owner unknown', '“send the estimate by next week”', 'Confirm and share', 'Shared', 4], ['new', 'Send the estimate', 'Shared with the team · owner open']]}
      ],
      mechKicker: 'How it works', mechTitle: 'Your words are the evidence.', mechLead: 'Nothing is added by guessing. Only changes that quote you are kept, after you confirm.',
      mech: [['Talk', 'In your own words'], ['Quote', 'The exact words, kept'], ['Hold', 'Not applied yet'], ['Confirm', 'Apply or discard'], ['Next time', 'Only what was decided']]
    }
  },
  // AI Secure (FORIFOR/AISecure origin/main): docs/index.ja.html「AIに貼る前に、端末で止める。」; decisions, rule texts and
  // coverage from aisecure/control/web/app.js and documents.py; the 入力 → 検査 → 判定 flow from control/web/index.html.
  aisecure: {
    demo: '/demos/aisecure/',
    ja: {
      kicker: '用途別の構想デモ', title: 'AIに貼る前に、<br>端末で止める。', lead: '判定・理由・検査範囲が、その場で出ます。送るかどうかは、あなたが決めます。',
      label: '構想デモ・架空データ', uiNote: '',
      demos: [
        {id: 'sheet', kind: '社外秘の資料', title: '見積もりのExcelを、AIに貼る前に。', body: '「社外秘」の表記を見つけて保留。理由と検査範囲が、その場で出ます。', tryLabel: '資料の検査を試す',
          scene: [['task', '見積もり_次期モデル.xlsx', '未検査', '保留', 4], ['say', 'この資料の要点を確認してください。'], ['card', '判定', '保留　DOC-CLASS', '社外秘などの機密表記があります', '送信せずに検査', '外部送信していません', 4]]},
        {id: 'personal', kind: '個人情報', title: '顧客メモを、要約に出す前に。', body: '名前やメールアドレスらしい文字列を見つけて保留。取り扱いを確かめてから。', tryLabel: '個人情報の検査を試す',
          scene: [['task', '顧客メモ.txt', '未検査', '保留', 4], ['say', 'この顧客メモを短くまとめて。'], ['card', '判定', '保留　DOC-PII', '個人情報らしい文字列があります', '送信せずに検査', '外部送信していません', 4]]},
        {id: 'secret', kind: '認証情報', title: 'スライドのメモに、キーが残っていた。', body: '認証情報らしい文字列は拒否。原本から消して、検査し直します。', tryLabel: '拒否になる例を試す',
          scene: [['task', '提案資料.pptx', '未検査', '拒否', 4], ['say', 'このスライドの構成を見直して。'], ['card', '判定', '拒否　DOC-SECRET', '原本から削除し、検査し直してください', '送信せずに検査', '外部送信していません', 4]]}
      ],
      mechKicker: 'しくみ', mechTitle: 'その場で止まる。<br>送るのは、あなた。', mechLead: '検査はこの端末で。判定には、いつも理由と検査範囲が付きます。',
      mech: [['入れる', '資料と、送る予定の指示'], ['手元で検査', '外部には送らない'], ['判定', '検査通過・保留・拒否'], ['理由と範囲', '根拠ルールと検査範囲'], ['送るかはあなた', '決めるのは人']]
    },
    en: {
      kicker: 'Concept demos by use', title: 'Before you paste it into AI,<br>it stops on your machine.', lead: 'The decision, its reasons and the coverage appear on the spot. Whether to send is up to you.',
      label: 'Concept demo · fictional data', uiNote: 'The demos run in Japanese.',
      demos: [
        {id: 'sheet', kind: 'Confidential file', title: 'A quote spreadsheet, before it goes to AI.', body: 'A “confidential” marking puts it on hold, with the reason and coverage on the spot.', tryLabel: 'Try checking a file',
          scene: [['task', 'quote_next_model.xlsx', 'Not checked', 'Hold', 4], ['say', 'Summarise the key points of this file.'], ['card', 'Decision', 'Hold　DOC-CLASS', 'A confidentiality marking was found', 'Check without sending', 'Nothing sent out', 4]]},
        {id: 'personal', kind: 'Personal data', title: 'Customer notes, before you ask for a summary.', body: 'Something that looks like a name or email address puts it on hold until you check.', tryLabel: 'Try a personal-data check',
          scene: [['task', 'customer_notes.txt', 'Not checked', 'Hold', 4], ['say', 'Make these customer notes shorter.'], ['card', 'Decision', 'Hold　DOC-PII', 'Something that looks like personal data', 'Check without sending', 'Nothing sent out', 4]]},
        {id: 'secret', kind: 'Credentials', title: 'A key left in the speaker notes.', body: 'Something that looks like a credential is rejected: remove it from the original and check again.', tryLabel: 'Try a rejected file',
          scene: [['task', 'proposal.pptx', 'Not checked', 'Rejected', 4], ['say', 'Rework the structure of these slides.'], ['card', 'Decision', 'Rejected　DOC-SECRET', 'Remove it from the original and check again', 'Check without sending', 'Nothing sent out', 4]]}
      ],
      mechKicker: 'How it works', mechTitle: 'It stops on the spot.<br>You decide to send.', mechLead: 'Checks run on this machine. Every decision comes with its reasons and coverage.',
      mech: [['Add', 'The file and the prompt'], ['Check locally', 'Nothing leaves the machine'], ['Decide', 'Passed, hold or rejected'], ['Reasons and coverage', 'Rule IDs and what was checked'], ['You send', 'A person decides']]
    }
  },
  // Launchloom (FORIFOR/Launchloom origin/main): README.ja.md「作った、その先まで。」, homepage/ja「公開の判断は最後まで自分の
  // 手に。」; stage and button names from launchloom/web/i18n.js and index.html; drafts only, publishing needs approval.
  launchloom: {
    demo: '/demos/launchloom/',
    ja: {
      kicker: '用途別の構想デモ', title: '作った、<br>その先まで。', lead: '収録1本が、動画と紹介ページと投稿文に。公開の判断は、最後まで自分の手に。',
      label: '構想デモ・架空データ', uiNote: '',
      demos: [
        {id: 'feature', kind: '新機能の告知', title: '30秒の録画を、告知一式に。', body: '構成を読んでから書き出し。横長・縦長の動画、LP、投稿案がそろいます。', tryLabel: '告知づくりを試す',
          scene: [['task', '操作録画.mp4', '実画面 · 0:30'], ['say', '新しい書き出し機能を、使う人に届けたい。'], ['card', '構成の確認待ち', '見出し：書き出しが、1クリックに。', '字幕 4枚 · 横長 16:9 / 縦長 9:16', '保存して動画を作る', '制作キットを書き出しました', 4], ['new', '制作キット.zip', '動画 · LP · 投稿案（下書き）']]},
        {id: 'revise', kind: 'LPの改訂', title: 'ボタンひとつ分だけ、作り直す。', body: '録り直さずに改訂。変えたところだけ、書き出し直します。', tryLabel: 'LPの改訂を試す',
          scene: [['task', '紹介ページ', 'CTA：今すぐ試す', 'CTA：無料ではじめる', 4], ['say', 'ボタンの言葉を「無料ではじめる」に変えて。'], ['card', '改訂の確認', 'CTA　今すぐ試す → 無料ではじめる', '録り直し：なし', '改訂して書き出す', '書き出しました', 4]]},
        {id: 'publish', kind: '公開はあなた', title: '投稿は、承認したものだけ。', body: '投稿案は下書きのまま。承認した投稿だけが予約されます。', tryLabel: '承認の流れを試す',
          scene: [['task', 'X', '下書き', '承認済み · 明日 9:00', 4], ['task', 'LinkedIn', '下書き'], ['card', '承認待ち', 'X　「書き出しが、1クリックに。」', '文面・画像・日時に結びつけて承認', '承認して予約', '承認しました', 4]]}
      ],
      mechKicker: 'しくみ', mechTitle: '公開の判断は、<br>最後まで自分の手に。', mechLead: '読んでから書き出す。承認したものだけが外に出ます。',
      mech: [['録画', '実際の画面から'], ['構成', '見出しと字幕'], ['確認', '読んでから書き出す'], ['書き出し', '動画・LP・投稿案'], ['公開はあなた', '承認したものだけ']]
    },
    en: {
      kicker: 'Concept demos by use', title: 'You built it.<br>Now take it further.', lead: 'One recording becomes a film, a page and posts. The decision to publish stays with you.',
      label: 'Concept demo · fictional data', uiNote: 'The demos run in Japanese.',
      demos: [
        {id: 'feature', kind: 'Feature launch', title: 'From a 30-second recording to a launch kit.', body: 'Read the plan, then render: landscape and vertical films, a page and post drafts.', tryLabel: 'Try a launch kit',
          scene: [['task', 'screen_recording.mp4', 'Real screen · 0:30'], ['say', 'I want people to know about the new export.'], ['card', 'Plan waiting for review', 'Headline: Export, in one click.', '4 captions · 16:9 / 9:16', 'Save and render', 'Launch kit exported', 4], ['new', 'launch_kit.zip', 'Film · page · post drafts']]},
        {id: 'revise', kind: 'Page update', title: 'Rebuild just the one button.', body: 'Revise without re-recording; only what changed is rendered again.', tryLabel: 'Try a page revision',
          scene: [['task', 'Product page', 'CTA: Try it now', 'CTA: Start free', 4], ['say', 'Change the button to “Start free”.'], ['card', 'Check the revision', 'CTA　Try it now → Start free', 'Re-recording: none', 'Revise and export', 'Exported', 4]]},
        {id: 'publish', kind: 'You publish', title: 'Only approved posts go out.', body: 'Post drafts stay drafts. Only the posts you approve are scheduled.', tryLabel: 'Try the approval step',
          scene: [['task', 'X', 'Draft', 'Approved · tomorrow 9:00', 4], ['task', 'LinkedIn', 'Draft'], ['card', 'Waiting for approval', 'X　“Export, in one click.”', 'Approval is tied to the text, media and time', 'Approve and schedule', 'Approved', 4]]}
      ],
      mechKicker: 'How it works', mechTitle: 'The decision to publish<br>stays with you.', mechLead: 'Read it, then render. Only what you approve goes out.',
      mech: [['Record', 'From the real screen'], ['Shape', 'Headlines and captions'], ['Review', 'Read before rendering'], ['Export', 'Film · page · posts'], ['You publish', 'Only what you approve']]
    }
  },
  // Agent Team (FORIFOR/Multibot origin/main): docs/site/build_site.py「頼むのは一度。作った版を、別のAIが確かめる。」and
  // 「ひとりのAIに、全部は任せない。」; roles from frontend/src/lib/journey.ts; 通過 / 要修正 / 未確認, 「この版を採用」,
  // 「まとめて取得」from Workroom.tsx and RunView.tsx. Checks are tied to a version's bytes (README).
  'agent-team': {
    demo: '/demos/agent-team/',
    ja: {
      kicker: '用途別の構想デモ', title: 'ひとりのAIに、<br>全部は任せない。', lead: '頼むのは一度。作った版を、別のAIが確かめます。',
      label: '構想デモ・架空データ', uiNote: '',
      demos: [
        {id: 'tool', kind: '小さな道具', title: 'CSVの集計ツールを、テストつきで。', body: 'つくる係が作り、確かめる係が差し戻す。2版目で通過しました。', tryLabel: 'ツールづくりを試す',
          scene: [['say', 'このCSVを年月別に集計するツールを作って。テストも付けて。'], ['task', '版1 · aggregate.py', '要修正'], ['task', '版2 · aggregate.py', '確認中', '通過', 4], ['card', '確かめる係', '版2　テスト：通過', '確認は、この版の中身に結びつきます', 'この版を採用', '採用版になりました', 4]]},
        {id: 'research', kind: '調べて比べる', title: '公開資料を、出典つきで比べる。', body: '調べる係が出典を集め、つくる係がメモに。照合できない点は「未確認」のまま。', tryLabel: '比較メモを試す',
          scene: [['say', '3社の公開資料を比べて、違いをまとめて。'], ['task', '出典メモ', '調べる係 · 12件'], ['task', '比較メモ · 版2', '確認中', '通過 · 未確認 1件', 4], ['card', '確かめる係', '指摘3件 → 修正済み', '出典の照合：1件は未確認のまま', '確認の記録を見る', '未確認を残して届けます', 4]]},
        {id: 'docs', kind: '記録つきで受け取る', title: '採用した版だけ、まとめて受け取る。', body: '確認の記録がない版には警告。選んだ版を、記録ごと受け取ります。', tryLabel: '受け取りを試す',
          scene: [['task', '版1 · guide.md', '確認の記録なし'], ['task', '版2 · guide.md', '通過', '採用版', 4], ['say', '採用した版だけ、まとめて受け取りたい。'], ['card', 'まとめて取得', '採用版 · 確認の記録 · 作業記録', 'ZIPで受け取ります', 'まとめて取得', '受け取りました', 4]]}
      ],
      mechKicker: 'しくみ', mechTitle: '作る係と、<br>確かめる係を分ける。', mechLead: '作った本人は、自分の間違いに気づきにくい。だから、別のAIがその版を確かめます。',
      mech: [['お願い', '頼むのは一度'], ['分担', 'まとめ役が割り振る'], ['つくる', '版ごとに残る'], ['確かめる', '別のAIが、その版を'], ['記録つきで届く', '選ぶのはあなた']]
    },
    en: {
      kicker: 'Concept demos by use', title: 'Don’t leave everything<br>to one AI.', lead: 'Ask once. One AI makes the file; another checks that exact version.',
      label: 'Concept demo · fictional data', uiNote: 'The demos run in Japanese.',
      demos: [
        {id: 'tool', kind: 'A small tool', title: 'A CSV summary tool, with tests.', body: 'The maker builds it, the checker sends it back, and version 2 passes.', tryLabel: 'Try building a tool',
          scene: [['say', 'Make a tool that totals this CSV by month, with tests.'], ['task', 'v1 · aggregate.py', 'Needs changes'], ['task', 'v2 · aggregate.py', 'Checking', 'Passed', 4], ['card', 'Checker', 'v2　tests: passed', 'The check is tied to this exact version', 'Use this version', 'Now the adopted version', 4]]},
        {id: 'research', kind: 'Research and compare', title: 'Compare public documents, with sources.', body: 'The researcher gathers sources, the maker writes the memo, and anything unmatched stays “unverified”.', tryLabel: 'Try a comparison memo',
          scene: [['say', 'Compare these three companies’ public documents.'], ['task', 'Source notes', 'Researcher · 12'], ['task', 'Comparison memo · v2', 'Checking', 'Passed · 1 unverified', 4], ['card', 'Checker', '3 findings → fixed', 'Source check: 1 still unverified', 'See the check record', 'Delivered with the unverified point', 4]]},
        {id: 'docs', kind: 'Delivered with records', title: 'Take only the version you adopted.', body: 'A version without a check record is flagged. Take the one you chose, with its records.', tryLabel: 'Try taking delivery',
          scene: [['task', 'v1 · guide.md', 'No check record'], ['task', 'v2 · guide.md', 'Passed', 'Adopted', 4], ['say', 'I only want the adopted version.'], ['card', 'Download all', 'Adopted version · check record · run log', 'As a ZIP', 'Download all', 'Received', 4]]}
      ],
      mechKicker: 'How it works', mechTitle: 'Separate the maker<br>from the checker.', mechLead: 'Whoever made it is the last to spot its mistakes, so another AI checks that version.',
      mech: [['Ask', 'Once'], ['Share out', 'The lead assigns roles'], ['Make', 'Every version is kept'], ['Check', 'Another AI, that version'], ['Delivered with records', 'You choose']]
    }
  },
  // 星藍ノア (private repository; README「コメントがなくても話が続く。コメントが来たら自然な切れ目で返す。ゲームも実況
  // する。」): the output gate stays silent when a check fails; game lines from games/smash-ultimate/show.mjs and
  // src/blocks-show.mjs; effects from public/effect-director.mjs; voice AivisSpeech コハク (docs/VOICE.md).
  noa: {
    demo: '/demos/noa/',
    ja: {
      kicker: '配信の構想デモ', title: 'コメントがなくても、<br>話が続く。', lead: 'コメントが来たら、自然な切れ目で返す。ゲームも実況する。',
      label: '構想デモ・架空のコメント', uiNote: '',
      demos: [
        {id: 'comment', kind: 'コメントに返す', title: '「どの家具が好き？」', body: '話の切れ目で、短く返事。確かめた言葉だけを、声と表情に。', tryLabel: '返事の流れを試す',
          scene: [['task', '雑談', '家具の話', 'コメントに返事', 4], ['say', 'どの家具が好き？'], ['card', '返事の候補', '「椅子かな。座ったまま考えごとができるから。」', '表情：照れ', '声にする', '声と表情で返しました', 4]]},
        {id: 'game', kind: 'ゲーム実況', title: '勝ったら、いっしょに喜ぶ。', body: '試合の様子は観測した結果から。言葉は、その様子に合うかを確かめてから。', tryLabel: '実況の流れを試す',
          scene: [['task', 'スマブラSP', '試合中', '観測：勝利', 4], ['say', '勝った？'], ['card', '実況の候補', '「やったー、勝利！いい試合だったね。」', '演出：きらきら', '声にする', '喜びの演出で返しました', 4]]},
        {id: 'blocks', kind: 'NOA BLOCKS', title: '積みすぎたら、ちゃんと焦る。', body: '危ない場面では汗、助かったらきらきら。自己ベストは紙吹雪とチャイムで。', tryLabel: 'NOA BLOCKSを試す',
          scene: [['task', 'NOA BLOCKS', '危険ゾーン', '自己ベスト更新', 4], ['say', 'がんばれ！'], ['card', '実況の候補', '「よし、4ライン！」', '演出：紙吹雪とチャイム', '声にする', '記録更新を祝いました', 4]]}
      ],
      mechKicker: 'しくみ', mechTitle: '話す前に、<br>確かめる。', mechLead: '返事はすべて出力ゲートを通ります。通らなければ、話しません。',
      mech: [['コメント', '見て、選ぶ'], ['返事を考える', '短い1〜2文'], ['出力ゲート', '通らなければ話さない'], ['声と表情', 'コハクの声で'], ['配信', '自然な切れ目で']]
    },
    en: {
      kicker: 'Stream concept demos', title: 'The talk keeps going,<br>even without comments.', lead: 'When a comment comes in, she answers at a natural break. She commentates games too.',
      label: 'Concept demo · fictional comments', uiNote: 'The demos run in Japanese.',
      demos: [
        {id: 'comment', kind: 'Answering a comment', title: '“Which furniture do you like?”', body: 'A short answer at a natural break. Only checked words become voice and expression.', tryLabel: 'Try a reply',
          scene: [['task', 'Chat', 'Talking about furniture', 'Answering a comment', 4], ['say', 'Which furniture do you like?'], ['card', 'Reply candidate', '“The chair. I can think while I sit.”', 'Expression: shy', 'Say it', 'Answered with voice and expression', 4]]},
        {id: 'game', kind: 'Game commentary', title: 'When the match is won, she celebrates.', body: 'What happened comes from the observed game; the words are checked against it first.', tryLabel: 'Try commentary',
          scene: [['task', 'Smash Bros. Ultimate', 'In the match', 'Observed: win', 4], ['say', 'Did you win?'], ['card', 'Commentary candidate', '“Yes, a win! That was a good match.”', 'Effect: sparkle', 'Say it', 'Celebrated', 4]]},
        {id: 'blocks', kind: 'NOA BLOCKS', title: 'Stack too high, and she gets nervous.', body: 'Sweat when it is risky, sparkle when she is saved, confetti and a chime for a personal best.', tryLabel: 'Try NOA BLOCKS',
          scene: [['task', 'NOA BLOCKS', 'Danger zone', 'Personal best', 4], ['say', 'You can do it!'], ['card', 'Commentary candidate', '“Yes, four lines!”', 'Effect: confetti and chime', 'Say it', 'Personal best celebrated', 4]]}
      ],
      mechKicker: 'How it works', mechTitle: 'Check first,<br>then speak.', mechLead: 'Every line goes through an output gate. If it does not pass, she stays silent.',
      mech: [['Comment', 'Read and pick'], ['Think of a reply', 'One or two short lines'], ['Output gate', 'No pass, no speech'], ['Voice and face', 'In the Kohaku voice'], ['Stream', 'At a natural break']]
    }
  }
});

// A scene is a list of rows that appear one step at a time. A task or card may name the step at which the change is
// applied (`at`): the row then switches in place from its "was" value to its "now" value, so the finished state never
// shows the same item twice. Without animation the finished state is what shows.
function sceneHtml(scene) {
  return scene.map(([kind, a, b, c, d, e2, f], i) => {
    const step = ` vp-step vp-step--${i + 1}`;
    const swap = (was, now, at) => `<span class="vp-swap"><small class="vp-was vp-out--${at}">${esc(was)}</small><small class="vp-now vp-in--${at}">${esc(now)}</small></span>`;
    if (kind === 'task') return c == null
      ? `<li class="vp-row vp-row--task${step}"><span class="vp-check" aria-hidden="true"></span><span>${esc(a)}</span><small>${esc(b)}</small></li>`
      : `<li class="vp-row vp-row--task${step}"><span class="vp-check" aria-hidden="true"><i class="vp-tick vp-in--${d}"></i></span><span>${esc(a)}</span>${swap(b, c, d)}</li>`;
    if (kind === 'new') return `<li class="vp-row vp-row--task vp-row--new${step}"><span class="vp-check" aria-hidden="true"><i class="vp-tick"></i></span><span>${esc(a)}</span><small>${esc(b)}</small></li>`;
    if (kind === 'say') return `<li class="vp-row vp-row--say${step}"><span class="vp-mic" aria-hidden="true"></span><q>${esc(a)}</q></li>`;
    return `<li class="vp-row vp-row--card${step}"><small>${esc(a)}</small><b>${esc(b)}</b><span>${esc(c)}</span><span class="vp-swap vp-swap--action"><span class="vp-btn vp-out--${f}" aria-hidden="true">${esc(d)}</span><span class="vp-applied vp-in--${f}">${esc(e2)}</span></span></li>`;
  }).join('');
}

export function visionSections(p, lang) {
  const v = VISION[p.id];
  if (!v) return '';
  const t = v[lang];
  if (!t || t.demos.length !== 3 || t.mech.length !== 5) throw new Error(`Vision sections: incomplete ${p.id}/${lang}`);
  const demos = t.demos.map((d, i) => `<article class="vp-demo" aria-labelledby="vp-demo-${esc(d.id)}"><div class="vp-demo-copy"><p class="vp-index">0${i + 1} / ${esc(d.kind)}</p><h3 id="vp-demo-${esc(d.id)}">${esc(d.title)}</h3><p>${esc(d.body)}</p><a class="vp-try" href="${esc(v.demo)}?flow=${esc(d.id)}">${esc(d.tryLabel)} <span aria-hidden="true">↗</span></a></div><figure class="vp-screen" data-vp-scene><p class="vp-screen-bar"><span>${esc(p.name)}</span><span>${esc(t.label)}</span></p><ol class="vp-rows">${sceneHtml(d.scene)}</ol></figure></article>`).join('');
  const mech = t.mech.map(([k, b], i) => `<li class="vp-node vp-node--${i + 1}"><span class="vp-node-n">0${i + 1}</span><b>${esc(k)}</b><span>${esc(b)}</span></li>`).join('');
  return `<section class="vp-demos" id="concept-demos" aria-labelledby="vp-demos-title"><div class="vp-head"><div><p class="rd-kicker">${esc(t.kicker)}</p><h2 id="vp-demos-title">${t.title}</h2></div><p>${esc(t.lead)}${t.uiNote ? ` ${esc(t.uiNote)}` : ''}</p></div><div class="vp-list">${demos}</div></section>`
    + `<section class="vp-mech" id="how" aria-labelledby="vp-mech-title"><div class="vp-head"><div><p class="rd-kicker">${esc(t.mechKicker)}</p><h2 id="vp-mech-title">${t.mechTitle}</h2></div><p>${esc(t.mechLead)}</p></div><ol class="vp-flow" data-vp-scene>${mech}</ol></section>`;
}
