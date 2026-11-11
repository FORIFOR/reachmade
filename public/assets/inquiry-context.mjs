/** Local navigation context, not analytics. No IO or visitor identifiers. */
const products = Object.freeze({genie:['Genie','genie'],'ai-meeting':['AI Meeting','tasks'],oathra:['Oathra','oathra'],aisecure:['AI Secure','aisecure'],'agent-team':['Agent Team','agent-team'],launchloom:['Launchloom','launchloom'],noa:['星藍ノア / Noa','custom']});
const services = Object.freeze({
  '01': ['業務AI・エージェント実装','AI workflows and agents'],
  '02': ['音声・電話AIの開発','Voice and phone AI'],
  '03': ['新しいAIプロダクトの試作','New AI product prototypes'],
  'voice-ai': ['音声AIの実現性検証','Voice AI feasibility'],
  'ai-character': ['AIキャラクターの実現性検証','AI character feasibility'],
});

// Visitors who want to use a product themselves, rather than commission work.
const uses = Object.freeze({launchloom:['Launchloom','launchloom']});
// 星藍ノア's own request pages (/products/noa/contact|sponsor|games/). The intake has no Noa category, so they file as custom.
const requests = Object.freeze({
  'noa-contact': [['星藍ノアへのお問い合わせ','星藍ノアへのお問い合わせです。\n\n内容（コラボ・出演・取材など）：\n希望の時期（任意）：'],['Contacting 星藍ノア (Noa)','This is an inquiry for 星藍ノア (Noa).\n\nTopic (collaboration, appearance, press, etc.):\nPreferred timing (optional):']],
  'noa-sponsor': [['星藍ノアの配信への広告掲載','星藍ノアの配信への広告掲載を相談したいです。\n\n会社・サービス名：\n掲載したい内容：\n希望の期間・時期：'],['Advertising on 星藍ノア (Noa)’s stream','I would like to discuss advertising on 星藍ノア (Noa)’s stream.\n\nCompany or service:\nWhat to show:\nPreferred period:']],
  'noa-game': [['星藍ノアにやって欲しいゲーム','星藍ノアにやって欲しいゲームのリクエストです。\n\nゲーム名：\n機種（PC・Switchなど）：\nおすすめの理由（任意）：'],['A game for 星藍ノア (Noa) to play','A game request for 星藍ノア (Noa).\n\nGame title:\nPlatform (PC, Switch, etc.):\nWhy you recommend it (optional):']],
});

export const inquiryContextIds = Object.freeze([...Object.keys(products).map(id=>`product-${id}`), ...Object.keys(services).map(id=>`service-${id}`), ...Object.keys(uses).map(id=>`use-${id}`), ...Object.keys(requests).map(id=>`use-${id}`)]);

export function inquiryContext(hash = '', search = '', language = 'ja') {
  if (!['ja','en'].includes(language)) throw new TypeError('Unsupported inquiry language');
  const ja = language === 'ja', params = new URLSearchParams(search);
  // Exact allowlisted fragments only. Unknown fragments never import URL text.
  // Older product/service query links remain usable, without adding new query links.
  const fragment = /^#(product|service|use)-([a-z0-9-]+)$/.exec(hash);
  const kind = fragment?.[1] || (params.has('product') ? 'product' : 'service');
  const id = fragment?.[2] || params.get(kind);
  if (kind === 'product' && Object.hasOwn(products, id)) {
    const [name, useCase] = products[id];
    return {id:`product-${id}`, useCase, label:ja?`${name}を見ての開発相談`:`A project inspired by ${name}`, message:ja?`${name}の技術を活かした開発について相談したいです。\n\n対象の業務・試したいこと：\n現在の状況：`:`I would like to discuss a project using the technology behind ${name}.\n\nWorkflow or experience to try:\nCurrent situation:`};
  }
  if (kind === 'use' && Object.hasOwn(requests, id)) {
    const [label, message] = requests[id][ja ? 0 : 1];
    return {id:`use-${id}`, useCase:'custom', label, message};
  }
  if (kind === 'use' && Object.hasOwn(uses, id)) {
    const [name, useCase] = uses[id];
    return {id:`use-${id}`, useCase, label:ja?`${name}を自分の製品で使いたい`:`Using ${name} for my product`, message:ja?`${name}を自分の製品で使いたいです。\n\n紹介したい製品：\n欲しい素材（横動画・縦動画・LP・投稿案）：`:`I would like to use ${name} for my own product.\n\nProduct to introduce:\nAssets I need (landscape film, vertical film, landing page, posts):`};
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
