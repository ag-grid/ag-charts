const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const { analyse, globToRegExp, insideLoop, resolveRange } = require('./detect');
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

test('benchmark map CLI: reads paths piped in on stdin', () => {
    // `input` gives the child a pipe, which is what made readFileSync(0) throw
    // EAGAIN — the documented `git diff --name-only | benchmark-map.js` form.
    const out = execFileSync(process.execPath, [path.join(__dirname, 'benchmark-map.js')], {
        input: 'packages/ag-charts-community/src/scale/unitTimeScale.ts\n',
        encoding: 'utf8',
    });
    const result = JSON.parse(out);
    assert.deepEqual(result.tags.types, ['unit-time']);
    assert.match(result.command, /axes-1M-unit-time/);
});

test('insideLoop: a one-line callback is in-loop work', () => {
    const lines = ['function build(data) {', '    return data.map((d) => ({ x: d.x, y: d.y }));', '}'];
    const hit = insideLoop(lines, 2);
    assert.ok(hit, 'a loop whose body is on its own line runs per item');
    assert.equal(hit.line, 2);
});

test('insideLoop: a loop opener whose body follows is not itself in-loop', () => {
    // The body lines are scored in their own right; counting the opener too would
    // score every added loop as in-loop work.
    const lines = ['function build(data) {', '    for (const d of data) {', '        use(d);', '    }', '}'];
    assert.equal(insideLoop(lines, 2), null);
    assert.ok(insideLoop(lines, 3), 'the body line is inside the loop');
});

test('benchmark map: a log-scale change is not evidenced by number-axis examples', () => {
    const { tags, examples, notes } = recommend(['packages/ag-charts-community/src/scale/logScale.ts']);
    assert.deepEqual(tags.types, ['log']);
    assert.deepEqual(examples, [], 'no example declares a log axis');
    assert.ok(notes.some((n) => /No benchmark example exercises log/.test(n)));
});

test('benchmark map: the cap covers every changed type, or names what it dropped', () => {
    const paths = [
        'packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts',
        'packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts',
        'packages/ag-charts-community/src/chart/series/cartesian/areaSeries.ts',
        'packages/ag-charts-community/src/chart/series/cartesian/bubbleSeries.ts',
        'packages/ag-charts-community/src/chart/series/cartesian/histogramSeries.ts',
        'packages/ag-charts-enterprise/src/series/ohlc/ohlcSeries.ts',
    ];
    const { tags, examples, notes } = recommend(paths);
    const all = allExamples();
    const represented = new Set(
        examples.flatMap((e) => {
            const ex = all.find((x) => x.name === e.name);
            return [...ex.types, ...ex.variants];
        })
    );
    for (const type of tags.types) {
        const covered = represented.has(type);
        const flagged = notes.some((n) => n.includes(type));
        assert.ok(covered || flagged, `${type} is neither in the command nor named in a note`);
    }
});

test('globToRegExp: /**/ matches zero directories', () => {
    const re = globToRegExp('packages/*/src/chart/series/**/*Node.ts');
    assert.ok(re.test('packages/ag-charts-community/src/chart/series/fooNode.ts'), 'a direct child must match');
    assert.ok(re.test('packages/ag-charts-community/src/chart/series/cartesian/fooNode.ts'));
    assert.ok(!re.test('packages/a/b/src/chart/series/fooNode.ts'), '* must not cross a directory');
});

test('insideLoop: a multiline array callback is a loop, not a scope boundary', () => {
    // Prettier splits the arrow onto its own line once the call does not fit, and
    // the body is still per-item work.
    const lines = [
        'function build(data) {',
        '    return data.map(',
        '        (datum) => {',
        '            return { x: datum.x };',
        '        }',
        '    );',
        '}',
    ];
    const hit = insideLoop(lines, 4);
    assert.ok(hit, 'the body of a multiline .map() callback runs per item');
    assert.equal(hit.line, 2, 'the enclosing loop is the .map( call');
});

test('insideLoop: a real function boundary still ends the walk', () => {
    const lines = [
        '    for (const d of data) {',
        '        register(d);',
        '    }',
        '',
        '    private helper() {',
        '        compute();',
        '    }',
    ];
    assert.equal(insideLoop(lines, 6), null, 'a method boundary must stop the outward walk');
});

test('benchmark map: shared series bases recommend the scaled examples', () => {
    for (const path of [
        'packages/ag-charts-community/src/chart/series/series.ts',
        'packages/ag-charts-community/src/chart/series/dataModelSeries.ts',
        'packages/ag-charts-community/src/chart/series/cartesian/cartesianSeries.ts',
    ]) {
        const { command } = recommend([path]);
        assert.ok(command, `${path} runs in every scaled example and must name something to measure`);
    }
});

test('resolveRange: three dots resolve the fork point, two dots do not', () => {
    // A review wants the fork point, so the range form the guidelines document for
    // it has to mean that — not a comparison against wherever the base now sits.
    const three = resolveRange(['--range', 'HEAD~1...HEAD']);
    assert.match(three.base, /^[0-9a-f]{40}$/, 'three-dot base is a resolved merge-base');
    assert.equal(three.head, 'HEAD');

    const two = resolveRange(['--range', 'HEAD~1..HEAD']);
    assert.equal(two.base, 'HEAD~1', 'two-dot passes the revisions through untouched');
    assert.equal(two.head, 'HEAD');
});

test('the documented JSON schema names exactly the fields the detector emits', () => {
    // A review pass reads the shape from the skill, so drift between the two is a
    // contract break the detector cannot report on itself.
    const skill = fs.readFileSync(path.join(__dirname, '../../.rulesync/skills/hot-paths/SKILL.md'), 'utf8');
    const block = /The shape:\n\n```\n([\s\S]*?)```/.exec(skill);
    assert.ok(block, 'the skill documents the output shape');

    const documented = new Set(
        block[1]
            .split('\n')
            .filter((line) => line && !/^\s/.test(line)) // continuation lines describe a field, not a new one
            .map((line) => line.split(/\s{2,}/)[0])
            .flatMap((names) => names.split(',').map((n) => n.trim().replace(/\[\]$/, '')))
    );

    const emitted = new Set(Object.keys(analyse({ base: 'HEAD~1', head: 'HEAD', label: 'schema check' })));
    assert.deepEqual(
        [...emitted].filter((k) => !documented.has(k)),
        [],
        'every emitted field is documented'
    );
    assert.deepEqual(
        [...documented].filter((k) => !emitted.has(k)),
        [],
        'every documented field is emitted'
    );
});

test('insideLoop: a listener declared inside a loop is not per-iteration work', () => {
    // The arrow body runs when the event fires, not once per turn of the loop it was
    // registered in, so charging the loop's frequency to it is a false positive.
    const lines = [
        'for (const series of allSeries) {',
        "    series.addEventListener('click', (event) => {",
        '        const point = { x: event.x, y: event.y };',
        '    });',
        '}',
    ];
    assert.equal(insideLoop(lines, 3), null);
});

test('insideLoop: a predicate a helper calls straight away stays in-loop', () => {
    // Same arrow shape as the listener above. `dropLastWhile` invokes it per element,
    // so the enclosing loop's frequency is the right one to charge — real code in
    // `generateTicksUtils.ts` does exactly this, and an arrow-is-a-boundary rule
    // loses it.
    const lines = [
        'for (let i = 0; i < ticks.length; i++) {',
        '    dropLastWhile(intervalTicks, (lastTick) => {',
        '        return lastTick.valueOf() >= p1.valueOf();',
        '    });',
        '}',
    ];
    const hit = insideLoop(lines, 3);
    assert.ok(hit, 'the enclosing loop is still found');
    assert.equal(hit.line, 1);
});
