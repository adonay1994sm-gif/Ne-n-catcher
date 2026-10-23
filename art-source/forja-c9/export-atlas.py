from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[2]
source=Path(__file__).with_name('generated-master.png')
im=Image.open(source).convert('RGBA')
atlas=Image.new('RGBA',(1024,1024))
for y in range(2):
 for x in range(2):
  tile=im.crop((x*im.width//2,y*im.height//2,(x+1)*im.width//2,(y+1)*im.height//2))
  tile.thumbnail((464,464),Image.Resampling.LANCZOS)
  atlas.alpha_composite(tile,(x*512+(512-tile.width)//2,y*512+(512-tile.height)//2))
out=root/'assets/forja_modules_atlas_v1.webp'
atlas.save(out,format='WEBP',quality=90,method=6)
meta={'version':1,'origin':'Original image generated with the available image_gen tool on 2026-10-18; no external purchased or third-party asset','master':str(source.relative_to(root)),'runtime':str(out.relative_to(root)),'dimensions':[1024,1024],'alpha':True,'cells':['scatter','needle','hull-ii','coolant-ii'],'cellSize':[512,512],'pivot':[.5,.5],'states':'Static hardware cards; gameplay projectiles use the existing animated pulse atlas. No claim of new gun animation frames.','bytes':out.stat().st_size,'decodedRGBABytes':1024*1024*4,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'artisticAcceptance':'PENDING_OWNER','physicalAcceptance':'PENDING'}
Path(__file__).with_name('metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(meta,ensure_ascii=False))
