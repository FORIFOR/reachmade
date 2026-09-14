# Reachmade Lab

**できることの、その先をつくる。**

Reachmade Labの企業向けサイトと自主開発プロダクトの案内。公開先は **https://reachmade.com**。日本語・英語の静的サイトです。

> **この初版はGitHubの`FORIFOR/reachmade`からCloudflare Workers Static Assetsへデプロイし、`reachmade.com`と`www.reachmade.com`を接続済みです。現在掲載している各プロダクトにも`*.reachmade.com`の入口を用意しています。問い合わせ受信や実機表示など、個別の運用確認は別途必要です。**

## ローカルで見る

Node.js 22以上が必要です。ビルドと標準テストに外部npm依存関係やAPIキーはありません。

```sh
npm run check
npm run dev
```

ターミナルに表示される `http://127.0.0.1:4173` をブラウザで開きます。HTMLを直接ダブルクリックすると、ルート相対リンクやアセットが機能しません。`npm run dev`を使用してください。

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
| Genie | https://genie.reachmade.com/ | https://genie-forifor.forifor.chatgpt.site/ |
| AI Meeting | https://ai-meeting.reachmade.com/ | https://ai-meeting.web.app/ |
| Oathra | https://oathra.reachmade.com/ | https://forifor.github.io/oathra/ |
| AI Secure | https://aisecure.reachmade.com/ | https://forifor.github.io/AISecure/ |
| Agent Team | https://multibot.reachmade.com/ | https://forifor.github.io/Multibot/ |
| Launchloom | https://launchloom.reachmade.com/ | https://forifor.github.io/Launchloom/ |

画面操作は **[Cloudflareへの公開手順](docs/DEPLOY_CLOUDFLARE.ja.md)** にまとめています。

### 問い合わせ窓口について

この初版はAI Meetingの公開READMEに掲載されている、開発者の既存の非公開窓口へリンクします。別製品のサイトへ移動することは画面に明示しています。外部フォームの現在の稼働・メール到達は今回検証していません。広告・営業に使う前に、所有者が宛先と受信を確認してください。

`hello@reachmade.com`などのメールボックスはこのコードでは作成しません。サイト内の下書き欄も送信フォームではなく、ブラウザ内で文章を作ってコピーするだけです。入力内容をサーバーに送信・保存せず、「送信完了」も表示しません。

専用フォームに切り替える場合は`site.config.json`の`contact.url`を更新し、`src/copy.mjs`の案内文・プライバシー説明も実際の運用に合わせて更新してください。

## 編集する場所

```text
site.config.json          ドメイン・開発者・相談先
src/products.mjs          製品情報、根拠、現状、各種リンク
src/copy.mjs              日本語・英語の文章
scripts/build.mjs         共通テンプレートと静的ページ生成
public/assets/site.css    デザイン・レスポンシブ
public/assets/site.js     メニュー、絞り込み、相談文のコピー
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

静的構造とローカルHTTPのテストです。任意のブラウザテストは、別途PythonのPlaywrightとChromiumを用意して実行します。

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

初版の配布時点では、このサイト全体の再利用ライセンスは未設定です。Reachmadeのロゴ・名称・文章、リンク先の製品の権利を一括で第三者に許諾するものではありません。公開リポジトリにする場合でも、別途ライセンス方針を決めてください。

フォントファイル、外部有料テンプレート、第三者の動画やモデル素材は同梱していません。

---

**Applied AI research & product development.** From independent products to collaborative development. Japanese and English, built as a dependency-free static site. The production domain and current product aliases are connected; see the deployment guide for future changes.
