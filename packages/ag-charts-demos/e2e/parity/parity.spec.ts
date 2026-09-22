import { type Browser, type BrowserContextOptions, type TestInfo, expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

import { type Comparison, MAX_DIFF_PIXEL_RATIO, compareScreenshots } from './compare';
import { MASKS } from './masks';
import { DEMO_STATES, type DemoState, type DemoStates, settle } from './states';
import {
    type ComparisonArtefacts,
    type ComparisonRecord,
    RESULTS_DIR,
    RESULT_ATTACHMENT,
    comparisonKey,
} from './summary';
import { type ParityTarget, REFERENCE_URL, demoPageUrl, parityTargets } from './targets';

// Pixel parity of each framework port against the React reference, compared live: for every named
// state and viewport the two apps are loaded in deterministic mode, driven to the state through the
// same controls and photographed, and the port must match the reference within MAX_DIFF_PIXEL_RATIO.
// Self-parity (the default, with no ports yet) compares the React app against itself and must be
// pixel-identical: that proves the demos and the harness are deterministic.

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

/** Write the screenshots for passing comparisons too, for inspection. */
const KEEP_ARTEFACTS = process.env.PARITY_KEEP_ARTEFACTS === '1';

const viewportName = (viewport: { width: number; height: number }) => `${viewport.width}x${viewport.height}`;

/** Load `url`, drive it to `state`, and photograph it. Each call gets a context of its own. */
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
        const page = await context.newPage();
        await page.goto(url);
        await demo.ready(page);
        await settle(page);
        await state.run?.(page);
        await settle(page);
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
    const dir = join(RESULTS_DIR, record.framework, record.demo, `${record.state}@${record.viewport}`);
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
                    const comparison = compareScreenshots(reference, port);

                    record.diffPixels = comparison.diffPixels;
                    record.diffPixelRatio = comparison.diffPixelRatio;
                    record.passed = !comparison.sizeMismatch && comparison.diffPixelRatio <= MAX_DIFF_PIXEL_RATIO;
                    if (!record.passed || KEEP_ARTEFACTS) {
                        record.artefacts = await writeArtefacts(testInfo, record, reference, port, comparison);
                    }
                    await attachRecord(testInfo, record);

                    const label = comparisonKey(record);
                    expect(comparison.sizeMismatch, `${label}: the port screenshot is a different size`).toBe(false);
                    expect(
                        comparison.diffPixelRatio,
                        `${label}: ${comparison.diffPixels} of ${comparison.totalPixels} pixels differ`
                    ).toBeLessThanOrEqual(MAX_DIFF_PIXEL_RATIO);
                });
            }
        }
    });
}

for (const target of parityTargets()) {
    defineComparisons(target);
}
