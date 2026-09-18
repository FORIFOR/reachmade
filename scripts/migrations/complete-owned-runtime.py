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
# The owner's generated, standalone HTML uses inline code. Externalize fixed
# source blocks rather than granting unsafe-inline to the main site.
artifact=ROOT/'public/media/originals/genie/orbit.html';text=artifact.read_text();generated=[]
if re.search(r'<script\b[^>]*\bsrc\s*=\s*[\"\']https?://',text,re.I):
 raise RuntimeError('Orbit contains external script dependencies requiring explicit review')
if re.search(r'\son[a-z]+\s*=',text,re.I):
 raise RuntimeError('Orbit contains inline event handlers requiring explicit migration')
for tag,ext,kind in [('style','css','style'),('script','js','script')]:
 pattern=re.compile(r'<'+tag+r'(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</'+tag+r'>',re.I)
 def externalize(m):
  attrs=m.group('attrs')
  if tag=='script' and ('src=' in attrs or ('type=' in attrs and 'javascript' not in attrs)):return m.group(0)
  body=m.group('body');name=f'orbit-{kind}-{len(generated)}.{ext}';dest=artifact.parent/name
  dest.write_text(body);generated.append(dest)
  return f'<link rel="stylesheet" href="./{name}">' if tag=='style' else f'<script src="./{name}"></script>'
 text=pattern.sub(externalize,text)
# Inline style attributes are converted into fixed classes; preserve other attrs.
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
 text=text.replace('</head>','<link rel="stylesheet" href="./orbit-inline-styles.css"></head>')
artifact.write_text(text)
inventory=ROOT/'public/media/originals/manifest.json';manifest=json.loads(inventory.read_text())
for f in [artifact,*generated]:
 raw=f.read_bytes();record={'path':'/'+str(f.relative_to(ROOT/'public')),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
 previous=next((r for r in manifest['files'] if r['path']==record['path']),None)
 if previous:previous.update(record)
 else:manifest['files'].append(record)
inventory.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('ORBIT_STATIC_DEPENDENCIES',json.dumps([str(f.relative_to(ROOT/'public')) for f in generated]))
# Show enough evidence to choose an actual interaction assertion if the artifact
# layout changes. Do not call a service or submit a form here.
print('ORBIT_CONTROLS',re.findall(r'<(?:button|canvas)\b[^>]*>',text))
