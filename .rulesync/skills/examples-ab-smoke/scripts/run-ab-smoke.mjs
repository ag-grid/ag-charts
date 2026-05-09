// A/B smoke-test runner — exercises every example in the matrix on each side
// and records per-phase outcomes. Compares two sides defined in sides.json.
//
// Inputs:
//   SIDES_FILE   (default: ./sides.json)   { left: SideConfig, right: SideConfig, framework: string }
//   MATRIX_FILE  (default: ./matrix.json)  output of discover.mjs (must match `framework`)
//   OUTPUT_DIR   (default: ./)
//   CONCURRENCY  (default: 4)
//
// Env overrides:
//   LEFT_BASE_URL, LEFT_NAME, RIGHT_BASE_URL, RIGHT_NAME, FRAMEWORK
//
// Side schema:
//   { name: string, baseUrl: string }
// One framework per run. Multi-framework coverage = multiple runs.

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const SCREENSHOT_ROOT = `${OUTPUT_DIR}/screenshots`;
const RESULTS_PATH = `${OUTPUT_DIR}/results.json`;
const SIDES_FILE = resolve(process.env.SIDES_FILE ?? `${OUTPUT_DIR}/sides.json`);
const MATRIX_FILE = resolve(process.env.MATRIX_FILE ?? `${OUTPUT_DIR}/matrix.json`);
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '4', 10);

mkdirSync(SCREENSHOT_ROOT, { recursive: true });

if (!existsSync(SIDES_FILE)) {
    console.error(`SIDES_FILE not found: ${SIDES_FILE}`);
    process.exit(2);
}
if (!existsSync(MATRIX_FILE)) {
    console.error(`MATRIX_FILE not found: ${MATRIX_FILE} (run discover.mjs first)`);
    process.exit(2);
}

const sidesRaw = JSON.parse(readFileSync(SIDES_FILE, 'utf8'));
const matrix = JSON.parse(readFileSync(MATRIX_FILE, 'utf8'));

function applySideEnv(side, prefix) {
    return {
        name: process.env[`${prefix}_NAME`] ?? side.name,
        baseUrl: process.env[`${prefix}_BASE_URL`] ?? side.baseUrl,
    };
}

const sides = {
    left: applySideEnv(sidesRaw.left, 'LEFT'),
    right: applySideEnv(sidesRaw.right, 'RIGHT'),
};
const framework = process.env.FRAMEWORK ?? sidesRaw.framework;

for (const [k, s] of Object.entries(sides)) {
    if (!s.baseUrl) {
        console.error(`Side ${k} is missing baseUrl`);
        process.exit(2);
    }
}
if (!framework) {
    console.error('framework missing — set sides.json `framework` or FRAMEWORK env var');
    process.exit(2);
}

const SELECTORS = {
    chartWrapper: '.ag-charts-wrapper',
    canvas: '.ag-charts-wrapper canvas',
    canvasCenter: '.ag-charts-canvas-center',
    legendItems: 'button[role="switch"].ag-charts-proxy-elem',
    tooltip: '.ag-charts-tooltip:not(.ag-charts-tooltip-hidden)',
    crosshairLabel: '.ag-charts-crosshair-label',
    exampleControlsButton: '.example-controls > button',
};

const LICENCE_BANNER_RE = /^\*+$|License Key Not Found|^For more information|trial|licen[sc]e/i;
const NOISE_RE = /Hotjar|Plausible|OneTrust|gtm|googletagmanager|Vite|React DevTools|Quirks Mode/i;

function isNoise(text) {
    return LICENCE_BANNER_RE.test(text) || NOISE_RE.test(text);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildUrl(side, entry) {
    if (entry.page === 'gallery') {
        return `${side.baseUrl}/gallery/examples/${entry.example}`;
    }
    return `${side.baseUrl}/${entry.framework}/${entry.page}/examples/${entry.example}`;
}

function slug(s) {
    return (s ?? 'unknown')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32);
}

function shouldSkipCanvasCheck(skipCanvasUpdateCheck, buttonLabel) {
    if (skipCanvasUpdateCheck === true) return true;
    if (Array.isArray(skipCanvasUpdateCheck)) return skipCanvasUpdateCheck.includes(buttonLabel);
    return false;
}

async function dismissCookieBanner(page) {
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
        const dismissed = await page
            .evaluate(() => {
                const candidates = [
                    '#onetrust-reject-all-handler',
                    '.ot-pc-refuse-all-handler',
                    '#onetrust-accept-btn-handler',
                    '.onetrust-close-btn-handler',
                ];
                for (const sel of candidates) {
                    const el = document.querySelector(sel);
                    if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                        el.click();
                        return sel;
                    }
                }
                return null;
            })
            .catch(() => null);
        if (dismissed) {
            await sleep(400);
            return dismissed;
        }
        await sleep(200);
    }
    return null;
}

async function waitForCanvas(page, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const ok = await page
            .evaluate((sel) => {
                const c = document.querySelector(sel);
                return !!c && c.width > 0 && c.height > 0;
            }, SELECTORS.canvas)
            .catch(() => false);
        if (ok) return true;
        await sleep(250);
    }
    return false;
}

async function getSceneRenders(page) {
    return page
        .evaluate((sel) => {
            const w = document.querySelector(sel);
            const v = w?.getAttribute('data-scene-renders');
            return v == null ? null : Number(v);
        }, SELECTORS.chartWrapper)
        .catch(() => null);
}

async function waitForSceneRenderBump(page, before, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const cur = await getSceneRenders(page);
        if (cur != null && before != null && cur > before) return cur;
        await sleep(100);
    }
    return null;
}

async function takeWrapperScreenshot(page, outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    const wrapper = await page.$(SELECTORS.chartWrapper);
    if (wrapper) {
        const box = await wrapper.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
            await page.screenshot({ path: outPath, clip: box });
            return true;
        }
    }
    await page.screenshot({ path: outPath, fullPage: false });
    return false;
}

function newPhase(name) {
    return { name, screenshots: [], exceptions: [], notes: [], data: {} };
}

function pushException(phase, type, evidence) {
    phase.exceptions.push({ type, ...evidence });
}

async function captureOne(browser, side, entry) {
    const url = buildUrl(side, entry);
    const sideKey = side.name;
    const result = {
        side: sideKey,
        page: entry.page,
        example: entry.example,
        framework: entry.framework,
        url,
        consoleErrors: [],
        consoleWarnings: [],
        pageErrors: [],
        canvasFound: false,
        legendItemCount: 0,
        phases: {},
        notes: [],
    };

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        if (isNoise(text)) return;
        if (type === 'error') result.consoleErrors.push(text);
        else if (type === 'warning' || type === 'warn') result.consoleWarnings.push(text);
    });
    page.on('pageerror', (err) => result.pageErrors.push(err.message));

    try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        if (resp && !resp.ok() && resp.status() !== 304) {
            result.notes.push(`HTTP ${resp.status()}`);
            const phase = newPhase('initial');
            pushException(phase, 'navigation-error', { httpStatus: resp.status() });
            result.phases.initial = phase;
            await context.close();
            return result;
        }
    } catch (err) {
        const phase = newPhase('initial');
        pushException(phase, 'navigation-error', { error: err.message });
        result.phases.initial = phase;
        await context.close();
        return result;
    }

    await dismissCookieBanner(page);

    const canvasReady = await waitForCanvas(page);
    result.canvasFound = canvasReady;
    await sleep(1500);

    // Phase: initial
    const initial = newPhase('initial');
    {
        const errBefore = result.consoleErrors.length + result.pageErrors.length;
        const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-initial.png`;
        try {
            await takeWrapperScreenshot(page, out);
            initial.screenshots.push({ phase: 'initial', path: out });
        } catch (err) {
            pushException(initial, 'screenshot-error', { error: err.message });
        }
        if (!canvasReady) pushException(initial, 'canvas-missing', { url });
        const errAfter = result.consoleErrors.length + result.pageErrors.length;
        if (errAfter > errBefore) {
            pushException(initial, 'console-error', {
                newConsoleErrors: result.consoleErrors.slice(errBefore),
            });
        }
        result.phases.initial = initial;
    }

    // Phase: controls — exercise example-controls > button
    const controls = newPhase('controls');
    try {
        let buttons = await page.locator(SELECTORS.exampleControlsButton).all();
        if (entry.options?.clickOrder === 'reverse') buttons = buttons.reverse();
        controls.data.buttonCount = buttons.length;

        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const label = (await btn.textContent().catch(() => null))?.trim() ?? `button-${i}`;
            const errBefore = result.consoleErrors.length + result.pageErrors.length;
            const before = await getSceneRenders(page);
            try {
                await btn.click({ timeout: 5000 });
            } catch (err) {
                pushException(controls, 'control-click-error', { buttonIndex: i, label, error: err.message });
                continue;
            }

            const skip = shouldSkipCanvasCheck(entry.options?.skipCanvasUpdateCheck, label);
            if (skip) {
                await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);
            } else {
                const after = await waitForSceneRenderBump(page, before);
                if (after == null) {
                    pushException(controls, 'control-no-render', {
                        buttonIndex: i,
                        label,
                        sceneRendersBefore: before,
                    });
                }
            }

            const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-control-${i}-${slug(label)}.png`;
            try {
                await takeWrapperScreenshot(page, out);
                controls.screenshots.push({ phase: 'controls', buttonIndex: i, label, path: out });
            } catch (err) {
                pushException(controls, 'screenshot-error', { buttonIndex: i, label, error: err.message });
            }
            const errAfter = result.consoleErrors.length + result.pageErrors.length;
            if (errAfter > errBefore) {
                pushException(controls, 'console-error', {
                    buttonIndex: i,
                    label,
                    newCount: errAfter - errBefore,
                });
            }
        }
    } catch (err) {
        pushException(controls, 'phase-error', { error: err.message });
    }
    result.phases.controls = controls;

    // Move mouse off-chart to clear hover state.
    await page.mouse.move(10, 10).catch(() => null);
    await sleep(300);

    const canvasBox = await (async () => {
        const c = await page.$(SELECTORS.chartWrapper);
        return c ? c.boundingBox() : null;
    })();

    // Phase: tooltip — keyboard-driven (mirrors triggerExampleTooltips), with mouse fallback.
    const tooltip = newPhase('tooltip');
    {
        const errBefore = result.consoleErrors.length + result.pageErrors.length;
        try {
            const focusTarget = page.locator(`${SELECTORS.chartWrapper} [tabindex="0"]`).first();
            if ((await focusTarget.count()) > 0) {
                await focusTarget.focus().catch(() => null);
                await page.keyboard.press('Tab').catch(() => null);
                await sleep(300);
                await page.keyboard.press('ArrowRight').catch(() => null);
                await sleep(700);
            }

            let tooltipVisible = (await page.locator(SELECTORS.tooltip).count()) > 0;

            if (!tooltipVisible && canvasBox) {
                const tx = canvasBox.x + canvasBox.width * 0.5;
                const ty = canvasBox.y + canvasBox.height * 0.5;
                await page.mouse.move(tx - 30, ty - 30);
                await sleep(120);
                await page.mouse.move(tx, ty, { steps: 10 });
                await sleep(900);
                tooltipVisible = (await page.locator(SELECTORS.tooltip).count()) > 0;
            }
            tooltip.data.tooltipVisible = tooltipVisible;
            tooltip.data.crosshairLabelVisible = (await page.locator(SELECTORS.crosshairLabel).count()) > 0;

            const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-tooltip.png`;
            await takeWrapperScreenshot(page, out);
            tooltip.screenshots.push({ phase: 'tooltip', path: out });
        } catch (err) {
            pushException(tooltip, 'phase-error', { error: err.message });
        }
        const errAfter = result.consoleErrors.length + result.pageErrors.length;
        if (errAfter > errBefore) pushException(tooltip, 'console-error', { newCount: errAfter - errBefore });
        result.phases.tooltip = tooltip;
    }

    await page.mouse.move(10, 10).catch(() => null);
    await sleep(300);

    const legendItems = await page.locator(SELECTORS.legendItems).all();
    result.legendItemCount = legendItems.length;
    const firstLegend = legendItems[0];

    // Phase: legend-hover
    const legendHover = newPhase('legend-hover');
    {
        const errBefore = result.consoleErrors.length + result.pageErrors.length;
        try {
            if (firstLegend) {
                await firstLegend.hover({ timeout: 3000 }).catch(() => null);
                await sleep(700);
                legendHover.data.legendItemTargeted = true;
            } else {
                legendHover.notes.push('no legend item');
            }
            const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-legend-hover.png`;
            await takeWrapperScreenshot(page, out);
            legendHover.screenshots.push({ phase: 'legend-hover', path: out });
        } catch (err) {
            pushException(legendHover, 'phase-error', { error: err.message });
        }
        const errAfter = result.consoleErrors.length + result.pageErrors.length;
        if (errAfter > errBefore) pushException(legendHover, 'console-error', { newCount: errAfter - errBefore });
        result.phases['legend-hover'] = legendHover;
    }

    await page.mouse.move(10, 10).catch(() => null);
    await sleep(300);

    // Phase: legend-toggle (click first proxy, screenshot, click again to restore).
    const legendToggle = newPhase('legend-toggle');
    {
        const errBefore = result.consoleErrors.length + result.pageErrors.length;
        try {
            if (firstLegend) {
                const beforeAria = await firstLegend.getAttribute('aria-checked').catch(() => null);
                await firstLegend.click({ timeout: 3000 }).catch(() => null);
                await sleep(700);
                const afterAria = await firstLegend.getAttribute('aria-checked').catch(() => null);
                legendToggle.data.toggleResult = { before: beforeAria, after: afterAria };
                if (beforeAria === afterAria) {
                    legendToggle.notes.push('aria-checked did not flip');
                }

                await page.mouse.move(10, 10).catch(() => null);
                await sleep(400);

                const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-legend-toggle.png`;
                await takeWrapperScreenshot(page, out);
                legendToggle.screenshots.push({ phase: 'legend-toggle', path: out });

                await firstLegend.click({ timeout: 3000 }).catch(() => null);
                await sleep(300);
            } else {
                legendToggle.notes.push('no legend item');
                const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-legend-toggle.png`;
                await takeWrapperScreenshot(page, out);
                legendToggle.screenshots.push({ phase: 'legend-toggle', path: out });
            }
        } catch (err) {
            pushException(legendToggle, 'phase-error', { error: err.message });
        }
        const errAfter = result.consoleErrors.length + result.pageErrors.length;
        if (errAfter > errBefore) pushException(legendToggle, 'console-error', { newCount: errAfter - errBefore });
        result.phases['legend-toggle'] = legendToggle;
    }

    await context.close();
    return result;
}

async function captureBoth(browser, entry) {
    const [left, right] = await Promise.all([
        captureOne(browser, sides.left, entry),
        captureOne(browser, sides.right, entry),
    ]);
    return {
        page: entry.page,
        example: entry.example,
        framework: entry.framework,
        left,
        right,
    };
}

async function runPool(items, fn) {
    const results = new Array(items.length);
    let next = 0;
    let done = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
        while (true) {
            const i = next++;
            if (i >= items.length) return;
            try {
                results[i] = await fn(items[i], i);
            } catch (err) {
                results[i] = {
                    page: items[i].page,
                    example: items[i].example,
                    framework: items[i].framework,
                    error: err.message,
                };
            }
            done++;
            const e = items[i];
            process.stderr.write(`   [${done}/${items.length}] ${e.page}/${e.example} (${e.framework})\n`);
        }
    });
    await Promise.all(workers);
    return results;
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const filtered = matrix.filter((e) => e.framework === framework);
    const dropped = matrix.length - filtered.length;
    process.stderr.write(
        `>> ${filtered.length} examples × 2 sides @ concurrency=${CONCURRENCY}\n` +
            `   framework=${framework}\n` +
            `   left=${sides.left.name} (${sides.left.baseUrl})\n` +
            `   right=${sides.right.name} (${sides.right.baseUrl})\n`
    );
    if (dropped > 0) {
        process.stderr.write(`   skipped ${dropped} matrix entries with a different framework\n`);
    }
    if (filtered.length === 0) {
        process.stderr.write(`   no matrix entries match framework=${framework}; re-run discover.mjs with --framework ${framework}\n`);
        await browser.close();
        process.exit(2);
    }
    const all = await runPool(filtered, async (entry) => captureBoth(browser, entry));
    await browser.close();
    writeFileSync(RESULTS_PATH, JSON.stringify({ sides, framework, results: all }, null, 2));
    console.log(`Wrote ${all.length} results to ${RESULTS_PATH}`);
})();
