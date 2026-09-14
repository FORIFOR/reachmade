const productSites = {
  'genie.reachmade.com': 'https://genie-forifor.forifor.chatgpt.site/',
  'ai-meeting.reachmade.com': 'https://ai-meeting.web.app/',
  'oathra.reachmade.com': 'https://forifor.github.io/oathra/',
  'aisecure.reachmade.com': 'https://forifor.github.io/AISecure/',
  'multibot.reachmade.com': 'https://forifor.github.io/Multibot/',
  'launchloom.reachmade.com': 'https://forifor.github.io/Launchloom/',
};

function productRedirect(url) {
  const origin = productSites[url.hostname];
  if (!origin) return null;

  const target = new URL(origin);
  if (url.pathname !== '/') {
    target.pathname = `${target.pathname.replace(/\/$/, '')}${url.pathname}`;
  }
  target.search = url.search;
  return target;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === 'www.reachmade.com') {
      url.hostname = 'reachmade.com';
      return Response.redirect(url.toString(), 301);
    }

    const productTarget = productRedirect(url);
    if (productTarget) return Response.redirect(productTarget.toString(), 302);

    return env.ASSETS.fetch(request);
  },
};
