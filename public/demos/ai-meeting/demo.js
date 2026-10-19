// AI Meeting concept demo. Fictional data; no microphone, model, storage or network. Wording follows the product's
// own UI (TaskList.tsx proposal card, CalendarActions.tsx states, MeetingMemory.ts candidates).
const $ = s => document.querySelector(s);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const button = (label, cls, on) => { const b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', on); return b; };
const wait = ms => new Promise(r => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

const FLOWS = {
  reschedule: {
    title: 'やること',
    tasks: [['メール返信', '今日', '未完了'], ['資料確認', '今日', '未完了']],
    say: 'メール返信は今日中に……いや、やっぱり明日にして。',
    reply: 'メール返信を明日に延期する変更案を作りました。まだ反映していません。',
    cards: [{label: '確認待ちの変更案', main: 'メール返信　今日 → 明日', quote: 'やっぱり明日にして', ok: 'この変更を反映',
      apply: list => list.map(t => t[0] === 'メール返信' ? ['メール返信', '明日', '延期'] : t), done: '反映しました。次に開いたときも、ここから続きます。'}]
  },
  calendar: {
    title: 'やること',
    tasks: [['企画レビュー', '日時は未定', '未完了']],
    say: 'これ、金曜の15時に入れておいて。',
    reply: '登録案を作りました。まだ送信しません。',
    cards: [{label: '登録案（まだ送信しません）', main: '企画レビュー　金曜 15:00–15:30', quote: '金曜の15時に入れておいて', extra: '招待・メール：送りません', ok: '承認して登録', pending: '実行中・未確認',
      apply: list => list.map(t => t[0] === '企画レビュー' ? ['企画レビュー', '金曜 15:00', '登録を確認済み'] : t), done: '登録を確認済み（模擬）。招待やメールは送っていません。'}]
  },
  team: {
    title: 'チームのタスク',
    tasks: [],
    meeting: ['見積もりは来週までに出しましょう。', 'デザイン案はAとBで比べたいですね。', 'じゃあ、今日はここまで。'],
    say: '会議の決定を、タスク候補にして。',
    reply: '発言から候補を2件作りました。担当と期限は、言われていなければ「不明」です。',
    cards: [
      {label: 'タスク候補（未確認）', main: '見積もりを出す　期限：来週 · 担当：不明', quote: '見積もりは来週までに出しましょう', ok: '確認して共有',
        apply: list => [...list, ['見積もりを出す', '来週', '担当：未定']], done: '共有しました。担当は、決まったら追記できます。'},
      {label: 'タスク候補（未確認）', main: 'デザイン案AとBを比べる　期限：不明 · 担当：不明', quote: 'デザイン案はAとBで比べたいですね', ok: '確認して共有',
        apply: list => [...list, ['デザイン案AとBを比べる', '期限なし', '担当：未定']], done: '共有しました。'}
    ]
  }
};

let state;
function render() {
  const f = FLOWS[state.flow];
  $('[data-tasks-title]').textContent = f.title;
  const list = $('[data-list]'); list.replaceChildren();
  if (!state.tasks.length) list.append(el('li', 'empty', 'まだありません'));
  for (const [name, when, st] of state.tasks) {
    const li = el('li', `task${st === '未完了' ? '' : ' is-changed'}`);
    li.append(el('span', 'dot'), el('span', 'name', name), el('span', 'when', when), el('span', 'state', st));
    list.append(li);
  }
}

function addLog(who, text) {
  const li = el('li', `msg msg--${who}`);
  li.append(el('span', 'who', who === 'you' ? 'あなた' : who === 'ai' ? 'AI Meeting' : '会議'), el('p', null, text));
  $('[data-log]').append(li);
}

async function speak() {
  const f = FLOWS[state.flow];
  $('[data-say]').replaceChildren();
  addLog('you', f.say);
  await wait(500);
  addLog('ai', f.reply);
  await wait(300);
  const cards = $('[data-cards]');
  f.cards.forEach((c, i) => {
    const card = el('article', 'card');
    card.append(el('p', 'card-label', c.label), el('p', 'card-main', c.main), el('p', 'card-quote', `「${c.quote}」`));
    if (c.extra) card.append(el('p', 'card-extra', c.extra));
    card.append(el('p', 'card-note', 'まだ反映していません。この内容でよいですか？'));
    const actions = el('div', 'card-actions');
    actions.append(button(c.ok, 'primary', async () => {
      actions.replaceChildren();
      if (c.pending) { card.querySelector('.card-note').textContent = c.pending; await wait(900); }
      state.tasks = c.apply(state.tasks); render();
      card.classList.add('is-done'); card.querySelector('.card-note').textContent = c.pending ? '登録済み（模擬）' : '反映済み';
      $('[data-status]').textContent = c.done;
    }), button('取り消す', 'ghost', () => {
      actions.replaceChildren(); card.classList.add('is-dropped');
      card.querySelector('.card-note').textContent = '取り消しました。やることは元のままです。';
      $('[data-status]').textContent = '取り消しました。';
    }));
    card.append(actions);
    cards.append(card);
    if (i === 0) actions.querySelector('button').focus();
  });
}

function start(flow) {
  const f = FLOWS[flow] ? flow : 'reschedule';
  state = {flow: f, tasks: FLOWS[f].tasks.map(t => [...t])};
  document.querySelectorAll('[data-flow]').forEach(a => a.setAttribute('aria-current', String(a.dataset.flow === f)));
  $('[data-log]').replaceChildren(); $('[data-cards]').replaceChildren(); $('[data-status]').textContent = '';
  (FLOWS[f].meeting || []).forEach(line => addLog('meeting', line));
  render();
  const say = $('[data-say]'); say.replaceChildren();
  say.append(el('p', 'say-hint', 'ボタンを押すと、この言葉を話したことにします。'), button(`話す：「${FLOWS[f].say}」`, 'primary speak', speak));
}

document.querySelectorAll('[data-flow]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); history.replaceState(null, '', `?flow=${a.dataset.flow}`); start(a.dataset.flow);
}));
$('[data-reset]').addEventListener('click', () => start(state.flow));
start(new URLSearchParams(location.search).get('flow'));
