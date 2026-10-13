const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const yaml = require('js-yaml');

/**
 * End-to-end plumbing of the memory pass as CI uses it: shard reports -> merge-browser-results.js ->
 * compare-browser-results.js, plus the shape of the workflow and local scripts that wire them together.
 */

const MB = 1024 * 1024;
const BENCHMARK_DIR = __dirname;
const REPO_ROOT = path.resolve(BENCHMARK_DIR, '../..');
const MERGE = path.join(BENCHMARK_DIR, 'merge-browser-results.js');
const COMPARE = path.join(BENCHMARK_DIR, 'compare-browser-results.js');

function testResult(testCase, { allocationMb, timings = [10, 10, 10] } = {}) {
    return {
        testCase,
        params: {},
        averageTime: timings[0],
        minTime: Math.min(...timings),
        maxTime: Math.max(...timings),
        sampleCount: timings.length,
        timings,
        ...(allocationMb === undefined
            ? {}
            : {
                  allocation: {
                      bytesPerIteration: allocationMb * MB,
                      totalBytes: allocationMb * MB * timings.length,
                      iterations: timings.length,
                  },
              }),
    };
}

function report(examples, { memory = false } = {}) {
    return {
        timestamp: '2026-01-01T00:00:00.000Z',
        environment: { browser: 'chromium' },
        summary: { total: Object.keys(examples).length, success: Object.keys(examples).length, error: 0, timeout: 0 },
        ...(memory && { memoryPass: { samplingIntervalBytes: 4096 } }),
        examples: Object.fromEntries(
            Object.entries(examples).map(([name, results]) => [
                name,
                { status: 'success', data: { version: '14.0.0', results }, durationMs: 1 },
            ])
        ),
    };
}

function withFiles(files, fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-pipeline-'));
    try {
        const paths = { dir };
        for (const [name, content] of Object.entries(files)) {
            paths[name] = path.join(dir, `${name}.json`);
            fs.writeFileSync(paths[name], JSON.stringify(content));
        }
        return fn(paths);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

/** Last `n` cells of a table row, with console.table's quoting around string cells removed. */
function lastCells(line, n) {
    return line
        .split('│')
        .map((c) => c.trim().replace(/^'(.*)'$/, '$1'))
        .filter(Boolean)
        .slice(-n);
}

function node(script, args) {
    return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

function merge(output, inputs) {
    const proc = node(MERGE, ['--output', output, ...inputs]);
    assert.equal(proc.status, 0, proc.stderr);
    return JSON.parse(fs.readFileSync(output, 'utf8'));
}

const timing = report({
    'high-perf-bar': [testResult('create'), testResult('update')],
    'data-selection-zoom-line-area': [testResult('line')],
});

test('shard memory reports merge into one report whose allocation survives to the comparison', () => {
    withFiles(
        {
            timing,
            // One shard per side holds each example, exactly as the sharded CI job produces them.
            headShard0: report(
                {
                    'high-perf-bar': [
                        testResult('create', { allocationMb: 30 }),
                        testResult('update', { allocationMb: 4 }),
                    ],
                },
                { memory: true }
            ),
            headShard1: report(
                { 'data-selection-zoom-line-area': [testResult('line', { allocationMb: 12.5 })] },
                { memory: true }
            ),
            baseShard0: report(
                {
                    'high-perf-bar': [
                        testResult('create', { allocationMb: 40 }),
                        testResult('update', { allocationMb: 4 }),
                    ],
                },
                { memory: true }
            ),
            baseShard1: report(
                { 'data-selection-zoom-line-area': [testResult('line', { allocationMb: 10 })] },
                { memory: true }
            ),
        },
        (p) => {
            const headMem = path.join(p.dir, 'head.mem.json');
            const baseMem = path.join(p.dir, 'base.mem.json');
            const mergedHead = merge(headMem, [p.headShard0, p.headShard1]);
            merge(baseMem, [p.baseShard0, p.baseShard1]);

            // Merging keeps every result's allocation untouched.
            assert.equal(mergedHead.examples['high-perf-bar'].data.results[0].allocation.bytesPerIteration, 30 * MB);

            const proc = node(COMPARE, [
                '--base',
                p.timing,
                '--compare',
                p.timing,
                '--base-memory',
                baseMem,
                '--compare-memory',
                headMem,
                '--format',
                'json',
            ]);
            assert.equal(proc.status, 0, proc.stderr);
            const rows = Object.fromEntries(JSON.parse(proc.stdout).rankedByTime.map((r) => [r.test, r]));
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
            baseMem: report({ 'high-perf-bar': [testResult('create', { allocationMb: 40 })] }, { memory: true }),
            headMem: report({ 'high-perf-bar': [testResult('create', { allocationMb: 30 })] }, { memory: true }),
        },
        (p) => {
            const proc = node(COMPARE, [
                '--base',
                p.timing,
                '--compare',
                p.timing,
                '--base-memory',
                p.baseMem,
                '--compare-memory',
                p.headMem,
            ]);
            assert.equal(proc.status, 0, proc.stderr);

            const row = (name) => proc.stdout.split('\n').find((line) => line.includes(name));
            // Cells are `| test | % | Before (ms) | After (ms) | Before (MB) | After (MB) | Δ (MB) |`.
            assert.deepEqual(lastCells(row('high-perf-bar / create'), 3), ['40.00', '30.00', '-10.00']);
            assert.deepEqual(lastCells(row('high-perf-bar / update'), 3), ['—', '—', '—']);
            assert.match(proc.stdout, /Δ \(MB\)/);
        }
    );
});

test('a timing regression is still gated when allocation improves, and an allocation increase does not trip the gate', () => {
    const slow = report({ 'high-perf-bar': [testResult('create', { timings: [50, 50, 50] })] });
    const fast = report({ 'high-perf-bar': [testResult('create', { timings: [10, 10, 10] })] });
    withFiles(
        {
            fast,
            slow,
            lessMem: report({ 'high-perf-bar': [testResult('create', { allocationMb: 1 })] }, { memory: true }),
            moreMem: report({ 'high-perf-bar': [testResult('create', { allocationMb: 500 })] }, { memory: true }),
        },
        (p) => {
            // Slower head with a big allocation win: the regression must still fail the run. Only the
            // table format sets the exit code, so that is the one CI gates on.
            const regressed = node(COMPARE, [
                '--base',
                p.fast,
                '--compare',
                p.slow,
                '--base-memory',
                p.moreMem,
                '--compare-memory',
                p.lessMem,
            ]);
            assert.equal(regressed.status, 1);
            assert.match(regressed.stdout, /Notable Regressions/);
            const regressedJson = node(COMPARE, [
                '--base',
                p.fast,
                '--compare',
                p.slow,
                '--base-memory',
                p.moreMem,
                '--compare-memory',
                p.lessMem,
                '--format',
                'json',
            ]);
            assert.deepEqual(JSON.parse(regressedJson.stdout).notable, ['high-perf-bar / create']);

            // Same timings with a huge allocation increase: nothing to flag.
            const growArgs = [
                '--base',
                p.fast,
                '--compare',
                p.fast,
                '--base-memory',
                p.lessMem,
                '--compare-memory',
                p.moreMem,
            ];
            const grew = node(COMPARE, growArgs);
            assert.equal(grew.status, 0);
            assert.doesNotMatch(grew.stdout, /Notable Regressions/);
            const parsed = JSON.parse(node(COMPARE, [...growArgs, '--format', 'json']).stdout);
            assert.deepEqual(parsed.notable, []);
            assert.equal(parsed.rankedByTime[0].deltaMb, 499);
        }
    );
});

test('only one side having a memory report still compares, with the other side as an em dash', () => {
    withFiles(
        {
            timing,
            headMem: report({ 'high-perf-bar': [testResult('create', { allocationMb: 30 })] }, { memory: true }),
        },
        (p) => {
            const proc = node(COMPARE, ['--base', p.timing, '--compare', p.timing, '--compare-memory', p.headMem]);
            assert.equal(proc.status, 0, proc.stderr);
            const line = proc.stdout.split('\n').find((l) => l.includes('high-perf-bar / create'));
            assert.deepEqual(lastCells(line, 3), ['—', '30.00', '—']);
        }
    );
});

test('a merged memory report keeps its marker, so it is rejected as a timing input', () => {
    withFiles(
        {
            timing,
            shard0: report({ 'high-perf-bar': [testResult('create', { allocationMb: 30 })] }, { memory: true }),
            shard1: report(
                { 'data-selection-zoom-line-area': [testResult('line', { allocationMb: 12.5 })] },
                { memory: true }
            ),
        },
        (p) => {
            const mergedPath = path.join(p.dir, 'merged.json');
            const merged = merge(mergedPath, [p.shard0, p.shard1]);
            assert.deepEqual(merged.memoryPass, { samplingIntervalBytes: 4096 });

            const asBase = node(COMPARE, ['--base', mergedPath, '--compare', p.timing]);
            assert.equal(asBase.status, 2);
            assert.match(asBase.stderr, /memory-pass report/);

            const asCompare = node(COMPARE, ['--base', p.timing, '--compare', mergedPath]);
            assert.equal(asCompare.status, 2);
            assert.match(asCompare.stderr, /memory-pass report/);
        }
    );
});

test('merged timing reports carry no memory marker', () => {
    withFiles(
        {
            shard0: report({ 'high-perf-bar': [testResult('create')] }),
            shard1: report({ 'data-selection-zoom-line-area': [testResult('line')] }),
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
            mem: report({ 'high-perf-bar': [testResult('create', { allocationMb: 30 })] }, { memory: true }),
            time: report({ 'data-selection-zoom-line-area': [testResult('line')] }),
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
