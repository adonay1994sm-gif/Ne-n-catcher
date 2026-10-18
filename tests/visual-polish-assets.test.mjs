import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import pixelmatch from '../tools/third-party/pixelmatch/index.js';
import {ASSET_CONTRACTS,BACKGROUNDS,compositeRgba,inspectFrame,compareFrames,validateAtlasFrames,webpDimensions} from '../scripts/specialist-visual-assets.mjs';

const image=(width,height,color=[0,0,0,0])=>{const data=new Uint8ClampedArray(width*height*4);for(let p=0;p<data.length;p+=4)data.set(color,p);return data;};
const pixel=(data,width,x,y,color)=>data.set(color,(y*width+x)*4);

test('vendored Pixelmatch retains exact reviewed source, license and pinned revision',()=>{
  const base=new URL('../tools/third-party/pixelmatch/',import.meta.url);
  const source=JSON.parse(readFileSync(new URL('SOURCE.json',base),'utf8'));
  assert.equal(source.sha,'ab76f526ef951c0ec6284e314a700e161b1800e6');assert.equal(source.license_metadata.spdx_id,'ISC');
  for(const [file,metadata] of Object.entries(source.files)) {
    const data=readFileSync(new URL(file,base));assert.equal(data.length,metadata.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'),metadata.sha256);
  }
  assert.match(readFileSync(new URL('LICENSE',base),'utf8'),/Copyright \(c\) 2025, Mapbox/);
});

test('Pixelmatch detects real visible differences and accepts identical opaque data',()=>{
  const original=image(4,4,[30,30,30,255]),changed=original.slice();pixel(changed,4,2,2,[0,200,255,255]);
  assert.equal(pixelmatch(original,original,null,4,4),0);
  assert.equal(pixelmatch(original,changed,null,4,4,{threshold:.025,includeAA:true}),1);
});

test('transparent RGB contamination is invisible on black, gray and white; opaque black is visible',()=>{
  const transparent=image(3,3),hidden=transparent.slice(),opaque=transparent.slice();
  pixel(hidden,3,1,1,[255,0,0,0]);pixel(opaque,3,1,1,[0,0,0,255]);
  assert.deepEqual(compareFrames(transparent,hidden,3,3),{black:0,gray:0,white:0});
  assert.deepEqual(compareFrames(transparent,opaque,3,3),{black:0,gray:1,white:1});
  for(const bg of Object.values(BACKGROUNDS))assert.deepEqual(compositeRgba(hidden,bg),compositeRgba(transparent,bg));
  assert.equal(inspectFrame(opaque,3,3).opaqueDarkPixels,1);
});

test('transparent gutters are measured from alpha, including faint nonzero edges',()=>{
  const clean=image(8,8);pixel(clean,8,3,3,[80,240,255,255]);
  const metric=inspectFrame(clean,8,8,2);assert.equal(metric.maximumGutterAlpha,0);assert.deepEqual(metric.bounds,{minX:3,minY:3,maxX:3,maxY:3});
  const contaminated=clean.slice();pixel(contaminated,8,0,4,[0,255,255,1]);
  assert.equal(inspectFrame(contaminated,8,8,2).maximumGutterAlpha,1);
  assert.throws(()=>validateAtlasFrames([contaminated],8,8,{columns:1,rows:1,gutter:2}),/transparent gutter/);
});

test('atlas validation rejects fractional cells, empty poses and visually duplicate poses',()=>{
  const a=image(8,8),b=image(8,8);pixel(a,8,3,3,[0,230,255,255]);pixel(b,8,4,4,[240,80,0,255]);
  assert.throws(()=>validateAtlasFrames([a,b],15,8,{columns:2,rows:1,gutter:1}),/integer dimensions/);
  assert.throws(()=>validateAtlasFrames([image(8,8)],8,8,{columns:1,rows:1,gutter:1}),/empty/);
  assert.throws(()=>validateAtlasFrames([a,a.slice()],16,8,{columns:2,rows:1,gutter:1}),/duplicate poses/);
  const onlyHiddenRgb=a.slice();pixel(onlyHiddenRgb,8,0,0,[255,0,0,0]);
  assert.throws(()=>validateAtlasFrames([a,onlyHiddenRgb],16,8,{columns:2,rows:1,gutter:1}),/duplicate poses/);
  const result=validateAtlasFrames([a,b],16,8,{columns:2,rows:1,gutter:1});assert.equal(result.comparisons.length,1);
  assert.ok(result.comparisons[0].differentPixels.gray>0);
});

test('actual new WebP exports use expected integer atlas geometry without decoding dependencies',()=>{
  for(const contract of ASSET_CONTRACTS) {
    const bytes=readFileSync(new URL('../'+contract.file,import.meta.url));
    assert.deepEqual(webpDimensions(bytes),{width:contract.width,height:contract.height});
    assert.equal(contract.width%contract.columns,0);assert.equal(contract.height%contract.rows,0);
    assert.ok(bytes.length>10000,contract.file+' must be actual artwork');
  }
});
