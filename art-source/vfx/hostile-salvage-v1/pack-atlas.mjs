// Reproducible packing only. All artwork is in the preserved imagegen master.
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=path.dirname(fileURLToPath(import.meta.url));
const project=path.resolve(root,'../../..');
const master=path.join(root,'hostile-salvage-generated-master.png');
const packed=path.join(root,'hostile-salvage-packed-master.png');
const runtime=path.join(project,'assets/hostile_ordnance_atlas_v1.webp');
const framesDir=path.join(root,'frames');
const sha=data=>createHash('sha256').update(data).digest('hex');
const run=args=>execFileSync('magick',args,{maxBuffer:24*1024*1024});
mkdirSync(framesDir,{recursive:true});
const columns=[26,332,636,940];
const rows=[{y:18,height:296,kind:'scout-plasma',fps:12},
  {y:330,height:302,kind:'interceptor-dart',fps:12},
  {y:633,height:318,kind:'atlas-heavy-orb',fps:10},
  {y:956,height:264,kind:'salvage',fps:0}];
const denominations=['copper','silver','gold','stellar'];
const frames=[];
for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const index=row*4+col;
  const sourceRect={x:columns[col],y:rows[row].y,width:300,height:rows[row].height};
  const filename=`${String(index).padStart(2,'0')}-${row===3?denominations[col]:rows[row].kind+'-'+(col+1)}.png`;
  const framePath=path.join(framesDir,filename);
  run([master,'-crop',`${sourceRect.width}x${sourceRect.height}+${sourceRect.x}+${sourceRect.y}`,
    '+repage','-filter','Lanczos','-resize','216x216','-gravity','center','-background','none',
    '-extent','256x256',framePath]);
  frames.push({index,kind:rows[row].kind,...(row===3?{denomination:denominations[col]}:{}),
    sourceRect,rect:{x:col*256,y:row*256,width:256,height:256},
    source:`frames/${filename}`,pivot:{x:.5,y:.5},fps:rows[row].fps});
}
run(['montage',...frames.map(frame=>path.join(root,frame.source)),'-tile','4x4',
  '-geometry','256x256+0+0','-background','none',packed]);
run([packed,'-define','webp:method=6','-quality','88',runtime]);
run([packed,'-background','#07111f','-alpha','remove','-alpha','off',
  path.join(root,'contact-dark.png')]);
for(const frame of frames){
  const pixels=run([runtime,'-crop',`256x256+${frame.rect.x}+${frame.rect.y}`,
    '+repage','-depth','8','rgba:-']);
  let minX=256,minY=256,maxX=-1,maxY=-1,maximumBorderAlpha=0;
  let alphaPixels=0,visiblePixels=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const alpha=pixels[(y*256+x)*4+3];
    if(alpha){alphaPixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    if(alpha>32)visiblePixels++;
    if(x<16||x>239||y<16||y>239)maximumBorderAlpha=Math.max(maximumBorderAlpha,alpha);
  }
  frame.rgbaSha256=sha(pixels);
  frame.alphaBounds={minX,minY,maxX,maxY};
  frame.alphaPixels=alphaPixels;
  frame.visiblePixels=visiblePixels;
  frame.maximumSixteenPixelGutterAlpha=maximumBorderAlpha;
  if(maximumBorderAlpha!==0)throw new Error(`Frame ${frame.index}: alpha enters 16 px gutter`);
  if(visiblePixels<1000)throw new Error(`Frame ${frame.index}: empty or unusable image`);
}
if(new Set(frames.map(frame=>frame.rgbaSha256)).size!==16)throw new Error('Duplicated frame');
const metadata={schemaVersion:1,id:'combat.hostile-salvage.v1',revision:'hostile-salvage-v1',
  status:'IN_REVIEW',technicalAcceptance:'EXPORT_VALIDATED_GAMEPLAY_PENDING',
  artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING',
  runtime:'assets/hostile_ordnance_atlas_v1.webp',master:path.basename(master),
  packedMaster:path.basename(packed),masterDimensions:{width:1254,height:1254},
  dimensions:{width:1024,height:1024},layout:{columns:4,rows:4,frameWidth:256,frameHeight:256},
  pivot:{x:.5,y:.5},forward:{x:0,y:-1},transparent:true,decodedRgbaBytes:1024*1024*4,
  runtimeBytes:readFileSync(runtime).length,runtimeSha256:sha(readFileSync(runtime)),
  masterSha256:sha(readFileSync(master)),packedMasterSha256:sha(readFileSync(packed)),
  animation:{scout:{frames:[0,1,2,3],fps:12,loop:true},
    interceptor:{frames:[4,5,6,7],fps:12,loop:true},
    atlas:{frames:[8,9,10,11],fps:10,loop:true},
    salvage:{frames:[12,13,14,15],fps:0,loop:false,meaning:'Four denominations, not animation frames'}},
  provenance:{created:'2026-10-18',tool:'image_gen.imagegen',
    source:'Original generation for NEON CRONIUM; no external image or franchise source',
    generatedOriginal:'/workspace/generated_images/exec-6204fdb7-d9ee-4683-8e9b-86455423e649.png',
    editing:'ImageMagick crop, resample, transparent padding, packing and WebP export only',
    rights:'Project-generated artwork; no purchased or third-party licensed material. Platform generation terms apply; exclusivity is not asserted.'},
  frames};
writeFileSync(path.join(root,'hostile-ordnance-atlas-v1.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify({runtime:metadata.runtime,bytes:metadata.runtimeBytes,
  decodedRgbaBytes:metadata.decodedRgbaBytes,frames:frames.length,uniqueFrames:16,
  transparentGutterPixels:16,sha256:metadata.runtimeSha256}));
