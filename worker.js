import { products } from './src/products.mjs';
import { serveStaticRecording } from './src/static-recordings.mjs';
import { handleInquiry } from './src/inquiries.mjs';

const productSites = Object.fromEntries(products.filter(product => product.labSite && product.site).map(product => [new URL(product.labSite).hostname, product.site]));
function productRedirect(url) {
  const origin = productSites[url.hostname];
  if (!origin) return null;
  const target = new URL(origin);
  if (url.pathname !== '/') target.pathname = `${target.pathname.replace(/\/$/, '')}${url.pathname}`;
  target.search = url.search;
  return target;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.reachmade.com') {
      url.hostname = 'reachmade.com';
      // Never redirect an inquiry body using a method-changing 301.
      return Response.redirect(url.toString(), request.method === 'GET' || request.method === 'HEAD' ? 301 : 308);
    }
    const productTarget = productRedirect(url);
    if (productTarget) return Response.redirect(productTarget.toString(), 302);
    const inquiry = await handleInquiry(request);
    if (inquiry) return inquiry;
    const recording = await serveStaticRecording(request, env.ASSETS);
    if (recording) return recording;
    return env.ASSETS.fetch(request);
  },
};
