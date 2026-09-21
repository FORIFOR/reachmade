# Reachmade Lab

**できることの、その先をつくる。**

Reachmade Labの企業向けサイトと自主開発プロダクトの案内。公開先は **https://reachmade.com**。日本語・英語の静的サイトです。

このリポジトリは**製品を試して導入判断するWebサイト**です。6製品の本体やAI実行SDKは含みません。操作サンプルは架空データ、実録画・保存済み成果物は過去の公開実演として区別しています。

自作コードは[MIT](LICENSE)。名称・ロゴ・映像・外部由来素材は対象外です。[再利用範囲](NOTICE.md)を確認してください。

## ローカルで見る

Node.js 22以上が必要です。ビルドと標準テストに外部npm依存関係やAPIキーはありません。

```sh
npm run check
npm run dev
```

ターミナルに表示される `http://127.0.0.1:4173` をブラウザで開きます。HTMLを直接ダブルクリックすると、ルート相対リンクやアセットが機能しません。`npm run dev`を使用してください。

## 最初の成功：サンプルを編集して持ち出す

1. ローカルサイトで「まずはGenieから」→「まず、操作サンプルを試す」を開きます。直接の入口は `/products/genie/`（英語は `/en/products/genie/`）。
2. 例文を編集し、内容を確認して、Markdownをダウンロードします。元の例文を使う練習問題はスキップできます。AI生成・登録・課金・外部送信はありません。
3. 保存先の `.md` を開いて内容を確認します。再読み込み後も「保存したMarkdownを読み戻す」で復元できます。タブ内の文章は自動保存されません。

保存が始まらない場合は、画面の全文を選択しCtrl+C / ⌘Cでコピーしてください。4,000文字まで。読み戻しにはこのサンプルのUTF-8書き出し形式を使います。読込中は取り消し可能で、不正なファイルでも編集内容は残ります。実アプリの能力確認は、同じ製品ページの実録画・保存済み作例・導入条件から進めます。

## 開発者向け：小さなCoreを組み込む

```sh
node examples/sample.mjs > sample.md
```

```js
import {createDraft, exportDraft, importDraft}
  from './public/assets/sample-draft.mjs';
const file = exportDraft(createDraft({product:'genie', language:'ja', text:'手動編集した評価用の文章'}));
const restored = importDraft(file.text);
```

CoreはDOM・通信・ファイル書き込みを行いません。Nodeのstdout例とブラウザUIが同じ検証処理を使います。npm配布SDKではありません。[入出力・エラー・互換性](docs/SAMPLE_CONTRACT.md)、[貢献方法](CONTRIBUTING.md)、[セキュリティ](SECURITY.md)、[初回検証](docs/OSS_VERIFICATION_2026-09-19.md)・[キット導入後の追加検証](docs/OSS_KIT_V2_REVIEW_2026-09-19.md)を参照してください。

## 入っているもの

| ページ | 日本語 | 英語 |
|---|---|---|
| トップ | `/` | `/en/` |
| プロダクト | `/products/` | `/en/products/` |
| 企業向けAI実装・FDE支援 | `/services/` | `/en/services/` |
| 開発・検証記録 | `/work/` | `/en/work/` |
| ラボ・開発者の紹介 | `/about/` | `/en/about/` |
| 開発相談 | `/contact/` | `/en/contact/` |
| プライバシー | `/privacy/` | `/en/privacy/` |

独立した404ページ、OG画像、favicon、canonical、hreflang、sitemap、robots、Cloudflare用のセキュリティヘッダーとリダイレクト設定も含みます。

プロダクトはGenie / AI Meeting / Oathra / AI Secure / Agent Team（Multibot）/ Launchloom。公開READMEを確認し、できること・未検証範囲・ライセンスを分けて掲載しています。顧客の導入事例や本番の安全性を保証するものではありません。

## 公開後に残っていること

1. 問い合わせの受信確認、Safari/iPhone実機確認を行う。
2. 必要に応じてCloudflareのGitHub連携による自動デプロイを設定する。

サイト構成と移行手順は、[サイト構成・URL設計](docs/SITE_ARCHITECTURE.ja.md) と [製品サイト移行計画](docs/MIGRATION_PLAN.ja.md) に固定しています。親サイトと、現在台帳に登録しているサブドメイン入口は、権威DNSとHTTPS転送を実測済みです。製品本体のログイン・機能・問い合わせ受信は別途確認します。

確認結果のスナップショットは [構成レビューと公開状況](docs/REACHMADE_ROLLOUT_STATUS_2026-09-15.ja.md) に保存しています。

### プロダクトの入口

プロダクト一覧に登録した各項目は、`labSite`に設定した`<slug>.reachmade.com`から`site`の既存公開先へ302転送します。現在の入口数は台帳の登録数に応じて変わります。新しいプロダクトを追加するときは、`src/products.mjs`にレコードを追加し、そのサブドメインをCloudflareのWorkerカスタムドメインへ一度接続します。レコード追加後は一覧、プレビュー、Workerの転送対象が同じ台帳から生成されます。

| プロダクト | Reachmade入口 | 現在の転送先 |
|---|---|---|
| Genie | https://genie.reachmade.com/ | https://reachmade.com/products/genie/ |
| AI Meeting | https://ai-meeting.reachmade.com/ | https://ai-meeting.web.app/ |
| Oathra | https://oathra.reachmade.com/ | https://forifor.github.io/oathra/ |
| AI Secure | https://aisecure.reachmade.com/ | https://forifor.github.io/AISecure/ |
| Agent Team | https://multibot.reachmade.com/ | https://forifor.github.io/Multibot/ |
| Launchloom | https://launchloom.reachmade.com/ | https://forifor.github.io/Launchloom/ |

画面操作は **[Cloudflareへの公開手順](docs/DEPLOY_CLOUDFLARE.ja.md)** にまとめています。

### 問い合わせ窓口について

`/contact/` は現在、同一オリジンの `/api/inquiries` を通じて運営者のGoogle Cloud受付へ送信するフォームです。送信先・保存への同意を実行前に示し、201応答と有効な受付番号を受け取ったときだけ受付済みと表示します。自動返信メールはありません。`npm run dev` は静的配信のみなので送信機能は使用できません。

通信断などで結果が分からない場合は入力を残して、そのページからの再送信を止めます。UUIDの再利用だけで重複防止を保証しません。外部受付の保存・重複防止・受信確認は別途必要です。この作業では本番送信を行っていません。

他の開発者がフォークするときは、`site.config.json` の変更だけでは不十分です。`src/inquiries.mjs` の固定オリジン・送信先、Worker、表示文章、プライバシー説明を自分の受付に合わせて変更し、認可・件数制限・永続的な重複防止と照合を検証してください。Reachmadeの受付を流用しないでください。一般ページの操作サンプルは問い合わせと独立し、入力を送信しません。

## 編集する場所

```text
site.config.json          ドメイン・開発者・相談先
src/products.mjs          製品情報、根拠、現状、各種リンク
src/copy.mjs              日本語・英語の文章
scripts/build.mjs         共通テンプレートと静的ページ生成
public/assets/site.css    デザイン・レスポンシブ
public/assets/site.js     一般ページのメニュー・絞り込み
public/assets/lab-core.mjs サンプル台帳・判断ルール
public/assets/sample-draft.mjs  Markdown入出力の共通Core
public/assets/lab-explorer.mjs  サンプルの編集・復元UI
public/assets/inquiry-form.mjs  問い合わせの送信・状態表示
src/inquiries.mjs          固定先への問い合わせAdapter
public/assets/og.png      SNS共有用の実画像
public/_headers           Cloudflare配信用ヘッダー
public/_redirects         Cloudflare配信用リダイレクト
worker.js                 wwwからapexへのリダイレクトと静的アセット配信
wrangler.jsonc            Workers Static Assets設定
```

公開用の`dist/`は`npm run build`で生成します。ソースリポジトリには生成物や認証情報をコミットしない方針です。

## テスト

```sh
npm run check
```

静的構造とローカルHTTPのテストです。新しい主要フローは `npm run qa:sample` で、インストール済みChromeを使って編集・失敗復帰・実ファイルの一致まで検証します。問い合わせ応答はローカルで差し替え、本番へ送りません。証拠は `artifacts/ui/oss/` に保存します。

任意のブラウザテストは、別途PythonのPlaywrightとChromiumを用意して実行します。

```sh
python -m pip install playwright
python -m playwright install chromium
python tests/browser-check.py
```

ブラウザテストはHTML/CSS/JSをメモリー上に読み込む方式です。外部サイトの到達性、Cloudflare本番環境やSafariをテストしたものではありません。検証結果・未検証事項は **[TESTING.md](docs/TESTING.md)** を参照してください。

## デザインと内容の根拠

- [DESIGN.md](docs/DESIGN.md) — 色・書体・余白・UI方針
- [CONTENT.md](docs/CONTENT.md) — 誇張しない製品紹介、公開前確認
- [content-sources.json](docs/content-sources.json) — 製品ごとの参照元
- [RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) — 公開後に確認する事項

プロダクトのパネルには、各リポジトリで公開されている検証記録から選んだ画面を掲載しています。Reachmadeが新しく録画・再検証したものではなく、現在の稼働や本番利用を保証するものでもありません。プレビューが未登録の新しい製品は、公開資料を要約した説明図にフォールバックします。デモ・映像・評価記録は各プロダクトの外部リンクで開きます。

## ライセンス

自作コード・開発者向け文書は[MIT](LICENSE)。ブランド、宣伝文、録画、画像、外部由来HTMLや素材は別扱いです。[NOTICE.md](NOTICE.md)に対象と除外範囲を記載しています。製品本体のライセンスは各製品の正本を確認してください。

---

**Applied AI research & product development.** From independent products to collaborative development. Japanese and English, built as a dependency-free static site. The production domain and current product aliases are connected; see the deployment guide for future changes.

## プロジェクトの品質Skill

提供されたOSS Quality Kit v2の5 Skillを `.agents/skills/` に導入しています。[配置・出所・使い方](docs/QUALITY_SKILLS.md)を参照してください。自動検出は次のターンから確認できます。Skillsの存在は製品品質の認定や本番操作の許可を意味しません。
