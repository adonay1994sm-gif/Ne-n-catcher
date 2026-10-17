  function createFormationSide(start, end, side) {
    const pieces = [];
    let edge = side < 0 ? end : start;
    let guard = 0;

    while ((side < 0 ? edge > start : edge < end) && guard < 24) {
      const size = 46 + Math.random() * 18;
      const step = size * (0.68 + Math.random() * 0.10);
      // Usa el radio de la caja rotada, no solo media anchura: incluso una
      // pieza a 45° queda fuera del pasillo visual.
      const halfExtent = size * Math.SQRT1_2;
      const x = side < 0 ? edge - halfExtent : edge + halfExtent;
      pieces.push({
        x,
        y: (Math.random() - 0.5) * 18,
        size,
        halfExtent,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.42,
        spriteKey: FORMATION_SPRITE_KEYS[(Math.random() * FORMATION_SPRITE_KEYS.length) | 0],
        side
      });
      edge += side * step;
      guard++;
    }
    return pieces;
  }

  function createDebrisFormation(gapXOverride) {
    const gapW = clamp(282 - currentLevel * 4, 246, 282);
    const margin = gapW / 2 + 32;
    const randomGapX = margin + Math.random() * (W - margin * 2);
    const gapX = Number.isFinite(gapXOverride) ? clamp(gapXOverride, margin, W - margin) : randomGapX;
    const gapLeft = gapX - gapW / 2;
    const gapRight = gapX + gapW / 2;
    return {
      kind: "debris-formation",
      y: -62,
      h: 50,
      s: (210 + currentLevel * 10) * level().speed,
      gapX,
      gapW,
      checked: false,
      phase: Math.random() * Math.PI * 2,
      pieces: [
        ...createFormationSide(-12, gapLeft, -1),
        ...createFormationSide(gapRight, W + 12, 1)
      ]
    };
  }

  function gateProtectsPassage(gate) {
    return Boolean(gate && gate.y + gate.h / 2 >= CORRIDOR_TOP &&
      gate.y - gate.h / 2 <= player.y + player.h * 0.80);
  }

  function gateCorridorBounds(gate) {
    return {
      left: gate.gapX - gate.gapW / 2,
      right: gate.gapX + gate.gapW / 2,
      top: CORRIDOR_TOP,
      bottom: player.y + CORRIDOR_BOTTOM_PADDING
    };
  }

  function threatBounds(item) {
    const cos = Math.cos(item.rot || 0);
    const sin = Math.sin(item.rot || 0);
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const circle of collisionCircles(item)) {
      const x = item.x + circle.x * cos - circle.y * sin;
      const y = item.y + circle.x * sin + circle.y * cos;
      left = Math.min(left, x - circle.r);
      right = Math.max(right, x + circle.r);
      top = Math.min(top, y - circle.r);
      bottom = Math.max(bottom, y + circle.r);
    }
    return { left, right, top, bottom };
  }

  function threatOverlapsGateCorridor(item, gate) {
    if (!isThreat(item) || !gateProtectsPassage(gate)) return false;
    const threat = threatBounds(item);
    const corridor = gateCorridorBounds(gate);
    return threat.right > corridor.left && threat.left < corridor.right &&
      threat.bottom > corridor.top && threat.top < corridor.bottom;
  }

  function threatOverlapsProtectedCorridor(item) {
    return gates.some((gate) => threatOverlapsGateCorridor(item, gate));
  }

  function clearProtectedCorridors(onlyGate = null) {
    const protectedGates = onlyGate ? [onlyGate] : gates;
    let removed = 0;
    items = items.filter((item) => {
      if (!isThreat(item) || !protectedGates.some((gate) => threatOverlapsGateCorridor(item, gate))) return true;
      removed++;
      if (item === tractorTarget) tractorTarget = null;
      return false;
    });
    return removed;
  }

  function spawnGate() {
    const formation = createDebrisFormation();
    gates.push(formation);
    clearProtectedCorridors(formation);
    tone(180, 0.12, "square", 0.045);
  }

  function updateGateSystem(dt, scale) {
    const interval = level().gate;
    if (!interval) {
      hideWarning();
      return;
    }

    gateCountdown -= dt;
    if (gateCountdown <= 2.4 && gateCountdown > 0) {
      ui.warningText.textContent = `Pasillo seguro en ${gateCountdown.toFixed(1)} s`;
      ui.hazardWarning.classList.add("show");
    } else if (gateCountdown > 2.4) {
      hideWarning();
    }

    if (gateCountdown <= 0) {
      spawnGate();
      hideWarning();
      gateCountdown = interval * (0.88 + Math.random() * 0.24);
    }

    for (let index = gates.length - 1; index >= 0; index--) {
      const gate = gates[index];
      gate.y += gate.s * dt * scale;
      const crossing = gate.y + gate.h / 2 >= player.y - player.h * 0.34 &&
        gate.y - gate.h / 2 <= player.y + player.h * 0.34;

      if (crossing && !gate.checked) {
        gate.checked = true;
        const gapLeft = gate.gapX - gate.gapW / 2;
        const gapRight = gate.gapX + gate.gapW / 2;
        const safe = player.x - SHIP_COLLISION_HALF_WIDTH > gapLeft && player.x + SHIP_COLLISION_HALF_WIDTH < gapRight;
        if (safe) {
          score += 25;
          pulseRing(player.x, player.y, level().accent, 120, 0.48);
          tone(760, 0.08, "triangle", 0.055);
          toast("Paso orbital limpio: +25");
        } else {
          damageShip(38, player.x, player.y - 15);
        }
        hud();
      }

      if (gate.y - gate.h / 2 > H + 30) gates.splice(index, 1);
    }
  }

  function update(dt) {
    const lv = level();
    const starBoost = state === "playing" ? lv.speed * (warpTimer > 0 ? 5.5 : 1) : 1;
    visualSpeed += (starBoost - visualSpeed) * Math.min(1, dt * 4.5);
    for (const star of stars) {
      star.y += star.s * star.layer * dt * starBoost;
      if (star.y > H + 8) {
        star.y = -8;
        star.x = Math.random() * W;
      }
    }
    for (const dust of spaceDust) {
      dust.y += dust.s * dt * starBoost;
      dust.x += dust.drift * dt;
      if (dust.y > H + 12) { dust.y = -12; dust.x = Math.random() * W; }
      if (dust.x < -20) dust.x = W + 20;
      if (dust.x > W + 20) dust.x = -20;
    }
    for (const mote of foregroundParticles) {
      mote.y += mote.s * dt * Math.max(0.8, starBoost);
      mote.x += mote.drift * dt;
      if (mote.y > H + 28) { mote.y = -28; mote.x = Math.random() * W; }
    }
    updateHudVisual(dt);
    cameraKickX *= Math.pow(0.001, dt);
    cameraKickY *= Math.pow(0.001, dt);

    if (state === "destroying") {
      elapsed += dt;
      destructionTimer = Math.max(0, destructionTimer - dt);

      if (destructionTimer < 0.88 && destructionStage === 0) {
        destructionStage = 1;
        playerVisible = false;
        addExplosion(player.x - 42 * SHIP_VISUAL.scale, player.y - 18 * SHIP_VISUAL.scale, 1.05, 0.62);
        addExplosion(player.x + 46 * SHIP_VISUAL.scale, player.y + 8 * SHIP_VISUAL.scale, 1.12, 0.66);
        burst(player.x, player.y, 34, "gold");
      }
      if (destructionTimer < 0.48 && destructionStage === 1) {
        destructionStage = 2;
        addExplosion(player.x, player.y - 10 * SHIP_VISUAL.scale, 1.35, 0.58);
        pulseRing(player.x, player.y, "#ff9b42", 170, 0.55);
      }

      updateEffects(dt);
      if (destructionTimer <= 0) finishGame("hull");
      return;
    }

    if (state !== "playing") {
      updateEffects(dt);
      return;
    }

    elapsed += dt;
    if (manualShotCooldown > 0) {
      const previousCooldown = manualShotCooldown;
      manualShotCooldown = Math.max(0, manualShotCooldown - dt);
      if (previousCooldown > 0 && manualShotCooldown === 0) updateAmmoHud();
    }
    updateLevelStory(dt);
    if (levelOneShockwave > 0) levelOneShockwave = Math.max(0, levelOneShockwave - dt);
    impactReactionTimer = Math.max(0, impactReactionTimer - dt);
    if (lv.hazard === "gravity") player.drift = Math.sin(elapsed * 0.8) * 22;
    else player.drift = 0;

    const follow = 9 + (settings.sensitivity / 100) * 8;
    player.x += (player.target + player.drift - player.x) * Math.min(1, dt * follow);
    player.x = clamp(player.x, player.w / 2 + 18, W - player.w / 2 - 18);
    engineTrail();

    if (warpTimer > 0) {
      warpTimer = Math.max(0, warpTimer - dt);
      if (warpTimer === 0) updateAmmoHud();
      updateEffects(dt);
      return;
    }

    if (encounterDirector) {
      encounterDirector.advance(dt, (item) => {
        items.push(item);
        if (item.type === "energy") energySpawned++;
      });
      if (encounterDirector.wave !== encounterWave) {
        encounterWave = encounterDirector.wave;
        ammo = MAX_AMMO;
        updateAmmoHud();
        updateEncounterHud();
      }
    } else {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        addItem();
        let interval = lv.spawn * (0.86 + Math.random() * 0.30);
        if (lv.hazard === "storm" && Math.sin(elapsed * 0.75) > 0.68) interval *= 0.58;
        if (lv.hazard === "final" && Math.sin(elapsed * 0.95) > 0.60) interval *= 0.62;
        spawnTimer = Math.max(0.23, interval);
      }
      if (currentLevel === 1) {
        classicScoutTimer -= dt;
        if (classicScoutTimer <= 0) {
          if (items.filter(item => item.classicScout).length < 2) {
            items.push(createThreat("scout", lv));
            if (!classicScoutAnnounced) {
              classicScoutAnnounced = true;
              showStoryTransmission("RED ATLAS", "Identificación denegada. Dron CH-01 armado.", 3.2);
            }
          }
          classicScoutTimer = 6.2 + Math.random() * 1.5;
        }
      }
    }

    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) combo = 1;
    }

    for (const key in powers) {
      if (powers[key] > 0) powers[key] = Math.max(0, powers[key] - dt);
    }
    if (powers.tractor <= 0) tractorTarget = null;
    updatePowerHud();

    if (powers.phaser > 0) {
      phaserCooldown -= dt;
      if (phaserCooldown <= 0) firePhaser();
    }

    if (shake > 0) shake = Math.max(0, shake - dt * 48);
    if (flash > 0) flash -= dt;
    if ((lv.hazard === "storm" || lv.hazard === "final") && Math.random() < dt * 0.22) stormPulse = 0.18;
    if (stormPulse > 0) stormPulse -= dt;

    if (powers.tractor > 0 && (!tractorTarget || !items.includes(tractorTarget))) selectTractorTarget();

    const scale = powers.slow > 0 ? 0.50 : 1;
    updateGateSystem(dt, scale);

    for (let index = items.length - 1; index >= 0; index--) {
      const item = items[index];
      item.y += item.s * dt * scale;
      item.rot += item.rs * dt;
      item.p += dt * 4;
      if (item.n7) NeonCampaign.advanceEnemy(item, dt * scale, player, (shot) => items.push(shot));
      if (item.classicScout) NeonCampaign.advanceClassicScout(item, dt * scale, player, (shot) => items.push(shot));

      const wave = lv.hazard === "wave" || lv.hazard === "chaos" || lv.hazard === "final";
      if (wave && isThreat(item)) {
        item.x = item.baseX + Math.sin(elapsed * (lv.hazard === "chaos" ? 3.2 : 2.15) + item.phase) * item.amp;
      }
      if (lv.hazard === "phantom" && isThreat(item)) {
        item.alpha = 0.20 + 0.80 * Math.abs(Math.sin(elapsed * 1.8 + item.phase));
      } else {
        item.alpha = 1;
      }

      // La comprobación se repite después de aplicar ondas y órbitas: una
      // amenaza nacida fuera tampoco puede serpentear dentro del pasillo.
      if (isThreat(item) && threatOverlapsProtectedCorridor(item)) {
        items.splice(index, 1);
        if (item === tractorTarget) tractorTarget = null;
        continue;
      }

      if (powers.tractor > 0 && item === tractorTarget) {
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        item.x += dx * dt * 5.8;
        item.y += dy * dt * 5.8;
      }

      if (hit(item)) {
        collectItem(item);
        const actualIndex = items.indexOf(item);
        if (actualIndex >= 0) items.splice(actualIndex, 1);
        if (item === tractorTarget) tractorTarget = null;
        if (state !== "playing") break;
        continue;
      }

      if (item.y - item.r > H) {
        if (item.type === "energy") {
          combo = 1;
          comboTimer = 0;
        }
        items.splice(index, 1);
        if (item === tractorTarget) tractorTarget = null;
        hud();
      }
    }

    checkSupplyFailure();
    if (encounterDirector?.finished && collected >= level().goal && !items.some(isThreat)) completeLevel();
    if (hull < 67 && settings.effects && Math.random() < dt * (hull < 34 ? 7 : 2.4)) {
      burst(
        player.x + (Math.random() - 0.5) * 70 * SHIP_VISUAL.scale,
        player.y + (Math.random() - 0.5) * 35 * SHIP_VISUAL.scale,
        1,
        hull < 34 ? "red" : "gold"
      );
    }
    updateEffects(dt);
  }
