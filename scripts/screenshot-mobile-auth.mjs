import { chromium } from "playwright";
import { createInterface } from "readline";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function ask(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (a) => { rl.close(); resolve(a); }));
}

async function main() {
  const email = await ask("Email: ");
  const password = await ask("Password: ");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 }).catch(() => {});
  console.log("Current URL after login:", page.url());

  // Go to leads page
  await page.goto(`${BASE}/dashboard/leads`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/mobile-leads.png", fullPage: true });
  console.log("✓ Screenshot: mobile-leads.png");

  // Check if there are lead detail links
  const leadLinks = await page.$$('a[href*="/dashboard/leads/"]');
  console.log(`Found ${leadLinks.length} lead links`);
  
  // If there's a lead, click the first one
  if (leadLinks.length > 0) {
    const href = await leadLinks[0].getAttribute("href");
    if (href) {
      await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
      await page.screenshot({ path: "screenshots/mobile-lead-detail.png", fullPage: true });
      console.log("✓ Screenshot: mobile-lead-detail.png");
    }
  }

  // Also screenshot the discover page
  await page.goto(`${BASE}/dashboard/discover`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/mobile-discover.png", fullPage: true });
  console.log("✓ Screenshot: mobile-discover.png");

  await browser.close();
  console.log("Done — screenshots saved to screenshots/");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
