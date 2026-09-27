import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/build.mjs';
import { products } from '../src/products.mjs';
import { landingIds, landingRoute, renderProductLanding, landingExperience } from '../src/product-landings.mjs';
import { productNavigation } from '../src/site-experience.mjs';
const config = JSON.parse(await fs.readFile(path.join(root,'site.config.json'),'utf8'));
const escaped = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

test('owned landings cover exactly the six Reachmade products',()=>{
  assert.deepEqual([...landingIds].sort(),products.map(p=>p.id).sort());
  assert.equal(landingIds.length,6);
});

for (const id of landingIds) for (const lang of ['ja','en']) {
  test(`${id}/${lang}: product page leads with its real film, first action and honest boundaries`, async () => {
    const p = products.find(p=>p.id===id), route = landingRoute(id,lang), x = landingExperience[id][lang];
    const html = await fs.readFile(path.join(root,'dist',route,'index.html'),'utf8');
    assert.match(html,new RegExp(`data-product-id="${id}"`));
    assert.match(html,new RegExp(`data-recording-src="/media/products/${id}\\.mp4"`));
    assert.match(html,new RegExp(`poster="/media/products/${id}\\.jpg"`));
    assert.doesNotMatch(html,/<video[^>]*\ssrc=|<video[^>]*\bautoplay\b|<iframe|<form\b/);
    assert.match(html,/preload="none"/);
    assert.equal((html.match(/class="owned-step-index"/g)||[]).length,3);
    assert.equal((html.match(/class="owned-try-now"/g)||[]).length,1);
    assert.equal((html.match(/class="owned-action-note"/g)||[]).length,1);
    assert.ok(html.includes(escaped(p[lang].scope)));
    assert.ok(html.includes(escaped(p[lang].proof)));
    assert.ok(html.includes(escaped(x.tryNow)));
    assert.ok(html.includes(escaped(x.actionNote)));
    assert.ok(html.includes(escaped(x.primary[0])));
    assert.match(html,lang==='ja'?/13秒で実演を見る/:/See it in 13 seconds/);
    assert.match(html,lang==='ja'?/約13秒.*再生速度は変えていません/:/about 13 seconds; playback speed is unchanged/);
    if (id==='genie') assert.match(html,lang==='ja'?/現行の製品にはまだ入っていません。実機での動作は未確認です/:/is not in the current product\. It has not been checked on a real Mac/);
    else assert.match(html,lang==='ja'?/現行製品の実演や、新UIの実装完了を示すものではありません/:/not a demonstration of the current product/);
    assert.equal((html.match(/class="owned-hero-badges"/g)||[]).length,1);
    assert.equal((html.match(/<li><strong>/g)||[]).length,3);
    assert.equal((html.match(/class="owned-feature-card"/g)||[]).length,3);
    for (const h of p[lang].highlights) { assert.ok(html.includes(escaped(h.value))); assert.ok(html.includes(escaped(h.label))); }
    assert.equal((html.match(/class="owned-features__source"/g)||[]).length,1);
    assert.ok(html.includes(`href="${escaped(p.source)}"`));
    assert.ok(html.includes(lang==='ja'?'にリポジトリと照合':'checked against the repository on'));
    for (const fc of p[lang].features) { assert.ok(html.includes(escaped(fc.title))); assert.ok(html.includes(escaped(fc.body))); for (const t of fc.tags) assert.ok(html.includes(escaped(t))); }
    assert.equal(productNavigation(p,lang).site,config.origin+route);
  });
}

test('unknown IDs and language values cannot become output paths',()=>{
  for(const id of ['../private','constructor','other'])assert.throws(()=>landingRoute(id,'ja'),TypeError);
  assert.throws(()=>landingRoute('genie','fr'),TypeError);
});

test('registry text is escaped in the renderer',()=>{
  const p=structuredClone(products.find(p=>p.id==='genie'));
  p.name='<script>bad</script>'; p.ja.scope='<img onerror="bad">';
  const html=renderProductLanding(p,'ja',config,'https://example.org/film.mp4');
  assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));
  assert.ok(html.includes('&lt;img onerror=&quot;bad&quot;&gt;'));
  assert.equal((html.match(/<script\b/g)||[]).length,1);
});

test('every product CTA states a concrete action and sets click expectations',()=>{
  const productDestinations = new Set();
  for(const id of landingIds) for(const lang of ['ja','en']) {
    const x=landingExperience[id][lang];
    const [label,href]=x.primary;
    assert.ok(label.length>=8,`${id}/${lang} primary CTA too vague`);
    assert.equal(new URL(href).protocol,'https:');
    assert.ok(x.tryNow.length>=18,`${id}/${lang} missing first-task description`);
    assert.ok(x.actionNote.length>=24,`${id}/${lang} missing post-click expectation`);
    assert.doesNotMatch(label,/^(見る|開く|詳しく見る|Learn more|Open|View)$/i);
    productDestinations.add(id);
  }
  assert.equal(productDestinations.size,6);
});

test('landing player has no telemetry, persistence, form or model transport',async()=>{
  const js=await fs.readFile(path.join(root,'public/assets/product-landings.js'),'utf8');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|\.submit\(/);
  assert.match(js,/addEventListener\('click'/);assert.match(js,/video\.play\(\)/);
  for(const id of landingIds)assert.ok(js.includes(`'${id}'`));
});

test('product-page capabilities come from the ledger only, and stay inside what was verified',()=>{
  // Checked 2026-09-27 against each product repository. These phrases were removed or qualified because
  // the repositories do not implement them or do not measure them; they must not come back through page copy.
  const unverified=/Notion|(?<!No )CRM\s*(自動|sync|integration)|最短即日|最短数分|in minutes|no data leaks|zero telemetry|高速|hallucination|ハルシネーション|\bWriter\b|\bEditor\b|手間をゼロ|手戻り.*ゼロ|eliminat/i;
  for (const p of products) for (const lang of ['ja','en']) {
    const x=p[lang];
    assert.equal(x.highlights.length,3,`${p.id}/${lang} highlights`);
    assert.equal(x.features.length,3,`${p.id}/${lang} features`);
    for (const h of x.highlights) { assert.ok(h.value&&h.label); assert.doesNotMatch(h.value+' '+h.label,unverified,`${p.id}/${lang}: ${h.value}`); }
    for (const fc of x.features) {
      assert.ok(fc.code&&fc.title&&fc.body&&fc.tags.length===3,`${p.id}/${lang}: ${fc.code}`);
      assert.doesNotMatch([fc.title,fc.body,...fc.tags].join(' '),unverified,`${p.id}/${lang}: ${fc.title}`);
    }
    const page=landingExperience[p.id][lang];
    assert.ok(!('highlights' in page)&&!('featureCards' in page)&&!('features' in page),`${p.id}/${lang}: page copy must not carry its own capability claims`);
    assert.doesNotMatch(JSON.stringify(page),unverified,`${p.id}/${lang}: page copy`);
  }
});

test('capability layer reaches the shared stylesheet exactly once',async()=>{
  const css=await fs.readFile(path.join(root,'dist','assets','showcase.css'),'utf8');
  assert.equal((css.match(/\/\* REACHMADE_PRODUCT_CAPABILITIES \*\//g)||[]).length,1);
  assert.equal((css.match(/\.owned-product \.owned-hero-badges\{display:grid/g)||[]).length,1);
  assert.equal((css.match(/\.owned-product \.owned-feature-card\{background/g)||[]).length,1);
  assert.match(css,/@media \(forced-colors:active\)\{\s*\.owned-product \.owned-hero-badges-bar/);
});

test('Genie shows five labelled next-UI design frames and its app icon; the other products are unchanged',async()=>{
  for (const lang of ['ja','en']) {
    const x=landingExperience.genie[lang];
    const html=await fs.readFile(path.join(root,'dist',landingRoute('genie',lang),'index.html'),'utf8');
    assert.equal((html.match(/class="owned-next-ui__frame"/g)||[]).length,5);
    assert.equal(html.split(escaped(x.nextUi.label)).length-1,5,'each frame carries the design-preview label');
    assert.ok(html.includes(escaped(x.nextUi.intro)));
    assert.match(x.nextUi.intro,lang==='ja'?/実アプリの録画ではありません/:/not a recording of the app/);
    assert.match(x.nextUi.intro,lang==='ja'?/コマの中の内容は架空の例です/:/The content inside the frames is fictional/);
    assert.ok(html.includes(`<p class="owned-icon-note">${escaped(x.iconNote)}</p>`),'the icon is marked as not yet in the current app');
    assert.match(x.iconNote,lang==='ja'?/現行版のアプリにはまだ入っていません/:/not yet in the current app/);
    assert.ok(html.includes(escaped(x.nextUi.studyLabel)),'the external design film link says where it goes');
    // Checked 2026-09-28 against FORIFOR/genie: the five screens exist on main; the one-surface redesign is on an
    // unmerged branch and not verified on a device. "Not implemented" would be false, "shipped" would be false.
    assert.doesNotMatch(JSON.stringify(x.nextUi),/未実装|not implemented|実装済み|shipped|available now/i);
    for (const [i,f] of x.nextUi.frames.entries()) {
      assert.equal(f.src,`/assets/products/genie/next-ui-0${i+1}.jpg`);
      assert.ok(f.alt.length>10);
      assert.ok(html.includes(`<a href="${f.src}"><img src="${f.src}" width="1600" height="900" loading="lazy" decoding="async" alt="${escaped(f.alt)}">`));
      await fs.access(path.join(root,'dist',f.src));
    }
    assert.match(html,/<h1><img class="owned-product-icon" src="\/assets\/products\/genie\/icon-128\.png" width="128" height="128" alt="">/);
    await fs.access(path.join(root,'dist',x.icon));
  }
  for (const id of landingIds.filter(id=>id!=='genie')) for (const lang of ['ja','en']) {
    const html=await fs.readFile(path.join(root,'dist',landingRoute(id,lang),'index.html'),'utf8');
    assert.doesNotMatch(html,/owned-next-ui|owned-product-icon|owned-icon-note/,`${id}/${lang} keeps its current boundaries`);
    assert.match(html,lang==='ja'?/別公開の設計動画は、次のUIを考えるためのプレビューです/:/The separate design film is a proposal for a future interface/);
  }
});

test('a missing Genie next-UI frame stops the build instead of shipping a broken figure',async()=>{
  const { writeProductLandings } = await import('../src/product-landings.mjs');
  const { recordings } = await import('../src/films.mjs');
  const tmp=await fs.mkdtemp(path.join((await import('node:os')).tmpdir(),'landing-'));
  try { await assert.rejects(writeProductLandings(tmp,products,config,recordings),/Missing landing asset for genie\/ja/); }
  finally { await fs.rm(tmp,{recursive:true,force:true}); }
});
