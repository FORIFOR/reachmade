/** Reuse the tested bounded Range/HEAD implementation for eight imported originals. */
import {serveStaticRecording} from './static-recordings.mjs';
const originals=new Map([
 ...['genie-omni-preview','genie-orbit-social','genie-orbit-web','genie-product-film-social','genie-product-film-web','genie-web-proposal-social','genie-web-proposal-web'].map(name=>[`/media/originals/genie/assets/${name}.mp4`,'genie']),
 ['/media/originals/ai-meeting/demo.mp4','ai-meeting'],
]);
export async function serveOwnedRecording(request, assets) {
 const url=new URL(request.url), id=originals.get(url.pathname);
 if(!id)return null;
 const pathname=url.pathname;
 url.pathname=`/media/products/${id}.mp4`;
 return serveStaticRecording(new Request(url,request),{fetch:forwarded=>{
  const original=new URL(forwarded.url);original.pathname=pathname;
  return assets.fetch(new Request(original,forwarded));
 }});
}
