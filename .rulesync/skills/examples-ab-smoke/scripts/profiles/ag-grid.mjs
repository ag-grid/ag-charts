// AG Grid product profile for the A/B smoke-test runner.
//
// Grid examples render DOM (not canvas), so readiness detection and phases
// differ from AG Charts. Currently scaffolded with an initial-render phase;
// add interaction phases (scroll, sort, filter, column-resize) as the Grid
// e2e fixture stabilises.

import { resolve } from 'node:path';
import {
    newPhase, pushException, snapshotErrorCounts,
    pushErrorExceptionsSince, takeElementScreenshot,
} from './shared.mjs';

export const PRODUCT = 'ag-grid';
export const PRODUCT_SHORT = 'grid';

export const FRAMEWORKS = ['vanilla', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'angular', 'vue3'];

export const SELECTORS = {
    wrapper: '.ag-root-wrapper',
    header: '.ag-header',
    body: '.ag-body',
    row: '.ag-row',
    exampleControlsButton: '.example-controls button',
};

export const NOISE_RE = /Hotjar|Plausible|OneTrust|gtm|googletagmanager|^\[vite\]|React DevTools|Quirks Mode/i;

export function isNoise(text, location) {
    if (typeof text === 'string' && text.startsWith('*')) return true;
    if (location?.url?.includes('/favicon.ico')) return true;
    return NOISE_RE.test(text);
}

export function buildExampleUrl(baseUrl, entry) {
    return `${baseUrl}/examples/${entry.page}/${entry.example}/${entry.framework}/`;
}

export const META_ENDPOINT = '/debug/meta.json';

export const PHASE_ORDER = ['initial'];

export const DISCOVERY = {
    contentGlob: '**/_examples/*/main.ts',
    getContentDir: (repoRoot) => resolve(repoRoot, 'documentation/ag-grid-docs/src/content'),
    repoFingerprint: 'documentation/ag-grid-docs',
    driftCheckSources: [],
    galleryPage: null,
    galleryFrameworks: null,
};

export const EXAMPLE_OPTIONS = {};
export const IGNORE_PAGES = [];
export const UNSUPPORTED_GENERIC = [];
export function isUnsupportedGeneric() { return false; }

export function resolveOptions(page, example) {
    const opts = EXAMPLE_OPTIONS[page];
    return {
        frameworks: FRAMEWORKS,
        status: 'ok',
        clickOrder: 'normal',
        skipCanvasUpdateCheck: false,
        ignoreConsoleWarnings: false,
        ...opts?.['*'],
        ...opts?.[example],
    };
}

export async function waitForReady(page, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const ready = await page
            .evaluate((sel) => {
                const wrapper = document.querySelector(sel);
                if (!wrapper) return false;
                return wrapper.querySelectorAll('.ag-row').length > 0;
            }, SELECTORS.wrapper)
            .catch(() => false);
        if (ready) return { settled: true };
        await new Promise((r) => setTimeout(r, 100));
    }
    return { settled: false, reason: 'no-rows', timedOutMs: timeoutMs };
}

export async function waitForContent(page, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const ok = await page
            .evaluate((sel) => {
                const w = document.querySelector(sel);
                return !!w && w.offsetWidth > 0 && w.offsetHeight > 0;
            }, SELECTORS.wrapper)
            .catch(() => false);
        if (ok) return true;
        await new Promise((r) => setTimeout(r, 250));
    }
    return false;
}

export async function takeScreenshot(page, outPath) {
    return takeElementScreenshot(page, SELECTORS.wrapper, outPath);
}

export async function shouldSkipPhases() {
    return { skip: false };
}

export async function prepareState(ctx) {
    // No cross-phase state needed for Grid yet.
}

// --- Phase runners ---

async function phaseInitial(ctx) {
    const { page, entry, result, screenshotDir, initialErrBefore } = ctx;
    const phase = newPhase('initial');
    const errBefore = initialErrBefore ?? snapshotErrorCounts(result);

    const readyResult = await waitForReady(page, 15000);
    if (!readyResult.settled) {
        pushException(phase, 'grid-not-ready', {
            reason: readyResult.reason ?? 'unknown',
            timedOutMs: readyResult.timedOutMs ?? 15000,
        });
    }

    const out = `${screenshotDir}/${entry.page}-${entry.example}-${entry.framework}-initial.png`;
    try {
        await takeScreenshot(page, out);
        phase.screenshots.push({ phase: 'initial', path: out });
    } catch (err) {
        pushException(phase, 'screenshot-error', { error: err.message });
    }
    if (!result.contentReady) pushException(phase, 'content-missing', { url: result.url });
    pushErrorExceptionsSince(phase, result, errBefore);
    return phase;
}

export const PHASES = [
    { name: 'initial', run: phaseInitial },
];
