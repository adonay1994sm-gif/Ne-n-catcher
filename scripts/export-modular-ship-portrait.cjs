// Export the actual assembled Astér used by gameplay, without rebuilding bundles.
// No independent art, altered collision model, renderer or animation loop.
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {startStaticServer,sha256}=require('./browser-qa-helpers.cjs');

(async()=>{
  const root=path.resolve(__dirname,'..');
  const sourcePath='src/game/07-player-item-rendering.js';
  const source=await fs.readFile(path.join(root,sourcePath),'utf8');
  const start=source.indexOf('  function drawShipComponent(');
  const end=source.indexOf('  function syncShipPresentation()',start);
  if(start<0||end<start)throw new Error('Gameplay assembly source not found');
  const server=await startStaticServer(root);
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
    headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage();
    await page.goto(server.url+'assets/ship_modular_atlas_v1.webp');
    const exported=await page.evaluate(async({url,assembly})=>{
      const model=await import(url+'src/game/ship/modular-ship.js');
      const atlas=new Image();atlas.src=url+'assets/ship_modular_atlas_v1.webp';await atlas.decode();
      const render=new Function('NeonCampaign','SPRITES','spriteReady',assembly+';return drawModularShip;')(
        model,{modularShip:atlas},image=>Boolean(image&&image.complete&&image.naturalWidth));
      const master=document.createElement('canvas');master.width=1024;master.height=1280;
      const target=master.getContext('2d');target.translate(512,512);
      if(!render(target,model.normalizeShipLoadout(),1024,0))throw new Error('Assembly unavailable');
      const runtime=document.createElement('canvas');runtime.width=512;runtime.height=640;
      runtime.getContext('2d').drawImage(master,0,0,512,640);
      return {master:master.toDataURL('image/png'),runtime:runtime.toDataURL('image/webp',.9)};
    },{url:server.url,assembly:source.slice(start,end)});
    const directory=path.join(root,'art-source/ship-identity');await fs.mkdir(directory,{recursive:true});
    const master='art-source/ship-identity/player_ship_identity_v1.png';
    const runtime='assets/player_ship_identity_v1.webp';
    const decode=data=>Buffer.from(data.slice(data.indexOf(',')+1),'base64');
    const masterBytes=decode(exported.master),runtimeBytes=decode(exported.runtime);
    await fs.writeFile(path.join(root,master),masterBytes);
    await fs.writeFile(path.join(root,runtime),runtimeBytes);
    const metadata={id:'player-ship-identity-v1',name:'Astér · assembled gameplay portrait',version:1,
      master:{path:master,width:1024,height:1280,pivot:[512,512],sha256:sha256(masterBytes)},
      runtime:{path:runtime,width:512,height:640,pivot:[256,256],bytes:runtimeBytes.length,
        sha256:sha256(runtimeBytes),decodedRGBABytes:512*640*4},
      transparency:true,frames:1,fps:0,scale:'Same 512-unit assembly artboard as gameplay; image extends to y=384 for exhaust.',
      sourceAtlas:{path:'assets/ship_modular_atlas_v1.webp',sha256:sha256(await fs.readFile(path.join(root,'assets/ship_modular_atlas_v1.webp')))},
      assemblySource:{path:sourcePath,scope:'Source slice from drawShipComponent through drawModularShip, before syncShipPresentation',sha256:sha256(source.slice(start,end))},
      loadout:{hull:'aster',wings:'aster',engines:'aster'},
      provenance:'Deterministic Chromium Canvas export of existing authored components using the gameplay drawModularShip function. No new third-party art.',
      usage:'Launcher and emergency fallback only. Gameplay animates the original modular component atlas.',
      status:'IN_REVIEW',artisticAcceptance:'PENDING_OWNER',physicalAcceptance:'PENDING'};
    await fs.writeFile(path.join(directory,'player_ship_identity_v1.json'),JSON.stringify(metadata,null,2)+'\n');
    console.log(JSON.stringify(metadata));
  }finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
