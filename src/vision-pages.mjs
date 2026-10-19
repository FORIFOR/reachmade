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
      label: '構想デモ・架空データ', tryLabel: '試す', uiNote: '',
      demos: [
        {id: 'reschedule', kind: '言い直し', title: '「やっぱり、明日にして。」', body: '話しながら言い直しても、反映するのは確かめてから。',
          scene: [['task', 'メール返信', '今日'], ['task', '資料確認', '今日'], ['say', '資料確認は今日中に。メール返信は明日に。'], ['card', '確認待ちの変更案', 'メール返信　今日 → 明日', '「メール返信は明日に」', 'この変更を反映'], ['done', 'メール返信', '明日 · 延期']]},
        {id: 'calendar', kind: '会話から予定へ', title: '決まったことを、予定に。', body: '登録案を作り、承認したときだけ登録。招待やメールは送りません。',
          scene: [['task', '企画レビュー', '金曜 15:00'], ['say', 'これ、金曜の15時に入れておいて。'], ['card', '登録案（まだ送信しません）', '企画レビュー　金曜 15:00–15:30', '招待・メール：送りません', '承認して登録'], ['done', '企画レビュー', '登録を確認済み']]},
        {id: 'team', kind: 'チームで', title: '会議の決定を、チームのタスクに。', body: '発言の引用つきで候補に。担当と期限は、言われていなければ「不明」のまま。',
          scene: [['say', '見積もりは来週までに出しましょう。'], ['say', 'デザイン案はAとBで比べたいですね。'], ['card', 'タスク候補（未確認）', '見積もりを出す　期限：来週 · 担当：不明', '「見積もりは来週までに」', '確認して共有'], ['done', '見積もりを出す', 'チームで共有 · 担当は未定']]}
      ],
      mechKicker: 'しくみ', mechTitle: '原文が、根拠になる。', mechLead: '推測では足さない。あなたの言葉を引用した変更案だけを、確かめてから残します。',
      mech: [['話す', 'いつもの言葉で'], ['引用する', '発言の原文をそのまま'], ['保留する', 'まだ反映していません'], ['確かめる', '反映か、取り消すか'], ['次回へ', '決まったことだけ']]
    },
    en: {
      kicker: 'Concept demos by use', title: 'Talk it through.<br>Keep only what was decided.', lead: 'Changing your mind, booking it, or deciding as a team: it is kept only after you confirm.',
      label: 'Concept demo · fictional data', tryLabel: 'Try it', uiNote: 'The demos run in Japanese.',
      demos: [
        {id: 'reschedule', kind: 'Changing your mind', title: '“Actually, make it tomorrow.”', body: 'Rephrase as you talk; nothing changes until you confirm.',
          scene: [['task', 'Reply to email', 'Today'], ['task', 'Review the deck', 'Today'], ['say', 'Review the deck today. Reply to the email tomorrow.'], ['card', 'Change waiting for you', 'Reply to email　today → tomorrow', '“reply to the email tomorrow”', 'Apply this change'], ['done', 'Reply to email', 'Tomorrow · postponed']]},
        {id: 'calendar', kind: 'From talk to calendar', title: 'Put what was decided on the calendar.', body: 'A draft first, booked only when you approve. No invitations or emails are sent.',
          scene: [['task', 'Plan review', 'Fri 15:00'], ['say', 'Put this in for Friday at three.'], ['card', 'Draft (not sent yet)', 'Plan review　Fri 15:00–15:30', 'Invitations and email: none', 'Approve and book'], ['done', 'Plan review', 'Booking confirmed']]},
        {id: 'team', kind: 'As a team', title: 'Turn a meeting’s decisions into team tasks.', body: 'Candidates carry the quote. Owner and due date stay “unknown” unless someone said them.',
          scene: [['say', 'Let’s send the estimate by next week.'], ['say', 'I’d like to compare designs A and B.'], ['card', 'Task candidate (unconfirmed)', 'Send the estimate　due next week · owner unknown', '“send the estimate by next week”', 'Confirm and share'], ['done', 'Send the estimate', 'Shared with the team · owner open']]}
      ],
      mechKicker: 'How it works', mechTitle: 'Your words are the evidence.', mechLead: 'Nothing is added by guessing. Only changes that quote you are kept, after you confirm.',
      mech: [['Talk', 'In your own words'], ['Quote', 'The exact words, kept'], ['Hold', 'Not applied yet'], ['Confirm', 'Apply or discard'], ['Next time', 'Only what was decided']]
    }
  }
});

function sceneHtml(scene) {
  return scene.map(([kind, a, b, c, d], i) => {
    const step = ` vp-step vp-step--${i + 1}`;
    if (kind === 'task') return `<li class="vp-row vp-row--task${step}"><span class="vp-check" aria-hidden="true"></span><span>${esc(a)}</span><small>${esc(b)}</small></li>`;
    if (kind === 'say') return `<li class="vp-row vp-row--say${step}"><span class="vp-mic" aria-hidden="true"></span><q>${esc(a)}</q></li>`;
    if (kind === 'card') return `<li class="vp-row vp-row--card${step}"><small>${esc(a)}</small><b>${esc(b)}</b><span>${esc(c)}</span><span class="vp-btn" aria-hidden="true">${esc(d)}</span></li>`;
    return `<li class="vp-row vp-row--done${step}"><span class="vp-check is-on" aria-hidden="true"></span><span>${esc(a)}</span><small>${esc(b)}</small></li>`;
  }).join('');
}

export function visionSections(p, lang) {
  const v = VISION[p.id];
  if (!v) return '';
  const t = v[lang];
  if (!t || t.demos.length !== 3 || t.mech.length !== 5) throw new Error(`Vision sections: incomplete ${p.id}/${lang}`);
  const demos = t.demos.map((d, i) => `<article class="vp-demo" aria-labelledby="vp-demo-${esc(d.id)}"><div class="vp-demo-copy"><p class="vp-index">0${i + 1} / ${esc(d.kind)}</p><h3 id="vp-demo-${esc(d.id)}">${esc(d.title)}</h3><p>${esc(d.body)}</p><a class="vp-try" href="${esc(v.demo)}?flow=${esc(d.id)}">${esc(t.tryLabel)} <span aria-hidden="true">↗</span></a></div><figure class="vp-screen" data-vp-scene><p class="vp-screen-bar"><span>${esc(p.name)}</span><span>${esc(t.label)}</span></p><ol class="vp-rows">${sceneHtml(d.scene)}</ol></figure></article>`).join('');
  const mech = t.mech.map(([k, b], i) => `<li class="vp-node vp-node--${i + 1}"><span class="vp-node-n">0${i + 1}</span><b>${esc(k)}</b><span>${esc(b)}</span></li>`).join('');
  return `<section class="vp-demos" id="concept-demos" aria-labelledby="vp-demos-title"><div class="vp-head"><div><p class="rd-kicker">${esc(t.kicker)}</p><h2 id="vp-demos-title">${t.title}</h2></div><p>${esc(t.lead)}${t.uiNote ? ` ${esc(t.uiNote)}` : ''}</p></div><div class="vp-list">${demos}</div></section>`
    + `<section class="vp-mech" id="how" aria-labelledby="vp-mech-title"><div class="vp-head"><div><p class="rd-kicker">${esc(t.mechKicker)}</p><h2 id="vp-mech-title">${esc(t.mechTitle)}</h2></div><p>${esc(t.mechLead)}</p></div><ol class="vp-flow" data-vp-scene>${mech}</ol></section>`;
}
