/** Migrate the marketing alias without moving the AI Meeting application's origin. */
export function ownedAliasTarget(url) {
  if (url.hostname !== 'genie.reachmade.com') return null;
  let pathname;
  if (['/', '/ja', '/ja/'].includes(url.pathname)) pathname = '/products/genie/';
  else if (['/en', '/en/'].includes(url.pathname)) pathname = '/en/products/genie/';
  else if (url.pathname === '/orbit.html') pathname = '/media/originals/genie/orbit.html';
  else if (url.pathname.startsWith('/assets/')) pathname = '/media/originals/genie' + url.pathname;
  else return null;
  const result = new URL(pathname, 'https://reachmade.com');
  result.search = url.search;
  return result;
}
