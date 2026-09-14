# Reachmade Lab サイト構成・URL設計

確認日時: **2026-09-15 04:11 JST**  
確認方法: HTTPS の応答、リダイレクト先、GitHub リポジトリの公開ページを実測。DNS は権威に近い `1.1.1.1` への問い合わせと、通常の名前解決の両方を確認した。

## 現在の構成

Reachmade Lab の親サイトはすでに作成・公開されています。

- 親サイト: [https://reachmade.com/](https://reachmade.com/)（HTTP 200 を確認）
- `www`: [https://www.reachmade.com/](https://www.reachmade.com/) → apex へ 301（確認）
- 親サイトのページ: 日本語・英語、製品一覧、企業向け支援、開発記録、About、相談、プライバシー
- 実装: `FORIFOR/reachmade` の静的サイトと Cloudflare Workers Static Assets
- 問い合わせ: AI Meeting の既存窓口への外部リンク。Reachmade 専用フォーム・メールの受信確認は未完了

### 製品入口の台帳

`src/products.mjs` の1つの台帳から、親サイトの製品情報と Worker のサブドメイン転送先を生成しています。

| 製品 | Reachmade入口（設計） | 現在の本体URL | 入口の実測（04:11 JST） | GitHub |
|---|---|---|---|---|
| Genie | `https://genie.reachmade.com/` | `https://genie-forifor.forifor.chatgpt.site/` | 1.1.1.1で解決。Cloudflare Worker 302 → 本体 | [FORIFOR/genie](https://github.com/FORIFOR/genie)（200） |
| AI Meeting | `https://ai-meeting.reachmade.com/` | `https://ai-meeting.web.app/` | 1.1.1.1で解決。Cloudflare Worker 302 → 本体 | [FORIFOR/AI-meeting](https://github.com/FORIFOR/AI-meeting)（200） |
| Oathra | `https://oathra.reachmade.com/` | `https://forifor.github.io/oathra/` | 302 → 本体（本体200） | [FORIFOR/oathra](https://github.com/FORIFOR/oathra)（200） |
| AI Secure | `https://aisecure.reachmade.com/` | `https://forifor.github.io/AISecure/` | 1.1.1.1で解決。Cloudflare Worker 302 → 本体 | [FORIFOR/AISecure](https://github.com/FORIFOR/AISecure)（200） |
| Agent Team | `https://multibot.reachmade.com/` | `https://forifor.github.io/Multibot/` | 1.1.1.1で解決。Cloudflare Worker 302 → 本体 | [FORIFOR/Multibot](https://github.com/FORIFOR/Multibot)（200） |
| Launchloom | `https://launchloom.reachmade.com/` | `https://forifor.github.io/Launchloom/` | 302 → 本体（本体200） | [FORIFOR/Launchloom](https://github.com/FORIFOR/Launchloom)（200） |

通常の名前解決では一部サブドメインに古い負のキャッシュが残り、解決できない場合がありました。1.1.1.1で全6件のAレコードを確認し、Cloudflare IPを指定したHTTPS実測で全6件の302転送を確認しています。これは製品本体のログイン・機能・問い合わせ受信を検証したものではありません。

## 採用するURL設計

### 親サイト

| 役割 | URL |
|---|---|
| Reachmade Lab の信用・活動紹介 | `https://reachmade.com/` |
| 6製品の一覧 | `https://reachmade.com/products/` |
| 企業向けAI実装・FDE支援 | `https://reachmade.com/services/` |
| 開発・検証記録 | `https://reachmade.com/work/` |
| 開発者・ラボ紹介 | `https://reachmade.com/about/` |
| 相談の入口 | `https://reachmade.com/contact/` |

### 製品サイト

製品ごとに利用者向けの入口を持たせ、親サイトは運営者・支援内容・全製品の案内に集中します。各製品の本体、リポジトリ、ライセンス、検証条件は製品単位で管理します。

サブドメインは、DNS と Worker の到達を確認した製品から順に正式な入口として扱います。確認できるまでは、親サイトのボタンは既存の本体URLへ向けるか、入口が未確認であることを運用台帳に残します。

## 計測の分け方

- 親サイト: Reachmade 全体の閲覧と、製品ページへのクリック
- 製品サイト: 製品単位のデモ開始・試用・登録・問い合わせ
- GitHub: リポジトリ単位のスター、Issue、リリース取得
- SNS: 発信アカウント単位の投稿・反応。共用アカウントの全体値を製品成果に重複計上しない

親サイトから製品へ送るリンクには、導線を確認できる範囲で `utm_source=reachmade`、`utm_medium=referral`、`utm_campaign=product-directory` を使います。導入前に計測基盤とプライバシー説明を確認し、未設定の値を成果として扱いません。

## 現時点の判定

- **親サイト:** 公開済み・閲覧可能
- **製品本体:** 6件すべて、台帳記載の既存URLはHTTPS 200を確認
- **製品サブドメイン:** 6件すべて、権威DNSで解決し、Cloudflare Worker の302転送を確認（通常DNSは一時的に古い負のキャッシュを返す場合あり）
- **移行:** 製品本体を一斉移転していない。現在はサブドメインを入口とする段階
- **事業導線:** 相談先は外部窓口で、Reachmade専用の受信は未確認

根拠: `src/products.mjs`、`worker.js`、`site.config.json`、`docs/DEPLOY_CLOUDFLARE.ja.md`、および上表のHTTPS実測。
