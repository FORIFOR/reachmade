#!/usr/bin/env node
// Prints a fresh reply link for one stored inquiry, e.g. when its notice email failed.
//   INQUIRY_REPLY_SECRET=… node scripts/inquiry-reply-link.mjs <request_id>
// Find request IDs with: npx wrangler@4 d1 execute reachmade-inquiries --remote --command
//   "SELECT request_id, receipt, name, notice, status, datetime(created_at/1000,'unixepoch') FROM inquiries ORDER BY created_at DESC LIMIT 20"
import { replyLink } from '../src/inquiry-mail.mjs';
const [id] = process.argv.slice(2);
if (!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(id ?? '')) { console.error('usage: INQUIRY_REPLY_SECRET=… node scripts/inquiry-reply-link.mjs <request_id>'); process.exit(2); }
const link = await replyLink(process.env, 'https://reachmade.com', id.toLowerCase());
if (!link) { console.error('INQUIRY_REPLY_SECRET (32+ characters) is required'); process.exit(2); }
console.log(link);
