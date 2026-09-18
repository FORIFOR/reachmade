import { serveOwnedRecording } from './src/owned-recording-response.mjs';
import { ownedAliasTarget } from './src/owned-aliases.mjs';
import { products } from './src/products.mjs';
import { serveStaticRecording } from './src/static-recordings.mjs';
import { handleInquiry } from './src/inquiries.mjs';

const productSites = Object.fromEntries(products.filter(product => product.labSite && product.site).map(product => [new URL(product.labSite).hostname, (product.appSite || product.site)]));
function productRedirect(url) {
  const owned = ownedAliasTarget(url);
  if (owned) return owned;
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
      return Response.redirect(url.toString(), request.method === 'GET' || request.method === 'HEAD' ? 301 : 308);
    }
    const productTarget = productRedirect(url);
    if (productTarget) return Response.redirect(productTarget.toString(), 302);
    const inquiry = await handleInquiry(request);
    if (inquiry) return inquiry;
    const ownedRecording = await serveOwnedRecording(request, env.ASSETS);
    if (ownedRecording) return ownedRecording;
    const recording = await serveStaticRecording(request, env.ASSETS);
    if (recording) return recording;
    const asset = await env.ASSETS.fetch(request);
    if (['/contact/','/en/contact/','/contact/index.html','/en/contact/index.html'].includes(url.pathname) && asset.status === 200) {
      const headers = new Headers(asset.headers);
      headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; frame-ancestors 'none'; form-action 'none'; upgrade-insecure-requests");
      headers.set('Cache-Control','no-store');
      return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
    }
    return asset;
  },
};
