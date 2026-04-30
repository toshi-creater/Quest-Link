// @ts-check
'use strict';

/**
 * LHCI puppeteer auth script.
 * Runs before each Lighthouse measurement. Logs in via the CI-only
 * credentials form rendered when LHCI_TEST_ENABLED=true.
 *
 * @param {import('puppeteer-core').Browser} browser
 * @param {{ url: string }} context
 */
module.exports = async (browser, context) => {
  const page = await browser.newPage();

  await page.goto(`${new URL(context.url).origin}/login`, {
    waitUntil: 'networkidle2',
  });

  // すでにログイン済み（/login からリダイレクトされた）場合はスキップ
  const emailInput = await page.$('#lhci-email');
  if (!emailInput) {
    await page.close();
    return;
  }

  const email = process.env.LHCI_TEST_EMAIL;
  const password = process.env.LHCI_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'LHCI_TEST_EMAIL and LHCI_TEST_PASSWORD must be set when using lhci-auth.cjs'
    );
  }

  await page.type('#lhci-email', email);
  await page.type('#lhci-password', password);

  const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.click('#lhci-submit');
  await navigationPromise;

  await page.close();
};
