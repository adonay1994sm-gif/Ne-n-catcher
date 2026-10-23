import subprocess, shutil, pathlib, json, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]; OUT=ROOT/'art-source/unified-flight'; OUT.mkdir(exist_ok=True)
files={
'atlas-generated-master.png':'/workspace/generated_images/exec-69d6dfd0-3aaf-443b-92a7-80c70aa2daa2.png',
'atlas-gutter-revision-master.png':'/workspace/generated_images/exec-4433da5b-3ca7-4aab-bb79-2245f0327e0f.png',
'weapons-generated-master.png':'/workspace/generated_images/exec-5ff6f83d-aae9-408d-b211-0715795d6c60.png',
'weapons-padded-master.png':'/workspace/generated_images/exec-f33cfd63-593c-4aba-8c5d-2ac3a6ef7cb8.png',
'space-generated-master.png':'/workspace/generated_images/exec-0f2e3669-cb79-498f-b9c5-af8c7fbc0e36.png'}
for name,src in files.items():
 if not (OUT/name).exists():shutil.copy2(src,OUT/name)
def run(*a):
 args=list(map(str,a))
 if args[-1].endswith('.png'):args[-1]='PNG32:'+args[-1]
 subprocess.run(['magick',*args],check=True)
def fmt(n):return f'{n:.4f}'
master=OUT/'atlas-generated-master.png'
# Separate overlapping bounding rectangles of bomber fire from the adjacent ship using actual alpha components.
# Keep the existing source RGB/alpha; this is packing, not a repainted frame.
for key,component in [('bomberApproach',227),('bomberCharge',225),('bomberFire',226)]:
 mask=OUT/f'{key}-packing-mask.png'
 run(master,'-alpha','extract','-threshold','3%','-define',f'connected-components:keep={component}','-define','connected-components:mean-color=true','-connected-components','8','-morphology','Dilate','Disk:5','-blur','0x1.2',mask)
 run(master,'(',mask,')','-alpha','off','-compose','CopyOpacity','-composite',OUT/f'{key}-isolated.png')
 # Multiply mask by original alpha to keep the original soft exterior transparencies.
 run(master,'-alpha','extract',mask,'-compose','Multiply','-composite',OUT/f'{key}-preserved-alpha.png')
 run(master,'(',OUT/f'{key}-preserved-alpha.png',')','-alpha','off','-compose','CopyOpacity','-composite',OUT/f'{key}-isolated.png')
frames={
 'stationIntact':dict(crop=[0,0,540,554],pivot=[280,289],scale=.78,source=master),
 'stationBroken':dict(crop=[540,0,553,554],pivot=[280,289],scale=.78,source=master),
 'gaia':dict(crop=[1093,0,443,554],pivot=[221.5,294],scale=.90,source=master),
 'bomberApproach':dict(crop=[0,548,540,476],pivot=[278,195],scale=.70,source=OUT/'bomberApproach-isolated.png'),
 'bomberCharge':dict(crop=[540,548,520,476],pivot=[274,195],scale=.70,source=OUT/'bomberCharge-isolated.png'),
 'bomberFire':dict(crop=[1008,548,528,476],pivot=[343,195],scale=.70,source=OUT/'bomberFire-isolated.png')}
run('-size','1536x1024','xc:rgba(0,0,0,0)','-type','TrueColorAlpha','-colorspace','sRGB',OUT/'atlas-packed-master.png')
for i,(key,v) in enumerate(frames.items()):
 x,y,w,h=v['crop'];s=v['scale'];tile=OUT/f'{key}-packed.png'
 dx=round(256-v['pivot'][0]*s);dy=round(256-v['pivot'][1]*s)
 run(v['source'],'-crop',f'{w}x{h}+{x}+{y}','+repage','-resize',f'{s*100:.3f}%','(', '-size','512x512','xc:rgba(0,0,0,0)','-type','TrueColorAlpha','-colorspace','sRGB',')','+swap','-geometry',f'+{dx}+{dy}','-compose','Over','-composite',tile)
 run(OUT/'atlas-packed-master.png',tile,'-geometry',f'+{(i%3)*512}+{(i//3)*512}','-compose','Over','-composite',OUT/'atlas-packed-master.png')
 v['runtimeCrop']=[(i%3)*512,(i//3)*512,512,512];v['runtimePivot']=[256,256]
run(OUT/'atlas-packed-master.png','-define','webp:method=6','-quality','84',ROOT/'assets/chronos_flight_atlas_v1.webp')
# Pack gun modules separately with mount roots aligned exactly; normalize cell spacing after generation.
weapons=OUT/'weapons-padded-master.png';gun_states={
'idle':[(90,0,210,724,191,614),(370,0,210,724,473.2,614)],
'charge':[(780,0,290,724,929.3,614),(1100,0,290,724,1238.1,614)],
'fire':[(1550,0,290,724,1693.9,614),(1830,0,290,724,1968.5,614)]}
run('-size','1536x512','xc:rgba(0,0,0,0)','-type','TrueColorAlpha','-colorspace','sRGB',OUT/'weapons-packed-master.png')
weapon_meta={}
for i,(state,guns) in enumerate(gun_states.items()):
 tile=OUT/f'weapons-{state}-packed.png';run('-size','512x512','xc:rgba(0,0,0,0)','-type','TrueColorAlpha','-colorspace','sRGB',tile)
 for j,g in enumerate(guns):
  x,y,w,h,px,py=g;destx=[154,358][j];s=.55;dx=round(destx-(px-x)*s);dy=round(440-(py-y)*s)
  part=OUT/f'weapons-{state}-{j}.png'
  run(weapons,'-crop',f'{w}x{h}+{x}+{y}','+repage','-resize','55%',part)
  run(tile,part,'-geometry',f'+{dx}+{dy}','-compose','Over','-composite',tile)
 run(OUT/'weapons-packed-master.png',tile,'-geometry',f'+{i*512}+0','-compose','Over','-composite',OUT/'weapons-packed-master.png')
 weapon_meta[state]={'crop':[i*512,0,512,512],'pivot':[256,440],'mounts':[[154,440],[358,440]],'muzzles':[[154,190],[358,190]],'sourceGunCrops':[list(g[:4]) for g in guns]}
run(OUT/'weapons-packed-master.png','-define','webp:method=6','-quality','87',ROOT/'assets/chronos_flight_weapons_v1.webp')
run(OUT/'space-generated-master.png','-resize','768x1152!','-define','webp:method=6','-quality','84',ROOT/'assets/chronos_flight_space_v1.webp')
def info(p,w,h,alpha):
 b=p.read_bytes();return {'path':str(p.relative_to(ROOT)),'width':w,'height':h,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'decodedRGBABytes':w*h*4,'alpha':alpha}
metadata={
 'id':'chronos-flight-visual-kit-v1','version':1,'status':'IN_REVIEW','artisticAcceptance':'PENDING_OWNER','physicalAcceptance':'PENDING','provenance':{'tool':'image_gen.imagegen','date':'2026-10-17','creativeWork':'Original generated illustrations informed by project-owned Chronos / Gaia / Cronos Prime references.','sourceReferences':['assets/cronos_level1_background.webp','art-source/references/gaia_enemy_dossier_v1.jpeg','art-source/references/cronos_prime_dossier_v1.jpeg'],'thirdPartyStockUsed':False},
 'atlas':{**info(ROOT/'assets/chronos_flight_atlas_v1.webp',1536,1024,True),'packedMaster':'art-source/unified-flight/atlas-packed-master.png','generatedMaster':'art-source/unified-flight/atlas-generated-master.png','frames':{key:{'crop':v['runtimeCrop'],'pivot':v['runtimePivot'],'sourceCrop':v['crop'],'sourcePivot':v['pivot'],'packingScale':v['scale']} for key,v in frames.items()},'animationNotes':'Station states share a reactor pivot. Bomber poses represent approach, mechanical weapon charging, firing; no animation controller or integration is claimed.'},
 'weapons':{**info(ROOT/'assets/chronos_flight_weapons_v1.webp',1536,512,True),'packedMaster':'art-source/unified-flight/weapons-packed-master.png','generatedMaster':'art-source/unified-flight/weapons-padded-master.png','frames':weapon_meta,'animationNotes':'Idle closed cowling; charge open capacitor rails; fire spread muzzle and short amber flare. Each pair has exact normalized mount centers x154/358 and basey440 for under-hull wing-root mounting.'},
 'space':{**info(ROOT/'assets/chronos_flight_space_v1.webp',768,1152,False),'generatedMaster':'art-source/unified-flight/space-generated-master.png','layerRole':'Deep-space plate only: no planet, station, ship or large object. Compose isolated atlas sprites independently for actual travel rather than background crossfade.'},
 'packingNotes':['Original generated masters retained unchanged.','ImageMagick crops, repacks, normalizes pivots, scales and compresses exports.','Bomber alpha-component masks prevent neighboring pose contamination where original rectangular bounding boxes overlap; original RGB and soft alpha retained inside expanded masks.','Runtime atlases use 512px square cells but gameplay pivots are explicitly declared; no source grid assumption.','This delivery provides real optimized assets, not renderer integration or gameplay certification.'],
 'masters':[]}
for p in sorted(OUT.glob('*master.png')):
 b=p.read_bytes();metadata['masters'].append({'path':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
metadata['totalRuntimeBytes']=sum(metadata[k]['bytes'] for k in ['atlas','weapons','space']);metadata['totalDecodedRGBABytes']=sum(metadata[k]['decodedRGBABytes'] for k in ['atlas','weapons','space'])
(OUT/'metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:metadata[k] for k in ['totalRuntimeBytes','totalDecodedRGBABytes']}))
for k in ['atlas','weapons','space']:print(k,metadata[k]['path'],metadata[k]['bytes'],metadata[k]['sha256'])
