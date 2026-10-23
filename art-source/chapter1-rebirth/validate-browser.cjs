// Real Chromium decoding/canvas checks for art exports only. Does not run the game.
const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
async function main(){
  const summary=JSON.parse(fs.readFileSync(path.join(__dirname,'asset-summary.json'),'utf8'));
  const root=path.resolve(__dirname,'../..');let browser;
  const report={status:'running',startedAt:new Date().toISOString(),command:process.argv,
    scope:'Real Chromium asset decode and Canvas validation; no gameplay, physical-device or aesthetic certification',
    cases:[],errors:[],assets:[]};
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:800,height:760},deviceScaleFactor:1});
    page.on('pageerror',error=>report.errors.push(error.message));
    for(const spec of summary.assets){
      const data=fs.readFileSync(path.join(root,spec.runtime));
      await page.setContent('<html><head><meta charset="utf-8"><title>Chapter 1 art export QA</title></head><body style="margin:20px;background:#07111f;color:#d9efff;font:16px system-ui"><p>NEON CRONIUM — Chapter 1 · asset QA only</p><canvas></canvas><p id="caption"></p></body></html>');
      const result=await page.evaluate(async config=>{
        const img=new Image();img.src=config.source;await img.decode();
        const canvas=document.querySelector('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
        const factor=Math.min(720/img.naturalWidth,625/img.naturalHeight,1);
        canvas.style.width=img.naturalWidth*factor+'px';canvas.style.height=img.naturalHeight*factor+'px';
        document.querySelector('#caption').textContent=config.spec.id+' — illustrations, not gameplay screenshot';
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
        const {frameWidth:w,frameHeight:h,columns,rows}=config.spec.layout,frames=[];
        for(let index=0;index<columns*rows;index++){
          const p=ctx.getImageData(index%columns*w,Math.floor(index/columns)*h,w,h).data;
          let signature=2166136261,gutter=0,visible=0,transparent=0;
          for(let y=0;y<h;y++)for(let x=0;x<w;x++){
            const offset=(y*w+x)*4,a=p[offset+3];
            if(a>32)visible++;if(a===0)transparent++;
            if(x<16||x>=w-16||y<16||y>=h-16)gutter=Math.max(gutter,a);
            for(let c=0;c<4;c++){signature^=p[offset+c];signature=Math.imul(signature,16777619)>>>0;}
          }
          frames.push({index,signature:signature.toString(16).padStart(8,'0'),maximumGutterAlpha:gutter,visiblePixels:visible,transparentPixels:transparent});
        }
        return{width:img.naturalWidth,height:img.naturalHeight,frames};
      },{source:'data:image/webp;base64,'+data.toString('base64'),spec});
      assert.equal(result.width,spec.dimensions.width);assert.equal(result.height,spec.dimensions.height);
      report.cases.push({name:spec.id+' decodes at declared dimensions',status:'passed'});
      assert.equal(new Set(result.frames.map(frame=>frame.signature)).size,result.frames.length);
      for(const frame of result.frames){assert.ok(frame.visiblePixels>1000);if(spec.transparent){assert.equal(frame.maximumGutterAlpha,0);assert.ok(frame.transparentPixels>1000);}}
      report.cases.push({name:spec.id+' distinct nonempty cells'+(spec.transparent?' and 16px alpha gutters':''),status:'passed'});
      report.assets.push({id:spec.id,runtime:spec.runtime,sha256:spec.runtimeSha256,...result});
      await page.screenshot({path:path.join(__dirname,spec.id.replaceAll('.','-')+'-chromium.png')});
    }
    assert.deepEqual(report.errors,[]);report.cases.push({name:'No Chromium JavaScript errors',status:'passed'});
    report.browser=browser.version();report.status='passed';report.exitCode=0;
  }catch(error){report.status='failed';report.exitCode=1;report.errors.push(error.stack||String(error));process.exitCode=1;}
  finally{report.finishedAt=new Date().toISOString();if(browser)await browser.close();fs.writeFileSync(path.join(__dirname,'chromium-asset-qa.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,errors:report.errors,assets:report.assets.map(a=>({id:a.id,frames:a.frames.length}))}));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
