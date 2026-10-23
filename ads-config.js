/**
 * Configuración V7.1 pre-release.
 *
 * La compilación nativa usa exclusivamente los identificadores de demostración
 * publicados por Google. No generan ingresos y deben sustituirse mediante una
 * configuración de release antes de enviar el juego a App Store.
 */
window.MONETIZATION_CONFIG = Object.freeze({
  web: Object.freeze({
    enabled: false,
    testRewardedSimulator: true,
    simulatorDelayMs: 900
  }),
  native: Object.freeze({
    enabled: true,
    testing: true,
    interstitialEveryRuns: 0,
    bannerId: "ca-app-pub-3940256099942544/2934735716",
    interstitialId: "ca-app-pub-3940256099942544/4411468910",
    rewardedId: "ca-app-pub-3940256099942544/1712485313"
  })
});
