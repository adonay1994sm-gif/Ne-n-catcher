import json,sys,subprocess,urllib.request,hashlib,datetime,pathlib
subprocess.run(['stty','-echo'],check=True)
print('Ready for private HTTP settings on hidden stdin.',flush=True)
x=json.loads(sys.stdin.readline());out=pathlib.Path('/tmp/neon-pursuit-site-http');out.mkdir(exist_ok=True)
r={'status':'running','checks':[],'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'site':x['url'],'commit':x['commit'],'method':'Python urllib with configured environment transport','errors':[]}
try:
 for p,kind in [('/','launcher'),('/clasico-actual/build-info.json','provenance'),('/clasico-actual/juego/game.js','game'),('/clasico-actual/juego/assets/ch02_interceptor_atlas_v1.webp','asset')]:
  req=urllib.request.Request(x['url']+p,headers={'OAI-Sites-Authorization':'Bearer '+x['token'],'Cache-Control':'no-cache'})
  with urllib.request.urlopen(req,timeout=45)as response:b=response.read();status=response.status
  assert status==200
  digest=hashlib.sha256(b).hexdigest();entry={'path':p,'status':status,'bytes':len(b),'sha256':digest,'result':'passed'}
  if kind=='launcher':assert 'clasico-actual/juego/index.html'in b.decode()
  if kind=='provenance':
   d=json.loads(b);assert d['commit']==x['commit']and d['revision']==x['revision']and d['dirty']is False;entry['commit']=d['commit']
  if kind=='game':assert digest==x['gameHash']
  if kind=='asset':assert digest==x['assetHash']
  r['checks'].append(entry)
 r['status']='passed';r['exitCode']=0
except Exception as e:r['status']='failed';r['exitCode']=1;r['failure']=str(e).replace(x['token'],'[redacted]')
(out/'results.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r));sys.exit(r['exitCode'])
