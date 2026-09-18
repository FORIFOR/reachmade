import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as buildCore, root, validateConfig } from './build-core.mjs';
import { products } from '../src/products.mjs';
import { recordings } from '../src/films.mjs';
import { writeProductLandings } from '../src/product-landings.mjs';
import { writeInquiryPages } from '../src/inquiry-page.mjs';
import { writeShowcase } from '../src/showcase.mjs';
import { bundleDemoAssets } from '../src/animated-demo-assets.mjs';
import { writeLabExperience } from '../src/lab-experience.mjs';
import { writeOwnedGuides } from '../src/owned-guides.mjs';
import { writeOutcomeFirst } from '../src/outcome-first.mjs';
export { root, escapeHTML, validateConfig } from './build-core.mjs';

export async function build() {
  const routes = await buildCore();
  const config = validateConfig(JSON.parse(await fs.readFile(path.join(root,'site.config.json'),'utf8')));
  const dist = path.join(root,'dist');
  routes.push(...await writeProductLandings(dist,products,config,recordings));
  await writeInquiryPages(dist);
  await writeShowcase(dist,products);
  await bundleDemoAssets(dist);
  await writeLabExperience(dist,products);
  await writeOutcomeFirst(dist,products);
  routes.push(...await writeOwnedGuides(dist));
  const showcaseRoutes = ['', 'en/', ...products.flatMap(p=>[`products/${p.id}/`,`en/products/${p.id}/`])];
  for (const route of showcaseRoutes) {
    const html = await fs.readFile(path.join(dist,route,'index.html'),'utf8');
    if (!html.includes('data-showcase="20260918"') || !html.includes('href="/assets/showcase.css"') || !html.includes('src="/assets/showcase.mjs"') || !html.includes('data-lab-experience="20260919-product-lab-1"') || !html.includes('data-outcome-first="20260919-outcome-1"')) {
      throw new Error(`Showcase build incomplete at /${route}`);
    }
    if (!route.includes('products/') && !html.includes('data-studio-choice="genie"')) {
      throw new Error(`Product selector missing at /${route}`);
    }
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(r=>`<url><loc>${config.origin}${r.route}</loc></url>`).join('\n')}\n</urlset>\n`;
  await fs.writeFile(path.join(dist,'sitemap.xml'),sitemap);
  await fs.writeFile(path.join(root,'docs/routes.json'),JSON.stringify(routes,null,2)+'\n');
  console.log(`Built ${routes.length} localized portfolio/product/guide pages + 404. Verified ${showcaseRoutes.length} integrated outcome-first pages.`);
  return routes;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await build();
