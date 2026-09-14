# Reachmade Lab 公開手順

確認日: 2026-09-15。公開先は **Cloudflare Workers Static Assets** に統一します。Pagesプロジェクトを並行して作る必要はありません。

## 今あるもの / まだないもの

- あるもの: 購入済み`reachmade.com`、Cloudflare DNS、`FORIFOR/reachmade`のソース、Workers Static Assetsへのデプロイ、`reachmade.com`と`www.reachmade.com`のWorker接続、現在の各プロダクト用サブドメイン6件。
- まだないもの: 専用のReachmadeメールボックス、問い合わせ受信・実機表示の確認。
- Namecheapの登録・更新は継続します。ネームサーバーを元に戻したり、有料のホスティングを追加契約したりする手順ではありません。

## 1. GitHubにリポジトリを作る

GitHubで新しいリポジトリを作成します。

- Owner: `FORIFOR`
- Repository name: `reachmade`
- Description: `Reachmade Lab — applied AI research, products and implementation.`
- Visibility: 内容を確認するまではPrivateでも構いません。公開方針に合わせて選択してください。
- Add a README: **ON**。初期コミットができ、接続ツールでブランチとファイルを扱いやすくなります。
- ライセンスはこの時点で自動選択しない。ブランドとコードの扱いを決めてから追加します。

ソースZIPを解凍し、その中の`reachmade`フォルダの**中身**をリポジトリのルートに配置します。既存READMEはこの版に置き換えて構いません。住所、電話、カード、APIトークン、スクリーンショットはアップロードしません。

既に作成済みの場合は、空にしたり上書きしたりせず、中身を確認してから配置してください。

ローカルにGitがある場合の一例です。接続認証は手元で行い、トークンはチャット・コードに貼らないでください。

```sh
git clone https://github.com/FORIFOR/reachmade.git reachmade-repo
# 解凍したソースの中身を reachmade-repo にコピーする（.git はコピーしない）
cd reachmade-repo
npm run check
git status
git add .
git commit -m "Build bilingual Reachmade Lab website"
git push origin main
```

`dist/`は.gitignoreで除外します。Cloudflareがソースから生成します。Node.js 22以上を使ってください。

## 2. CloudflareでGitHubリポジトリを接続する

Cloudflareの**アカウント側**に戻り、Workers & Pages → Create application → GitHubからのインポートを選びます。ドメインのDNSレコードを直接編集する画面ではありません。UIの表示名は更新で変わる場合があります。

GitHub連携を求められたら、まず`FORIFOR/reachmade`のみを許可する設定を選びます。GitHub/Cloudflareへのログインと認可は所有者が画面で行います。

### ビルド設定

| 項目 | 設定 |
|---|---|
| Worker name | `reachmade` |
| Repository | `FORIFOR/reachmade` |
| Production branch | `main` |
| Root directory | リポジトリのルート（空欄または`/`） |
| Build command | `npm run check` |
| Deploy command | `npx wrangler@4 deploy` |
| Node.js | 22以上（必要ならビルド変数`NODE_VERSION=22`） |
| フレームワーク | 特別なプリセット不要 |

設定ファイル`wrangler.jsonc`が`dist/`を配信対象として指定します。Pages用の「Build output directory」と混同しないでください。コードのビルドにAPIキーは不要です。公開処理に必要なCloudflare権限は、所有者のアカウント内で設定します。

Wrangler 4は初回にnpmから取得されます。厳密なバージョン固定を行うときは、手元で検証できたバージョンをdevDependencyに固定してロックファイルをコミットしてください。Wrangler実行・認可・クラウド公開は2026-09-15に実施済みです。

## 3. 一時URLで確認する

デプロイ成功画面が返す実際の`workers.dev` URLで開きます。URLを推測しないでください。

日本語トップ、Products、Services、Work、About、Contact、英語切替を確認します。Contactは外部窓口へ遷移します。下書きはコピーだけで、送信ではありません。

製品ごとの外部デモは、別タブで開けるか確認します。到達先の実稼働は今回のローカルテストに含まれません。

## 4. 独自ドメインを接続する

Worker `reachmade` → Settings → Domains & Routes → Add → Custom Domainから、次を順に追加します。

```text
reachmade.com
www.reachmade.com
genie.reachmade.com
ai-meeting.reachmade.com
oathra.reachmade.com
aisecure.reachmade.com
multibot.reachmade.com
launchloom.reachmade.com
```

既存のWebサイト向けレコードと競合する警告が出た場合は、そのレコードの用途を確認してから処理します。**MX/TXTなどメール用レコードは、Web接続のために削除しません。**

この構成では、ドメインの配信先をCloudflareに管理させます。Namecheapに戻って適当なAレコードやIPアドレスを入れる必要はありません。

`worker.js`が`www`→apexの301転送を行います。**wwwをこのWorkerに接続しないと転送ルールも実行されません。** HTTPからHTTPSへの転送はCloudflareのSSL/TLS → Edge Certificates → Always Use HTTPSも確認してください。

プロダクト用6サブドメインは、現時点では各製品の既存公開先へ302転送する入口です。製品サイト自体をこのWorkerへ移したわけではありません。新しい製品を追加するときは、`src/products.mjs`に`labSite`と`site`を持つレコードを追加し、そのサブドメインをCloudflareのカスタムドメインへ一度接続します。Workerは同じ台帳から転送先を組み立てます。

名前解決が有効でも、SSL証明書と実コンテンツの公開完了は別です。ブラウザで実際のページを確認してください。

## 5. 公開確認

```sh
curl -I https://reachmade.com/
curl -I https://www.reachmade.com/products/
curl -I https://reachmade.com/does-not-exist/
curl -I https://genie.reachmade.com/
```

確認済み（2026-09-15）: apexが200、wwwがapexの同じパスへ301、存在しないページが404、6サブドメインが各公開先へ302、パスとクエリを保持。DNSは1.1.1.1で全6件のAレコードを返し、Cloudflare IPを指定したHTTPSで転送を確認しました。通常の名前解決で一部に古い負のキャッシュが残る場合があります。ヘッダーのCSPとnosniff、HTTP版のHTTPS転送も実環境で確認済みです。

続いてSafariとiPhoneなどの実機、問い合わせの実受信、SNS共有画像を確認します。詳細はRELEASE_CHECKLIST.md。

## 6. 問い合わせ・メールを分けて設定する

今の相談リンクはAI MeetingのREADMEで案内されている既存の非公開窓口です。Reachmade専用ではありません。所有者が受信テストしてから、営業に使用してください。

NamecheapのMXレコードをCloudflareに残すだけで、無料メール転送や新しいメールボックスが利用可能になるとは限りません。メール転送・送信サービスを選び、提供元の設定手順でMX/SPF/DKIM/DMARCを確認してから切り替えます。新旧の無関係なMXを混在させないようにします。

専用メールは**実受信・実送信を確認してから**公開します。メールアドレスを想像して配置しないでください。

## 7. 公開しない状態に戻す

問題がある場合はCloudflareのバージョン履歴から既知の正常版へロールバックし、ドメインやDNS全体を削除しないでください。初版の時点で既知の正常版がない場合は、公開用ドメインを接続する前に`workers.dev`で修正します。

## 公式資料

- Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/get-started/
- Builds設定: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- カスタムドメイン: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- ヘッダー: https://developers.cloudflare.com/workers/static-assets/headers/
- リダイレクト: https://developers.cloudflare.com/workers/static-assets/redirects/

この手順は公式資料に基づく運用メモです。デプロイと独自ドメイン接続は2026-09-15に所有者アカウントで実施済みです。
