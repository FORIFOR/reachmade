# Product design brief — Reachmade Lab（サイト本体）

対象はreachmade.comの公開サイト。各製品アプリのUIはそれぞれのリポジトリが正本で、ここでは扱わない。

| 項目 | 記入内容 |
|---|---|
| 製品 / 画面 | Reachmade Lab サイト（トップ、6製品ページ、企業向け支援、開発記録、ラボについて、相談、プライバシー） |
| 対象種別 | homepage |
| 対象ユーザー | ①自分の仕事に使えるAIの道具を探している実務者 ②企業でのAI実装・試作の相談先を探している担当者 |
| 利用者が完了したい1つの仕事 | 「6つのうち、自分の仕事に効くものがどれで、いま何ができて何ができないか」を、説明を読まずに実物から判断する |
| 初見で分かってほしいこと | 自主開発のAIプロダクトを作っているラボで、動く実物と検証記録を見せている、ということ |
| 最重要の操作と結果 | トップ → 製品を選ぶ → その製品の実録画・保存済み成果物・利用条件に到達する（`#explore` → 製品ページ → 実演 / コード / 検証資料） |
| 今回変えないもの | `src/products.mjs`の台帳内容、実録画・保存済み成果物、問い合わせ経路、Worker、日英2言語、CLAUDE.mdのhonesty invariants |
| 想定する画面幅・言語・入力方法 | 320 / 390 / 768 / 1024 / 1440 / 1920 CSS px、日本語と英語、マウス・キーボード・タッチ |
| 利用できる部品・トークン | `docs/design/tokens.md`。showcase層（トップ・製品ページ）とsite層（その他）の2系統がある |
| 説明なしでも理解できる入口 | ファーストビューの主操作1つ（「プロダクトを選ぶ」）と、その場で動く実物 |
| この製品らしい表現1つ | **主張のすぐ下に証拠を置く**。再現UIの直後に実アプリの録画と保存済み成果物を並べ、どちらがどちらかを画面上で明言する |
| 今回採用しない表現と理由 | 顧客ロゴ列・利用者数・性能比較（検証していない）／ 意味のない発光と紫グラデーション（DESIGN.mdの方針）／ スクロールの乗っ取り（読み手から制御を奪う） |
| 承認済み / 提案段階 | トップ右側は目的別の静的ナビへ変更。旧シグネチャー案は下記の履歴を参照。利用者テストは未実施 |

## 参照するもの

同じ役割の画面を選ぶ。サイトの広告ヒーローとアプリの操作画面を直接比較しない。
取得日・URL・viewport・状態は `references/README.md` に記録する。

## 現在の構成（2026-09-19時点の実装）

トップは次の順で読ませる。順序は `tests/site.test.mjs` が固定している。

1. ファーストビュー：主張 + 主操作 + 3つの目的から製品を選ぶ静的ナビ
2. 実録画と保存済み成果物（実アプリの公開実演であることを明記）
3. マーキー（6製品の入力 → 成果物）
4. Product Lab（6製品の切り替えと実画面）
5. 製品カード6枚
6. 入手方法の一覧（状態・ライセンス・入口）
7. 検証への導線（濃色帯）
8. よくある質問
9. 相談のCTA
10. 4列フッター

## 初期案の履歴（後述の静的ナビ案に置換済み）

主要画面を新規設計する場合だけ、情報構造の違う案を2〜3つ比較する。色替えは別案に数えない。

- A（2026-09-19採用）: 主張を左、シグネチャーシーンを右。証拠は直下に全幅で置く。
- B（不採用）: ファーストビューを実録画だけにする。→ 静止ポスターのままでは製品が「動く」ことが伝わらない。
- 選定: 主張 → 証拠の順が、この製品の差別化（確かめられること）とそのまま一致するため。人間の承認は未取得。

## 2026-09-19 OSS first-success follow-up

The site-level discovery task above remains. The bounded implementation slice is
now the existing guided sample: manually edit its example, review, export Markdown
and reopen it. Acceptance O1–O10 is fixed in acceptance.md. Preserve the existing
layout and evidence links; no visual redesign was selected. The only inquiry change
is honest unknown-result recovery, without changing endpoint or sending data.

Kit v2 refinement retains the existing composition. The real editable draft owns the guided mode; the separate illustrative app surface is hidden in that mode. Source-example practice is explicitly optional. Reading/cancel/error states reuse native controls and existing colors. This is a component refinement, so alternate full-screen designs and unrelated landing-page references are not added.

## 2026-09-19 — ホームの製品使い分け説明

「ONE JOB. SIX TOOLS.」を、実際に紹介する3製品に合わせて「3つの道具の使い分け例」へ変更。
6行は製品数ではなく説明の場面なので、日本語版の行頭は番号から役割ラベルへ変更した。
AI Meetingは整理、Agent Teamは制作、Launchloomは紹介素材作成として具体的に説明する。
最後の行は実行済みの成果ではなく目指す成果。各製品に準備・操作が必要な点を明記する。
日英とも同じ範囲で修正し、アニメーションの状態数・製品リンク・既存のユーザー編集CSSは保つ。

## 2026-09-19 — Task navigation replaces the rejected narrative panel

User screenshot rejects the dark, tall six-step story despite clearer copy. Design owner:
world-class-ui with outcome-first-ux; frontend-design is not installed and not claimed.
Two actual-content prototypes: A, compact task navigation beside the existing claim;
B, full-width three-column task shelf below the claim. A is selected by the implementer
because each task, outcome and product fits in one scan, while keeping the existing
primary entry visible. B adds another full-width band before the existing product lab.
This is a local design decision, not user approval of visual quality.

A uses a pale sage surface, three flat linked rows, 18–22px task titles, 13px outcome and
product labels, and 12px auxiliary text. Small line icons distinguish conversation,
teamwork and promotion. Each complete row is a real localized link. No timer, simulated
processing, pause control, connecting pipeline, backdrop grid or glow. The old scene
module remains compatible for existing consumers/tests but is not mounted on the home.
The original CSS/client files with pre-existing user edits remain unchanged.

## 2026-09-22 — ObsidianUIを参照した編集的な通し調整

ユーザー指示は「https://www.obsidianui.dev を参考にUIを作る」「対象はトップ全体」「配色方針は実装者判断」。
情報の順序（`tests/site.test.mjs`が固定）と製品台帳は変更しない前提で、構成と型階層だけを採り入れた。

ヒーローで構成の異なる2案を実装・撮影して比較した（色替えは案に数えていない）:

- **A（不採用）**: 参照に忠実。主張が幅を占め、補足・主操作・タスク3行を右の細い列に積む。
  h1は92pxまで出せるが、左下に約200pxの空白が残り、「いま、何をしたい？」の見出しが消えて
  操作が5つ縦に並ぶだけになる。
- **B（採用）**: 2026-09-19に決めた「主張の横にタスクナビ」を保ち、参照の工芸を載せる。
  空白がなく、成果起点の問いが残る。h1は80px。
- 選定理由: 参照から得られるのは情報構造ではなく工芸（型の大きさ、事実ピル、ドットメタ、
  丸い→、大きな見出し）であり、Bはそれを全部載せたまま既存の判断を壊さない。
  **実装者判断であり、人間の承認は未取得。**

配色は実装者判断で現行維持（暖色ペーパー `#f5f4ef`、深緑 `#294536`）。理由: このサイトの
差別化は「確かめられること」であり、寒色グレーと黒CTAへの全面変更は `docs/DESIGN.md` と
`tokens.md` の書き換えを伴う実質のブランド変更になる。角丸は事実ピル1箇所に限定した。

不採用にしたもの: 利用者の声カード群（未測定の利用者評価はhonesty invariant違反）、
製品カードの角丸化（`outcome-first.css`が意図的に`border-radius:0`）、発光グラデーション、
巨大ゴーストワードマーク（3配置を撮って確認したが、ヒーロー下端が空いていないと成立しない）。
採否の全一覧は `docs/design/references/README.md` に記録した。
