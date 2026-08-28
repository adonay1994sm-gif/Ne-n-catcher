import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents
} from "@capacitor-community/admob";

const listenerHandles = [];
let initialized = false;
let canRequestAds = false;
let rewardRequest = null;
let interstitialRequest = null;

function settleReward(value) {
  if (!rewardRequest) return;
  const { resolve, timer } = rewardRequest;
  rewardRequest = null;
  clearTimeout(timer);
  resolve(Boolean(value));
}

function settleInterstitial(value) {
  if (!interstitialRequest) return;
  const { resolve, timer } = interstitialRequest;
  interstitialRequest = null;
  clearTimeout(timer);
  resolve(Boolean(value));
}

async function installListeners() {
  if (listenerHandles.length) return;
  listenerHandles.push(
    await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
      if (rewardRequest) rewardRequest.earned = Boolean(reward && Number(reward.amount) >= 0);
    }),
    await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => settleReward(rewardRequest?.earned === true)),
    await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => settleReward(false)),
    await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => settleReward(false)),
    await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => settleInterstitial(true)),
    await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => settleInterstitial(false)),
    await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => settleInterstitial(false))
  );
}

async function initialize(config = {}) {
  if (!Capacitor.isNativePlatform()) return false;
  if (initialized) return canRequestAds;

  await AdMob.initialize({ initializeForTesting: config.testing === true });
  await installListeners();

  let consent = await AdMob.requestConsentInfo();
  if (consent?.canRequestAds === false && consent?.isConsentFormAvailable) {
    consent = await AdMob.showConsentForm();
  }
  canRequestAds = consent?.canRequestAds !== false;
  initialized = true;
  return canRequestAds;
}

async function showBanner(config = {}) {
  if (!(await initialize(config))) return false;
  await AdMob.showBanner({
    adId: config.bannerId,
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: config.testing === true
  });
  return true;
}

async function hideBanner() {
  if (!initialized) return false;
  await AdMob.hideBanner();
  return true;
}

async function showInterstitial(config = {}) {
  if (!(await initialize(config)) || interstitialRequest) return false;
  await AdMob.prepareInterstitial({
    adId: config.interstitialId,
    isTesting: config.testing === true
  });

  const dismissalPromise = new Promise((resolve) => {
    interstitialRequest = {
      resolve,
      timer: setTimeout(() => settleInterstitial(false), 120000)
    };
  });

  try {
    await AdMob.showInterstitial();
  } catch (error) {
    settleInterstitial(false);
    throw error;
  }
  return dismissalPromise;
}

async function showRewarded(config = {}) {
  if (!(await initialize(config)) || rewardRequest) return false;
  await AdMob.prepareRewardVideoAd({
    adId: config.rewardedId,
    isTesting: config.testing === true
  });

  const rewardPromise = new Promise((resolve) => {
    rewardRequest = {
      resolve,
      earned: false,
      timer: setTimeout(() => settleReward(false), 120000)
    };
  });

  try {
    await AdMob.showRewardVideoAd();
  } catch (error) {
    settleReward(false);
    throw error;
  }
  return rewardPromise;
}

window.NeonNativeAds = Object.freeze({
  isAvailable: () => Capacitor.isNativePlatform(),
  initialize,
  showBanner,
  hideBanner,
  showInterstitial,
  showRewarded
});
