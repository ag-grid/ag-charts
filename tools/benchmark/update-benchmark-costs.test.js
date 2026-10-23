const assert = require('node:assert/strict');
const test = require('node:test');

const { mergeCosts, sumCosts } = require('./update-benchmark-costs');

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

test('mergeCosts prefers fresh costs, keeps previous ones for uncovered examples and drops removed examples', () => {
    const merged = mergeCosts({ fresh: 1, uncovered: 7, removed: 9 }, { fresh: 5, brandNew: 3 }, [
        'brandNew',
        'fresh',
        'uncovered',
        'neverMeasured',
    ]);
    assert.deepEqual(merged, { brandNew: 3, fresh: 5, uncovered: 7 });
});
