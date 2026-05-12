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
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Without this, stderr writes buffer when the runner is launched with `> log 2>&1`;
// progress lines lag by minutes, which makes a healthy run look wedged.
process.stderr._handle?.setBlocking?.(true);
process.stdout._handle?.setBlocking?.(true);

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR ?? '.');
const SCREENSHOT_ROOT = `${OUTPUT_DIR}/screenshots`;
const RESULTS_PATH = `${OUTPUT_DIR}/results.json`;
const SIDES_FILE = resolve(process.env.SIDES_FILE ?? `${OUTPUT_DIR}/sides.json`);
const MATRIX_FILE = resolve(process.env.MATRIX_FILE ?? `${OUTPUT_DIR}/matrix.json`);
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '4', 10);
// When set, restrict the run to (page, example, framework) tuples that had any
// exception or non-zero pixel diff in the existing results.json, then merge
// fresh results back in place. Use this to iterate on harness/example fixes
// without re-running the full ~30-minute sweep.
const RERUN_EXCEPTIONS = process.env.RERUN_EXCEPTIONS === '1';

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
    // The tooltip element is long-lived (HTML Popover API: popover='manual'),
    // so presence in the DOM is not a visibility signal — use isTooltipShowing().
    tooltip: '.ag-charts-tooltip',
    crosshairLabel: '.ag-charts-crosshair-label',
    // The deployed site nests buttons under a .controls-row wrapper inside
    // .example-controls; the local dev server used by the upstream e2e tests
    // does not, hence the more permissive descendant combinator here.
    exampleControlsButton: '.example-controls button',
};

// Mirrors setupIntrinsicAssertions() in packages/ag-charts-website/e2e/util.ts:
//   - License banner lines start with '*'
//   - Quirks Mode warning
//   - favicon 404s
//   - Vite HMR / React DevTools hello banners
//   - Third-party analytics and consent scripts
const NOISE_RE = /Hotjar|Plausible|OneTrust|gtm|googletagmanager|^\[vite\]|React DevTools|Quirks Mode/i;

function isNoise(text, location) {
    if (typeof text === 'string' && text.startsWith('*')) return true;
    if (location?.url?.includes('/favicon.ico')) return true;
    return NOISE_RE.test(text);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildUrl(side, entry) {
    return `${exampleUrl(side, entry)}#e2e=true`;
}

function exampleUrl(side, entry) {
    return entry.page === 'gallery'
        ? `${side.baseUrl}/gallery/examples/${entry.example}`
        : `${side.baseUrl}/${entry.framework}/${entry.page}/examples/${entry.example}`;
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

// Mirrors waitForCharts/waitForChartUpdate in packages/ag-charts-website/e2e/{fixture,util}.ts:
// rAF→setTimeout(0) flush so DOMElementProxy's deferred mutations land, then
// poll for data-update-pending=false and data-animating=false on every wrapper.
// Returns { settled: boolean, reason?: 'no-wrappers' | 'update-pending' | 'animating', timedOutMs?: number }.
// On settle we also wait two more rAFs so the final animation frame is painted
// before the caller screenshots — without this we sometimes capture the
// penultimate frame because data-animating flips to "false" between the last
// rAF tick and the actual paint commit.
async function waitForCharts(page, timeoutMs = 10000) {
    await page
        .evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))))
        .catch(() => null);
    const deadline = Date.now() + timeoutMs;
    let lastReason = 'no-wrappers';
    while (Date.now() < deadline) {
        const status = await page
            .evaluate((sel) => {
                const wrappers = document.querySelectorAll(sel);
                if (wrappers.length === 0) return { ready: false, reason: 'no-wrappers' };
                for (const w of wrappers) {
                    if (w.getAttribute('data-update-pending') !== 'false') return { ready: false, reason: 'update-pending' };
                    if (w.getAttribute('data-animating') !== 'false') return { ready: false, reason: 'animating' };
                }
                return { ready: true };
            }, SELECTORS.chartWrapper)
            .catch(() => ({ ready: false, reason: 'eval-error' }));
        if (status.ready) {
            // Allow the just-finished frame to flush to screen.
            await page
                .evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
                .catch(() => null);
            return { settled: true };
        }
        lastReason = status.reason;
        await sleep(80);
    }
    return { settled: false, reason: lastReason, timedOutMs: timeoutMs };
}

async function isTooltipShowing(page) {
    return page
        .evaluate(() => {
            const t = document.querySelector('.ag-charts-tooltip');
            if (!t) return false;
            if (typeof t.matches === 'function' && t.matches(':popover-open')) return true;
            const r = t.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        })
        .catch(() => false);
}

async function countWrappers(page) {
    return page
        .evaluate((sel) => document.querySelectorAll(sel).length, SELECTORS.chartWrapper)
        .catch(() => 0);
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

// Wait for chart stability and, if the wait times out, push a
// `chart-not-settled` exception onto the supplied phase so the screenshot
// that follows is flagged as a potentially-mid-animation capture rather
// than treated as ground truth.
async function settleForScreenshot(page, phase, label, timeoutMs = 12000) {
    const result = await waitForCharts(page, timeoutMs);
    if (!result.settled) {
        pushException(phase, 'chart-not-settled', {
            reason: result.reason ?? 'unknown',
            timedOutMs: result.timedOutMs ?? timeoutMs,
            ...(label ? { label } : {}),
        });
    }
    return result.settled;
}

async function takeWrapperScreenshot(page, outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    // The chart canvas can be larger than its `.ag-charts-wrapper` parent on
    // gallery iframe pages (wrapper height is constrained by CSS, canvas is
    // sized to the chart's intrinsic dims). Screenshotting the wrapper would
    // crop the chart vertically. Compute a clip that unions the wrapper and
    // canvas bounding boxes, falling back to the wrapper element shot if the
    // probe fails.
    const wrapper = page.locator(SELECTORS.chartWrapper).first();
    const clip = await page
        .evaluate((sel) => {
            const w = document.querySelector(sel);
            if (!w) return null;
            const c = w.querySelector('canvas');
            const wr = w.getBoundingClientRect();
            const cr = c?.getBoundingClientRect();
            const x1 = Math.min(wr.left, cr?.left ?? wr.left);
            const y1 = Math.min(wr.top, cr?.top ?? wr.top);
            const x2 = Math.max(wr.right, cr?.right ?? wr.right);
            const y2 = Math.max(wr.bottom, cr?.bottom ?? wr.bottom);
            return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
        }, SELECTORS.chartWrapper)
        .catch(() => null);

    if (clip && clip.width > 0 && clip.height > 0) {
        try {
            // Resize viewport so the chart fits without page-level scroll, then
            // clip to the union region. page.screenshot honours clip but caps
            // at the viewport bottom — hence the resize.
            const orig = page.viewportSize() ?? { width: 1280, height: 800 };
            const vh = Math.max(orig.height, Math.ceil(clip.y + clip.height) + 16);
            const vw = Math.max(orig.width, Math.ceil(clip.x + clip.width) + 16);
            if (vh !== orig.height || vw !== orig.width) {
                await page.setViewportSize({ width: vw, height: vh }).catch(() => null);
            }
            await page.screenshot({
                path: outPath,
                clip: { x: Math.max(0, clip.x), y: Math.max(0, clip.y), width: clip.width, height: clip.height },
                timeout: 15000,
            });
            if (vh !== orig.height || vw !== orig.width) {
                await page.setViewportSize(orig).catch(() => null);
            }
            return true;
        } catch {
            // fall through to wrapper-locator shot
        }
    }
    try {
        await wrapper.screenshot({ path: outPath, timeout: 15000 });
        return true;
    } catch {
        await page.screenshot({ path: outPath, fullPage: false }).catch(() => null);
        return false;
    }
}

function newPhase(name) {
    return { name, screenshots: [], exceptions: [], notes: [], data: {} };
}

function pushException(phase, type, evidence) {
    phase.exceptions.push({ type, ...evidence });
}

function snapshotErrorCounts(result) {
    return { console: result.consoleErrors.length, page: result.pageErrors.length };
}

function pushErrorExceptionsSince(phase, result, before) {
    if (result.consoleErrors.length > before.console) {
        pushException(phase, 'console-error', {
            newConsoleErrors: result.consoleErrors.slice(before.console),
            newCount: result.consoleErrors.length - before.console,
        });
    }
    if (result.pageErrors.length > before.page) {
        pushException(phase, 'page-error', {
            newPageErrors: result.pageErrors.slice(before.page),
            newCount: result.pageErrors.length - before.page,
        });
    }
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
        const location = msg.location?.();
        if (isNoise(text, location)) return;
        if (type === 'error') result.consoleErrors.push(text);
        else if (type === 'warning' || type === 'warn') result.consoleWarnings.push(text);
    });
    page.on('pageerror', (err) => result.pageErrors.push(err.message));

    // Sample baseline before navigation so the initial phase covers errors
    // emitted during page load, cookie dismissal, and chart settling.
    const initialErrBefore = snapshotErrorCounts(result);

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
    await waitForCharts(page);

    // Multi-chart pages can't be driven by the generic fixture — mirrors
    // examples-util.ts:165 (`if (canvases.length > 1) return`). We capture
    // the initial wrapper screenshot for the A/B diff and skip the
    // controls/tooltip/legend phases. Without this, page.screenshot times
    // out at 30s on the multiple-* gallery examples.
    const wrapperCount = await countWrappers(page);
    result.wrapperCount = wrapperCount;
    if (wrapperCount > 1) {
        const initial = newPhase('initial');
        const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-initial.png`;
        try {
            await page.screenshot({ path: out, fullPage: false, timeout: 10000 });
            initial.screenshots.push({ phase: 'initial', path: out });
        } catch (err) {
            pushException(initial, 'screenshot-error', { error: err.message });
        }
        initial.notes.push(`multi-canvas-skipped (${wrapperCount} wrappers)`);
        result.phases.initial = initial;
        result.notes.push('multi-canvas');
        await context.close();
        return result;
    }

    // Phase: initial
    const initial = newPhase('initial');
    {
        // Initial-load animations can take longer than steady-state updates;
        // give them extra headroom before flagging.
        await settleForScreenshot(page, initial, null, 15000);
        const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-initial.png`;
        try {
            await takeWrapperScreenshot(page, out);
            initial.screenshots.push({ phase: 'initial', path: out });
        } catch (err) {
            pushException(initial, 'screenshot-error', { error: err.message });
        }
        if (!canvasReady) pushException(initial, 'canvas-missing', { url });
        pushErrorExceptionsSince(initial, result, initialErrBefore);
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
            const errBefore = snapshotErrorCounts(result);
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
            await settleForScreenshot(page, controls, label);

            const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-control-${i}-${slug(label)}.png`;
            try {
                await takeWrapperScreenshot(page, out);
                controls.screenshots.push({ phase: 'controls', buttonIndex: i, label, path: out });
            } catch (err) {
                pushException(controls, 'screenshot-error', { buttonIndex: i, label, error: err.message });
            }
            pushErrorExceptionsSince(controls, result, errBefore);
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
        const errBefore = snapshotErrorCounts(result);
        try {
            // Mirror triggerExampleTooltips() in examples-util.ts: each step is gated on
            // the previous one not having opened the tooltip, so we don't accidentally
            // close a freshly-opened popover by Tabbing focus elsewhere.
            const focusTarget = page.locator(`${SELECTORS.chartWrapper} [tabindex="0"]`).first();
            let tooltipVisible = false;
            let trigger = 'none';
            if ((await focusTarget.count()) > 0) {
                await focusTarget.focus().catch(() => null);
                await waitForCharts(page);
                tooltipVisible = await isTooltipShowing(page);
                if (tooltipVisible) trigger = 'focus';

                if (!tooltipVisible) {
                    await page.keyboard.press('Tab').catch(() => null);
                    await waitForCharts(page);
                    tooltipVisible = await isTooltipShowing(page);
                    if (tooltipVisible) trigger = 'tab';
                }

                if (!tooltipVisible) {
                    await page.keyboard.press('ArrowRight').catch(() => null);
                    await waitForCharts(page);
                    tooltipVisible = await isTooltipShowing(page);
                    if (tooltipVisible) trigger = 'arrow-right';
                }
            }

            if (!tooltipVisible && canvasBox) {
                const tx = canvasBox.x + canvasBox.width * 0.5;
                const ty = canvasBox.y + canvasBox.height * 0.5;
                await page.mouse.move(tx - 30, ty - 30);
                await sleep(120);
                await page.mouse.move(tx, ty, { steps: 10 });
                await waitForCharts(page);
                tooltipVisible = await isTooltipShowing(page);
                if (tooltipVisible) trigger = 'hover';
            }
            tooltip.data.tooltipVisible = tooltipVisible;
            tooltip.data.tooltipTrigger = trigger;
            tooltip.data.crosshairLabelVisible = (await page.locator(SELECTORS.crosshairLabel).count()) > 0;

            await settleForScreenshot(page, tooltip);
            const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-tooltip.png`;
            await takeWrapperScreenshot(page, out);
            tooltip.screenshots.push({ phase: 'tooltip', path: out });
        } catch (err) {
            pushException(tooltip, 'phase-error', { error: err.message });
        }
        pushErrorExceptionsSince(tooltip, result, errBefore);
        result.phases.tooltip = tooltip;
    }

    // The tooltip phase typically left the popover open (focus-triggered). Blur
    // and move the pointer well away so subsequent legend phases don't capture
    // the tooltip in their screenshots.
    await page
        .evaluate(() => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            const t = document.querySelector('.ag-charts-tooltip');
            if (t && typeof t.hidePopover === 'function' && t.matches(':popover-open')) {
                try {
                    t.hidePopover();
                } catch {}
            }
        })
        .catch(() => null);
    await page.mouse.move(10, 10).catch(() => null);
    await waitForCharts(page);

    const legendItems = await page.locator(SELECTORS.legendItems).all();
    result.legendItemCount = legendItems.length;
    const firstLegend = legendItems[0];
    // Some charts ship a11y proxy elements even when the visible legend is
    // suppressed (legend.enabled=false, or position renders the legend
    // off-canvas). Probe for actual visibility — if the proxy is invisible
    // and has zero size, skip the legend phases entirely so they don't
    // generate spurious image-diffs against the other side.
    const legendVisible = firstLegend
        ? await firstLegend
              .evaluate((el) => {
                  const r = el.getBoundingClientRect();
                  if (r.width <= 0 || r.height <= 0) return false;
                  const cs = window.getComputedStyle(el);
                  if (cs.visibility === 'hidden' || cs.display === 'none') return false;
                  return true;
              })
              .catch(() => false)
        : false;
    result.legendVisible = legendVisible;

    if (legendVisible) {
        // Phase: legend-hover
        const legendHover = newPhase('legend-hover');
        {
            const errBefore = snapshotErrorCounts(result);
            try {
                await firstLegend.hover({ timeout: 3000 }).catch(() => null);
                await settleForScreenshot(page, legendHover);
                legendHover.data.legendItemTargeted = true;
                const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-legend-hover.png`;
                await takeWrapperScreenshot(page, out);
                legendHover.screenshots.push({ phase: 'legend-hover', path: out });
            } catch (err) {
                pushException(legendHover, 'phase-error', { error: err.message });
            }
            pushErrorExceptionsSince(legendHover, result, errBefore);
            result.phases['legend-hover'] = legendHover;
        }

        await page.mouse.move(10, 10).catch(() => null);
        await sleep(300);

        // Phase: legend-toggle (click first proxy, screenshot, click again to restore).
        const legendToggle = newPhase('legend-toggle');
        {
            const errBefore = snapshotErrorCounts(result);
            try {
                const beforeAria = await firstLegend.getAttribute('aria-checked').catch(() => null);
                await firstLegend.click({ timeout: 3000 }).catch(() => null);
                await waitForCharts(page);
                const afterAria = await firstLegend.getAttribute('aria-checked').catch(() => null);
                legendToggle.data.toggleResult = { before: beforeAria, after: afterAria };
                if (beforeAria === afterAria) {
                    legendToggle.notes.push('aria-checked did not flip');
                }

                await page.mouse.move(10, 10).catch(() => null);
                await settleForScreenshot(page, legendToggle);

                const out = `${SCREENSHOT_ROOT}/${sideKey}/${entry.page}-${entry.example}-${entry.framework}-legend-toggle.png`;
                await takeWrapperScreenshot(page, out);
                legendToggle.screenshots.push({ phase: 'legend-toggle', path: out });

                await firstLegend.click({ timeout: 3000 }).catch(() => null);
                await waitForCharts(page);
            } catch (err) {
                pushException(legendToggle, 'phase-error', { error: err.message });
            }
            pushErrorExceptionsSince(legendToggle, result, errBefore);
            result.phases['legend-toggle'] = legendToggle;
        }
    } else {
        result.notes = result.notes ?? [];
        result.notes.push(firstLegend ? 'legend proxy not visible — phases skipped' : 'no legend — phases skipped');
    }

    await context.close();
    return result;
}

async function captureBoth(browser, entry) {
    const [left, right] = await Promise.all([
        captureOne(browser, sides.left, entry),
        captureOne(browser, sides.right, entry),
    ]);
    // Flag legend-visibility asymmetry: if one side rendered legend phases
    // and the other deliberately skipped them, that's a meaningful difference,
    // not a false positive.
    const legendAsymmetry = !!left.legendVisible !== !!right.legendVisible
        && (left.phases || right.phases);
    if (legendAsymmetry) {
        const target = left.legendVisible ? left : right;
        const phaseName = target.phases?.['legend-hover'] ? 'legend-hover' : 'legend-toggle';
        const phase = target.phases?.[phaseName];
        if (phase) {
            phase.exceptions = phase.exceptions ?? [];
            phase.exceptions.push({
                type: 'legend-asymmetry',
                leftVisible: !!left.legendVisible,
                rightVisible: !!right.legendVisible,
            });
        }
    }
    return {
        page: entry.page,
        example: entry.example,
        framework: entry.framework,
        randomData: entry.randomData,
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

async function fetchSideMetadata(side) {
    // /debug/meta.json is emitted by every Astro build of the website (see
    // packages/ag-charts-website/src/pages/debug/meta.json.ts). Used here to
    // surface the charts version + git hash + build date in the report header.
    // New/removed-example detection is derived from per-result navigation-error
    // data rather than a debug endpoint — gallery isn't covered by docs-examples.json.
    const baseUrl = side.baseUrl.replace(/\/$/, '');
    try {
        const res = await fetch(`${baseUrl}/debug/meta.json`);
        if (!res.ok) return { meta: null, error: `HTTP ${res.status}` };
        return { meta: await res.json(), error: null };
    } catch (err) {
        return { meta: null, error: err.message };
    }
}

function resultHasFailure(r) {
    if (!r) return true;
    if (r.error) return true;
    let sawAnySide = false;
    for (const side of ['left', 'right']) {
        const s = r[side];
        if (!s) continue;
        sawAnySide = true;
        if (s.error) return true;
        for (const phase of Object.values(s.phases ?? {})) {
            if (phase.exceptions?.length) return true;
            for (const d of phase.imageDiffs ?? []) {
                if (typeof d.percent === 'number' && d.percent > 0) return true;
            }
        }
    }
    return !sawAnySide;
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    let filtered = matrix.filter((e) => e.framework === framework);
    const dropped = matrix.length - filtered.length;

    let priorBundle = null;
    if (RERUN_EXCEPTIONS) {
        if (!existsSync(RESULTS_PATH)) {
            process.stderr.write(`RERUN_EXCEPTIONS=1 requires existing ${RESULTS_PATH} — run a full sweep first.\n`);
            await browser.close();
            process.exit(2);
        }
        priorBundle = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));
        const failingKeys = new Set();
        for (const r of priorBundle.results ?? []) {
            if (resultHasFailure(r)) failingKeys.add(`${r.page}/${r.example}/${r.framework}`);
        }
        const before = filtered.length;
        filtered = filtered.filter((e) => failingKeys.has(`${e.page}/${e.example}/${e.framework}`));
        process.stderr.write(
            `>> RERUN_EXCEPTIONS=1: ${filtered.length} of ${before} matrix entries had prior exceptions or pixel diffs\n`
        );
    }

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
        process.stderr.write(
            RERUN_EXCEPTIONS
                ? `   no prior failures to rerun; clean state.\n`
                : `   no matrix entries match framework=${framework}; re-run discover.mjs with --framework ${framework}\n`
        );
        await browser.close();
        process.exit(RERUN_EXCEPTIONS ? 0 : 2);
    }
    const [leftMeta, rightMeta] = await Promise.all([fetchSideMetadata(sides.left), fetchSideMetadata(sides.right)]);
    const sideMetadata = { left: leftMeta, right: rightMeta };
    for (const [k, m] of Object.entries(sideMetadata)) {
        if (m.error) process.stderr.write(`   ${k} /debug/meta.json fetch failed: ${m.error}\n`);
        else if (m.meta?.git?.shortHash)
            process.stderr.write(
                `   ${k}: charts ${m.meta?.versions?.charts ?? '?'} @ ${m.meta.git.shortHash} (${m.meta.git.date ?? '?'})\n`
            );
    }

    const fresh = await runPool(filtered, async (entry) => captureBoth(browser, entry));
    await browser.close();

    if (RERUN_EXCEPTIONS && priorBundle) {
        const idx = new Map();
        priorBundle.results.forEach((r, i) => idx.set(`${r.page}/${r.example}/${r.framework}`, i));
        let replaced = 0;
        for (const f of fresh) {
            const i = idx.get(`${f.page}/${f.example}/${f.framework}`);
            if (i != null) {
                priorBundle.results[i] = f;
                replaced++;
            }
        }
        // Refresh sides metadata in case the user changed sides.json between runs.
        priorBundle.sides = sides;
        priorBundle.framework = framework;
        priorBundle.sideMetadata = sideMetadata;
        writeFileSync(RESULTS_PATH, JSON.stringify(priorBundle, null, 2));
        console.log(`Merged ${replaced} fresh results into ${RESULTS_PATH} (total ${priorBundle.results.length})`);
    } else {
        writeFileSync(
            RESULTS_PATH,
            JSON.stringify({ sides, framework, sideMetadata, results: fresh }, null, 2)
        );
        console.log(`Wrote ${fresh.length} results to ${RESULTS_PATH}`);
    }

    if (process.env.SKIP_AUTO_CHAIN === '1') {
        process.stderr.write(`SKIP_AUTO_CHAIN=1 — not running diff.mjs / triage-queue.mjs\n`);
        return;
    }
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    for (const next of ['diff.mjs', 'triage-queue.mjs']) {
        process.stderr.write(`>> auto-chaining ${next}\n`);
        const res = spawnSync(process.execPath, [resolve(scriptDir, next)], {
            stdio: 'inherit',
            env: { ...process.env, OUTPUT_DIR },
        });
        if (res.status !== 0) {
            process.stderr.write(`!! ${next} exited with status ${res.status}; stopping auto-chain\n`);
            process.exit(res.status ?? 1);
        }
    }
    process.stderr.write(`>> data-gathering complete. Next: launch the AI classification step (see SKILL.md step 6b/6c).\n`);
})();
