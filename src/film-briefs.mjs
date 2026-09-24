/**
 * Reachmade film system — production briefs for every product.
 * These briefs describe how to edit REAL product footage. They do not authorize
 * synthetic product screens or claims beyond src/products.mjs and each product's evidence.
 */
export const FILM_SYSTEM_VERSION = '2026-09-25';

export const filmFormats = Object.freeze({
  heroLoop: Object.freeze({ targetSeconds: 10, aspect: '16:9', audio: 'muted', purpose: 'landing-page hero loop' }),
  productFilm: Object.freeze({ targetSeconds: 55, aspect: '16:9', audio: 'music+sfx', purpose: 'primary product story' }),
  verticalCut: Object.freeze({ targetSeconds: 20, aspect: '9:16', audio: 'music+sfx', purpose: 'short-form social' }),
  fullDemo: Object.freeze({ targetSeconds: 120, aspect: '16:9', audio: 'natural+optional narration', purpose: 'evaluation / technical proof' }),
});

export const filmRules = Object.freeze({
  productPixels: 'real-capture-only',
  playbackRate: 1,
  syntheticProductScreens: false,
  generativeBroll: 'allowed-only-outside-product-ui-and-only-when-clearly-non-product',
  heroAutoplay: 'muted-loop-with-reduced-motion-fallback',
  copyStyle: 'one-idea-per-frame',
  uiCamera: 'crop-and-pan-real-capture; never regenerate UI text',
  proofOrder: ['experience', 'value', 'proof', 'limits'],
});

const shot = (from, to, visualJa, visualEn, copyJa = '', copyEn = '', sound = '') =>
  Object.freeze({ from, to, visual: Object.freeze({ ja: visualJa, en: visualEn }), copy: Object.freeze({ ja: copyJa, en: copyEn }), sound });

export const productFilmBriefs = Object.freeze({
  genie: Object.freeze({
    name: 'Genie',
    promise: Object.freeze({ ja: '作業を止めずに、考えを前へ。', en: 'Stay in the work. Move the thinking forward.' }),
    signatureMoment: Object.freeze({
      ja: 'いま見ている作業の上にTaskDockが現れ、その画面について尋ね、別のAI画面へ移らず結果を使う。',
      en: 'TaskDock appears over the work already on screen; ask about it and use the answer without switching into a separate AI workspace.',
    }),
    heroLoop: Object.freeze([
      shot(0, 2, '通常のMac作業画面。', 'A normal Mac work screen.'),
      shot(2, 5, 'TaskDockを呼び出し、短い質問を入力または発話。', 'Bring up TaskDock and ask one focused question.'),
      shot(5, 8, '回答がTaskDock内に現れ、必要部分をコピー。', 'The answer appears in TaskDock; copy the useful part.'),
      shot(8, 10, '元の作業が前面のまま。Genieロゴへ静かに収束。', 'The original work remains in front; resolve quietly to the Genie mark.'),
    ]),
    productFilm: Object.freeze([
      shot(0, 4, '作業中のMacをそのまま見せる。余計なイントロなし。', 'Open on the Mac already in use. No logo intro.', 'Stay in the work.', 'Stay in the work.', 'room tone + one soft UI tone'),
      shot(4, 11, 'TaskDockを呼び出し、現在の画面について質問。', 'Open TaskDock and ask about the current screen.', 'この画面について、その場で聞く。', 'Ask about what is already in front of you.', 'dock reveal'),
      shot(11, 19, '回答の要点が返り、UIカメラを重要箇所へ軽く寄せる。', 'The answer returns; gently crop toward the useful part.', '', '', 'subtle confirmation'),
      shot(19, 28, '別の短い依頼。文章を短くする／次の確認項目を出す。', 'A second focused request: shorten copy or list the next checks.', '考える場所を、増やさない。', 'Do not add another place to think.', 'minimal typing'),
      shot(28, 38, '結果をコピーまたは保存し、元の作業へ戻す。', 'Copy or save the result back into the work.', '', '', 'copy tick'),
      shot(38, 47, 'Local / API / CLIなど実装上の選択肢は文字だけで簡潔に提示。', 'Show Local / API / CLI routes as restrained text, without fake UI.', '使うモデルは、選べる。', 'Choose the model route.', 'music lift'),
      shot(47, 55, '実画面を引きで見せ、GenieとCTA。', 'Pull back to the real workspace, then Genie and CTA.', 'Genie — AI, without leaving your work.', 'Genie — AI, without leaving your work.', 'single sonic mark'),
    ]),
  }),

  'ai-meeting': Object.freeze({
    name: 'AI Meeting',
    promise: Object.freeze({ ja: '話したことが、次の行動になる。', en: 'What you say becomes the next step.' }),
    signatureMoment: Object.freeze({
      ja: 'AIとの会話中に割り込み、予定を変更すると、変更内容がいったん保留され、確認後にタスクとして残る。',
      en: 'Interrupt the AI to change a plan; the proposed change remains pending until confirmed, then persists as a task.',
    }),
    heroLoop: Object.freeze([
      shot(0, 3, 'AIキャラクターとの音声会話。', 'Voice conversation with the AI character.'),
      shot(3, 6, 'ユーザーが割り込み、予定を変更。', 'The user interrupts and changes the plan.'),
      shot(6, 8, '変更がPendingとして表示。', 'The change appears as pending.'),
      shot(8, 10, '確認後、タスクに反映。', 'After confirmation, the task updates.'),
    ]),
    productFilm: Object.freeze([
      shot(0, 5, '会話がすでに始まっている状態から入る。', 'Enter in the middle of a real conversation.', '話す。', 'Speak.', 'natural voice bed'),
      shot(5, 13, 'AIが返答中にユーザーが割り込み、方向を変える。', 'Interrupt while the AI is responding and change direction.', '途中で変えていい。', 'Change direction mid-conversation.', 'barge-in dip'),
      shot(13, 21, '新しい予定・TODOが提案状態で現れる。', 'The revised plan appears as a proposed task change.', '', '', 'proposal tone'),
      shot(21, 30, '確認UIを見せ、確定するまで保存済み状態と分離。', 'Show confirmation; keep the proposal separate until accepted.', '聞き違いを、そのまま保存しない。', 'Do not save a possible mishearing as fact.', 'hold tone'),
      shot(30, 41, '確認後にタスクが保存され、次回に残る。', 'Confirm and show the task persisting for next time.', '', '', 'confirm'),
      shot(41, 49, 'VRM / voice / taskの関係を実画面で短く見せる。', 'Briefly show the real voice/avatar/task relationship.', 'Conversation → confirmation → task', 'Conversation → confirmation → task', 'music lift'),
      shot(49, 55, 'AI Meetingロゴと試用CTA。', 'AI Meeting mark and try CTA.', 'AI Meeting', 'AI Meeting', 'single sonic mark'),
    ]),
  }),

  oathra: Object.freeze({
    name: 'Oathra',
    promise: Object.freeze({ ja: 'AIの「できた」ではなく、相手の言葉で確かめる。', en: 'Not the AI saying “done.” The other party’s words.' }),
    signatureMoment: Object.freeze({
      ja: 'AIが「予約できました」と言っても未確定のまま。相手側の日時・人数・確定発言が揃った瞬間にVERIFIEDへ変わる。',
      en: 'The agent may say the booking is done, but the result stays unresolved until the other party provides the required date, party size and confirmation evidence.',
    }),
    heroLoop: Object.freeze([
      shot(0, 3, 'AI側が完了を示す発話。判定UIはまだPending。', 'Agent claims completion; verdict UI remains pending.'),
      shot(3, 7, '相手側の発言から日時・人数・確定を拾う。', 'Extract date, party size and confirmation from the other party.'),
      shot(7, 10, 'VERIFIEDに切り替わり、Evidence数を表示。', 'Switch to VERIFIED and show the evidence count.'),
    ]),
    productFilm: Object.freeze([
      shot(0, 5, '電話の会話ログと判定UI。', 'Phone conversation log beside the verdict UI.', '「できました」は、証拠ではない。', '“Done” is not evidence.', 'call ambience'),
      shot(5, 14, 'AI側が成功を宣言するが、confirmedだけ未確認の状態。', 'The agent claims success while the confirmation field remains unresolved.', '', '', 'low tension'),
      shot(14, 24, '相手側の実際の発言へフォーカス。日時・人数・金額等が埋まる。', 'Focus on the other party’s words as required fields are filled.', '相手が何と言ったか。', 'What did the other party actually say?', 'evidence ticks'),
      shot(24, 34, '仮押さえ・未確定などを完了扱いしない例。', 'Show a hold / uncertain state not being promoted to completion.', '曖昧なら、完了にしない。', 'Uncertain stays unresolved.', 'no-confirm tone'),
      shot(34, 44, '必要証拠が揃いVERIFIEDへ。', 'Required evidence completes and the verdict turns VERIFIED.', '', '', 'verified tone'),
      shot(44, 51, '会話証拠と外部システム証拠を別レベルとして短く提示。', 'Briefly distinguish conversation evidence from external-system proof.', 'Conversation ≠ external record', 'Conversation ≠ external record', 'music lift'),
      shot(51, 55, 'Oathraロゴと検証デモCTA。', 'Oathra mark and evidence-demo CTA.', 'Oathra', 'Oathra', 'single sonic mark'),
    ]),
  }),

  aisecure: Object.freeze({
    name: 'AI Secure',
    promise: Object.freeze({ ja: '送る前に、ローカルで確かめる。', en: 'Inspect it locally before it leaves.' }),
    signatureMoment: Object.freeze({
      ja: '機密情報を含む文書をAIへ送る前にローカル検査し、保留理由・検査範囲を確認してJSONレポートとして残す。',
      en: 'Before a document leaves for an AI service, inspect it locally, review why it was held and what was covered, then save the decision as a JSON report.',
    }),
    heroLoop: Object.freeze([
      shot(0, 3, '編集可能なサンプル文書。', 'An editable sample document.'),
      shot(3, 6, '「送信せずに検査」を実行。', 'Run “inspect without sending.”'),
      shot(6, 8, '保留と理由・該当箇所を表示。', 'Show the review result, reason and matched content.'),
      shot(8, 10, 'JSONレポート保存へ。', 'Move to saving the JSON report.'),
    ]),
    productFilm: Object.freeze([
      shot(0, 5, '文書と「送信前」という文脈を明確にする。', 'Establish the document and the before-sending moment.', 'Before it leaves.', 'Before it leaves.', 'quiet desk tone'),
      shot(5, 13, '送信せずにローカル検査を開始。', 'Start the local inspection without sending the document.', 'まず、ローカルで見る。', 'Inspect locally first.', 'scan tone'),
      shot(13, 23, 'review/保留結果、理由、該当箇所を見せる。', 'Show the review result, reasons and matched content.', '', '', 'marker ticks'),
      shot(23, 33, 'coverageを表示し、「見つからないカテゴリもある」ことを隠さない。', 'Show coverage and make the known misses visible rather than implying complete detection.', '「検出なし」を、安全の保証にしない。', '“No finding” is not a safety guarantee.', 'music restraint'),
      shot(33, 43, '判断と理由をJSONレポートとして保存。', 'Save the decision, reasons and coverage as a JSON report.', '', '', 'save tick'),
      shot(43, 50, 'OCR/AV/blanket DLPではないことを短く表示。', 'Briefly state that this is not OCR, antivirus or blanket DLP.', 'Explicit preflight, measured limits.', 'Explicit preflight, measured limits.', 'music lift'),
      shot(50, 55, 'AI Secureロゴと試用CTA。', 'AI Secure mark and try CTA.', 'AI Secure', 'AI Secure', 'single sonic mark'),
    ]),
  }),

  'agent-team': Object.freeze({
    name: 'Agent Team',
    promise: Object.freeze({ ja: 'ひとつ頼む。チームが作り、確かめ、直す。', en: 'One request. The team drafts, checks, and revises.' }),
    signatureMoment: Object.freeze({
      ja: 'Reviewerの指摘をクリックすると成果物の該当箇所へ飛び、修正版と再確認が同じ作業記録につながる。',
      en: 'Click a reviewer finding to jump to the exact passage, then see the revision and re-check in the same work record.',
    }),
    heroLoop: Object.freeze([
      shot(0, 2, 'ひとつの依頼。', 'One request.'),
      shot(2, 5, 'Researcher / Builder / Reviewerが並行して動く記録。', 'Researcher / Builder / Reviewer work trail.'),
      shot(5, 8, 'Reviewer指摘から成果物の該当箇所へジャンプ。', 'Jump from a reviewer finding to the exact artifact passage.'),
      shot(8, 10, '修正版と再確認。', 'Revision and re-check.'),
    ]),
    productFilm: Object.freeze([
      shot(0, 5, '一つの依頼と期待する成果物を表示。', 'Show one request and its expected artifact.', 'One request.', 'One request.', 'single start tone'),
      shot(5, 14, 'Masterが役割へ分けるタイムライン。', 'The Master splits the work into explicit roles.', '役割を分ける。', 'Split the work.', 'timeline ticks'),
      shot(14, 24, 'Researcher / Builderの実メッセージと成果物。', 'Show real Researcher / Builder messages beside the artifact.', '', '', 'work rhythm'),
      shot(24, 34, 'Reviewerの3つの指摘。1件をクリックして該当箇所へ。', 'Show reviewer findings; click one to jump to the relevant passage.', '誰が、何を確かめたか。', 'Who checked what?', 'review marker'),
      shot(34, 44, '修正された箇所と版の差分。', 'Show the changed passage and artifact revision.', '', '', 'revision tick'),
      shot(44, 50, 're-verificationとpartial/unfinishedの扱い。', 'Show re-verification and preserve partial / unfinished status.', '未完了も、消さない。', 'Keep unfinished work visible.', 'music lift'),
      shot(50, 55, 'Agent Teamロゴと実行記録CTA。', 'Agent Team mark and real-run CTA.', 'Agent Team', 'Agent Team', 'single sonic mark'),
    ]),
  }),

  launchloom: Object.freeze({
    name: 'Launchloom',
    promise: Object.freeze({ ja: '作ったものを、公開できる素材へ。', en: 'Turn what you built into material ready to publish.' }),
    signatureMoment: Object.freeze({
      ja: 'ひとつの製品説明と実録画から、横動画・縦動画・LP・SNS投稿案が同じストーリーで並び、公開前にレビューできる。',
      en: 'From one product brief and real recording, landscape film, vertical cut, landing page and social drafts appear from the same story and remain reviewable before publishing.',
    }),
    heroLoop: Object.freeze([
      shot(0, 2, '実際の操作録画を入力。', 'Start with a real product recording.'),
      shot(2, 5, 'Storyboard / review状態。', 'Storyboard / review state.'),
      shot(5, 8, '16:9・9:16の動画が並ぶ。', 'Landscape and vertical films appear.'),
      shot(8, 10, 'LPとSNSドラフトまで一画面に。', 'Landing page and social drafts join the kit.'),
    ]),
    productFilm: Object.freeze([
      shot(0, 5, '完成したプロダクトの実画面から始める。', 'Open on the finished product itself.', 'You built it.', 'You built it.', 'soft camera tone'),
      shot(5, 13, '製品説明と実録画をLaunchloomへ。', 'Bring a brief and the real product recording into Launchloom.', 'Now make it understandable.', 'Now make it understandable.', 'ingest tick'),
      shot(13, 22, 'Storyboardが作られ、編集待ち状態になる。', 'A storyboard appears and waits for review.', '', '', 'storyboard rhythm'),
      shot(22, 33, '横動画と縦動画を別レイアウトで生成。', 'Render landscape and vertical films with purpose-built layouts.', 'One story. Different canvases.', 'One story. Different canvases.', 'render lift'),
      shot(33, 43, 'LP・字幕・投稿案・posterが同じkitに揃う。', 'Show the landing page, captions, social drafts and poster in one kit.', '', '', 'asset ticks'),
      shot(43, 50, '公開は別工程であること、レビュー可能な状態を示す。', 'Show that publishing remains a separate, reviewable step.', 'Create first. Publish deliberately.', 'Create first. Publish deliberately.', 'music resolve'),
      shot(50, 55, 'Launchloomロゴとローカル制作CTA。', 'Launchloom mark and local-workflow CTA.', 'Launchloom', 'Launchloom', 'single sonic mark'),
    ]),
  }),
});
