import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:5173";

const SHOTS = [
  { name: "landing-desktop", viewport: { width: 1440, height: 900 } },
  { name: "landing-mobile", viewport: { width: 390, height: 844 } },
];

async function main() {
  const browser = await chromium.launch();
  for (const shot of SHOTS) {
    const ctx = await browser.newContext({
      viewport: shot.viewport,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const resp = await page.goto(BASE + "/", { waitUntil: "networkidle" });
    if (!resp || !resp.ok()) {
      throw new Error("non-OK response: " + (resp ? resp.status() : "none"));
    }
    // Give web fonts a moment to settle.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    const out = `/Users/braejan/workspace/witsaba/repositories/bandola_llanera/.impeccable/screenshots/${shot.name}.png`;
    await page.screenshot({ path: out, fullPage: false });
    console.log("wrote", out);
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
