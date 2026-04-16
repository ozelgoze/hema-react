const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Page loaded, check BROWSER ERROR output above.');
  await browser.close();
})();
