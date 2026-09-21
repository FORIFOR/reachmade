# UI acceptance criteria

## Kit v2 follow-up — conditions fixed before additional implementation

Same primary task and O1–O10 below. Scope is recovery and integration, with a
small refinement of existing sample controls; no homepage redesign.

| ID | Expected outcome / environment | Method / evidence |
|---|---|---|
| K1 | Local Codex project: five kit Skills installed byte-for-byte without overwriting existing instructions | bundled checksums, validator, installer dry-run/apply; `artifacts/ui/oss-v2/` |
| K2 | Core + browser: malformed UTF-8 file is rejected without replacing the current text | corrupt byte fixture; strict decoder contract test and live file import |
| K3 | Browser JA/EN: pending file read is visible; cancel/new typing/mode switch invalidate the read; Next cannot confirm old text while reading | controlled delayed File read, state assertion and screenshots; cancel only stops applying local content |
| K4 | Node: export requires a complete validated document; a frozen v1 fixture remains readable and byte-identical when exported | immutable historical fixture and negative tests, not only writer-reader round trips |
| K5 | Fresh temporary directory: documented two-core-file integration example executes without repository UI/assets/npm packages | clean integration test with network failure guard; stdout and exit code |
| K6 | Read-only fresh agent: discover task without route/selector coaching before source review | installed independent-product-verification Pass A log; AI exploration, not human usability |

Existing manual/device BLOCKED conditions remain. Do not relax them to obtain a
gate receipt. Any new visual verdict is limited to modified controls and states.

## OSS / first successful sample — fixed 2026-09-19 before implementation

Scope: this repository is a product evaluation website, not the six applications.
Primary task: open the Genie guided sample, edit its sample draft, review it,
export Markdown, and recover the draft from that local file. Input is fictional
editable text; output is a labelled evaluation sample, never a new AI result.
Existing criteria below remain in force. No benchmark superiority is claimed.

| ID | Environment / expected result | Verification / evidence |
|---|---|---|
| O1 | Node >=22, no npm dependencies or API keys: build and all tests succeed | `npm run check`; command, exit code, environment in `artifacts/ui/oss/` |
| O2 | Local Chrome, JA/EN, home → Genie sample: result and first action are explained; editable sample is available before advancing | browser trace and first-step screenshots; at most 1 start action from the sample entry |
| O3 | Browser: edited Unicode text survives review, back, mode switch and export; cancelled import retains the draft | compare textarea, downloaded UTF-8 Markdown and restored textarea byte-for-byte after newline normalization; browser report + downloaded fixture |
| O4 | Empty / too-long / invalid import and failed download: no false success, actionable message, original text retained; valid input then succeeds | core negative tests and browser failure/recovery trace |
| O5 | 320/390/768/1024/1440/1920 CSS px, JA/EN: no horizontal overflow; keyboard reaches every sample action; focus remains visible after each step | browser metrics, keyboard actions, images; source revision / hashes |
| O6 | Browser: long Japanese text, composition events, reduced motion and 200% zoom retain content and usable controls | automated composition is distinct from real OS IME; actual IME/zoom or physical device unavailable → BLOCKED, never simulated PASS |
| O7 | Sample core: no DOM, network or storage on import; versioned input/output and errors; CLI/SDK example uses the same core as UI | import test, contract tests, executed `node examples/sample.mjs` + output |
| O8 | Inquiry: rejected/unknown result never says stored or safely deduplicated; no automatic retry; unknown outcome blocks another POST in this page | real browser with explicitly injected local responses and adapter unit tests; no production requests |
| O9 | Source license scope excludes brand/media/third-party material; README matches actual UI, data destinations, setup and limitations | LICENSE, NOTICE, CONTRIBUTING, SECURITY, compatibility/claim map review |
| O10 | Separate reviewer sees current images and reproduction evidence; no unresolved major defect in reviewed slice | independent review in `artifacts/ui/oss/`; human usability, comparative product run, native apps, actual backend persistence remain BLOCKED without access |

Comparison protocol: run the same edit → preview → export → reopen task in a
general Markdown editor (e.g. VS Code) using identical UTF-8 fixture text; count
actions, compare output and recover from invalid input. Its local editing and
save/reopen behavior is the reference, not its styling or AI capability. Until
both executions are recorded, comparative quality is BLOCKED. Acceptance numbers
are engineering targets, not observations or user research.

Statuses: PASS / FAIL / BLOCKED / NOT_APPLICABLE. Every report must identify base
revision plus dirty-source hashes, command, exit code, observed outcome and evidence.
Static JavaScript has no configured typechecker: report NOT_APPLICABLE separately
from syntax checks and behavioral tests. No permission to submit inquiries, publish,
deploy, fetch private data or start external AI work is implied by these checks.

以下は開始用の例。数値は比較結果ではなく、このプロジェクトで合意する基準として調整する。
「見た目の良さ」「壊れていないこと」「競合より優れていること」を別々に扱う。

## 1. Task / clarity
主要タスクを短いGiven/When/Thenで定義し、実際に操作するテストを用意する。
例: 初期状態→主ボタン→入力→実行→結果表示→やり直し。
APIエラー、権限拒否、二重操作、キャンセルのうち対象機能に関係するものをテストする。
CTAのクリック成功だけでなく、約束された結果が得られることを確認する。

## 2. Responsive / content
初期の検査幅例: 390px、768px、1440px。必要なら320 CSS pxのreflowも検査する。
各幅で主要情報が隠れず、意図しない横スクロールがないこと。
日本語の長い名前・見出し・改行、0件・1件・多数件をfixtureで確認する。
PCとスマホを同じレイアウトの縮小版にせず、主操作の配置を確認する。
対象がiPhoneの場合は実機Safariも別途確認する。

## 3. Accessibility
通常サイズの文字コントラストは原則4.5:1以上、大きい文字は3:1以上。
例外やUI部品の非テキストコントラストは、該当するWCAG要件に照らして確認する。
プロジェクト目標としてタッチターゲット44×44 CSS pxを推奨する。
これはWCAG 2.2 AAの最低値が常に44pxという意味ではない。
キーボードの主操作、focus表示、dialogのフォーカス管理を実操作で確認する。
axeの自動チェック0件だけで全面的な適合としない。

## 4. Visual direction
briefに沿った文字・余白・レイアウトの一貫性を画面として確認する。
視線がまず主操作または主要コンテンツへ向かうことを確認する。
装飾、影、色、アイコンを増やす前に、不要な情報を削る。
システムフォント、角丸、グラデーション等を一律禁止しない。用途で判断する。

## 5. Motion and responsiveness
押下の反応、loading、完了、エラーへの遷移を実画面で確認する。
アニメーション時間は採用トークンに合わせる。競合の計測値を捏造しない。
通常motionを確認し、別途reduced-motionが本質的でない動きを抑えることを確認する。
速度は実測した環境・方法・数値を記録する。未測定を高速と評価しない。

## 6. Completion
最新コードでtests・画像・独立レビューが揃っている。
未確認の項目をPASSに変えない。P0/P1が残れば未完了。
回帰比較の基準画像は人間の承認後に保存する。AIが勝手に更新しない。

---

## Reachmade固有の合格線（このリポジトリの実際の値）

上の一般論を、この製品の実装に合わせて具体化したもの。数値は比較結果ではなく合意した基準。

### 検査条件
- 幅: 320 / 390 / 768 / 1024 / 1440 / 1920 CSS px。
- 言語: 日本語と英語の両方。英語ページに日本語が残っていないかを画像で確認する。
- 状態: 既定、`prefers-reduced-motion: reduce`、JavaScript無効。
- 撮影: `npm run ui:capture`。条件は `artifacts/ui/capture.json` に残る。

### 構造の不変条件（`npm run check` が固定している）
- 1ページにつき `<h1>` 1つ、`<script>` 1本、stylesheet 1本。
- トップの並び: hero → 実録画 → `#explore` → 製品カード → `#access` → 検証帯 → `#faq` → CTA → footer。
- 内部リンクはすべて実在するページかフラグメントへ解決する。
- `target="_blank"` には `rel="noopener noreferrer"`。
- 意図しない横スクロールがない（`scrollWidth <= viewport`）。

### この製品固有の受け入れ条件
- **再現UIと証拠が画面上で区別できる。** 再現UIには必ず「再現UI・架空のデータ」の注記があり、
  実録画・保存済み成果物には出所が書かれている。
- 台帳（`src/products.mjs`）にない効能・実績・数値がページに現れない。
- JavaScript無効でも、シーンの全ステップとFAQの全回答が読める。
- `prefers-reduced-motion` で、シーンが最終状態の静止表示になる。マーキーが止まる。
- モバイル幅でヘッダーメニューが開閉し、Escapeで閉じてフォーカスが戻る。

### 完了の定義
最新コードで `npm run check` が通り、`npm run ui:capture` の画像が最新で、
独立レビューが `keep` または P0/P1 なしであること。どれか欠ければ**部分実装**と報告する。

### この環境で確認できないこと（毎回そのまま書く）
- **時間経過で進む演出**: ローカルのheadless Chromiumは `requestAnimationFrame` を進めないため、
  自走再生は観測できない。タイムライン計算はNodeテストで担保し、実ブラウザ挙動はCIに委ねる。
- 実機iPhone / Safari、VoiceOver、OSの文字サイズ変更、低電力モード。
- コントラスト比の実測（現状は目視のみ)。

## Hero task picker — 2026-09-19 redesign

The user rejected the dark six-step scene as hard to understand. Replace its homepage
presentation with three direct task-to-product links, preserving the other six-product
catalog and recorded evidence. This intentionally retires automatic hero sequencing;
timeline unit tests remain for the existing reusable scene module.

- JA/EN: exactly three visible task links, each names its product and outcome; all
  navigate to the matching localized product page without executing anything.
- No autoplay, pause control or numbered scene controls in this homepage picker.
- At 320/390/768/1024/1440/1920 CSS px: no horizontal overflow, no clipped text;
  task titles >=18px, supporting copy >=13px, full link targets >=44px.
- Keyboard: all three links focus visibly and Enter follows the focused destination;
  browser Back returns to the page. No custom script required, including reduced motion.
- Compare two real-content component layouts before choosing; inspect actual screenshots
  and request independent scoped review. Evidence: artifacts/ui/hero-redesign/.
