# Reachmade Real-use Proof Registry

Reachmadeの`Claim → Proof`を、見た目だけでなく運用でも守るための公開台帳です。

## Proofとして登録するもの

以下のうち、**公開根拠URLと公開許可が両方あるものだけ**を`public/data/real-use-proof.json`へ追加します。

- `real-use`: 実利用で具体的な仕事・成果物が完了した記録
- `pilot`: 実企業・実チームのPoC/Pilotで、公開可能な結果が残った記録
- `external-review`: 第三者が実際に使った上で公開したレビュー
- `public-adoption`: 公開プロジェクトや公開業務で採用された記録

## Proofにしないもの

次は実利用Proofとして扱いません。

- GitHub Star / Like / Impression / ページビューだけ
- Reachmade自身のデモ、合成データ、内部テスト
- 「使われたらしい」など根拠URLのない申告
- 顧客名・会社名の公開許可が確認できない事例
- 非公開チャット、メール、契約書、個人情報をそのままGitHubへ置くこと
- 将来見込み、推定値、外挿した利用者数

## 必須項目

各entryは次を持ちます。

- `product`: 6製品のいずれか
- `kind`: 上記4種
- `observedAt`: 実際に確認した日
- `claim`: 公開してよい短い事実
- `scope`: 条件・対象範囲・限界
- `evidenceUrl`: 誰でも確認できるHTTPS URL
- `permissionToPublish: true`
- `verification: "public-evidence"`

同じ根拠URLの二重登録は拒否します。

## 追加方法

例として、実際の公開根拠が得られた後にだけ実行します。

```sh
npm run proof:add -- \
  --product genie \
  --kind real-use \
  --observed-at 2026-10-01 \
  --claim "<公開できる事実だけを書く>" \
  --scope "<対象と限界を書く>" \
  --evidence-url https://example.com/public-evidence \
  --permission-to-publish
```

追加後は必ず`git diff`でclaim・scope・URLを人が確認し、`npm run check`を通してからcommitします。

## 公開方針

台帳は同一ドメインの`/data/real-use-proof.json`として配信されます。現在entryが0件なら、**0件のまま公開するのが正しい状態**です。数値やロゴを埋めるためにサンプルentryを作りません。

将来サイト上に件数や事例を表示する場合も、このregistryの検証済みentryだけをソースにします。表示用の数字を別管理しません。
