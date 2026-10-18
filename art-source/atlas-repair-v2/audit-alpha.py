#!/usr/bin/env python3
"""Production atlas contour checks. No runtime or engine mutation."""
from pathlib import Path
from PIL import Image
import json,hashlib,datetime
D=Path(__file__).resolve().parent;R=D.parents[1]
p=R/'assets/guardian_atlas_states_v2.webp';im=Image.open(p).convert('RGBA');checks=[];frames=[]
def check(name,ok,details=None):
 checks.append({'name':name,'passed':bool(ok),'details':details});assert ok,name
check('runtime-2048x1024-integer-square-cells',im.size==(2048,1024))
check('runtime-alpha',p.read_bytes()[:4]==b'RIFF' and im.getchannel('A').getextrema()==(0,255))
for n in range(8):
 x,y=(n%4)*512,(n//4)*512;c=im.crop((x,y,x+512,y+512));a=c.getchannel('A');bb=a.getbbox();m=[bb[0],bb[1],512-bb[2],512-bb[3]];a8=a.point(lambda v:255 if v>=8 else 0).getbbox();m8=[a8[0],a8[1],512-a8[2],512-a8[3]]
 check(f'frame-{n}-no-pixels-on-cell-border',all(a.crop(box).getbbox() is None for box in [(0,0,512,1),(0,511,512,512),(0,0,1,512),(511,0,512,512)]))
 check(f'frame-{n}-24px-entire-alpha-padding',min(m)>=24,m)
 check(f'frame-{n}-32px-visible-alpha-padding',min(m8)>=32,m8)
 frames.append({'index':n,'alphaBounds':bb,'padding':m,'visibleAlpha8Padding':m8,'sha256Rgba':hashlib.sha256(c.tobytes()).hexdigest()})
check('eight-genuinely-distinct-images',len(set(f['sha256Rgba'] for f in frames))==8)
out={'time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS','scope':'Asset pixel QA only. No claim of runtime integration, gameplay, artistic acceptance, or physical device certification.','runtime':str(p.relative_to(R)),'runtimeSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'checks':checks,'caseCount':len(checks),'frames':frames}
(D/'alpha-qa.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'passed':len(checks),'failed':0,'minAllAlphaPadding':min(min(f['padding']) for f in frames),'minVisibleAlphaPadding':min(min(f['visibleAlpha8Padding']) for f in frames)},indent=2))
