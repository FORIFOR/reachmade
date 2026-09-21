import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..',process.env.SERVE_ROOT||'dist');
const port=Number(process.env.PORT || 4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.vtt':'text/vtt; charset=utf-8','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json; charset=utf-8'};
// Mirror what public/_headers and worker.js actually serve, so a local review sees
// the real page: the module script runs and same-origin media is allowed to load.
const policy=connect=>`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src ${connect}; media-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; frame-ancestors 'none'; form-action 'none'`;
const contactRoutes=new Set(['/contact/','/en/contact/','/contact/index.html','/en/contact/index.html']);
const defaultHeaders={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Content-Security-Policy':policy("'none'"),'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()'};
await fs.access(path.join(root,'index.html')).catch(()=>{console.error('Build first: npm run build');process.exit(1);});
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD',...defaultHeaders});res.end();return;}
  const url=new URL(req.url,'http://localhost');let pathname;
  try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400,defaultHeaders);res.end();return;}
  if(pathname.includes('\0')||pathname.split('/').some(p=>p==='..'||p.startsWith('.'))||['/_headers','/_redirects'].includes(pathname)){res.writeHead(404,defaultHeaders);res.end();return;}
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403,defaultHeaders);res.end();return;}
  let stat;try{stat=await fs.stat(file);}catch{}
  if(stat?.isDirectory()){
   if(!url.pathname.endsWith('/')){res.writeHead(308,{'Location':url.pathname+'/'+url.search,...defaultHeaders});res.end();return;}
   file=path.join(file,'index.html');
  }
  let code=200,data;try{data=await fs.readFile(file);}catch{code=404;file=path.join(root,'404.html');data=await fs.readFile(file);}
  const headers={...defaultHeaders};
  if(contactRoutes.has(pathname))headers['Content-Security-Policy']=policy("'self'");
  res.writeHead(code,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store',...headers});res.end(req.method==='HEAD'?undefined:data);
 }catch(err){console.error('Local server error:',err.message);res.writeHead(500,defaultHeaders);res.end('Internal error');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Reachmade Lab preview: http://127.0.0.1:${port}`));
