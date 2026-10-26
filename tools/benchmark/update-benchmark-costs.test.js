const assert = require('node:assert/strict');
const test = require('node:test');

const { meanCosts, mergeCosts, sumCosts } = require('./update-benchmark-costs');

const run = (examples) => ({
    examples: Object.fromEntries(
        Object.entries(examples).map(([name, [status, durationMs]]) => [name, { status, durationMs }])
    ),
});

test('sumCosts adds an example durations across every report, in whole seconds', () => {
    const { costs, failed } = sumCosts([
        run({ a: ['success', 10_000], b: ['success', 2_400] }),
        run({ a: ['success', 20_400] }),
        // Memory-pass report: a later duration of the same example counts too.
        run({ a: ['success', 600] }),
    ]);
    assert.deepEqual(costs, { a: 31, b: 2 });
    assert.deepEqual(failed, []);
});

test('sumCosts leaves out an example that failed in any report and lists it', () => {
    const { costs, failed } = sumCosts([
        run({ ok: ['success', 5_000], hung: ['timeout', 360_000], flaky: ['success', 1_000] }),
        run({ ok: ['success', 5_000], hung: ['success', 1_000], flaky: ['error', 100] }),
    ]);
    assert.deepEqual(costs, { ok: 10 });
    assert.deepEqual(failed, ['flaky', 'hung']);
});

test('sumCosts ignores reports without examples and zero-duration examples', () => {
    const { costs } = sumCosts([{}, run({ instant: ['success', 0] }), run({ real: ['success', 1_000] })]);
    assert.deepEqual(costs, { real: 1 });
});

test('sumCosts never rounds a measured example down to a zero cost, which loadCosts would reject', () => {
    const { costs } = sumCosts([run({ quick: ['success', 300] })]);
    assert.deepEqual(costs, { quick: 1 });
});

test('meanCosts of a single run gives exactly what sumCosts gives', () => {
    const reports = [
        run({ a: ['success', 10_000], b: ['success', 2_400], hung: ['timeout', 5_000], quick: ['success', 300] }),
        run({ a: ['success', 20_400] }),
    ];
    assert.deepEqual(meanCosts([reports]), sumCosts(reports));
});

test('meanCosts averages each example per-run sum, summing the reports within a run first', () => {
    const { costs, failed } = meanCosts([
        [run({ a: ['success', 10_000] }), run({ a: ['success', 20_000], b: ['success', 4_000] })],
        [run({ a: ['success', 40_000], b: ['success', 8_000] })],
    ]);
    // a: (30 + 40) / 2, b: (4 + 8) / 2
    assert.deepEqual(costs, { a: 35, b: 6 });
    assert.deepEqual(failed, []);
});

test('meanCosts leaves an example that failed in a run out of that run mean only', () => {
    const { costs, failed } = meanCosts([
        [run({ a: ['success', 10_000], b: ['success', 100_000] })],
        // b hung in this run: its truncated duration must not drag the mean down.
        [run({ a: ['success', 30_000], b: ['timeout', 360_000] })],
        // A failed pass in one report fails the example for the whole run, even if another report succeeded.
        [run({ a: ['success', 20_000] }), run({ b: ['success', 100_000], a: ['error', 50] })],
    ]);
    assert.deepEqual(costs, { a: 20, b: 100 });
    assert.deepEqual(failed, ['a', 'b']);
});

test('meanCosts omits an example that failed in every run, so its previous cost is kept', () => {
    const { costs, failed } = meanCosts([
        [run({ ok: ['success', 5_000], hung: ['timeout', 360_000] })],
        [run({ ok: ['success', 7_000], hung: ['error', 100] })],
    ]);
    assert.deepEqual(costs, { ok: 6 });
    assert.deepEqual(failed, ['hung']);
    assert.deepEqual(mergeCosts({ hung: 99 }, costs, ['hung', 'ok']), { hung: 99, ok: 6 });
});

test('meanCosts averages an example over only the runs that cover it', () => {
    const { costs } = meanCosts([
        [run({ a: ['success', 10_000] })],
        [run({ b: ['success', 4_000] })],
        [run({ a: ['success', 20_000] })],
    ]);
    assert.deepEqual(costs, { a: 15, b: 4 });
});

test('mergeCosts prefers fresh costs, keeps previous ones for uncovered examples and drops removed examples', () => {
    const merged = mergeCosts({ fresh: 1, uncovered: 7, removed: 9 }, { fresh: 5, brandNew: 3 }, [
        'brandNew',
        'fresh',
        'uncovered',
        'neverMeasured',
    ]);
    assert.deepEqual(merged, { brandNew: 3, fresh: 5, uncovered: 7 });
});
