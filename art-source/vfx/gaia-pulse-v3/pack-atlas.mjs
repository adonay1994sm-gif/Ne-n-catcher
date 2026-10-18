import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../../..');
const master=path.join(dir,'gaia-pulse-production-master.png');
const packed=path.join(dir,'gaia-pulse-packed-master.png');
const runtime=path.join(root,'assets/gaia_pulse_atlas_v3.webp');
const run=args=>execFileSync('magick',args,{maxBuffer:24*1024*1024});
const hash=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(path.join(dir,'frames'),{recursive:true});
const kinds=['pulse','twin','lance','impact'];
const columnX=[8,320,632,948];
const rowY=[22,326,621];
const impactRects=[{x:40,y:950,width:243,height:260},{x:329,y:932,width:274,height:275},
  {x:610,y:915,width:351,height:315},{x:967,y:932,width:263,height:276}];
const frames=[];
for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const index=row*4+col;
  const sourceRect=row===3?impactRects[col]:{x:columnX[col],y:rowY[row],width:300,height:294};
  const filename=`${String(index).padStart(2,'0')}-${kinds[row]}-${col+1}.png`;
  // A common 60% scale preserves the authored growth of the impact sequence.
  const resize=row===3?'60%':'216x216';
  run([master,'-crop',`${sourceRect.width}x${sourceRect.height}+${sourceRect.x}+${sourceRect.y}`,
    '+repage','-filter','Lanczos','-resize',resize,'-gravity','center','-background','none',
    '-extent','256x256',path.join(dir,'frames',filename)]);
  frames.push({index,kind:kinds[row],source:`frames/${filename}`,sourceRect,
    rect:{x:col*256,y:row*256,width:256,height:256},pivot:{x:.5,y:.5},
    fps:row===3?16:12,...(row===3?{packingScale:.6}:{}),loop:row!==3});
}
run(['montage',...frames.map(f=>path.join(dir,f.source)),'-tile','4x4','-geometry','256x256+0+0','-background','none',packed]);
run([packed,'-define','webp:method=6','-quality','88',runtime]);
run([packed,'-background','#07111f','-alpha','remove','-alpha','off',path.join(dir,'contact-dark.png')]);
for(const f of frames){
  const p=run([runtime,'-crop',`256x256+${f.rect.x}+${f.rect.y}`,'+repage','-depth','8','rgba:-']);
  let minX=256,minY=256,maxX=-1,maxY=-1,gutter=0,visible=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const a=p[(y*256+x)*4+3];
    if(a){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    if(a>32)visible++;
    if(x<16||x>239||y<16||y>239)gutter=Math.max(gutter,a);
  }
  f.rgbaSha256=hash(p);f.alphaBounds={minX,minY,maxX,maxY};
  f.maximumSixteenPixelGutterAlpha=gutter;f.visiblePixels=visible;
  if(gutter!==0||visible<1000)throw new Error(`Invalid cell ${f.index}: gutter=${gutter},visible=${visible}`);
}
const unique=new Set(frames.map(f=>f.rgbaSha256)).size;
if(unique!==16)throw new Error(`Expected sixteen genuine poses, received ${unique}`);
const metadata={schemaVersion:1,id:'combat.gaia-pulse.v3',revision:'gaia-pulse-v3',status:'IN_REVIEW',
  technicalAcceptance:'EXPORT_VALIDATED_GAMEPLAY_PENDING',artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING',
  runtime:'assets/gaia_pulse_atlas_v3.webp',master:'gaia-pulse-production-master.png',packedMaster:'gaia-pulse-packed-master.png',
  concept:'canva-concept-thumbnail-200.jpg',masterDimensions:{width:1254,height:1254},dimensions:{width:1024,height:1024},
  layout:{columns:4,rows:4,frameWidth:256,frameHeight:256},pivot:{x:.5,y:.5},forward:{x:0,y:-1},transparent:true,
  runtimeBytes:readFileSync(runtime).length,decodedRgbaBytes:4194304,runtimeSha256:hash(readFileSync(runtime)),
  masterSha256:hash(readFileSync(master)),packedMasterSha256:hash(readFileSync(packed)),
  animations:{pulse:{frames:[0,1,2,3],fps:12,loop:true},twin:{frames:[4,5,6,7],fps:12,loop:true},
    lance:{frames:[8,9,10,11],fps:12,loop:true},impact:{frames:[12,13,14,15],fps:16,loop:false,durationSeconds:.25}},
  provenance:{created:'2026-10-18',conceptTool:'Canva generate-image',canvaMediaId:'MAHYWJAlpCA',
    canvaLink:'https://www.canva.com/M/MAHYWJAlpCA?utm_source=OC-AaBlKrqBJJNF&utm_campaign=agent_connector_create_image_asset_opened',
    conceptOriginalDimensionsDeclaredByCanva:{width:1264,height:1264},conceptRetainedDimensions:{width:200,height:200},
    productionTool:'image_gen.imagegen',productionReference:'Canva-generated concept thumbnail',
    productionReason:'Canva returned only a 200px JPG thumbnail; original rendition returned HTTP403 and Canva background removal requires a paid plan. No upgrade or payment was made.',
    generatedOriginal:'/workspace/generated_images/exec-d2fba385-5c20-4cde-aa30-46c202fdb315.png',
    editing:'ImageMagick crop, common-scale impact packing, transparent padding and WebP optimization only',
    rights:'Original project-generated art without external franchise assets or purchases; platform terms apply. Exclusivity not asserted.'},
  frames};
writeFileSync(path.join(dir,'gaia-pulse-atlas-v3.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify({runtime:metadata.runtime,bytes:metadata.runtimeBytes,decodedRgbaBytes:metadata.decodedRgbaBytes,
  uniqueFrames:unique,maximumGutterAlpha:0,sha256:metadata.runtimeSha256}));
