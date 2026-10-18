const CACHE = "neon-cronium-pre-release-7-2-0-salvage-combat-2";
const CORE = [
  "assets/c9_station_v1.webp",
  "assets/player_ship_identity_v1.webp",
  "assets/comet_flight_atlas_v2.webp",
  "./",
  "index.html",
  "styles.css?v=7.2.0",
  "native-admob.js?v=7.2.0",
  "ads-config.js?v=7.2.0",
  "ad-bridge.js?v=7.2.0",
  "analytics-manager.js?v=7.2.0",
  "core-runtime.js?v=7.2.0",
  "content-runtime.js?v=7.2.0",
  "game.js?v=7.2.0",
  "manifest.webmanifest",
  "privacy.html",
  "terms.html",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/ship_modular_atlas_v1.webp",
  "assets/chronos_flight_atlas_v1.webp",
  "assets/chronos_destruction_atlas_v1.webp",
  "assets/chronos_flight_weapons_v1.webp",
  "assets/chronos_flight_space_v1.webp",
  "assets/vulkar_orbit_background_v1.webp",
  "assets/vulkar_orbit_planet_v1.webp",
  "assets/force_shield_atlas_v1.webp",
  "assets/core_frame_00.webp",
  "assets/core_frame_01.webp",
  "assets/core_frame_02.webp",
  "assets/core_frame_03.webp",
  "assets/core_frame_04.webp",
  "assets/core_frame_05.webp",
  "assets/cronium_fragment_v1.webp",
  "assets/phaser_frame_00.webp",
  "assets/phaser_frame_01.webp",
  "assets/phaser_frame_02.webp",
  "assets/phaser_frame_03.webp",
  "assets/phaser_frame_04.webp",
  "assets/phaser_frame_05.webp",
  "assets/tractor_frame_00.webp",
  "assets/tractor_frame_01.webp",
  "assets/tractor_frame_02.webp",
  "assets/tractor_frame_03.webp",
  "assets/tractor_frame_04.webp",
  "assets/tractor_frame_05.webp",
  "assets/impact_frame_00.webp",
  "assets/impact_frame_01.webp",
  "assets/impact_frame_02.webp",
  "assets/impact_frame_03.webp",
  "assets/smoke_frame_00.webp",
  "assets/smoke_frame_01.webp",
  "assets/smoke_frame_02.webp",
  "assets/explosion_frame_00.webp",
  "assets/explosion_frame_01.webp",
  "assets/explosion_frame_02.webp",
  "assets/explosion_frame_03.webp",
  "assets/explosion_frame_04.webp",
  "assets/explosion_frame_05.webp",
  "assets/explosion_frame_06.webp",
  "assets/explosion_frame_07.webp",
  "assets/meteor_small.webp",
  "assets/meteor_small_alt.webp",
  "assets/meteor_medium.webp",
  "assets/meteor_medium_alt.webp",
  "assets/meteor_large.webp",
  "assets/ch01_atlas_v1.webp",
  "assets/ch02_interceptor_atlas_v1.webp",
  "assets/guardian_atlas_states_v1.webp",
  "assets/atlas_combat_vfx_v1.webp",
  "assets/arcade_pulse_atlas_v2.webp",
  "assets/hostile_ordnance_atlas_v1.webp",
  "assets/gaia_pulse_atlas_v3.webp",
  "assets/debris_metal.webp",
  "assets/debris_panel.webp",
  "assets/debris_hot_00.webp",
  "assets/debris_hot_01.webp",
  "assets/satellite_old.webp",
  "assets/repair_drone.webp",
  "assets/shield_effect.webp",
  "assets/shield_idle.webp",
  "assets/explosion_small.webp",
  "assets/cronos_level1_background.webp",
  "assets/chronos_shockwave_atlas_v1.webp",
  "assets/chronos_detached_module_v1.webp",
  "assets/atlas_perimeter_background_v1.webp",
  "assets/vulkar_descent_background_v1.webp",
  "assets/vulkar_magma_tunnel_background_v1.webp",
  "assets/cryon_whiteout_background_v1.webp",
  "assets/cryon_leviathan_rift_background_v1.webp",
  "assets/aether_echo_cemetery_background_v1.webp",
  "assets/aether_phantom_threshold_background_v1.webp",
  "assets/titan_omega_graveyard_background_v1.webp",
  "assets/chronos_collapse_background_v1.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  // Retain this generation's handle before waiting for the network. If a newer
  // worker deletes its name, this response must not reopen that retired cache.
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response?.status === 200) {
      const copy = response.clone();
      await cache.put(request, copy);
    }
    return response;
  } catch {
    return (await cache.match(request)) || (request.mode === "navigate" ? cache.match("index.html") : undefined);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response?.status === 200) {
    const copy = response.clone();
    await cache.put(request, copy);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const isCode = event.request.mode === "navigate" || /\.(?:html|js|css)$/.test(url.pathname);
  event.respondWith(isCode ? networkFirst(event.request) : cacheFirst(event.request));
});
