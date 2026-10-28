const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { meanCosts, mergeCosts, parseArgs, sumCosts } = require('./update-benchmark-costs');

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

test('parseArgs treats every argument that is not a flag or its value as a run directory', () => {
    const dirs = ['run-1', 'run-2', 'run-3'];
    const expected = { dirs, source: 'a note', costsPath: undefined };
    assert.deepEqual(parseArgs([...dirs, '--source', 'a note']), expected);
    assert.deepEqual(parseArgs(['--source', 'a note', ...dirs]), expected);
    assert.deepEqual(parseArgs(['run-1', '--source', 'a note', 'run-2', 'run-3']), expected);
    assert.deepEqual(parseArgs(['run-1']), { dirs: ['run-1'], source: undefined, costsPath: undefined });
});

test('parseArgs never reads a flag value as a directory', () => {
    assert.deepEqual(parseArgs(['run-1', '--costs', 'c.json', '--source', 'run-2']), {
        dirs: ['run-1'],
        source: 'run-2',
        costsPath: 'c.json',
    });
});

test('parseArgs reports usage when there is no directory, a flag has no value or a flag is unknown', () => {
    for (const args of [
        [],
        ['--source', 'note'],
        ['run-1', '--source'],
        ['run-1', '--costs'],
        ['run-1', '--source=x'],
    ]) {
        assert.match(parseArgs(args).error, /^Usage: /, args.join(' '));
    }
    assert.match(parseArgs(['run-1', '--bogus', 'x']).error, /^Usage: /);
});

test('the script averages several run directories into the costs table and keeps what no run covers', (t) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'benchmark-costs-'));
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    const writeRun = (dir, shards) => {
        shards.forEach((examples, i) => {
            fs.mkdirSync(path.join(tmp, dir, `bench-results-${i}`), { recursive: true });
            fs.writeFileSync(path.join(tmp, dir, `bench-results-${i}`, 'report.json'), JSON.stringify(run(examples)));
        });
    };
    // Names come from discoverExamples(), so use real ones.
    const [a, b, c] = require('./benchmark-examples').discoverExamples();
    writeRun('run-1', [{ [a]: ['success', 10_000] }, { [a]: ['success', 20_000], [b]: ['timeout', 360_000] }]);
    writeRun('run-2', [{ [a]: ['success', 50_000], [b]: ['success', 8_000] }]);
    const costsFile = path.join(tmp, 'costs.json');
    fs.writeFileSync(costsFile, JSON.stringify({ source: 'old', costs: { [c]: 77, gone: 5 } }));

    const script = path.join(__dirname, 'update-benchmark-costs.js');
    const runScript = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
    const read = () => JSON.parse(fs.readFileSync(costsFile, 'utf8'));

    // Runs are given before, between and after --source; a: (30 + 50) / 2, b only in run-2 as run-1 timed out.
    const result = runScript(
        path.join(tmp, 'run-1'),
        '--costs',
        costsFile,
        '--source',
        'two runs',
        path.join(tmp, 'run-2')
    );
    assert.equal(result.status, 0, result.stderr);
    const { source, costs } = read();
    assert.equal(source, 'two runs');
    assert.equal(costs[a], 40);
    assert.equal(costs[b], 8);
    assert.equal(costs[c], 77);
    assert.equal('gone' in costs, false);

    // A single directory gives that run's own sums and keeps the previous source without --source.
    const single = runScript(path.join(tmp, 'run-2'), '--costs', costsFile);
    assert.equal(single.status, 0, single.stderr);
    assert.deepEqual([read().source, read().costs[a], read().costs[b]], ['two runs', 50, 8]);
});

test('the script exits with an error and writes nothing on bad arguments or an empty run directory', (t) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'benchmark-costs-'));
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    const costsFile = path.join(tmp, 'costs.json');
    const original = JSON.stringify({ source: 'old', costs: {} });
    fs.writeFileSync(costsFile, original);
    fs.mkdirSync(path.join(tmp, 'empty'));

    const script = path.join(__dirname, 'update-benchmark-costs.js');
    const runScript = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

    const usage = runScript('--costs', costsFile, '--source');
    assert.equal(usage.status, 1);
    assert.match(usage.stderr, /Usage: /);

    const empty = runScript(path.join(tmp, 'empty'), '--costs', costsFile);
    assert.equal(empty.status, 1);
    assert.match(empty.stderr, /No JSON reports found under /);
    assert.equal(fs.readFileSync(costsFile, 'utf8'), original);
});
