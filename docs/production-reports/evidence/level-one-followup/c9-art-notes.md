# C9 HUD design handoff — source frozen

Owner: hud_c9_design. Writes finished to styles.css, assets/c9_upgrade_icons_v1.webp, art-source/c9-hud-v1/.

Runtime asset 1024×1024 RGBA,2×2 regular cells512,minimum48px transparentgutters. Four original generatedillustrations: emitter(0,0),hull(512,0),missiles(0,512),coolant(512,512). Fullcell source512²; CSSbackgroundsize200% with0/100%positions. Encoded165564bytes,decoded4MiB, SHA256 c8f36054d70ab750aa2ffeef099e278959c214265953631e02e915734f8cd792.

Master generated1254² preserved; normalized1024² master,4PNGcells,deterministicImageMagickexport,provenance andWebPalphaQA inart-source/c9-hud-v1. Actualtoolimage_gen, no stockimages/no newdependencies.

CSS supportsrootmarkup: .c9-header portrait/title; .c9-preview canvas/status2cols; `.c9-upgrades`2cols with4illustratedcards anddynamic[data-c9-label]text; `.c9-actions`stickytwo-buttonfooter. Oldlancecalibration spans2colsas44pxbutton. At320naturalmodal internalscroll isintentional,notmasked/clipped. New #classicC9 66×44leftbottom76,above104×48weapon, awayfrommissile/fire. Walletadjacenttopreserveflyingspace.

Important rootflow: `.c9-preview.after(loadout)` NOT status.after(loadout), because latterinserts3rdgridchildinsidepreview. Purchaselabelsupdatedvia[data-c9-label]soartremains.

AtlasCSS reducestransmission34→26px andtop89→85; hidesportraitduringboss ONLY. No collider/motion/layoutproofclaimed: rootmustreviewfrozenbrowser320×568and390×844 toconfirmbossmotiondoesnotreachUIband.

Executed: node art-source/c9-hud-v1/export-atlas.cjs (0), node art-source/c9-hud-v1/verify-atlas.cjs (0,4/4alphaandrealcontent), git diff --check -- styles.css art-source/c9-hud-v1 (0). Visuallyinspectedgeneratedandpackedmasters. No browser/build whileotherwritersactive.

Root ownsmanifests/loaders/serviceworker/precache/index/03runtimeandfinalbrowserQA. Register newatlas traceably, precacheforofflineC9, retainoldstationmasters. No prices/economy/receiptssavechangesfromthisagent. ArtisticacceptanceandphysicalIphonepending.
