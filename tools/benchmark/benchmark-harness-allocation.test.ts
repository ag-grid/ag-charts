import { build } from 'esbuild';
import assert from 'node:assert/strict';
import path from 'node:path';
import test, { after, before } from 'node:test';
import { type Browser, type Page, chromium } from 'playwright';

/**
 * Runs the real `benchmarkHarness.ts` in Chromium with fake memory hooks, so the producer side of the
 * memory pass (hook detection, the `measuredRun` bracket, the `elapsed > 0 && bytes !== null` filter and
 * the exported `allocation` field) is checked against exact numbers.
 */

const HARNESS = path.resolve(
    __dirname,
    '../../packages/ag-charts-website/src/content/docs/benchmarks/benchmarkHarness.ts'
);

const WARMUP_UPDATES = 2;
const UPDATES_PER_TEST = 4;

interface Allocation {
    bytesPerIteration: number;
    totalBytes: number;
    iterations: number;
    stdErrBytes?: number;
}

interface HarnessRun {
    allocation: Allocation | undefined;
    startCalls: number;
    stopCalls: number;
    variantCalls: number;
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

/**
 * Runs one test case through the harness. `stopBytes` are the values the fake `stop` hook returns, in
 * order; `elapsed` are the values `variant.run` returns, in order (the last one repeats). `hooks: false`
 * leaves `window` without the hooks, as in a timing pass.
 */
async function runHarness({
    stopBytes,
    elapsed = [5],
    hooks = true,
    updates = UPDATES_PER_TEST,
}: {
    stopBytes: Array<number | null>;
    elapsed?: number[];
    hooks?: boolean;
    updates?: number;
}): Promise<HarnessRun> {
    const page: Page = await browser.newPage();
    try {
        let startCalls = 0;
        let stopCalls = 0;
        if (hooks) {
            await page.exposeFunction('__benchmarkMemoryStart', async () => {
                startCalls++;
            });
            await page.exposeFunction('__benchmarkMemoryStop', async () => {
                const bytes = stopCalls < stopBytes.length ? stopBytes[stopCalls] : 0;
                stopCalls++;
                return bytes;
            });
        }
        await page.setContent('<!doctype html><html><body><div id="myChart"></div></body></html>');
        await page.addScriptTag({ content: 'window.agCharts = { VERSION: "14.0.0" };' });
        await page.addScriptTag({ content: harnessBundle });

        // A string, not a function: tsx's `__name` helper does not exist inside the page.
        const variantCalls = await page.evaluate<number>(`(async () => {
            const elapsedValues = ${JSON.stringify(elapsed)};
            let calls = 0;
            window.harness.initBenchmark({
                testCases: [
                    {
                        id: 'case',
                        variants: [{ run: async () => elapsedValues[Math.min(calls++, elapsedValues.length - 1)] }],
                    },
                ],
                config: { updatesPerTest: ${updates}, warmupUpdates: ${WARMUP_UPDATES}, maxCollectionTimeMs: 60000 },
            });
            await window.__benchmarkRunner.run();
            return calls;
        })()`);

        const results = await page.evaluate<Array<{ allocation?: Allocation }> | undefined>(
            'window.__benchmarkResults?.results'
        );
        assert.ok(results?.length === 1, 'the harness exported no result');
        return { allocation: results[0].allocation, startCalls, stopCalls, variantCalls };
    } finally {
        await page.close();
    }
}

test('allocation is the mean of the bytes the hooks report over the measured iterations only', async () => {
    const run = await runHarness({ stopBytes: [100, 300, 200, 400] });

    // Warmup iterations never touch the hooks.
    assert.equal(run.startCalls, UPDATES_PER_TEST);
    assert.equal(run.stopCalls, UPDATES_PER_TEST);
    assert.equal(run.variantCalls, WARMUP_UPDATES + UPDATES_PER_TEST);

    assert.ok(run.allocation, 'the result carries no allocation');
    assert.equal(run.allocation.iterations, UPDATES_PER_TEST);
    assert.equal(run.allocation.totalBytes, 1000);
    assert.equal(run.allocation.bytesPerIteration, 250);
    // Sample variance 50000/3, so the standard error of the mean is sqrt(50000 / 3 / 4).
    assert.ok(Math.abs((run.allocation.stdErrBytes ?? NaN) - Math.sqrt(50000 / 3 / 4)) < 1e-9);
});

test('an iteration whose sampling failed is left out of the allocation', async () => {
    const run = await runHarness({ stopBytes: [100, null, 300, 500] });
    assert.equal(run.allocation?.iterations, UPDATES_PER_TEST - 1);
    assert.equal(run.allocation?.totalBytes, 900);
    assert.equal(run.allocation?.bytesPerIteration, 300);
});

test('an iteration that returns no timing is not counted, so it cannot skew the mean', async () => {
    // The first measured call yields 0 (not recorded as a timing), so its 9000 bytes must be ignored.
    const run = await runHarness({
        elapsed: [5, 5, 0, 5],
        stopBytes: [9000, 100, 200, 300, 400],
    });
    assert.equal(run.allocation?.iterations, UPDATES_PER_TEST);
    assert.equal(run.allocation?.totalBytes, 1000);
});

test('without the hooks, the result has no allocation and the hooks are never needed', async () => {
    const run = await runHarness({ stopBytes: [], hooks: false });
    assert.equal(run.allocation, undefined);
    assert.equal(run.variantCalls, WARMUP_UPDATES + UPDATES_PER_TEST);
});

test('a memory pass with a single measured iteration reports the mean but no standard error', async () => {
    const run = await runHarness({ stopBytes: [123], updates: 1 });
    assert.equal(run.allocation?.bytesPerIteration, 123);
    assert.equal(run.allocation?.stdErrBytes, undefined);
});
