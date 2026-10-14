const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const yaml = require('js-yaml');

const { COMPARE, MB, MERGE, lastCells, node, report, result, runCompare, withFiles } = require('./memory-fixtures');

/**
 * End-to-end plumbing of the memory pass as CI uses it: shard reports -> merge-browser-results.js ->
 * compare-browser-results.js, plus the shape of the workflow and local scripts that wire them together.
 */

const BENCHMARK_DIR = __dirname;
const REPO_ROOT = path.resolve(BENCHMARK_DIR, '../..');

function merge(output, inputs) {
    const proc = node(MERGE, ['--output', output, ...inputs]);
    assert.equal(proc.status, 0, proc.stderr);
    return JSON.parse(fs.readFileSync(output, 'utf8'));
}

const timing = report({
    'high-perf-bar': [result('create'), result('update')],
    'data-selection-zoom-line-area': [result('line')],
});

const memoryReport = (examples) => report(examples, { memory: true });

test('shard memory reports merge into one report whose allocation survives to the comparison', () => {
    withFiles(
        {
            timing,
            // One shard per side holds each example, exactly as the sharded CI job produces them.
            headShard0: memoryReport({
                'high-perf-bar': [result('create', { allocationMb: 30 }), result('update', { allocationMb: 4 })],
            }),
            headShard1: memoryReport({ 'data-selection-zoom-line-area': [result('line', { allocationMb: 12.5 })] }),
            baseShard0: memoryReport({
                'high-perf-bar': [result('create', { allocationMb: 40 }), result('update', { allocationMb: 4 })],
            }),
            baseShard1: memoryReport({ 'data-selection-zoom-line-area': [result('line', { allocationMb: 10 })] }),
        },
        (p) => {
            const headMem = path.join(p.dir, 'head.mem.json');
            const baseMem = path.join(p.dir, 'base.mem.json');
            const mergedHead = merge(headMem, [p.headShard0, p.headShard1]);
            merge(baseMem, [p.baseShard0, p.baseShard1]);

            // Merging keeps every result's allocation untouched.
            assert.equal(mergedHead.examples['high-perf-bar'].data.results[0].allocation.bytesPerIteration, 30 * MB);

            const out = runCompare(
                { base: p.timing, compare: p.timing, baseMemory: baseMem, compareMemory: headMem },
                { format: 'json' }
            );
            assert.equal(out.status, 0, out.stderr);
            const rows = Object.fromEntries(out.json.rankedByTime.map((r) => [r.test, r]));
            assert.equal(rows['high-perf-bar / create'].beforeMb, 40);
            assert.equal(rows['high-perf-bar / create'].afterMb, 30);
            assert.equal(rows['high-perf-bar / create'].deltaMb, -10);
            assert.equal(rows['high-perf-bar / update'].deltaMb, 0);
            assert.equal(rows['data-selection-zoom-line-area / line'].deltaMb, 2.5);
        }
    );
});

test('a memory pass that covers only some examples leaves the others as an em dash in the table', () => {
    withFiles(
        {
            timing,
            // The memory pass is limited to high-perf-* and data-selection-zoom-*, so other examples have no data.
            baseMem: memoryReport({ 'high-perf-bar': [result('create', { allocationMb: 40 })] }),
            headMem: memoryReport({ 'high-perf-bar': [result('create', { allocationMb: 30 })] }),
        },
        (p) => {
            const out = runCompare({
                base: p.timing,
                compare: p.timing,
                baseMemory: p.baseMem,
                compareMemory: p.headMem,
            });
            assert.equal(out.status, 0, out.stderr);

            const row = (name) => out.stdout.split('\n').find((line) => line.includes(name));
            // Cells are `| test | % | Before (ms) | After (ms) | Before (MB) | After (MB) | Δ (MB) |`.
            assert.deepEqual(lastCells(row('high-perf-bar / create'), 3), ['40.00', '30.00', '-10.00']);
            assert.deepEqual(lastCells(row('high-perf-bar / update'), 3), ['—', '—', '—']);
            assert.match(out.stdout, /Δ \(MB\)/);
        }
    );
});

test('a memory pass that recorded nothing on one side shows an em dash and does not fail', () => {
    withFiles(
        {
            timing,
            // A base site built before the memory pass existed: the pass ran but recorded nothing.
            baseMem: memoryReport({ 'high-perf-bar': [result('create'), result('update')] }),
            headMem: memoryReport({
                'high-perf-bar': [result('create', { allocationMb: 30 }), result('update', { allocationMb: 4 })],
            }),
        },
        (p) => {
            const paths = { base: p.timing, compare: p.timing, baseMemory: p.baseMem, compareMemory: p.headMem };
            const out = runCompare(paths, { format: 'json' });
            assert.equal(out.status, 0, out.stderr);
            assert.deepEqual(out.json.rankedByAllocation, []);
            assert.deepEqual(out.json.notable, []);
            // The head side still shows its figure; only the base side and the delta are unknown.
            const create = out.json.rankedByTime.find((r) => r.test === 'high-perf-bar / create');
            assert.deepEqual([create.beforeMb, create.afterMb, create.deltaMb], [null, 30, null]);

            const table = runCompare(paths);
            assert.equal(table.status, 0, table.stderr);
            assert.match(table.stdout, /0 of 3 with data on both sides/);
            assert.match(table.stdout, /Allocation: 0 lower, 0 higher/);
        }
    );
});

test('a memory pass with no examples at all counts as missing data', () => {
    withFiles({ timing, baseMem: memoryReport({}), headMem: memoryReport({}) }, (p) => {
        const out = runCompare(
            { base: p.timing, compare: p.timing, baseMemory: p.baseMem, compareMemory: p.headMem },
            { format: 'json' }
        );
        assert.equal(out.status, 0, out.stderr);
        assert.deepEqual(out.json.rankedByAllocation, []);
    });
});

test('only one side having a memory report still compares, with the other side as an em dash', () => {
    withFiles({ timing, headMem: memoryReport({ 'high-perf-bar': [result('create', { allocationMb: 30 })] }) }, (p) => {
        const out = runCompare({ base: p.timing, compare: p.timing, compareMemory: p.headMem });
        assert.equal(out.status, 0, out.stderr);
        const line = out.stdout.split('\n').find((l) => l.includes('high-perf-bar / create'));
        assert.deepEqual(lastCells(line, 3), ['—', '30.00', '—']);
    });
});

test('output has no allocation columns when no memory reports are supplied', () => {
    withFiles({ timing }, (p) => {
        const out = runCompare({ base: p.timing, compare: p.timing });
        assert.equal(out.status, 0, out.stderr);
        assert.doesNotMatch(out.stdout, /MB/);
        assert.doesNotMatch(out.stdout, /Allocation/);
    });
});

test('a timing regression is still gated when allocation improves, and an allocation increase does not trip the gate', () => {
    const slow = report({ 'high-perf-bar': [result('create', { timings: [50, 50, 50] })] });
    const fast = report({ 'high-perf-bar': [result('create', { timings: [10, 10, 10] })] });
    withFiles(
        {
            fast,
            slow,
            lessMem: memoryReport({ 'high-perf-bar': [result('create', { allocationMb: 1 })] }),
            moreMem: memoryReport({ 'high-perf-bar': [result('create', { allocationMb: 500 })] }),
        },
        (p) => {
            // Slower head with a big allocation win: the regression must still fail the run. Only the
            // table format sets the exit code, so that is the one CI gates on.
            const regressed = { base: p.fast, compare: p.slow, baseMemory: p.moreMem, compareMemory: p.lessMem };
            const failing = runCompare(regressed);
            assert.equal(failing.status, 1);
            assert.match(failing.stdout, /Notable Regressions/);
            assert.deepEqual(runCompare(regressed, { format: 'json' }).json.notable, ['high-perf-bar / create']);

            // Same timings with a huge allocation increase: nothing to flag.
            const grew = { base: p.fast, compare: p.fast, baseMemory: p.lessMem, compareMemory: p.moreMem };
            const passing = runCompare(grew);
            assert.equal(passing.status, 0);
            assert.doesNotMatch(passing.stdout, /Notable Regressions/);
            const parsed = runCompare(grew, { format: 'json' }).json;
            assert.deepEqual(parsed.notable, []);
            assert.equal(parsed.rankedByTime[0].deltaMb, 499);
        }
    );
});

test('allocation deltas within the sampling noise band are left out of the ranking and the higher/lower counts', () => {
    withFiles(
        {
            timing,
            baseMem: memoryReport({
                'high-perf-bar': [
                    result('create', { allocationMb: 40, stdErrMb: 1 }),
                    result('update', { allocationMb: 4, stdErrMb: 0.1 }),
                ],
                'data-selection-zoom-line-area': [result('line', { allocationMb: 10 })],
            }),
            headMem: memoryReport({
                'high-perf-bar': [
                    // +1.5 MB against a +/-2.83 MB band: noise.
                    result('create', { allocationMb: 41.5, stdErrMb: 1 }),
                    // -2 MB against a +/-0.28 MB band: a real change.
                    result('update', { allocationMb: 2, stdErrMb: 0.1 }),
                ],
                // No standard error recorded: the change is shown, but cannot be judged.
                'data-selection-zoom-line-area': [result('line', { allocationMb: 12 })],
            }),
        },
        (p) => {
            const paths = { base: p.timing, compare: p.timing, baseMemory: p.baseMem, compareMemory: p.headMem };
            const { json } = runCompare(paths, { format: 'json' });
            assert.deepEqual(
                json.rankedByAllocation.map((r) => r.test),
                ['high-perf-bar / update', 'data-selection-zoom-line-area / line']
            );
            const create = json.rankedByTime.find((r) => r.test === 'high-perf-bar / create');
            assert.equal(create.deltaMb, 1.5);
            assert.equal(create.withinNoise, true);

            const table = runCompare(paths);
            assert.equal(table.status, 0, table.stderr);
            const row = table.stdout.split('\n').find((l) => l.includes('high-perf-bar / create'));
            assert.deepEqual(lastCells(row, 1), ['+1.50 (noise)']);
            assert.match(table.stdout, /Allocation: 1 lower, 1 higher, 1 within sampling noise \(1 of the changes/);
        }
    );
});

test('a merged memory report keeps its marker, so it is rejected as a timing input', () => {
    withFiles(
        {
            timing,
            shard0: memoryReport({ 'high-perf-bar': [result('create', { allocationMb: 30 })] }),
            shard1: memoryReport({ 'data-selection-zoom-line-area': [result('line', { allocationMb: 12.5 })] }),
        },
        (p) => {
            const mergedPath = path.join(p.dir, 'merged.json');
            const merged = merge(mergedPath, [p.shard0, p.shard1]);
            assert.deepEqual(merged.memoryPass, { samplingIntervalBytes: 4096 });

            for (const paths of [
                { base: mergedPath, compare: p.timing },
                { base: p.timing, compare: mergedPath },
            ]) {
                const out = runCompare(paths);
                assert.equal(out.status, 2);
                assert.match(out.stderr, /memory-pass report/);
            }
        }
    );
});

test('merged timing reports carry no memory marker', () => {
    withFiles(
        {
            shard0: report({ 'high-perf-bar': [result('create')] }),
            shard1: report({ 'data-selection-zoom-line-area': [result('line')] }),
        },
        (p) => {
            const merged = merge(path.join(p.dir, 'merged.json'), [p.shard0, p.shard1]);
            assert.equal('memoryPass' in merged, false);
        }
    );
});

test('memory-pass and timing shards cannot be merged together', () => {
    withFiles(
        {
            mem: memoryReport({ 'high-perf-bar': [result('create', { allocationMb: 30 })] }),
            time: report({ 'data-selection-zoom-line-area': [result('line')] }),
        },
        (p) => {
            const proc = node(MERGE, ['--output', path.join(p.dir, 'merged.json'), p.mem, p.time]);
            assert.equal(proc.status, 1);
            assert.match(proc.stderr, /cannot be merged together/);
        }
    );
});

// --- CI workflow wiring ---

const workflow = yaml.load(fs.readFileSync(path.join(REPO_ROOT, '.github/workflows/benchmark.yml'), 'utf8'));
const benchmarkSteps = workflow.jobs.benchmark.steps;
const reportSteps = workflow.jobs.report.steps;
const runOf = (step) => step.run ?? '';

test('workflow: timing passes never attach heap sampling', () => {
    const timingStep = benchmarkSteps.find((s) => runOf(s).includes('run_one'));
    assert.ok(timingStep, 'timing step not found');
    assert.doesNotMatch(runOf(timingStep), /--memory/);
});

test('workflow: a separate memory pass runs once per side per shard, after the timing passes', () => {
    const timingIndex = benchmarkSteps.findIndex((s) => runOf(s).includes('run_one'));
    const memoryIndex = benchmarkSteps.findIndex((s) => runOf(s).includes('--memory'));
    assert.ok(memoryIndex > timingIndex, 'memory pass must be its own step after the timing step');

    const script = runOf(benchmarkSteps[memoryIndex]);
    // One invocation per side, and no loop around it (the timing step loops AG_BENCHMARK_RUNS times).
    assert.equal((script.match(/memory_one head /g) ?? []).length, 1);
    assert.equal((script.match(/memory_one base /g) ?? []).length, 1);
    assert.doesNotMatch(script, /AG_BENCHMARK_RUNS/);
    // It serves the same per-side sites as the timing passes, so an npm: base is measured on the
    // head site with the published bundles swapped in.
    assert.match(script, /--dist "\$\{RUNNER_TEMP\}\/site-\$\{role\}"/);
    const timingScript = runOf(benchmarkSteps[timingIndex]);
    assert.match(timingScript, /--dist "\$\{RUNNER_TEMP\}\/site-\$\{role\}"/);
});

test('workflow: the memory pass is advisory and writes per-shard reports that the artifact upload picks up', () => {
    const step = benchmarkSteps.find((s) => runOf(s).includes('--memory'));
    assert.match(runOf(step), /\|\|\s*\\?\s*\n?\s*echo "::warning::/);
    assert.match(runOf(step), /shards\/\$\{role\}-\$\{\{ strategy\.job-index \}\}\.mem\.json/);
    const upload = benchmarkSteps.find((s) => (s.uses ?? '').startsWith('actions/upload-artifact'));
    assert.equal(upload.with.path, 'reports/browser-benchmarks/shards/*');
});

test('workflow: the report job merges memory shards per side and hands them to the comparison', () => {
    const mergeStep = reportSteps.find((s) => runOf(s).includes('merge-browser-results.js'));
    assert.match(runOf(mergeStep), /\.mem\.json/);
    const compareStep = reportSteps.find((s) => runOf(s).includes('compare-browser-results.js'));
    assert.match(runOf(compareStep), /--base-memory/);
    assert.match(runOf(compareStep), /--compare-memory/);
    // The merged memory reports never enter the timing run list.
    assert.doesNotMatch(runOf(compareStep), /--base "\$\{?base\.mem/);
});

test('workflow: a memory merge failure warns instead of failing the report job', () => {
    const mergeStep = reportSteps.find((s) => runOf(s).includes('.mem.json'));
    assert.match(
        runOf(mergeStep),
        /\.mem\.json" "\$\{mem_shards\[@\]\}" \|\| \\\s*\n\s*echo "::warning::\$\{side\} memory reports could not be merged/
    );
});

test('workflow: the memory example pattern, when limited, covers the high-perf and data-selection-zoom examples', () => {
    const pattern = new RegExp(workflow.env.AG_MEMORY_EXAMPLE_PATTERN);
    for (const name of ['high-perf-bar', 'high-perf-bar-stacked', 'data-selection-zoom-line-area']) {
        assert.match(name, pattern);
    }
    assert.doesNotMatch('simple-chart', pattern);
});

test('compare-browser-latest.sh parses and offers the memory pass flag', () => {
    const script = path.join(BENCHMARK_DIR, 'compare-browser-latest.sh');
    const syntax = spawnSync('bash', ['-n', script], { encoding: 'utf8' });
    assert.equal(syntax.status, 0, syntax.stderr);
    assert.match(fs.readFileSync(script, 'utf8'), /getopts "[a-z]*m[a-z]*n:"/);
});
