#!/usr/bin/env python3
"""Pack the generated edit into integer cells; no reconstructed geometry or painted sprites.
Image generation edited the supplied original; this step aligns, resamples, and exports it.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
SOURCE=HERE/'guardian-atlas-generated-edit-master.png'
OUT=ROOT/'assets/guardian_atlas_states_v2.webp'
im=Image.open(SOURCE).convert('RGBA')
assert im.size==(1774,887)
xs=[0,444,887,1331,1774];ys=[0,444,887]
pivots=[(224,262),(224,262),(223,262),(223,262),(225,249),(222,226),(224,226),(223,247)]
names=['arrival-closed','idle-open','attack-windup-closed','fire-closed','hurt-open','phase-break-open-ring','phase-two-fire-closed','disabled-restored']
SCALE=.90
packed=Image.new('RGBA',(2048,1024))
frames=[]
(HERE/'frames').mkdir(exist_ok=True)
for n,name in enumerate(names):
 row,col=divmod(n,4)
 cell=im.crop((xs[col],ys[row],xs[col+1],ys[row+1]))
 alpha=cell.getchannel('A')
 # Generator included nearly transparent residual pixels across nominal cell borders.
 # Trim only the outside of its visible-alpha bbox, keeping all alpha inside that box.
 bbox=alpha.point(lambda v:255 if v>=8 else 0).getbbox()
 assert bbox
 cropped=cell.crop(bbox)
 size=tuple(round(v*SCALE) for v in cropped.size)
 cropped=cropped.resize(size,Image.Resampling.LANCZOS)
 px,py=pivots[n]
 dest=(round(256+(bbox[0]-px)*SCALE),round(256+(bbox[1]-py)*SCALE))
 tile=Image.new('RGBA',(512,512));tile.alpha_composite(cropped,dest)
 tile.save(HERE/'frames'/f'{n:02d}-{name}.png')
 packed.alpha_composite(tile,(col*512,row*512))
 frame_alpha=tile.getchannel('A')
 a8=frame_alpha.point(lambda v:255 if v>=8 else 0).getbbox()
 frames.append({'index':n,'state':name,'rect':[col*512,row*512,512,512],'sourceRect':[xs[col],ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row]],'sourcePivot':list(pivots[n]),'pivot':{'x':.5,'y':.5},'alpha8Bounds':list(a8),'alpha8Margins':[a8[0],a8[1],512-a8[2],512-a8[3]],'sha256Rgba':hashlib.sha256(tile.tobytes()).hexdigest()})
packed.save(HERE/'guardian-atlas-packed-master.png')
packed.save(OUT,format='WEBP',quality=92,method=6,exact=True)
# Contact sheets are diagnostics only, never the production asset.
for bg,name in [('#35404d','dark'),('#e2e4e8','light')]:
 sheet=Image.new('RGBA',packed.size,bg);sheet.alpha_composite(packed);draw=ImageDraw.Draw(sheet)
 for f in frames:
  x,y,w,h=f['rect'];draw.rectangle((x,y,x+w-1,y+h-1),outline='#a0a0a0');draw.text((x+8,y+8),f"{f['index']} {f['state']}",fill='#ffb400');draw.line((x+256-7,y+256,x+256+7,y+256),fill='#00ff9b');draw.line((x+256,y+256-7,x+256,y+256+7),fill='#00ff9b')
 sheet.convert('RGB').save(HERE/f'qa-contact-{name}.jpg',quality=93)
meta={'version':'guardian-atlas-v2','status':'IN_REVIEW','runtimeIntegrated':False,'artisticAcceptance':'PENDING_OWNER','physicalAcceptance':'PENDING','source':str(SOURCE.relative_to(ROOT)),'master':'art-source/atlas-repair-v2/guardian-atlas-packed-master.png','runtime':'assets/guardian_atlas_states_v2.webp','dimensions':[2048,1024],'cellDimensions':[512,512],'columns':4,'rows':2,'rgbaDecodedBytes':2048*1024*4,'packScale':SCALE,'sourceCellBoundaries':{'x':xs,'y':ys},'alphaTrimRule':'Trim only pixels outside visible alpha>=8 bbox in each generated source cell; retain alpha inside. Resample LANCZOS once.','minimumAlpha8Padding':min(min(f['alpha8Margins']) for f in frames),'frames':frames,'files':[],'playbackNote':'Eight distinct state poses, not eight fully animated sequences. Source0/2/3/6 have sealed chest; 1/4/5 have exposed reactor; 7 is disabled cyan. Runtime must animate articulated doors separately if using a continuous opening sequence.','drawScaleGuidance':'Normal metal spans ~365px of each512px cell, compared to ~400px of a443.5px legacy cell. Increase visual-only draw size about1.25x to preserve visible boss body size; preserve gameplay hitboxes.','rights':'Original built-in image generation edit using the retained original Guardian Atlas master. No externally licensed artwork, downloaded model, paid API, or purchased resource.'}
meta['visualMuzzleAnchors']={'coordinateSpace':'512x512 atlas-local pixels; artwork landmarks only, not hitboxes or new ballistic aim rules','state3':{'upperLeft':[128,269],'lowerLeft':[128,327],'upperRight':[384,269],'lowerRight':[384,327]},'state6':{'upperLeft':[130,267],'lowerLeft':[132,325],'upperRight':[386,267],'lowerRight':[386,325]},'tolerancePixels':3}
for p in [SOURCE,HERE/'guardian-atlas-packed-master.png',OUT]:
 meta['files'].append({'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(HERE/'metadata.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({'dimensions':meta['dimensions'],'runtimeBytes':OUT.stat().st_size,'decoded':meta['rgbaDecodedBytes'],'minPaddingAlpha8':meta['minimumAlpha8Padding'],'statesDistinct':len(set(f['sha256Rgba'] for f in frames)),'margins':[f['alpha8Margins'] for f in frames]},indent=2))
