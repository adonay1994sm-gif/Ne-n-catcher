// Original illustrated masters are preserved; this script only crops/pads/optimizes.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../..');
const run=args=>execFileSync('magick',args,{maxBuffer:40*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const introRects=[{x:0,y:0,width:507,height:740},{x:518,y:0,width:506,height:740},
  {x:0,y:749,width:507,height:787},{x:518,y:749,width:506,height:787}];
const specs=[
 {id:'chapter1.intro.v1',folder:'intro',master:'chapter1-intro-generated-master.png',
  masterDimensions:{width:1024,height:1536},runtime:'assets/chapter1_intro_atlas_v1.webp',
  width:1024,height:1536,columns:2,rows:2,frameWidth:512,frameHeight:768,alpha:false,quality:85,
  kinds:['chronos-active','convoy-attack','evacuation','deep-space-route'],rects:introRects,
  animation:{frames:[0,1,2,3],type:'Four distinct authored story states; timed transitions belong to game presentation',loop:false},
  sourceOriginal:'/workspace/generated_images/exec-082afceb-188a-4016-b4c9-b12d8caa86c5.png'},
 {id:'chapter1.portraits.v1',folder:'portraits',master:'chapter1-portraits-generated-master.png',
  masterDimensions:{width:2172,height:724},runtime:'assets/chapter1_portraits_v1.webp',
  width:768,height:256,columns:3,rows:1,frameWidth:256,frameHeight:256,alpha:true,quality:90,
  kinds:['lira-chronos-operator','mira-c9-chief','iria-gaia-commander'],
  rects:[0,1,2].map(index=>({x:index*724,y:0,width:724,height:724})),
  animation:{type:'Three static illustrated portraits, not animation frames',loop:false},
  sourceOriginal:'/workspace/generated_images/exec-84b40b1f-25d0-48a8-a0bc-d59bcef7ae54.png'},
 {id:'chapter1.missile.v1',folder:'missile',master:'chapter1-missile-generated-master.png',
  masterDimensions:{width:1254,height:1254},runtime:'assets/chapter1_missile_atlas_v1.webp',
  width:1024,height:1024,columns:4,rows:4,frameWidth:256,frameHeight:256,alpha:true,quality:88,
  kinds:['flight','launch','impact','aftermath'].flatMap(kind=>[kind,kind,kind,kind]),
  rects:Array.from({length:16},(_,index)=>{
    const row=Math.floor(index/4),col=index%4;
    if(row===0)return{x:[41,336,628,922][col],y:16,width:294,height:309};
    if(row===1)return{x:[41,336,628,922][col],y:325,width:294,height:316};
    return{x:[30,330,629,956][col],y:row===2?650:950,width:[280,290,299,285][col],height:row===2?294:280};
  }),
  animation:{flight:{frames:[0,1,2,3],fps:12,loop:true},launch:{frames:[4,5,6,7],fps:12,loop:false,durationSeconds:1/3},
    impact:{frames:[8,9,10,11],fps:16,loop:false,durationSeconds:.25},
    aftermath:{frames:[12,13,14,15],fps:10,loop:false,durationSeconds:.4}},
  sourceOriginal:'/workspace/generated_images/exec-ded0a96a-5681-478f-b7eb-48074c6e9e0b.png'}
];
const metadata=[];
for(const spec of specs){
  const folder=path.join(dir,spec.folder),master=path.join(folder,spec.master);
  const framesDir=path.join(folder,'frames');mkdirSync(framesDir,{recursive:true});
  const frames=[];
  for(let index=0;index<spec.rects.length;index++){
    const r=spec.rects[index],name=`${String(index).padStart(2,'0')}-${spec.kinds[index]}.png`;
    const args=[master,'-crop',`${r.width}x${r.height}+${r.x}+${r.y}`,'+repage','-filter','Lanczos'];
    if(spec.folder==='intro')args.push('-resize','512x768^','-gravity','center','-extent','512x768');
    else args.push('-resize',spec.folder==='portraits'?'224x224':index>=8?'65%':'216x216',
      '-gravity','center','-background','none','-extent','256x256');
    args.push(path.join(framesDir,name));run(args);
    frames.push({index,kind:spec.kinds[index],source:`frames/${name}`,sourceRect:r,
      rect:{x:(index%spec.columns)*spec.frameWidth,y:Math.floor(index/spec.columns)*spec.frameHeight,
        width:spec.frameWidth,height:spec.frameHeight},pivot:{x:.5,y:.5}});
  }
  const packed=path.join(folder,`${spec.folder}-packed-master.png`);
  run(['montage',...frames.map(frame=>path.join(folder,frame.source)),'-tile',`${spec.columns}x${spec.rows}`,
    '-geometry',`${spec.frameWidth}x${spec.frameHeight}+0+0`,'-background',spec.alpha?'none':'#07111f',packed]);
  const runtime=path.join(root,spec.runtime);run([packed,'-define','webp:method=6','-quality',String(spec.quality),runtime]);
  run([packed,'-background','#07111f','-alpha','remove','-alpha','off','-resize','1024x1536>',path.join(folder,'contact-dark.png')]);
  for(const frame of frames){
    const r=frame.rect,p=run([runtime,'-crop',`${r.width}x${r.height}+${r.x}+${r.y}`,'+repage','-depth','8','rgba:-']);
    let minX=r.width,minY=r.height,maxX=-1,maxY=-1,gutter=0,visible=0,transparent=0;
    for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++){
      const alpha=p[(y*r.width+x)*4+3];
      if(alpha){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}else transparent++;
      if(alpha>32)visible++;
      if(x<16||x>=r.width-16||y<16||y>=r.height-16)gutter=Math.max(gutter,alpha);
    }
    frame.rgbaSha256=sha(p);frame.alphaBounds={minX,minY,maxX,maxY};frame.visiblePixels=visible;
    frame.transparentPixels=transparent;
    if(spec.alpha){frame.maximumSixteenPixelGutterAlpha=gutter;if(gutter!==0)throw new Error(`${spec.id} frame${frame.index}: gutter alpha${gutter}`);}
    if(visible<1000)throw new Error(`${spec.id} frame${frame.index}: empty artwork`);
  }
  const unique=new Set(frames.map(frame=>frame.rgbaSha256)).size;
  if(unique!==frames.length)throw new Error(`${spec.id}: duplicate frames`);
  const record={schemaVersion:1,id:spec.id,status:'IN_REVIEW',technicalAcceptance:'EXPORT_VALIDATED_GAMEPLAY_PENDING',
    artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING',runtime:spec.runtime,master:spec.master,
    packedMaster:path.basename(packed),masterDimensions:spec.masterDimensions,dimensions:{width:spec.width,height:spec.height},
    layout:{columns:spec.columns,rows:spec.rows,frameWidth:spec.frameWidth,frameHeight:spec.frameHeight},
    pivot:{x:.5,y:.5},...(spec.folder==='missile'?{forward:{x:0,y:-1}}:{}),transparent:spec.alpha,
    runtimeBytes:readFileSync(runtime).length,decodedRgbaBytes:spec.width*spec.height*4,
    runtimeSha256:sha(readFileSync(runtime)),masterSha256:sha(readFileSync(master)),uniqueFrames:unique,
    animation:spec.animation,frames,provenance:{created:'2026-10-18',productionTool:'image_gen.imagegen',
      productionMode:'Original generation from a written brief, in parallel with Canva concept; no image-to-image reference supplied',
      sourceOriginal:spec.sourceOriginal,optimization:'ImageMagick crop, aspect-preserving resize, transparent padding and WebP export',
      canvaConcept:spec.folder==='intro'?{mediaId:'MAHYWkFSixE',retained:'canva-concept-thumbnail.jpg',
        link:'https://www.canva.com/M/MAHYWkFSixE?utm_source=OC-AaBlKrqBJJNF&utm_campaign=agent_connector_create_image_asset_opened',
        limitation:'Available Canva image connector returns a preview and MEDIA reference, without an original-byte export endpoint. No video export or paid capability was purchased.'}:null,
      rights:'Original project-generated art; no stock purchase or external franchise image. Platform generation terms apply; exclusivity not asserted.'}};
  writeFileSync(path.join(folder,`${spec.folder}-metadata.json`),JSON.stringify(record,null,2)+'\n');metadata.push(record);
  console.log(JSON.stringify({runtime:record.runtime,bytes:record.runtimeBytes,decodedRgbaBytes:record.decodedRgbaBytes,
    uniqueFrames:unique,sha256:record.runtimeSha256}));
}
writeFileSync(path.join(dir,'asset-summary.json'),JSON.stringify({schemaVersion:1,status:'IN_REVIEW',assets:metadata.map(({frames,...record})=>record)},null,2)+'\n');
