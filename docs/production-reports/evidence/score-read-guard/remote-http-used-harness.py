import sys,json,urllib.request,hashlib,subprocess
from pathlib import Path
if sys.stdin.isatty():subprocess.run(['stty','-echo'],check=True)
print('Ready for private Site verification input (hidden).',flush=True)
data=json.loads(sys.stdin.readline());root='https://neon-catcher-pruebas.chictide18.chatgpt.site'
report={'kind':'Authenticated read-only remote HTTP verification','url':root,'checks':[],'errors':[]}
try:
 for p in ['/', '/clasico-actual/build-info.json','/clasico-actual/juego/game.js']:
  req=urllib.request.Request(root+p,headers={'OAI-Sites-Authorization':'Bearer '+data['token'],'Cache-Control':'no-cache'})
  with urllib.request.urlopen(req,timeout=30) as res:
   body=res.read();status=res.status;ctype=res.headers.get('Content-Type','')
  assert status==200
  item={'path':p,'status':status,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()}
  if p.endswith('build-info.json'):
   info=json.loads(body);assert info['commit']==data['expectedCommit'] and not info['dirty'];item.update(commit=info['commit'],revision=info['revision'])
  elif p.endswith('game.js'):
   assert item['sha256']==data['gameSha256']
  else:
   assert b'clasico-actual/juego/index.html' in body
  report['checks'].append(item)
 report['status']='passed';report['exitCode']=0
except Exception as e:
 report['status']='failed';report['exitCode']=1;report['errors'].append({'type':type(e).__name__,'message':str(e).replace(data['token'],'[redacted]')})
Path('/tmp/neon-score-guard-remote-http.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report),flush=True)
sys.exit(report['exitCode'])
