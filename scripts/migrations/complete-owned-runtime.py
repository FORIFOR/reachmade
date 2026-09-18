#!/usr/bin/env python3
"""Finish same-origin delivery without weakening the site's Content-Security-Policy."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
p=ROOT/'worker.js';s=p.read_text()
if "import { serveOwnedRecording }" not in s:
 s="import { serveOwnedRecording } from './src/owned-recording-response.mjs';\n"+s
 s=s.replace('    const recording = await serveStaticRecording(request, env.ASSETS);','    const ownedRecording = await serveOwnedRecording(request, env.ASSETS);\n    if (ownedRecording) return ownedRecording;\n    const recording = await serveStaticRecording(request, env.ASSETS);')
p.write_text(s)
artifact=ROOT/'public/media/originals/genie/orbit.html';text=artifact.read_text();generated=[];excluded=[]
if re.search(r'<script\b[^>]*\bsrc\s*=\s*[\"\']https?://',text,re.I):
 raise RuntimeError('Orbit contains external script dependencies requiring explicit review')
if re.search(r'\son[a-z]+\s*=',text,re.I):
 raise RuntimeError('Orbit contains inline event handlers requiring explicit migration')
for tag,ext,kind in [('style','css','style'),('script','js','script')]:
 pattern=re.compile(r'<'+tag+r'(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</'+tag+r'>',re.I)
 def externalize(m):
  attrs=m.group('attrs');body=m.group('body')
  if tag=='script':
   type_match=re.search(r'\btype\s*=\s*[\"\']([^\"\']+)',attrs,re.I)
   script_type=type_match.group(1).lower() if type_match else ''
   # Speculative navigation and the old host's challenge loader are hosting
   # infrastructure, not part of the generated planet demonstration.
   if script_type=='speculationrules' or ('__CF$cv$params' in body and '/cdn-cgi/challenge-platform/' in body):
    excluded.append({'type':script_type or 'legacy-host-challenge','sha256':hashlib.sha256(body.encode()).hexdigest()});return ''
   if re.search(r'\bsrc\s*=',attrs) or script_type in {'application/json','application/ld+json'}:return m.group(0)
   if script_type not in {'','module','text/javascript','application/javascript'}:raise RuntimeError('Review unknown script type: '+script_type)
  name=f'orbit-{kind}-{len(generated)}.{ext}';dest=artifact.parent/name
  dest.write_text(body);generated.append(dest)
  return f'<link rel="stylesheet" href="/media/originals/genie/{name}">' if tag=='style' else f'<script{attrs} src="/media/originals/genie/{name}"></script>'
 text=pattern.sub(externalize,text)
from html.parser import HTMLParser
from html import escape
class StyledTags(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=False);self.parts=[];self.rules=[]
 def handle_starttag(self,tag,attrs):
  if not any(k=='style' for k,v in attrs):self.parts.append(self.get_starttag_text());return
  style=next(v for k,v in attrs if k=='style');cls=f'owned-style-{len(self.rules)}';self.rules.append(f'.{cls}{{{style}}}')
  clean=[(k,(v+' '+cls if k=='class' else v)) for k,v in attrs if k!='style']
  if not any(k=='class' for k,v in clean):clean.append(('class',cls))
  self.parts.append('<'+tag+''.join(' '+k+(('="'+escape(v,quote=True)+'"') if v is not None else '') for k,v in clean)+'>')
 def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
 def handle_endtag(self,tag):self.parts.append('</'+tag+'>')
 def handle_data(self,data):self.parts.append(data)
 def handle_entityref(self,name):self.parts.append('&'+name+';')
 def handle_charref(self,name):self.parts.append('&#'+name+';')
 def handle_comment(self,data):self.parts.append('<!--'+data+'-->')
 def handle_decl(self,data):self.parts.append('<!'+data+'>')
parser=StyledTags();parser.feed(text);text=''.join(parser.parts)
if parser.rules:
 dest=artifact.parent/'orbit-inline-styles.css';dest.write_text('\n'.join(parser.rules)+'\n');generated.append(dest)
 text=text.replace('</head>','<link rel="stylesheet" href="/media/originals/genie/orbit-inline-styles.css"></head>')
if 'rel="icon"' not in text:text=text.replace('</head>','<link rel="icon" href="/assets/mark.svg"></head>')
artifact.write_text(text)
inventory=ROOT/'public/media/originals/manifest.json';manifest=json.loads(inventory.read_text())
for f in [artifact,*generated]:
 raw=f.read_bytes();record={'path':'/'+str(f.relative_to(ROOT/'public')),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
 previous=next((r for r in manifest['files'] if r['path']==record['path']),None)
 if previous:previous.update(record)
 else:manifest['files'].append(record)
inventory.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'docs/owned-artifact-migration.json').write_text(json.dumps({'externalized':[str(f.relative_to(ROOT/'public')) for f in generated],'excluded_host_infrastructure':excluded,'site_csp_unchanged':True},indent=2)+'\n')
print('ORBIT_STATIC_DEPENDENCIES',json.dumps([str(f.relative_to(ROOT/'public')) for f in generated]))
print('ORBIT_EXCLUDED_HOST_INFRASTRUCTURE',json.dumps(excluded))
print('ORBIT_CONTROLS',re.findall(r'<(?:button|canvas)\b[^>]*>',text))
