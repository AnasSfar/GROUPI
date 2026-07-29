const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"], input[name="email"]', 'prof1@test.com');
  await page.fill('input[type="password"], input[name="password"]', 'admin-local');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.goto('http://localhost:5173/teacher/profile');
  await page.waitForSelector('.profile-card', { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'C:/Users/sfara/AppData/Local/Temp/claude/c--Users-sfara-Documents-GitHub-GROUPI/f56bf838-87da-4359-b93d-955e53ead044/scratchpad/picker-collapsed.png', fullPage: true });

  // Open the Lycée section
  await page.click('.level-section-header');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'C:/Users/sfara/AppData/Local/Temp/claude/c--Users-sfara-Documents-GitHub-GROUPI/f56bf838-87da-4359-b93d-955e53ead044/scratchpad/picker-open.png', fullPage: true });

  await browser.close();
})();
