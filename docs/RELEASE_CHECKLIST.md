# Production release checklist

公開前に所有者が確認する項目です。チェック済みを装うための一覧ではありません。

## Product experience / OSS first proof

各製品は、ホームページより先に「最初の実行」を完成させる。

- [ ] 初見の利用者がREADMEまたは通常のCLIヘルプから**最初に試す経路**を迷わず見つけられる。
- [ ] 可能な製品では、課金・本番資格情報・外部公開を使わずにFirst Proofを実行できる。できない場合は、その理由と発生する外部通信・費用を実行前に表示する。
- [ ] First Proofは別物の飾りデモではなく、実製品のUI・Store・Pipeline・Rendererなど本番と共通する主要経路を使う。
- [ ] 合成入力・fixture・recorded demoは明示し、実利用・顧客実績・本番成功として扱わない。
- [ ] First Proofで「何が成功したか」を、artifact / event / saved state / verification reportなど確認可能な成果として残す。
- [ ] `doctor`または同等の診断経路が、失敗した前提条件と**次に行う具体的な操作**を返す。
- [ ] readinessとtask success、transcript evidenceとexternal system confirmationなど、異なる証拠を同一視しない。
- [ ] First Proofからpaid provider、live publish、real phone call、production remediationへ暗黙fallbackしない。
- [ ] 再実行時の重複、途中失敗、再起動、権限不足、依存不足の少なくとも主要ケースをテストする。
- [ ] First Proof / Doctorの経路をCIで固定し、READMEだけ先に進んで実装が壊れる状態を防ぐ。

## Reachmade site / release

- [x] リポジトリ`FORIFOR/reachmade`の作成とソース配置を確認。
- [ ] 支援内容と事業者表示を本人が確認。
- [ ] コードの公開範囲・再利用ライセンスを決定。
- [x] `npm run check`が成功する。
- [x] Cloudflare Workersの実ビルド・デプロイが成功する。
- [x] 発行されたworkers.dev上でページ・CSS・JS・OG画像が表示される。
- [ ] 外部の各製品デモ・GitHub・検証記録のリンクを実際に開く。
- [ ] 問い合わせ先の所有者・取り扱いと、実際の受信を確認。
- [ ] 問い合わせコピーを「送信完了」と誤認しないことを確認。
- [x] `reachmade.com`、`www.reachmade.com`の接続と証明書を確認。
- [x] HTTP→HTTPS、www→apex、パス付きURLの転送を実測。
- [x] 存在しないページはHTTP 404（200の偽404ではない）。
- [ ] CSPで必要な操作を壊していない。レスポンスヘッダーを本番で確認。
- [ ] Safari / Chrome / Firefox、iPhone / Android実機で確認。
- [ ] メニュー、Tab順、Escape、200%拡大、読み上げを手動確認。
- [ ] パフォーマンスを日本から実測。Lighthouse値と実利用Core Web Vitalsを区別。
- [ ] 専用メールを作る場合は受信・送信・SPF/DKIM/DMARCを確認してから掲載。
- [ ] 無関係な旧MXを放置せず、採用したメール提供者の構成に合わせる。
- [ ] 解析を追加する場合は内容・同意・プライバシー説明を先に更新。
- [ ] CloudflareとNamecheapの2段階認証・自動更新の支払い方法を確認。

既存DNSの削除、ドメインの移管、有料プランの契約は、このソースの作成では行っていません。
