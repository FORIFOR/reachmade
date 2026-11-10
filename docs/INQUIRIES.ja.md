# お問い合わせの受付と返信

reachmade.com の相談フォームは、このサイトの Worker が受け付けます。ほかのサービスへは転送しません。

```
フォーム ─POST /api/inquiries─▶ Worker ─▶ D1（reachmade-inquiries）に保存
                                     └─▶ Resend で運営者へ通知（返信ページへのリンク付き）
運営者 ─通知のリンク─▶ /inquiries/reply/<id>?exp&sig ─▶ Resend で相手へ返信（no-reply@reachmade.com から）
```

- 通知メールには返信先（Reply-To）を付けません。Gmail から返信すると個人のアドレスが相手に見えるためです。
- 返信は `INQUIRY_MAIL_FROM`（既定 `Reachmade <no-reply@reachmade.com>`）から送り、Reply-To を `INQUIRY_REPLY_TO` にします。相手の返事はそこに届きます。
- 返信ページのリンクは、お問い合わせ1件ごとに署名され、30日で切れます。ページは検索に載らず、他サイトからの送信を拒みます。
- 保存は90日。毎日1回（UTC 18:17 = 日本時間 3:17）の削除処理で、期限切れの問い合わせと返信の記録を消します。
- 受付の上限は1日100件、同じメールアドレスから1日3件。受付番号は `RM-` で始まります。

## 初回の設定（1回だけ）

```sh
# データベースは作成済み（database_id は wrangler.jsonc）。返信先 INQUIRY_REPLY_TO は wrangler.jsonc の vars。
npx wrangler@4 d1 migrations apply reachmade-inquiries --remote
npx wrangler@4 secret put RESEND_API_KEY              # Resend の送信専用キー（reachmade.com）
npx wrangler@4 secret put INQUIRY_NOTIFY_TO           # 通知を受け取るアドレス
npx wrangler@4 secret put INQUIRY_REPLY_SECRET        # openssl rand -base64 48 の出力。変えると送信済みのリンクが無効になる
npm run deploy
```

設定がそろうまで、フォームは「受付に接続できません」と表示し、受け付けません。

## 運用

```sh
# 最近のお問い合わせ
npx wrangler@4 d1 execute reachmade-inquiries --remote --command \
  "SELECT request_id, receipt, name, notice, status, datetime(created_at/1000,'unixepoch') FROM inquiries ORDER BY created_at DESC LIMIT 20"
# 通知が届かなかった（notice = failed）ものの返信リンクを作り直す
INQUIRY_REPLY_SECRET=… node scripts/inquiry-reply-link.mjs <request_id>
```
