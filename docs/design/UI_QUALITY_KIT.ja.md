# UI品質キットの導入記録（2026-09-19）

`claude-ui-quality-kit` をこのリポジトリへ統合した記録。目的は「画面を確認せずに完成扱いすること」を減らすこと。
UIが完成したという意味ではなく、VoiceOSを超えることを保証する設定でもない。

## 有効になっているもの

| 物 | 位置 | 状態 |
|---|---|---|
| プロジェクト規約 | `CLAUDE.md` | 新規作成（既存ファイルなし）。実コマンド・不変条件・honesty invariantsを記載 |
| UIルール（パス限定） | `.claude/rules/ui-quality.md` | このリポジトリの構成（`src/*.mjs` + 層状CSS）に合わせて書き換え |
| 実装スキル | `.claude/skills/ui-craft/SKILL.md` | キットのまま |
| レビュー手順 | `.claude/skills/ui-review/SKILL.md` | キットのまま |
| レビュアー | `.claude/agents/ui-reviewer.md` | キットのまま（Read/Glob/Grepのみ） |
| 設計契約 | `docs/design/brief.md` `acceptance.md` `tokens.md` | **このプロダクトの実際の内容で記入済み** |
| 参照記録 | `docs/design/references/README.md` | VoiceOS参照の取得条件と、採用/不採用の属性を記録 |
| 撮影 | `scripts/ui-capture.mjs` / `npm run ui:capture` | 新規。依存ゼロ |
| 証拠整合性ゲート | `scripts/ui-quality.mjs` / `npm run ui:gate` | キットのまま。`ui-quality.config.json`は実構成に合わせた |
| ゲート自身のテスト | `tests/ui-gate.test.mjs` | キットのまま。`npm test`に含まれる（14件） |

## 有効にしていないもの

- **Stop hook**（`.claude/settings.ui.example.json`）。セッションの停止条件を変えるため、
  既存の`.claude/settings.json`へは統合していない。使う場合は`hooks`配列へマージする。
  「停止できたこと」と「品質が合格したこと」は別物。
- **Node版Playwright**（`@playwright/test`、`@axe-core/playwright`）。このリポジトリは
  npm依存ゼロが不変条件のため、キットの`examples/`は取り込んでいない。
  ブラウザ検証はCIのPython Playwright（`scripts/verify-*.py`）と、依存なしの`ui:capture`で行う。
- **自動a11yチェック**（axe）。現状は未導入。コントラスト比は実測していない。
- 第三者プラグイン（frontend-design、Impeccable）。導入していない。

## 撮影について

`npm run ui:capture` は、`dist/`をローカルHTTPで配信し、既存のChrome/Chromium実行ファイルを
直接起動して7枚を撮る。npmパッケージを増やさないための実装。`CHROME_BIN`で上書きできる。

撮る画面: トップ（1440 / 390 / 320 / reduced-motion / 英語1440）、製品ページ（Genie 1440 / Oathra 390）。
条件は`artifacts/ui/capture.json`へ記録される。**ビューポート撮影であり全ページではない。**
写っていない範囲は「未確認」であって「問題なし」ではない。

`artifacts/ui/`と`.ui-quality/`は`.gitignore`済み。証拠はコミットせず、そのつど取り直す。

## ゲートの使い方

```sh
npm run build
npm run ui:capture
node scripts/ui-quality.mjs begin <session>
# ここで画像を開いて確認し、ui-reviewerのレビューを artifacts/ui/review.json へ保存する
node scripts/ui-quality.mjs inspect          # 現在のソース指紋と画像ハッシュ
node scripts/ui-quality.mjs check <session>  # npm run check を実行し、証拠が揃えば受領書を書く
node scripts/ui-quality.mjs assert <session> # 受領書の整合性を確認する
```

`check`は`npm run check`（ビルド + 全Nodeテスト）を実行する。成功ログ、ソース指紋、
画像ハッシュ、レビューのハッシュが揃わないと受領書を作らない。

### ゲートが保証しないこと

画面が美しいかの判定、AIが本当に画像を見たことの証明、全UI変更の自動検出、改ざん防止。
本当のマージ制御はCIの必須チェックと人間のレビューで行う。
現在このリポジトリのGitHub Actionsは**アカウントの支払い問題で起動していない**（2026-09-19時点）。

---

## 初回のゲート実行記録（2026-09-19）

キット導入後、現在のサイトに対して実際に1回通した記録。

### 撮影
`npm run ui:capture` で7枚（Chrome for Testing 153.0.8010.12、ローカルdistのHTTP配信）。

### レビュー round 1 — revise（P1が2件）

独立レビュアーが7枚を画像として開いて評価。実装者の自己評価は渡していない。

| 指摘 | 実測による確認 | 対応 |
|---|---|---|
| P1 シーンの待機行が低コントラスト | **確認。3.9:1**（acceptance.mdの4.5:1を下回る） | 待機行の不透明度 .44→.72、完了行 .7→.88 → **8.14:1** |
| P1 製品パネルが初期フレームで空白 | 確認（ストーリーが空の入力欄から始まっていた） | 開始位置を最初の内容が出る段へ（`CUES[1]`）。トップのProduct Labにも同じ改善が及ぶ |
| P2 断り書きの二重化 | 確認（共通行と製品別文の両方に「説明用の再現UI」） | 製品別文から前置きを削除。1回だけになった |
| P2 reduced-motionで発光が強い | 確認（最終状態のorbが`scale(1.12)`で既定より大きい） | reduced-motionではorbを基準値に固定 |
| P2 320pxでstatsが3段 | 確認 | 1行に圧縮。シーン開始位置が y≈635→515 |

**レビュアーの指摘のうち1点は測定と一致しなかった。**「reduced-motionでも05以外が同じ暗さ」は、
修正前の実測で7.7:1あり、既定状態（3.9:1）の問題と混同されていた。指摘は鵜呑みにせず測ってから直した。

### レビュー round 2 — keep（未解消のP0/P1なし）

5件すべて解消を確認。新規のP0/P1はなし。

### 残っている既知のP2（次回の候補）

- 製品ページの実演パネルは、応答行より下に大きな余白が残る。
- 共通注記と製品別文の連結部が二重スペース幅になっている。
- 既定状態の再生ラベルが、撮影タイミングによりJA「再生」/ EN「Pause」と食い違って写った。
  原因は観測タイミングの可能性が高い（`IntersectionObserver`が発火する前の初期ラベル）。
  実ブラウザでの読み込み直後の目視が必要。

### 追加で実測したこと

- **JavaScript無効**: `<script>`を取り除いた複製を配信して撮影。シーンの6ステップすべてと
  注記が可読（待機行と同じ階調＝約8:1）。再生・ステップ操作のボタンは正しく非表示。
- **トップのProduct Lab**: 開始位置の変更による回帰なし。パネルが内容のある状態で始まる。

### この実行で確認していないこと

自走再生（headlessでrAFが進まない）、キーボード操作とフォーカス復帰、撮影高より下のセクション、
コントラスト比の第三者による実測、768/1024/1920px、実機iPhone Safari、本番配信での表示。
