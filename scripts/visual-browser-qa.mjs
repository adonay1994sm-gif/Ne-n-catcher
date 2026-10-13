import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

const candidates = [
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium', '/usr/bin/chromium-browser'
];
const executablePath = candidates.find((file) => existsSync(file));
if (!executablePath) throw new Error('No system Chromium/Chrome browser on CI runner');

const browser = await chromium.launch({
  executablePath, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
try {
  const page = await browser.newPage({
    viewport: { width: 430, height: 932 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push('JS ' + String(error)));
  page.on('requestfailed', (request) => errors.push('HTTP ' + request.url()));
  const response = await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error('Main game URL did not load');
  await mkdir('qa-screenshots', { recursive: true });
  await page.screenshot({ path: 'qa-screenshots/menu_430x932_dpr2.png' });
  await page.locator('#play').click();
  await page.locator('#launch').click();
  await page.waitForTimeout(1500);
  const visible = await page.locator('#hud').isVisible();
  await page.screenshot({ path: 'qa-screenshots/level1_430x932_dpr2.png' });
  if (!visible) throw new Error('Gameplay HUD not visible after launch');
  if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
  console.log('BROWSER_SMOKE_OK: mobile portrait 430x932 DPR2, menu and Level 1 captured');
} finally {
  await browser.close();
}
