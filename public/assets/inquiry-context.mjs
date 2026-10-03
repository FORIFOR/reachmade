/** Local navigation context, not analytics. No IO or visitor identifiers. */
const products = Object.freeze({genie:['Genie','genie'],'ai-meeting':['AI Meeting','tasks'],oathra:['Oathra','oathra'],aisecure:['AI Secure','aisecure'],'agent-team':['Agent Team','agent-team'],launchloom:['Launchloom','launchloom'],noa:['星藍ノア / Noa','custom']});
const services = Object.freeze({
  '01': ['業務AI・エージェント実装','AI workflows and agents'],
  '02': ['音声・電話AIの開発','Voice and phone AI'],
  '03': ['新しいAIプロダクトの試作','New AI product prototypes'],
  'voice-ai': ['音声AIの実現性検証','Voice AI feasibility'],
  'ai-character': ['AIキャラクターの実現性検証','AI character feasibility'],
});

export const inquiryContextIds = Object.freeze([...Object.keys(products).map(id=>`product-${id}`), ...Object.keys(services).map(id=>`service-${id}`)]);

export function inquiryContext(hash = '', search = '', language = 'ja') {
  if (!['ja','en'].includes(language)) throw new TypeError('Unsupported inquiry language');
  const ja = language === 'ja', params = new URLSearchParams(search);
  // Exact allowlisted fragments only. Unknown fragments never import URL text.
  // Older product/service query links remain usable, without adding new query links.
  const fragment = /^#(product|service)-([a-z0-9-]+)$/.exec(hash);
  const kind = fragment?.[1] || (params.has('product') ? 'product' : 'service');
  const id = fragment?.[2] || params.get(kind);
  if (kind === 'product' && Object.hasOwn(products, id)) {
    const [name, useCase] = products[id];
    return {id:`product-${id}`, useCase, label:ja?`${name}を見ての開発相談`:`A project inspired by ${name}`, message:ja?`${name}の技術を活かした開発について相談したいです。\n\n対象の業務・試したいこと：\n現在の状況：`:`I would like to discuss a project using the technology behind ${name}.\n\nWorkflow or experience to try:\nCurrent situation:`};
  }
  if (kind === 'service' && Object.hasOwn(services, id)) {
    const label = services[id][ja ? 0 : 1];
    return {id:`service-${id}`, useCase:'custom', label, message:ja?`相談テーマ：${label}\n\n試したい場面：\nAIに任せたいこと：\n人が確認すること：\n時期・現在の状況（任意）：`:`Topic: ${label}\n\nScenario to try:\nWhat AI should handle:\nWhat a person should review:\nTiming / current situation (optional):`};
  }
  return null;
}

/** A template is a user-triggered convenience; existing work is never replaced. */
export function canInsertInquiryTemplate({message, useCase, busy, unresolved, accepted}) {
  return !busy && !unresolved && !accepted && !message.trim() && useCase === 'custom';
}
