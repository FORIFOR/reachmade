import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductNavigation } from '../src/product-navigation.mjs';

const registryRecord = id => ({
  id,
  labSite: `https://${id}.example.org/`,
  site: 'https://original.example.org/',
  demo: 'https://original.example.org/recording',
  ja: { demoLabel: '録画を見る' },
  en: { demoLabel: 'Watch the recording' },
});
const expectedSites = {
  genie: ['https://genie.reachmade.com/ja.html', 'https://genie.reachmade.com/?lang=en'],
  'ai-meeting': ['https://ai-meeting.forifor.chatgpt.site/ja', 'https://ai-meeting.forifor.chatgpt.site/'],
  oathra: ['https://oathra.reachmade.com/', 'https://oathra.reachmade.com/en/'],
  aisecure: ['https://aisecure.reachmade.com/index.ja.html', 'https://aisecure.reachmade.com/'],
  'agent-team': ['https://multibot.reachmade.com/ja/', 'https://multibot.reachmade.com/'],
  launchloom: ['https://launchloom.reachmade.com/ja/', 'https://launchloom.reachmade.com/'],
};
for (const [id, sites] of Object.entries(expectedSites)) {
  for (const [index, language] of ['ja', 'en'].entries()) {
    test(`${id}: ${language} uses its explicit marketing page`, () => {
      const record = registryRecord(id);
      const before = structuredClone(record);
      const result = getProductNavigation(record, language);
      assert.equal(result.site, sites[index]);
      for (const url of [result.site, result.demo]) assert.equal(new URL(url).protocol, 'https:');
      assert.deepEqual(record, before, 'must not mutate the registry or Worker aliases');
    });
  }
}
for (const language of ['ja', 'en']) {
  test(`AI Meeting: ${language} separates introduction, tasks and source recording`, () => {
    const record = registryRecord('ai-meeting');
    const result = getProductNavigation(record, language);
    assert.equal(result.demo, 'https://ai-meeting.web.app/#tasks');
    assert.notEqual(new URL(result.site).hostname, new URL(result.demo).hostname);
    assert.equal(record.demo, 'https://original.example.org/recording');
    assert.match(result.demoLabel, language === 'ja' ? /タスク/ : /Japanese app UI/);
  });
}
test('Agent Team Japanese entry explains the workflow, not a live execution claim', () => {
  const result = getProductNavigation(registryRecord('agent-team'), 'ja');
  assert.equal(result.demo, 'https://multibot.reachmade.com/ja/');
  assert.equal(result.demoLabel, '依頼から受け取りまで見る');
});
test('existing recordings remain unchanged for products without a demo override', () => {
  for (const id of ['genie', 'oathra', 'aisecure', 'launchloom']) {
    const record = registryRecord(id);
    for (const language of ['ja', 'en']) {
      const result = getProductNavigation(record, language);
      assert.equal(result.demo, record.demo);
      assert.equal(result.demoLabel, record[language].demoLabel);
    }
  }
});
test('new products fall back to the registry, including a site without an alias', () => {
  const record = registryRecord('future-product');
  assert.equal(getProductNavigation(record, 'en').site, record.labSite);
  delete record.labSite;
  assert.equal(getProductNavigation(record, 'ja').site, record.site);
});
test('prototype property names cannot select a configured product', () => {
  for (const id of ['constructor', '__proto__', 'toString']) {
    const record = registryRecord(id);
    assert.equal(getProductNavigation(record, 'ja').site, record.labSite);
  }
});
test('unsupported languages fail clearly instead of silently choosing an unrelated page', () => {
  assert.throws(() => getProductNavigation(registryRecord('genie'), 'fr'), TypeError);
});
