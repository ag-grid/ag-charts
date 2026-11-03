import { build } from 'esbuild';
import assert from 'node:assert/strict';
import path from 'node:path';
import test, { after, before } from 'node:test';
import { type Browser, type Page, chromium } from 'playwright';

/**
 * Runs the real `benchmarkHarness.ts` in Chromium and reads `window.__benchmarkProgress`, the record the
 * runner reports when an example times out. A variant that never settles stands in for a hang.
 */

const HARNESS = path.resolve(
    __dirname,
    '../../packages/ag-charts-website/src/content/docs/benchmarks/benchmarkHarness.ts'
);

const WARMUP_UPDATES = 2;
const UPDATES_PER_TEST = 4;

interface Progress {
    testCase: string;
    params: Record<string, string>;
    phase: 'setup' | 'warmup' | 'measure' | 'teardown';
    warmupCompleted: number;
    iterationsCompleted: number;
    startedAt: number;
    lastIterationAt: number | null;
}

let browser: Browser;
let harnessBundle: string;

before(async () => {
    const out = await build({
        entryPoints: [HARNESS],
        bundle: true,
        format: 'iife',
        globalName: 'harness',
        platform: 'browser',
        write: false,
    });
    harnessBundle = out.outputFiles[0].text;
    browser = await chromium.launch();
});

after(async () => {
    await browser?.close();
});

async function openHarness(page: Page, testCases: string): Promise<void> {
    await page.setContent('<!doctype html><html><body><div id="myChart"></div></body></html>');
    await page.addScriptTag({ content: 'window.agCharts = { VERSION: "14.0.0" };' });
    await page.addScriptTag({ content: harnessBundle });
    // A string, not a function: tsx's `__name` helper does not exist inside the page.
    await page.evaluate(`(() => {
        window.harness.initBenchmark({
            testCases: ${testCases},
            config: { updatesPerTest: ${UPDATES_PER_TEST}, warmupUpdates: ${WARMUP_UPDATES}, maxCollectionTimeMs: 60000 },
        });
        void window.__benchmarkRunner.run();
    })()`);
}

/** Variant source whose `run` returns 5 until the `hangAt`th call (0-based, warmup included), then never settles. */
function hangingVariant(hangAt: number, params = "{ series: '3' }"): string {
    return `{
        params: ${params},
        run: (() => {
            let calls = 0;
            return () => (calls++ === ${hangAt} ? new Promise(() => {}) : Promise.resolve(5));
        })(),
    }`;
}

async function progressWhere(page: Page, predicate: string): Promise<Progress> {
    await page.waitForFunction(
        `(() => { const p = window.__benchmarkProgress; return !!p && (${predicate})(p); })()`,
        undefined,
        {
            timeout: 15_000,
        }
    );
    return page.evaluate<Progress>('window.__benchmarkProgress');
}

test('a hang in a measured iteration names the test case and variant and counts the iterations completed', async () => {
    const page = await browser.newPage();
    try {
        await openHarness(page, `[{ id: 'line', variants: [${hangingVariant(WARMUP_UPDATES + 2)}] }]`);
        const progress = await progressWhere(page, `(p) => p.iterationsCompleted === 2`);
        // Give a further frame to show the record stays put once the variant has hung.
        await page.waitForTimeout(200);
        const settled = await page.evaluate<Progress>('window.__benchmarkProgress');

        assert.equal(settled.testCase, 'line');
        assert.deepEqual(settled.params, { series: '3' });
        assert.equal(settled.phase, 'measure');
        assert.equal(settled.warmupCompleted, WARMUP_UPDATES);
        assert.equal(settled.iterationsCompleted, 2);
        assert.equal(typeof settled.lastIterationAt, 'number');
        assert.equal(settled.lastIterationAt, progress.lastIterationAt);
        assert.ok(settled.lastIterationAt! >= settled.startedAt);
    } finally {
        await page.close();
    }
});

test('a hang in warmup is reported as warmup, with none of the measured iterations counted', async () => {
    const page = await browser.newPage();
    try {
        await openHarness(page, `[{ id: 'line', variants: [${hangingVariant(1)}] }]`);
        const progress = await progressWhere(page, `(p) => p.warmupCompleted === 1`);
        assert.equal(progress.phase, 'warmup');
        assert.equal(progress.iterationsCompleted, 0);
        assert.equal(typeof progress.lastIterationAt, 'number');
    } finally {
        await page.close();
    }
});

test('a hang before the first iteration has a variant but no last iteration', async () => {
    const page = await browser.newPage();
    try {
        await openHarness(page, `[{ id: 'line', variants: [${hangingVariant(0)}] }]`);
        const progress = await progressWhere(page, `(p) => p.phase === 'warmup'`);
        assert.equal(progress.warmupCompleted, 0);
        assert.equal(progress.iterationsCompleted, 0);
        assert.equal(progress.lastIterationAt, null);
    } finally {
        await page.close();
    }
});

test('a hang in a later test case setup reports that test case, not the previous variant', async () => {
    const page = await browser.newPage();
    try {
        await openHarness(
            page,
            `[
                { id: 'first', variants: [{ params: { a: '1' }, run: async () => 5 }] },
                { id: 'second', setup: () => new Promise(() => {}), variants: [{ params: { b: '2' }, run: async () => 5 }] },
            ]`
        );
        const progress = await progressWhere(page, `(p) => p.testCase === 'second'`);
        assert.equal(progress.phase, 'setup');
        assert.deepEqual(progress.params, {});
        assert.equal(progress.iterationsCompleted, 0);
    } finally {
        await page.close();
    }
});

test('a hang in teardown reports teardown rather than the last variant as still measuring', async () => {
    const page = await browser.newPage();
    try {
        await openHarness(
            page,
            `[{ id: 'line', teardown: () => new Promise(() => {}), variants: [{ params: { a: '1' }, run: async () => 5 }] }]`
        );
        const progress = await progressWhere(page, `(p) => p.phase === 'teardown'`);
        assert.equal(progress.testCase, 'line');
        assert.deepEqual(progress.params, {});
    } finally {
        await page.close();
    }
});

test('a completed run exports the same timings and no progress, and the record ends at the last iteration', async () => {
    const page = await browser.newPage();
    try {
        await openHarness(page, `[{ id: 'line', variants: [{ params: { series: '3' }, run: async () => 5 }] }]`);
        await page.waitForFunction('window.__benchmarkComplete === true', undefined, { timeout: 15_000 });

        const exported = await page.evaluate<{ results: Array<{ timings: number[]; sampleCount: number }> }>(
            'window.__benchmarkResults'
        );
        assert.equal(exported.results.length, 1);
        assert.equal(exported.results[0].sampleCount, UPDATES_PER_TEST);
        assert.deepEqual(exported.results[0].timings, Array(UPDATES_PER_TEST).fill(5));
        assert.equal('progress' in exported, false);
        assert.equal(JSON.stringify(exported).includes('lastIterationAt'), false);

        const progress = await page.evaluate<Progress>('window.__benchmarkProgress');
        assert.equal(progress.iterationsCompleted, UPDATES_PER_TEST);
        assert.equal(progress.warmupCompleted, WARMUP_UPDATES);
    } finally {
        await page.close();
    }
});
