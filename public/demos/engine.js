// Shared engine for the product concept demos. Fictional data only: no microphone, model, storage or network.
// Each product page imports this with its own flows (wording taken from that product's own UI and README).
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const button = (label, cls, on) => { const b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', on); return b; };
const wait = ms => new Promise(r => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

export function run(config) {
  const $ = s => document.querySelector(s);
  let state;
  const flows = config.flows;
  function render() {
    const f = flows[state.flow];
    $('[data-rows-title]').textContent = f.title;
    const list = $('[data-list]'); list.replaceChildren();
    if (!state.rows.length) list.append(el('li', 'empty', config.empty));
    state.rows.forEach(([name, meta, st], i) => {
      const li = el('li', `task${state.changed.has(i) ? ' is-changed' : ''}`);
      li.append(el('span', 'dot'), el('span', 'name', name), el('span', 'when', meta), el('span', 'state', st || ''));
      list.append(li);
    });
  }
  function log(who, text) {
    const li = el('li', `msg msg--${who}`);
    li.append(el('span', 'who', config.who[who]), el('p', null, text));
    $('[data-log]').append(li);
  }
  async function act() {
    const f = flows[state.flow];
    $('[data-say]').replaceChildren();
    log('you', f.input);
    await wait(500);
    log('ai', f.reply);
    await wait(300);
    f.cards.forEach((c, i) => {
      const card = el('article', 'card');
      card.append(el('p', 'card-label', c.label), el('p', 'card-main', c.main));
      for (const line of c.lines || []) card.append(el('p', 'card-quote', line));
      const note = el('p', 'card-note', c.ask || config.ask); card.append(note);
      const actions = el('div', 'card-actions');
      actions.append(button(c.ok, 'primary', async () => {
        actions.replaceChildren();
        if (c.pending) { note.textContent = c.pending; await wait(900); }
        if (c.set) { state.rows[c.set[0]] = c.set[1]; state.changed.add(c.set[0]); }
        if (c.add) { state.rows.push(c.add); state.changed.add(state.rows.length - 1); }
        render();
        card.classList.add('is-done'); note.textContent = c.doneShort || config.doneShort;
        $('[data-status]').textContent = c.done;
      }), button(c.cancel || config.cancel, 'ghost', () => {
        actions.replaceChildren(); card.classList.add('is-dropped');
        note.textContent = c.cancelled || config.cancelled;
        $('[data-status]').textContent = config.cancelledShort;
      }));
      card.append(actions);
      $('[data-cards]').append(card);
      if (i === 0) actions.querySelector('button').focus();
    });
  }
  function start(flow) {
    const id = flows[flow] ? flow : Object.keys(flows)[0];
    state = {flow: id, rows: flows[id].rows.map(r => [...r]), changed: new Set()};
    document.querySelectorAll('[data-flow]').forEach(a => a.setAttribute('aria-current', String(a.dataset.flow === id)));
    $('[data-log]').replaceChildren(); $('[data-cards]').replaceChildren(); $('[data-status]').textContent = '';
    (flows[id].before || []).forEach(([who, text]) => log(who, text));
    render();
    const say = $('[data-say]'); say.replaceChildren();
    say.append(el('p', 'say-hint', config.hint), button(`${config.act}：「${flows[id].input}」`, 'primary speak', act));
  }
  document.querySelectorAll('[data-flow]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); history.replaceState(null, '', `?flow=${a.dataset.flow}`); start(a.dataset.flow);
  }));
  $('[data-reset]').addEventListener('click', () => start(state.flow));
  start(new URLSearchParams(location.search).get('flow'));
}
