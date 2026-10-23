#!/usr/bin/env node
/* Original generated art is only cropped, uniformly resized and padded here. */
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const master=path.join(__dirname,'c9-upgrades-generated-master.png');
const frameNames=['emitter','hull','missiles','coolant'];
const frameDir=path.join(__dirname,'frames');
fs.mkdirSync(frameDir,{recursive:true});
const dimensions=execFileSync('magick',['identify','-format','%w %h',master],{encoding:'utf8'}).trim().split(' ').map(Number);
if(dimensions.some(n=>n%2))throw Error('The master must have even dimensions for its 2×2 grid.');
const [halfW,halfH]=dimensions.map(n=>n/2);
for(let i=0;i<4;i++){
  execFileSync('magick',[master,'-crop',`${halfW}x${halfH}+${i%2*halfW}+${Math.floor(i/2)*halfH}`,'+repage','-trim','+repage','-resize','416x416','-gravity','center','-background','none','-extent','512x512',path.join(frameDir,`${i}-${frameNames[i]}.png`)]);
}
const packed=path.join(__dirname,'c9-upgrades-packed-master.png');
execFileSync('magick',[path.join(frameDir,'0-emitter.png'),path.join(frameDir,'1-hull.png'),'+append',path.join(__dirname,'row-0.png')]);
execFileSync('magick',[path.join(frameDir,'2-missiles.png'),path.join(frameDir,'3-coolant.png'),'+append',path.join(__dirname,'row-1.png')]);
execFileSync('magick',[path.join(__dirname,'row-0.png'),path.join(__dirname,'row-1.png'),'-append',packed]);
for(const name of ['row-0.png','row-1.png'])fs.unlinkSync(path.join(__dirname,name));
const webp=path.join(root,'assets/c9_upgrade_icons_v1.webp');
execFileSync('magick',[packed,'-define','webp:alpha-quality=100','-define','webp:method=6','-quality','90',webp]);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const metadata={id:'c9-upgrade-icons-v1',source:'OpenAI image_gen original generation',license:'Original project asset; no third-party images',master:path.relative(root,master),packedMaster:path.relative(root,packed),runtime:path.relative(root,webp),width:1024,height:1024,columns:2,rows:2,cellWidth:512,cellHeight:512,minimumGutter:48,decodedRgbaBytes:4194304,masterSha256:hash(master),packedSha256:hash(packed),runtimeSha256:hash(webp),runtimeBytes:fs.statSync(webp).size,frames:frameNames.map((name,index)=>({name,index,source:[index%2*512,Math.floor(index/2)*512,512,512],cssPosition:[`${index%2*100}%`,`${Math.floor(index/2)*100}%`]}))};
fs.writeFileSync(path.join(__dirname,'metadata.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify(metadata,null,2));
