import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as buildCore, root, validateConfig } from './build-core.mjs';
import { products } from '../src/products.mjs';
import { recordings } from '../src/films.mjs';
import { writeProductLandings } from '../src/product-landings.mjs';
import { writeInquiryPages } from '../src/inquiry-page.mjs';
export { root, escapeHTML, validateConfig } from './build-core.mjs';

export async function build() {
  const routes = await buildCore();
  const config = validateConfig(JSON.parse(await fs.readFile(path.join(root,'site.config.json'),'utf8')));
  const dist = path.join(root,'dist');
  routes.push(...await writeProductLandings(dist,products,config,recordings));
  await writeInquiryPages(dist);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(r=>`<url><loc>${config.origin}${r.route}</loc></url>`).join('\n')}\n</urlset>\n`;
  await fs.writeFile(path.join(dist,'sitemap.xml'),sitemap);
  await fs.writeFile(path.join(root,'docs/routes.json'),JSON.stringify(routes,null,2)+'\n');
  console.log(`Built ${routes.length} localized portfolio/product pages + 404. Existing product aliases are unchanged.`);
  return routes;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await build();
