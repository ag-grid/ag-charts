// AG Charts product profile for the A/B smoke-test runner.
//
// Exercises each example through: initial render, example-controls buttons,
// tooltip (keyboard-driven with mouse fallback), legend-hover, legend-toggle.
// Waits for chart readiness via data-update-pending / data-animating attributes
// on .ag-charts-wrapper; tracks scene-render bumps on control clicks.

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
    sleep, slug, newPhase, pushException, snapshotErrorCounts,
    pushErrorExceptionsSince,
} from './shared.mjs';

export { DOCS_OPTIONS, GALLERY_OPTIONS, ALL_OPTIONS, IGNORE_PAGES, UNSUPPORTED_GENERIC,
         isUnsupportedGeneric, resolveOptions, FRAMEWORKS } from '../example-options.mjs';

export const PRODUCT = 'ag-charts';
export const PRODUCT_SHORT = 'charts';

export const SELECTORS = {
    wrapper: '.ag-charts-wrapper',
    canvas: '.ag-charts-wrapper canvas',
    canvasCenter: '.ag-charts-canvas-center',
    legendItems: 'button[role="switch"].ag-charts-proxy-elem',
    tooltip: '.ag-charts-tooltip',
    crosshairLabel: '.ag-charts-crosshair-label',
    exampleControlsButton: '.example-controls button',
};

export const NOISE_RE = /Hotjar|Plausible|OneTrust|gtm|googletagmanager|^\[vite\]|React DevTools|Quirks Mode/i;

export function isNoise(text, location) {
    if (typeof text === 'string' && text.startsWith('*')) return true;
    if (location?.url?.includes('/favicon.ico')) return true;
    return NOISE_RE.test(text);
}

export function buildExampleUrl(baseUrl, entry) {
    return entry.page === 'gallery'
        ? `${baseUrl}/gallery/examples/${entry.example}`
        : `${baseUrl}/${entry.framework}/${entry.page}/examples/${entry.example}`;
}

export const META_ENDPOINT = '/debug/meta.json';

export const PHASE_ORDER = ['initial', 'controls', 'tooltip', 'legend-hover', 'legend-toggle'];

export const DISCOVERY = {
    contentGlob: '**/_examples/*/main.ts',
    getContentDir: (repoRoot) => resolve(repoRoot, 'packages/ag-charts-website/src/content'),
    repoFingerprint: 'packages/ag-charts-website',
    driftCheckSources: [
        'packages/ag-charts-website/e2e/example-options.ts',
        'packages/ag-charts-website/e2e/gallery-examples.spec.ts',
    ],
    galleryPage: 'gallery',
    galleryFrameworks: ['vanilla'],
};

// --- Charts-specific wait / readiness helpers ---

export async function waitForReady(page, timeoutMs = 10000) {
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
            }, SELECTORS.wrapper)
            .catch(() => ({ ready: false, reason: 'eval-error' }));
        if (status.ready) {
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

export async function waitForContent(page, timeoutMs = 20000) {
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
        .evaluate((sel) => document.querySelectorAll(sel).length, SELECTORS.wrapper)
        .catch(() => 0);
}

async function getSceneRenders(page) {
    return page
        .evaluate((sel) => {
            const w = document.querySelector(sel);
            const v = w?.getAttribute('data-scene-renders');
            return v == null ? null : Number(v);
        }, SELECTORS.wrapper)
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

function shouldSkipCanvasCheck(skipCanvasUpdateCheck, buttonLabel) {
    if (skipCanvasUpdateCheck === true) return true;
    if (Array.isArray(skipCanvasUpdateCheck)) return skipCanvasUpdateCheck.includes(buttonLabel);
    return false;
}

async function settleForScreenshot(page, phase, label, timeoutMs = 12000) {
    const result = await waitForReady(page, timeoutMs);
    if (!result.settled) {
        pushException(phase, 'chart-not-settled', {
            reason: result.reason ?? 'unknown',
            timedOutMs: result.timedOutMs ?? timeoutMs,
            ...(label ? { label } : {}),
        });
    }
    return result.settled;
}

export async function takeScreenshot(page, outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    const wrapper = page.locator(SELECTORS.wrapper).first();
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
        }, SELECTORS.wrapper)
        .catch(() => null);

    if (clip && clip.width > 0 && clip.height > 0) {
        try {
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
            // fall through
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

export async function shouldSkipPhases(page, result) {
    const count = await countWrappers(page);
    result.wrapperCount = count;
    if (count > 1) return { skip: true, reason: `multi-canvas-skipped (${count} wrappers)` };
    return { skip: false };
}

// --- Phase runners ---

async function phaseInitial(ctx) {
    const { page, entry, sideKey, result, screenshotDir, initialErrBefore } = ctx;
    const phase = newPhase('initial');
    const errBefore = initialErrBefore ?? snapshotErrorCounts(result);

    await settleForScreenshot(page, phase, null, 15000);
    const out = `${screenshotDir}/${entry.page}-${entry.example}-${entry.framework}-initial.png`;
    try {
        await takeScreenshot(page, out);
        phase.screenshots.push({ phase: 'initial', path: out });
    } catch (err) {
        pushException(phase, 'screenshot-error', { error: err.message });
    }
    if (!result.canvasFound) pushException(phase, 'canvas-missing', { url: result.url });
    pushErrorExceptionsSince(phase, result, errBefore);
    return phase;
}

async function phaseControls(ctx) {
    const { page, entry, sideKey, result, screenshotDir } = ctx;
    const phase = newPhase('controls');

    try {
        let buttons = await page.locator(SELECTORS.exampleControlsButton).all();
        if (entry.options?.clickOrder === 'reverse') buttons = buttons.reverse();
        phase.data.buttonCount = buttons.length;

        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const label = (await btn.textContent().catch(() => null))?.trim() ?? `button-${i}`;
            const errBefore = snapshotErrorCounts(result);
            const before = await getSceneRenders(page);
            try {
                await btn.click({ timeout: 5000 });
            } catch (err) {
                pushException(phase, 'control-click-error', { buttonIndex: i, label, error: err.message });
                continue;
            }

            const skip = shouldSkipCanvasCheck(entry.options?.skipCanvasUpdateCheck, label);
            if (skip) {
                await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);
            } else {
                const after = await waitForSceneRenderBump(page, before);
                if (after == null) {
                    pushException(phase, 'control-no-render', {
                        buttonIndex: i, label, sceneRendersBefore: before,
                    });
                }
            }
            await settleForScreenshot(page, phase, label);

            const out = `${screenshotDir}/${entry.page}-${entry.example}-${entry.framework}-control-${i}-${slug(label)}.png`;
            try {
                await takeScreenshot(page, out);
                phase.screenshots.push({ phase: 'controls', buttonIndex: i, label, path: out });
            } catch (err) {
                pushException(phase, 'screenshot-error', { buttonIndex: i, label, error: err.message });
            }
            pushErrorExceptionsSince(phase, result, errBefore);
        }
    } catch (err) {
        pushException(phase, 'phase-error', { error: err.message });
    }

    await page.mouse.move(10, 10).catch(() => null);
    await sleep(300);

    return phase;
}

async function phaseTooltip(ctx) {
    const { page, entry, sideKey, result, screenshotDir, state } = ctx;
    const phase = newPhase('tooltip');
    const errBefore = snapshotErrorCounts(result);

    try {
        const focusTarget = page.locator(`${SELECTORS.wrapper} [tabindex="0"]`).first();
        let tooltipVisible = false;
        let trigger = 'none';
        if ((await focusTarget.count()) > 0) {
            await focusTarget.focus().catch(() => null);
            await waitForReady(page);
            tooltipVisible = await isTooltipShowing(page);
            if (tooltipVisible) trigger = 'focus';

            if (!tooltipVisible) {
                await page.keyboard.press('Tab').catch(() => null);
                await waitForReady(page);
                tooltipVisible = await isTooltipShowing(page);
                if (tooltipVisible) trigger = 'tab';
            }

            if (!tooltipVisible) {
                await page.keyboard.press('ArrowRight').catch(() => null);
                await waitForReady(page);
                tooltipVisible = await isTooltipShowing(page);
                if (tooltipVisible) trigger = 'arrow-right';
            }
        }

        const canvasBox = state.canvasBox;
        if (!tooltipVisible && canvasBox) {
            const tx = canvasBox.x + canvasBox.width * 0.5;
            const ty = canvasBox.y + canvasBox.height * 0.5;
            await page.mouse.move(tx - 30, ty - 30);
            await sleep(120);
            await page.mouse.move(tx, ty, { steps: 10 });
            await waitForReady(page);
            tooltipVisible = await isTooltipShowing(page);
            if (tooltipVisible) trigger = 'hover';
        }
        phase.data.tooltipVisible = tooltipVisible;
        phase.data.tooltipTrigger = trigger;
        phase.data.crosshairLabelVisible = (await page.locator(SELECTORS.crosshairLabel).count()) > 0;

        await settleForScreenshot(page, phase);
        const out = `${screenshotDir}/${entry.page}-${entry.example}-${entry.framework}-tooltip.png`;
        await takeScreenshot(page, out);
        phase.screenshots.push({ phase: 'tooltip', path: out });
    } catch (err) {
        pushException(phase, 'phase-error', { error: err.message });
    }
    pushErrorExceptionsSince(phase, result, errBefore);

    // Clear tooltip state for subsequent phases.
    await page
        .evaluate(() => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            const t = document.querySelector('.ag-charts-tooltip');
            if (t && typeof t.hidePopover === 'function' && t.matches(':popover-open')) {
                try { t.hidePopover(); } catch {}
            }
        })
        .catch(() => null);
    await page.mouse.move(10, 10).catch(() => null);
    await waitForReady(page);

    return phase;
}

async function phaseLegendHover(ctx) {
    const { page, entry, sideKey, result, screenshotDir, state } = ctx;
    const phase = newPhase('legend-hover');
    const errBefore = snapshotErrorCounts(result);

    try {
        await state.firstLegend.hover({ timeout: 3000 }).catch(() => null);
        await settleForScreenshot(page, phase);
        phase.data.legendItemTargeted = true;
        const out = `${screenshotDir}/${entry.page}-${entry.example}-${entry.framework}-legend-hover.png`;
        await takeScreenshot(page, out);
        phase.screenshots.push({ phase: 'legend-hover', path: out });
    } catch (err) {
        pushException(phase, 'phase-error', { error: err.message });
    }
    pushErrorExceptionsSince(phase, result, errBefore);

    await page.mouse.move(10, 10).catch(() => null);
    await sleep(300);

    return phase;
}

async function phaseLegendToggle(ctx) {
    const { page, entry, sideKey, result, screenshotDir, state } = ctx;
    const phase = newPhase('legend-toggle');
    const errBefore = snapshotErrorCounts(result);

    try {
        const beforeAria = await state.firstLegend.getAttribute('aria-checked').catch(() => null);
        await state.firstLegend.click({ timeout: 3000 }).catch(() => null);
        await waitForReady(page);
        const afterAria = await state.firstLegend.getAttribute('aria-checked').catch(() => null);
        phase.data.toggleResult = { before: beforeAria, after: afterAria };
        if (beforeAria === afterAria) {
            phase.notes.push('aria-checked did not flip');
        }

        await page.mouse.move(10, 10).catch(() => null);
        await settleForScreenshot(page, phase);

        const out = `${screenshotDir}/${entry.page}-${entry.example}-${entry.framework}-legend-toggle.png`;
        await takeScreenshot(page, out);
        phase.screenshots.push({ phase: 'legend-toggle', path: out });

        await state.firstLegend.click({ timeout: 3000 }).catch(() => null);
        await waitForReady(page);
    } catch (err) {
        pushException(phase, 'phase-error', { error: err.message });
    }
    pushErrorExceptionsSince(phase, result, errBefore);

    return phase;
}

// Called after initial navigation + content ready, before phases run.
// Sets up cross-phase state (canvasBox, legend visibility).
export async function prepareState(ctx) {
    const { page, result } = ctx;

    const canvasBox = await (async () => {
        const c = await page.$(SELECTORS.wrapper);
        return c ? c.boundingBox() : null;
    })();
    ctx.state.canvasBox = canvasBox;

    const legendItems = await page.locator(SELECTORS.legendItems).all();
    result.legendItemCount = legendItems.length;
    const firstLegend = legendItems[0];
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

    ctx.state.legendVisible = legendVisible;
    ctx.state.firstLegend = firstLegend;
    result.legendVisible = legendVisible;

    if (!legendVisible) {
        result.notes = result.notes ?? [];
        result.notes.push(firstLegend ? 'legend proxy not visible — phases skipped' : 'no legend — phases skipped');
    }
}

export const PHASES = [
    { name: 'initial', run: phaseInitial },
    { name: 'controls', run: phaseControls },
    { name: 'tooltip', run: phaseTooltip },
    {
        name: 'legend-hover',
        run: phaseLegendHover,
        guard: (ctx) => ctx.state.legendVisible,
    },
    {
        name: 'legend-toggle',
        run: phaseLegendToggle,
        guard: (ctx) => ctx.state.legendVisible,
    },
];
