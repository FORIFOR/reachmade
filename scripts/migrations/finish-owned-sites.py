#!/usr/bin/env python3
"""Structured follow-up to the bounded import. No new endpoints or submissions."""
import json
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def edit(name,fn):
    path=ROOT/name;old=path.read_text();new=fn(old)
    if new!=old:path.write_text(new)

def prepare():
    config_path=ROOT/'site.config.json'
    config=json.loads(config_path.read_text())
    config['contact']={'mode':'external','url':'https://reachmade.com/contact/#reachmade-inquiry','email':None,'note':'Use the existing same-origin, consented inquiry form. The retired external fallback is no longer linked. Reconnect when intake is unavailable; no unverified mailbox is advertised.'}
    config_path.write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
    def inquiry(text):
        text=text.replace("https://ai-meeting.forifor.chatgpt.site/${ja?'ja':''}#business","https://reachmade.com${ja?'':'/en'}/contact/#reachmade-inquiry")
        text=text.replace("接続できない場合は既存の窓口へ","このページのフォームへ").replace("Use the existing form when unavailable","Go to the form on this page")
        text=text.replace('送信にはJavaScriptが必要です。既存の窓口からご相談ください。','送信にはJavaScriptが必要です。有効にしてから、このページを開き直してください。')
        text=text.replace('JavaScript is required to send. Please use the existing form linked here.','JavaScript is required to send. Enable it, then reopen this page.')
        return text
    edit('src/inquiry-page.mjs',inquiry)
    def destination(text):
        start=text.index('export function contactDestination(')
        end=text.index('export function improveCopy(',start)
        return text[:start]+'''export function contactDestination(config, language) {
  if (!['ja','en'].includes(language)) throw new TypeError('Unsupported language');
  if (config.contact.mode === 'email') return `mailto:${config.contact.email}`;
  const url = new URL(config.contact.url);
  if (url.origin === 'https://reachmade.com' && ['/contact/', '/en/contact/'].includes(url.pathname)) url.pathname = language === 'ja' ? '/contact/' : '/en/contact/';
  return url.href;
}
'''+text[end:]
    edit('src/site-content.mjs',destination)

def finish():
    edit('tests/site.test.mjs',lambda s:s.replace('const dest=u.pathname;','const dest=decodeURIComponent(u.pathname);').replace('retains the existing fallback','uses the owned contact destination'))
    edit('tests/site-experience.test.mjs',lambda s:s.replace('has a localized fallback','has a localized owned destination'))
    def guides(text):
        text=text.replace("id==='proposal'?'proposal':null","id==='proposal'?'proposal':'product'")
        text=text.replace('<source src="${meetingVideo}" type="video/mp4"><a', '<source src="${meetingVideo}" type="video/mp4"><track kind="captions" srclang="${lang}" label="${ja?\'日本語\':\'English\'}" src="/media/originals/ai-meeting/demo-${lang}.vtt" default><a')
        return text
    edit('src/owned-guides.mjs',guides)
    # Keep recovery information accurate: the form remains, not an independent fallback.
    edit('src/site-experience.mjs',lambda s:s.replace('代替フォーム・製品サイト・GitHubへのリンクは外部サービスです。','製品サイト・GitHubへのリンクには外部サービスが含まれます。').replace('Fallback forms, product links and GitHub open external services.','Some product links and GitHub open external services.'))
    edit('src/site-content.mjs',lambda s:s.replace('開発者の既存フォーム（AI Meetingのサイト内）で、そのまま相談できます。このページで下書きを作る必要はありません。送信先は移動後の画面で確認できます。','このサイトの受付フォームから相談できます。送信先と情報の取り扱いを確認してから送信してください。').replace('Contact the developer directly using the existing form on the AI Meeting site. You do not need to draft or copy anything here first. Review the destination before submitting.','Use the inquiry form on this site. Review the stated destination and privacy information before submitting.'))
    # Unicode filenames are valid HTTP paths; tests must map decoded names to disk.
    with (ROOT/'tests/owned-sites.test.mjs').open('a') as f:
        f.write('''\ntest('contact stays localized on the owned form without changing its submission endpoint',async()=>{
 const {contactDestination}=await import('../src/site-content.mjs');
 const {renderInquiry}=await import('../src/inquiry-page.mjs');
 const config=JSON.parse(await fs.readFile(new URL('../site.config.json',import.meta.url),'utf8'));
 for(const lang of ['ja','en']){
  const html=renderInquiry(lang),url=contactDestination(config,lang);
  assert.ok(html.includes(url)); assert.ok(url.startsWith('https://reachmade.com/'));
  assert.ok(html.includes('method="post" action="/api/inquiries"'));
  assert.ok(html.includes('name="consent" type="checkbox" required'));
  assert.ok(!html.includes('chatgpt.site'));
 }
 assert.equal(decodeURIComponent(new URL('https://reachmade.com/media/Genie-Web%E6%94%B9%E5%96%84%E6%A1%88.md').pathname),'/media/Genie-Web改善案.md');
});\n''')
if __name__=='__main__':
    import sys
    if sys.argv[1:] == ['prepare']:prepare()
    elif sys.argv[1:] == ['finish']:finish()
    else:raise SystemExit('Pass prepare or finish')
