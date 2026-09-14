# Reachmade Lab 構成レビューと公開状況

確認日時: 2026-09-15 04:10 JST

## 結論

推奨していた「Reachmade Labの親サイト＋製品別サブドメイン」の構成は、コードとCloudflare Workerの設計として実装済みです。親サイトは `https://reachmade.com/` で公開され、製品用6サブドメインは各製品の既存公開先へ転送する入口として登録されています。製品本体を一つのアプリへ移した状態ではありません。

今回の確認では、次を読み取りました。

- `https://reachmade.com/`、`/products/`、`/services/`、`/contact/` はHTTP 200。
- `https://www.reachmade.com/` はapexへのHTTP 301。
- `genie`、`ai-meeting`、`oathra`、`aisecure`、`multibot`、`launchloom` の権威DNSレコードは解決し、各入口は既存公開先へのHTTP 302を返す。
- 端末の通常DNSでは一部サブドメインに古い負のキャッシュが残り解決できない場合があった。権威DNS（1.1.1.1）とCloudflareのHTTP応答では転送を確認できたため、Worker設定の欠落とは切り分ける。
- Xautoposterはこの6製品一覧には含まれていない。XautoposterをReachmade傘下に追加する場合は、別途プロダクト台帳への追加判断が必要。

## 構成レビュー

### 親サイト

親サイトは、6製品の一覧、企業向けAI実装・FDE支援、開発・検証記録、開発者紹介、相談窓口を持つ日本語・英語の静的サイトです。14ローカライズページ、404、canonical、hreflang、sitemap、robots、CSP等がビルドに含まれます。

親サイトの相談CTAは、現時点ではAI Meetingサイトに記載された既存の外部窓口へ遷移します。Reachmade専用フォーム、メールボックス、問い合わせ受信はこのリポジトリでは設定していません。フォーム送信の自動処理もありません。

### 製品サイト

6製品は `src/products.mjs` を単一台帳として、製品名、README、根拠資料、GitHub、デモ、既存公開先、Reachmade入口を管理しています。各サブドメインは、段階移行のための302入口です。アプリ本体、ログイン、利用者データ、GitHubリポジトリ、OSSライセンスは製品ごとに維持する設計です。

### SNS・集客導線

親サイトの製品カードは、各製品のサイト・デモ・ソース・検証記録へリンクします。製品ごとのSNS投稿を自動送信する機能や広告計測はありません。投稿から各製品サイトへのUTM、アクセス解析、登録・利用計測も未導入です。

## 確認したURLと転送先

|入口|確認結果|転送先|
|---|---|---|
|`https://reachmade.com/`|200|親サイト|
|`https://www.reachmade.com/`|301|`https://reachmade.com/`|
|`https://genie.reachmade.com/`|302|`https://genie-forifor.forifor.chatgpt.site/`|
|`https://ai-meeting.reachmade.com/`|302|`https://ai-meeting.web.app/`|
|`https://oathra.reachmade.com/`|302|`https://forifor.github.io/oathra/`|
|`https://aisecure.reachmade.com/`|302|`https://forifor.github.io/AISecure/`|
|`https://multibot.reachmade.com/`|302|`https://forifor.github.io/Multibot/`|
|`https://launchloom.reachmade.com/`|302|`https://forifor.github.io/Launchloom/`|

確認方法は、curlによるHTTPヘッダー取得と、1.1.1.1へのDNS問い合わせです。転送先のアプリ機能、ログイン、問い合わせ受信は今回の対象外で、稼働確認済みとは扱いません。

## サブドメイン移行計画

1. **親サイトを基準にする。** Reachmadeの製品一覧・支援・相談ページを公開状態として維持し、製品移行の完了を待たずに親サイトを止めない。
2. **製品ごとに公開先を確認する。** 新しい製品サイトを公開する場合は、対応するサブドメインで実画面、主要リンク、HTTPS、404、問い合わせ先を確認する。
3. **入口を切り替える。** 確認後に `src/products.mjs` の `site` と `labSite` を更新し、Workerをデプロイする。旧URLは対応する製品ページへ転送し、親トップへ一括転送しない。
4. **アプリ本体は別に移行する。** 認証、localStorage/IndexedDB、外部API、保存データ、CORS、Cookie、料金を調べてから、必要な製品だけ独自ドメイン化する。紹介サイトの移転とアプリのオリジン変更を同時に行わない。
5. **計測を製品別に追加する。** 公開先と目的を決め、製品IDを含むUTM、Search Console、アクセス解析、登録・利用イベントを設計してから導入する。導入前の成果を遡って帰属させない。
6. **相談窓口を分離する。** Reachmade専用の受信先を用意し、フォームに対象製品を引き継ぐ。受信・返信を実際に確認するまで、営業CTAとしての稼働を断定しない。

## 残っている確認事項

- Safari、iPhone/Android、読み上げ環境での実機表示。
- 各製品の外部デモの最新稼働、ログイン、料金・利用条件。
- AI Meeting外部窓口の受信・返信到達。
- Search Console、アクセス解析、CTAクリック、登録・利用の計測。
- 旧URLを変更する場合の301/308対応と、各製品のURL対応表。

上記は、ドメイン設定やアプリ移行を追加で実行せずに残る確認事項です。Launchloom、Xautoposter、各製品のアプリ本体・DB・設定はこのレビューでは変更していません。

