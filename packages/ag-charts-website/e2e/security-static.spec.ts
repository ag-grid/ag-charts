import type { Page } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import { expect, test } from './fixture';
import { SELECTORS, setupIntrinsicAssertions, toPageUrl, waitForAllChartUpdates } from './util';

// Charts on a routed non-localhost origin, served with a real `Content-Security-Policy` header. `base` (no
// header) is the only mode with stored baselines; every other mode is compared with it pixel for pixel.

const ORIGIN = 'http://csp-repro.example';
const NONCE = 'c5f7a0d3b1e94a62';
const BRAND_BEFORE = '#d33b2b';
const BRAND_BEFORE_RGB = [211, 59, 43] as const;
const BRAND_AFTER = '#2b6cd3';
const BRAND_AFTER_RGB = [43, 108, 211] as const;

type ModeName = 'base' | 'nonce';

interface Mode {
    /** The `Content-Security-Policy` response header, or `undefined` for none. */
    csp: string | undefined;
    /** The `styleNonce` chart option. */
    styleNonce: string | undefined;
}

const policy = (styleSrc: string) =>
    `default-src 'self'; style-src ${styleSrc}; script-src 'self' 'nonce-${NONCE}'; img-src 'self' data:`;

const MODES: Record<ModeName, Mode> = {
    base: { csp: undefined, styleNonce: undefined },
    nonce: { csp: policy(`'self' 'nonce-${NONCE}'`), styleNonce: NONCE },
};

const MODE_NAMES = Object.keys(MODES) as ModeName[];

/** `style-src 'self'` exactly: nothing a chart injects is allowed. */
const STRICT_CSP = policy(`'self'`);

// The bundles are proxied through the routed origin: a browser on a public origin may not fetch a local
// address itself, so Playwright fetches them from the dev server instead.
const BUNDLES: Record<string, string> = {
    '/ag-charts-community.js': toPageUrl('dev/ag-charts-community/dist/umd/ag-charts-community.js'),
    '/ag-charts-enterprise.js': toPageUrl('dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js'),
};

// Sized from a same-origin stylesheet: a `style="…"` attribute is itself a `style-src` violation.
const PAGE_CSS = `
html, body { margin: 0; padding: 0; background: #fff; }
#myChart { width: 600px; height: 400px; }
`;

// Runs from `script-src 'self'`. The chart options arrive JSON-encoded in the query string; `--brand` is set
// through CSSOM, which `style-src` does not restrict.
const PAGE_SCRIPT = `
document.documentElement.style.setProperty('--brand', '${BRAND_BEFORE}');
const encoded = new URLSearchParams(location.search).get('options');
if (encoded != null) {
    agCharts.AgCharts.create({ ...JSON.parse(encoded), container: document.getElementById('myChart') });
}
`;

function pageHtml(enterprise: boolean) {
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>CSP routed page</title>
        <link rel="stylesheet" href="/page.css" />
    </head>
    <body>
        <div id="myChart"></div>
        <script src="/ag-charts-community.js"></script>
        ${enterprise ? '<script src="/ag-charts-enterprise.js"></script>' : ''}
        <script src="/page.js"></script>
    </body>
</html>`;
}

const CHART = '#myChart';
const BAR_DATA = [
    { month: 'Jan', sales: 162000 },
    { month: 'Feb', sales: 230000 },
    { month: 'Mar', sales: 302000 },
    { month: 'Apr', sales: 450000 },
    { month: 'May', sales: 800000 },
];
const BAR_SERIES = [{ type: 'bar', xKey: 'month', yKey: 'sales', yName: 'Sales' }];
const MENU_ICON_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.5"><path d="M12 17V3m-6 8 6 6 6-6M19 21H5"/></svg>'
)}`;
const LINE_DATA = Array.from({ length: 30 }, (_, i) => ({ age: 15 + i, hours: 40 + ((i * 7) % 23) }));

type Theme = 'ag-default' | 'ag-default-dark';
const THEMES: Theme[] = ['ag-default', 'ag-default-dark'];

/** A row of the visual case matrix. */
interface Row {
    name: string;
    enterprise: boolean;
    options: Record<string, unknown>;
    /** Drives the chart into the state under test, then asserts what must hold in every mode. */
    arrange: (page: Page) => Promise<void>;
}

const ROWS: Row[] = [
    {
        name: 'tooltip',
        enterprise: false,
        options: { data: BAR_DATA, series: BAR_SERIES },
        async arrange(page) {
            await page.keyboard.press('Tab');
            await waitForAllChartUpdates(page);
            await expect(page.locator(SELECTORS.tooltip)).toHaveCount(1);
            await expect(page.locator(SELECTORS.tooltip)).toContainText('Jan');
        },
    },
    {
        name: 'toolbar',
        enterprise: true,
        options: {
            data: LINE_DATA,
            series: [{ type: 'line', xKey: 'age', yKey: 'hours' }],
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            zoom: { enabled: true, buttons: { visible: 'always' } },
            ranges: {
                enabled: true,
                buttons: [
                    { label: 'Early', value: [15, 25] },
                    { label: 'Late', value: [35, 44] },
                    { label: 'All', value: undefined },
                ],
            },
        },
        async arrange(page) {
            await expect(page.locator('.ag-charts-toolbar__icon').first()).toBeVisible();
            // Every toolbar button shares the one `:hover` rule, so hovering one puts the hover colours in the image.
            await page.locator('.ag-charts-toolbar__button', { hasText: 'Early' }).hover();
            await waitForAllChartUpdates(page);
        },
    },
    {
        name: 'context-menu',
        enterprise: true,
        options: {
            data: BAR_DATA,
            series: BAR_SERIES,
            zoom: { enabled: true },
            contextMenu: { enabled: true, items: [{ label: 'Export', iconUrl: MENU_ICON_URL }, 'defaults'] },
        },
        async arrange(page) {
            await page.locator(SELECTORS.canvasCenter).click({ button: 'right' });
            await expect(page.locator('.ag-charts-context-menu')).toBeVisible();
            await expect(page.locator('.ag-charts-context-menu__item').first()).toBeVisible();
            await expect(page.locator('.ag-charts-context-menu img').first()).toBeVisible();
        },
    },
    {
        name: 'loading-overlay',
        enterprise: false,
        options: { loading: true, series: BAR_SERIES },
        async arrange(page) {
            await expect(page.locator('.ag-charts-overlay--loading')).toBeVisible();
            // The spinner's keyframes must reach the page, or the matrix would not animate.
            await expect.poll(() => runningAnimationNames(page)).toContain('ag-charts-loading-matrix');
        },
    },
];

/** A bar chart whose fill follows `--brand`, with the animation off so a repaint is a single frame. */
const CSS_VARIABLE_OPTIONS = {
    animation: { enabled: false },
    legend: { enabled: false },
    data: BAR_DATA,
    series: [{ type: 'bar', xKey: 'month', yKey: 'sales', fill: 'var(--brand)', stroke: 'var(--brand)' }],
};

const CSS_VARIABLE_ROW: Row = {
    name: 'css-variable',
    enterprise: false,
    options: CSS_VARIABLE_OPTIONS,
    async arrange(page) {
        expect(await firstBarCentre(page, BRAND_BEFORE_RGB), 'first bar in the initial colour').toBeDefined();
        await setBrand(page, BRAND_AFTER);
        await expect.poll(() => firstBarCentre(page, BRAND_AFTER_RGB), { message: 'bar repainted' }).toBeDefined();
    },
};

function withTheme(options: Record<string, unknown>, theme: Theme, mode: Mode) {
    return { theme, ...(mode.styleNonce == null ? {} : { styleNonce: mode.styleNonce }), ...options };
}

async function runningAnimationNames(page: Page): Promise<string[]> {
    return page.evaluate(() =>
        document
            .getAnimations()
            .map((a) => (a as CSSAnimation).animationName)
            .filter((n) => n != null)
    );
}

/** Serves the routed page. The CSP header is chosen by the request's `csp` query parameter. */
async function routeOrigin(page: Page) {
    await page.route(`${ORIGIN}/**`, async (route) => {
        const url = new URL(route.request().url());
        const csp = url.searchParams.get('csp') ?? undefined;
        const headers: Record<string, string> = csp == null ? {} : { 'Content-Security-Policy': csp };

        const bundle = BUNDLES[url.pathname];
        if (bundle != null) {
            const response = await page.request.get(bundle);
            return route.fulfill({ contentType: 'text/javascript', headers, body: await response.body() });
        }
        switch (url.pathname) {
            case '/page.css':
                return route.fulfill({ contentType: 'text/css', headers, body: PAGE_CSS });
            case '/page.js':
                return route.fulfill({ contentType: 'text/javascript', headers, body: PAGE_SCRIPT });
            default:
                return route.fulfill({
                    contentType: 'text/html',
                    headers,
                    body: pageHtml(url.searchParams.get('enterprise') === '1'),
                });
        }
    });
}

interface RenderOptions {
    mode: Mode;
    enterprise: boolean;
    /** The chart options; omit to load the page with no chart. */
    options?: Record<string, unknown>;
    csp?: string;
}

async function render(page: Page, { mode, enterprise, options, csp = mode.csp }: RenderOptions) {
    const query = new URLSearchParams();
    if (csp != null) query.set('csp', csp);
    if (enterprise) query.set('enterprise', '1');
    if (options != null) query.set('options', JSON.stringify(options));

    const response = await page.goto(`${ORIGIN}/?${query.toString()}`);
    // Without this, a route that stopped sending the header would turn every policy mode into Base unnoticed.
    expect(response?.headers()['content-security-policy'], 'policy enforced on the page').toBe(csp);
    if (options != null) {
        await expect(page.locator(`${CHART} canvas`).first()).toBeVisible();
        await waitForAllChartUpdates(page);
    }
}

async function violations(page: Page): Promise<string[]> {
    return page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations);
}

/** Every `<style>` element in the document must carry the page's nonce. */
async function expectNonceOnInjectedStyles(page: Page) {
    const nonces = await page.evaluate(() => Array.from(document.querySelectorAll('style'), (el) => el.nonce));
    expect(nonces.length).toBeGreaterThan(0);
    // Read the IDL property, not the attribute: browsers empty the `nonce` content attribute once inserted.
    expect(nonces.filter((n) => n !== NONCE)).toEqual([]);
}

/** Lets a licence watermark play out, so that it is gone before pixels are taken. */
async function settleWatermark(page: Page) {
    await page.evaluate(() => {
        for (const el of document.querySelectorAll('.ag-watermark')) {
            el.getAnimations().forEach((a) => a.finish());
        }
    });
    await expect(page.locator('.ag-watermark')).toHaveCount(0);
}

function decode(buffer: Buffer) {
    return PNG.sync.read(buffer);
}

/** Fails on any differing pixel, anti-aliased ones included: a missing font or border moves exactly those. */
function expectPixelIdentical(actual: Buffer, reference: Buffer, label: string) {
    const a = decode(reference);
    const b = decode(actual);
    expect({ label, width: b.width, height: b.height }).toEqual({ label, width: a.width, height: a.height });

    // A chart that failed to render would be uniform in both modes and compare equal.
    expect(
        new Set(Array.from({ length: a.width * a.height }, (_, i) => a.data.readUInt32LE(i * 4))).size
    ).toBeGreaterThan(1);

    const differing = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0, includeAA: true });
    expect(differing, `${label}: pixels differing from Base`).toBe(0);
}

const SCREENSHOT = { animations: 'disabled' } as const;

/** Renders the row in Base and in Nonce mode, stores only Base as a baseline and requires Nonce to match it. */
async function compareModesWithBase(page: Page, row: Row, theme: Theme) {
    async function capture(modeName: ModeName) {
        const mode = MODES[modeName];
        await render(page, { mode, enterprise: row.enterprise, options: withTheme(row.options, theme, mode) });
        await row.arrange(page);
        if (row.enterprise) await settleWatermark(page);

        const chart = page.locator(CHART);
        if (modeName === 'base') {
            await expect(chart).toHaveScreenshot(`${row.name}-${theme}.png`);
        } else {
            await expectNonceOnInjectedStyles(page);
        }
        const buffer = await chart.screenshot(SCREENSHOT);
        expect(await violations(page), `${modeName} CSP violations`).toEqual([]);
        return buffer;
    }

    const base = await capture('base');
    const nonce = await capture('nonce');
    expectPixelIdentical(nonce, base, `${row.name} (${theme}) in nonce mode`);
}

async function setBrand(page: Page, value: string) {
    await page.evaluate((v) => document.documentElement.style.setProperty('--brand', v), value);
    await waitForAllChartUpdates(page);
}

/** The centre, in device pixels, of the left-most region of `rgb` on the chart's canvas. */
async function firstBarCentre(page: Page, rgb: readonly number[]) {
    return page.evaluate(
        ({ target, tolerance }) => {
            const canvas = document.querySelector('canvas')!;
            const { width, height } = canvas;
            const { data } = canvas.getContext('2d')!.getImageData(0, 0, width, height);
            const near = (x: number, y: number) => {
                const i = (y * width + x) * 4;
                return target.every((c, k) => Math.abs(data[i + k] - c) <= tolerance);
            };
            const columns: number[] = [];
            for (let x = 0; x < width; x++) {
                let any = false;
                for (let y = 0; y < height && !any; y++) any = near(x, y);
                if (any) columns.push(x);
                else if (columns.length > 0) break;
            }
            if (columns.length === 0) return undefined;
            const [x0, x1] = [columns[0], columns[columns.length - 1]];
            let [y0, y1] = [height, -1];
            for (let y = 0; y < height; y++) {
                for (let x = x0; x <= x1; x++) {
                    if (near(x, y)) {
                        y0 = Math.min(y0, y);
                        y1 = Math.max(y1, y);
                    }
                }
            }
            return { x: Math.round((x0 + x1) / 2), y: Math.round((y0 + y1) / 2) };
        },
        { target: [...rgb], tolerance: 2 }
    );
}

async function pixelAt(page: Page, point: { x: number; y: number }) {
    return page.evaluate(({ x, y }) => {
        const canvas = document.querySelector('canvas')!;
        return Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data.slice(0, 3));
    }, point);
}

/** Registered before any page script, so a violation during the first parse is still seen. */
function setupRoutedOrigin() {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            const seen: string[] = [];
            (window as unknown as { __cspViolations: string[] }).__cspViolations = seen;
            document.addEventListener('securitypolicyviolation', (e) => {
                seen.push(`${e.violatedDirective} ${e.blockedURI} ${e.sample}`.trim());
            });
        });
        await routeOrigin(page);
    });
}

test.describe('security: routed origin', () => {
    setupIntrinsicAssertions(test);
    setupRoutedOrigin();

    test.describe('visual cases: nonce matches Base', () => {
        for (const theme of THEMES) {
            for (const row of ROWS) {
                test(`${row.name} (${theme})`, async ({ page, browserName }) => {
                    test.skip(browserName !== 'chromium', 'Screenshots run in Chromium only');
                    await compareModesWithBase(page, row, theme);
                });
            }
        }
    });

    test.describe('licence watermark', () => {
        for (const modeName of MODE_NAMES) {
            test(`displays in ${modeName} mode`, async ({ page, browserName }) => {
                test.skip(browserName !== 'chromium', 'Chromium only: outside it the spec runs the repaint cases');
                const mode = MODES[modeName];
                await render(page, {
                    mode,
                    enterprise: true,
                    options: withTheme({ data: BAR_DATA, series: BAR_SERIES }, 'ag-default', mode),
                });

                // No screenshot: animations fast-forward in one, ending the fade and removing the watermark.
                const watermark = page.locator('.ag-watermark');
                await expect(watermark).toBeVisible();
                const style = await watermark.evaluate((el) => {
                    const own = getComputedStyle(el);
                    const logo = getComputedStyle(el, '::before');
                    return {
                        position: own.position,
                        bottom: own.bottom,
                        right: own.right,
                        fontFamily: own.fontFamily,
                        logo: logo.backgroundImage,
                        animations: el.getAnimations().map((a) => (a as CSSAnimation).animationName),
                    };
                });
                expect(style.position).toBe('absolute');
                expect(style.bottom).toBe('20px');
                expect(style.right).toBe('25px');
                expect(style.fontFamily).toContain('Impact');
                expect(style.logo).toContain('data:image/svg+xml');
                expect(style.animations).toContain('ag-watermark-fadeout');

                // Removed from the DOM once its fade-out ends.
                await settleWatermark(page);
                expect(await violations(page)).toEqual([]);
            });
        }
    });

    test.describe('CSS-variable colour', () => {
        for (const modeName of MODE_NAMES) {
            // Reads the canvas, not a screenshot, so that it also runs in Firefox and WebKit.
            test(`repaints when --brand changes in ${modeName} mode`, async ({ page }) => {
                const mode = MODES[modeName];
                await render(page, {
                    mode,
                    enterprise: false,
                    options: withTheme(CSS_VARIABLE_OPTIONS, 'ag-default', mode),
                });

                const before = await firstBarCentre(page, BRAND_BEFORE_RGB);
                expect(before, 'first bar in the initial colour').toBeDefined();
                await setBrand(page, BRAND_AFTER);

                await expect
                    .poll(
                        async () => {
                            const pixel = await pixelAt(page, before!);
                            return pixel.every((c, k) => Math.abs(c - BRAND_AFTER_RGB[k]) <= 2);
                        },
                        { message: 'first bar repaints in the new colour' }
                    )
                    .toBe(true);

                // A registered `<color>` property resolves to rgb(); an unregistered one returns the hex text.
                const registered = await page.evaluate(() =>
                    getComputedStyle(document.getElementById('myChart')!).getPropertyValue('--brand').trim()
                );
                expect(registered).toBe(`rgb(${BRAND_AFTER_RGB.join(', ')})`);

                expect(await violations(page)).toEqual([]);
            });
        }

        test('looks the same in nonce mode as in Base', async ({ page, browserName }) => {
            test.skip(browserName !== 'chromium', 'Screenshots run in Chromium only');
            await compareModesWithBase(page, CSS_VARIABLE_ROW, 'ag-default');
        });
    });

    test.describe('without an injecting chart', () => {
        test('Playwright screenshots add no style element and trigger no violation under style-src self', async ({
            page,
            browserName,
        }) => {
            test.skip(browserName !== 'chromium', 'Screenshots run in Chromium only');

            await page.addInitScript(() => {
                const added: string[] = [];
                (window as unknown as { __addedStyles: string[] }).__addedStyles = added;
                new MutationObserver((records) => {
                    for (const r of records) {
                        for (const n of r.addedNodes) {
                            if (n instanceof Element && n.localName === 'style') added.push(n.outerHTML);
                        }
                    }
                }).observe(document, { childList: true, subtree: true });
            });
            await render(page, { mode: MODES.base, enterprise: false, csp: STRICT_CSP });

            await page.locator(CHART).screenshot(SCREENSHOT);
            await page.screenshot(SCREENSHOT);

            expect(await violations(page)).toEqual([]);
            expect(await page.evaluate(() => (window as unknown as { __addedStyles: string[] }).__addedStyles)).toEqual(
                []
            );
        });
    });

    test('nonce mode: every injected style carries the nonce and nothing is blocked', async ({ page }) => {
        // Runs in every browser: no screenshot, only the policy and the nonce.
        const mode = MODES.nonce;
        await render(page, {
            mode,
            enterprise: false,
            options: withTheme({ data: BAR_DATA, series: BAR_SERIES }, 'ag-default', mode),
        });
        await expectNonceOnInjectedStyles(page);
        expect(await violations(page)).toEqual([]);
    });
});

// Positive control: a blocked `<style>` must reach the listener, or every "no violations" assertion proves nothing.
test.describe('security: routed origin policy is enforced', () => {
    setupIntrinsicAssertions(test, {
        ignoreConsolePatterns: ['violates the following Content Security Policy directive'],
    });
    setupRoutedOrigin();

    test('an un-nonced style element is reported as a style-src-elem violation', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'The ignored console wording is Chromium-specific');
        await render(page, { mode: MODES.base, enterprise: false, csp: STRICT_CSP });

        await page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = 'body { margin: 1px; }';
            document.head.appendChild(style);
        });

        await expect.poll(() => violations(page)).toEqual([expect.stringContaining('style-src-elem')]);
    });
});
