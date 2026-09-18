/** Reachmade UI stories. Fictional, deterministic data; never calls a model or a product API. */
export const DEMO_VERSION = '20260919-ui-stories-2';
export const DURATION = 18000;
export const CUES = Object.freeze([0, 2600, 6000, 9600, 13600]);
export const PRODUCTS = Object.freeze(['genie','ai-meeting','oathra','aisecure','agent-team','launchloom']);
const names = ['Genie','AI Meeting','Oathra','AI Secure','Agent Team','Launchloom'];
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function phaseAt(time) {
  if (!Number.isFinite(time)) return 0;
  return CUES.reduce((phase, cue, index) => time >= cue ? index : phase, 0);
}
export function demoCopy(id, lang = 'ja') {
  if (!PRODUCTS.includes(id) || !['ja','en'].includes(lang)) throw new TypeError('Unknown demo product or locale');
  const ja = lang === 'ja';
  const data = {
    genie: ja ? ['メモから、使える下書きへ。','このメモから、LPの下書きを作って。',['メモを渡す','依頼する','構成を作る','下書きを見る','成果物を残す'],'説明用の再現UIです。実際の利用にはMac・ローカルサービス・モデルの設定が必要です。'] : ['A note becomes a useful draft.','Turn these notes into a landing-page draft.',['Add notes','Send request','Structure','Review draft','Keep artifact'],'Illustrative UI. Actual use requires a Mac, local services and a configured model.'],
    'ai-meeting': ja ? ['話したことを、次の行動に。','料金案を3つ比較するタスクを追加して。',['話す','文字にする','整理する','変更を確認','タスクを残す'],'説明用の再現UIです。音声を録音・送信せず、タスクも実際には保存しません。'] : ['Think out loud. Keep the next step.','Add a task to compare three pricing options.',['Speak','Transcribe','Organize','Confirm change','Keep task'],'Illustrative UI. No microphone recording, audio transmission or real task storage.'],
    oathra: ja ? ['結果から、相手の発言まで。','金曜日の14時に予約をお願いします。',['依頼を見る','会話を見る','発言を拾う','根拠を照合','未確認を分ける'],'サンプル会話の説明です。実電話を発信せず、店舗システムへの登録も行いません。'] : ['A result with a traceable source.','Please book Friday at 14:00.',['Read request','Read exchange','Extract words','Match evidence','Separate unknowns'],'A fictional conversation. No live call or external booking is made.'],
    aisecure: ja ? ['ログを、調べられる一件に。','この3件のログを、一つのケースとして調査。',['ログを選ぶ','観測する','関連づける','仮説を分ける','不明点を残す'],'合成ログによる説明です。実環境の監視・遮断や安全性の保証ではありません。'] : ['Scattered logs. One reviewable case.','Investigate these three log entries together.',['Select logs','Observe','Correlate','Form hypothesis','Keep unknowns'],'Synthetic logs only. Not live monitoring, enforcement or a safety guarantee.'],
    'agent-team': ja ? ['一人で作らない。途中も残す。','新機能の発表文を作り、レビューして。',['依頼する','下書きを作る','レビューする','修正する','未完了も残す'],'説明用の再現UIと架空の作業記録です。実モデルの実行記録は実録画・製品ページで確認できます。'] : ['Shared work. A visible trail.','Draft and review a new-feature announcement.',['Request','Draft','Review','Revise','Keep open items'],'Illustrative UI and fictional work trail. See the recording and product page for real-model evidence.'],
    launchloom: ja ? ['ひとつの録画から、届ける素材へ。','この録画から、公開前の素材セットを作る。',['録画を入れる','構成を選ぶ','用途別に作る','素材を確認','公開前に止める'],'説明用の再現UIです。動画を生成・アップロードせず、SNSにも実投稿しません。'] : ['One recording. A launch kit.','Make a pre-publish launch kit from this recording.',['Add recording','Choose story','Adapt formats','Review assets','Stop before publishing'],'Illustrative UI. No video generation, upload or real social publishing.']
  };
  const [title, prompt, steps, scope] = data[id];
  return {name:names[PRODUCTS.indexOf(id)], title, prompt, steps, scope};
}
const icon = kind => {
  const paths = {
    spark:'M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z',
    mic:'M9 6a3 3 0 016 0v6a3 3 0 01-6 0z M5 11v1a7 7 0 0014 0v-1 M12 19v3 M8 22h8',
    call:'M7 3H4a1 1 0 00-1 1c0 9.4 7.6 17 17 17a1 1 0 001-1v-3l-5-2-2 2a14 14 0 01-7-7l2-2z',
    shield:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
    team:'M4 19v-2a4 4 0 014-4h2a4 4 0 014 4v2 M6 7a3 3 0 106 0 3 3 0 00-6 0 M16 4a3 3 0 010 6 M17 13a4 4 0 014 4v2',
    film:'M3 5h18v14H3z M7 5v14 M17 5v14 M3 9h4 M3 15h4 M17 9h4 M17 15h4',
    check:'M5 12l4 4L19 6',arrow:'M5 12h14 M13 6l6 6-6 6',pause:'M9 5v14 M15 5v14',play:'M8 5l11 7-11 7z',replay:'M5 8H1V4 M2 8a10 10 0 111 10'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[kind] || paths.spark}"/></svg>`;
};
const reveal = (phase, html, cls = '') => `<div class="rm-reveal ${cls}" data-reveal="${phase}">${html}</div>`;
const avatar = (role, label) => `<span class="rm-avatar rm-avatar--${role}" aria-label="${esc(label)}"><i></i><i></i></span>`;
export function renderStory(id, lang = 'ja') {
  const c = demoCopy(id, lang), ja = lang === 'ja', t = (a,b) => ja ? a : b;
  const badge = text => `<span class="rm-badge">${esc(text)}</span>`;
  const input = `<div class="rm-input"><span data-typewriter>${esc(c.prompt)}</span><span class="rm-send">${icon('arrow')}</span></div>`;
  const note = text => `<p class="rm-small">${esc(text)}</p>`;
  let body;
  if (id === 'genie') body = `<div class="rm-workspace"><aside class="rm-sidebar"><b>Genie</b><span class="rm-selected">${icon('spark')}${t('ワークスペース','Workspace')}</span><span>${t('ライブラリ','Library')}</span><span>${t('プラグイン','Plugins')}</span><small>LOCAL WORKSPACE</small></aside><div class="rm-desk"><p class="rm-eyebrow">${t('新しいタスク','NEW TASK')}</p>${input}${reveal(1,`<p class="rm-message">${t('メモを読み込み、構成を整理します。','Reading the notes and organizing the page.')}</p>`)}${reveal(2,`<div class="rm-task-row">${icon('check')} ${t('見出し・機能・次のアクション','Headline · features · next action')} ${badge('3 / 3')}</div>`)}${reveal(3,`<div class="rm-document"><div class="rm-document-bar"><span>landing-page.md</span>${badge(t('下書き','DRAFT'))}</div><h4>${t('考えを、かたちに。','Make room for your ideas.')}</h4><p>${t('あなたのメモから、次の仕事を始める。','Start your next piece of work from a simple note.')}</p><div class="rm-paper-lines"><i></i><i></i></div></div>`)}${reveal(4,`<div class="rm-result">${icon('check')} ${t('成果物を開く','Open artifact')}<span>Markdown ↗</span></div>`)}</div></div>`;
  if (id === 'ai-meeting') body = `<div class="rm-meeting"><div class="rm-voice-panel"><span class="rm-eyebrow">AI MEETING</span><div class="rm-mic">${icon('mic')}</div><div class="rm-wave" aria-hidden="true">${'<i></i>'.repeat(25)}</div><p>${t('話す、考える、整理する。','Speak. Think. Organize.')}</p><small>${t('音声の動きを再現したデモ','SIMULATED VOICE ACTIVITY')}</small></div><div class="rm-conversation">${reveal(0,`<span class="rm-speaker">${t('あなた','YOU')}</span><div class="rm-bubble" data-typewriter>${esc(c.prompt)}</div>`)}${reveal(2,`<span class="rm-speaker">AI MEETING</span><div class="rm-bubble rm-bubble--ai">${t('「料金案を3つ比較」をタスクとして残しますか？','Save “Compare three pricing options” as a task?')}</div>`)}${reveal(3,`<div class="rm-confirm">${t('変更を確認（デモ）','Confirm change (demo)')}${icon('check')}</div>`)}${reveal(4,`<div class="rm-task-card">${icon('check')}<div><b>${t('料金案を3つ比較','Compare three pricing options')}</b><small>${t('確認済みタスクの表示例','Example of a confirmed task')}</small></div></div>`)}</div></div>`;
  if (id === 'oathra') body = `<div class="rm-evidence"><div class="rm-transcript"><div class="rm-call-head">${icon('call')}<div><b>${t('予約窓口','Reservation desk')}</b><small>${t('サンプル会話','SAMPLE TRANSCRIPT')}</small></div><span>00:24</span></div>${reveal(0,`<span class="rm-speaker">OATHRA</span><div class="rm-bubble" data-typewriter>${esc(c.prompt)}</div>`)}${reveal(1,`<span class="rm-speaker">${t('相手の発言 · 00:18','OTHER PARTY · 00:18')}</span><blockquote>${t('はい、<mark>金曜日の14時</mark>ですね。お待ちしています。','Yes, <mark>Friday at 14:00</mark>. We will see you then.')}</blockquote>`)}${reveal(2,note(t('ハイライト箇所が判定の根拠です。','Highlighted words support the claim.')))}</div><div class="rm-proof"><p class="rm-eyebrow">EVIDENCE CHECK</p><h4>${t('発言と、結果を照合。','Match the words to the result.')}</h4>${reveal(2,`<dl><div><dt>${t('日時','WHEN')}</dt><dd>${t('金曜 14:00','Friday 14:00')}</dd></div><div><dt>${t('根拠','SOURCE')}</dt><dd>${t('相手の発言 00:18','Other party 00:18')}</dd></div></dl>`)}${reveal(3,`<div class="rm-result">${icon('check')}${t('発言の一致を確認','Spoken agreement matched')}</div>`)}${reveal(4,`<div class="rm-open-item"><b>${t('外部システムへの登録：未確認','External booking: unverified')}</b><p>${t('会話の合意 ≠ 店舗への登録','Spoken agreement ≠ a system record')}</p></div>`)}</div></div>`;
  if (id === 'aisecure') body = `<div class="rm-investigation"><div class="rm-log-pane"><p class="rm-eyebrow">SYNTHETIC LOGS / CASE 018</p><h4>${t('3件の兆候。ひとつの調査。','Three signals. One investigation.')}</h4>${[['09:41','EXPOSURE',t('公開状態の変更','Exposure changed')],['09:42','IDENTITY',t('特権ログイン','Privileged sign-in')],['09:43','ACCESS',t('ファイルアクセス','File accessed')]].map((a,i)=>reveal(i,`<div class="rm-log"><time>${a[0]}</time><div><small>${a[1]}</small><b>${a[2]}</b></div><span>0${i+1}</span></div>`)).join('')}<div class="rm-log-footer">${icon('shield')}${t('スナップショット分析','SNAPSHOT ANALYSIS')}</div></div><div class="rm-case"><p class="rm-eyebrow">${t('調査の整理','CASE NOTES')}</p>${reveal(2,`<div class="rm-finding"><small>${t('観測した事実','OBSERVED')}</small><b>${t('同じ主体の操作が連続','Related activity by one actor')}</b><p>${t('3件のログを関連づけ','Three related log entries')}</p></div>`)}${reveal(3,`<div class="rm-finding"><small>${t('仮説 · 未確定','HYPOTHESIS · UNCONFIRMED')}</small><b>${t('権限の不適切な利用の可能性','Possible misuse of privilege')}</b></div>`)}${reveal(4,`<div class="rm-open-item"><small>${t('まだ分からないこと','UNKNOWN')}</small><b>${t('正当な業務かを確認する','Was this authorized work?')}</b><p>${t('追加の確認が必要','Further review required')}</p></div>`)}</div></div>`;
  if (id === 'agent-team') body = `<div class="rm-team"><div class="rm-team-roster">${[['writer',t('つくる','Writer')],['reviewer',t('たしかめる','Reviewer')],['editor',t('なおす','Editor')]].map(([role,label],i)=>`<div class="rm-bot" data-bot="${i}">${avatar(role,label)}<b>${label}</b><small>${['DRAFT','REVIEW','REVISE'][i]}</small></div>`).join('')}</div><div class="rm-thread">${reveal(0,`<div class="rm-team-request" data-typewriter>${esc(c.prompt)}</div>`)}${reveal(1,`<div class="rm-thread-row">${avatar('writer','Writer')}<div><small>WRITER · V1</small><p>${t('見出しと紹介文の下書きを作成。','Headline and announcement drafted.')}</p></div></div>`)}${reveal(2,`<div class="rm-thread-row">${avatar('reviewer','Reviewer')}<div><small>REVIEWER · 1 NOTE</small><p>${t('公開日が未確認です。断定を避けましょう。','The release date is unverified. Avoid stating it as fact.')}</p></div></div>`)}${reveal(3,`<div class="rm-thread-row">${avatar('editor','Editor')}<div><small>EDITOR · V2</small><p>${t('表現を修正。確認が必要な箇所も残しました。','Copy revised. Open verification is retained.')}</p></div></div>`)}${reveal(4,`<div class="rm-result">${icon('check')} announcement.md <span>${t('確認待ち 1件','1 open check')}</span></div>`)}</div></div>`;
  if (id === 'launchloom') body = `<div class="rm-launch"><div class="rm-cut"><div class="rm-cut-head"><span>product-demo.mp4</span>${badge(t('入力素材の例','SAMPLE SOURCE'))}</div><div class="rm-cut-preview"><span class="rm-eyebrow">YOUR NEXT LAUNCH</span><h4>${t('つくった。その次へ。','Made it. Now show it.')}</h4><div class="rm-mini-window"><i></i><i></i><i></i><div></div></div></div><div class="rm-timeline"><div class="rm-time-label"><span>00:00</span><span>00:18</span></div><div class="rm-clips"><span>01</span><span>02</span><span>03</span><i data-playhead></i></div></div></div><div class="rm-export"><p class="rm-eyebrow">LAUNCH KIT</p>${reveal(1,`<div class="rm-export-file"><b>16:9</b><div>${t('横動画','Landscape film')}<small>product-film.mp4</small></div>${icon('check')}</div>`)}${reveal(2,`<div class="rm-export-file"><b>9:16</b><div>${t('縦動画','Vertical film')}<small>product-short.mp4</small></div>${icon('check')}</div>`)}${reveal(3,`<div class="rm-export-file"><b>WEB</b><div>${t('LP・SNS投稿案','LP · social drafts')}<small>launch-kit/</small></div>${icon('check')}</div>`)}${reveal(4,`<div class="rm-open-item"><b>${t('公開前の確認待ち','Ready for pre-publish review')}</b><p>${t('SNSには投稿されません','Nothing is published to social accounts')}</p></div>`)}</div></div>`;
  return `<div class="rm-app" data-product="${id}"><div class="rm-app-bar"><span class="rm-window-dots" aria-hidden="true"><i></i><i></i><i></i></span><b>${esc(c.name)}</b><span>${t('操作の説明','UI STORY')}</span></div><div class="rm-scene" aria-hidden="true">${body}</div></div>`;
}
/** One clock per mounted player. User pause is independent from visibility and motion preferences. */
export function mountDemo(figure, initialId, lang = 'ja') {
  if (!PRODUCTS.includes(initialId) || figure.dataset.demoVersion) return null;
  const screen = figure.querySelector('.studio-player-screen, .owned-film__screen');
  if (!screen) return null;
  const doc = figure.ownerDocument, win = doc.defaultView, ja = lang === 'ja';
  const t = (a,b) => ja ? a : b;
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = win.navigator.connection;
  const abort = new win.AbortController();
  const on = (node,event,fn) => node?.addEventListener(event,fn,{signal:abort.signal});
  let id = initialId, copy, elapsed = 0, previous = null, raf = 0, phase = -1;
  let visible = !('IntersectionObserver' in win), paused = false, mode = 'story', dead = false, pageHidden = false;
  let userPlay = false;
  const toolbar = doc.createElement('div'); toolbar.className = 'rm-demo-toolbar';
  toolbar.innerHTML = `<div class="rm-demo-modes" role="group" aria-label="${t('デモの種類','Demo type')}"><button type="button" data-mode="story" aria-pressed="true">${t('動きで見る','UI story')}</button><button type="button" data-mode="recording" aria-pressed="false">${t('実録画を見る','Real recording')}</button></div><span>PRODUCT DEMO</span>`;
  const root = doc.createElement('div'); root.className = 'rm-live-demo'; root.setAttribute('role','region');
  root.innerHTML = `<div class="rm-demo-visual"></div><div class="rm-demo-controls"><button type="button" data-action="pause"></button><button type="button" data-action="restart" aria-label="${t('最初から見る','Restart story')}">${icon('replay')}</button><label class="rm-demo-scrub"><span class="rm-sr">${t('再生位置','Playback position')}</span><input type="range" min="0" max="18000" step="100" value="0"></label><output>00:00 / 00:18</output></div><div class="rm-chapters" role="group" aria-label="${t('場面を選ぶ','Choose a scene')}"></div><p class="rm-demo-summary"></p><p class="rm-demo-disclosure"></p>`;
  figure.insertBefore(toolbar, screen); screen.append(root);
  figure.classList.add('rm-demo-host'); figure.dataset.demoVersion = DEMO_VERSION;
  const visual = root.querySelector('.rm-demo-visual'), pause = root.querySelector('[data-action=pause]'), range = root.querySelector('input'), output = root.querySelector('output');
  const chapters = root.querySelector('.rm-chapters');
  const video = screen.querySelector('video');
  const reduced = () => motion.matches || (connection?.saveData && !userPlay);
  const allowed = () => !dead && !pageHidden && visible && !doc.hidden && !paused && mode === 'story' && !reduced();
  function stop() { if (raf) win.cancelAnimationFrame(raf); raf = 0; previous = null; root.dataset.running = 'false'; }
  function controls() {
    const active = allowed();
    pause.innerHTML = icon(active ? 'pause' : 'play');
    pause.setAttribute('aria-label', motion.matches ? t('動きを減らす設定：場面ボタンで操作','Reduced motion: use scene buttons') : active ? t('アニメーションを一時停止','Pause animation') : t('アニメーションを再生','Play animation'));
    pause.disabled = motion.matches;
    pause.setAttribute('aria-pressed', String(paused));
    root.dataset.running = String(active);
  }
  function draw() {
    const next = phaseAt(elapsed);
    if (next !== phase) {
      phase = next; root.dataset.phase = String(phase);
      root.querySelectorAll('[data-reveal]').forEach(node => { node.dataset.shown = String(Number(node.dataset.reveal) <= phase); });
      chapters.querySelectorAll('button').forEach((button,i) => button.setAttribute('aria-pressed',String(i === phase)));
      root.querySelector('.rm-demo-summary').textContent = `${phase + 1} / 5 — ${copy.steps[phase]}`;
    }
    const count = phase === 0 && !reduced() ? Math.floor(Array.from(copy.prompt).length * Math.min(1, elapsed / 1850)) : Array.from(copy.prompt).length;
    const typed = Array.from(copy.prompt).slice(0,count).join('');
    root.querySelectorAll('[data-typewriter]').forEach(node => { if (node.textContent !== typed) node.textContent = typed; });
    range.value = String(Math.round(elapsed));
    output.textContent = `00:${String(Math.floor(elapsed / 1000)).padStart(2,'0')} / 00:18`;
    const head = root.querySelector('[data-playhead]'); if (head) head.style.left = `${Math.min(99,elapsed/DURATION*100)}%`;
  }
  function frame(now) {
    raf = 0;
    if (!allowed()) { if (reduced()) { elapsed = CUES[4]; phase = -1; draw(); } stop(); controls(); return; }
    if (previous !== null) elapsed = (elapsed + Math.min(100, Math.max(0, now - previous))) % DURATION;
    previous = now; draw(); raf = win.requestAnimationFrame(frame);
  }
  function reconcile() { stop(); controls(); if (allowed()) raf = win.requestAnimationFrame(frame); }
  function setMode(value) {
    mode = value === 'recording' ? 'recording' : 'story';
    figure.dataset.demoMode = mode; root.hidden = mode !== 'story';
    toolbar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.mode === mode)));
    if (mode === 'story') video?.pause();
    reconcile();
  }
  function setProduct(nextId) {
    if (!PRODUCTS.includes(nextId)) return;
    stop(); id = nextId; copy = demoCopy(id,lang); phase = -1;
    elapsed = reduced() ? CUES[4] : 0;
    root.setAttribute('aria-label',`${copy.name} — ${copy.title}`);
    visual.innerHTML = renderStory(id,lang);
    chapters.innerHTML = copy.steps.map((label,i) => `<button type="button" data-cue="${i}" aria-pressed="false"><span>0${i+1}</span>${esc(label)}</button>`).join('');
    root.querySelector('.rm-demo-disclosure').textContent = `${t('説明用の再現UI・サンプルデータ。実行速度を示すものではありません。','Illustrative UI · fictional data. Timing is not product performance.')} ${copy.scope}`;
    draw(); setMode('story');
  }
  on(toolbar,'click',event => { const b = event.target.closest('button[data-mode]'); if (b) setMode(b.dataset.mode); });
  on(pause,'click',() => { paused = allowed(); userPlay = !paused; reconcile(); });
  on(root.querySelector('[data-action=restart]'),'click',() => { elapsed = 0; phase = -1; draw(); reconcile(); });
  on(chapters,'click',event => { const b = event.target.closest('button[data-cue]'); if (!b) return; elapsed = CUES[Number(b.dataset.cue)]; paused = true; draw(); reconcile(); });
  on(range,'input',() => { elapsed = Math.max(0,Math.min(DURATION,Number(range.value) || 0)); paused = true; draw(); reconcile(); });
  on(motion,'change',() => { if (reduced()) { elapsed = CUES[4]; phase = -1; draw(); } reconcile(); });
  on(connection,'change',() => { if (reduced()) { elapsed = CUES[4]; draw(); } reconcile(); });
  on(doc,'visibilitychange',reconcile);
  on(win,'pagehide',() => { pageHidden = true; reconcile(); });
  on(win,'pageshow',() => { pageHidden = false; reconcile(); });
  const observer = 'IntersectionObserver' in win ? new win.IntersectionObserver(entries => { visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .2; reconcile(); },{threshold:[0,.2]}) : null;
  observer?.observe(screen);
  const workbench = figure.closest('.studio-workbench');
  const mutation = workbench ? new win.MutationObserver(() => { if (workbench.dataset.product !== id) setProduct(workbench.dataset.product); }) : null;
  mutation?.observe(workbench,{attributes:true,attributeFilter:['data-product']});
  setProduct(initialId);
  return {
    setProduct,
    destroy() { dead = true; stop(); abort.abort(); observer?.disconnect(); mutation?.disconnect(); toolbar.remove(); root.remove(); figure.classList.remove('rm-demo-host'); delete figure.dataset.demoVersion; delete figure.dataset.demoMode; },
    state: () => ({id,phase,elapsed,paused,mode,running:allowed()})
  };
}
export function initDemos(doc = document) {
  const lang = doc.documentElement.lang.startsWith('ja') ? 'ja' : 'en';
  const players = [];
  for (const figure of doc.querySelectorAll('.studio-player, .owned-film')) {
    const id = figure.closest('.studio-workbench')?.dataset.product || doc.body.dataset.productId;
    if (!PRODUCTS.includes(id)) continue;
    const player = mountDemo(figure,id,lang); if (player) players.push(player);
  }
  return players;
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',() => initDemos(),{once:true});
  else initDemos();
}
