import { type Browser, type BrowserContextOptions, type Route, type TestInfo, expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

import { type Comparison, compareScreenshots } from './compare';
import { MASKS } from './masks';
import { DEMO_STATES, type DemoState, type DemoStates, growToContent, settle } from './states';
import {
    type ComparisonArtefacts,
    type ComparisonRecord,
    RESULTS_DIR,
    RESULT_ATTACHMENT,
    attemptDir,
    comparisonKey,
} from './summary';
import { GATE, type ParityTarget, REFERENCE_URL, demoPageUrl, parityTargets } from './targets';

// Pixel parity of each framework port against the React reference, compared live: for every named
// state and viewport the two apps are loaded in deterministic mode, driven to the state through the
// same controls, grown to their content and photographed, and the port must match the reference
// within PORT_GATE. Self-parity (the default with no ports named) compares the React app against
// itself under SELF_PARITY_GATE, which admits no differing pixel: that proves the demos and the
// harness are deterministic.

const VIEWPORTS = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
] as const;

// Pinned on both sides: date labels, number formats and hover behaviour all depend on these.
const CONTEXT_OPTIONS: BrowserContextOptions = {
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    deviceScaleFactor: 1,
    hasTouch: false,
};

/**
 * Injected into every page before it loads: no CSS transitions or animations. The screenshot's own
 * `animations: 'disabled'` only acts at the moment it is taken; a transition started by the state's
 * last click (a button's hover colour) could otherwise be caught at different points on the two
 * sides. Both sides are frozen alike, and AG Charts animates in script, which `settle` waits out.
 */
const FREEZE_MOTION_CSS = '*, *::before, *::after { transition: none !important; animation: none !important; }';

interface PinnedResponse {
    status: number;
    headers: Record<string, string>;
    body: Buffer;
}

/**
 * Third-party responses, fetched once per worker and replayed to every page after. The demos load
 * their web fonts from Google Fonts, which does not always answer the same stylesheet URL with the
 * same stylesheet: now and then it names other font files, and text drawn with them lands on
 * different pixels. Pinned here, the two sides of a comparison always get the same bytes. The
 * promise is stored, not its result, so the two sides loading at once share one fetch.
 */
const pinnedResponses = new Map<string, Promise<PinnedResponse>>();

const isThirdParty = (url: URL) => !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);

async function replayPinned(route: Route) {
    const request = route.request();
    if (request.method() !== 'GET') return route.continue();
    const url = request.url();
    let pinned = pinnedResponses.get(url);
    if (!pinned) {
        pinned = route.fetch().then(async (response) => ({
            status: response.status(),
            headers: response.headers(),
            body: await response.body(),
        }));
        pinnedResponses.set(url, pinned);
    }
    let response: PinnedResponse;
    try {
        response = await pinned;
    } catch {
        // A failed fetch is not pinned: a later page fetches afresh. This page sees the failure.
        if (pinnedResponses.get(url) === pinned) pinnedResponses.delete(url);
        return route.abort('failed');
    }
    return route.fulfill(response);
}

/** Write the screenshots for passing comparisons too, for inspection. */
const KEEP_ARTEFACTS = process.env.PARITY_KEEP_ARTEFACTS === '1';

const viewportName = (viewport: { width: number; height: number }) => `${viewport.width}x${viewport.height}`;

/**
 * Load `url`, drive it to `state`, grow the viewport to the content, and photograph it. Each call
 * gets a context of its own.
 */
async function photograph(
    browser: Browser,
    url: string,
    viewport: { width: number; height: number },
    demo: DemoStates,
    state: DemoState,
    masks: readonly string[]
): Promise<Buffer> {
    const context = await browser.newContext({ ...CONTEXT_OPTIONS, viewport });
    try {
        await context.addInitScript((css) => {
            const style = document.createElement('style');
            style.textContent = css;
            const insert = () => (document.head ?? document.documentElement).append(style);
            if (document.documentElement) insert();
            else document.addEventListener('DOMContentLoaded', insert, { once: true });
        }, FREEZE_MOTION_CSS);
        await context.route(isThirdParty, replayPinned);
        const page = await context.newPage();
        await page.goto(url);
        await demo.ready(page);
        await settle(page);
        await state.run?.(page);
        await settle(page);
        // The shell never scrolls; its scroll regions do. Grown until none of them overflows, one
        // screenshot holds the whole state, and a port whose content is taller or shorter than the
        // reference's comes out a different size and fails.
        await growToContent(page, demo.scrollContainers);
        return await page.screenshot({
            animations: 'disabled',
            caret: 'hide',
            mask: masks.map((selector) => page.locator(selector)),
            maskColor: '#ff00ff',
        });
    } finally {
        await context.close();
    }
}

async function writeArtefacts(
    testInfo: TestInfo,
    record: ComparisonRecord,
    reference: Buffer,
    port: Buffer,
    comparison: Comparison
): Promise<ComparisonArtefacts> {
    // One folder per attempt: repeats run concurrently and a retry must not overwrite the failure.
    const dir = join(RESULTS_DIR, attemptDir(record));
    mkdirSync(dir, { recursive: true });
    const files: [keyof ComparisonArtefacts, string, Buffer | undefined][] = [
        ['reference', 'reference.png', reference],
        ['port', 'port.png', port],
        ['diff', 'diff.png', comparison.diff],
        ['sideBySide', 'side-by-side.png', comparison.sideBySide],
    ];
    const artefacts: ComparisonArtefacts = {};
    for (const [key, filename, image] of files) {
        if (!image) continue;
        const path = join(dir, filename);
        writeFileSync(path, image);
        artefacts[key] = relative(RESULTS_DIR, path);
        await testInfo.attach(filename, { path, contentType: 'image/png' });
    }
    return artefacts;
}

const attachRecord = (testInfo: TestInfo, record: ComparisonRecord) =>
    testInfo.attach(RESULT_ATTACHMENT, { body: JSON.stringify(record), contentType: 'application/json' });

function defineComparisons(target: ParityTarget) {
    const demo = DEMO_STATES[target.demo];
    if (!demo) throw new Error(`no parity states are defined for demo "${target.demo}"`);
    const masks = MASKS[target.demo] ?? [];

    test.describe(`${target.framework} ${target.demo}`, () => {
        for (const viewport of VIEWPORTS) {
            for (const state of demo.states) {
                test(`${state.name} @ ${viewportName(viewport)}`, async ({ browser }, testInfo) => {
                    const record: ComparisonRecord = {
                        demo: target.demo,
                        framework: target.framework,
                        state: state.name,
                        viewport: viewportName(viewport),
                        repeatEachIndex: testInfo.repeatEachIndex,
                        retry: testInfo.retry,
                        screenshots: null,
                        diffPixels: null,
                        diffPixelRatio: null,
                        passed: false,
                        artefacts: {},
                    };
                    // Attached up front so a comparison that times out still appears in the summary; the
                    // final attachment of the same name replaces it.
                    await attachRecord(testInfo, record);

                    const [reference, port] = await Promise.all([
                        photograph(browser, demoPageUrl(REFERENCE_URL, target.demo), viewport, demo, state, masks),
                        photograph(browser, demoPageUrl(target.baseURL, target.demo), viewport, demo, state, masks),
                    ]);
                    const comparison = compareScreenshots(reference, port, GATE);

                    record.screenshots = {
                        reference: `${comparison.width}x${comparison.height}`,
                        port: `${comparison.portWidth}x${comparison.portHeight}`,
                    };
                    record.diffPixels = comparison.diffPixels;
                    record.diffPixelRatio = comparison.diffPixelRatio;
                    record.passed = comparison.passed;
                    if (!record.passed || KEEP_ARTEFACTS) {
                        record.artefacts = await writeArtefacts(testInfo, record, reference, port, comparison);
                    }
                    await attachRecord(testInfo, record);

                    const label = comparisonKey(record);
                    expect(
                        comparison.sizeMismatch,
                        `${label}: the port screenshot is ${record.screenshots.port}, the reference's ${record.screenshots.reference}`
                    ).toBe(false);
                    expect(
                        comparison.diffPixelRatio,
                        `${label}: ${comparison.diffPixels} of ${comparison.totalPixels} pixels differ`
                    ).toBeLessThanOrEqual(GATE.maxDiffPixelRatio);
                });
            }
        }
    });
}

for (const target of parityTargets()) {
    defineComparisons(target);
}
