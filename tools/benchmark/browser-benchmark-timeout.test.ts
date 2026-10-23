import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { Page } from 'playwright';

import { discoverExamples } from './benchmark-examples';
import { type TimeoutProgress, formatTimeoutProgress, readTimeoutProgress } from './timeout-progress';

/**
 * Drives the real `browser-benchmark.ts` runner (Playwright + Chromium) against stub pages that stand in
 * for the benchmark harness, with a short `--timeout` so each stub times out.
 */

const RUNNER = path.join(__dirname, 'browser-benchmark.ts');
const REPO_ROOT = path.resolve(__dirname, '../..');
const TIMEOUT_MS = 2_000;

/** Publishes a record like the harness does, then never completes. */
const HUNG_AFTER_PROGRESS = `<!doctype html><html><body><script>
window.__benchmarkProgress = {
    testCase: 'line',
    params: { series: '3' },
    phase: 'measure',
    warmupCompleted: 2,
    iterationsCompleted: 7,
    startedAt: performance.now() - 5000,
    lastIterationAt: performance.now() - 1000,
};
</script></body></html>`;

const NEVER_STARTED = '<!doctype html><html><body></body></html>';

const COMPLETES = `<!doctype html><html><body><script>
window.__benchmarkProgress = {
    testCase: 'line',
    params: {},
    phase: 'measure',
    warmupCompleted: 2,
    iterationsCompleted: 4,
    startedAt: performance.now(),
    lastIterationAt: performance.now(),
};
window.__benchmarkResults = { results: [] };
window.__benchmarkComplete = true;
</script></body></html>`;

interface ExampleResult {
    status: string;
    error?: string;
    data?: unknown;
    progress?: TimeoutProgress;
}

interface RunOutput {
    report: { summary: { success: number; timeout: number }; examples: Record<string, ExampleResult> };
    log: string;
}

function serve(page: string): Promise<http.Server> {
    const server = http.createServer((_req, res) => {
        res.setHeader('content-type', 'text/html');
        res.end(page);
    });
    return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** Resolves with the report and log whatever the exit code: a timeout makes the runner exit 1. */
function runRunner(baseUrl: string, example: string): Promise<RunOutput> {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-timeout-'));
    const output = path.join(dir, 'report.json');
    const args = [
        'tsx',
        RUNNER,
        '--base-url',
        baseUrl,
        '--examples',
        example,
        '--output',
        output,
        '--timeout',
        String(TIMEOUT_MS),
    ];
    return new Promise((resolve, reject) => {
        execFile('npx', args, { cwd: REPO_ROOT, encoding: 'utf8', timeout: 120_000 }, (error, stdout, stderr) => {
            try {
                if (!fs.existsSync(output)) {
                    throw new Error(`runner wrote no report: ${error?.message}\n${stdout}\n${stderr}`);
                }
                resolve({ report: JSON.parse(fs.readFileSync(output, 'utf8')), log: `${stdout}\n${stderr}` });
            } catch (e) {
                reject(e);
            } finally {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        });
    });
}

async function runAgainst(page: string): Promise<{ result: ExampleResult; log: string; report: RunOutput['report'] }> {
    const [example] = discoverExamples();
    const server = await serve(page);
    try {
        const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        const { report, log } = await runRunner(baseUrl, example);
        return { result: report.examples[example], log, report };
    } finally {
        server.close();
    }
}

test('a timeout names the test case and variant, the iterations completed and how long ago the last one finished', async () => {
    const { result, log, report } = await runAgainst(HUNG_AFTER_PROGRESS);

    assert.equal(result.status, 'timeout');
    assert.equal(report.summary.timeout, 1);

    const progress = result.progress;
    assert.ok(progress && progress.kind === 'recorded', 'the report entry carries no recorded progress');
    assert.equal(progress.testCase, 'line');
    assert.deepEqual(progress.params, { series: '3' });
    assert.equal(progress.phase, 'measure');
    assert.equal(progress.warmupCompleted, 2);
    assert.equal(progress.iterationsCompleted, 7);
    // The last iteration was 1s old when the stub loaded, and the runner waited out the timeout after that.
    assert.ok(progress.msSinceLastIteration! >= 1_000 + TIMEOUT_MS * 0.9, `got ${progress.msSinceLastIteration}`);
    assert.ok(progress.msSinceLastIteration! < 30_000, `got ${progress.msSinceLastIteration}`);

    assert.match(log, /test case "line" \(series=3\)/);
    assert.match(log, /2 warmup and 7 measured iterations completed/);
    assert.match(log, /last completed \d+\.\ds ago/);
});

test('a timeout before the benchmark started says that no progress was recorded', async () => {
    const { result, log } = await runAgainst(NEVER_STARTED);
    assert.equal(result.status, 'timeout');
    assert.deepEqual(result.progress, { kind: 'none' });
    assert.match(log, /no progress recorded/);
});

/** A page whose `evaluate` behaves as given; the reader only ever calls `evaluate`. */
function fakePage(evaluate: () => Promise<unknown>): Page {
    return { evaluate } as unknown as Page;
}

test('a page that never answers is unreadable once the read times out, rather than holding the runner', async () => {
    const started = Date.now();
    const progress = await readTimeoutProgress(
        fakePage(() => new Promise(() => {})),
        50
    );
    assert.deepEqual(progress, { kind: 'unreadable' });
    assert.ok(Date.now() - started < 5_000);
});

test('a page that rejects the read, such as one that has crashed, is unreadable', async () => {
    const progress = await readTimeoutProgress(fakePage(() => Promise.reject(new Error('Target crashed'))));
    assert.deepEqual(progress, { kind: 'unreadable' });
});

test('an example that completes has no progress in its result or its log', async () => {
    const { result, log, report } = await runAgainst(COMPLETES);
    assert.equal(result.status, 'success');
    assert.equal(report.summary.success, 1);
    assert.equal('progress' in result, false);
    assert.doesNotMatch(log, /progress|warmup and/);
});

test('formatTimeoutProgress words each outcome', () => {
    const recorded = {
        kind: 'recorded',
        testCase: 'pie',
        params: { count: '10', mode: 'a' },
        phase: 'warmup',
        warmupCompleted: 1,
        iterationsCompleted: 0,
        msSinceLastIteration: 212_400,
        msSinceVariantStart: 300_000,
    } as const;
    assert.equal(
        formatTimeoutProgress(recorded),
        'in warmup of test case "pie" (count=10, mode=a): 1 warmup and 0 measured iterations completed, last completed 212.4s ago'
    );
    assert.match(
        formatTimeoutProgress({ ...recorded, msSinceLastIteration: null, warmupCompleted: 0 }),
        /none completed in the 300\.0s since the variant started/
    );
    assert.equal(
        formatTimeoutProgress({ ...recorded, phase: 'setup', params: {}, msSinceVariantStart: 90_000 }),
        'stuck in setup of test case "pie", 90.0s after it began'
    );
    assert.equal(
        formatTimeoutProgress({ kind: 'none' }),
        'no progress recorded: the benchmark had not started on the page'
    );
    assert.equal(formatTimeoutProgress({ kind: 'unreadable' }), 'progress could not be read: the page did not respond');
});
