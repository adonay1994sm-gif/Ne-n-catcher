// Asset-only Chromium validation. Does not run or certify game integration.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
async function main(){
  const atlas=path.resolve(__dirname,'../../../assets/hostile_ordnance_atlas_v1.webp');
  let browser;
  const report={status:'running',command:process.argv,startedAt:new Date().toISOString(),
    scope:'Real Chromium asset decode and Canvas alpha QA, not gameplay QA',
    asset:'assets/hostile_ordnance_atlas_v1.webp',assetSha256:crypto.createHash('sha256').update(fs.readFileSync(atlas)).digest('hex'),
    cases:[],errors:[]};
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      headless:true,args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:620,height:680},deviceScaleFactor:1});
    page.on('pageerror',error=>report.errors.push(error.message));
    await page.setContent('<html lang="en"><head><meta charset="utf-8"><title>Hostile Ordnance asset QA</title></head><body style="margin:20px;background:#07111f;color:#d9efff;font:16px system-ui"><p>NEON CRONIUM — exported atlas · asset QA only</p><canvas width="1024" height="1024" style="width:560px;height:560px"></canvas><p>16 isolated sprites · three attack animations + four salvage tokens</p></body></html>');
    const result=await page.evaluate(async source=>{
      const img=new Image();img.src=source;await img.decode();
      const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(img,0,0);
      const frames=[];
      for(let index=0;index<16;index++){
        const pixels=ctx.getImageData(index%4*256,Math.floor(index/4)*256,256,256).data;
        let maximumGutterAlpha=0,visiblePixels=0,transparentPixels=0;
        for(let y=0;y<256;y++)for(let x=0;x<256;x++){
          const alpha=pixels[(y*256+x)*4+3];
          if(alpha>32)visiblePixels++;if(alpha===0)transparentPixels++;
          if(x<16||x>239||y<16||y>239)maximumGutterAlpha=Math.max(maximumGutterAlpha,alpha);
        }
        // Deterministic browser-decoded signature. Validates distinct poses, not equivalence with an external decoder.
        let signature=2166136261;
        for(const value of pixels){signature^=value;signature=Math.imul(signature,16777619)>>>0;}
        frames.push({index,maximumGutterAlpha,visiblePixels,transparentPixels,signature:signature.toString(16).padStart(8,'0')});
      }
      return{width:img.naturalWidth,height:img.naturalHeight,frames};
    },'data:image/webp;base64,'+fs.readFileSync(atlas).toString('base64'));
    assert.equal(result.width,1024);assert.equal(result.height,1024);
    report.cases.push({name:'WebP decodes at 1024×1024',status:'passed'});
    for(const frame of result.frames){
      assert.equal(frame.maximumGutterAlpha,0,`Frame ${frame.index} transparent gutter`);
      assert.ok(frame.visiblePixels>1000,`Frame ${frame.index} visible artwork`);
      assert.ok(frame.transparentPixels>30000,`Frame ${frame.index} isolated artwork`);
    }
    report.cases.push({name:'All 16 cells have 16 px transparent gutters, visible isolated artwork and no shared trails',status:'passed'});
    assert.equal(new Set(result.frames.map(frame=>frame.signature)).size,16);
    report.cases.push({name:'Sixteen distinct decoded sprites',status:'passed'});
    assert.deepEqual(report.errors,[]);
    report.cases.push({name:'No Chromium JavaScript errors',status:'passed'});
    report.result=result;report.browser=browser.version();report.status='passed';report.exitCode=0;
    await page.screenshot({path:path.join(__dirname,'chromium-asset-qa.png')});
  }catch(error){report.status='failed';report.exitCode=1;report.errors.push(error.stack||String(error));process.exitCode=1;}
  finally{
    report.finishedAt=new Date().toISOString();if(browser)await browser.close();
    fs.writeFileSync(path.join(__dirname,'chromium-asset-qa.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({status:report.status,cases:report.cases.length,errors:report.errors,assetSha256:report.assetSha256}));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
