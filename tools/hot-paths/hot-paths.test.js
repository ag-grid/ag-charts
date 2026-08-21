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
        assert.ok(ex.testCases.length > 0, `${ex.name} has no test cases`);
        // An opaque example cannot be matched on its cases, and its series would be
        // invisible — so a dynamic shape the reader does not understand must fail here.
        assert.ok(
            !ex.testCases.includes('<dynamic>'),
            `${ex.name} builds test cases in a shape readExample cannot derive`
        );
    }
});

test('benchmark map: a series is recommended only where an example runs it', () => {
    const { examples, command } = recommend([
        'packages/ag-charts-community/src/chart/series/cartesian/bubbleSeries.ts',
    ]);
    assert.ok(examples.length > 0, 'bubble is covered by data-selection-zoom-xy');
    for (const ex of examples) {
        const ran = allExamples().find((e) => e.name === ex.name);
        assert.ok(
            [...ran.types, ...ran.variants].includes('bubble'),
            `${ex.name} does not run bubble, so a clean run there is not evidence`
        );
    }
    assert.match(command, /^\/benchmarks /);
});

test('benchmark map: an uncovered series recommends nothing and says why', () => {
    for (const path of [
        'packages/ag-charts-enterprise/src/series/pie/pieSeries.ts',
        'packages/ag-charts-enterprise/src/series/heatmap/heatmapSeries.ts',
        'packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts',
    ]) {
        const { examples, command, notes } = recommend([path]);
        assert.deepEqual(examples, [], `${path} must not borrow another series' benchmark`);
        assert.equal(command, null);
        assert.ok(
            notes.some((n) => /No benchmark example exercises/.test(n)),
            `${path} needs a note saying the browser suite cannot evidence it`
        );
    }
});

test('benchmark map: scale paths do not leak into series tags', () => {
    // `line` must not match `linearScale`, and the generic time rule must not
    // claim the specialised time scales.
    assert.ok(!tagsFor(['packages/ag-charts-community/src/scale/linearScale.ts']).types.includes('line'));
    const unit = tagsFor(['packages/ag-charts-community/src/scale/unitTimeScale.ts']).types;
    assert.deepEqual(unit, ['unit-time']);
    const ordinal = tagsFor(['packages/ag-charts-community/src/scale/ordinalTimeScale.ts']).types;
    assert.deepEqual(ordinal, ['ordinal-time']);
});

test('benchmark map: a zoom change can select the dynamic zoom examples', () => {
    const { examples } = recommend(['packages/ag-charts-community/src/chart/interaction/zoomManager.ts']);
    assert.ok(
        examples.some((e) => e.name.startsWith('data-selection-zoom-')),
        'the data-selection-zoom examples measure zoom and must be selectable by a zoom-tagged change'
    );
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
