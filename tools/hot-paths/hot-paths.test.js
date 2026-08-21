const assert = require('node:assert/strict');
const test = require('node:test');

const { globToRegExp } = require('./detect');
const { allExamples, recommend, tagsFor } = require('./benchmark-map');

// Run with: node --test tools/hot-paths/

test('globToRegExp: ** crosses directories, * does not', () => {
    const deep = globToRegExp('packages/*/src/chart/series/**');
    assert.ok(deep.test('packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts'));
    assert.ok(!deep.test('packages/ag/nested/src/chart/series/x.ts'), '* must not cross a directory');

    const shallow = globToRegExp('packages/ag-charts-community/src/main.ts');
    assert.ok(shallow.test('packages/ag-charts-community/src/main.ts'));
    assert.ok(!shallow.test('packages/ag-charts-community/src/api/main.ts'));
});

test('globToRegExp: dots are literal, not wildcards', () => {
    const re = globToRegExp('packages/*/src/chart/chart.ts');
    assert.ok(re.test('packages/ag-charts-community/src/chart/chart.ts'));
    assert.ok(!re.test('packages/ag-charts-community/src/chart/chartX.ts'));
});

test('benchmark map: every example yields derivable metadata', () => {
    const examples = allExamples();
    assert.ok(examples.length > 20, 'expected the full benchmark example set');
    for (const ex of examples) {
        assert.ok(ex.testCases.length > 0, `${ex.name} has no test cases (nor a dynamic marker)`);
    }
});

test('benchmark map: a series change recommends that series’ examples', () => {
    const { examples, command } = recommend(['packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts']);
    assert.ok(examples.length > 0);
    // A bar-specific example must outrank a multi-series one that merely includes bars.
    assert.match(examples[0].name, /bar/);
    assert.ok(
        examples.every((e) => e.why.some((w) => w === 'subsystem' || w.startsWith('type:'))),
        `every recommendation needs a stated reason, got ${JSON.stringify(examples.map((e) => e.why))}`
    );
    assert.match(command, /^\/benchmarks /);
});

test('benchmark map: a bundle-surface change says so instead of recommending a benchmark', () => {
    const { notes } = recommend(['packages/ag-charts-community/src/module/optionsModule.ts']);
    assert.ok(
        notes.some((n) => /size-limit/.test(n)),
        'expected a size-limit note for a bundle-surface change'
    );
});

test('benchmark map: an unrecognised path recommends nothing rather than guessing', () => {
    const { examples, command } = recommend(['packages/ag-charts-website/src/pages/index.astro']);
    assert.deepEqual(examples, []);
    assert.equal(command, null);
});

test('benchmark map: scale paths map to their axis type', () => {
    assert.ok(tagsFor(['packages/ag-charts-community/src/scale/unitTimeScale.ts']).types.includes('unit-time'));
    assert.ok(tagsFor(['packages/ag-charts-community/src/scale/ordinalTimeScale.ts']).types.includes('ordinal-time'));
});
