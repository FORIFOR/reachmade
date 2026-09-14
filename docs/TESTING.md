# Initial website verification / 2026-09-15

## 結果

- `npm run check`: **61 tests passed / 0 failed**。Node.js v22.16.0。
- `python tests/browser-check.py`: **89 checks passed / 0 failed**（2026-09-15の記録）。Chromium 144.0.7559.96。製品台帳をデータ駆動にした後の再実行は、この環境にPlaywrightがないため未実施。
- 上記はこの**サイトのコード**の検証。掲載する各製品を今回再実行・再評価した結果ではない。

## 61件の静的・ローカルHTTPテスト

- 設定検証、HTMLエスケープ、連絡先設定の不正入力拒否。
- 日本語・英語各7ページのHTML/lang/H1/ナビゲーション/重複ID。
- 内部リンク・アンカー・ローカルアセット・canonical・hreflang。
- 製品ごとの参照リンク、条件・未検証範囲の表示。
- 問い合わせの明示的な外部リンク、下書きが送信でないこと。
- 実データとしての1200×630 PNG、robots/sitemap、404。
- Node HTTPサーバーでGET/HEAD、末尾スラッシュ、404、POSTの拒否、非公開パスの拒否。
- CSP等の設定ファイルと、ローカルHTTPレスポンスのセキュリティヘッダー。

ログ: `node-test.txt`。テストはビルド後に実行する（`npm run check`が両方を実行）。

## 89件のブラウザ検証

75件は15ページ×5画面幅（320 / 390 / 768 / 1440 / 1920px）。メイン表示、H1、横はみ出し、JavaScriptエラーを確認。

残る14件は、モバイルメニューの開閉・Escape・フォーカス、製品フィルター、詳細開閉、下書きの必須入力、クリップボード拒否時の安全な手動コピー、コピー成功と送信の区別、JS無効時のコンテンツ・ナビ、動きを減らす設定、6ページの言語切替の対応先。

結果: `browser-check.json`。

### 実行方式について

この作業環境のChromiumはネットワークナビゲーションが管理ポリシーで制限されているため、`page.set_content`で**生成済みHTMLと同じCSS/JSをメモリー上に読み込み**、DOMとレンダリング・操作を確認した。ポリシー設定は変更していない。

HTTPレスポンスは、別のNodeテストでローカルサーバーを起動し確認した。ブラウザで実際のHTTPからCSS/JSを読み込んだ統合テストではない。インライン化したブラウザ検証ではCSPの本番適用を検証していない。

## 目視確認

トップのPC/モバイル、製品一覧、相談ページ、英語トップのキャプチャを確認。これらはローカルHTMLのプレビューであり、公開済みサイトのスクリーンショットではない。

## 本番確認済み / 2026-09-15

- `https://reachmade.com/` がHTTP 200で配信される。
- `www.reachmade.com` が同じパスとクエリをapexへHTTP 301転送する。
- `reachmade.com/does-not-exist/` がHTTP 404を返す。
- `genie`、`ai-meeting`、`oathra`、`aisecure`、`multibot`、`launchloom`の各サブドメインがCloudflare DNSで解決し、既存公開先へHTTP 302転送する。パスとクエリも保持する。
- workers.devのデプロイとWorkerのカスタムドメイン接続。

## 未検証

- Safari、Firefox、iPhone/Androidの実機、読み上げソフト。
- 外部デモの現在の稼働と、既存相談フォームからのメール到達。
- Lighthouse計測、実利用のCore Web Vitals。
- 広告やアクセス解析、流入・反響の計測（未導入）。

**本番公開チェックはRELEASE_CHECKLIST.mdで別に管理する。ローカルテストの合格を本番デプロイ済みと解釈しない。**
