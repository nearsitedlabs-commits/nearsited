import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // iPhone 14 Pro viewport
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();

  // 1. Go to login page first
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/mobile-login.png", fullPage: true });
  console.log("✓ Screenshot: mobile-login.png");

  // 2. Go to leads page (may redirect to login if not authenticated)
  await page.goto(`${BASE}/dashboard/leads`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/mobile-leads.png", fullPage: true });
  console.log("✓ Screenshot: mobile-leads.png");

  // 3. Try a specific lead detail page if there are leads
  // First check if we're on the login page or the actual leads page
  const url = page.url();
  console.log(`Current URL: ${url}`);

  // 4. Check discover page too
  await page.goto(`${BASE}/dashboard/discover`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/mobile-discover.png", fullPage: true });
  console.log("✓ Screenshot: mobile-discover.png");

  await browser.close();
  console.log("Done — screenshots saved to screenshots/");
}

main().catch((err) => {
  console.error("Playwright error:", err);
  process.exit(1);
});
