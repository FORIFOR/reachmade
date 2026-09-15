/** Explicit, verified entry points. Keep marketing pages separate from apps.
 * These routes do not change the Worker aliases or guess a language from headers.
 * New products keep their registry URLs until they have a verified translation.
 */
const entries = {
  genie: {
    ja: { site: 'https://genie.reachmade.com/ja.html' },
    en: { site: 'https://genie.reachmade.com/?lang=en' },
  },
  'ai-meeting': {
    ja: {
      site: 'https://ai-meeting.forifor.chatgpt.site/ja',
      demo: 'https://ai-meeting.web.app/#tasks',
      demoLabel: 'タスクを試す（登録不要）',
    },
    en: {
      site: 'https://ai-meeting.forifor.chatgpt.site/',
      demo: 'https://ai-meeting.web.app/#tasks',
      demoLabel: 'Try tasks (Japanese app UI)',
    },
  },
  oathra: {
    ja: { site: 'https://oathra.reachmade.com/' },
    en: { site: 'https://oathra.reachmade.com/en/' },
  },
  aisecure: {
    ja: { site: 'https://aisecure.reachmade.com/index.ja.html' },
    en: { site: 'https://aisecure.reachmade.com/' },
  },
  'agent-team': {
    ja: {
      site: 'https://multibot.reachmade.com/ja/',
      demo: 'https://multibot.reachmade.com/ja/',
      demoLabel: '依頼から受け取りまで見る',
    },
    en: { site: 'https://multibot.reachmade.com/' },
  },
  launchloom: {
    ja: { site: 'https://launchloom.reachmade.com/ja/' },
    en: { site: 'https://launchloom.reachmade.com/' },
  },
};

export function getProductNavigation(product, language) {
  if (language !== 'ja' && language !== 'en') {
    throw new TypeError(`Unsupported product navigation language: ${language}`);
  }
  const entry = Object.hasOwn(entries, product.id) ? entries[product.id][language] : {};
  return {
    site: entry.site ?? product.labSite ?? product.site,
    demo: entry.demo ?? product.demo,
    demoLabel: entry.demoLabel ?? product[language].demoLabel,
  };
}
