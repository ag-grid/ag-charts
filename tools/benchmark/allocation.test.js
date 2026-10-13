const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
    BYTES_PER_MB,
    aggregateAllocation,
    allocationChange,
    extractAllocationRun,
    formatMb,
    sumSamplingProfileBytes,
} = require('./allocation');

const MB = BYTES_PER_MB;
const keyFn = (exampleName, result) => `${exampleName}|${result.testCase}`;

function report(examples, extra = {}) {
    return { timestamp: 't', environment: {}, summary: {}, examples, ...extra };
}

function example(results, status = 'success') {
    return { status, data: { version: '14.0.0', results }, durationMs: 1 };
}

function result(testCase, { allocationMb, timings = [10, 10, 10] } = {}) {
    return {
        testCase,
        params: {},
        averageTime: 10,
        minTime: 10,
        maxTime: 10,
        sampleCount: timings.length,
        timings,
        ...(allocationMb === undefined
            ? {}
            : {
                  allocation: {
                      bytesPerIteration: allocationMb * MB,
                      totalBytes: allocationMb * MB * 4,
                      iterations: 4,
                  },
              }),
    };
}

// --- sumSamplingProfileBytes ---

test('sumSamplingProfileBytes totals selfSize across the whole call tree', () => {
    const profile = {
        head: {
            selfSize: 100,
            children: [
                { selfSize: 20, children: [{ selfSize: 3, children: [] }] },
                { selfSize: 400, children: [] },
            ],
        },
    };
    assert.equal(sumSamplingProfileBytes(profile), 523);
});

test('sumSamplingProfileBytes handles a very deep tree without recursing', () => {
    let node = { selfSize: 1, children: [] };
    for (let i = 0; i < 100_000; i++) node = { selfSize: 1, children: [node] };
    assert.equal(sumSamplingProfileBytes({ head: node }), 100_001);
});

test('sumSamplingProfileBytes tolerates a missing profile, head or children', () => {
    assert.equal(sumSamplingProfileBytes(undefined), 0);
    assert.equal(sumSamplingProfileBytes({}), 0);
    assert.equal(sumSamplingProfileBytes({ head: { selfSize: 7 } }), 7);
});

// --- extraction and aggregation ---

test('extractAllocationRun keeps only results with finite, non-negative allocation', () => {
    const run = extractAllocationRun(
        report({
            ok: example([result('create', { allocationMb: 2 }), result('zoom')]),
            failed: example([result('create', { allocationMb: 9 })], 'error'),
            odd: example([
                { ...result('nan'), allocation: { bytesPerIteration: Number.NaN } },
                { ...result('neg'), allocation: { bytesPerIteration: -5 } },
                { ...result('str'), allocation: { bytesPerIteration: '12' } },
            ]),
        }),
        keyFn
    );
    assert.deepEqual([...run], [['ok|create', 2 * MB]]);
});

test('extractAllocationRun keeps a genuine zero, which is data rather than a gap', () => {
    const run = extractAllocationRun(report({ ok: example([result('idle', { allocationMb: 0 })]) }), keyFn);
    assert.equal(run.get('ok|idle'), 0);
});

test('aggregateAllocation takes the median across memory reports and ignores gaps', () => {
    const reports = [
        report({ ok: example([result('create', { allocationMb: 1 })]) }),
        report({ ok: example([result('create', { allocationMb: 5 })]) }),
        report({ ok: example([result('create', { allocationMb: 3 })]) }),
        report({ ok: example([result('create')]) }),
    ];
    assert.equal(aggregateAllocation(reports, keyFn).get('ok|create'), 3 * MB);
});

// --- change and formatting ---

test('allocationChange reports MB, delta and percentage when both sides have data', () => {
    const change = allocationChange(4 * MB, 3 * MB);
    assert.deepEqual(change, { beforeMb: 4, afterMb: 3, deltaMb: -1, pctChange: -25 });
});

test('allocationChange keeps the side that has data but gives no delta without both', () => {
    assert.deepEqual(allocationChange(undefined, 3 * MB), {
        beforeMb: null,
        afterMb: 3,
        deltaMb: null,
        pctChange: null,
    });
    assert.deepEqual(allocationChange(3 * MB, undefined), {
        beforeMb: 3,
        afterMb: null,
        deltaMb: null,
        pctChange: null,
    });
    assert.deepEqual(allocationChange(undefined, undefined), {
        beforeMb: null,
        afterMb: null,
        deltaMb: null,
        pctChange: null,
    });
});

test('allocationChange has no percentage against a zero baseline', () => {
    const change = allocationChange(0, MB);
    assert.equal(change.deltaMb, 1);
    assert.equal(change.pctChange, null);
});

test('formatMb prints two decimals, an em dash for no data and a sign for deltas', () => {
    assert.equal(formatMb(1.2345), '1.23');
    assert.equal(formatMb(null), '—');
    assert.equal(formatMb(undefined), '—');
    assert.equal(formatMb(0.5, { signed: true }), '+0.50');
    assert.equal(formatMb(-0.5, { signed: true }), '-0.50');
    assert.equal(formatMb(-0.0004, { signed: true }), '0.00');
    assert.equal(formatMb(0.0004, { signed: true }), '0.00');
});

// --- compare-browser-results.js ---

const COMPARE = path.join(__dirname, 'compare-browser-results.js');

function withReports(files, fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'compare-alloc-'));
    try {
        const paths = {};
        for (const [name, content] of Object.entries(files)) {
            paths[name] = path.join(dir, `${name}.json`);
            fs.writeFileSync(paths[name], JSON.stringify(content));
        }
        return fn(paths);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function runCompare(args, { json = true } = {}) {
    const proc = spawnSync(process.execPath, [COMPARE, ...args, '--format', json ? 'json' : 'table'], {
        encoding: 'utf8',
    });
    return {
        status: proc.status,
        stdout: proc.stdout,
        stderr: proc.stderr,
        json: json ? safeParse(proc.stdout) : null,
    };
}

function safeParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

const timings = report({ bars: example([result('create'), result('zoom')]) });

test('compare adds head, base and delta MB per matched test', () => {
    withReports(
        {
            base: timings,
            head: timings,
            baseMem: report({
                bars: example([result('create', { allocationMb: 40 }), result('zoom', { allocationMb: 8 })]),
            }),
            headMem: report({
                bars: example([result('create', { allocationMb: 30 }), result('zoom', { allocationMb: 10 })]),
            }),
        },
        (p) => {
            const out = runCompare([
                '--base',
                p.base,
                '--compare',
                p.head,
                '--base-memory',
                p.baseMem,
                '--compare-memory',
                p.headMem,
            ]);
            assert.equal(out.status, 0);
            const rows = Object.fromEntries(out.json.rankedByTime.map((r) => [r.test, r]));
            assert.equal(rows['bars / create'].beforeMb, 40);
            assert.equal(rows['bars / create'].afterMb, 30);
            assert.equal(rows['bars / create'].deltaMb, -10);
            assert.equal(rows['bars / zoom'].deltaMb, 2);
            assert.deepEqual(
                out.json.rankedByAllocation.map((r) => r.test),
                ['bars / create', 'bars / zoom']
            );
        }
    );
});

test('compare shows an em dash and does not fail when a side has no allocation data', () => {
    withReports(
        {
            base: timings,
            head: timings,
            // A base site built before the memory pass existed: the pass ran but recorded nothing.
            baseMem: report({ bars: example([result('create'), result('zoom')]) }),
            headMem: report({
                bars: example([result('create', { allocationMb: 30 }), result('zoom', { allocationMb: 10 })]),
            }),
        },
        (p) => {
            const args = [
                '--base',
                p.base,
                '--compare',
                p.head,
                '--base-memory',
                p.baseMem,
                '--compare-memory',
                p.headMem,
            ];
            const json = runCompare(args);
            assert.equal(json.status, 0);
            assert.deepEqual(json.json.rankedByAllocation, []);
            // The head side still shows its figure; only the base side and the delta are unknown.
            assert.ok(json.json.rankedByTime.every((r) => r.beforeMb === null && r.deltaMb === null));
            assert.deepEqual(json.json.rankedByTime.map((r) => r.afterMb).sort(), [10, 30]);
            assert.deepEqual(json.json.notable, []);

            const table = runCompare(args, { json: false });
            assert.equal(table.status, 0);
            assert.match(table.stdout, /Before \(MB\)/);
            assert.match(table.stdout, /—/);
            assert.match(table.stdout, /0 of 2 with data on both sides/);
        }
    );
});

test('compare treats a memory pass with no examples at all as missing data', () => {
    withReports({ base: timings, head: timings, baseMem: report({}), headMem: report({}) }, (p) => {
        const out = runCompare([
            '--base',
            p.base,
            '--compare',
            p.head,
            '--base-memory',
            p.baseMem,
            '--compare-memory',
            p.headMem,
        ]);
        assert.equal(out.status, 0);
        assert.deepEqual(out.json.rankedByAllocation, []);
    });
});

test('allocation changes never alter the timing verdicts or the exit code', () => {
    withReports(
        {
            base: timings,
            head: timings,
            baseMem: report({
                bars: example([result('create', { allocationMb: 1 }), result('zoom', { allocationMb: 1 })]),
            }),
            headMem: report({
                bars: example([result('create', { allocationMb: 900 }), result('zoom', { allocationMb: 0 })]),
            }),
        },
        (p) => {
            // No --report-only: a notable timing regression would exit 1.
            const withMemory = runCompare([
                '--base',
                p.base,
                '--compare',
                p.head,
                '--base-memory',
                p.baseMem,
                '--compare-memory',
                p.headMem,
            ]);
            const without = runCompare(['--base', p.base, '--compare', p.head]);
            assert.equal(withMemory.status, 0);
            assert.deepEqual(withMemory.json.notable, []);
            assert.deepEqual(withMemory.json.notable, without.json.notable);
            assert.deepEqual(
                withMemory.json.rankedByTime.map((r) => [r.test, r.pctTimeChange]),
                without.json.rankedByTime.map((r) => [r.test, r.pctTimeChange])
            );
        }
    );
});

test('compare output is unchanged when no memory reports are supplied', () => {
    withReports({ base: timings, head: timings }, (p) => {
        const table = runCompare(['--base', p.base, '--compare', p.head], { json: false });
        assert.equal(table.status, 0);
        assert.doesNotMatch(table.stdout, /MB/);
        assert.doesNotMatch(table.stdout, /Allocation/);
    });
});

test('compare rejects a memory-pass report given as a timing report', () => {
    withReports(
        {
            base: timings,
            memory: report(
                { bars: example([result('create', { allocationMb: 1 })]) },
                { memoryPass: { samplingIntervalBytes: 4096 } }
            ),
        },
        (p) => {
            const out = runCompare(['--base', p.base, '--compare', p.memory]);
            assert.equal(out.status, 2);
            assert.match(out.stderr, /memory-pass report/);
        }
    );
});
