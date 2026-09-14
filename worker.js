import { products } from './src/products.mjs';

// The product registry is the single source for both the directory and aliases.
// A new record with labSite + site automatically receives the same redirect behavior.
const productSites = Object.fromEntries(
  products
    .filter(product => product.labSite && product.site)
    .map(product => [new URL(product.labSite).hostname, product.site]),
);

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
