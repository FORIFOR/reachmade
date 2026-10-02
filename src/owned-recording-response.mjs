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
 ['/media/films/oathra-30s.mp4','oathra'],
 ['/media/films/agent-team-design-30s.mp4','agent-team'],
 // The Japanese home's clips cut from the owner's 2026-09-30 films (src/home-v4.mjs HOME_REC).
 ['/media/films/home-agent-team-13s.mp4','agent-team'],
 ['/media/films/home-oathra-13s.mp4','oathra'],
 // Genie's TaskDock reconstruction: the home clip and the product page's top film (2026-09-30).
 ['/media/films/genie-taskdock-13s.mp4','genie'],
 // 星藍ノア's introduction film: the owned original is also the film on the Japanese product page.
 ['/media/originals/noa/lp-film.mp4','noa'],
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
