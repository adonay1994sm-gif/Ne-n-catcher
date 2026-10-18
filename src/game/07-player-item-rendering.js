  // Image-backed artwork. The simulation, not the render clock, selects poses.
  const ATLAS_FRAME_PIVOTS = Array.from({length:8},()=>[256,256]);
  const ATLAS_VFX_CROPS = [[120,0,280,680],[546,0,298,725],[837,65,700,600],[1540,0,630,635]];

  function drawAtlasVfx(index, width, height, alpha = 1, head = .5) {
    if (!spriteReady(SPRITES.atlasVfx)) return false;
    const source = ATLAS_VFX_CROPS[index];
    const sx = SPRITES.atlasVfx.naturalWidth / 2170;
    const sy = SPRITES.atlasVfx.naturalHeight / 725;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.drawImage(SPRITES.atlasVfx, source[0] * sx, source[1] * sy, source[2] * sx, source[3] * sy, -width / 2, -height * head, width, height);
    ctx.restore(); return true;
  }

  function drawAtlasProjectile(item) {
    ctx.save(); ctx.translate(item.x, item.y);
    ctx.rotate(Math.atan2(item.vy || 1, item.vx || 0) + Math.PI / 2);
    if (!drawHostileOrdnance(item, 2, 64)) drawAtlasVfx(0, 27, 68, 1, .90);
    ctx.restore();
  }

  // The illustrated core and its short wake share the physics pivot. No aim
  // line, predicted landing point or additional update clock is drawn.
  function drawHostileOrdnance(item, row = 0, size = 52) {
    const atlas = SPRITES.hostileOrdnance;
    if (!spriteReady(atlas)) return false;
    const age = Number.isFinite(item.life) ? Math.max(0, 6 - item.life) : 0;
    const cell = atlas.naturalWidth / 4;
    const frame = Math.floor(age * (row === 2 ? 10 : 12)) % 4;
    ctx.drawImage(atlas, frame * cell, row * cell, cell, cell,
      -size / 2, -size / 2, size, size);
    return true;
  }

  function drawSalvagePickup(item) {
    if (!spriteReady(SPRITES.hostileOrdnance)) return;
    const atlas = SPRITES.hostileOrdnance, cell = atlas.naturalWidth / 4;
    ctx.save(); ctx.translate(item.x, item.y);
    ctx.globalAlpha *= Math.min(1, Math.max(0, item.life ?? 1));
    ctx.rotate(Math.sin((item.p || 0) * .5) * .18);
    // Early drops are raw scrap. Silver, gold and stellar coins are reserved
    // for their actual denominations, never used to mislabel a nine-scrap drop.
    const size = item.bossSalvage ? 56 : 38;
    ctx.drawImage(atlas, 0, cell * 3, cell, cell, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function drawArcadePulse(kind, age = 0, size = 72, alpha = 1) {
    const gaiaReady = spriteReady(SPRITES.gaiaPulse);
    const atlas = gaiaReady ? SPRITES.gaiaPulse : SPRITES.arcadePulse;
    if (!spriteReady(atlas)) return false;
    const row = kind === "impact" ? 3 : kind === "lance" ? 2 : kind === "twin" ? 1 : 0;
    const frame = gaiaReady ? (kind === "impact" ? Math.min(3, Math.floor(age * 16)) : Math.floor(age * 12) % 4)
      : kind === "impact" ? (age < .035 ? 0 : age < .09 ? 1 : age < .165 ? 2 : 3)
      : Math.floor(age / (row === 0 ? .06 : row === 1 ? .05 : .055)) % 4;
    const cell=atlas.naturalWidth/4;
    ctx.save();ctx.globalAlpha*=alpha;
    ctx.drawImage(atlas,frame*cell,row*cell,cell,cell,-size/2,-size/2,size,size);
    ctx.restore();return true;
  }

  function drawClassicProjectiles() {
    if (!isUnifiedClassic() || !classicWeapons) return;
    for (const shot of classicWeapons.projectiles) {
      ctx.save(); ctx.translate(shot.x, shot.y);
      ctx.rotate(Math.atan2(shot.vy, shot.vx) + Math.PI / 2);
      const age = shot.duration - shot.life;
      if(shot.weapon==="missile" && spriteReady(SPRITES.chapterMissile)) {
        const atlas=SPRITES.chapterMissile,cell=atlas.naturalWidth/4;
        // Launch hardware stays on the ship. Only the authored flying missile
        // row travels with this physical projectile, including its first frame.
        const frame=Math.floor(age*14)%4,size=54;
        ctx.drawImage(atlas,frame*cell,0,cell,cell,-size/2,-size/2,size,size);
      } else if(!drawArcadePulse(shot.weapon,age,shot.weapon === "lance" ? 88 : 72))
        drawAtlasVfx(1,shot.weapon === "twin" ? 16 : 23,68,1,.5);
      ctx.restore();
    }
  }

  function drawFlightModule(item) {
    if (!isUnifiedClassic() || !spriteReady(SPRITES.flightWeapons)) return;
    const atlas = SPRITES.flightWeapons;
    ctx.save(); ctx.translate(item.x, item.y);
    ctx.globalAlpha *= itemVisualAlpha(item);
    ctx.rotate(Math.sin(elapsed * .8 + (item.p || 0)) * .08);
    // A small navigation halo identifies a recoverable object. The object
    // itself is the authored hardware, not an icon substituted for the part.
    ctx.strokeStyle = "rgba(255,208,123,.75)"; ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(0, 0, 47, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.drawImage(atlas, 0, 0, atlas.naturalWidth / 3, atlas.naturalHeight,
      -64, -78, 128, 128);
    ctx.restore();
  }

  function hasClassicTwinMounts() {
    // Some isolated render fixtures deliberately do not install campaign UI.
    return typeof isUnifiedClassic === "function" && isUnifiedClassic() &&
      typeof classicEquipment !== "undefined" &&
      (["twin","lance"].includes(classicEquipment.selected) || classicEquipment.twinPrepared === true);
  }

  function classicTwinFrame() {
    const cooldown = atlasBoss ? manualShotCooldown : classicWeapons?.cooldown || 0;
    if (cooldown > .10) return 2;
    if (classicWeapons && classicWeapons.charges < 20 && classicWeapons.recharge > .10) return 1;
    return 0;
  }

  function drawClassicTwinMounts(target, frame = 0) {
    const atlas = SPRITES.flightWeapons;
    if (!spriteReady(atlas)) return false;
    const frameWidth = atlas.naturalWidth / 3;
    // All three poses share the same manufactured mount: roots +/-102,116;
    // muzzles +/-102,-134. The hull and wing layers cover the attachment roots.
    target.drawImage(atlas, frame * frameWidth, 0, frameWidth, atlas.naturalHeight,
      -256, -324, 512, 512);
    return true;
  }

  function drawGuardianAtlas() {
    if (!atlasBoss || !spriteReady(SPRITES.guardianAtlas)) return;
    const boss = atlasBoss;
    if (boss.state === "charge" && boss.telegraph) {
      // Charge belongs to the barrels. Do not reveal a solved escape lane or
      // paint the player's future safe position onto the arena.
      for(const side of [-1,1]) {
        const artSize=(boss.visualSize||350)*1.25;
        ctx.save();ctx.translate(boss.x+side*artSize*.25,boss.y+artSize*(327/512-.5));
        drawAtlasVfx(3,48,48,.45+boss.telegraph.progress*.5);ctx.restore();
      }
    }
    const animation = NeonCampaign.guardianAtlasAnimation(boss);
    const frameWidth = SPRITES.guardianAtlas.naturalWidth / 4;
    const frameHeight = SPRITES.guardianAtlas.naturalHeight / 2;
    // V2 adds actual transparent gutters: compensate only the artboard size,
    // keeping the model's reactor position, radius and combat geometry intact.
    const size = (boss.visualSize || 350)*1.25;
    const paint = (frame, alpha) => {
      if (alpha <= 0) return;
      const pivot = ATLAS_FRAME_PIVOTS[frame];
      ctx.save(); ctx.globalAlpha *= alpha;
      ctx.drawImage(SPRITES.guardianAtlas, (frame % 4) * frameWidth, Math.floor(frame / 4) * frameHeight,
        frameWidth, frameHeight,
        boss.x - size * pivot[0] / 512, boss.y - size * pivot[1] / 512, size, size);
      ctx.restore();
    };
    if (animation.previousFrame !== null) paint(animation.previousFrame, 1 - animation.blend);
    paint(animation.frame, animation.blend);
  }

  // Authored component crops share explicit mounting coordinates, not icon offsets.
  function drawShipComponent(target, loadout, part) {
    const atlas = SPRITES.modularShip;
    if (!spriteReady(atlas)) return false;
    const frame = NeonCampaign.shipPartFrame(loadout, part);
    const source = frame.source, destination = frame.destination;
    const sx = atlas.naturalWidth / frame.sourceWidth;
    const sy = atlas.naturalHeight / frame.sourceHeight;
    if (part === "flames") {
      for (const plume of frame.plumes) {
        const crop=plume.source,mount=plume.destination;
        target.drawImage(atlas,crop.x*sx,crop.y*sy,crop.width*sx,crop.height*sy,
          mount.x,mount.y,mount.width,mount.height);
      }
      return true;
    }
    target.drawImage(atlas, source.x * sx, source.y * sy, source.width * sx, source.height * sy,
      destination.x, destination.y, destination.width, destination.height);
    return true;
  }

  function drawModularShip(target, loadout, size, time, steering = 0, health = 100, impact = 0, weaponFrame = null, bankStrength=1,reinforcement=0) {
    if (!spriteReady(SPRITES.modularShip)) return false;
    const pose = NeonCampaign.shipAssemblyPose({elapsedSeconds: time, steering, hull: health, impactSeconds: impact,bankStrength});
    target.save();
    target.scale(size / 512, size / 512);
    target.rotate(pose.bankRotation);
    target.scale(pose.bankScaleX, 1);
    // Exhaust stretches from the nozzle, never from the centre of the ship.
    const nozzles=typeof NeonCampaign.shipNozzleAnchors==="function"?NeonCampaign.shipNozzleAnchors(loadout):[{y:173}];
    const nozzleY=nozzles.reduce((sum,point)=>sum+point.y,0)/nozzles.length;
    target.save(); target.translate(0, nozzleY);
    target.scale(1, pose.enginePulse); target.translate(0, -nozzleY);
    drawShipComponent(target, loadout, "flames"); target.restore();
    if (weaponFrame !== null) drawClassicTwinMounts(target, weaponFrame);
    // A small articulated sweep pivots at each root, underneath the fuselage.
    for (const side of [-1, 1]) {
      target.save();
      target.beginPath(); target.rect(side < 0 ? -512 : 0, -512, 512, 1024); target.clip();
      target.translate(side * 52, -35); target.rotate(side * pose.wingSweep);
      target.translate(-side * 52, 35);
      drawShipComponent(target, loadout, "wings"); target.restore();
    }
    drawShipComponent(target, loadout, "engines");
    drawShipComponent(target, loadout, "hull");
    if(reinforcement>0) {
      // The reinforcement is part of the existing wing plating, not a floating
      // shield bubble. A material flash marks absorbed damage on those panels.
      target.save();target.globalCompositeOperation="screen";
      target.globalAlpha*=Math.min(.5,reinforcement);
      drawShipComponent(target,loadout,"wings");target.restore();
    }
    target.restore();
    return true;
  }

  function syncShipPresentation() {
    const twin = hasClassicTwinMounts();
    if (shipPresentationSignature?.mode === shipRenderMode && shipPresentationSignature?.loadout === shipLoadout &&
      shipPresentationSignature?.twin === twin) return;
    if (twin && !spriteReady(SPRITES.flightWeapons)) return;
    let source = "assets/player_ship_identity_v1.webp";
    if (spriteReady(SPRITES.modularShip)) {
      const preview = document.createElement("canvas"); preview.width = preview.height = 384;
      const previewContext = preview.getContext("2d");
      previewContext.translate(192, 170);
      drawModularShip(previewContext, shipLoadout, 330, 0, 0, 100, 0, twin ? 0 : null);
      source = preview.toDataURL("image/png");
    }
    document.querySelectorAll(".menu-ship-image, .briefing-ship").forEach(image => { image.src = source; });
    // A missing atlas must remain retryable; the portrait is only degradation.
    if (spriteReady(SPRITES.modularShip)) shipPresentationSignature = {mode: shipRenderMode, loadout: shipLoadout, twin};
  }

  function drawShipIdentityFallback(target, size) {
    if (!spriteReady(SPRITES.shipIdentity)) return false;
    // Exported from the same assembly: 512x640, hull pivot at (256,256).
    target.drawImage(SPRITES.shipIdentity, -size / 2, -size / 2, size, size * 1.25);
    return true;
  }

  function drawClassicDock(t) {
    if (!isUnifiedClassic() || !ui.flightDockCanvas || !ui.flightDock?.classList.contains("show")) return;
    const preview = ui.flightDockCanvas;
    const target = preview.getContext("2d");
    target.clearRect(0, 0, preview.width, preview.height);
    const servicing=flightDockReturn==="voyage"&&spriteReady(SPRITES.c9Station);
    if(servicing) {
      const image=SPRITES.c9Station,cellWidth=image.naturalWidth/2,cellHeight=image.naturalHeight/2;
      // Service pose, with the bay facing the real modular hull. No second
      // station clock: the stopped route owns the docking state.
      target.drawImage(image,0,cellHeight,cellWidth,cellHeight,71,-8,242,242);
    }
    const size=servicing?165:270;
    target.save(); target.translate(preview.width / 2, servicing?218:preview.height * .49);
    const twin = hasClassicTwinMounts();
    const assembled = drawModularShip(target, shipLoadout, size, t / 1000, 0, 100, 0, twin ? 0 : null);
    if (!assembled) {
      target.save(); target.scale(size / 512, size / 512);
      if (twin) drawClassicTwinMounts(target, 0);
      target.restore();
      drawShipIdentityFallback(target, size);
    }
    target.restore();
  }

  function drawShipHangar(t) {
    const preview = $("shipHangarCanvas");
    if (preview && $("shipHangar")?.classList.contains("show") && shipHangarDraft) {
      const target = preview.getContext("2d"); target.clearRect(0, 0, 512, 512);
      target.save(); target.translate(256, 224);
      const atlasUnavailable = !spriteReady(SPRITES.modularShip);
      $("shipAtlasNotice")?.classList.toggle("hidden", !atlasUnavailable);
      $("shipApply").disabled = atlasUnavailable;
      if (atlasUnavailable) {
        drawShipIdentityFallback(target, 350);
      } else {
        drawModularShip(target, shipHangarDraft.loadout, 380, t / 1000, Math.sin(t / 2000) * .32);
      }
      target.restore();
    }
    const modulePreview = $("journeyModulePreview");
    if (modulePreview && $("journeyStation")?.classList.contains("show")) {
      const target = modulePreview.getContext("2d"); target.clearRect(0, 0, 240, 150);
      target.save(); target.translate(120, -7); target.scale(.65, .65);
      drawShipComponent(target, NeonCampaign.normalizeShipLoadout({engines:"bastion"}), "engines");
      target.restore();
    }
  }

  function playerFrameState(t) {
    const desiredDelta = hull < 34 || state === "destroying" ? 0 : player.target + player.drift - player.x;
    const movingHard = Math.abs(desiredDelta) > 72;
    const moving = Math.abs(desiredDelta) > 16;
    let frameIndex;
    let flipX = false;

    if (hull < 34 || state === "destroying") {
      // El estado crítico y la destrucción usan una nave neutra para impedir que
      // una reacción de impacto quede congelada.
      frameIndex = 2;
    } else if (impactReactionTimer > 0) {
      // El frame 5 se usa solo durante la reacción breve de daño. Su orientación
      // sigue el lado golpeado y se cancela al reiniciar, continuar o agotarse.
      frameIndex = 5;
      flipX = impactReactionSide < 0;
    } else if (movingHard) {
      frameIndex = 4;
      flipX = desiredDelta > 0;
    } else if (moving) {
      frameIndex = 3;
      flipX = desiredDelta > 0;
    } else {
      const idleSequence = [0, 1, 2, 1];
      frameIndex = idleSequence[Math.floor(t / 115) % idleSequence.length];
    }

    return { frameIndex, flipX };
  }

  function drawPlayer(t) {
    if (state === "destroying" && !playerVisible) return;

    ctx.save();
    ctx.translate(player.x, player.y);

    const classic=typeof isUnifiedClassic==="function"&&isUnifiedClassic();
    const shipScale=SHIP_VISUAL.classicScale??1,assemblySize=SHIP_VISUAL.assemblySize??208;
    const bob = state === "destroying" ? 0 : Math.sin(t * 0.004) * 1.8*shipScale;

    if (powers.shield > 0 && !classic) {
      const shieldFrame = Math.sin(t * 0.012) > 0.45 ? SPRITES.shieldEffect : SPRITES.shieldIdle;
      ctx.save();
      ctx.translate(0, -26 * SHIP_VISUAL.scale + bob);
      ctx.globalCompositeOperation = "screen";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#4cffe9";
      drawImageCentered(shieldFrame, SHIP_VISUAL.shieldSize, SHIP_VISUAL.shieldSize, elapsed * 0.08, 0.42);
      ctx.restore();
    }

    const assembledLoadout = JOURNEY_DEMO && journeyView?.engineBoost
      ? NeonCampaign.normalizeShipLoadout({...shipLoadout, engines: "bastion"}) : shipLoadout;
    ctx.save(); ctx.translate(0, bob + SHIP_VISUAL.centerYOffset);
    const steering=classic&&Number.isFinite(player.visualBank)?player.visualBank:clamp((player.target+player.drift-player.x)/95,-1,1);
    const reserve=classic&&typeof classicHullReserve==="number"&&classicHullReserve>0
      ?.08+(typeof classicShieldImpact==="number"?classicShieldImpact:0):0;
    const assembled = drawModularShip(ctx, assembledLoadout, assemblySize, elapsed,
      steering, hull, impactReactionTimer,hasClassicTwinMounts()?classicTwinFrame():null,
      SHIP_VISUAL.bankStrength??1,reserve);
    ctx.restore();
    if (!assembled) {
    ctx.save();
    const criticalJitter = hull < 18 && state !== "destroying" ? Math.sin(elapsed * 19) * 1.6*shipScale : 0;
    ctx.translate(criticalJitter, bob + SHIP_VISUAL.centerYOffset);
    if (hasClassicTwinMounts()) {
      ctx.save(); ctx.scale(assemblySize / 512, assemblySize / 512);
      drawClassicTwinMounts(ctx, classicTwinFrame()); ctx.restore();
    }
    if (!drawShipIdentityFallback(ctx, assemblySize)) {
        ctx.save();
        ctx.scale(SHIP_VISUAL.scale, SHIP_VISUAL.scale);
        const body = ctx.createLinearGradient(-75, -55, 75, 55);
        body.addColorStop(0, "#325ee0");
        body.addColorStop(0.48, "#79e7ff");
        body.addColorStop(1, "#7040e8");
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(0, -72); ctx.lineTo(34, -24); ctx.lineTo(88, 18); ctx.lineTo(48, 38);
        ctx.lineTo(0, 52); ctx.lineTo(-48, 38); ctx.lineTo(-88, 18); ctx.lineTo(-34, -24);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    ctx.restore();

    }

    if(typeof isUnifiedClassic==="function" && isUnifiedClassic() && classicWeapons && classicWeapons.cooldown > (classicEquipment.selected==="lance"?.38:.20)) {
      // Tiny flashes at the physical emitters; no diagonal fake convergence rays.
      for(const offset of classicEquipment.selected==="twin" ? [-10,10] : [0]) {
        ctx.save();ctx.translate(offset*shipScale,-(SHIP_VISUAL.muzzleOffset??125));
        drawArcadePulse("impact",.035,24*shipScale,.8);ctx.restore();
      }
    }

    if (!assembled && hull < 67 && state !== "destroying") {
      // Los tres fotogramas comparten anclaje y estilo. El daño progresa mediante
      // tamaño/opacidad y una animación lenta que no cambia de motor.
      const smokeSequence = [0, 1, 2, 1];
      const smoke = frameFrom("smoke", smokeSequence[Math.floor(elapsed * 4.5) % smokeSequence.length]);
      if (smoke) {
        const severity = clamp((67 - hull) / 66, 0.12, 1);
        const sideX = damageSmokeSide * 40 * SHIP_VISUAL.scale;
        const driftY = (elapsed * (7 + severity * 5)) % 14;
        const pulse = 0.78 + severity * 0.38 + Math.sin(elapsed * 2.1) * 0.035;

        ctx.save();
        ctx.translate(sideX + Math.sin(elapsed * 1.25) * 2.5, 38 * SHIP_VISUAL.scale - driftY);
        ctx.globalAlpha = 0.24 + severity * 0.48;
        ctx.rotate(damageSmokeSide * 0.035 + Math.sin(elapsed * 0.9) * 0.035);
        ctx.scale(pulse * SHIP_VISUAL.scale, pulse * SHIP_VISUAL.scale);
        ctx.drawImage(smoke, -56, -50, 112, 100);
        ctx.restore();

        if (hull < 20) {
          ctx.save();
          ctx.translate(sideX * 0.78 - damageSmokeSide * 16 * SHIP_VISUAL.scale, 22 * SHIP_VISUAL.scale - ((elapsed * 8) % 10));
          ctx.globalAlpha = 0.30 + severity * 0.22;
          ctx.scale((0.70 + severity * 0.20) * SHIP_VISUAL.scale, (0.70 + severity * 0.20) * SHIP_VISUAL.scale);
          ctx.drawImage(smoke, -48, -43, 96, 86);
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }

  function itemVisualAlpha(item) {
    return item.alpha * clamp((item.y - 95) / 85, 0, 1);
  }

  let classicCroniumHalo=null;
  function preparedCroniumHalo() {
    if(classicCroniumHalo)return classicCroniumHalo;
    if(typeof document==="undefined")return null;
    const image=document.createElement("canvas");image.width=image.height=96;
    const target=image.getContext("2d"),halo=target.createRadialGradient(48,48,2,48,48,48);
    halo.addColorStop(0,"rgba(220,255,255,.9)");halo.addColorStop(.24,"rgba(76,241,255,.55)");
    halo.addColorStop(.60,"rgba(28,139,255,.15)");halo.addColorStop(1,"rgba(12,64,255,0)");
    target.fillStyle=halo;target.fillRect(0,0,96,96);classicCroniumHalo=image;return image;
  }

  function drawEnergy(item) {
    if (typeof isUnifiedClassic === "function" && isUnifiedClassic()) {
      // V2 is actual animated energy, padded on every cell. Preserve the whole
      // illustration: no rectangular crop, metal bezel or opaque fragment.
      const phase = Number.isFinite(item.phase) ? item.phase : 0;
      const atlas=SPRITES.croniumEnergy,frame=Math.floor(elapsed*8+phase)%4;
      const pulse = 1 + Math.sin(elapsed * 3.4 + phase) * .04;
      ctx.save(); ctx.translate(item.x, item.y);
      ctx.globalAlpha = itemVisualAlpha(item); ctx.scale(.5 * pulse, .5 * pulse);
      ctx.shadowBlur = 0;ctx.globalCompositeOperation="screen";
      const halo=preparedCroniumHalo(),glow=item.r*4.1,size=item.r*4;
      if(halo)ctx.drawImage(halo,-glow/2,-glow/2,glow,glow);
      if(spriteReady(atlas)) {
        const cell=atlas.naturalWidth/2;
        ctx.drawImage(atlas,(frame%2)*cell,Math.floor(frame/2)*cell,cell,cell,-size/2,-size/2,size,size);
      }
      ctx.restore(); return;
    }
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    // Visual scale only: the proven collection radius and tractor stay intact.
    const orbVisualScale=typeof isUnifiedClassic==="function" && isUnifiedClassic() ? .5 : 1;
    ctx.scale(orbVisualScale,orbVisualScale);
    const distanceToShip = Math.hypot(player.x - item.x, player.y - item.y);
    const proximity = state === "playing" ? clamp(1 - distanceToShip / 330, 0, 1) : 0;
    const pulseSequence = [0,1,2,3,4,5,4,3,2,1];
    const frame = frameFrom("core", pulseSequence[Math.floor((elapsed * 9 + item.phase) % pulseSequence.length)]);
    const breath = 0.5 + 0.5 * Math.sin(elapsed * 3.4 + item.phase);
    const pulse = 1 + breath * 0.055 + proximity * 0.08;
    ctx.scale(pulse, pulse);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = (24 + proximity * 24)*orbVisualScale;
    ctx.shadowColor = "#33f4ff";

    const halo = ctx.createRadialGradient(0, 0, item.r * 0.15, 0, 0, item.r * (2.35 + proximity * 0.45));
    halo.addColorStop(0, `rgba(255,255,255,${0.62 + proximity * 0.25})`);
    halo.addColorStop(0.18, `rgba(98,246,255,${0.42 + proximity * 0.24})`);
    halo.addColorStop(0.54, "rgba(38,190,255,.16)");
    halo.addColorStop(1, "rgba(20,86,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, item.r * (2.35 + proximity * 0.45), 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = `rgba(126,247,255,${0.30 + breath * 0.25 + proximity * 0.25})`;
    ctx.lineWidth = 1.5 + proximity * 1.5;
    ctx.beginPath(); ctx.arc(0, 0, item.r * 1.35, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha *= 0.72;
    ctx.beginPath(); ctx.arc(0, 0, item.r * 1.72, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha /= 0.72;

    const crystalReady = spriteReady(SPRITES.croniumFragment);
    if (frame && crystalReady) {
      drawImageCentered(frame, item.r * 2.85, item.r * 2.85, -item.rot * 0.08, 0.34 + breath * 0.18);
    }
    if (crystalReady) {
      drawImageCentered(SPRITES.croniumFragment, item.r * 2.62, item.r * 2.62, item.rot * 0.06, 0.94);
    } else if (!drawImageCentered(frame, item.r * 2.85, item.r * 2.85, item.rot * 0.10)) {
      const gradient = ctx.createRadialGradient(-7, -8, 2, 0, 0, item.r);
      gradient.addColorStop(0, "#fff"); gradient.addColorStop(0.2, "#caffff");
      gradient.addColorStop(0.48, "#63efff"); gradient.addColorStop(1, "#1554d8");
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, item.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.96)";
    ctx.shadowBlur = (18 + proximity * 16)*orbVisualScale;
    ctx.beginPath(); ctx.arc(0, 0, Math.max(3, item.r * 0.22), 0, Math.PI * 2); ctx.fill();

    if (proximity > 0.05 && settings.effects) {
      for (let index = 0; index < 5; index++) {
        const travel = (elapsed * (0.65 + index * 0.06) + item.phase + index * 0.19) % 1;
        const radius = item.r * (2.7 - travel * 2.1);
        const angle = item.phase + index * 2.17 + elapsed * (1.2 + proximity);
        ctx.globalAlpha = proximity * (0.28 + travel * 0.55);
        ctx.fillStyle = index % 2 ? "#bfffff" : "#4ceaff";
        ctx.beginPath(); ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 1.2 + proximity * 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawCh01Frame(animator) {
    if (!animator) return false;
    const frame = animator.getFrame();
    const sprite=frame.image==="assets/ch02_interceptor_atlas_v1.webp"?SPRITES.ch02:SPRITES.ch01;
    if(!spriteReady(sprite))return false;
    const {x, y, width, height} = frame.rect;
    ctx.shadowBlur = typeof isUnifiedClassic === "function" && isUnifiedClassic() ? 0 : 17;
    ctx.shadowColor = frame.damaged ? "#ff6079" : "#50e8ff";
    ctx.drawImage(sprite, x, y, width, height,
      -frame.drawSize * frame.pivot.x, -frame.drawSize * frame.pivot.y,
      frame.drawSize, frame.drawSize);
    return true;
  }

  function drawMeteor(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);

    if (item.n7Projectile || item.classicScoutProjectile) {
      if (item.classicScoutProjectile) {
        ctx.rotate(Math.atan2(item.vy, item.vx) + Math.PI / 2);
        if (!drawHostileOrdnance(item, item.role === "interceptor" ? 1 : 0,
          item.role === "interceptor" ? 60 : 52)) drawAtlasVfx(0, 28, 48, 1, .5);
        ctx.restore(); return;
      }
      const atlasPulse = item.classicScoutProjectile;
      ctx.fillStyle = atlasPulse ? "#8bf6ff" : "#ff7bce";
      ctx.shadowColor = atlasPulse ? "#37dfff" : "#ff4bbb";
      ctx.shadowBlur = 12;
      if (!atlasPulse || !drawImageCentered(frameFrom("phaser", Math.floor(elapsed * 12)), 24, 42,
        item.tacticsVersion?Math.atan2(item.vy,item.vx):Math.PI/2)) {
        ctx.fillRect(-4, -12, 8, 24);
      }
      ctx.restore();
      return;
    }
    const telegraph = item.n7?.telegraph || 0;
    if (telegraph > 0) {
      ctx.strokeStyle = `rgba(255,130,100,${telegraph})`;
      ctx.lineWidth = 2;
      const aim=item.classicScout?.lockedTarget;
      const angle=aim?Math.atan2(aim.y-item.y,aim.x-item.x):Math.PI/2;
      ctx.beginPath();ctx.moveTo(Math.cos(angle)*35,Math.sin(angle)*35);
      ctx.lineTo(Math.cos(angle)*145,Math.sin(angle)*145);ctx.stroke();
    }
    if (drawCh01Frame(item.n7?.ch01Animator || item.classicScout?.animator)) {
      ctx.restore();
      return;
    }

    if (item.special === "comet" && spriteReady(SPRITES.comet)) {
      const size = item.r * 12;
      const frame = Math.floor(elapsed * 8 + (item.phase || 0)) % 4;
      const sourceWidth = SPRITES.comet.naturalWidth / 4;
      const sourceHeight = SPRITES.comet.naturalHeight;
      const sourceX = frame * sourceWidth;
      const direction = item.flightComet ? Math.atan2(item.vy,item.vx) : Math.PI / 2;
      ctx.rotate(direction);
      ctx.shadowBlur = 9;
      ctx.shadowColor = "#8cdeff";
      // Authored +X comet: keep the nucleus at the physical item centre. The
      // long decorative tail has no collision and trails opposite velocity.
      ctx.drawImage(
        SPRITES.comet,
        sourceX, 0, sourceWidth, sourceHeight,
        -size * 0.75, -size * 0.50, size, size
      );
      ctx.restore();
      return;
    }

    ctx.rotate(item.rot);
    const sprite = SPRITES[item.spriteKey] || SPRITES.meteorMedium;
    const sizeFactor = item.spriteKey === "meteorLarge" ? 2.95 : item.spriteKey && item.spriteKey.includes("Small") ? 2.45 : 2.70;
    const size = item.r * sizeFactor;
    ctx.shadowBlur = 17;
    ctx.shadowColor = "#ff754f";
    if (!drawImageCentered(sprite, size, size)) {
      ctx.fillStyle = "#43363a";
      ctx.beginPath(); ctx.arc(0, 0, item.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawDebris(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);
    ctx.shadowBlur = 16;
    ctx.shadowColor = item.spriteKey && item.spriteKey.includes("Hot") ? "#ff5b3d" : "#73a8ff";
    const sprite = SPRITES[item.spriteKey] || SPRITES.debrisMetal;
    const size = item.r * (item.spriteKey === "debrisPanel" ? 3.15 : 2.90);
    if (!drawImageCentered(sprite, size, size)) {
      ctx.strokeStyle = "#91a0b4"; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-item.r, -item.r * 0.7); ctx.lineTo(item.r, item.r * 0.7); ctx.stroke();
    }
    ctx.restore();
  }

  function drawSatellite(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#8ab7ff";
    const size = item.r * 3.55;
    if (!drawImageCentered(SPRITES.satellite, size, size)) {
      ctx.fillStyle = "#718096";
      rounded(-item.r * 0.34, -item.r * 0.68, item.r * 0.68, item.r * 1.36, 10); ctx.fill();
    }
    ctx.restore();
  }

  const POWER_STYLE = {
    shield: { color: "#5fffe8", dark: "#0d554d", glyph: "S" },
    tractor: { color: "#ff71f6", dark: "#5b1455", glyph: "T" },
    slow: { color: "#7ea9ff", dark: "#183d73", glyph: "E" },
    double: { color: "#ffe66c", dark: "#665714", glyph: "2X" },
    repair: { color: "#ff718f", dark: "#66172d", glyph: "+" },
    phaser: { color: "#8aff98", dark: "#185b24", glyph: "ϟ" }
  };

  function drawPower(item) {
    const style = POWER_STYLE[item.type];
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    const bob = Math.sin(item.p * 1.35) * 3;
    ctx.translate(0, bob);
    ctx.shadowBlur = 28;
    ctx.shadowColor = style.color;

    let usedSprite = false;
    if (item.type === "repair") {
      usedSprite = drawImageCentered(SPRITES.repairDrone, 78, 78, Math.sin(item.p) * 0.06);
    } else if (item.type === "shield") {
      usedSprite = drawImageCentered(SPRITES.shieldIdle, 72, 72, item.rot * 0.15, 0.88);
    } else if (item.type === "phaser") {
      const frame = frameFrom("phaser", Math.floor(elapsed * 12));
      usedSprite = drawImageCentered(frame, 62, 34, -Math.PI / 2);
    } else if (item.type === "tractor") {
      const frame = frameFrom("tractor", Math.floor(elapsed * 12));
      usedSprite = drawImageCentered(frame, 70, 28, Math.PI / 2);
    }

    if (!usedSprite) {
      ctx.rotate(item.rot * 0.28);
      ctx.beginPath();
      for (let index = 0; index < 6; index++) {
        const angle = index * Math.PI / 3 - Math.PI / 6;
        const x = Math.cos(angle) * 30; const y = Math.sin(angle) * 30;
        if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
      const gradient = ctx.createLinearGradient(-30, -30, 30, 30);
      gradient.addColorStop(0, style.color); gradient.addColorStop(1, style.dark);
      ctx.fillStyle = gradient; ctx.fill();
      ctx.strokeStyle = "#ffffffc9"; ctx.lineWidth = 2; ctx.stroke();
      ctx.rotate(-item.rot * 0.28);
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${style.glyph.length > 1 ? 18 : 27}px Inter,sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(style.glyph, 0, 1);
    }
    ctx.restore();
  }

  function drawGate(gate) {
    const gapLeft = gate.gapX - gate.gapW / 2;
    const gapRight = gate.gapX + gate.gapW / 2;
    ctx.save();
    ctx.translate(0, gate.y);

    // La antigua viga sólida se representa ahora como basura espacial
    // compactada. Las piezas se crean una sola vez y nunca invaden el hueco.
    for (const piece of gate.pieces || []) {
      ctx.save();
      ctx.translate(piece.x, piece.y + Math.sin(elapsed * 1.7 + piece.rotation) * 2.2);
      ctx.rotate(piece.rotation + elapsed * piece.spin);
      ctx.globalAlpha = clamp((gate.y + 150) / 90, 0.18, 1);
      ctx.shadowBlur = 14;
      ctx.shadowColor = piece.spriteKey.includes("Hot") ? "#ff5b3d" : "#729dff";
      if (!drawImageCentered(SPRITES[piece.spriteKey], piece.size, piece.size)) {
        ctx.fillStyle = piece.spriteKey.includes("meteor") ? "#493b42" : "#667489";
        ctx.beginPath();
        ctx.moveTo(-piece.size * 0.46, -piece.size * 0.18);
        ctx.lineTo(-piece.size * 0.10, -piece.size * 0.45);
        ctx.lineTo(piece.size * 0.47, -piece.size * 0.12);
        ctx.lineTo(piece.size * 0.26, piece.size * 0.42);
        ctx.lineTo(-piece.size * 0.38, piece.size * 0.31);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    const guide = ctx.createLinearGradient(gapLeft, 0, gapRight, 0);
    guide.addColorStop(0, "rgba(69,255,238,.20)");
    guide.addColorStop(0.22, "rgba(69,255,238,.04)");
    guide.addColorStop(0.5, "rgba(255,255,255,.08)");
    guide.addColorStop(0.78, "rgba(69,255,238,.04)");
    guide.addColorStop(1, "rgba(69,255,238,.20)");
    ctx.fillStyle = guide;
    ctx.fillRect(gapLeft, -gate.h * 0.74, gate.gapW, gate.h * 1.48);

    ctx.strokeStyle = level().accent;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 16;
    ctx.shadowColor = level().accent;
    ctx.beginPath();
    ctx.moveTo(gapLeft, -gate.h * 0.72);
    ctx.lineTo(gapLeft, gate.h * 0.72);
    ctx.moveTo(gapRight, -gate.h * 0.72);
    ctx.lineTo(gapRight, gate.h * 0.72);
    ctx.stroke();
    ctx.restore();
  }

  function drawParts() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const colors = { cyan: "#47f5ff", gold: "#ffe159", red: "#ff355f", violet: "#a858ff", green: "#78ff9c" };
    for (const part of parts) {
      ctx.globalAlpha = Math.max(0, part.life);
      ctx.fillStyle = colors[part.kind] || "#fff";
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size * Math.max(0.2, part.life), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRings() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const ring of rings) {
      const progress = 1 - ring.life / ring.duration;
      const fade = Math.pow(1 - progress, 1.35);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = ring.color;
      ctx.shadowBlur = ring.style === "pulse" ? 30 : 16;
      ctx.shadowColor = ring.color;
      ctx.lineWidth = (ring.style === "pulse" ? 16 : 6) * (1 - progress) + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 12 + ring.max * progress, 0, Math.PI * 2);
      ctx.stroke();
      if (ring.style === "pulse" || ring.style === "capture") {
        const delay = ring.style === "pulse" ? 0.14 : 0.08;
        const secondProgress = clamp((progress - delay) / (1 - delay), 0, 1);
        ctx.globalAlpha = fade * (ring.style === "pulse" ? 0.66 : 0.42);
        ctx.lineWidth = (ring.style === "pulse" ? 8 : 3) * (1 - secondProgress) + 1;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, 8 + ring.max * secondProgress * 0.84, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const shot of shots) {
      const progress = 1 - shot.life / shot.duration;
      if (shot.atlasPulse) {
        ctx.save();
        ctx.translate(shot.x1 + (shot.x2 - shot.x1) * progress, shot.y1 + (shot.y2 - shot.y1) * progress);
        ctx.rotate(Math.atan2(shot.y2 - shot.y1, shot.x2 - shot.x1) + Math.PI / 2);
        if(shot.kind==="lance" || shot.kind==="phaser")drawImageCentered(frameFrom("phaser",Math.floor(elapsed*18)),30,105,0,1);
        else drawAtlasVfx(1, shot.kind==="twin"?16:22, shot.kind==="twin"?58:68, 1, .10);
        ctx.restore();
        continue;
      }
      const dx = shot.x2 - shot.x1;
      const dy = shot.y2 - shot.y1;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const flashPhase = clamp(progress / 0.18, 0, 1);
      const fade = progress < 0.78 ? 1 : 1 - (progress - 0.78) / 0.22;
      const pulse = shot.kind === "pulse";
      const glowColor = pulse ? "#95f7ff" : "#78ff9c";
      const beamColor = pulse ? "#63eaff" : "#6dff9a";
      ctx.save();
      ctx.translate(shot.x1, shot.y1);
      ctx.rotate(angle);
      ctx.globalAlpha = clamp(flashPhase * fade, 0, 1);
      ctx.shadowBlur = 28;
      ctx.shadowColor = glowColor;
      ctx.strokeStyle = pulse ? "rgba(61,204,255,.40)" : "rgba(84,255,145,.34)";
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(distance, 0); ctx.stroke();
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(distance, 0); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.98)";
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(distance, 0); ctx.stroke();

      const muzzle = ctx.createRadialGradient(0, 0, 0, 0, 0, 24 * (1 - progress * 0.45));
      muzzle.addColorStop(0, "rgba(255,255,255,.98)");
      muzzle.addColorStop(0.3, pulse ? "rgba(84,235,255,.88)" : "rgba(105,255,153,.82)");
      muzzle.addColorStop(1, "rgba(40,120,255,0)");
      ctx.fillStyle = muzzle;
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();

      if (shot.hit && progress > 0.45) {
        ctx.globalAlpha *= clamp((progress - 0.45) * 3.5, 0, 1);
        const impact = ctx.createRadialGradient(distance, 0, 0, distance, 0, shot.destroyed ? 34 : 22);
        impact.addColorStop(0, "rgba(255,255,255,1)");
        impact.addColorStop(0.28, "rgba(102,255,220,.86)");
        impact.addColorStop(1, "rgba(50,160,255,0)");
        ctx.fillStyle = impact;
        ctx.beginPath(); ctx.arc(distance, 0, shot.destroyed ? 34 : 22, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawExplosions() {
    for (const explosion of explosions) {
      if (explosion.ch01Animator) {
        ctx.save();
        ctx.translate(explosion.x, explosion.y);
        ctx.globalCompositeOperation = "screen";
        if (drawCh01Frame(explosion.ch01Animator)) { ctx.restore(); continue; }
        ctx.restore();
      }
      const progress = 1 - explosion.life / explosion.duration;
      const frameIndex = Math.min(SPRITE_GROUPS.explosion.length - 1, Math.floor(progress * SPRITE_GROUPS.explosion.length));
      const frame = frameFrom("explosion", frameIndex);
      const size = (70 + progress * 86) * explosion.scale;
      ctx.save();
      ctx.translate(explosion.x, explosion.y);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.min(1, explosion.life * 5);
      ctx.shadowBlur = 24; ctx.shadowColor = "#ff8d36";
      if (!drawImageCentered(frame || SPRITES.explosionSmall, size, size, explosion.rotation)) {
        ctx.fillStyle = "#ff9b42"; ctx.beginPath(); ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawImpactEffects() {
    for (const effect of impactEffects) {
      const progress = 1 - effect.life / effect.duration;
      if(effect.missileImpact&&spriteReady(SPRITES.chapterMissile)) {
        const age=effect.duration-effect.life,atlas=SPRITES.chapterMissile,cell=atlas.naturalWidth/4;
        const row=age<.25?2:3,frame=Math.min(3,Math.floor((age-(row===3?.25:0))*(row===2?16:10)));
        const size=row===2?94:108;
        ctx.save();ctx.translate(effect.x,effect.y);ctx.globalAlpha*=row===3?Math.max(0,1-(age-.25)/.4):1;
        ctx.drawImage(atlas,frame*cell,row*cell,cell,cell,-size/2,-size/2,size,size);
        ctx.restore();continue;
      }
      if (effect.atlasImpact) {
        ctx.save(); ctx.translate(effect.x, effect.y);
        if(!drawArcadePulse("impact",effect.duration-effect.life,60,1-progress*.4))drawAtlasVfx(2,58,52,1-progress);
        ctx.restore(); continue;
      }
      const frame = frameFrom("impact", effect.variant);
      const size = (36 + progress * 28) * effect.scale;
      ctx.save();
      ctx.translate(effect.x, effect.y);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.max(0, effect.life / effect.duration);
      ctx.shadowBlur = 16; ctx.shadowColor = "#ff9b36";
      drawImageCentered(frame, size, size, effect.angle);
      ctx.restore();
    }
  }

  function drawCombo() {
    if (state !== "playing" || combo < 3) return;
    ctx.save();
    const label = `CADENA x${combo}`;
    const y = H - 245;
    ctx.font = "900 28px Inter,sans-serif";
    const width = ctx.measureText(label).width + 38;
    rounded(W / 2 - width / 2, y - 32, width, 42, 21);
    ctx.fillStyle = "rgba(7,10,22,.58)";
    ctx.fill();
    ctx.strokeStyle = powers.double > 0 ? "rgba(255,230,108,.55)" : "rgba(76,244,255,.35)";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = powers.double > 0 ? "#ffe66c" : "#fff";
    ctx.fillText(label, W / 2, y - 3);
    ctx.restore();
  }
  function drawJourneyPart(item) {
    ctx.save(); ctx.translate(item.x, item.y);
    ctx.shadowBlur = 24; ctx.shadowColor = "#ffd877";
    const pulse = 1 + Math.sin(elapsed * 4) * .08;
    ctx.save(); ctx.scale(.27 * pulse, .27 * pulse); ctx.translate(0, -134);
    drawShipComponent(ctx, NeonCampaign.normalizeShipLoadout({engines: "bastion"}), "engines");
    ctx.restore();
    ctx.fillStyle = "#fff4c3"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("PROPULSOR C9", 0, -57);
    ctx.restore();
  }
