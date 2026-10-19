  const CLASSIC_EQUIPMENT_KEY = "neonCatcher.flightEquipment.v1";

  function isUnifiedClassic() { return !N7_CAMPAIGN && !JOURNEY_DEMO; }

  function classicChapterControlsLocked() {
    return Boolean(classicChapterView?.opening?.controlsLocked);
  }

  function classicChapterEvent(event) {
    if(event.type!=="transmission")return;
    flightTransmission={speaker:event.speaker,speakerId:event.speakerId,text:event.text,remaining:event.duration||4.6};
    flightHudSignature="";syncClassicFlightHud();
  }

  function signalClassicChapter(name) {
    if(!classicChapterStory)return;
    classicChapterStory.signal(name,classicChapterEvent);
    classicChapterView=classicChapterStory.snapshot();
  }

  function syncClassicChapterPresentation() {
    const opening=classicChapterView?.opening;
    const active=Boolean(state==="playing"&&opening?.active);
    document.body.classList.toggle("chapter-opening",active&&opening.controlsLocked);
    ui.chapterSkip?.classList.toggle("hidden",!active||!opening.canSkip);
    if(ui.chapterSkip)ui.chapterSkip.disabled=state!=="playing";
    syncClassicMissileHud();
  }

  function syncClassicMissileHud() {
    if(!ui.classicMissile)return;
    const count=classicSalvageState?.missileAmmo??0;
    ui.classicMissileCount.textContent=String(count);
    ui.classicMissile.disabled=state!=="playing"||classicChapterControlsLocked()||count<=0||Boolean(atlasBoss?.disabled);
    ui.classicMissile.setAttribute("aria-label",`Lanzar misil especial. ${count} disponibles. Reposición en C9.`);
  }

  function loadClassicSalvage() {
    if(!isUnifiedClassic())return false;
    if(!classicSalvageLedger)classicSalvageLedger=NeonCampaign.createScrapLedger({storage});
    const result=classicSalvageLedger.load();
    classicSalvageState=result.ok?result.state:null;
    if(!result.ok&&!classicSalvageWarningShown) {
      classicSalvageWarningShown=true;
      toast("La bodega no se puede guardar. Conservamos sus datos y bloqueamos las compras para evitar pérdidas.");
    }
    if(result.ok)projectClassicSalvageUpgrades();
    return result.ok;
  }

  // A purchase owns its entitlement in the same atomic record as its price.
  // The old equipment record is only a replayable projection, never the money
  // transaction. A failed projection can be retried without charging again.
  function projectClassicSalvageUpgrades() {
    const upgrades=classicSalvageState?.upgrades||[];
    let projected=true;
    if(upgrades.includes("twin-preparation")&&classicEquipment.recoveredTwin&&!classicEquipment.twinPrepared) {
      projected=persistClassicEquipment(NeonCampaign.prepareClassicTwin(classicEquipment));
    }
    const workshop=NeonCampaign.classicWorkshopState(classicSalvageState);
    const equipment=NeonCampaign.syncClassicWorkshopWeapons(classicEquipment,classicSalvageState);
    if(JSON.stringify(equipment)!==JSON.stringify(classicEquipment))projected=persistClassicEquipment(equipment)&&projected;
    if(classicWeapons){
      NeonCampaign.setClassicRechargeInterval(classicWeapons,workshop.rechargeSeconds);
      NeonCampaign.setClassicWeaponTuning(classicWeapons,workshop.weaponRanks);
    }
    const capacity=workshop.reserveCapacity;
    if(capacity>classicHullReserveCapacity)classicHullReserve+=capacity-classicHullReserveCapacity;
    classicHullReserveCapacity=capacity;
    classicHullReserve=Math.min(classicHullReserve,capacity);
    return projected;
  }

  function applyClassicSalvageShield() {
    if(!isUnifiedClassic())return;
    // Kept as the existing checkpoint call site: changing a stage must neither
    // refill reinforcement nor create a timed shield.
    powers.shield=0;
    updatePowerHud();
  }

  function beginClassicSalvageRun(resuming=false) {
    classicSalvageRunId=null;classicSalvageEnemySequence=0;
    if(!loadClassicSalvage())return false;
    const scope=`classic:${currentLevel+1}`;
    const canResume=resuming&&classicSalvageState.activeRun?.scope===scope;
    const result=classicSalvageLedger.beginRun({scope,fresh:Boolean(classicSalvageState.activeRun&&!canResume)});
    if(!result.ok)return false;
    classicSalvageRunId=result.runId;classicSalvageState=result.state;
    return true;
  }

  function buyClassicC9Upgrade(sku) {
    if(!isUnifiedClassic()||!classicSalvageLedger)return false;
    if(sku==="twin-preparation"&&(!classicEquipment.recoveredTwin||classicEquipment.twinPrepared||classicEquipment.unlocked.includes("twin")))return false;
    const sequence=classicSalvageState?.missileRefillSequence||0;
    const result=classicSalvageLedger.purchase({transactionId:sku==="missile-refill"?`c9:missiles:${sequence+1}`:`c9:${sku}`,sku});
    if(result.state)classicSalvageState=result.state;
    if(!result.ok&&result.reason!=="already-owned") {
      if(ui.c9PurchaseStatus)ui.c9PurchaseStatus.textContent=result.reason==="insufficient-funds"
        ? `Faltan ${result.missing} de chatarra. Recupera restos de las naves enemigas.`
        : result.reason==="prerequisite-required" ? "Instala primero el módulo anterior de esta rama."
        : "No se ha confirmado el pago. La mejora no se aplica; puedes reintentarlo.";
      updateClassicDock();return false;
    }
    const projected=projectClassicSalvageUpgrades();
    if(ui.c9PurchaseStatus)ui.c9PurchaseStatus.textContent=!projected
      ? "Pago guardado. El montaje queda pendiente; al reabrir C9 se reintentará sin cobrar otra vez."
      : sku==="twin-preparation" ? "Emisor preparado. Atlas sigue custodiando la autorización del segundo cañón."
      : sku==="hull-reinforcement" ? "Placas integradas. La reserva de casco ahora admite 45 puntos, sin temporizador."
      : sku==="missile-refill" ? "Misiles cargados. Cada unidad repuesta cuesta 6 de chatarra."
      : NeonCampaign.SCRAP_UPGRADES[sku] ? `${NeonCampaign.SCRAP_UPGRADES[sku].label}: ${NeonCampaign.SCRAP_UPGRADES[sku].description}`
      : "Mejora instalada y guardada.";
    shipPresentationSignature="";flightHudSignature="";updateClassicDock();updateAmmoHud();hud();
    if(projected)tone(720,.10,"triangle",.035);
    return projected;
  }

  function spawnClassicScrap(target) {
    if(!isUnifiedClassic()||!target||target.salvageDropped||!classicSalvageRunId||!classicSalvageState)return null;
    if(target.salvageRunId&&target.salvageRunId!==classicSalvageRunId)return null;
    const boss=target.bossSalvage===true;
    const wreckage=["debris","satellite"].includes(target.type);
    if(!boss&&((!target.classicScout&&!wreckage)||target.classicScoutProjectile||target.n7Projectile||target.guardianProjectile))return null;
    const enemyType=boss?"guardian-atlas":wreckage?target.type:target.salvageRole||target.classicScout?.role||"scout";
    const amount=NeonCampaign.rewardForEnemy(enemyType);
    if(!amount)return null;
    const stage=classicFlightView?.stageId||`${currentLevel+1}.0`;
    const dropId=target.salvageDropId||`${stage}:enemy:${classicSalvageEnemySequence++}`;
    target.salvageDropId=dropId;target.salvageDropped=true;
    if(classicSalvageState.activeRun?.claimed.some(receipt=>receipt.id===dropId))return null;
    if(items.some(item=>item.salvagePickup&&item.runId===classicSalvageRunId&&item.dropId===dropId))return null;
    if(!boss&&items.filter(item=>item.salvagePickup&&!item.bossSalvage).length>=32)return null;
    const item={id:`salvage:${classicSalvageRunId}:${dropId}`,type:"salvage",salvagePickup:true,
      bossSalvage:boss,runId:classicSalvageRunId,dropId,enemyType,amount,
      x:target.x,y:target.y,baseX:target.x,r:18,s:65,vx:0,vy:65,life:boss?4:14,
      rot:0,rs:.12,p:0,phase:0,amp:0,alpha:1};
    items.push(item);return item;
  }

  function collectClassicScrap(item) {
    if(!isUnifiedClassic()||!item?.salvagePickup||!classicSalvageLedger)return false;
    const result=classicSalvageLedger.claimDrop({runId:item.runId,dropId:item.dropId,enemyType:item.enemyType});
    if(!result.ok) {
      if(!item.salvageSaveWarning){item.salvageSaveWarning=true;toast("No se ha guardado la chatarra. La recogida se reintentará sin duplicarla.");}
      return false;
    }
    classicSalvageState=result.state;
    if(!result.duplicate){tone(760,.045,"sine",.025);toast(`+${result.amount} chatarra`);}
    return true;
  }

  function resetClassicCometShower() {
    classicCometShower=null;
    const view=classicFlightView;
    if(!view||!["1.5","1.9"].includes(view.stageId))return;
    classicCometShower=NeonCampaign.createCometShower({width:W,height:H,seed:view.stageNumber*811,
      shipWidth:SHIP_VISUAL.assemblySize,shipSideClearance:119*SHIP_VISUAL.classicScale,
      stageId:view.stageId,elapsed:view.stageElapsed});
  }

  function recoverCampaignCompletion() {
    if(JOURNEY_DEMO)return true;
    if(!completionJournal)completionJournal=NeonCampaign.createCompletionJournal({storage,keys:KEYS,
      levelCount:LEVELS.length,checkpointKey:N7_CAMPAIGN?null:NeonCampaign.CHRONOS_VOYAGE_KEY,
      validateCheckpoint:value=>normalizeClassicVoyageRecord(value)!==null,
      equipmentKey:N7_CAMPAIGN?null:CLASSIC_EQUIPMENT_KEY,
      validateEquipment:value=>NeonCampaign.normalizeClassicEquipment(value)!==null});
    const result=completionJournal.recover();
    completionPersistenceBlocked=!result.ok;
    if(result.ok&&isUnifiedClassic()) {
      const recovered=NeonCampaign.normalizeClassicEquipment(storage.getJSON(CLASSIC_EQUIPMENT_KEY,null));
      if(recovered)classicEquipment=recovered;
    }
    if(!result.ok)toast("Guardado pendiente: no se sobrescribirá. Reintenta cuando el almacenamiento esté disponible.");
    return result.ok;
  }

  function setupClassicFlight() {
    if (!isUnifiedClassic()) return;
    loadClassicVoyage();
    const raw = storage.getRaw(CLASSIC_EQUIPMENT_KEY);
    if (raw !== null) {
      try {
        const value = JSON.parse(raw);
        const normalized = NeonCampaign.normalizeClassicEquipment(value);
        if (!normalized) throw new Error("Invalid equipment");
        classicEquipment = normalized;
      } catch {
        const backupKey = CLASSIC_EQUIPMENT_KEY + ":invalid-backups";
        const previous = storage.getJSON(backupKey, []);
        const backups = Array.isArray(previous) ? previous.filter(value => typeof value === "string") : [];
        classicEquipmentWritable = backups.includes(raw) || storage.setJSON(backupKey, [...backups, raw]);
      }
    }
    loadClassicSalvage();
    document.body.classList.add("flight-mode");
    const mount = document.createElement("div");
    mount.innerHTML = `<div id="flightHud" class="flight-hud cockpit-flight hidden">
      <section id="flightRoute" class="flight-route hidden" aria-label="Trayecto espacial"><div><small id="flightDestination">CHRONOS → GAIA NOVA</small><b id="flightStage">Recupera el CRONIUM</b></div><progress id="flightDistance" max="1" value="0" aria-label="Recorrido hasta el destino"></progress></section>
      <p id="flightObjective" class="flight-comms" role="status" aria-live="polite" data-active="false"></p>
      <button id="flightWeapon" class="flight-weapon cockpit-control" type="button"><small id="flightWeaponDamage">DAÑO ×1</small><b id="flightWeaponName">PULSO</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4"/></svg></button>
      <div id="flightPilotHint" class="flight-pilot-hint" aria-hidden="true"><span></span>DESLIZA PARA MOVER</div>
      <div id="flightPilotStick" class="flight-pilot-stick hidden" aria-hidden="true"><span id="flightPilotKnob"></span></div>
      </div>
      <div id="flightDock" class="overlay" role="dialog" aria-modal="true" aria-labelledby="c9Title"><section class="panel flight-dock cockpit-dialog"><header class="c9-header cockpit-section-head"><span class="chapter-face" data-actor="mira" aria-hidden="true"></span><div><small>C9 · MIRA</small><h2 id="c9Title">Taller de a bordo</h2></div></header><div class="c9-preview"><canvas id="flightDockCanvas" width="384" height="300" aria-label="Nave con su armamento instalado"></canvas><p id="flightDockStatus"></p></div><aside class="cockpit-ledger" aria-label="Bodega de la nave"><small>CHATARRA DISPONIBLE</small><p id="c9Balance" class="c9-wallet" aria-label="Chatarra disponible">0 chatarra</p></aside><div class="c9-upgrades"><button id="flightInstallTwin" class="primary" type="button"><span class="c9-upgrade-art" data-upgrade="emitter" aria-hidden="true"></span><span class="c9-upgrade-copy"><b data-c9-label>PREPARAR EMISOR · 24 CHATARRA</b><small>Segundo cañón · autorización tras Atlas</small></span></button><button id="c9BuyShield" class="secondary" type="button"><span class="c9-upgrade-art" data-upgrade="hull" aria-hidden="true"></span><span class="c9-upgrade-copy"><b data-c9-label>REFUERZO DE CASCO · 30 CHATARRA</b><small>15 puntos de blindaje adicionales</small></span></button><button id="c9BuyMissiles" class="secondary" type="button"><span class="c9-upgrade-art" data-upgrade="missiles" aria-hidden="true"></span><span class="c9-upgrade-copy"><b data-c9-label>REPONER MISILES</b><small>18 de daño · 6 de chatarra por unidad</small></span></button><button id="c9BuyCoolant" class="secondary" type="button"><span class="c9-upgrade-art" data-upgrade="coolant" aria-hidden="true"></span><span class="c9-upgrade-copy"><b data-c9-label>REFRIGERACIÓN · 45 CHATARRA</b><small>Recuperación de energía un 25 % más rápida</small></span></button></div><p id="c9PurchaseStatus" class="c9-purchase-status" role="status"></p><div class="c9-actions"><button id="flightDockContinue" class="secondary" type="button">VOLVER A PILOTAR</button><button id="flightDockHome" class="secondary" type="button">GUARDAR Y VOLVER AL MENÚ</button></div></section></div>`;
    canvas.parentElement.append(mount);
    const chapterControls=document.createElement("div");
    chapterControls.innerHTML=`<button id="classicC9" class="classic-c9 cockpit-control hidden" type="button" aria-label="Abrir taller C9; pausa el viaje"><b>C9</b><span>TALLER</span></button><button id="chapterSkip" class="chapter-skip hidden" type="button">OMITIR INTRODUCCIÓN →</button><button id="classicMissile" class="classic-missile cockpit-control hidden" type="button" aria-label="Lanzar misil"><span class="missile-symbol" aria-hidden="true"></span><span>MISIL <b id="classicMissileCount">3</b></span></button>`;
    canvas.parentElement.append(chapterControls);
    ui.classicC9=$("classicC9");ui.classicC9.onclick=()=>openClassicDock("hud");
    ui.chapterSkip=$("chapterSkip");ui.classicMissile=$("classicMissile");ui.classicMissileCount=$("classicMissileCount");
    ui.chapterSkip.onclick=()=>{classicChapterStory?.skipIntro();classicChapterView=classicChapterStory?.snapshot();syncClassicChapterPresentation();};
    // Missile pointer/touch ownership is installed with the other flight
    // controls in 08-loop-input-bootstrap, including accessible click fallback.
    for (const id of ["flightHud","flightRoute","flightDestination","flightStage","flightWeapon","flightWeaponName","flightWeaponDamage","flightDistance","flightObjective","flightPilotHint","flightPilotStick","flightPilotKnob","flightDock","flightDockCanvas","flightDockStatus","flightInstallTwin","c9Balance","c9BuyShield","c9BuyMissiles","c9BuyCoolant","c9PurchaseStatus"]) ui[id] = $(id);
    const calibrate=document.createElement("button");calibrate.id="flightCalibrateLance";calibrate.className="secondary";calibrate.type="button";
    ui.flightInstallTwin.after(calibrate);ui.flightCalibrateLance=calibrate;
    const loadout = document.createElement("div");
    loadout.id="flightLoadoutChoices";loadout.className="flight-loadout-choices";
    loadout.setAttribute("role","group");loadout.setAttribute("aria-label","Arma al salir de C9");
    ui.flightDockStatus.closest('.c9-preview').after(loadout);
    setupClassicWorkshopSections(loadout,calibrate);
    for(const [type,weapon] of Object.entries(NeonCampaign.CLASSIC_WEAPON_RULES.types)) {
      const button=document.createElement("button");button.type="button";button.dataset.flightLoadout=type;
      button.className="cockpit-loadout-card";
      const roles={pulse:"Precisión · una carga",twin:"Dos pulsos centrados",lance:"Perfora dos objetivos",scatter:"Tres pulsos · corta distancia",needle:"Perfora tres objetivos"};
      const art={pulse:"emitter",twin:"emitter",lance:"needle",scatter:"scatter",needle:"needle"};
      button.innerHTML=`<span class="c9-upgrade-art" data-upgrade="${art[type]}" aria-hidden="true"></span><span class="cockpit-loadout-copy"><b>${weapon.label} ×${weapon.damageMultiplier}</b><small>${roles[type]}</small><em data-loadout-state></em></span>`;
      button.onclick=()=>{
        if(!classicEquipment.unlocked.includes(type))return;
        if(persistClassicEquipment({...classicEquipment,selected:type})) {
          updateClassicDock();syncClassicFlightHud();tone(720,.08,"triangle",.035);
        }
      };
      loadout.append(button);
    }
    ui.flightWeapon.onclick = () => {
      if (classicEquipment.unlocked.length < 2) { toast("El segundo cañón se desbloquea al vencer a Atlas"); return; }
      const selected = classicEquipment.unlocked[(classicEquipment.unlocked.indexOf(classicEquipment.selected)+1)%classicEquipment.unlocked.length];
      if (persistClassicEquipment({...classicEquipment, selected})) { tone(selected === "twin" ? 860 : 650, .12, "triangle", .045); syncClassicFlightHud(); }
    };
    ui.flightInstallTwin.onclick = () => buyClassicC9Upgrade("twin-preparation");
    ui.c9BuyShield.onclick=()=>buyClassicC9Upgrade("hull-reinforcement");
    ui.c9BuyMissiles.onclick=()=>buyClassicC9Upgrade("missile-refill");
    ui.c9BuyCoolant.onclick=()=>buyClassicC9Upgrade("coolant-feed");
    // Historical Lanza owners keep their weapon; the workshop no longer grants
    // two power tiers for free before the first real guardian.
    calibrate.onclick=()=>{
      if (!classicEquipment.unlocked.includes("lance")) return;
      if (persistClassicEquipment({...classicEquipment,selected:"lance"})) updateClassicDock();
    };
    $("flightDockContinue").onclick = closeClassicDock;
    ui.flightDock.addEventListener("keydown",event=>{
      if(!ui.flightDock.classList.contains("show"))return;
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closeClassicDock();return;}
      if(event.key!=="Tab")return;
      const controls=[...ui.flightDock.querySelectorAll("button:not(:disabled)")].filter(node=>!node.classList.contains("hidden")&&node.getClientRects().length);
      const first=controls[0],lastControl=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastControl?.focus();}
      else if(!event.shiftKey&&document.activeElement===lastControl){event.preventDefault();first?.focus();}
    });
    $("flightDockHome").onclick = goHome;
    const workshop = document.createElement("button"); workshop.id="openFlightDock"; workshop.className="secondary hidden";
    workshop.type="button"; workshop.textContent="FORJA C9"; workshop.onclick=()=>openClassicDock("menu");
    ui.menu.querySelector(".menu-actions")?.append(workshop);
    const stages = document.createElement("section");
    stages.id="chronosStages"; stages.className="chronos-stages cockpit-stage-list hidden";
    stages.innerHTML='<small>CHRONOS → GAIA · TRAMOS DEL VIAJE</small><div id="chronosStageGrid" class="chronos-stage-grid"></div><p id="chronosStagesNote"></p>';
    // La lista va encima del bloque de botones, que queda fijo abajo del panel.
    ($("briefingActions") || $("launch")).before(stages);
    syncClassicFlightHud();
  }

  function setupClassicWorkshopSections(loadout,calibrate) {
    const panel=ui.flightDock.querySelector('.flight-dock');
    $('c9Title').textContent='FORJA C9';
    panel.querySelector('.c9-header small').textContent='MIRA · INGENIERÍA DE A BORDO';
    ui.classicC9.querySelector('span').textContent='FORJA';
    ui.classicC9.setAttribute('aria-label','Abrir Forja C9. Pausa el viaje.');
    const oldGrid=panel.querySelector('.c9-upgrades');
    const nav=document.createElement('nav');nav.className='c9-navigation';nav.setAttribute('aria-label','Secciones de la Forja');
    const sections={};
    for(const [id,label,description] of [
      ['arsenal','01 · ARSENAL','Elige cómo quieres combatir. Comprar no equipa automáticamente.'],
      ['systems','02 · EVOLUCIÓN','Cada conexión requiere el módulo anterior. Tú eliges la rama.'],
      ['supplies','03 · SUMINISTROS','Tres misiles de reserva. Pagas únicamente las unidades que faltan.']]) {
      const section=document.createElement('section');section.id=`c9-${id}`;section.className='c9-section cockpit-workshop-section';
      const heading=document.createElement('h3');heading.textContent=label;heading.className='cockpit-section-title';
      const help=document.createElement('p');help.className='c9-section-help';help.textContent=description;
      const grid=document.createElement('div');grid.className='c9-upgrades';
      section.append(heading,help,grid);sections[id]={section,grid};
      const link=document.createElement('button');link.type='button';link.textContent=label.slice(5);link.setAttribute('aria-controls',section.id);
      link.onclick=()=>section.scrollIntoView?.({behavior:settings.reduceEffects?'instant':'smooth',block:'start'});
      nav.append(link);oldGrid.before(section);
    }
    ui.c9Balance.closest('.cockpit-ledger').after(nav);
    sections.arsenal.grid.before(loadout);
    for(const node of [ui.flightInstallTwin,ui.c9BuyShield,ui.c9BuyCoolant,calibrate])sections.systems.grid.append(node);
    sections.supplies.grid.append(ui.c9BuyMissiles);
    oldGrid.remove();
    for(const [sku,definition] of Object.entries(NeonCampaign.SCRAP_UPGRADES)) {
      if(['twin-preparation','hull-reinforcement','coolant-feed'].includes(sku))continue;
      const weapon=sku.startsWith('weapon-'),kind=sku.includes('scatter')?'scatter':sku.includes('needle')?'needle':sku.includes('hull')?'hull-ii':'coolant-ii';
      const button=document.createElement('button');button.type='button';button.className='secondary c9-tree-node';button.dataset.c9Sku=sku;
      const art=document.createElement('span');art.className='c9-upgrade-art';art.dataset.upgrade=kind;art.setAttribute('aria-hidden','true');
      const copy=document.createElement('span');copy.className='c9-upgrade-copy';
      const label=document.createElement('b');label.setAttribute('data-c9-label','');label.textContent=definition.label;
      const detail=document.createElement('small');detail.textContent=definition.description;
      const status=document.createElement('em');status.dataset.c9State='';
      copy.append(label,detail,status);button.append(art,copy);button.onclick=()=>buyClassicC9Upgrade(sku);
      (weapon?sections.arsenal:sections.systems).grid.append(button);
    }
    const repeat=document.createElement('button');repeat.type='button';repeat.id='replayFlightTutorial';repeat.className='secondary';repeat.textContent='REPETIR GUÍA DE VUELO';
    repeat.onclick=()=>{
      settings.flightTutorial=null;saveSettings();
      if(classicFlightView){classicTutorial=NeonCampaign.createFlightTutorial({routeElapsed:classicFlightView.elapsed,replay:true});classicTutorialAnchor={x:player.x,y:player.y};}
      repeat.textContent='GUÍA PREPARADA · VUELVE AL VUELO';
    };
    sections.supplies.section.append(repeat);
    $('replayTutorialSettings').onclick=()=>{
      repeat.click();toast('Guía de vuelo preparada. Aprenderás maniobrando en el viaje.');
    };
    const tree=sections.systems.grid;tree.classList.add('c9-skill-tree');
    for(const [label,first,next] of [
      ['BLINDAJE','hull-reinforcement','hull-plating-ii'],['REFRIGERACIÓN','coolant-feed','coolant-feed-ii'],
      ['ABANICO · CONVERGENCIA',null,'scatter-focus'],['AGUJA · RESONANCIA',null,'needle-resonance']]) {
      const branch=document.createElement('div');branch.className='c9-branch';
      const name=document.createElement('h4');name.textContent=label;branch.append(name);
      if(first)branch.append(first==='hull-reinforcement'?ui.c9BuyShield:ui.c9BuyCoolant);
      const node=tree.querySelector(`[data-c9-sku="${next}"]`);if(node)branch.append(node);
      tree.append(branch);
    }
  }

  function normalizeClassicVoyageRecord(value) {
    try {
      const checkpoint=NeonCampaign.normalizeChronosVoyageCheckpoint(value?.checkpoint,{goal:LEVELS[0].goal});
      if(value?.version!==2 || !checkpoint || !Number.isInteger(value.unlockedStage) || value.unlockedStage<checkpoint.stageNumber || value.unlockedStage>10 ||
        typeof value.completed!=="boolean" || (value.completed && checkpoint.stageNumber!==10) ||
        !Number.isFinite(value.entry?.hull) || value.entry.hull<=0 || value.entry.hull>100 ||
        !Number.isInteger(value.entry?.score) || value.entry.score<0 ||
        !Number.isFinite(value.entry?.maxCombo) || value.entry.maxCombo<1 || value.entry.maxCombo>12 ||
        value.entry?.collected!==checkpoint.collected)throw new Error("Invalid voyage save");
      if(value.entry.reserve!==undefined&&(!Number.isFinite(value.entry.reserve)||value.entry.reserve<0||value.entry.reserve>65))throw new Error("Invalid hull reserve");
      return {...value,checkpoint,chapter:value.chapter?NeonCampaign.normalizeChronosChapterCheckpoint(value.chapter):null};
    } catch {return null;}
  }

  function loadClassicVoyage() {
    const key=NeonCampaign.CHRONOS_VOYAGE_KEY,raw=storage.getRaw(key);
    if(raw===null)return;
    let normalized=null;
    try {normalized=normalizeClassicVoyageRecord(JSON.parse(raw));} catch {}
    if(normalized)classicVoyageRecord=normalized;
    else {
      const backup=key+":invalid-backups",previous=storage.getJSON(backup,[]);
      const copies=Array.isArray(previous)?previous.filter(value=>typeof value==="string"):[];
      classicVoyageWritable=copies.includes(raw)||storage.setJSON(backup,[...copies,raw]);
    }
  }

  function classicVoyageCheckpointRecord(checkpoint,completed=false) {
    if(!checkpoint)return null;
    const previous=classicVoyageRecord;
    const entry=completed && previous ? previous.entry : {
      hull:Math.max(1,Math.min(100,hull)),reserve:classicHullReserve,score:Math.max(0,Math.floor(score)),maxCombo,collected:checkpoint.collected};
    return {version:2,checkpoint,entry,chapter:classicChapterStory?.checkpoint()||null,unlockedStage:Math.max(previous?.unlockedStage||1,checkpoint.stageNumber),completed};
  }

  function saveClassicVoyageCheckpoint(checkpoint,completed=false) {
    if(!checkpoint)return false;
    if(completionPersistenceBlocked&&!recoverCampaignCompletion())return false;
    const record=classicVoyageCheckpointRecord(checkpoint,completed);
    // New route data has its own key. Old classic/N-7 saves are never inferred,
    // renumbered or replaced. Invalid raw data is backed up before any write.
    const saved=classicVoyageWritable&&storage.setJSON(NeonCampaign.CHRONOS_VOYAGE_KEY,record);
    classicVoyageRecord=record;
    if(!saved)toast("No se pudo guardar esta etapa. El guardado anterior sigue conservado.");
    return saved;
  }

  function buildChronosStageGrid() {
    const section=$("chronosStages");if(!section)return;
    section.classList.toggle("hidden",!isUnifiedClassic()||pendingLevel!==0);
    if(!isUnifiedClassic()||pendingLevel!==0)return;
    const selected=classicVoyageRequestedStage||(!classicVoyageRecord?.completed?classicVoyageRecord?.checkpoint.stageNumber:1)||1;
    const unlocked=classicVoyageRecord?.unlockedStage||1,grid=$("chronosStageGrid");grid.innerHTML="";
    for(const stage of NeonCampaign.CHRONOS_VOYAGE_STAGES){
      const number=stage.number||stage.stageNumber||Number(stage.id.split(".")[1]);
      const button=document.createElement("button");button.type="button";button.dataset.voyageStage=String(number);
      button.disabled=number>unlocked;button.classList.toggle("selected",number===selected);
      button.setAttribute("aria-pressed",String(number===selected));
      button.className=`cockpit-stage${number===selected?" selected":""}`;
      const identifier=document.createElement("small");identifier.className="cockpit-stage-number";identifier.textContent=`1.${number}`;
      const name=document.createElement("b");name.textContent=stage.name;
      const status=document.createElement("span");status.className="cockpit-stage-state";
      status.textContent=number>unlocked?"BLOQUEADO":number===selected?"SELECCIONADO":"DISPONIBLE";
      button.append(identifier,name,status);
      button.setAttribute("aria-label",`Tramo 1.${number}. ${stage.name}. ${status.textContent.toLowerCase()}.`);
      button.onclick=()=>{classicVoyageRequestedStage=number;buildChronosStageGrid();};
      grid.append(button);
    }
    $("chronosStagesNote").textContent=`Tramo 1.${selected} · ${unlocked}/10 disponibles. Reanudas desde la entrada del tramo guardado.`;
    const stage=NeonCampaign.CHRONOS_VOYAGE_STAGES[selected-1];
    ui.briefingSector.textContent=`TRAMO 1.${selected} · CHRONOS → GAIA`;
    ui.briefingName.textContent=stage.name;
    ui.briefingZone.textContent=`${stage.origin} → ${stage.destination}`;
    ui.briefingGoal.textContent=`${stage.goal}/36 CRONIUM`;
    ui.briefingSupply.textContent="Rastro recuperable";
    ui.briefingMission.textContent=stage.objective+". La ruta continúa desde el último punto de etapa guardado.";
  }

  function beginClassicVoyageService() {
    if(state!=="playing"||classicFlightView?.waitingFor!=="service")return;
    // Preserve the v2 route checkpoint and one emergency repair, without
    // inserting an orbital station or forcing a workshop/modal interruption.
    signalClassicChapter("c9-arrival");
    hull=100;
    classicFlight.resolveService(classicFlightEvent);classicFlightView=classicFlight.snapshot();
    signalClassicChapter("c9-departure");
    saveClassicVoyageCheckpoint(classicFlight.exportCheckpoint());hud();
  }

  function resumeClassicVoyageService() {
    if(flightDockReturn!=="voyage"||state!=="paused"||!classicFlight)return;
    if(typeof resetGameInput==="function")resetGameInput();
    setState("playing");overlay();last=performance.now();
    signalClassicChapter("c9-departure");
    classicFlight.resolveService(classicFlightEvent);classicFlightView=classicFlight.snapshot();
    saveClassicVoyageCheckpoint(classicFlight.exportCheckpoint());
    applyClassicSalvageShield();
    syncClassicFlightHud();hud();resumeAudio();
  }

  function persistClassicEquipment(next) {
    if (!classicEquipmentWritable || !storage.setJSON(CLASSIC_EQUIPMENT_KEY,next)) { toast("No se pudo guardar la pieza. Puedes reintentarlo."); return false; }
    classicEquipment = {...next,unlocked:[...next.unlocked]};
    if (classicWeapons) {
      for (const type of next.unlocked) NeonCampaign.unlockClassicWeapon(classicWeapons,type);
      NeonCampaign.selectClassicWeapon(classicWeapons,next.selected);
    }
    if (["twin","lance"].includes(next.selected)) ensureSprite(SPRITES.flightWeapons);
    if (next.selected === "lance") SPRITE_GROUPS.phaser.forEach(ensureSprite);
    shipPresentationSignature="";
    $("openFlightDock")?.classList.toggle("hidden",!next.recoveredTwin);
    return true;
  }

  function openClassicDock(from="menu") {
    if (!isUnifiedClassic()) return false;
    if(from==="hud") {
      if(state!=="playing"||atlasBoss||classicChapterControlsLocked())return false;
      if(typeof resetGameInput==="function")resetGameInput();
      NeonCampaign.endFlightInput(classicFlightInput);
      setState("paused");classicWorkshopOpened=true;
    } else if(!["menu","complete"].includes(state))return false;
    flightDockReturn=from; updateClassicDock(); overlay(ui.flightDock);
    $("flightDockContinue").focus({preventScroll:true});
    ui.flightDock.querySelector(".flight-dock").scrollTop=0;return true;
  }

  function closeClassicDock() {
    if(flightDockReturn==="hud"&&state==="paused") {
      if(typeof resetGameInput==="function")resetGameInput();
      setState("playing");overlay();last=performance.now();resumeAudio();
      syncClassicFlightHud();ui.classicC9?.focus({preventScroll:true});return;
    }
    if(flightDockReturn==="voyage"){resumeClassicVoyageService();return;}
    if(flightDockReturn==="complete")prepareLevel(Math.min(LEVELS.length-1,currentLevel+1),"complete");
    else {goHome();$("openFlightDock")?.focus();}
  }

  function setC9Label(button,text) {
    const label=button.querySelector("[data-c9-label]");
    if(label)label.textContent=text;else button.textContent=text;
  }

  function updateClassicDock() {
    loadClassicSalvage();
    const installed=classicEquipment.unlocked.includes("twin");
    const weapon=NeonCampaign.CLASSIC_WEAPON_RULES.types[classicEquipment.selected];
    const ownedUpgrades=classicSalvageState?.upgrades||[];
    const tuning={scatter:ownedUpgrades.includes('scatter-focus'),needle:ownedUpgrades.includes('needle-resonance')};
    const selectedUpgrade=tuning[classicEquipment.selected]?NeonCampaign.SCRAP_UPGRADES[classicEquipment.selected==='scatter'?'scatter-focus':'needle-resonance']:null;
    const purchasedWeapon=classicEquipment.unlocked.some(id=>id==='scatter'||id==='needle');
    ui.flightDockStatus.textContent=installed||purchasedWeapon
      ? `${weapon.label}${selectedUpgrade?' II':''} equipado. ${selectedUpgrade?.description||weapon.description} Puedes cambiar de arma antes de volver al vuelo.`
      : classicEquipment.twinPrepared ? "Emisor preparado. Conservas Pulso hasta vencer a Atlas: su autorización desbloquea el segundo cañón."
      : classicEquipment.recoveredTwin ? "Emisor recuperado. Prepáralo por 24 de chatarra; vencer a Atlas autoriza el segundo cañón."
      : "Pulso central equipado. Recupera el módulo de Chronos para desarrollar tu nave.";
    for(const button of $("flightLoadoutChoices").querySelectorAll("button")) {
      const type=button.dataset.flightLoadout,unlocked=classicEquipment.unlocked.includes(type);
      button.disabled=!unlocked;button.setAttribute("aria-pressed",String(type===classicEquipment.selected));
      button.querySelector('[data-loadout-state]').textContent=type===classicEquipment.selected?'EQUIPADA':unlocked?'EQUIPAR':type==='twin'?'REQUIERE ATLAS':'SIN ADQUIRIR';
      button.title=unlocked?NeonCampaign.CLASSIC_WEAPON_RULES.types[type].description:type==="twin"?"Supera a Guardian Atlas":"Una frontera posterior desbloquea esta arma";
      button.classList.toggle('hidden',type==='lance'&&!unlocked);
      button.title=type==='scatter'||type==='needle' ? unlocked?NeonCampaign.CLASSIC_WEAPON_RULES.types[type].description:'Disponible en el arsenal de la Forja':button.title;
      if(type==='scatter'||type==='needle') {
        button.querySelector('b').textContent=`${NeonCampaign.CLASSIC_WEAPON_RULES.types[type].label}${tuning[type]?' II':''} ×${NeonCampaign.CLASSIC_WEAPON_RULES.types[type].damageMultiplier}`;
        button.querySelector('small').textContent=type==='scatter'?(tuning[type]?'Tres pulsos · alcance ampliado':'Tres pulsos · corta distancia'):
          tuning[type]?'Perfora cuatro · cadencia mejorada':'Perfora tres objetivos';
      }
    }
    const balance=classicSalvageState?.balance??0,upgrades=classicSalvageState?.upgrades||[];
    ui.c9Balance.textContent=classicSalvageState ? NeonCampaign.formatDenominations(balance).label : "Bodega no disponible · compras protegidas";
    ui.c9Balance.title="100.000 chatarra = 1 plata · 100 plata = 1 oro · 10 oro = 1 estelar";
    ui.flightInstallTwin.disabled=!classicSalvageState || !classicEquipmentWritable || balance<24 || installed || !classicEquipment.recoveredTwin || Boolean(classicEquipment.twinPrepared);
    setC9Label(ui.flightInstallTwin,installed ? "SEGUNDO CAÑÓN AUTORIZADO" : classicEquipment.twinPrepared ? "EMISOR PREPARADO · FALTA ATLAS" : "PREPARAR EMISOR · 24 CHATARRA");
    ui.c9BuyShield.disabled=!classicSalvageState||balance<30||upgrades.includes("hull-reinforcement");
    setC9Label(ui.c9BuyShield,upgrades.includes("hull-reinforcement")?"REFUERZO DE 45 INSTALADO":"AMPLIAR REFUERZO A 45 · 30 CHATARRA");
    ui.c9BuyShield.title="Añade 15 puntos de placas de casco. El refuerzo se consume por impactos, sin temporizador.";
    const missingMissiles=Math.max(0,3-(classicSalvageState?.missileAmmo??0)),missilePrice=missingMissiles*6;
    ui.c9BuyMissiles.disabled=!classicSalvageState||!missingMissiles||balance<missilePrice;
    setC9Label(ui.c9BuyMissiles,missingMissiles?`REPONER ${missingMissiles} MISIL${missingMissiles>1?"ES":""} · ${missilePrice} CHATARRA`:"TRES MISILES CARGADOS");
    ui.c9BuyMissiles.title="Cada misil repuesto cuesta 6 de chatarra. No se cobra una carga que ya tienes.";
    ui.c9BuyCoolant.disabled=!classicSalvageState||balance<45||upgrades.includes("coolant-feed");
    setC9Label(ui.c9BuyCoolant,upgrades.includes("coolant-feed")?"REFRIGERACIÓN INSTALADA":"REFRIGERACIÓN · 45 CHATARRA");
    ui.c9BuyCoolant.title="Recupera un proyectil cada 1,5 segundos; no cambia el daño ni la cadencia.";
    ui.flightCalibrateLance.classList.toggle("hidden",!classicEquipment.unlocked.includes("lance"));
    ui.flightCalibrateLance.disabled=classicEquipment.selected==="lance";
    ui.flightCalibrateLance.textContent="EQUIPAR LANZA ×3 CONSERVADA";
    for(const button of ui.flightDock.querySelectorAll('[data-c9-sku]')) {
      const sku=button.dataset.c9Sku,definition=NeonCampaign.SCRAP_UPGRADES[sku],owned=upgrades.includes(sku);
      const required=definition.requires||[];
      const requirements=Array.isArray(required)?required:[required];
      const missing=requirements.filter(id=>!upgrades.includes(id));
      button.disabled=!classicSalvageState||owned||missing.length>0||balance<definition.price||!classicEquipmentWritable;
      button.dataset.nodeState=owned?'installed':missing.length?'locked':'available';
      setC9Label(button,definition.label.toUpperCase());
      button.querySelector('[data-c9-state]').textContent=owned?'INSTALADO':missing.length
        ?`REQUIERE ${missing.map(id=>NeonCampaign.SCRAP_UPGRADES[id]?.label||id).join(' + ')}`:`${definition.price} CHATARRA`;
    }
    $("flightDockContinue").textContent=["voyage","hud"].includes(flightDockReturn) ? "VOLVER A PILOTAR →" : flightDockReturn==="complete" ? "CONTINUAR VIAJE" : "VOLVER AL VIAJE";
  }

  function syncClassicFlightHud() {
    if (!isUnifiedClassic() || !ui.flightRoute) return;
    $("openFlightDock")?.classList.toggle("hidden",!classicEquipment.recoveredTwin);
    const view=classicFlightView;
    if(ui.classicC9){
      const c9Recovered=Boolean(classicEquipment.recoveredTwin),c9Blocked=Boolean(atlasBoss);
      ui.classicC9.disabled=state!=="playing"||c9Blocked;
      ui.classicC9.classList.toggle("hidden",!c9Recovered||c9Blocked||ui.flightHud.classList.contains("hidden"));
      ui.classicC9.title=!c9Recovered?"Recupera primero el módulo C9":c9Blocked?"C9 no está disponible durante el bloqueo de Atlas":"Taller C9 · pausa el viaje para configurar tu nave";
    }
    ui.flightPilotHint?.classList.toggle("hidden",Boolean(classicEquipment.recoveredTwin));
    const stage=atlasBoss ? "ACCESO ATLAS" : view?.stageNumber ? `${view.stageId} · ${view.stageName}` : view?.stageName || level().name;
    // The primary HUD already shows the quota. This reserved, transparent slot
    // is used only for brief contextual comms; it never repeats the counters.
    const tutorialView=typeof classicTutorial!=="undefined"?classicTutorial?.snapshot():null;
    const guide=!atlasBoss&&state==='playing'?tutorialView?.active:null;
    const objective=flightTransmission ? `${flightTransmission.speaker}: ${flightTransmission.text}` : guide ? `${guide.text} · ${Math.round(guide.progress*100)} %` : "";
    const signature=[currentLevel,stage,objective,collected,Math.floor((view?.routeProgress||0)*1000),classicEquipment.selected,classicWeapons?.charges,Math.floor((classicWeapons?.recharge||0)*5)].join(":");
    if(signature===flightHudSignature)return;
    flightHudSignature=signature;
    ui.flightStage.textContent=stage;
    if(ui.flightObjective.textContent!==objective) {
      ui.flightObjective.replaceChildren();
      if(["lira","mira","iria"].includes(flightTransmission?.speakerId)) {
        const face=document.createElement("span");face.className="chapter-face";
        face.dataset.actor=flightTransmission.speakerId;face.setAttribute("aria-hidden","true");ui.flightObjective.append(face);
      }
      const text=document.createElement("span");text.textContent=objective;ui.flightObjective.append(text);
    }
    ui.flightObjective.dataset.active=String(Boolean(flightTransmission||guide));
    ui.flightObjective.classList.toggle('tutorial-active',Boolean(!flightTransmission&&guide));
    ui.flightDestination.textContent=currentLevel===0 ? `CHRONOS → GAIA · ${view?.stageNumber||1}/10` : `${level().world} · RASTRO ${currentLevel+1}/10`;
    ui.flightDistance.value=view ? view.routeProgress : collected/level().goal;
    ui.flightDistance.setAttribute("aria-label",view ? "Recorrido hasta el destino" : "CRONIUM recuperado");
    ui.flightDistance.setAttribute("aria-valuetext",view ? `Etapa ${view.stageNumber||1} de 10. ${Math.round(view.routeProgress*100)}% del recorrido` : `${collected} de ${level().goal} fragmentos`);
    const weapon=NeonCampaign.CLASSIC_WEAPON_RULES.types[classicEquipment.selected];
    ui.flightWeaponName.textContent=weapon.label.toUpperCase();
    ui.flightWeaponDamage.textContent=`DAÑO ×${weapon.damageMultiplier}`;
    ui.flightWeapon.title=weapon.description;
    ui.flightWeapon.dataset.switchable=String(classicEquipment.unlocked.length>1);
    ui.flightWeapon.classList.toggle("hidden",classicEquipment.unlocked.length<2);
    ui.flightWeapon.setAttribute("aria-label",`Cambiar arma. ${weapon.label}. ${weapon.description}`);
    updateAmmoHud();
  }

  function advanceClassicTutorial() {
    if(!classicTutorial||!classicFlightView)return;
    classicTutorial.advance({elapsed:classicFlightView.elapsed,playing:state==='playing',
      shots:classicWeapons?.shotSequence||0,collected,workshopOpened:classicWorkshopOpened,
      moduleRecovered:Boolean(classicEquipment.recoveredTwin),missilesFired:classicSalvageState?.missileShotsSpent||0,
      missileReady:(classicSalvageState?.missileAmmo||0)>0,
      missileOpportunity:items.some(item=>isThreat(item)&&item.y<player.y&&Math.abs(item.x-player.x)<90),
      bossActive:Boolean(atlasBoss),channelBusy:Boolean(flightTransmission)},cue=>{
        flightTransmission={speaker:'N-7 · GUÍA',text:cue.text,remaining:cue.seconds};
        flightHudSignature='';
      });
    const checkpoint=classicTutorial.checkpoint(),signature=JSON.stringify(checkpoint);
    if(signature!==classicTutorialSignature){
      settings.flightTutorial=checkpoint;
      if(saveSettings())classicTutorialSignature=signature;
    }
    syncClassicFlightHud();
  }

  function setClassicFlightHudVisible(visible) {
    ui.flightHud?.classList.toggle("hidden",!visible);
    ui.classicMissile?.classList.toggle("hidden",!visible);
    ui.classicC9?.classList.toggle("hidden",!visible||!classicEquipment.recoveredTwin||Boolean(atlasBoss));
    ui.flightWeapon?.classList.toggle("hidden",!visible||classicEquipment.unlocked.length<2);
    ui.flightPilotHint?.classList.toggle("hidden",!visible||Boolean(classicEquipment.recoveredTwin));
    if(!visible)ui.chapterSkip?.classList.add("hidden");
    ui.flightRoute?.classList.toggle("hidden",!visible || Boolean(atlasBoss));
  }

  function classicFlightEvent(event) {
    if(event.type==="checkpoint") {
      classicFlightView=classicFlight.snapshot();
      // Initial assets can finish loading after the player has already fired.
      // Route markers are not scene resets: already visible debris, enemies and
      // real shots keep flying across the boundary. C9 clears its safe dock only.
      classicVoyageStageId=classicFlightView.stageId;
      classicVoyageSpawnTimer=1;classicVoyageHazardTimer=10;
      classicPatrolTimer=classicFlightView.stageNumber===1?4:7;classicCometSequence=0;
      classicSalvageEnemySequence=0;resetClassicCometShower();applyClassicSalvageShield();
      saveClassicVoyageCheckpoint(event.checkpoint);
    }
    if(event.type==="stage-start") {
      classicFlightView=classicFlight.snapshot();
      if(!classicChapterStory)showStoryTransmission(`TRAYECTO ${classicFlightView.stageId}`,
        `${classicFlightView.stageName} · ${classicFlightView.stageObjective}`,3.2);
      hud();
    }
    if(event.type==="service") { classicFlightView=classicFlight.snapshot();beginClassicVoyageService(); }
    if(event.type==="attack"&&!classicChapterStory) { showStoryTransmission("CONTROL CHRONOS","Nave sin identificación. Está cargando sus armas contra el reactor.",5); tone(180,.25,"sawtooth",.045); }
    if(event.type==="rupture") {
      // The authored reactor/wave layers own this blue temporal rupture. A
      // generic orange/pink combat explosion used to obscure its structure.
      levelOneShockwaveTriggered=true;
      shake=8;stormPulse=.18;tone(72,.5,"sawtooth",.05);
      if(!classicChapterStory)showStoryTransmission("N-7","¡Chronos ha sido alcanzado! Recupera el CRONIUM. Los atacantes siguen en la zona.",6);
    }
    if(event.type==="departure") { if(!classicChapterStory)showStoryTransmission("N-7","Chronos queda atrás. La primera señal conduce a Gaia Nova.",4.6); classicPatrolTimer=.6; }
    if(event.type==="twin-module-marker" && !classicEquipment.recoveredTwin) {
      items.push({type:"flightModule",x:W*.66,baseX:W*.66,y:H*.33,r:29,s:95,rot:0,rs:.12,p:0,phase:0,amp:0,alpha:1});
      showStoryTransmission("MIRA · C9","Hay un emisor gemelo entre los restos. Rescátalo: puedo montarlo en tu nave.",5.5);
    }
    if(event.type==="gaia-beacon") showStoryTransmission("IRIA · GAIA","Tu identificación coincide con el convoy atacante. Atlas exige que detengas los motores.",5);
  }

  function advanceClassicFlight(dt) {
    if(!isUnifiedClassic())return;
    if(classicFlight) classicFlightView=classicFlight.advance(dt,collected,classicFlightEvent);
    if(classicChapterStory&&classicFlightView) {
      classicChapterStory.advance({elapsed:classicFlightView.elapsed,playing:state==="playing",
        aftermathElapsed:classicChapterOutroStartedAt===null?0:elapsed-classicChapterOutroStartedAt},classicChapterEvent);
      classicChapterView=classicChapterStory.snapshot();syncClassicChapterPresentation();
      advanceClassicTutorial();
    }
    if(classicFlightView?.stageNumber) {
      if(state==="playing" && !atlasBoss && classicFlightView.waitingFor!=="service") advanceClassicVoyageEncounters(dt);
      syncClassicFlightHud();return;
    }
    if(classicFlightView?.routeProgress>=.30 && classicFlightView.routeProgress<.82) {
      classicPatrolTimer-=dt;
      if(classicPatrolTimer<=0) {
        if(items.filter(item=>item.flightPatrol).length<2) spawnClassicFlightPatrol();
        classicPatrolTimer=9;
      }
    }
    if(classicFlightView) {
      const crossings=[.46,.61,.76],progress=classicFlightView.routeProgress;
      const threshold=crossings[classicCometSequence];
      if(threshold!==undefined && progress>=threshold-.025 && classicCometWarning!==classicCometSequence) {
        classicCometWarning=classicCometSequence;
        showStoryTransmission("N-7","Cometa por babor. Cruza en diagonal; mantén libre su trayectoria.",2.4);
      }
      if(threshold!==undefined && progress>=threshold) {
        classicCometSequence++;
        items.push({id:`chronos-comet:${classicCometSequence}`,type:"meteor",flightComet:true,
          x:-45,y:H*.16,baseX:-45,vx:62,vy:82,r:18,s:82,damage:14,hp:2,maxHp:2,
          special:"comet",spriteKey:"comet",rot:Math.atan2(82,62),rs:0,p:0,phase:classicCometSequence,amp:0,alpha:1,life:16});
      }
    }
    syncClassicFlightHud();
  }

  function advanceClassicVoyageEncounters(dt) {
    const view=classicFlightView,n=view.stageNumber;
    if(view.elapsed<9 || view.canFinish)return;
    classicVoyageSpawnTimer-=dt;
    // Recoverable signals form a short trail rather than an endless rain.
    // Missed fragments are reissued while this stage's objective is incomplete.
    const live=items.filter(item=>item.type==="energy").length;
    if(collected+live<view.stageGoal && live<2 && classicVoyageSpawnTimer<=0) {
      const x=W*(.30+.40*(.5+.5*Math.sin(view.stageElapsed*.31+n)));
      items.push({type:"energy",x,baseX:x,y:-45,r:22,s:175+n*4,rot:0,rs:.2,p:0,phase:n,amp:12,special:"",alpha:1});
      energySpawned++;classicVoyageSpawnTimer=2.8;
    }
    // Escape pressure after the actual rupture, with quiet space and C9 left
    // intact. A two-enemy cap includes survivors from the preceding crossing.
    if(![5,6].includes(n)) {
      classicPatrolTimer-=dt;
      if(classicPatrolTimer<=0) {
        if(items.filter(item=>item.flightPatrol).length<(n===1?1:2))spawnClassicFlightPatrol(n<7?"raider":n>=9&&classicPatrolSequence%2?"interceptor":"scout");
        classicPatrolTimer=n<3?12:n>=9?8:n===7?13:10;
      }
    }
    if([2,4,8].includes(n)) {
      classicVoyageHazardTimer-=dt;
      if(classicVoyageHazardTimer<=0 && items.filter(isThreat).length<2) {
        const wreck=createThreat("debris",level());wreck.x=wreck.baseX=W*(n%2?.23:.77);wreck.y=-95;wreck.s=110+n*4;
        items.push(wreck);classicVoyageHazardTimer=20;
      }
    }
    if([5,9].includes(n)) {
      if(!classicCometShower||classicCometShower.stageId!==view.stageId)resetClassicCometShower();
      NeonCampaign.advanceCometShower(classicCometShower,dt,player,event=>{
        if(event.type==="warning")showStoryTransmission("N-7",event.text,2);
        if(event.type==="spawn")items.push(event.item);
      });
    }
    if([4,8].includes(n) && view.stageElapsed>=15 && classicCometWarning!==n) {
      classicCometWarning=n;const x=W*.45;
      items.push({type:"repair",x,baseX:x,y:-45,r:22,s:150,rot:0,rs:.15,p:0,phase:0,amp:18,special:"",alpha:1});
    }
  }

  function spawnClassicFlightPatrol(role="scout") {
    const ordinal=classicPatrolSequence++;
    const stage=classicFlightView?.stageNumber||0;
    const interceptor=role==="interceptor"&&spriteReady(SPRITES.ch02);
    if(role==="interceptor"&&!interceptor)role="scout";
    ensureSprite(SPRITES.ch01);
    const item=createThreat("scout",level());
    item.id=`${NeonCampaign.CLASSIC_PURSUIT_VERSION}:${currentLevel}:${stage}:${ordinal}`;
    item.x=item.baseX=W*(ordinal%2===0?.25:.75);item.y=-65;item.rot=0;item.rs=0;
    item.flightPatrol=true;item.damage=16;item.s=role==="raider"?150:138;
    item.salvageRole=role;item.salvageDropId=`${classicFlightView?.stageId||`${currentLevel+1}.0`}:enemy:${classicSalvageEnemySequence++}`;
    item.r=interceptor?35:32;item.hp=item.maxHp=interceptor?3:2;
    item.classicScout=NeonCampaign.createClassicPursuer({x:item.x,width:W,height:H,role,
      seed:stage*17+ordinal,minAttackY:(classicFlightBounds?.presentationTop||95)+45,baseSpeed:item.s});
    if(interceptor)item.classicScout.animator=NeonCampaign.createCh02Animator({hp:3,maxHp:3});
    items.push(item);
    if(!classicPursuitAnnounced.has(role)) {
      classicPursuitAnnounced.add(role);
      showStoryTransmission(role==="raider"?"N-7":"RED ATLAS",role==="raider"
        ?"Los atacantes nos siguen. Saca el CRONIUM de este campo de restos."
        :role==="interceptor"?"CH-02 en intercepción. Sus motores le permiten cerrar el flanco."
        :"La red Atlas no reconoce nuestra identificación. Mantén el rumbo hacia Gaia.",4.2);
    }
    return item;
  }

  function fireClassicWeapon() {
    if(!classicWeapons || !spriteReady(SPRITES.atlasVfx))return false;
    if(classicChapterControlsLocked())return false;
    const result=NeonCampaign.triggerClassicWeapon(classicWeapons,{x:player.x,y:player.y-125*SHIP_VISUAL.classicScale});
    if(!result.accepted)return false;
    ammo=classicWeapons.charges;manualShotCooldown=classicWeapons.cooldown;
    if(typeof classicTutorial!=='undefined')classicTutorial?.observe({type:'fire'});
    combatSound("phaser");
    cameraKickY=Math.max(cameraKickY,2.5);vibrate(12);updateAmmoHud();return true;
  }

  function fireClassicMissile() {
    if(!isUnifiedClassic()||state!=="playing"||warpTimer>0||classicChapterControlsLocked()||
      atlasBoss?.disabled||!classicWeapons||!classicSalvageLedger||!NeonCampaign.canTriggerClassicMissile(classicWeapons))return false;
    const inventory=classicSalvageLedger.load();
    if(!inventory.ok){syncClassicMissileHud();return false;}
    classicSalvageState=inventory.state;
    // Commit the inventory receipt before emitting a physical projectile. A
    // failed or repeated write cannot create a free or duplicated missile.
    const spent=classicSalvageLedger.spendMissile({shotId:classicSalvageLedger.nextMissileShotId()});
    if(spent.state)classicSalvageState=spent.state;
    if(!spent.ok||spent.duplicate){syncClassicMissileHud();return false;}
    const fired=NeonCampaign.triggerClassicMissile(classicWeapons,{x:player.x,
      y:player.y-72*SHIP_VISUAL.classicScale,shotId:`missile:${classicSalvageState.missileShotsSpent}`});
    syncClassicMissileHud();
    if(!fired.accepted)return false;
    if(typeof classicTutorial!=='undefined')classicTutorial?.observe({type:'missile'});
    cameraKickY=Math.max(cameraKickY,3);combatSound("missile-launch",player.x,`missile:${classicSalvageState.missileShotsSpent}`);vibrate(16);
    return true;
  }

  function advanceClassicWeaponField(dt) {
    if(!classicWeapons)return;
    for(const shot of classicWeapons.projectiles){shot.previousX=shot.x;shot.previousY=shot.y;}
    const events=NeonCampaign.advanceClassicWeapons(classicWeapons,dt);
    ammo=classicWeapons.charges;
    if(atlasBoss && !atlasBoss.disabled) {
      for(const shot of [...classicWeapons.projectiles]) {
        const radius=atlasBoss.vulnerability?atlasBoss.coreRadius:atlasBoss.r;
        if(squaredDistanceToSegment(atlasBoss.x,atlasBoss.y,shot.previousX??shot.x,shot.previousY??shot.y,shot.x,shot.y) > (radius+shot.radius)**2)continue;
        const contact=NeonCampaign.hitClassicProjectile(classicWeapons,shot.id,"guardian-atlas");
        if(!contact.accepted)continue;
        // Shield contact consumes a shot too; vulnerability is checked on arrival.
        const dx=shot.x-(shot.previousX??shot.x),dy=shot.y-(shot.previousY??shot.y);
        const length=dx*dx+dy*dy;
        const t=length?clamp(((atlasBoss.x-(shot.previousX??shot.x))*dx+(atlasBoss.y-(shot.previousY??shot.y))*dy)/length,0,1):0;
        resolveAtlasPulse({atlasTarget:atlasBoss,x2:atlasBoss.x,damage:contact.damage,weapon:shot.weapon,
          impactX:(shot.previousX??shot.x)+dx*t,impactY:(shot.previousY??shot.y)+dy*t});
      }
    }
    if(events.some(event=>event.type==="recharged")){tone(520,.035,"sine",.025);updateAmmoHud();}
  }

  function interceptClassicProjectile(item) {
    if(!isUnifiedClassic() || !classicWeapons || atlasBoss || !isThreat(item))return false;
    if(!item.id)item.id=`classic-target:${++classicThreatSequence}`;
    for(const shot of [...classicWeapons.projectiles]) {
      const ax=shot.previousX??shot.x,ay=shot.previousY??shot.y,dx=shot.x-ax,dy=shot.y-ay;
      const cosine=Math.cos(item.rot||0),sine=Math.sin(item.rot||0);
      const intersects=collisionCircles(item).some(circle=>{
        const x=item.x+circle.x*cosine-circle.y*sine,y=item.y+circle.x*sine+circle.y*cosine;
        return squaredDistanceToSegment(x,y,ax,ay,shot.x,shot.y)<=(circle.r+shot.radius)**2;
      });
      if(!intersects)continue;
      const impact=NeonCampaign.hitClassicProjectile(classicWeapons,shot.id,item.id);
      if(!impact.accepted)continue;
      item.hp=Math.max(0,(item.hp??1)-impact.damage);
      const destroyed=item.hp<=1e-8;
      animateScoutHit(item,destroyed);
      if(shot.weapon==="missile")addMissileImpact(item.x,item.y);else addImpactEffect(item.x,item.y,.8);
      score+=(item.n7Projectile||item.classicScoutProjectile)?0:(destroyed?10:3);combatSound(destroyed?"enemy-break":"impact-metal",item.x);
      hudScoreTarget=score;
      if(destroyed){
        if(!item.classicScout?.tacticsVersion)addExplosion(item.x,item.y,.7,.5);
        return true;
      }
    }
    return false;
  }

  function isAtlasMission() {
    return !N7_CAMPAIGN && !JOURNEY_DEMO && currentLevel === 0;
  }

  function setupAtlasEncounter() {
    const mount = document.createElement("section");
    mount.id = "atlasEncounter"; mount.className = "atlas-encounter cockpit-boss-signal hidden";
    mount.setAttribute("aria-label", "Encuentro Guardian Atlas");
    mount.innerHTML = `<div class="atlas-identity"><b>GUARDIAN ATLAS</b><span id="atlasPhase">CONTENCIÓN ORBITAL</span><progress id="atlasHealth" max="1" value="1" aria-label="Integridad de Guardian Atlas"></progress></div><p id="atlasStatus" role="status">Recupera el CRONIUM antes de cruzar el perímetro.</p>`;
    canvas.parentElement.append(mount);
    for (const id of ["atlasEncounter", "atlasHealth", "atlasPhase", "atlasStatus"]) ui[id] = $(id);
    syncAtlasHud();
  }

  function positionAtlasArena() {
    if (!atlasBoss) return;
    const rect = canvas.getBoundingClientRect();
    const horizontal = rect.height < 500;
    const anchorY = isUnifiedClassic() ? (classicFlightAnchorY || player.y) : player.y;
    atlasBoss.width = W; atlasBoss.height = H; atlasBoss.playerY = anchorY;
    const hudBottom = Math.max($('hud').getBoundingClientRect().bottom,
      ui.atlasEncounter?.getBoundingClientRect().bottom || 0,
      ui.flightObjective?.getBoundingClientRect().bottom || 0);
    const headerClearance = (Math.max(0, hudBottom - rect.top) + 8) * H / Math.max(1, rect.height);
    const shipTop = anchorY - 145*SHIP_VISUAL.classicScale;
    // Poses have distinct reactor pivots. Reserve the complete authored cell,
    // including the highest ring and lowest wreckage, rather than half a tile.
    atlasBoss.visualSize = Math.min(horizontal ? 300 : 350,
      Math.max(80, (shipTop - headerClearance - 12) / 1.07));
    atlasBoss.targetY = clamp(H * .30,
      headerClearance + atlasBoss.visualSize * .55,
      shipTop - atlasBoss.visualSize * .52);
    // Reflow the presentation envelope, never reset a moving boss to its anchor
    // whenever a status line changes. The model moves the real core/collider.
    atlasBoss.presentationHalfWidth=atlasBoss.visualSize*.58;
  }

  function beginAtlasEncounter() {
    if (!isAtlasMission() || atlasBoss || !classicFlightView?.canFinish || collected < level().goal || state !== "playing") return false;
    if (typeof resetGameInput === "function") resetGameInput();
    cancelSupplyFailureTimer();
    atlasBoss = NeonCampaign.createGuardianAtlas({width: W, height: H, playerY: player.y});
    NeonCampaign.setClassicUnlimitedFire(classicWeapons,true);
    document.body.classList.add("atlas-combat");ui.atlasEncounter.classList.remove("hidden");
    signalClassicChapter("atlas-entry");
    positionAtlasArena();
    atlasFireTimer = 0; atlasReentryGrace = 0; atlasLastStatus = "";
    items = []; gates = []; shots = []; tractorTarget = null;
    if(classicWeapons)classicWeapons.projectiles.length=0;
    setClassicFlightHudVisible(isUnifiedClassic());
    ensureSprite(SPRITES.guardianAtlas); ensureSprite(SPRITES.atlasVfx);
    hideWarning(); ui.banner.classList.remove("show");
    document.body.classList.add("atlas-combat");
    ui.atlasEncounter.classList.remove("hidden");
    ui.goal.previousElementSibling.textContent = "CRONIUM";
    ui.goal.textContent = `${collected}/${level().goal}`;
    syncAtlasHud(); refreshClassicFlightBounds(); updateAmmoHud();
    tone(135, .28, "triangle", .065);
    return true;
  }

  function syncAtlasHud() {
    if (!ui.atlasEncounter) return;
    if (!atlasBoss) return;
    const health = atlasBoss.hp / atlasBoss.maxHp;
    const phaseLabel = atlasBoss.disabled ? "ENLACE RESTAURADO" : `FASE ${atlasBoss.phase}`;
    if (ui.atlasHealth.value !== health) ui.atlasHealth.value = health;
    let layoutChanged = false;
    if (ui.atlasPhase.textContent !== phaseLabel) { ui.atlasPhase.textContent = phaseLabel; layoutChanged = true; }
    let status;
    if (!spriteReady(SPRITES.guardianAtlas) || !spriteReady(SPRITES.atlasVfx)) status = "Atlas no se ha cargado. Pausa y vuelve al menú para reintentar.";
    else if (atlasReentryGrace > 0) status = "Enlace recuperado. Retoma el control.";
    else if (atlasBoss.state === "entry") status = "Tu carga activa la contención. Desactiva el núcleo para abrir el paso.";
    else if (atlasBoss.state === "disabled") status = "Atlas: «Identidad confirmada. Gaia autoriza el acceso».";
    else if (atlasBoss.state === "phaseBreak") status = "N-7: «Es un bucle de contención. Rompe el enlace, salva al guardián».";
    else if (atlasBoss.state === "charge") status = "CONTENCIÓN ORBITAL ACTIVA";
    else status = atlasBoss.vulnerability ? "NÚCLEO EXPUESTO · alinea la nave y abre fuego." : "BLINDAJE CERRADO · Atlas cambia de flanco.";
    if (status !== atlasLastStatus) { ui.atlasStatus.textContent = status; atlasLastStatus = status; layoutChanged = true; }
    if (layoutChanged) positionAtlasArena();
  }

  function consumeAtlasEvent(event) {
    if (event.type === "projectile") items.push(event.projectile);
    if (event.clearProjectiles || event.type === "shutdown") {
      items = items.filter(item => !item.guardianProjectile);
    }
    if (event.type === "volley") combatSound(event.attackTier==="basic"?"enemy-phaser":"enemy-heavy",event.x??atlasBoss.x);
    if (event.type === "phase") { signalClassicChapter("atlas-phase-two"); cameraKickY = Math.max(cameraKickY, 3); tone(180, .3, "triangle", .055); }
    if (event.type === "shutdown") {
      score += 250;combatSound("atlas-collapse",atlasBoss.x);
      spawnClassicScrap({x:atlasBoss.x,y:atlasBoss.y,bossSalvage:true,salvageDropId:"guardian-atlas"});
    }
    if (event.type === "disabled") {
      signalClassicChapter("atlas-disabled");classicChapterOutroStartedAt=elapsed;
      if(!classicChapterStory)completeLevel();
    }
  }

  function updateAtlasEncounter(dt) {
    if (!atlasBoss || dt <= 0) return;
    if (!spriteReady(SPRITES.guardianAtlas) || !spriteReady(SPRITES.atlasVfx)) { syncAtlasHud(); return; }
    if (atlasReentryGrace > 0) { atlasReentryGrace = Math.max(0, atlasReentryGrace - dt); syncAtlasHud(); return; }
    // Slow affects both the guardian's warning/recovery clock and its bullets.
    // A different clock could announce a new corridor over an older curtain.
    const previousState=atlasBoss.state;
    NeonCampaign.advanceGuardianAtlas(atlasBoss, dt * (powers.slow > 0 ? .5 : 1), player, consumeAtlasEvent);
    if(atlasBoss.state==="charge"&&previousState!=="charge")combatSound("atlas-charge",atlasBoss.x);
    if (state !== "playing") return;
    atlasFireTimer = Math.max(0, atlasFireTimer - dt);
    if (settings.autoFire && atlasFireTimer === 0 && atlasBoss.vulnerability && Math.abs(atlasBoss.x - player.x) < 115) {
      if (fireManualShot()) atlasFireTimer = .42;
    }
    syncAtlasHud();
  }

  function fireAtlasPulse(kind) {
    if (!atlasBoss || atlasBoss.disabled || !spriteReady(SPRITES.guardianAtlas)) return false;
    // Exactly the same straight, physical battery projectiles as in the field.
    // A misplaced tap can miss; no ray is bent toward the boss or deleted.
    if (isUnifiedClassic() && kind !== "phaser") return fireClassicWeapon();
    // A collected temporary phaser is a separate timed power, never AUTO input.
    if (kind === "phaser") {
      if (shots.length >= EFFECT_LIMITS.shots) shots.shift();
      shots.push({x1:player.x,y1:player.y-125,x2:player.x,y2:atlasBoss.y,
        life:.24,duration:.24,kind:"phaser",atlasPulse:true,atlasTarget:atlasBoss,damage:1});
      return true;
    }
    return false;
  }

  function resolveAtlasPulse(shot) {
    if (state !== "playing" || shot.atlasTarget !== atlasBoss || atlasBoss.disabled) return;
    if (Math.abs(shot.x2 - atlasBoss.x) > atlasBoss.r) return;
    const result = NeonCampaign.hitGuardianAtlas(atlasBoss, shot.damage || 1);
    for (const event of result.events) consumeAtlasEvent(event);
    if (result.accepted) {
      score += 3;
      if (shot.weapon==="missile")addMissileImpact(shot.impactX??atlasBoss.x,shot.impactY??atlasBoss.y);
      else if (settings.effects) {
        if (impactEffects.length >= EFFECT_LIMITS.impacts) impactEffects.shift();
        impactEffects.push({x: atlasBoss.x, y: atlasBoss.y, angle: 0, scale: 1,
          life: .24, duration: .24, atlasImpact: true});
      }
      combatSound("impact-metal",atlasBoss.x);
    } else {if(shot.weapon==="missile")addMissileImpact(shot.impactX??atlasBoss.x,shot.impactY??atlasBoss.y);combatSound("impact-plasma",atlasBoss.x);}
    syncAtlasHud();
  }

  function setupShipHangar() {
    if ($("shipHangar")) return;
    const menuActions = ui.menu.querySelector(".menu-actions");
    if (!menuActions) return;

    const openButton = document.createElement("button");
    openButton.id = "openHangar";
    openButton.type = "button";
    openButton.className = "secondary";
    openButton.innerHTML = '<span class="button-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 4 7 5 8-7-2-2 3-2-3-7 2 5-8Z"/></svg></span>HANGAR';
    menuActions.classList.add("has-hangar");
    menuActions.append(openButton);

    const hangar = document.createElement("div");
    hangar.id = "shipHangar";
    hangar.className = "overlay ship-hangar hidden";
    hangar.setAttribute("role", "dialog");
    hangar.setAttribute("aria-modal", "true");
    hangar.setAttribute("aria-labelledby", "shipHangarTitle");
    hangar.setAttribute("aria-describedby", "shipHangarRules");
    hangar.innerHTML = `<section class="panel ship-hangar-panel cockpit-dialog" tabindex="-1">
      <header class="ship-hangar-header cockpit-section-head"><small>NAVE · COMPONENTES</small><h2 id="shipHangarTitle">HANGAR</h2><p id="shipHangarRules">Configuración visual · mismas reglas de vuelo.</p></header>
      <div class="ship-hangar-layout">
        <figure class="ship-hangar-preview"><canvas id="shipHangarCanvas" width="512" height="512" role="img" aria-label="Vista previa de la nave seleccionada">Vista previa de la configuración de nave.</canvas><figcaption id="shipHangarName">Nave seleccionada</figcaption><p id="shipAtlasNotice" class="hidden" role="status">No se han cargado los componentes. Se muestra la nave de reserva; vuelve a abrir el juego para reintentar.</p></figure>
        <div class="ship-hangar-controls">
          <div class="ship-preset-list" role="group" aria-label="Naves disponibles"><button type="button" data-ship-preset="aster" aria-pressed="false"><b>ASTÉR</b><span>Exploradora</span></button><button type="button" data-ship-preset="bastion" aria-pressed="false"><b>BASTIÓN</b><span>Interceptora</span></button></div>
          <fieldset class="ship-components"><legend>Combina sus componentes</legend><label for="shipHull">Fuselaje<select id="shipHull"><option value="aster">Astér</option><option value="bastion">Bastión</option></select></label><label for="shipWings">Alas<select id="shipWings"><option value="aster">Astér</option><option value="bastion">Bastión</option></select></label><label for="shipEngines">Propulsores<select id="shipEngines"><option value="aster">Astér</option><option value="bastion">Bastión</option></select></label></fieldset>
          <p id="shipHangarStatus" class="ship-hangar-status" role="status">Los cambios se guardan al aplicar.</p>
        </div>
      </div>
      <footer class="ship-hangar-actions"><button id="shipApply" class="primary" type="button">APLICAR CONFIGURACIÓN</button><button id="shipHangarBack" class="secondary" type="button">VOLVER SIN CAMBIAR</button></footer>
    </section>`;
    canvas.closest(".game").append(hangar);
    ui.shipHangar = hangar;
    const panel = hangar.querySelector(".ship-hangar-panel");
    const presetButtons = [...hangar.querySelectorAll("[data-ship-preset]")];
    const components = [["hull", $("shipHull")], ["wings", $("shipWings")], ["engines", $("shipEngines")]];
    const sameLoadout = (first, second) => components.every(([key]) => first[key] === second[key]);

    function refreshDraft() {
      for (const [key, select] of components) {
        select.value = shipHangarDraft.loadout[key];
        select.disabled = false;
      }
      for (const button of presetButtons) {
        const preset = NeonCampaign.SHIP_FLEET.find(entry => entry.id === button.dataset.shipPreset);
        button.setAttribute("aria-pressed", String(Boolean(preset) && sameLoadout(shipHangarDraft.loadout, preset.loadout)));
      }
      const selected = NeonCampaign.SHIP_FLEET.find(entry => sameLoadout(shipHangarDraft.loadout, entry.loadout));
      $("shipHangarName").textContent = selected?.name || "Configuración combinada";
      $("shipHangarCanvas").setAttribute("aria-label", `Vista previa: ${$("shipHangarName").textContent}`);
      $("shipHangarStatus").textContent = "Vista previa · aplica para guardar tu elección.";
    }

    function closeHangar() {
      hangar.classList.remove("show");
      hangar.classList.add("hidden");
      shipHangarDraft = null;
      overlay(ui.menu);
      openButton.focus({ preventScroll: true });
    }

    openButton.onclick = () => {
      if (state !== "menu" || !(ui.menu.classList.contains("show") || ui.briefing.classList.contains("show"))) return;
      shipHangarDraft = { mode: "modular", loadout: { ...NeonCampaign.normalizeShipLoadout(shipLoadout) } };
      refreshDraft();
      hangar.classList.remove("hidden");
      overlay(hangar);
      panel.focus({ preventScroll: true });
    };
    for (const button of presetButtons) button.onclick = () => {
      if (!shipHangarDraft) return;
      const preset = NeonCampaign.SHIP_FLEET.find(entry => entry.id === button.dataset.shipPreset);
      if (!preset) return;
      shipHangarDraft = { mode: "modular", loadout: { ...NeonCampaign.normalizeShipLoadout(preset.loadout) } };
      refreshDraft();
    };
    for (const [key, select] of components) select.onchange = () => {
      if (!shipHangarDraft) return;
      shipHangarDraft = { mode: "modular", loadout: { ...NeonCampaign.normalizeShipLoadout({ ...shipHangarDraft.loadout, [key]: select.value }) } };
      refreshDraft();
    };
    $("shipApply").onclick = () => {
      if (!shipHangarDraft) return;
      const loadout = NeonCampaign.normalizeShipLoadout(shipHangarDraft.loadout);
      if (!storage.setJSON(NeonCampaign.SHIP_FLEET_SAVE_KEY, { version: 1, mode: "modular", loadout })) {
        $("shipHangarStatus").textContent = "No se pudo guardar. Tu nave anterior sigue seleccionada.";
        return;
      }
      shipRenderMode = "modular";
      shipLoadout = loadout;
      syncShipPresentation();
      closeHangar();
      toast("Configuración de nave guardada");
    };
    $("shipHangarBack").onclick = closeHangar;
    hangar.addEventListener("keydown", event => {
      // Keep preview keyboard navigation out of the campaign's global controls.
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        closeHangar();
      } else if (event.key === "Tab") {
        const controls = [...hangar.querySelectorAll("button,select")].filter(element => !element.disabled);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
  }

  function setupJourneyUI() {
    if (!JOURNEY_DEMO) return;
    document.body.classList.add("journey-mode");
    const mount = document.createElement("div");
    mount.innerHTML = `<div id="journeyRoute" class="journey-route hidden"><small>CRONOS → GAIA NOVA</small><b id="journeyDestination"></b><progress id="journeyDistance" max="1" value="0" aria-label="Recorrido hasta Gaia"></progress><span id="journeyObjective"></span></div>
      <div id="journeySkills" class="journey-skills hidden"><button id="journeyShield" type="button">ESCUDO <small>LISTO</small></button><button id="journeyTractor" type="button">TRACTOR <small>LISTO</small></button></div>
      <div id="journeyStation" class="overlay"><section class="panel journey-service"><small>BALIZA DE SERVICIO C9</small><img src="assets/repair_drone.webp" alt="Mira, robot del taller"><h2>Un momento de respiro.</h2><p>«Soy Mira. Ese módulo rescatado aún puede volar. Te lo monto y sello el casco.»</p><div class="journey-piece"><canvas id="journeyModulePreview" width="240" height="150" role="img" aria-label="Propulsor C9 recuperado">Propulsor C9 recuperado.</canvas><div><b>Propulsor C9</b><p>Respuesta lateral +20 % y propulsión ámbar visible. Instalación con la pieza recuperada; sin créditos.</p></div></div><button id="journeyInstall" class="primary" type="button">INSTALAR PIEZA Y REPARAR</button><button id="journeyContinue" class="secondary" type="button" disabled>CONTINUAR HACIA GAIA</button><button id="journeyStationHome" class="link" type="button">Guardar y volver</button></section></div>
      <div id="journeyComplete" class="overlay"><section class="panel journey-service"><small>ACCESO ATLAS · TRAYECTO COMPLETO</small><h2>Gaia nos recibe.</h2><p>Has salido de Chronos, recuperado e instalado una pieza y abierto el paso. El siguiente viaje todavía está en producción.</p><p id="journeyReward"></p><button id="journeyAgain" class="primary" type="button">REPETIR TRAVESÍA</button><button id="journeyHome" class="secondary" type="button">VOLVER AL MENÚ</button></section></div>`;
    canvas.parentElement.append(mount);
    for (const id of ["journeyRoute", "journeyDestination", "journeyDistance", "journeyObjective", "journeySkills", "journeyShield", "journeyTractor", "journeyStation", "journeyInstall", "journeyContinue", "journeyComplete"]) ui[id] = $(id);
    $("journeyInstall").onclick = () => {
      if (!journey?.serviceInstall()) return;
      hull = 100;
      persistJourney();
      showJourneyStation();
      tone(780, .16, "triangle", .06);
    };
    $("journeyContinue").onclick = () => {
      if (!journey?.resumeFromStation()) return;
      persistJourney();
      setState("playing"); overlay(); last = performance.now();
      ui.fire.classList.remove("hidden"); ui.journeySkills.classList.remove("hidden");
      ui.journeyRoute.classList.remove("hidden");
      syncJourneyHud();
      showStoryTransmission("MIRA · C9", "Propulsor conectado. Prueba el empuje hacia Gaia.", 3.2);
    };
    $("journeyStationHome").onclick = goHome;
    $("journeyHome").onclick = goHome;
    $("journeyAgain").onclick = () => startJourney(true);
    ui.journeyShield.onclick = () => useJourneyAbility("shield");
    ui.journeyTractor.onclick = () => useJourneyAbility("tractor");
    const choice = document.createElement("label");
    choice.className = "journey-auto-choice";
    choice.innerHTML = '<input id="journeyAuto" type="checkbox">Disparo básico automático · también puedes disparar manualmente';
    $("play").after(choice);
    journeyAutoFire = storage.getJSON("neon-journey-demo-autofire-v1", true) !== false;
    $("journeyAuto").checked = journeyAutoFire;
    $("journeyAuto").onchange = event => {
      journeyAutoFire = event.target.checked;
      storage.setJSON("neon-journey-demo-autofire-v1", journeyAutoFire);
    };
    ui.menu.querySelector("h2").textContent = "Un viaje entre mundos.";
    ui.menu.querySelector(".menu-panel > p").textContent = "Evacúa Chronos, rescata una pieza y cruza hacia Gaia. Desliza sin soltar para pilotar; tu nave dispara al encontrar una amenaza.";
  }

  function persistJourney() {
    if (journey && (!journeyCanSave || !storage.setJSON(NeonCampaign.JOURNEY_DEMO_SAVE_KEY, journey.checkpoint()))) toast("Guardado no disponible. Mantén esta partida abierta.");
    journeyView = journey?.snapshot() || null;
  }

  function startJourney(fresh = false) {
    let saved = null;
    journeyCanSave = true;
    if (!fresh) saved = storage.getRaw(NeonCampaign.JOURNEY_DEMO_SAVE_KEY);
    journey = NeonCampaign.createJourneyDemo(saved);
    if (saved !== null && journey.snapshot().recovery === "invalid-save") {
      const backupKey = `${NeonCampaign.JOURNEY_DEMO_SAVE_KEY}:invalid-backups`;
      const previous = storage.getJSON(backupKey, []);
      const copies = Array.isArray(previous) ? previous : [previous];
      journeyCanSave = copies.includes(saved) || storage.setJSON(backupKey, [...copies, saved]);
    }
    if (journey.snapshot().phase === "complete") journey = NeonCampaign.createJourneyDemo();
    journeyView = journey.snapshot();
    journeyAutoTimer = 0; journeyShieldCooldown = 0; journeyTractorCooldown = 0;
    startLevel(0);
    warpTimer = .45;
    ui.bannerName.textContent = "CHRONOS → GAIA NOVA";
    ui.bannerGoal.textContent = "Desliza para pilotar. Rescata el módulo señalado.";
    ui.banner.classList.remove("show"); bannerTimer = 0;
    ui.journeyRoute.classList.remove("hidden");
    ui.journeySkills.classList.remove("hidden");
    ui.powerHud.classList.add("hidden");
    persistJourney(); syncJourneyHud();
    if (journeyView.phase === "station") showJourneyStation();
  }

  function showJourneyStation() {
    journeyView = journey.snapshot();
    journey.setPaused(false); // service actions are allowed; the route itself is stopped.
    if (state === "playing") setState("paused");
    items = []; clearTransientEffects(); hideStoryTransmission();
    ui.fire.classList.add("hidden"); ui.journeySkills.classList.add("hidden");
    ui.journeyRoute.classList.add("hidden");
    ui.banner.classList.remove("show");
    ui.journeyInstall.disabled = journeyView.partInstalled;
    ui.journeyInstall.textContent = journeyView.partInstalled ? "PROPULSOR MONTADO · CASCO SELLADO" : "INSTALAR PIEZA Y REPARAR";
    ui.journeyContinue.disabled = !journeyView.partInstalled;
    overlay(ui.journeyStation); syncJourneyHud();
  }

  function useJourneyAbility(name) {
    if (!JOURNEY_DEMO || !journey || state !== "playing") return;
    const cooldown = name === "shield" ? journeyShieldCooldown : journeyTractorCooldown;
    if (cooldown > 0) return;
    powers[name] = 4;
    if (name === "shield") journeyShieldCooldown = 11;
    else journeyTractorCooldown = 8;
    activatePower(name, {x: player.x, y: player.y});
  }

  function syncJourneyHud() {
    if (!JOURNEY_DEMO || !journey) return;
    journeyView = journey.snapshot();
    ui.journeyDestination.textContent = journeyView.destination;
    ui.journeyDistance.value = journeyView.routeProgress;
    ui.journeyObjective.textContent = journeyView.phase === "station" ? "Instala la pieza recuperada" : journeyView.waitingFor === "part" ? "Recupera el módulo · usa TRACTOR si lo necesitas" : journeyView.borderActive && !journeyView.borderResolved ? "Desactiva al guardián CH-01 para abrir el paso" : journeyView.partCollected ? "Pieza a bordo · sigue el corredor" : "Rescata el propulsor C9 señalizado";
    for (const [name, cooldown] of [["journeyShield", journeyShieldCooldown], ["journeyTractor", journeyTractorCooldown]]) {
      ui[name].disabled = cooldown > 0 || state !== "playing";
      const label = cooldown > 0 ? `${Math.ceil(cooldown)} s` : "LISTO";
      if (ui[name].querySelector("small").textContent !== label) ui[name].querySelector("small").textContent = label;
    }
    ui.goal.textContent = `${Math.round(journeyView.routeProgress * 100)}%`;
    ui.goal.previousElementSibling.textContent = "RECORRIDO";
    ui.hudLevel.textContent = `1.${journeyView.segmentIndex + 1}`;
    ui.hudLevel.previousElementSibling.textContent = "TRAMO";
  }

  function journeyEvent(event) {
    if (event.type === "partAvailable") {
      items.push({type: "journeyPart", x: W * .68, baseX: W * .68, y: H * .35, r: 27, s: 120, rot: 0, rs: .2, p: 0, phase: 0, alpha: 1});
      showStoryTransmission("BALIZA C9", "Propulsor C9 intacto. Acércate o activa el tractor.", 3.8);
    } else if (event.type === "enemy" || event.type === "border") {
      const enemy = createThreat("scout", level());
      enemy.x = enemy.baseX = event.type === "border" ? W * .5 : W * .28;
      enemy.classicScout.baseX = enemy.x;
      enemy.journeyEntry = {targetX: enemy.x};
      enemy.y = H * .22;
      enemy.s = event.type === "border" ? 0 : 95;
      if (event.type === "border") {
        enemy.journeyBorder = true; enemy.hp = enemy.maxHp = 3;
        showStoryTransmission("ACCESO ATLAS", "Identificación alterada. Desactiva el bloqueo y cruza.", 3.6);
      }
      items.push(enemy);
    } else if (event.type === "station") {
      persistJourney(); showJourneyStation();
    } else if (event.type === "segmentStart") {
      items = []; persistJourney();
    } else if (event.type === "complete") {
      persistJourney();
      setState("complete");
      ui.hud.classList.add("hidden"); ui.fire.classList.add("hidden");
      ui.journeySkills.classList.add("hidden");
      ui.journeyRoute.classList.add("hidden");
      $("journeyReward").textContent = `${journey.snapshot().credits} créditos registrados · recompensa única del trayecto`;
      hideStoryTransmission(); overlay(ui.journeyComplete);
    }
  }

  function updateMenu() {
    if (JOURNEY_DEMO) {
      const saved = NeonCampaign.createJourneyDemo(storage.getJSON(NeonCampaign.JOURNEY_DEMO_SAVE_KEY, null)).snapshot();
      ui.playLabel.textContent = saved.phase === "complete" ? "REPETIR VIAJE" : "CONTINUAR VIAJE";
      ui.playSector.textContent = `${saved.origin} → ${saved.destination}`;
      return;
    }
    const unlocked = getUnlocked();
    const starsMap = getStars();
    const completed = LEVELS.reduce((total, _, index) => total + (+(starsMap[index + 1] || 0) > 0 ? 1 : 0), 0);
    const percent = Math.round((completed / LEVELS.length) * 100);
    const finished = completed === LEVELS.length;
    const target = isUnifiedClassic()&&classicVoyageRecord&&!classicVoyageRecord.completed ? 0 : finished ? LEVELS.length - 1 : Math.max(0, unlocked - 1);

    ui.best.textContent = bestScore();
    ui.unlockedText.textContent = `${unlocked}/${LEVELS.length}`;
    ui.totalStars.textContent = `${totalStars()}/${LEVELS.length * 3}`;
    ui.campaignPercent.textContent = `${percent}%`;
    ui.campaignFill.style.width = `${percent}%`;
    ui.playLabel.textContent = finished ? "REPETIR CAMPAÑA" : "CONTINUAR VIAJE";
    ui.playSector.textContent = `${N7_CAMPAIGN ? "RUTA" : "NIVEL"} ${target + 1} · ${LEVELS[target].name.toUpperCase()}`;
    if(isUnifiedClassic()&&target===0)ui.playSector.textContent=`CHRONOS → GAIA · TRAMO 1.${classicVoyageRecord?.checkpoint.stageNumber||1}/10`;
    ui.campaignNodes.innerHTML = LEVELS.map((_, index) =>
      `<span class="${index < completed ? "done " : ""}${index === target ? "current" : ""}"></span>`
    ).join("");
    buildLevelGrid();
  }

  function hud() {
    hudScoreTarget = score;
    if (state !== "playing") displayedScore = score;
    ui.score.textContent = Math.round(displayedScore);
    ui.goal.textContent = `${collected}/${level().goal}`;
    ui.hull.textContent = `${Math.max(0, Math.ceil(hull))}%`;
    if(isUnifiedClassic()) {
      ui.hull.title=`Casco ${Math.ceil(hull)} de 100. Refuerzo ${Math.ceil(classicHullReserve)} de ${classicHullReserveCapacity}, sin temporizador.`;
      let reserve=$("hullReserve");
      if(!reserve){reserve=document.createElement("span");reserve.id="hullReserve";ui.hull.after(reserve);}
      reserve.textContent=classicHullReserve>0?`+${Math.ceil(classicHullReserve)}`:"";
    }
    ui.hudLevel.textContent = currentLevel + 1;
    ui.hudLevel.previousElementSibling.textContent = N7_CAMPAIGN ? "RUTA" : isUnifiedClassic() ? "NIVEL" : "SECTOR";
    if(isUnifiedClassic())ui.goal.previousElementSibling.textContent="CRONIUM";
    ui.hullBar.style.width = `${clamp(hull, 0, 100)}%`;
    ui.hullBar.style.background = hull > 66
      ? "linear-gradient(90deg,#63ffc4,#64e9ff)"
      : hull > 33
        ? "linear-gradient(90deg,#ffe166,#ff9f55)"
        : "linear-gradient(90deg,#ff5b7c,#ff2e55)";

    if (collected > lastHudCollected) animateHud(ui.goal, "hud-pop");
    if (hull < lastHudHull) {
      animateHud(ui.hull, "hud-damage");
      animateHud(ui.hullBar?.parentElement, "hud-damage");
    }
    lastHudCollected = collected;
    lastHudHull = hull;
    updateAmmoHud();
    if (JOURNEY_DEMO) syncJourneyHud();
    else syncClassicFlightHud();
  }

  function updateAmmoHud() {
    if (!ui.fire || !ui.ammo) return;
    if(isUnifiedClassic() && classicWeapons) {
      ammo=classicWeapons.charges;
      ui.ammo.textContent="";
      ui.fire.disabled=state!=="playing" || warpTimer>0;
      ui.fire.setAttribute("aria-disabled", String(ui.fire.disabled || (!classicWeapons.unlimitedFire&&ammo<=0) || manualShotCooldown>0));
      ui.fire.classList.toggle("empty",!classicWeapons.unlimitedFire&&ammo<=0);
      syncClassicMissileHud();
      const weapon=NeonCampaign.CLASSIC_WEAPON_RULES.types[classicEquipment.selected];
      const tuned=(classicEquipment.selected==='scatter'&&classicSalvageState?.upgrades.includes('scatter-focus'))||
        (classicEquipment.selected==='needle'&&classicSalvageState?.upgrades.includes('needle-resonance'));
      if(ui.fireWeapon)ui.fireWeapon.textContent=weapon.label.toUpperCase()+(tuned?' II':'');
      ui.fire.setAttribute("aria-label",ammo>0?`Mantener para disparar ${weapon.label}. La energía se recupera durante el vuelo.`:"El arma está recuperando energía. Mantén para disparar cuando esté disponible.");
      return;
    }
    if (JOURNEY_DEMO || atlasBoss) {
      ui.fire.classList.remove("empty");
      ui.ammo.textContent = manualShotCooldown > 0 ? "RECARGA" : "PULSO BÁSICO · ∞";
      ui.fire.disabled = state !== "playing" || warpTimer > 0;
      ui.fire.setAttribute("aria-disabled", String(ui.fire.disabled || manualShotCooldown > 0));
      ui.fire.setAttribute("aria-label", "Mantener para disparar pulso básico sin munición limitada");
      return;
    }
    ui.ammo.textContent = `${ammo}/${MAX_AMMO}`;
    const unavailable = state !== "playing" || ammo <= 0 || manualShotCooldown > 0 || warpTimer > 0;
    ui.fire.disabled = state !== "playing" || warpTimer > 0;
    ui.fire.setAttribute("aria-disabled", String(unavailable));
    ui.fire.classList.toggle("empty", ammo <= 0);
    ui.fire.setAttribute("aria-label", ammo > 0
      ? `Mantener para disparar. Munición ${ammo} de ${MAX_AMMO}`
      : "Mantener para disparar cuando recuperes munición");
  }

  function animateHud(element, className) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function updateHudVisual(dt) {
    const difference = hudScoreTarget - displayedScore;
    if (Math.abs(difference) < 0.5) displayedScore = hudScoreTarget;
    else displayedScore += difference * Math.min(1, dt * 11);
    ui.score.textContent = Math.round(displayedScore);
  }

  function updatePowerHud() {
    let layoutChanged = false;
    const map = [
      ["shield", ui.powerShield],
      ["tractor", ui.powerTractor],
      ["slow", ui.powerSlow],
      ["double", ui.powerDouble],
      ["phaser", ui.powerPhaser]
    ];
    for (const [name, element] of map) {
      const active = powers[name] > 0;
      if (element.classList.contains("active") !== active) layoutChanged = true;
      element.dataset.power = name;
      element.classList.toggle("active", active);
      element.querySelector("em").textContent = active ? Math.ceil(powers[name]) : "0";
    }
    // Only additions/removals can resize the row. Countdown frames must not
    // measure layout; a newly collected power must not cover the ship's tail.
    if (layoutChanged && isUnifiedClassic() && state === "playing") refreshClassicFlightBounds();
  }

  function updateEncounterHud() {
    ui.encounterProgress.classList.toggle("active", Boolean(encounterDirector));
    if (encounterDirector) {
      ui.encounterProgress.querySelector("em").textContent = `${encounterWave}/${encounterDirector.plan.waves.length}`;
    }
  }

  function buildLevelGrid() {
    const unlocked = getUnlocked();
    const starsMap = getStars();
    const bests = getLevelBest();
    ui.levelGrid.innerHTML = "";

    LEVELS.forEach((lv, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `level-card cockpit-destination${index === currentLevel ? " current" : ""}`;
      button.style.setProperty("--level-accent", lv.accent);
      button.dataset.scene = lv.scene;
      button.disabled = index + 1 > unlocked;
      const earned = +(starsMap[index + 1] || 0);
      const starText = "★".repeat(earned) + "☆".repeat(3 - earned);
      button.innerHTML = `
        <small>${N7_CAMPAIGN ? "RUTA" : "NIVEL"} ${index + 1}</small>
        <strong>${lv.name}</strong>
        <span>${lv.world} · ${lv.goal} ${N7_CAMPAIGN ? "núcleos" : "CRONIUM"}</span>
        <div class="level-stars">${button.disabled ? "" : starText}</div>
        ${button.disabled ? '<div class="lock">🔒</div>' : ""}
      `;
      if (!button.disabled) button.onclick = () => prepareLevel(index, "levels");
      ui.levelGrid.appendChild(button);
    });
  }

  function prepareLevel(index, returnTo = "menu") {
    classicVoyageRequestedStage=null;
    pendingLevel = clamp(index, 0, getUnlocked() - 1);
    briefingReturn = returnTo;
    const lv = LEVELS[pendingLevel];
    ui.briefingSector.textContent = `${N7_CAMPAIGN ? "RUTA" : "NIVEL"} ${pendingLevel + 1}`;
    ui.briefingName.textContent = lv.name;
    ui.briefingZone.textContent = `${lv.world} · ${lv.zone}`;
    ui.briefingGoal.textContent = `${lv.goal} ${N7_CAMPAIGN ? "núcleos" : "CRONIUM"}`;
    ui.briefingThreat.textContent = lv.threatLabel;
    ui.briefingSupply.textContent = `${lv.goal + Math.ceil(lv.goal * 0.25)} disponibles`;
    ui.briefingMission.textContent = lv.mission;
    ui.briefingVisual.dataset.scene = lv.scene;
    ui.briefingPanel.style.setProperty("--brief-accent", lv.accent);
    buildChronosStageGrid();
    overlay(ui.briefing);
  }

  function closeBriefing() {
    if (briefingReturn === "levels") overlay(ui.levelSelect);
    else if (briefingReturn === "complete") overlay(ui.complete);
    else overlay(ui.menu);
  }

  function showBanner() {
    ui.bannerSector.textContent = `${N7_CAMPAIGN ? "RUTA" : "SECTOR"} ${currentLevel + 1}`;
    ui.bannerName.textContent = level().name.toUpperCase();
    ui.bannerGoal.textContent = `Recupera ${level().goal} núcleos · ${level().desc}`;
    ui.banner.classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => ui.banner.classList.remove("show"), 2500);
  }

  function resetPowers() {
    for (const key in powers) powers[key] = 0;
    classicShieldAge=0;classicShieldImpact=0;
    tractorTarget = null;
    updatePowerHud();
  }

  function hideWarning() {
    ui.hazardWarning.classList.remove("show");
  }

  const LEVEL_ONE_STORY = [
    { at: 2.8, speaker: "IA N-7", text: "Centro Cronos, responda. Repito: Centro Cronos, responda." },
    { at: 18, speaker: "IA N-7", text: "Sin respuesta. Detecto fragmentos temporales dentro del corredor." },
    { at: 42, speaker: "IA N-7", text: "La radiación no coincide con ningún accidente registrado." }
  ];

  function hideStoryTransmission() {
    ui.storyTransmission?.classList.remove("show");
    flightTransmission=null;
  }

  function showStoryTransmission(speaker, text, duration = 4.6) {
    if(isUnifiedClassic() && ui.flightRoute) {
      flightTransmission={speaker,speakerId:/MIRA/.test(speaker)?"mira":/IRIA/.test(speaker)?"iria":/LIRA/.test(speaker)?"lira":null,text,remaining:duration};syncClassicFlightHud();return;
    }
    if (!ui.storyTransmission) return;
    ui.storySpeaker.textContent = speaker;
    ui.storyText.textContent = text;
    ui.storyTransmission.classList.add("show");
    storyTimer = duration;
    tone(315, 0.06, "sine", 0.035);
  }

  function updateLevelStory(dt) {
    if(flightTransmission) {
      flightTransmission.remaining=Math.max(0,flightTransmission.remaining-dt);
      if(flightTransmission.remaining===0){flightTransmission=null;syncClassicFlightHud();}
    }
    if (storyTimer > 0) {
      storyTimer = Math.max(0, storyTimer - dt);
      if (storyTimer === 0) hideStoryTransmission();
    }
    if(classicChapterStory&&classicFlightView) {
      classicChapterStory.advance({elapsed:classicFlightView.elapsed,playing:state==="playing",
        aftermathElapsed:classicChapterOutroStartedAt===null?0:elapsed-classicChapterOutroStartedAt},classicChapterEvent);
      classicChapterView=classicChapterStory.snapshot();syncClassicChapterPresentation();
      advanceClassicTutorial();
      if(atlasBoss?.resolved&&classicChapterView.aftermathReady)completeLevel();
    }
    if (classicFlight || N7_CAMPAIGN || JOURNEY_DEMO || currentLevel !== 0 || state !== "playing" || warpTimer > 0) return;
    const next = LEVEL_ONE_STORY[storyStep];
    if (next && elapsed >= next.at) {
      showStoryTransmission(next.speaker, next.text);
      storyStep++;
    }
    if (elapsed >= 31 && !levelOneShockwaveTriggered) {
      levelOneShockwaveTriggered = true;
      levelOneShockwave = 0.62;
      stormPulse = Math.max(stormPulse, 0.42);
      shake = Math.max(shake, 12);
      cameraKickY = 8;
      pulseRing(player.x, player.y + SHIP_VISUAL.centerYOffset, "#a5faff", 245, 0.56, "pulse");
      burst(player.x, player.y + SHIP_VISUAL.centerYOffset, 38, "cyan");
      tone(78, 0.8, "sawtooth", 0.055);
      showStoryTransmission("IA N-7", "Onda expansiva. Mantén el rumbo.", 3.2);
    }
  }

  function startLevel(index = currentLevel) {
    if (typeof resetGameInput === "function") resetGameInput();
    runToken += 1;
    cancelSupplyFailureTimer();
    startMusic();
    currentLevel = clamp(index, 0, getUnlocked() - 1);
    let voyageEntry=null,voyageCheckpoint=null;
    if(isUnifiedClassic()&&currentLevel===0){
      const requested=classicVoyageRequestedStage;
      const resume=classicVoyageRecord&&!classicVoyageRecord.completed&&(!requested||requested===classicVoyageRecord.checkpoint.stageNumber);
      if(resume){voyageCheckpoint=classicVoyageRecord.checkpoint;voyageEntry=classicVoyageRecord.entry;}
      else if(requested){voyageCheckpoint=NeonCampaign.createChronosVoyageCheckpoint(requested,{goal:LEVELS[0].goal});}
    }
    classicVoyageRequestedStage=null;
    classicFlight=isUnifiedClassic() && currentLevel===0 ? NeonCampaign.createChronosVoyage({goal:LEVELS[0].goal,checkpoint:voyageCheckpoint}) : null;
    classicFlightView=classicFlight?.snapshot() || null;
    classicChapterStory=classicFlight?NeonCampaign.createChronosChapterStory({checkpoint:voyageEntry?classicVoyageRecord?.chapter:null,routeElapsed:classicFlightView.elapsed,presentation:"in-world"}):null;
    classicChapterView=classicChapterStory?.snapshot()||null;classicChapterOutroStartedAt=null;
    classicTutorial=classicFlight?NeonCampaign.createFlightTutorial({routeElapsed:classicFlightView.elapsed,checkpoint:settings.flightTutorial}):null;classicWorkshopOpened=false;
    classicTutorialAnchor=null;classicTutorialSignature='';
    classicWeapons=isUnifiedClassic() ? NeonCampaign.createClassicWeapons({type:classicEquipment.selected,unlocked:classicEquipment.unlocked,width:W,height:H}) : null;
    if(isUnifiedClassic())beginClassicSalvageRun(Boolean(voyageEntry));
    resetClassicCometShower();
    // A restored entry has already emitted its checkpoint event. Initialize
    // the same encounter grace here instead of waiting for that event to replay.
    classicPatrolTimer=classicFlightView?(classicFlightView.stageNumber===1?4:7):0;
    classicPatrolSequence=0;classicPursuitAnnounced=new Set();classicThreatSequence=0;classicCometSequence=0;classicCometWarning=-1;flightHudSignature="";
    classicVoyageSpawnTimer=1;classicVoyageHazardTimer=10;classicVoyageStageId=classicFlightView?.stageId||"";
    NeonCampaign.endFlightInput(classicFlightInput);
    if(isUnifiedClassic()) {
      ensureSprite(SPRITES.chapterMissile);ensureSprite(SPRITES.chapterPortraits);ensureSprite(SPRITES.croniumEnergy);
      ensureSprite(SPRITES.atlasVfx);ensureSprite(SPRITES.gaiaPulse);ensureSprite(SPRITES.hostileOrdnance);ensureSprite(SPRITES.flightWeapons);ensureSprite(SPRITES.forceShieldAtlas);
      if(classicEquipment.selected==="lance")SPRITE_GROUPS.phaser.forEach(ensureSprite);
      if(classicFlight){
        ensureSprite(SPRITES.flightKit);ensureSprite(SPRITES.flightSpace);
        ensureSprite(SPRITES.ch01);
        ensureSprite(SPRITES.chronosDestruction);ensureSprite(SPRITES.chronosShockwave);ensureSprite(SPRITES.guardianAtlas);
      }
    }

    atlasBoss = null;
    atlasFireTimer = atlasReentryGrace = 0;
    atlasLastStatus = "";
    ui.goal.previousElementSibling.textContent = "NÚCLEOS";
    document.body.classList.remove("atlas-combat");
    ui.atlasEncounter?.classList.add("hidden");
    if (isAtlasMission()) {
      ensureSprite(SPRITES.guardianAtlas);ensureSprite(SPRITES.atlasVfx);
      ensureSprite(SPRITES.ch01);ensureSprite(SPRITES.ch02);
      ensureSprite(SPRITES.flightKit);ensureSprite(SPRITES.flightSpace);ensureSprite(SPRITES.satellite);
    }
    encounterDirector = N7_CAMPAIGN ? new NeonCampaign.EncounterDirector(currentLevel + 1) : null;
    encounterWave = 0;
    setState("playing");
    score = 0;
    displayedScore = 0;
    hudScoreTarget = 0;
    hull = 100;
    classicHullReserve=classicHullReserveCapacity;
    combo = 1;
    maxCombo = 1;
    comboTimer = 0;
    collected = 0;
    if(classicFlight){
      collected=classicFlightView.collected;
      if(voyageEntry){hull=voyageEntry.hull;classicHullReserve=Math.min(classicHullReserveCapacity,voyageEntry.reserve??classicHullReserveCapacity);score=voyageEntry.score;maxCombo=voyageEntry.maxCombo;}
    }
    ammo = classicWeapons?classicWeapons.charges:INITIAL_AMMO;
    manualShotCooldown = 0;
    elapsed = 0;
    continued = false;
    spawnTimer = 0.35;
    classicScoutTimer = !N7_CAMPAIGN && currentLevel === 1 ? 3.8 : 0;
    classicScoutAnnounced = false;
    warpTimer = classicFlight ? 0 : 1.25;
    supplyFailed = false;
    shake = 0;
    flash = 0;
    stormPulse = 0;
    destructionTimer = 0;
    destructionStage = 0;
    playerVisible = true;
    damageSmokeSide = 1;
    damageSmokeLocked = false;
    impactReactionTimer = 0;
    impactReactionSide = 1;
    storyStep = 0;
    storyTimer = 0;
    levelOneShockwave = 0;
    levelOneShockwaveTriggered = false;
    cameraKickX = 0;
    cameraKickY = 0;
    lastHudCollected = 0;
    lastHudHull = 100;
    hideStoryTransmission();
    items = [];
    gates = [];
    clearTransientEffects();
    player.x = player.target = W / 2;
    player.drift = 0;
    resetPowers();
    applyClassicSalvageShield();

    energySpawned = 0;
    if(classicFlight)energySpawned=collected;
    energyBudget = level().goal + Math.ceil(level().goal * 0.25);
    powerSpawned = 0;
    powerBudget = 2 + Math.floor(currentLevel / 3);
    repairAllowance = currentLevel >= 3 && Math.random() < 0.45 ? 1 : 0;
    repairSpawned = 0;
    phaserCooldown = 0;
    gateCountdown = level().gate ? 8.5 + Math.random() * 3 : Infinity;

    ui.reward.classList.remove("hidden");
    ui.reward.disabled = false;
    ui.newBest.classList.add("hidden");
    ui.supplyStatus.textContent = "";
    hideWarning();
    overlay();
    ui.hud.classList.remove("hidden");
    ui.powerHud.classList.remove("hidden");
    ui.fire.classList.remove("hidden");
    if(isUnifiedClassic()){setClassicFlightHudVisible(true);refreshClassicFlightBounds(true);}
    hud();
    updateEncounterHud();
    if(!isUnifiedClassic()) showBanner();
    if (N7_CAMPAIGN) {
      const opening = NeonCampaign.n7Dialogue("sectorStart", {level: currentLevel + 1});
      if (opening) showStoryTransmission("N-7", opening);
    }
    tone(540 + currentLevel * 22, 0.11, "triangle", 0.07);
    if(classicFlightView?.waitingFor==="service")beginClassicVoyageService();
    window.AnalyticsManager?.track("game_start", { level: currentLevel + 1 });
    window.AnalyticsManager?.track("level_start", { level: currentLevel + 1, continued: false });
  }

  function pauseGame() {
    if (state !== "playing") return;
    if (typeof resetGameInput === "function") resetGameInput();
    journey?.setPaused(true);
    NeonCampaign.endFlightInput(classicFlightInput);
    setState("paused");
    hideWarning();
    overlay(ui.paused);
  }

  function resumeGame() {
    if (state !== "paused") return;
    if(ui.flightDock?.classList.contains("show")&&flightDockReturn==="hud"){closeClassicDock();return;}
    if (JOURNEY_DEMO && journey?.snapshot().phase === "station") { showJourneyStation(); return; }
    journey?.setPaused(false);
    setState("playing");
    overlay();
    last = performance.now();
    resumeAudio();
  }

  function goHome() {
    if (typeof resetGameInput === "function") resetGameInput();
    classicTutorial=null;classicFlight=null;classicFlightView=null;classicChapterStory=null;classicChapterView=null;classicChapterOutroStartedAt=null;
    syncClassicChapterPresentation();
    if(classicWeapons)classicWeapons.projectiles.length=0;
    NeonCampaign.endFlightInput(classicFlightInput);
    setClassicFlightHudVisible(false);
    runToken += 1;
    cancelSupplyFailureTimer();
    setState("menu");
    atlasBoss = null;
    ui.atlasEncounter?.classList.add("hidden");
    document.body.classList.remove("atlas-combat");
    ui.hud.classList.add("hidden");
    ui.powerHud.classList.add("hidden");
    ui.fire.classList.add("hidden");
    ui.banner.classList.remove("show");
    syncClassicChapterPresentation();
    hideWarning();
    hideStoryTransmission();
    if (JOURNEY_DEMO) {
      persistJourney();
      ui.journeyRoute.classList.add("hidden");
      ui.journeySkills.classList.add("hidden");
    }
    overlay(ui.menu);
    updateMenu();
  }

  function registerRun() {
    if (JOURNEY_DEMO) return;
    const games = Math.trunc(Math.max(0, storage.getNumber(KEYS.games, 0))) + 1;
    storage.set(KEYS.games, games);
    const interval = Math.trunc(Math.max(0, Number(window.MONETIZATION_CONFIG?.native?.interstitialEveryRuns) || 0));
    if (interval > 0 && games % interval === 0) window.AdBridge?.showInterstitial?.().catch(() => {});
  }

  function saveScore() {
    // Game-over saves run outside the completion journal. Read both records
    // explicitly before writing: a denied read must never become a zero/default.
    const bestRead=storage.readRaw(KEYS.best),levelsRead=storage.readRaw(KEYS.levelBest);
    if(!bestRead.ok||!levelsRead.ok||!Number.isFinite(score)||score<0)return false;
    const previousBest=bestRead.value===null||bestRead.value===""?0:Number(bestRead.value);
    if(!Number.isFinite(previousBest)||previousBest<0)return false;
    let bests;
    try {bests=levelsRead.value===null?{}:JSON.parse(levelsRead.value);} catch {return false;}
    if(!bests||typeof bests!=="object"||Array.isArray(bests)||
      Object.values(bests).some(value=>!Number.isFinite(Number(value))||Number(value)<0))return false;
    const previousLevel=Object.hasOwn(bests,currentLevel+1)?Number(bests[currentLevel+1]):0;
    if(score>previousBest&&!storage.set(KEYS.best,score))return false;
    if(score>previousLevel)return storage.setJSON(KEYS.levelBest,{...bests,[currentLevel+1]:score});
    return true;
  }

  function completeLevel() {
    if (JOURNEY_DEMO) return;
    if (state !== "playing") return;
    if(classicFlight && !classicFlight.snapshot().canFinish)return;
    if(classicChapterStory&&atlasBoss?.resolved&&!classicChapterView?.aftermathReady)return;
    if (isAtlasMission() && collected >= level().goal) {
      if (!atlasBoss) { beginAtlasEncounter(); return; }
      if (!atlasBoss.resolved) return;
    }
    if (N7_CAMPAIGN && (!encounterDirector?.finished || items.some(isThreat))) return;
    if (typeof resetGameInput === "function") resetGameInput();
    runToken += 1;
    cancelSupplyFailureTimer();
    setState("complete");
    setClassicFlightHudVisible(false);
    if(classicWeapons)classicWeapons.projectiles.length=0;
    ui.atlasEncounter?.classList.add("hidden");
    document.body.classList.remove("atlas-combat");
    hideWarning();
    ui.hud.classList.add("hidden");
    ui.powerHud.classList.add("hidden");
    ui.fire.classList.add("hidden");
    ui.banner.classList.remove("show");

    const missed = energySpawned - collected;
    const earned = hull >= 90 && missed <= Math.ceil(energyBudget * 0.1) ? 3 : hull >= 55 ? 2 : 1;
    const completedVoyage=classicFlightView?.canFinish
      ? classicVoyageCheckpointRecord(classicFlight.exportCheckpoint(),true) : null;
    // A corrupt equipment record is recoverable only after its exact bytes
    // have a durable backup. Establish a valid, reward-free baseline before the
    // journal validates its before/after snapshot; never overwrite without it.
    let equipmentReady=classicEquipmentWritable;
    if(isAtlasMission()&&atlasBoss?.resolved&&equipmentReady) {
      const raw=storage.getRaw(CLASSIC_EQUIPMENT_KEY);
      let valid=raw===null;
      try {valid=raw===null||NeonCampaign.normalizeClassicEquipment(JSON.parse(raw))!==null;} catch {}
      if(!valid) {
        const backups=storage.getJSON(CLASSIC_EQUIPMENT_KEY+":invalid-backups",[]);
        equipmentReady=Array.isArray(backups)&&backups.includes(raw)&&persistClassicEquipment(classicEquipment);
      }
    }
    // The bounded intent is written before any progress key or boss reward.
    // A reload replays only durable targets without replaying combat events.
    const completion = (!classicVoyageWritable || (isAtlasMission() && !equipmentReady)) ? {ok:false,status:"blocked"}
      : completionJournal.complete({completionId:`${KEYS.unlocked}:${currentLevel+1}:${runToken}:${Date.now()}`,
        level:currentLevel+1,stars:earned,score:Math.max(0,Math.floor(score)),checkpoint:completedVoyage,
        equipment:isAtlasMission()&&atlasBoss?.resolved ? NeonCampaign.awardClassicBossWeapon(classicEquipment,"guardian-atlas").equipment : null});
    const progressSaved=completion.ok,newlyUnlocked=Boolean(completion.newlyUnlocked);
    completionPersistenceBlocked=!completion.ok;
    if(completedVoyage&&completion.ok)classicVoyageRecord=completedVoyage;
    if(isAtlasMission()&&atlasBoss?.resolved&&completion.ok) {
      const earnedEquipment=NeonCampaign.normalizeClassicEquipment(storage.getJSON(CLASSIC_EQUIPMENT_KEY,null));
      if(earnedEquipment)classicEquipment=earnedEquipment;
    }
    registerRun();
    ui.completeLabel.textContent = currentLevel === LEVELS.length - 1 ? "CAMPAÑA ACTUAL COMPLETADA" : N7_CAMPAIGN ? "RUTA SUPERADA" : "NIVEL SUPERADO";
    if(ui.completeVisual)ui.completeVisual.dataset.scene=level().scene;
    ui.completeTitle.textContent = currentLevel === LEVELS.length - 1
      ? (N7_CAMPAIGN ? "Has atravesado las cien rutas" : "Has estabilizado el Colapso Neon")
      : `${level().name} completado`;
    if (isAtlasMission() && atlasBoss?.resolved) ui.completeTitle.textContent = "Atlas ha abierto el paso";
    ui.starsAwarded.innerHTML = [1, 2, 3]
      .map((value) => `<span class="${value <= earned ? "" : "off"}">★</span>`)
      .join("");
    ui.levelScore.textContent = score;
    ui.levelHull.textContent = `${Math.ceil(hull)}%`;
    ui.maxCombo.textContent = `x${maxCombo}`;
    ui.unlockMessage.textContent = currentLevel === LEVELS.length - 1
      ? (N7_CAMPAIGN ? "Puedes volver a cada ruta para mejorar tus estrellas" : "Puedes volver a cada nivel para mejorar tu resultado")
      : newlyUnlocked
        ? `${N7_CAMPAIGN ? "Ruta" : "Nivel"} ${currentLevel + 2} desbloqueado`
        : "Puedes repetirlo para mejorar el resultado";
    ui.nextLevel.classList.toggle("hidden", currentLevel === LEVELS.length - 1);
    ui.nextLevel.textContent=isUnifiedClassic()&&currentLevel===0
      ?"CRUZAR HACIA GAIA NOVA →":N7_CAMPAIGN?"SIGUIENTE RUTA →":"SIGUIENTE NIVEL →";
    if(isUnifiedClassic()&&currentLevel===0) {
      if(ui.completeVisual)ui.completeVisual.dataset.scene="rift";
      ui.completeLabel.textContent="NIVEL 1 · FRONTERA DE GAIA ABIERTA";
      ui.completeTitle.textContent="El registro ha llegado a Gaia";
      ui.unlockMessage.textContent="IRIA · MANDO ORBITAL: El convoy utilizó tu identificación. El registro demuestra el sabotaje. Tienes autorización de recuperación; la siguiente señal procede de Vulkar.";
      ui.nextLevel.textContent="CONTINUAR POR EL PERÍMETRO DE GAIA →";
    }
    if(isAtlasMission()&&atlasBoss?.resolved&&progressSaved)ui.unlockMessage.textContent+=" Segundo cañón autorizado: Gemelo ×2 disponible en el taller.";
    overlay(ui.complete);
    tone(760, 0.12, "triangle", 0.08);
    setTimeout(() => tone(980, 0.18, "sine", 0.07), 120);
    vibrate([30, 40, 70]);
    updateMenu();
    if (!progressSaved) toast("No se pudo guardar el progreso en este dispositivo");
    window.AnalyticsManager?.track("level_complete", {
      level: currentLevel + 1, score, hull: Math.ceil(hull), stars: earned, maxCombo
    });
    window.AnalyticsManager?.track("progression", { unlocked: getUnlocked(), totalStars: totalStars() });
  }

  function finishGame(reason = "hull") {
    if (state === "gameover" || state === "complete") return;
    if (typeof resetGameInput === "function") resetGameInput();
    runToken += 1;
    cancelSupplyFailureTimer();
    setState("gameover");
    ui.atlasEncounter?.classList.add("hidden");
    setClassicFlightHudVisible(false);
    supplyFailed = reason === "supply";
    hideWarning();
    ui.hud.classList.add("hidden");
    ui.powerHud.classList.add("hidden");
    ui.fire.classList.add("hidden");
    ui.banner.classList.remove("show");
    const oldBest = bestScore();
    const scoreSaved = saveScore();
    ui.result.textContent = supplyFailed ? "No quedan núcleos suficientes" : "El casco ha cedido";
    ui.supplyStatus.textContent = supplyFailed
      ? `Recuperaste ${collected} de ${level().goal}. El suministro del sector era limitado.`
      : "";
    if (score > oldBest) ui.newBest.classList.remove("hidden");
    ui.final.textContent = score;
    ui.reward.classList.toggle("hidden", continued || supplyFailed);
    overlay(ui.over);
    registerRun();
    tone(110, 0.30, "sawtooth", 0.06);
    updateMenu();
    if (!scoreSaved) toast("No se pudo guardar el récord en este dispositivo");
    window.AnalyticsManager?.track("death", { level: currentLevel + 1, score, elapsed: Math.round(elapsed) });
    window.AnalyticsManager?.track("death_reason", { level: currentLevel + 1, reason });
  }

  function resumeReward() {
    if (continued || state !== "gameover" || supplyFailed) return false;
    runToken += 1;
    cancelSupplyFailureTimer();
    // Restaura por completo el estado visual y lógico tras la destrucción.
    // La pantalla de derrota se abre después de la animación final, por lo que
    // hay que cancelar cualquier resto de ese estado antes de volver a jugar.
    hull = Math.max(hull, 35);
    continued = true;
    setState("playing");
    if (atlasBoss) {
      atlasReentryGrace = 1.25;
      ui.atlasEncounter?.classList.remove("hidden");
    }
    last = performance.now();
    playerVisible = true;
    destructionTimer = 0;
    destructionStage = 0;
    shake = 0;
    flash = 0;
    stormPulse = 0;

    // La nave reaparece centrada y estable; conserva daño medio al 35 %,
    // pero no reutiliza inclinaciones ni efectos de la explosión anterior.
    player.x = clamp(player.x, 78, W - 78);
    player.target = player.x;
    player.drift = 0;
    damageSmokeSide = 1;
    damageSmokeLocked = true;
    impactReactionTimer = 0;
    impactReactionSide = 1;
    storyTimer = 0;
    levelOneShockwave = 0;
    hideStoryTransmission();

    // Elimina amenazas próximas y todos los residuos visuales de destrucción.
    items = items.filter((item) => !isThreat(item) || item.y < H * 0.38);
    gates = [];
    clearTransientEffects();
    tractorTarget = null;
    gateCountdown = level().gate ? 7 : Infinity;

    // Breve protección para evitar morir de nuevo en el mismo instante.
    if(isUnifiedClassic()) {powers.shield=0;classicHullReserve=Math.max(classicHullReserve,15);}
    else powers.shield = Math.max(powers.shield, 4);
    if(isUnifiedClassic() && classicWeapons) {classicWeapons.charges=Math.max(classicWeapons.charges,1);classicWeapons.cooldown=0;classicWeapons.projectiles.length=0;}
    ammo = Math.max(ammo, 1);
    manualShotCooldown = 0;

    overlay();
    ui.hud.classList.remove("hidden");
    ui.powerHud.classList.remove("hidden");
    ui.fire.classList.remove("hidden");
    setClassicFlightHudVisible(isUnifiedClassic());
    hud();
    updatePowerHud();
    refreshClassicFlightBounds();
    showBanner();
    window.AnalyticsManager?.track("continue_used", { level: currentLevel + 1, elapsed: Math.round(elapsed) });
    return true;
  }
