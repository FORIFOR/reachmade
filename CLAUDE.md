# Reachmade Lab

日本語・英語の静的サイト。公開先は https://reachmade.com（Cloudflare Workers Static Assets）。

## Commands

```sh
npm run check    # build + node --test tests/*.test.mjs（これが基本の合格線）
npm run dev      # build してから http://127.0.0.1:4173 で配信
npm run preview  # 既存のビルドを配信
npm run deploy   # check + media:prepare + wrangler deploy（明示的な許可があるときだけ）
```

存在しないコマンドを成功扱いにしない。ゲートを通すために常に成功するスクリプトを作らない。

## Project invariants

これらはテストで固定されている。破る変更はテストの修正ではなく設計の見直しで対応する。

- **npm依存はゼロ。** `package.json`に`dependencies`も`devDependencies`も置かない。ビルドと標準テストは
  Node 22だけで、ネットワークとAPIキーなしに完結する。
- **1ページにつき`<script>`1本、stylesheet 1本。** 新しい挙動やスタイルは、既存の
  `showcase.mjs` / `showcase.css` へマーカー付きで追記する層として足す（`src/*.mjs`のwrite関数を参照）。
  追記は冪等にする。2回走らせても出力が増えない。
- **JavaScript無効でも全ページの内容とリンクが使える。** 演出はJSが付いたときの上乗せに留める。
- `prefers-reduced-motion`、`forced-colors`、通信量節約設定に対応する。自動再生しない。
- 解析タグ、外部フォント、外部埋め込み、Cookie、localStorage/sessionStorageを追加しない。
  CSPは`script-src 'self'`。`public/_headers`と`worker.js`が正本。
- ビルド層は**fail closed**。想定した構造が見つからなければ例外を投げ、部分的に壊れたページを出さない。

## Honesty invariants

このサイトの価値は「確かめられること」にある。次はデザインより優先する。

- 顧客事例、利用者数、性能比較、受賞、競合優位を**測定なしに書かない**。
  「VoiceOSを超えた」は、比較対象・同条件の観察・利用者評価の証拠がない限り主張しない。
- 製品の主張は`src/products.mjs`の台帳が唯一の出典。ページ側で新しい効能を発明しない。
- 再現UI（illustrative）と実録画・保存済み成果物（evidence）を、画面上で必ず言い分ける。
- 実行していない確認をPASSと書かない。未確認はUNVERIFIEDとして残す。
- 6製品は独立した別プロダクト。自動連携する単一パイプラインとして描かない。

## UI workflow

UIを新規実装・変更するときは `/ui-craft` を使う。自動起動しない場合も
`.claude/skills/ui-craft/SKILL.md` を読んで手順を適用する。

- 先に `docs/design/brief.md`、`docs/design/acceptance.md`、`docs/design/tokens.md` を読む。
- 実画面を起動して操作し、**画像を画像として開いて確認する**。DOMの読み取りだけで見た目を判断しない。
- 実装者の自己評価で完了としない。`ui-reviewer` へ画像と再現手順を渡してレビューを受ける。
- 指摘が収束しないときは最大3回の修正で止め、未達と原因を報告する。
- 合格させる目的でテスト削除、閾値の緩和、基準画像の無断更新をしない。

```sh
npm run ui:capture   # dist を配信して artifacts/ui/ へ規定の画面を撮影
npm run ui:gate      # 依存なしの証拠整合性ゲート（任意・詳細は docs/design/report-template.md）
```

## Permissions

push、PR作成、マージ、`npm run deploy`、本番への反映は、そのつど明示的な許可を得てから行う。
実電話の発信、実投稿、実送信、課金操作は行わない。
