// Usage: node tools/glow-spike/capture.mjs <outDir> [case,case,...]
// Takes a neutral and a hovered screenshot of each case in headless Chrome (Playwright's Chromium).
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const outDir = path.resolve(process.argv[2] ?? 'glow-spike-out');
const only = process.argv[3]?.split(',');
mkdirSync(outDir, { recursive: true });
const page = path.resolve(import.meta.dirname, 'index.html');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 560, height: 400 }, deviceScaleFactor: 2 });
const tab = await ctx.newPage();
tab.on(
    'console',
    (m) =>
        ['error', 'warning', 'log'].includes(m.type()) &&
        !m.text().includes('*') &&
        console.log(`[${m.type()}]`, m.text())
);
tab.on('pageerror', (e) => console.log('[pageerror]', e.message));
await tab.goto(`${pathToFileURL(page).href}?case=${only?.[0] ?? ''}`);
await tab.waitForFunction('window.ready');
const names = await tab.evaluate(() => Object.keys(window.CASES));
for (const name of names.filter((n) => only == null || only.includes(n))) {
    await tab.goto(`${pathToFileURL(page).href}?case=${name}`);
    await tab.waitForFunction('window.ready');
    const hover = await tab.evaluate((n) => window.CASES[n].hover, name);
    await tab.waitForTimeout(400);
    const el = tab.locator('.cell');
    await tab.mouse.move(0, 0);
    await tab.waitForTimeout(200);
    await el.screenshot({ path: path.join(outDir, `${name}--neutral.png`) });
    if (hover != null) {
        const box = await tab.locator('.chart').boundingBox();
        await tab.mouse.move(box.x + hover[0], box.y + hover[1], { steps: 4 });
        await tab.waitForTimeout(400);
        await el.screenshot({ path: path.join(outDir, `${name}--hover.png`) });
    }
    console.log('captured', name);
}
await browser.close();
