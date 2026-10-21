  // Inicio como animación: franjas de cine y el diálogo como subtítulo (el HUD
  // está oculto hasta que acaba).
  function drawClassicChapterFilm(opening) {
    const time=classicChapterView.routeElapsed,bar=H*.075*Math.min(1,time/.6);
    ctx.save();ctx.fillStyle="#000";ctx.fillRect(0,0,W,bar);ctx.fillRect(0,H-bar,W,bar);
    const cue=opening.dialogue;
    if(cue&&time<cue.at+cue.duration) {
      const alpha=Math.min(1,(time-cue.at)/.25,(cue.at+cue.duration-time)/.25);
      ctx.globalAlpha=Math.max(0,alpha);ctx.textAlign="center";ctx.textBaseline="alphabetic";
      ctx.font="800 15px 'Trebuchet MS', sans-serif";ctx.fillStyle="#9fe9ff";
      ctx.fillText(cue.speaker,W/2,H*.70);
      ctx.font="700 24px 'Trebuchet MS', sans-serif";ctx.fillStyle="#f2fbff";
      ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=8;
      const words=cue.text.split(" "),lines=[""];
      for(const word of words) {
        const next=lines[lines.length-1]?`${lines[lines.length-1]} ${word}`:word;
        if(ctx.measureText(next).width>W*.84&&lines[lines.length-1])lines.push(word);else lines[lines.length-1]=next;
      }
      lines.forEach((line,index)=>ctx.fillText(line,W/2,H*.70+34+index*30));
    }
    ctx.restore();
  }

  function drawClassicChapterOpening() {
    const opening=classicChapterView?.opening;
    if(state==="playing"&&opening?.film)drawClassicChapterFilm(opening);
    if(state!=="playing"||!opening?.active||opening.backgroundAlpha<=0||
      !spriteReady(SPRITES.chapterIntro))return;
    // Four authored shots precede the same live station, reactor and wave.
    // The route snapshot owns all cuts and camera motion; pause freezes them.
    const time=classicFlightView.elapsed;
    const frame=time<2.25?0:time<6.3?1:time<9?2:3;
    const image=SPRITES.chapterIntro,cw=image.naturalWidth/2,ch=image.naturalHeight/2;
    const zoom=settings.reduceEffects?1:1.035+opening.shotProgress*.035;
    const scale=Math.max(W/cw,H/ch)*zoom,width=cw*scale,height=ch*scale;
    ctx.save();ctx.globalAlpha=opening.backgroundAlpha;
    ctx.drawImage(image,frame%2*cw,Math.floor(frame/2)*ch,cw,ch,
      (W-width)/2,(H-height)/2,width,height);
    ctx.restore();
  }

  function rounded(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }

  function drawPlanet(x, y, radius, colors, ring = false) {
    ctx.save();
    if (ring) {
      ctx.strokeStyle = colors[1] + "88";
      ctx.lineWidth = Math.max(5, radius * 0.10);
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.55, radius * 0.34, -0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    const gradient = ctx.createRadialGradient(x - radius * 0.34, y - radius * 0.32, radius * 0.05, x, y, radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.38, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.shadowBlur = radius * 0.30;
    ctx.shadowColor = colors[1] + "66";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSectorEnvironment(t, lv) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    if (lv.scene === "cronos") {
      // The authored Chronos painting is the scene. Avoid artificial bars
      // and geometry that obscure the station, especially on small screens.
      const sx = W * 0.50;
      const sy = H * 0.40;
      const pulse = 1 + Math.sin(t * 0.0025) * 0.025;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 178 * pulse);
      glow.addColorStop(0, "rgba(214,250,255,.48)");
      glow.addColorStop(0.18, "rgba(78,199,255,.22)");
      glow.addColorStop(0.55, "rgba(50,105,210,.065)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H * 0.55);
    } else if (lv.scene === "orbit") {
      drawPlanet(W * 0.78, H * 0.19, 105, ["#e9ffff", "#4eb9ff", "#15245f"], true);
    } else if (lv.scene === "rift") {
      const band = ctx.createLinearGradient(W * 0.28, 0, W * 0.72, H);
      band.addColorStop(0, "rgba(65,190,255,0)");
      band.addColorStop(0.46, "rgba(58,166,255,.18)");
      band.addColorStop(0.52, "rgba(158,249,255,.28)");
      band.addColorStop(0.58, "rgba(70,81,255,.13)");
      band.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);
    } else if (lv.scene === "belt") {
      ctx.globalAlpha = 0.22;
      for (let index = 0; index < 9; index++) {
        const x = (index * 103 + 42) % W;
        const y = H * 0.15 + ((index * 157 + t * 0.018) % (H * 0.55));
        ctx.fillStyle = index % 2 ? "#b77355" : "#84605e";
        ctx.beginPath();
        ctx.arc(x, y, 7 + (index % 4) * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (lv.scene === "ion") {
      ctx.strokeStyle = "rgba(191,126,255,.34)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#a96cff";
      for (let index = 0; index < 3; index++) {
        const y = H * (0.18 + index * 0.17) + Math.sin(t * 0.003 + index) * 28;
        ctx.beginPath();
        ctx.moveTo(-20, y);
        ctx.bezierCurveTo(W * 0.25, y - 70, W * 0.62, y + 75, W + 30, y - 25);
        ctx.stroke();
      }
    } else if (lv.scene === "crimson") {
      if (!sectorPlanet()) drawPlanet(W * 0.19, H * 0.16, 92, ["#fff5c7", "#ff744f", "#761737"], false);
      ctx.globalAlpha = 0.14 + Math.sin(t * 0.004) * 0.03;
      ctx.fillStyle = "#ff4965";
      ctx.beginPath();
      ctx.arc(W * 0.19, H * 0.16, 145, 0, Math.PI * 2);
      ctx.fill();
    } else if (lv.scene === "gravity") {
      const x = W * 0.74;
      const y = H * 0.20;
      ctx.strokeStyle = "rgba(80,255,208,.48)";
      ctx.lineWidth = 12;
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#47ffd1";
      ctx.beginPath();
      ctx.ellipse(x, y, 135, 38, -0.25 + Math.sin(t * 0.0005) * 0.04, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#010207";
      ctx.beginPath();
      ctx.arc(x, y, 61, 0, Math.PI * 2);
      ctx.fill();
    } else if (lv.scene === "ghost") {
      ctx.globalAlpha = 0.20;
      ctx.fillStyle = "#b99bea";
      ctx.fillRect(W * 0.10, H * 0.17, W * 0.80, 12);
      ctx.fillRect(W * 0.27, H * 0.12, 18, 115);
      ctx.fillRect(W * 0.68, H * 0.10, 16, 132);
      const fog = ctx.createLinearGradient(0, H * 0.18, W, H * 0.65);
      fog.addColorStop(0, "rgba(174,132,232,0)");
      fog.addColorStop(0.5, "rgba(174,132,232,.11)");
      fog.addColorStop(1, "rgba(174,132,232,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, H * 0.12, W, H * 0.62);
    } else if (lv.scene === "overdrive") {
      ctx.globalAlpha = 0.20;
      ctx.strokeStyle = "#fff27b";
      ctx.lineWidth = 2;
      for (let index = 0; index < 12; index++) {
        const x = (index * 67 + t * 0.08) % (W + 180) - 90;
        ctx.beginPath();
        ctx.moveTo(x, H * 0.08);
        ctx.lineTo(x - 130, H * 0.70);
        ctx.stroke();
      }
    } else if (lv.scene === "dark") {
      if (!sectorPlanet()) drawPlanet(W * 0.73, H * 0.18, 112, ["#6d2d73", "#27102f", "#05030a"], false);
      ctx.fillStyle = "rgba(255,92,233,.12)";
      ctx.beginPath();
      ctx.arc(W * 0.73, H * 0.18, 130, 0, Math.PI * 2);
      ctx.fill();
    } else if (lv.scene === "collapse") {
      const x = W * 0.50;
      const y = H * 0.20;
      ctx.strokeStyle = "rgba(93,255,236,.58)";
      ctx.lineWidth = 9;
      ctx.shadowBlur = 28;
      ctx.shadowColor = "#66fff1";
      ctx.beginPath();
      ctx.ellipse(x, y, 128 + Math.sin(t * 0.003) * 7, 54, t * 0.0005, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(220,87,255,.45)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(x, y, 92, 92, -t * 0.0007, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // The first classic route composes independent illustrated objects.  A single
  // simulation snapshot drives geography, scenery and the mission HUD; render
  // timestamps never advance this journey while the game is paused.
  function drawChronosFlightSprite(frame, node, sizeMultiplier = 1) {
    if (!node?.visible || !spriteReady(SPRITES.flightKit)) return false;
    const image = SPRITES.flightKit;
    const cellWidth = image.naturalWidth / 3;
    const cellHeight = image.naturalHeight / 2;
    const size = W * node.scale * sizeMultiplier;
    ctx.save();
    ctx.translate(node.x * W, node.y * H);
    ctx.rotate(node.rotation || 0);
    // Both station poses share their reactor pivot and remain fully opaque.
    ctx.drawImage(image, (frame % 3) * cellWidth, Math.floor(frame / 3) * cellHeight,
      cellWidth, cellHeight, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawChronosDestructionStation(view, pose) {
    const node = view.station;
    if (!node.visible || !spriteReady(SPRITES.chronosDestruction)) return false;
    const image = SPRITES.chronosDestruction;
    const cellWidth = image.naturalWidth / 3, cellHeight = image.naturalHeight / 2;
    const size = W * node.scale;
    ctx.save(); ctx.translate(node.x * W, node.y * H); ctx.rotate(node.rotation || 0);
    ctx.drawImage(image, (pose.frame % 3) * cellWidth, Math.floor(pose.frame / 3) * cellHeight,
      cellWidth, cellHeight, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  // Inicio de Chronos con las piezas del propietario. Todo se deriva de la
  // pose pura de NeonCampaign.getChronosIntroPose; sin piezas cargadas se
  // sigue usando el inicio anterior.
  function chronosIntroPose(view) {
    if (typeof NeonCampaign.getChronosIntroPose !== "function") return null;
    // Tras la secuencia, la estación rota sigue girando y alejándose con la
    // ruta (sin volver al dibujo antiguo mientras siga a la vista).
    const pose = NeonCampaign.getChronosIntroPose(view.elapsed,
      {reducedEffects: Boolean(settings.reduceEffects), holdWreck: Boolean(view.station.visible)});
    // Mientras las piezas cargan no se dibuja la estación antigua (se veía un
    // instante en iPhone); solo si fallan se vuelve al dibujo anterior.
    return pose.active && !SPRITES.chronosIntroStation._loadError ? pose : null;
  }

  function drawAtlasCell(image, columns, cell, x, y, width, height) {
    const size = image.naturalWidth / columns;
    ctx.drawImage(image, (cell % columns) * size, Math.floor(cell / columns) * size, size, size, x, y, width, height);
  }

  function drawTalasa(pose) {
    if (!spriteReady(SPRITES.chronosIntroStation)) return;
    // El planeta que orbita Chronos se queda atrás al huir.
    const fade = 1 - clamp((pose.clock - 20) / 6, 0, 1);
    if (fade <= 0) return;
    const size = W * (1.05 - .25 * clamp(pose.clock / 26, 0, 1));
    ctx.save(); ctx.globalAlpha = fade;
    drawAtlasCell(SPRITES.chronosIntroStation, 3, 5, W * .92 - size / 2, H * .06 - size / 2 - pose.clock * 2, size, size);
    ctx.restore();
  }

  // Escena del inicio bajo su propia cámara (no afecta al juego ni al HUD).
  function withChronosIntroCamera(pose, draw) {
    const camera = pose.camera;
    ctx.save();
    ctx.translate(W * (.5 + camera.shakeX), H * (.5 + camera.shakeY));
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-W * camera.cx, -H * camera.cy);
    draw();
    ctx.restore();
  }

  function drawChronosIntroDarkness(pose) {
    // El espacio (no el villano) se oscurece desde arriba cuando se acerca.
    if (pose.darkness <= 0) return;
    const dark = ctx.createLinearGradient(0, 0, 0, H * .75);
    dark.addColorStop(0, `rgba(4,0,14,${pose.darkness.toFixed(3)})`); dark.addColorStop(1, "rgba(4,0,14,0)");
    ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  function drawCronosPrimeDistantLight(pose) {
    // Antes de verse, Cronos Prime es una luz violeta que crece a lo lejos.
    const light = pose.distantLight;
    if (!light || light.alpha <= 0) return;
    const x = light.x * W, y = light.y * H, radius = W * light.size;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
    glow.addColorStop(0, `rgba(255,255,255,${light.alpha.toFixed(3)})`);
    glow.addColorStop(.25, `rgba(190,140,255,${(.7 * light.alpha).toFixed(3)})`); glow.addColorStop(1, "rgba(90,40,200,0)");
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 3, y - radius * 3, radius * 6, radius * 6);
    ctx.strokeStyle = `rgba(230,215,255,${(.8 * light.alpha).toFixed(3)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - radius * 2.5, y); ctx.lineTo(x + radius * 2.5, y); ctx.moveTo(x, y - radius * 2.5); ctx.lineTo(x, y + radius * 2.5); ctx.stroke();
    ctx.restore();
  }

  function drawCronosPrime(pose) {
    const prime = pose.prime, atlas = SPRITES.cronosPrimeVideo;
    if (!prime.visible || !spriteReady(atlas)) return;
    // El cuerpo llena ~94 % de la celda (fotogramas sacados del vídeo).
    const x = prime.x * W, y = prime.y * H, size = W * .52 * prime.scale;
    // Estela de motor mientras viaja (al llegar y al irse).
    if (prime.trail > 0) {
      const length = size * 2.6 * prime.trail, back = prime.heading + Math.PI;
      const tx = x + Math.cos(back) * length, ty = y + Math.sin(back) * length;
      const trail = ctx.createLinearGradient(x, y, tx, ty);
      trail.addColorStop(0, `rgba(215,190,255,${(.85 * prime.trail).toFixed(3)})`); trail.addColorStop(1, "rgba(120,60,255,0)");
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.strokeStyle = trail; ctx.lineCap = "round";
      ctx.lineWidth = size * .22; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.lineWidth = size * .07; ctx.strokeStyle = `rgba(255,255,255,${(.7 * prime.trail).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (tx - x) * .5, y + (ty - y) * .5); ctx.stroke();
      ctx.restore();
    }
    // Halo de carga detrás del cuerpo.
    if (prime.charge > 0) {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, size * (.4 + .5 * prime.charge));
      halo.addColorStop(0, `rgba(210,190,255,${(.55 * prime.charge).toFixed(3)})`); halo.addColorStop(1, "rgba(110,70,255,0)");
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = halo;
      ctx.fillRect(x - size, y - size, size * 2, size * 2); ctx.restore();
    }
    // Fotograma actual y fundido hacia el siguiente, con suavizado alto (en
    // iPhone el sprite se amplía).
    ctx.save(); ctx.globalAlpha = prime.alpha; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    drawAtlasCell(atlas, 8, prime.frame, x - size / 2, y - size / 2, size, size);
    if (prime.blend > 0 && prime.next !== prime.frame) {
      ctx.globalAlpha = prime.alpha * prime.blend;
      drawAtlasCell(atlas, 8, prime.next, x - size / 2, y - size / 2, size, size);
    }
    ctx.restore();
    // Frenazo: onda de energía que se expande y se apaga.
    if (prime.brake > 0) {
      const grow = 1 + (1 - prime.brake) * 1.3;
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = prime.brake;
      ctx.strokeStyle = "#d9ccff"; ctx.lineWidth = 3 + 10 * prime.brake; ctx.shadowColor = "#8f6bff"; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.ellipse(x, y, size * .48 * grow, size * .22 * grow, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  function drawCronosPrimeBeam(pose, targetX, targetY) {
    // Disparo vertical del núcleo a la torre: halo, núcleo blanco y descargas.
    const prime = pose.prime, beam = pose.beam, fx = SPRITES.cronosPrimeFx;
    if (!prime.visible || beam.alpha <= 0) return;
    const fromX = prime.x * W, fromY = prime.y * H;
    const length = Math.hypot(targetX - fromX, targetY - fromY), width = W * .16 * beam.width;
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = beam.alpha;
    ctx.translate(fromX, fromY); ctx.rotate(Math.atan2(targetY - fromY, targetX - fromX) - Math.PI / 2);
    const halo = ctx.createLinearGradient(-width, 0, width, 0);
    halo.addColorStop(0, "rgba(110,80,255,0)"); halo.addColorStop(.5, "rgba(170,140,255,.85)"); halo.addColorStop(1, "rgba(110,80,255,0)");
    ctx.fillStyle = halo; ctx.fillRect(-width, 0, width * 2, length);
    const core = ctx.createLinearGradient(-width * .14, 0, width * .14, 0);
    core.addColorStop(0, "rgba(255,255,255,0)"); core.addColorStop(.5, "rgba(255,255,255,1)"); core.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = core; ctx.fillRect(-width * .14, 0, width * .28, length);
    if (spriteReady(fx)) for (let index = 0; index < 3; index++) {
      const bolt = W * .2 * beam.width;
      ctx.save(); ctx.translate(0, length * (.25 + index * .3)); ctx.rotate(index % 2 ? .5 : -.5);
      drawAtlasCell(fx, 4, 1 + (index + Math.floor(pose.clock * 20)) % 6, -bolt / 2, -bolt / 2, bolt, bolt);
      ctx.restore();
    }
    ctx.restore();
    const spot = W * .2 * beam.width;
    const impact = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, spot);
    impact.addColorStop(0, `rgba(255,255,255,${beam.alpha.toFixed(3)})`); impact.addColorStop(1, "rgba(140,150,255,0)");
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = impact;
    ctx.fillRect(targetX - spot, targetY - spot, spot * 2, spot * 2); ctx.restore();
  }

  function drawChronosIntroStation(view, pose) {
    const node = view.station, atlas = SPRITES.chronosIntroStation;
    const station = pose.station;
    const unit = W * node.scale * station.zoom;
    const x = node.x * W, y = (node.y + station.drop) * H;
    const ringPoint = (angle, radius) => [x + Math.cos(angle) * radius * unit, y + Math.sin(angle) * radius * unit * station.tiltY];
    if (node.visible && spriteReady(atlas)) {
      ctx.save(); ctx.globalAlpha = station.alpha;
      const wheel = unit * .7;
      const wheelSpace = () => { ctx.translate(x, y); ctx.rotate(station.sway); ctx.scale(1, station.tiltY); ctx.rotate(station.wheelAngle); };
      if (station.whole) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(station.sway); ctx.scale(1, station.tiltY); ctx.rotate(station.ringAngle);
        drawAtlasCell(atlas, 3, 0, -unit / 2, -unit / 2, unit, unit);
        ctx.restore();
        ctx.save(); wheelSpace();
        drawAtlasCell(atlas, 3, 1, -wheel / 2, -wheel / 2, wheel, wheel);
        ctx.restore();
        // Luz por sectores: brillan mientras viven y se apagan uno a uno.
        const sectors = station.sectorLights;
        for (let index = 0; index < sectors.length; index++) {
          const from = -Math.PI / 2 + index * Math.PI * 2 / sectors.length, to = from + Math.PI * 2 / sectors.length;
          ctx.save(); wheelSpace(); ctx.rotate(-station.wheelAngle);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, unit * .62, from, to); ctx.closePath(); ctx.clip();
          ctx.rotate(station.wheelAngle);
          if (sectors[index] > 0) {
            ctx.globalCompositeOperation = "screen"; ctx.globalAlpha *= .4 * sectors[index];
            drawAtlasCell(atlas, 3, 1, -wheel / 2, -wheel / 2, wheel, wheel);
          } else {
            ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha *= .7;
            ctx.fillStyle = "#1e1a32"; ctx.fillRect(-unit, -unit, unit * 2, unit * 2);
          }
          ctx.restore();
        }
      }
      // Torre de cristal mientras vive (al estallar, la estación desaparece).
      if (station.whole) {
        const tower = unit * .62;
        ctx.save(); ctx.translate(x, y + unit * .1); ctx.rotate(station.sway * .6);
        drawAtlasCell(atlas, 3, station.towerCell, -tower / 2, -tower, tower, tower);
        ctx.restore();
      }
      ctx.restore();
    }
    // La propia estación estalla (hojas del propietario, fundidas).
    const blast = SPRITES.chronosStationBurst;
    if (pose.explosion && spriteReady(blast)) {
      const size = unit * pose.explosion.scale;
      ctx.save(); ctx.globalAlpha = pose.explosion.alpha;
      drawAtlasCell(blast, 5, pose.explosion.frame, x - size / 2, y - size / 2, size, size);
      if (pose.explosion.blend > 0 && pose.explosion.next !== pose.explosion.frame) {
        ctx.globalAlpha = pose.explosion.alpha * pose.explosion.blend;
        drawAtlasCell(blast, 5, pose.explosion.next, x - size / 2, y - size / 2, size, size);
      }
      ctx.restore();
    }
    // Restos que salen despedidos; los que van hacia la nave crecen.
    const fragments = SPRITES.chronosIntroFragments;
    if (pose.fragments.length && spriteReady(fragments)) {
      for (const piece of pose.fragments) {
        if (piece.alpha <= 0) continue;
        const size = unit * .16 * piece.scale;
        ctx.save(); ctx.globalAlpha = piece.alpha;
        ctx.translate(x + piece.dx * unit * .9, y + piece.dy * unit * .9); ctx.rotate(piece.angle);
        drawAtlasCell(fragments, 4, piece.cell, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }
    // Descargas que llevan la energía de cada sector a Cronos Prime.
    const prime = pose.prime, fx = SPRITES.cronosPrimeFx;
    if (spriteReady(fx)) for (const stream of pose.drainStreams) {
      if (stream.alpha <= 0) continue;
      const [sx, sy] = ringPoint(stream.angle, .3);
      const tx = prime.x * W, ty = prime.y * H, mx = (sx + tx) / 2 + (sx - x) * .4, my = (sy + ty) / 2;
      const at = t => [(1 - t) ** 2 * sx + 2 * (1 - t) * t * mx + t * t * tx, (1 - t) ** 2 * sy + 2 * (1 - t) * t * my + t * t * ty];
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = stream.alpha;
      for (let segment = 0; segment < 3; segment++) {
        const [ax, ay] = at(segment / 3), [bx, by] = at((segment + 1) / 3);
        const length = Math.hypot(bx - ax, by - ay);
        ctx.save(); ctx.translate((ax + bx) / 2, (ay + by) / 2); ctx.rotate(Math.atan2(by - ay, bx - ax) - Math.PI / 2);
        drawAtlasCell(fx, 4, 1 + (stream.cell + segment) % 6, -length * .35, -length * .6, length * .7, length * 1.2);
        ctx.restore();
      }
      const [dx, dy] = at(stream.progress);
      ctx.fillStyle = "#f4f0ff"; ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    drawCronosPrimeDistantLight(pose);
    drawCronosPrimeBeam(pose, x, y - unit * .3);
    drawCronosPrime(pose);
  }

  function drawChronosIntroOverlay(pose) {
    const card = pose.prime.nameCard;
    if (card > 0) {
      // Rótulo del villano: entra de golpe, con aberración cromática violeta.
      const punch = 1 + .35 * pose.prime.nameCardPunch;
      ctx.save(); ctx.globalAlpha = card; ctx.textAlign = "center";
      ctx.translate(W / 2, H * .7); ctx.scale(punch, punch);
      ctx.font = "900 76px 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "rgba(255,40,110,.7)"; ctx.fillText("CRONOS PRIME", -4, 0);
      ctx.fillStyle = "rgba(70,200,255,.7)"; ctx.fillText("CRONOS PRIME", 4, 0);
      ctx.fillStyle = "#f6f2ff"; ctx.shadowColor = "#8f6bff"; ctx.shadowBlur = 22; ctx.fillText("CRONOS PRIME", 0, 0);
      ctx.shadowBlur = 0; ctx.fillStyle = "#c7b8ff"; ctx.font = "800 22px 'Trebuchet MS', sans-serif";
      ctx.fillText("LA IA DEL REACTOR, DESPIERTA", 0, 40);
      ctx.restore();
    }
    if (pose.flash > 0) {
      ctx.save(); ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(215,230,255,${pose.flash.toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }

  function chronosSceneryFrame() {
    // Reuse geometry sampled by the UI's layout owner. Reading the DOM here
    // would force a layout on every rendered frame, including paused frames.
    const measured = typeof classicFlightBounds === "object" ? classicFlightBounds : null;
    const top = clamp(Number.isFinite(measured?.presentationTop) ? measured.presentationTop : H * .14, 0, H * .70);
    const bottom = clamp(Number.isFinite(measured?.presentationBottom) ? measured.presentationBottom : H * .88, top, H);
    return { top, bottom, height: Math.max(1, bottom - top), gap: Math.max(10, H * .012) };
  }

  function chronosDestinationPresentation(node) {
    const frame = chronosSceneryFrame();
    const maximumSize = Math.max(1, frame.height - frame.gap * 2);
    const scale = Math.min(node.scale, maximumSize / W);
    const radius = W * scale * .5;
    // Keep the growing illustrated globe below the measured tactical strip.
    // This is a camera projection only: route coordinates, scale, collisions
    // and the sparse middle stages remain untouched.
    const y = clamp(Math.max(frame.top + frame.gap + node.y * frame.height,
      frame.top + frame.gap + radius), frame.top + frame.gap + radius,
      frame.bottom - frame.gap - radius);
    return { ...node, scale, y: y / H };
  }

  function drawChronosRouteCrossing(transition) {
    const cue = transition?.cue;
    if (!cue) return;
    const image = cue.kind === "chronos-remnant"
      ? (cue.side > 0 ? SPRITES.debrisPanel : SPRITES.debrisMetal) : SPRITES.satellite;
    if (!spriteReady(image)) return;
    const frame = chronosSceneryFrame();
    const size = Math.min(W * cue.scale, frame.height * .28);
    ctx.save();
    // A navigation marker passes at the side of the corridor, behind combat.
    // Its growing scale and exit, rather than opacity, communicate the crossing.
    // Clip its projection to the measured HUD/control corridor, not a hitbox.
    ctx.beginPath(); ctx.rect(0, frame.top, W, frame.height); ctx.clip();
    ctx.translate(W * cue.x, frame.top + cue.y * frame.height);
    ctx.rotate(cue.rotation);
    ctx.globalAlpha = cue.kind === "chronos-remnant" ? .58 : .74;
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function drawChronosFlightBackground() {
    const view = classicFlightView;
    if (!view) return;
    const clock = view.elapsed;
    const destruction = NeonCampaign.getChronosDestructionPose(view);
    const transition = typeof NeonCampaign.getVoyageTransitionPresentation === "function"
      ? NeonCampaign.getVoyageTransitionPresentation(view, {reducedEffects: Boolean(settings.reduceEffects)}) : null;
    const space = SPRITES.flightSpace;
    ctx.fillStyle = "#020817"; ctx.fillRect(0, 0, W, H);
    if (spriteReady(space)) {
      // Overscan bounds the drift so no transparent edge or repeated painting
      // appears.  The station and Gaia move separately over this distant plate.
      const scale = Math.max(W / space.naturalWidth, H / space.naturalHeight) * 1.20;
      const width = space.naturalWidth * scale, height = space.naturalHeight * scale;
      const offsetX = clamp(view.deepSpace.offsetX * W, -(width - W) / 2, (width - W) / 2);
      const offsetY = clamp((view.deepSpace.offsetY - .27) * H * .25, -(height - H) / 2, (height - H) / 2);
      // Nebular dust is distant illumination, not another destination image.
      // The authored route becomes genuinely sparse between Chronos and Gaia;
      // the opaque origin and destination still travel independently below.
      ctx.save();
      ctx.globalAlpha = transition?.environment.nebulaOpacity ?? (Number.isFinite(view.deepSpace.nebulaOpacity)
        ? clamp(view.deepSpace.nebulaOpacity, 0, 1) : 1);
      ctx.drawImage(space, (W - width) / 2 + offsetX, (H - height) / 2 + offsetY, width, height);
      ctx.restore();
    }

    // Tiny secondary stars may use simple marks; all important scene objects
    // below are original illustrated sprites, not substitute geometry.
    ctx.save(); ctx.globalCompositeOperation = "screen";
    const starBudget = settings.effectsQuality === "low" ? 16 : 30;
    const starDensity = transition?.environment.starDensity ?? (Number.isFinite(view.deepSpace.starDensity)
      ? clamp(view.deepSpace.starDensity, 0, 1) : 1);
    const starCount = Math.round(starBudget * starDensity);
    // Travel gives every depth layer the same continuous direction even when a
    // new stage changes cruise speed. No wall clock or additional update loop.
    const starTravel = clock * .5 + view.deepSpace.travel * 140;
    for (let index = 0; index < starCount; index++) {
      const depth = .24 + (index % 5) * .18;
      const x = ((index * 149.13 - starTravel * depth * 1.6) % W + W) % W;
      const y = (index * 271.73 + starTravel * depth * 8) % H;
      const radius = .55 + depth * .65;
      ctx.globalAlpha = .12 + depth * .18;
      ctx.fillStyle = index % 4 ? "#cce8ff" : "#cbbdff";
      ctx.fillRect(x, y, radius, radius * (1 + view.deepSpace.speed * .6 + (transition?.starStretch || 0) * 2));
    }
    ctx.restore();

    const intro = chronosIntroPose(view);
    if (intro) drawTalasa(intro);
    if (intro) drawChronosIntroDarkness(intro);
    drawChronosFlightSprite(2, chronosDestinationPresentation(view.planet));
    if (intro) withChronosIntroCamera(intro, () => drawChronosIntroStation(view, intro));
    else if (!drawChronosDestructionStation(view, destruction)) {
      // A failed new download keeps the two preserved station poses playable.
      drawChronosFlightSprite(view.station.state === "ruptured" ? 1 : 0, view.station);
    }

    if (view.debris.visible) {
      // These small fragments belong to the Chronos breach.  Their low contrast
      // and scale distinguish ambient parallax from collidable foreground scrap.
      const dustBudget = settings.effectsQuality === "low" ? 3 : 6;
      const sparseTransit = view.stageNumber >= 5 && view.stageNumber <= 7;
      const dustDensity = Number.isFinite(view.deepSpace.dustDensity)
        ? clamp(view.deepSpace.dustDensity, 0, 1) : sparseTransit ? .18 : 1;
      const count = Math.round(dustBudget * dustDensity);
      for (let index = 0; index < count; index++) {
        const depth = .25 + index * .12;
        const image = index % 2 ? SPRITES.debrisPanel : SPRITES.debrisMetal;
        if (!spriteReady(image)) continue;
        const x = ((W * (.22 + index * .23) + clock * view.debris.directionX * 18 * depth) % (W + 80) + W + 80) % (W + 80) - 40;
        const y = (H * .13 + index * 189 + clock * view.debris.directionY * (21 + depth * 33)) % (H + 100) - 50;
        const size = 12 + depth * 24;
        ctx.save(); ctx.translate(x, y); ctx.rotate(index * .9 + clock * (.035 + index * .009));
        ctx.globalAlpha = .20 + depth * .15;
        ctx.drawImage(image, -size / 2, -size / 2, size, size); ctx.restore();
      }
    }

    drawChronosRouteCrossing(transition);

    if (view.beacon.visible && !atlasBoss && spriteReady(SPRITES.guardianAtlas)) {
      const size = Math.max(42, W * view.beacon.scale*1.5);
      ctx.save(); ctx.translate(W * view.beacon.x, H * view.beacon.y);
      const atlas=SPRITES.guardianAtlas;
      ctx.drawImage(atlas,0,0,atlas.naturalWidth/4,atlas.naturalHeight/2,-size/2,-size/2,size,size);
      ctx.restore();
      if (view.beacon.active) {
        ctx.save(); ctx.textAlign = "center"; ctx.font = "bold 17px sans-serif";
        ctx.fillStyle = "#bcefff";
        ctx.fillText("GUARDIAN ATLAS", W * view.beacon.x, H * view.beacon.y + size * .65);
        ctx.restore();
      }
    }

    // Con el inicio nuevo el atacante es Cronos Prime, no la nave antigua.
    if (view.attacker.visible && !intro) {
      const attacker = view.attacker;
      const size = W * attacker.scale * 1.4;
      // The artwork's cannon points down-left.  Rotate its measured muzzle
      // offset with the hull rather than emitting the attack from its centre.
      const localX = -129 / 512 * size, localY = 134 / 512 * size;
      const angle = attacker.rotation || 0;
      const muzzleX = W * attacker.x + localX * Math.cos(angle) - localY * Math.sin(angle);
      const muzzleY = H * attacker.y + localX * Math.sin(angle) + localY * Math.cos(angle);
      if (attacker.state === "fire") {
        const targetX = W * view.station.x, targetY = H * view.station.y;
        const dx = targetX - muzzleX, dy = targetY - muzzleY;
        ctx.save();
        ctx.translate((muzzleX + targetX) / 2, (muzzleY + targetY) / 2);
        ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);
        ctx.globalCompositeOperation = "screen";
        drawAtlasVfx(0, 17, Math.max(30, Math.hypot(dx, dy)), .88 + Math.sin(clock * 43) * .10);
        ctx.restore();
      }
      const frame = attacker.state === "charge" ? 4 : attacker.state === "fire" ? 5 : 3;
      drawChronosFlightSprite(frame, attacker, 1.4);
    }

    ensureSprite(SPRITES.chronosShockwave);
    if (!intro && destruction.waveVisible && spriteReady(SPRITES.chronosShockwave)) {
      const atlas = SPRITES.chronosShockwave;
      const cellWidth = atlas.naturalWidth / 2, cellHeight = atlas.naturalHeight / 2;
      const frame = destruction.waveFrame;
      const size = W * destruction.waveScale;
      ctx.save(); ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = destruction.waveAlpha;
      ctx.drawImage(atlas, frame % 2 * cellWidth, Math.floor(frame / 2) * cellHeight,
        cellWidth, cellHeight, view.station.x * W - size / 2, view.station.y * H - size / 2, size, size);
      ctx.restore();
    }

    if (intro) drawChronosIntroOverlay(intro);

    // Keep the flight lane readable without fading the origin into a second
    // background.  Its disappearance is solely movement and scale from the route.
    const veil = ctx.createLinearGradient(0, H * .40, 0, H);
    veil.addColorStop(0, "rgba(2,6,15,0)");
    veil.addColorStop(1, "rgba(2,6,15,.35)");
    ctx.fillStyle = veil; ctx.fillRect(0, 0, W, H);
  }

  function drawGaiaOrbitBackground() {
    const space = SPRITES.flightSpace;
    // These independent illustrated layers are shared with the journey that
    // just arrived here. Without them the drawn sector sky is the fallback.
    if (!spriteReady(space) || !spriteReady(SPRITES.flightKit)) return false;
    const frame = chronosSceneryFrame();
    const progress = clamp(collected / level().goal, 0, 1);
    const travel = elapsed;
    ctx.fillStyle = "#020817"; ctx.fillRect(0, 0, W, H);
    const scale = Math.max(W / space.naturalWidth, H / space.naturalHeight) * 1.16;
    const width = space.naturalWidth * scale, height = space.naturalHeight * scale;
    const driftX = Math.sin(travel * .018) * Math.min(12, (width - W) * .35);
    const driftY = Math.sin(travel * .012) * Math.min(20, (height - H) * .35);
    ctx.save(); ctx.globalAlpha = .46;
    ctx.drawImage(space, (W - width) / 2 + driftX, (H - height) / 2 + driftY, width, height);
    ctx.restore();

    ctx.save(); ctx.globalCompositeOperation = "screen";
    const count = settings.effectsQuality === "low" ? 12 : 24;
    for (let index = 0; index < count; index++) {
      const depth = .25 + index % 4 * .18;
      const x = ((index * 149.13 - travel * depth * 1.2) % W + W) % W;
      const y = (index * 271.73 + travel * depth * 13) % H;
      ctx.globalAlpha = .12 + depth * .18; ctx.fillStyle = "#d3edff";
      ctx.fillRect(x, y, .6 + depth * .6, 1 + depth);
    }
    ctx.restore();

    const planet = chronosDestinationPresentation({visible: true, x: .78 - progress * .04,
      y: .065, scale: .90 + progress * .22, rotation: .06 + travel * .0003});
    drawChronosFlightSprite(2, planet);

    // Small, unarmed navigation relays orbit at a nearer depth. They are scenery,
    // never registered as enemies or colliders, and remain behind all combat.
    if (spriteReady(SPRITES.satellite)) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, frame.top, W, frame.height); ctx.clip();
      for (let index = 0; index < 2; index++) {
        const depth = (travel * .0045 + index * .53) % 1;
        const size = W * (.055 + depth * .055);
        const side = index ? 1 : -1;
        const x = W * (.5 + side * (.39 + .035 * depth));
        const y = frame.top + frame.height * (-.10 + 1.25 * depth);
        ctx.save(); ctx.translate(x, y); ctx.rotate(side * (.18 + travel * .035));
        ctx.globalAlpha = .64;
        ctx.drawImage(SPRITES.satellite, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
      ctx.restore();
    }
    const readability = ctx.createLinearGradient(0, H * .40, 0, H);
    readability.addColorStop(0, "rgba(2,6,15,0)");
    readability.addColorStop(1, "rgba(2,6,15,.38)");
    ctx.fillStyle = readability; ctx.fillRect(0, 0, W, H);
    return true;
  }

  // Planeta animado del sector (pose pura de NeonCampaign.sectorPlanetPose):
  // 7 fotogramas de giro con fundido; sustituye a los fondos fijos.
  const SECTOR_PLANET_SPRITES = {volcanico: "planetVolcanico", glacial: "planetGlacial",
    violeta: "planetVioleta", tormentoso: "planetTormentoso"};
  function sectorPlanet() {
    if (typeof NeonCampaign.sectorPlanetPose !== "function") return null;
    const pose = NeonCampaign.sectorPlanetPose(currentLevel, elapsed, collected / Math.max(1, level().goal));
    const image = pose && SPRITES[SECTOR_PLANET_SPRITES[pose.key]];
    if (!image) return null;
    ensureSprite(image);
    return spriteReady(image) ? {pose, image} : null;
  }

  function drawSectorPlanet() {
    const planet = sectorPlanet();
    if (!planet) return;
    const {pose, image} = planet, cell = image.naturalWidth / 4, size = W * pose.size;
    const x = W * pose.x - size / 2, y = H * pose.y - size / 2;
    const draw = (frame, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(image, frame % 4 * cell, Math.floor(frame / 4) * cell, cell, cell, x, y, size, size);
    };
    ctx.save(); draw(pose.frame, 1); if (pose.blend > 0) draw(pose.next, pose.blend); ctx.restore();
  }

  function drawVulkarOrbitBackground() {
    const planet=SPRITES.vulkarOrbitPlanet;
    ensureSprite(planet);
    const progress=clamp(collected/level().goal,0,1);
    // The planet uses played time: pause and backgrounding freeze this view.
    if(spriteReady(planet)) {
      const size=W*(.88+progress*.22);
      const x=W*(.89-progress*.06)+Math.sin(elapsed*.035)*6;
      const y=H*(.17+progress*.04)+Math.sin(elapsed*.021)*10;
      ctx.save();ctx.translate(x,y);ctx.rotate(-.14+elapsed*.0015);
      ctx.drawImage(planet,-size/2,-size/2,size,size);ctx.restore();
    }
    // Illustrated orbital fragments cross at a nearer depth. They are scenery,
    // do not share the threat list and cannot inflict invisible collision damage.
    const fragment=SPRITES.meteorSmall || frameFrom("meteor",0);
    if(fragment && spriteReady(fragment))for(let i=0;i<4;i++) {
      const cycle=(elapsed*(9+i*2)+i*371)%(H+160);
      const size=18+i*10,x=(i%2?W*.91:W*.07)+Math.sin(i*2.3+elapsed*.04)*18;
      ctx.save();ctx.globalAlpha=.5;ctx.translate(x,cycle-80);ctx.rotate(i+elapsed*(.03+i*.008));
      ctx.drawImage(fragment,-size/2,-size/2,size,size);ctx.restore();
    }
  }

  function background(t) {
    if (classicFlightView) { drawChronosFlightBackground(); return; }
    if(currentLevel===1 && drawGaiaOrbitBackground()) {return;}
    const lv = level();
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, lv.top);
    gradient.addColorStop(0.42, lv.mid);
    gradient.addColorStop(0.78, "#050712");
    gradient.addColorStop(1, "#02030a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // NEON VISUAL PASS: broad animated nebula ribbons replace the flat empty void.
    // Deterministic phase by sector, bounded gradients, no additional image downloads.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const sectorHue = [195, 220, 28, 265, 355, 280, 175, 30, 250, 325][currentLevel] ?? 195;
    const visualTier = settings.effectsQuality === "low" ? 1 : 3;
    for (let ribbon = 0; ribbon < visualTier; ribbon++) {
      const phase = t * (0.00006 + ribbon * 0.000018) + currentLevel * 1.41 + ribbon * 2.3;
      const cx = W * (0.52 + Math.sin(phase) * 0.31);
      const cy = H * (0.22 + ribbon * 0.19 + Math.cos(phase * 0.8) * 0.075);
      const radius = W * (0.49 + ribbon * 0.11);
      const cloud = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const hue = (sectorHue + ribbon * 34) % 360;
      cloud.addColorStop(0, `hsla(${hue},95%,57%,0.18)`);
      cloud.addColorStop(0.35, `hsla(${hue},90%,43%,0.075)`);
      cloud.addColorStop(1, `hsla(${hue},80%,30%,0)`);
      ctx.fillStyle = cloud;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();


    // Start the authored VFX download while the level is still in its menu;
    // the scripted reactor accident happens thirty-one seconds into play.
    if (currentLevel === 0) ensureSprite(SPRITES.chronosShockwave);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const nebula = ctx.createRadialGradient(W * 0.5, H * 0.27, 0, W * 0.5, H * 0.27, W * 0.78);
    nebula.addColorStop(0, lv.accent + "42");
    nebula.addColorStop(0.28, lv.accent + "15");
    nebula.addColorStop(1, "#0000");
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);

    // Capa lejana: puntos diminutos, lentos y con un parpadeo apenas visible.
    for (const star of stars) {
      const streak = visualSpeed > 2.4 ? Math.min(18, (visualSpeed - 2.2) * star.layer * 3.8) : 0;
      ctx.globalAlpha = star.a * (0.70 + 0.30 * Math.sin(t * 0.001 + star.x));
      ctx.fillStyle = star.tint;
      ctx.beginPath();
      if (streak > 1) ctx.roundRect(star.x - star.r * 0.5, star.y - streak, Math.max(0.7, star.r), streak + star.r, star.r);
      else ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Vulkar: el planeta va sobre el cielo dibujado (ya no hay imagen de fondo).
    if (currentLevel === 2) drawVulkarOrbitBackground();
    drawSectorPlanet();
    drawSectorEnvironment(t, lv);

    // Capa media: polvo y restos minúsculos con una deriva independiente.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const dust of spaceDust) {
      ctx.globalAlpha = dust.a;
      ctx.fillStyle = Math.floor(dust.x + dust.y) % 3 ? lv.accent : "#b5c8dd";
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Primer plano: partículas escasas, rápidas y suavizadas por glow.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = 12;
    ctx.shadowColor = lv.accent;
    for (const mote of foregroundParticles) {
      ctx.globalAlpha = mote.a * (state === "playing" ? 1 : 0.45);
      ctx.fillStyle = "#dffcff";
      ctx.beginPath();
      ctx.ellipse(mote.x, mote.y, mote.r * 0.55, mote.r * (1.2 + Math.min(2.2, visualSpeed * 0.3)), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.46, W * 0.2, W * 0.5, H * 0.46, W * 0.95);
    vignette.addColorStop(0.6, "#0000");
    vignette.addColorStop(1, "rgba(0,0,0,.45)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (currentLevel === 0 && levelOneShockwave > 0) {
      const progress = clamp(1 - levelOneShockwave / 0.62, 0, 1);
      const sx = W * 0.50;
      const sy = H * 0.40;
      const strength = Math.sin(progress * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const size = Math.min(W, H) * (0.36 + progress * 1.45);
      ctx.globalAlpha = strength * 0.62;
      if (spriteReady(SPRITES.chronosShockwave)) {
        const atlas = SPRITES.chronosShockwave;
        const cellWidth = atlas.naturalWidth / 2;
        const cellHeight = atlas.naturalHeight / 2;
        const frame = Math.min(3, Math.floor(progress * 4));
        ctx.drawImage(atlas, (frame % 2) * cellWidth, Math.floor(frame / 2) * cellHeight,
          cellWidth, cellHeight, sx - size / 2, sy - size / 2, size, size);
      } else if (spriteReady(SPRITES.shieldEffect)) {
        // A short-lived fallback if the atlas is still downloading.
        ctx.drawImage(SPRITES.shieldEffect, sx - size / 2, sy - size / 2, size, size);
      }
      ctx.restore();
    }

    if (stormPulse > 0 && !settings.reduceEffects) {
      ctx.fillStyle = `rgba(255,255,255,${stormPulse * 0.28})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawWarp() {
    if (warpTimer <= 0) return;
    const progress = clamp(1 - warpTimer / 1.25, 0, 1);
    const intensity = Math.sin(progress * Math.PI);
    const centerX = W * 0.5;
    const centerY = H * 0.42;
    const count = settings.effectsQuality === "high" ? 30 : settings.effectsQuality === "normal" ? 23 : 14;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = level().accent;
    ctx.shadowColor = level().accent;
    ctx.shadowBlur = 8;
    ctx.lineCap = "round";
    for (let index = 0; index < count; index++) {
      const angle = index * 2.3999632297 + (index % 3) * 0.19;
      const seed = ((index * 37) % count) / count;
      const travel = (seed + progress * (0.72 + (index % 5) * 0.035)) % 1;
      const radius = 42 + Math.pow(travel, 1.65) * Math.max(W, H) * 0.72;
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);
      const x = centerX + directionX * radius;
      const y = centerY + directionY * radius;
      const length = 5 + travel * travel * 38;
      ctx.globalAlpha = intensity * (0.12 + travel * 0.42);
      ctx.lineWidth = 0.8 + travel * 1.4;
      ctx.beginPath();
      ctx.moveTo(x - directionX * length, y - directionY * length);
      ctx.lineTo(x + directionX * length * 0.18, y + directionY * length * 0.18);
      ctx.stroke();
    }
    ctx.globalAlpha = intensity * 0.34;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24 + progress * 74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawTractorCable() {
    if (powers.tractor <= 0 || !tractorTarget) return;
    const startX = player.x;
    const startY = player.y - SHIP_VISUAL.tractorMuzzleOffset;
    const dx = tractorTarget.x - startX;
    const dy = tractorTarget.y - startY;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const frame = frameFrom("tractor", Math.floor(elapsed * 13));
    const intensity = clamp(1 - distance / 430, 0.25, 1);
    const targetWidth = Math.max(20, tractorTarget.r * 1.25);

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "screen";
    ctx.shadowBlur = 18 + intensity * 18;
    ctx.shadowColor = "#45eaff";

    const volume = ctx.createLinearGradient(0, 0, distance, 0);
    volume.addColorStop(0, `rgba(210,255,255,${0.18 + intensity * 0.18})`);
    volume.addColorStop(0.48, `rgba(57,225,255,${0.08 + intensity * 0.12})`);
    volume.addColorStop(1, `rgba(102,137,255,${0.22 + intensity * 0.16})`);
    ctx.fillStyle = volume;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(distance, -targetWidth);
    ctx.lineTo(distance, targetWidth);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(distance, -targetWidth); ctx.lineTo(distance, targetWidth); ctx.lineTo(0, 9); ctx.closePath();
    ctx.clip();
    for (let index = 0; index < 13; index++) {
      const travel = (elapsed * (0.82 + intensity * 0.55) + index / 13) % 1;
      const x = distance * (1 - travel);
      const spread = 6 + (x / Math.max(1, distance)) * targetWidth * 0.72;
      const y = Math.sin(index * 2.43 + elapsed * 7.5) * spread;
      ctx.globalAlpha = 0.22 + intensity * 0.55;
      ctx.fillStyle = index % 3 ? "#7df5ff" : "#ffffff";
      ctx.beginPath(); ctx.arc(x, y, 1.4 + intensity * 1.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = `rgba(210,255,255,${0.22 + intensity * 0.42})`;
    ctx.lineWidth = 1.2 + intensity;
    for (let arc = 0; arc < 2; arc++) {
      ctx.beginPath();
      for (let segment = 0; segment <= 8; segment++) {
        const x = distance * segment / 8;
        const y = Math.sin(elapsed * 18 + segment * 2.2 + arc * 3.1) * (4 + x / Math.max(1, distance) * targetWidth * 0.34);
        if (segment) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    if (frame) {
      ctx.globalAlpha = 0.18 + intensity * 0.16;
      ctx.drawImage(frame, 0, -targetWidth, distance, targetWidth * 2);
    } else {
      ctx.strokeStyle = "#55eaff";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -elapsed * 60;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(distance, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.58 + intensity * 0.35;
    ctx.fillStyle = "#eaffff";
    ctx.beginPath(); ctx.arc(0, 0, 5 + intensity * 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
