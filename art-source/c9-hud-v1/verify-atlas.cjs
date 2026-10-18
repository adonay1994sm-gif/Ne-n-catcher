#!/usr/bin/env node
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const atlas=path.resolve(__dirname,'../../assets/c9_upgrade_icons_v1.webp');
const [width,height]=execFileSync('magick',['identify','-format','%w %h',atlas],{encoding:'utf8'}).trim().split(' ').map(Number);
assert.deepEqual([width,height],[1024,1024]);
const rgba=execFileSync('magick',[atlas,'-depth','8','rgba:-'],{maxBuffer:1024*1024*5});
assert.equal(rgba.length,width*height*4);
const frames=[];
for(let index=0;index<4;index++){
  const originX=index%2*512,originY=Math.floor(index/2)*512;
  let edgeAlpha=0,minX=512,minY=512,maxX=-1,maxY=-1,visiblePixels=0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const alpha=rgba[((y+originY)*width+x+originX)*4+3];
    if(alpha){visiblePixels++;minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY);if(x<48||y<48||x>=464||y>=464)edgeAlpha=Math.max(alpha,edgeAlpha);}
  }
  assert.equal(edgeAlpha,0,`Cell ${index}: transparent gutter`);
  assert.ok(visiblePixels>20000,`Cell ${index}: real illustrated object`);
  frames.push({index,visiblePixels,bounds:[minX,minY,maxX-minX+1,maxY-minY+1],minimumGutter:Math.min(minX,minY,511-maxX,511-maxY),gutterMaxAlpha:edgeAlpha});
}
const result={kind:'ASSET_ALPHA_QA',runtime:'assets/c9_upgrade_icons_v1.webp',width,height,frames};
fs.writeFileSync(path.join(__dirname,'alpha-qa.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
