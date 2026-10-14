import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { discoverExamples } from './benchmark-examples';

/**
 * Drives the real `browser-benchmark.ts` runner (Playwright + Chromium + CDP) against a stub page that
 * stands in for the benchmark harness. The stub calls the memory hooks the way the harness does: only
 * when they exist, once around each measured iteration, never around warmup.
 */

const RUNNER = path.join(__dirname, 'browser-benchmark.ts');
const REPO_ROOT = path.resolve(__dirname, '../..');

const WARMUP_ITERATIONS = 2;
const MEASURED_ITERATIONS = 3;
/** Each measured iteration allocates (and drops) this many 1000-element arrays of small integers. */
const ARRAYS_PER_ITERATION = 2048;
/** An element takes 4 bytes with V8 pointer compression and 8 without, so the true size is in this range. */
const MIN_ITERATION_BYTES = ARRAYS_PER_ITERATION * 1000 * 4;
const MAX_ITERATION_BYTES = ARRAYS_PER_ITERATION * 1000 * 8;
/** Warmup allocates far more than a measured iteration, so any leak of warmup into the sum is obvious. */
const WARMUP_ARRAYS = ARRAYS_PER_ITERATION * 8;

const STUB_PAGE = `<!doctype html><html><body><script>
(async () => {
    const hooksPresent =
        typeof window.__benchmarkMemoryStart === 'function' && typeof window.__benchmarkMemoryStop === 'function';
    // Garbage that is dead by the time the iteration ends: only a sampler that includes objects
    // already collected by GC can see it.
    const churn = (arrays) => {
        let last = 0;
        for (let i = 0; i < arrays; i++) last += new Array(1000).fill(i).length;
        return last;
    };

    for (let i = 0; i < ${WARMUP_ITERATIONS}; i++) churn(${WARMUP_ARRAYS});

    const bytes = [];
    for (let i = 0; i < ${MEASURED_ITERATIONS}; i++) {
        if (hooksPresent) await window.__benchmarkMemoryStart();
        churn(${ARRAYS_PER_ITERATION});
        if (hooksPresent) bytes.push(await window.__benchmarkMemoryStop());
    }

    window.__benchmarkResults = { hooksPresent, bytes };
    window.__benchmarkComplete = true;
})();
</script></body></html>`;

interface StubReport {
    memoryPass?: { samplingIntervalBytes: number };
    summary: { success: number; error: number; timeout: number };
    examples: Record<string, { status: string; data?: { hooksPresent: boolean; bytes: Array<number | null> } }>;
}

function serveStub(): Promise<http.Server> {
    const server = http.createServer((_req, res) => {
        res.setHeader('content-type', 'text/html');
        res.end(STUB_PAGE);
    });
    return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function runRunner(baseUrl: string, example: string, extraArgs: string[]): Promise<StubReport> {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-memory-'));
    const output = path.join(dir, 'report.json');
    const args = ['tsx', RUNNER, '--base-url', baseUrl, '--examples', example, '--output', output, ...extraArgs];
    return new Promise((resolve, reject) => {
        execFile('npx', args, { cwd: REPO_ROOT, encoding: 'utf8', timeout: 120_000 }, (error, stdout, stderr) => {
            try {
                if (error) throw new Error(`runner failed: ${error.message}\n${stdout}\n${stderr}`);
                resolve(JSON.parse(fs.readFileSync(output, 'utf8')) as StubReport);
            } catch (e) {
                reject(e);
            } finally {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        });
    });
}

test('memory pass: hooks report bytes allocated per measured iteration, counting garbage already collected', async () => {
    const [example] = discoverExamples();
    const server = await serveStub();
    try {
        const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        const report = await runRunner(baseUrl, example, ['--memory']);

        assert.equal(report.summary.success, 1);
        const data = report.examples[example].data;
        assert.ok(data, 'example produced no result');
        assert.equal(data.hooksPresent, true);
        assert.equal(data.bytes.length, MEASURED_ITERATIONS);

        for (const bytes of data.bytes) {
            assert.equal(typeof bytes, 'number');
            // Sampling is statistical, so allow a margin around the 8-16 MB actually allocated. A sampler
            // that missed collected objects would report a few hundred KB at most; one that included the
            // (8x larger) warmup would be far above the upper bound.
            assert.ok(
                bytes! > MIN_ITERATION_BYTES * 0.7,
                `expected at least ${MIN_ITERATION_BYTES} bytes, got ${bytes}`
            );
            assert.ok(
                bytes! < MAX_ITERATION_BYTES * 1.3,
                `expected at most ${MAX_ITERATION_BYTES} bytes, got ${bytes}`
            );
        }
    } finally {
        server.close();
    }
});

test('memory pass: the report is marked as a memory pass with a sampling interval of 4096 bytes or smaller', async () => {
    const [example] = discoverExamples();
    const server = await serveStub();
    try {
        const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        const report = await runRunner(baseUrl, example, ['--memory']);
        assert.ok(report.memoryPass, 'a memory pass report must be distinguishable from a timing report');
        assert.ok(report.memoryPass.samplingIntervalBytes <= 4096);
        assert.ok(report.memoryPass.samplingIntervalBytes > 0);
    } finally {
        server.close();
    }
});

test('timing pass: no memory hooks are exposed and the report carries no memory-pass marker', async () => {
    const [example] = discoverExamples();
    const server = await serveStub();
    try {
        const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        const report = await runRunner(baseUrl, example, []);

        assert.equal(report.summary.success, 1);
        const data = report.examples[example].data;
        assert.ok(data, 'example produced no result');
        // The page must see exactly what it saw before this change, so it takes the unsampled path.
        assert.equal(data.hooksPresent, false);
        assert.deepEqual(data.bytes, []);
        assert.equal(report.memoryPass, undefined);
    } finally {
        server.close();
    }
});
