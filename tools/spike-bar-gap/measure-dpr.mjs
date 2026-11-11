// Spike: measures the gap between stacked segments at several device pixel ratios in a real browser.
// Usage: node tools/spike-bar-gap/measure-dpr.mjs   (needs packages/ag-charts-community/dist/umd built from the spike)
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const page_url = pathToFileURL(join(here, 'gap.html')).href;

const RATIOS = (process.env.RATIOS ?? '1,1.5,2').split(',').map(Number);
const GAPS = (process.env.GAPS ?? '0,1,2,3,4,5').split(',').map(Number);

const browser = await chromium.launch();
const results = [];
for (const deviceScaleFactor of RATIOS) {
    const context = await browser.newContext({ deviceScaleFactor, viewport: { width: 420, height: 420 } });
    for (const gap of GAPS) {
        const page = await context.newPage();
        page.on('pageerror', (e) => console.error('pageerror', e.message));
        await page.goto(`${page_url}?gap=${gap}`);
        await page.waitForFunction(() => window.chartReady === true);
        const out = await page.evaluate(() => {
            const canvas = [...document.querySelectorAll('#chart canvas')].find((c) => c.width > 0);
            const { width, height } = canvas;
            const { data } = canvas.getContext('2d').getImageData(0, 0, width, height);
            const px = (x, y) => {
                const i = (y * width + x) * 4;
                return [data[i], data[i + 1], data[i + 2], data[i + 3]];
            };
            const white = (p) => p[3] === 0 || (p[0] > 250 && p[1] > 250 && p[2] > 250);
            // The first bar: widest run of non-white pixels along a row near the bottom
            const row = Math.round(height * 0.9);
            let best = { start: 0, length: 0 };
            let cur;
            for (let x = 0; x < width; x++) {
                if (white(px(x, row))) {
                    cur = undefined;
                    continue;
                }
                if (!cur) {
                    cur = { start: x, length: 0 };
                }
                cur.length++;
                if (cur.length > best.length) best = cur;
            }
            const cx = Math.round(best.start + best.length / 2);
            const column = [];
            for (let y = 0; y < height; y++) column.push(px(cx, y));
            // Exact-colour runs
            const runs = [];
            let prev = '';
            for (let y = 0; y < height; y++) {
                const p = column[y];
                if (white(p)) {
                    prev = '';
                    continue;
                }
                const k = p.join(',');
                if (k === prev) runs[runs.length - 1][1]++;
                else runs.push([y, 1, k]);
                prev = k;
            }
            // Coverage-weighted: whiteness of every row between the first and last bar rows
            const wh = column.map((p) => (p[3] === 0 ? 1 : Math.min(p[0], p[1], p[2]) / 255));
            let first = wh.findIndex((w) => w < 1);
            let last = wh.length - 1;
            while (last > 0 && wh[last] >= 1) last--;
            let interior = 0;
            for (let y = first + 1; y < last; y++) interior += wh[y];
            return {
                canvas: [width, height],
                dpr: window.devicePixelRatio,
                column: cx,
                runs,
                top: first + wh[first],
                bottom: last + 1 - wh[last],
                interior,
            };
        });
        results.push({ deviceScaleFactor, gap, ...out });
        await page.close();
    }
    await context.close();
}
await browser.close();
for (const r of results) {
    const runs = r.runs.filter((x) => x[1] > 0);
    const gapsDev = [];
    for (let i = 1; i < runs.length; i++) gapsDev.push(runs[i][0] - (runs[i - 1][0] + runs[i - 1][1]));
    console.log(
        JSON.stringify({
            dpr: r.deviceScaleFactor,
            gapCss: r.gap,
            wantDevice: r.gap * r.deviceScaleFactor,
            canvas: r.canvas,
            runs: runs.map((x) => [x[0], x[1], x[2]]),
            gapsDevicePx: gapsDev,
            top: +r.top.toFixed(2),
            bottom: +r.bottom.toFixed(2),
            interiorWhite: +r.interior.toFixed(2),
        })
    );
}
