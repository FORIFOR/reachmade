/** Reuse the tested bounded Range/HEAD implementation for the imported originals and the fifteen-second films. */
import {serveStaticRecording} from './static-recordings.mjs';
const originals=new Map([
 ...['genie-omni-preview','genie-orbit-social','genie-orbit-web','genie-product-film-social','genie-product-film-web','genie-web-proposal-social','genie-web-proposal-web'].map(name=>[`/media/originals/genie/assets/${name}.mp4`,'genie']),
 ['/media/originals/ai-meeting/demo.mp4','ai-meeting'],
 // The fifteen-second films (src/fifteen-second-films.mjs). The ID only admits the path to the
 // tested Range route; the file served is the film itself. Safari needs 206 to play video.
 ['/media/films/reachmade-15s.mp4','genie'],
 ['/media/films/genie-15s.mp4','genie'],
 ['/media/films/oathra-15s.mp4','oathra'],
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
