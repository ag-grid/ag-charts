const assert = require('node:assert/strict');
const test = require('node:test');

const {
    aggregateAllocation,
    allocationChange,
    extractAllocationRun,
    formatMb,
    sumSamplingProfileBytes,
} = require('./allocation');
const { MB, exampleEntry, report, result } = require('./memory-fixtures');

const keyFn = (exampleName, r) => `${exampleName}|${r.testCase}`;
const side = (mb, stdErrMb = null) => ({ bytes: mb * MB, stdErrBytes: stdErrMb === null ? null : stdErrMb * MB });

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
        {
            examples: {
                ok: exampleEntry([result('create', { allocationMb: 2, stdErrMb: 0.5 }), result('zoom')]),
                failed: exampleEntry([result('create', { allocationMb: 9 })], 'error'),
                odd: exampleEntry([
                    { ...result('nan'), allocation: { bytesPerIteration: Number.NaN } },
                    { ...result('neg'), allocation: { bytesPerIteration: -5 } },
                    { ...result('str'), allocation: { bytesPerIteration: '12' } },
                ]),
            },
        },
        keyFn
    );
    assert.deepEqual([...run], [['ok|create', { bytes: 2 * MB, stdErrBytes: 0.5 * MB }]]);
});

test('extractAllocationRun keeps a genuine zero, and a missing or invalid standard error as null', () => {
    const run = extractAllocationRun(
        report({
            ok: [
                result('idle', { allocationMb: 0 }),
                { ...result('bad'), allocation: { bytesPerIteration: MB, stdErrBytes: -1 } },
            ],
        }),
        keyFn
    );
    assert.deepEqual(run.get('ok|idle'), { bytes: 0, stdErrBytes: null });
    assert.deepEqual(run.get('ok|bad'), { bytes: MB, stdErrBytes: null });
});

test('aggregateAllocation takes the median bytes and standard error across reports and ignores gaps', () => {
    const reports = [
        report({ ok: [result('create', { allocationMb: 1, stdErrMb: 0.1 })] }),
        report({ ok: [result('create', { allocationMb: 5, stdErrMb: 0.3 })] }),
        report({ ok: [result('create', { allocationMb: 3, stdErrMb: 0.2 })] }),
        report({ ok: [result('create')] }),
    ];
    assert.deepEqual(aggregateAllocation(reports, keyFn).get('ok|create'), { bytes: 3 * MB, stdErrBytes: 0.2 * MB });
});

// --- change and formatting ---

test('allocationChange reports MB, delta and percentage when both sides have data', () => {
    const change = allocationChange(side(4), side(3));
    assert.deepEqual(change, {
        beforeMb: 4,
        afterMb: 3,
        deltaMb: -1,
        pctChange: -25,
        noiseMb: null,
        withinNoise: null,
    });
});

test('allocationChange keeps the side that has data but gives no delta without both', () => {
    const only = (beforeMb, afterMb) => ({
        beforeMb,
        afterMb,
        deltaMb: null,
        pctChange: null,
        noiseMb: null,
        withinNoise: null,
    });
    assert.deepEqual(allocationChange(undefined, side(3)), only(null, 3));
    assert.deepEqual(allocationChange(side(3), undefined), only(3, null));
    assert.deepEqual(allocationChange(undefined, undefined), only(null, null));
});

test('allocationChange has no percentage against a zero baseline', () => {
    const change = allocationChange(side(0), side(1));
    assert.equal(change.deltaMb, 1);
    assert.equal(change.pctChange, null);
});

test('allocationChange puts deltas within two combined standard errors inside the noise band', () => {
    // Combined standard error is 0.5 MB, so the band is +/-1 MB.
    const noise = allocationChange(side(10, 0.3), side(10.9, 0.4));
    assert.equal(noise.noiseMb, 1);
    assert.equal(noise.withinNoise, true);
    assert.equal(allocationChange(side(10, 0.3), side(11.1, 0.4)).withinNoise, false);
    assert.equal(allocationChange(side(10, 0.3), side(8.9, 0.4)).withinNoise, false);
});

test('allocationChange cannot judge noise when either side has no standard error', () => {
    assert.equal(allocationChange(side(10, 0.3), side(20)).withinNoise, null);
    assert.equal(allocationChange(side(10), side(20, 0.3)).noiseMb, null);
});

test('allocationChange treats any delta as a change when both standard errors are zero', () => {
    assert.equal(allocationChange(side(10, 0), side(10, 0)).withinNoise, true);
    assert.equal(allocationChange(side(10, 0), side(10.01, 0)).withinNoise, false);
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
