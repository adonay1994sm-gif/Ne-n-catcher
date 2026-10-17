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

    const bob = state === "destroying" ? 0 : Math.sin(t * 0.004) * 1.8;
    const { frameIndex, flipX } = playerFrameState(t);

    if (powers.shield > 0) {
      const shieldFrame = Math.sin(t * 0.012) > 0.45 ? SPRITES.shieldEffect : SPRITES.shieldIdle;
      ctx.save();
      ctx.translate(0, -26 * SHIP_VISUAL.scale + bob);
      ctx.globalCompositeOperation = "screen";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#4cffe9";
      drawImageCentered(shieldFrame, SHIP_VISUAL.shieldSize, SHIP_VISUAL.shieldSize, elapsed * 0.08, 0.42);
      ctx.restore();
    }

    const turnStrength = clamp(Math.abs(player.target + player.drift - player.x) / 95, 0, 1);
    const enginePulse = 0.78 + Math.sin(t * 0.026) * 0.16 + turnStrength * 0.20;
    ctx.save();
    ctx.translate(0, 53 * SHIP_VISUAL.scale + bob);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = 24;
    ctx.shadowColor = "#56efff";
    for (const engineX of [-27, 27]) {
      const plume = ctx.createLinearGradient(engineX, 0, engineX, 48 * SHIP_VISUAL.scale * enginePulse);
      plume.addColorStop(0, "rgba(255,255,255,.96)");
      plume.addColorStop(0.25, "rgba(92,242,255,.82)");
      plume.addColorStop(1, "rgba(42,116,255,0)");
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.moveTo((engineX - 6) * SHIP_VISUAL.scale, 0);
      ctx.lineTo(engineX * SHIP_VISUAL.scale, 48 * SHIP_VISUAL.scale * enginePulse);
      ctx.lineTo((engineX + 6) * SHIP_VISUAL.scale, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    const frame = frameFrom("ship", frameIndex);
    ctx.save();
    const criticalJitter = hull < 18 && state !== "destroying" ? Math.sin(elapsed * 19) * 1.6 : 0;
    ctx.translate(criticalJitter, bob + SHIP_VISUAL.centerYOffset);
    ctx.shadowBlur = 22;
    ctx.shadowColor = level().accent;
    if (!drawImageCentered(frame, SHIP_VISUAL.spriteSize, SHIP_VISUAL.spriteSize, 0, 1, flipX)) {
      if (!drawImageCentered(SPRITES.shipFallback, SHIP_VISUAL.fallbackWidth, SHIP_VISUAL.fallbackHeight)) {
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
    }
    ctx.restore();

    if (hull < 67 && state !== "destroying") {
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

  function drawEnergy(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);
    const distanceToShip = Math.hypot(player.x - item.x, player.y - item.y);
    const proximity = state === "playing" ? clamp(1 - distanceToShip / 330, 0, 1) : 0;
    const pulseSequence = [0,1,2,3,4,5,4,3,2,1];
    const frame = frameFrom("core", pulseSequence[Math.floor((elapsed * 9 + item.phase) % pulseSequence.length)]);
    const breath = 0.5 + 0.5 * Math.sin(elapsed * 3.4 + item.phase);
    const pulse = 1 + breath * 0.055 + proximity * 0.08;
    ctx.scale(pulse, pulse);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = 24 + proximity * 24;
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
    ctx.shadowBlur = 18 + proximity * 16;
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
    if (!animator || !spriteReady(SPRITES.ch01)) return false;
    const frame = animator.getFrame();
    const {x, y, width, height} = frame.rect;
    ctx.shadowBlur = 17;
    ctx.shadowColor = frame.damaged ? "#ff6079" : "#50e8ff";
    ctx.drawImage(SPRITES.ch01, x, y, width, height,
      -frame.drawSize * frame.pivot.x, -frame.drawSize * frame.pivot.y,
      frame.drawSize, frame.drawSize);
    return true;
  }

  function drawMeteor(item) {
    ctx.save();
    ctx.globalAlpha = itemVisualAlpha(item);
    ctx.translate(item.x, item.y);

    if (item.n7Projectile || item.classicScoutProjectile) {
      const atlasPulse = item.classicScoutProjectile;
      ctx.fillStyle = atlasPulse ? "#8bf6ff" : "#ff7bce";
      ctx.shadowColor = atlasPulse ? "#37dfff" : "#ff4bbb";
      ctx.shadowBlur = 12;
      if (!atlasPulse || !drawImageCentered(frameFrom("phaser", Math.floor(elapsed * 12)), 24, 42, Math.PI / 2)) {
        ctx.fillRect(-4, -12, 8, 24);
      }
      ctx.restore();
      return;
    }
    const telegraph = item.n7?.telegraph || item.classicScout?.telegraph || 0;
    if (telegraph > 0) {
      ctx.strokeStyle = `rgba(255,130,100,${telegraph})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(0, 160); ctx.stroke();
    }
    if (drawCh01Frame(item.n7?.ch01Animator || item.classicScout?.animator)) {
      ctx.restore();
      return;
    }

    if (item.special === "comet" && spriteReady(SPRITES.comet)) {
      const size = item.r * 4.2;
      const frame = Math.floor(elapsed * 11 + item.phase) % 8;
      const sourceWidth = SPRITES.comet.naturalWidth / 4;
      const sourceHeight = SPRITES.comet.naturalHeight / 2;
      const sourceX = (frame % 4) * sourceWidth;
      const sourceY = Math.floor(frame / 4) * sourceHeight;
      ctx.rotate(item.rot + Math.PI / 2);
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#ff754f";
      // Ocho fotogramas reales: la cola, el humo y las fisuras cambian sin
      // modificar la silueta de colisión del núcleo rocoso.
      ctx.drawImage(
        SPRITES.comet,
        sourceX, sourceY, sourceWidth, sourceHeight,
        -size * 0.66, -size * 0.50, size, size
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
