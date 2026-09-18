/** Compose existing entrypoints at build time; no second HTML script/style or client dependency. */
import fs from 'node:fs/promises';
import path from 'node:path';
const marker = '/* REACHMADE_UI_STORIES_BUNDLE */';
export async function bundleDemoAssets(dist) {
  const dir = path.join(dist,'assets');
  const [css, js, demoCSS, demoJS] = await Promise.all(['showcase.css','showcase.mjs','animated-demos.css','animated-demos.mjs'].map(file => fs.readFile(path.join(dir,file),'utf8')));
  if (!demoCSS.includes('.rm-live-demo') || !demoJS.includes('20260919-ui-stories-2')) throw new Error('UI demo assets are missing or stale');
  await fs.writeFile(path.join(dir,'showcase.css'),css.split(marker)[0].trimEnd()+'\n'+marker+'\n'+demoCSS);
  await fs.writeFile(path.join(dir,'showcase.mjs'),js.split(marker)[0].trimEnd()+'\n'+marker+"\nimport('./animated-demos.mjs').catch(() => { document.documentElement.dataset.demoState = 'unavailable'; });\n");
}
