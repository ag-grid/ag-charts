const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const yaml = require('js-yaml');

const {
    BROKEN_BASE,
    COMPARE,
    EXCLUDED_ENTRY,
    MERGE,
    NOT_FOUND,
    baseOnlyEntry,
    node,
    report,
    result,
    runCompare,
    shardReport,
    withFiles,
} = require('./memory-fixtures');

/**
 * Containment of a hung example, end to end as CI runs it: the shard job's pass loop, the merge step and the
 * comparison. The workflow's own bash steps are executed, with the benchmark runner replaced by a stub.
 */

const REPO_ROOT = path.resolve(__dirname, '../..');
const workflow = yaml.load(fs.readFileSync(path.join(REPO_ROOT, '.github/workflows/benchmark.yml'), 'utf8'));
const runOf = (step) => step.run ?? '';
const timingStep = workflow.jobs.benchmark.steps.find((s) => runOf(s).includes('run_one'));
const memoryStep = workflow.jobs.benchmark.steps.find((s) => runOf(s).includes('--memory'));
const mergeStep = workflow.jobs.report.steps.find((s) => runOf(s).includes('merge-browser-results.js'));
const compareStep = workflow.jobs.report.steps.find((s) => runOf(s).includes('compare-browser-results.js'));

// --- Merge and comparison options ---

test('merge --exclude leaves the listed examples out of every shard and keeps the rest', () => {
    withFiles(
        {
            s0: shardReport({ a: 'success', hung: 'timeout' }),
            s1: shardReport({ b: 'success', c: 'error' }),
            excluded: [{ example: 'hung' }, { example: 'c' }, { example: 'in-no-shard' }],
        },
        (p) => {
            const output = path.join(p.dir, 'merged.json');
            const proc = node(MERGE, ['--exclude', p.excluded, '--output', output, p.s0, p.s1]);
            assert.equal(proc.status, 0, proc.stderr);
            const merged = JSON.parse(fs.readFileSync(output, 'utf8'));
            assert.deepEqual(Object.keys(merged.examples).sort(), ['a', 'b']);
            assert.equal(merged.summary.total, 2);
            assert.equal(merged.summary.timeout ?? 0, 0);
            assert.equal(merged.summary.error ?? 0, 0);
        }
    );
});

test('merge without --exclude keeps failed examples, as before', () => {
    withFiles({ s0: shardReport({ a: 'success', hung: 'timeout' }) }, (p) => {
        const output = path.join(p.dir, 'merged.json');
        assert.equal(node(MERGE, ['--output', output, p.s0]).status, 0);
        assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(output, 'utf8')).examples).sort(), ['a', 'hung']);
    });
});

test('merge --exclude with an empty list changes nothing', () => {
    withFiles({ s0: shardReport({ a: 'success' }), excluded: [] }, (p) => {
        const output = path.join(p.dir, 'merged.json');
        assert.equal(node(MERGE, ['--exclude', p.excluded, '--output', output, p.s0]).status, 0);
        assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(output, 'utf8')).examples), ['a']);
    });
});

test('compare --excluded compares the healthy examples and lists the excluded ones in the JSON output', () => {
    withFiles({ run: report({ healthy: [result('t')] }), excluded: [EXCLUDED_ENTRY] }, (p) => {
        const out = node(COMPARE, ['--base', p.run, '--compare', p.run, '--excluded', p.excluded, '--format', 'json']);
        assert.equal(out.status, 0, out.stderr);
        const json = JSON.parse(out.stdout);
        assert.deepEqual(json.excluded, ['hung: head r1 timeout; skipped: base r1']);
        assert.deepEqual(
            json.rankedByTime.map((r) => r.test),
            ['healthy / t']
        );
    });
});

test('compare --excluded prints an Excluded section in the table, and omits it when nothing was excluded', () => {
    withFiles({ run: report({ healthy: [result('t')] }), excluded: [EXCLUDED_ENTRY], none: [] }, (p) => {
        const args = ['--base', p.run, '--compare', p.run, '--format', 'table'];
        const compare = COMPARE;

        const listed = node(compare, [...args, '--excluded', p.excluded]);
        assert.equal(listed.status, 0, listed.stderr);
        assert.match(listed.stdout, /Excluded — failed or timed out \(1\), not compared:/);
        assert.match(listed.stdout, /! hung: head r1 timeout; skipped: base r1/);

        const empty = node(compare, [...args, '--excluded', p.none]);
        assert.doesNotMatch(empty.stdout, /Excluded/);
        const without = runCompare({ base: p.run, compare: p.run });
        assert.doesNotMatch(without.stdout, /Excluded/);
    });
});

test('compare without --excluded reports an empty excluded list in JSON', () => {
    withFiles({ run: report({ healthy: [result('t')] }) }, (p) => {
        assert.deepEqual(runCompare({ base: p.run, compare: p.run }, { format: 'json' }).json.excluded, []);
    });
});

// --- Executing the workflow steps ---

/** Runs a workflow step's bash the way Actions does, with `${{ strategy.job-index }}` fixed to 0. */
function runStep(step, cwd, env) {
    const script = runOf(step).replaceAll('${{ strategy.job-index }}', '0');
    assert.doesNotMatch(script, /\$\{\{/, 'step uses an expression this harness does not substitute');
    return spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script], {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, ...env },
    });
}

/**
 * A scratch repo whose `tools/benchmark` holds the real shard-failures.js and a stub serve-and-run.sh. The
 * stub logs `<report>|<examples>|<timeout>` per call and writes a report in which every example named in
 * HANG times out (and, with HANG_ONLY_MEMORY, only in the memory pass) and every one in ERROR errors.
 */
function withShardJob(fn, { memoryExamples } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shard-job-'));
    try {
        const bin = path.join(dir, 'tools/benchmark');
        fs.mkdirSync(bin, { recursive: true });
        for (const script of ['shard-failures.js', 'cli-option.js']) {
            fs.copyFileSync(path.join(__dirname, script), path.join(bin, script));
        }
        // `memoryExamples: null` is a PR branch cut before the helper existed; a string replaces its source.
        if (memoryExamples !== null) {
            for (const script of ['memory-examples.js', 'benchmark-examples.js', 'stats.js']) {
                fs.copyFileSync(path.join(__dirname, script), path.join(bin, script));
            }
            if (memoryExamples !== undefined) {
                fs.writeFileSync(path.join(bin, 'memory-examples.js'), memoryExamples);
            }
        }
        fs.writeFileSync(
            path.join(bin, 'stub-runner.js'),
            `const fs = require('node:fs');
const [output, examples, timeout, memory] = process.argv.slice(2);
fs.appendFileSync(process.env.CALLS_LOG, [require('node:path').basename(output), examples, timeout].join('|') + '\\n');
const split = (v) => (v ?? '').split(',').filter(Boolean);
const hang = process.env.HANG_ONLY_MEMORY === 'true' && memory !== 'true' ? [] : split(process.env.HANG);
const error = split(process.env.ERROR);
const entries = split(examples).map((name) => [
    name,
    { status: hang.includes(name) ? 'timeout' : error.includes(name) ? 'error' : 'success', durationMs: 1 },
]);
fs.mkdirSync(require('node:path').dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ examples: Object.fromEntries(entries) }));
process.exit(entries.some(([, r]) => r.status !== 'success') ? 1 : 0);
`
        );
        fs.writeFileSync(
            path.join(bin, 'serve-and-run.sh'),
            `#!/usr/bin/env bash
set -euo pipefail
output="" examples="" timeout="" memory=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) output=$2; shift 2;;
    --examples) examples=$2; shift 2;;
    --timeout) timeout=$2; shift 2;;
    --memory) memory=true; shift;;
    *) shift;;
  esac
done
exec node "$(dirname "$0")/stub-runner.js" "$output" "$examples" "$timeout" "$memory"
`,
            { mode: 0o755 }
        );
        const callsLog = path.join(dir, 'calls.log');
        fs.writeFileSync(callsLog, '');
        const baseEnv = {
            CALLS_LOG: callsLog,
            RUNNER_TEMP: dir,
            BASE_PORT: '4602',
            AG_BENCHMARK_RUNS: '2',
            AG_BENCHMARK_SOFT_FAIL: 'true',
            AG_EXAMPLE_TIMEOUT_MS: '123456',
            EVENT_NAME: 'schedule',
            REQUESTED_EXAMPLES: '',
        };
        const calls = () =>
            fs
                .readFileSync(callsLog, 'utf8')
                .split('\n')
                .filter(Boolean)
                .map((line) => {
                    const [file, examples, timeout] = line.split('|');
                    return { file, examples: examples.split(','), timeout };
                });
        const run = (step, env) => runStep(step, dir, { ...baseEnv, ...env });
        return fn({ dir, run, calls });
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

const callSummary = (calls) => calls.map(({ file, examples }) => `${file}: ${examples.join(',')}`);

test('timing passes: an example that times out is skipped in every later head and base pass', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(timingStep, { SHARD_EXAMPLES: 'alpha,hung,omega', HANG: 'hung' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls()), [
            'head-0.r1.json: alpha,hung,omega',
            'base-0.r1.json: alpha,omega',
            'head-0.r2.json: alpha,omega',
            'base-0.r2.json: alpha,omega',
        ]);
    });
});

test('timing passes: every pass receives the per-example timeout from AG_EXAMPLE_TIMEOUT_MS', () => {
    withShardJob(({ run, calls }) => {
        run(timingStep, { SHARD_EXAMPLES: 'alpha', AG_EXAMPLE_TIMEOUT_MS: '98765' });
        assert.equal(calls().length, 4);
        assert.ok(calls().every(({ timeout }) => timeout === '98765'));
    });
});

test('timing passes: an example that merely errors still runs in every pass', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(timingStep, { SHARD_EXAMPLES: 'alpha,flaky', ERROR: 'flaky' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.ok(
            calls().every(({ examples }) => examples.join() === 'alpha,flaky'),
            callSummary(calls()).join('\n')
        );
        assert.equal(calls().length, 4);
    });
});

test('timing passes: a shard whose every example hung never invokes the runner with an empty list', () => {
    withShardJob(({ dir, run, calls }) => {
        const proc = run(timingStep, { SHARD_EXAMPLES: 'hung', HANG: 'hung' });
        assert.equal(proc.status, 0, proc.stderr);
        // Only the first pass runs; an empty --examples would mean "every example".
        assert.deepEqual(callSummary(calls()), ['head-0.r1.json: hung']);
        // The skipped passes still leave a (empty) report, so a missing file only ever means a lost shard.
        const shards = path.join(dir, 'reports/browser-benchmarks/shards');
        for (const file of ['base-0.r1.json', 'head-0.r2.json', 'base-0.r2.json']) {
            assert.deepEqual(JSON.parse(fs.readFileSync(path.join(shards, file), 'utf8')).examples, {}, file);
        }
        assert.match(proc.stdout, /::warning::base run 1: every example in this shard timed out earlier; skipping/);
    });
});

test('timing passes: a hang in one shard does not affect a different shard index', () => {
    withShardJob(({ dir, run, calls }) => {
        // A report left by another shard in the shared directory must not hide examples from this shard.
        const shards = path.join(dir, 'reports/browser-benchmarks/shards');
        fs.mkdirSync(shards, { recursive: true });
        fs.writeFileSync(
            path.join(shards, 'head-1.r1.json'),
            JSON.stringify({ examples: { alpha: { status: 'timeout' } } })
        );
        const proc = run(timingStep, { SHARD_EXAMPLES: 'alpha,omega' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.ok(calls().every(({ examples }) => examples.join() === 'alpha,omega'));
    });
});

test('memory pass: examples that timed out in the timing passes are not sampled', () => {
    withShardJob(({ run, calls }) => {
        run(timingStep, { SHARD_EXAMPLES: 'high-perf-a,high-perf-hung,high-perf-z', HANG: 'high-perf-hung' });
        const before = calls().length;
        const proc = run(memoryStep, {
            SHARD_EXAMPLES: 'high-perf-a,high-perf-hung,high-perf-z',
            HANG: 'high-perf-hung',
        });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls().slice(before)), [
            'head-0.mem.json: high-perf-a,high-perf-z',
            'base-0.mem.json: high-perf-a,high-perf-z',
        ]);
    });
});

test('memory pass: a hang in the head memory pass is not repeated on the base side', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(memoryStep, {
            SHARD_EXAMPLES: 'high-perf-a,high-perf-hung',
            HANG: 'high-perf-hung',
            HANG_ONLY_MEMORY: 'true',
        });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls()), [
            'head-0.mem.json: high-perf-a,high-perf-hung',
            'base-0.mem.json: high-perf-a',
        ]);
    });
});

test('memory pass: when the only example hangs on the head side the base memory pass is skipped', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(memoryStep, {
            SHARD_EXAMPLES: 'high-perf-hung',
            HANG: 'high-perf-hung',
            HANG_ONLY_MEMORY: 'true',
        });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls()), ['head-0.mem.json: high-perf-hung']);
    });
});

test('memory pass: with every example already high-perf-hung the pass is skipped without error', () => {
    withShardJob(({ run, calls }) => {
        run(timingStep, { SHARD_EXAMPLES: 'high-perf-hung', HANG: 'high-perf-hung' });
        const before = calls().length;
        const proc = run(memoryStep, { SHARD_EXAMPLES: 'high-perf-hung', HANG: 'high-perf-hung' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.equal(calls().length, before);
        assert.match(proc.stdout, /skipping the memory pass/);
    });
});

test('memory pass: only high-perf and zoom examples are sampled, and the timeout still applies', () => {
    withShardJob(({ run, calls }) => {
        run(memoryStep, {
            SHARD_EXAMPLES: 'high-perf-bar,simple-chart,data-selection-zoom-bar',
            AG_EXAMPLE_TIMEOUT_MS: '4242',
        });
        assert.deepEqual(callSummary(calls()), [
            'head-0.mem.json: high-perf-bar,data-selection-zoom-bar',
            'base-0.mem.json: high-perf-bar,data-selection-zoom-bar',
        ]);
        assert.ok(calls().every(({ timeout }) => timeout === '4242'));
    });
});

test('memory pass: a bare /benchmarks comment samples high-perf examples but not the zoom family', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(memoryStep, {
            SHARD_EXAMPLES: 'data-selection-zoom-bar,high-perf-bar',
            EVENT_NAME: 'issue_comment',
        });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls()), ['head-0.mem.json: high-perf-bar', 'base-0.mem.json: high-perf-bar']);
    });
});

test('memory pass: a /benchmarks comment that names a zoom example still samples it', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(memoryStep, {
            SHARD_EXAMPLES: 'data-selection-zoom-bar,high-perf-bar',
            EVENT_NAME: 'issue_comment',
            REQUESTED_EXAMPLES: 'data-selection-zoom-bar,high-perf-bar',
        });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls()), [
            'head-0.mem.json: data-selection-zoom-bar,high-perf-bar',
            'base-0.mem.json: data-selection-zoom-bar,high-perf-bar',
        ]);
    });
});

test('memory pass: a shard holding only zoom examples skips the pass on a bare /benchmarks comment', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(memoryStep, { SHARD_EXAMPLES: 'data-selection-zoom-bar', EVENT_NAME: 'issue_comment' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(calls(), []);
        assert.match(proc.stdout, /skipping the memory pass/);
    });
});

test('memory pass: a branch without memory-examples.js falls back to the high-perf and zoom filter and does not fail', () => {
    withShardJob(
        ({ run, calls }) => {
            const proc = run(memoryStep, {
                SHARD_EXAMPLES: 'data-selection-zoom-bar,simple-chart,high-perf-bar',
                EVENT_NAME: 'issue_comment',
            });
            assert.equal(proc.status, 0, proc.stderr);
            assert.match(proc.stdout, /::warning::memory-examples\.js is missing or failed/);
            assert.deepEqual(callSummary(calls()), [
                'head-0.mem.json: data-selection-zoom-bar,high-perf-bar',
                'base-0.mem.json: data-selection-zoom-bar,high-perf-bar',
            ]);
        },
        { memoryExamples: null }
    );
});

test('memory pass: a helper that crashes falls back the same way, and an empty fallback skips the pass', () => {
    withShardJob(
        ({ run, calls }) => {
            const proc = run(memoryStep, { SHARD_EXAMPLES: 'simple-chart' });
            assert.equal(proc.status, 0, proc.stderr);
            assert.match(proc.stdout, /::warning::memory-examples\.js is missing or failed/);
            assert.match(proc.stdout, /skipping the memory pass/);
            assert.deepEqual(calls(), []);
        },
        { memoryExamples: 'process.exit(2);\n' }
    );
});

// --- Report job: merge and compare steps run on the shard files the passes above leave ---

/**
 * A scratch repo for the report job: `tools` is the real one (so node finds yargs) and `shards/` holds one
 * report per side, shard and run. `statuses(side, shard, run)` gives that report's `{ example: status }`;
 * `null` leaves the file out.
 */
function withReportJob({ shards = 2, runs = 3, statuses }, fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-job-'));
    try {
        fs.symlinkSync(path.join(REPO_ROOT, 'tools'), path.join(dir, 'tools'));
        const shardDir = path.join(dir, 'reports/browser-benchmarks/shards');
        fs.mkdirSync(shardDir, { recursive: true });
        for (let run = 1; run <= runs; run++) {
            for (const side of ['head', 'base']) {
                for (let shard = 0; shard < shards; shard++) {
                    const examples = statuses(side, shard, run);
                    if (examples) {
                        fs.writeFileSync(
                            path.join(shardDir, `${side}-${shard}.r${run}.json`),
                            JSON.stringify(shardReport(examples))
                        );
                    }
                }
            }
        }
        const env = {
            AG_BENCHMARK_RUNS: String(runs),
            SHARDS: JSON.stringify(Array.from({ length: shards }, (_, i) => `shard${i}`)),
            GITHUB_OUTPUT: path.join(dir, 'github-output'),
        };
        const merge = () => runStep(mergeStep, dir, env);
        const compare = () => runStep({ run: runOf(compareStep).replace(/\$\{\{[^}]*\}\}/g, 'label') }, dir, env);
        const read = (file) => JSON.parse(fs.readFileSync(path.join(dir, 'reports/browser-benchmarks', file), 'utf8'));
        const exists = (file) => fs.existsSync(path.join(dir, 'reports/browser-benchmarks', file));
        return fn({ dir, merge, compare, read, exists });
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

/** Shard 0 holds `healthy` and `hung`; shard 1 holds `other`. `hung` timed out in head r1 and was skipped after. */
const hungInHeadRunOne = (side, shard, run) =>
    shard === 0
        ? { healthy: 'success', ...(side === 'head' && run === 1 ? { hung: 'timeout' } : {}) }
        : { other: 'success' };

test('merge step: a hung example is dropped from every run, which are all kept, and listed as a warning', () => {
    withReportJob({ statuses: hungInHeadRunOne }, ({ merge, read, exists }) => {
        const proc = merge();
        assert.equal(proc.status, 0, proc.stderr + proc.stdout);
        assert.match(
            proc.stdout,
            /::warning::Excluded from the comparison: hung: head r1 timeout; skipped: base r1, base r2, base r3, head r2, head r3\n/
        );
        assert.match(proc.stdout, /Merged 3 complete run\(s\)\./);
        for (const run of [1, 2, 3]) {
            for (const side of ['head', 'base']) {
                assert.deepEqual(Object.keys(read(`${side}.r${run}.json`).examples).sort(), ['healthy', 'other']);
            }
        }
        assert.deepEqual(
            read('excluded.json').map((e) => e.example),
            ['hung']
        );
        assert.equal(exists('head.mem.json'), false);
    });
});

test('merge step: an example that errored only on the base in one run is dropped from base runs and kept in head runs', () => {
    const erroredOnce = (side, shard, run) =>
        shard === 0
            ? { healthy: 'success', flaky: side === 'base' && run === 2 ? 'error' : 'success' }
            : { other: 'success' };
    withReportJob({ statuses: erroredOnce }, ({ merge, read }) => {
        const proc = merge();
        assert.equal(proc.status, 0, proc.stderr + proc.stdout);
        for (const run of [1, 2, 3]) {
            assert.deepEqual(Object.keys(read(`head.r${run}.json`).examples).sort(), ['flaky', 'healthy', 'other']);
            assert.deepEqual(Object.keys(read(`base.r${run}.json`).examples).sort(), ['healthy', 'other']);
        }
        assert.match(proc.stdout, /flaky: base r2 error \[base-only: base failed\]/);
    });
});

test('merge step: a run with a wholly missing shard file is still dropped, the others merge', () => {
    const missingHeadShardOneRunThree = (side, shard, run) =>
        side === 'head' && shard === 1 && run === 3 ? null : hungInHeadRunOne(side, shard, run);
    withReportJob({ statuses: missingHeadShardOneRunThree }, ({ merge, exists }) => {
        const proc = merge();
        assert.equal(proc.status, 0, proc.stderr + proc.stdout);
        assert.match(proc.stdout, /::warning::Run 3 incomplete \(expected 2, head: 1, base: 2\); skipping/);
        assert.match(proc.stdout, /Merged 2 complete run\(s\)\./);
        assert.equal(exists('head.r3.json'), false);
        assert.equal(exists('head.r2.json'), true);
    });
});

test('merge step: fewer than two complete runs still fails the report job', () => {
    const onlyOneRun = (side, shard, run) => (run === 1 ? hungInHeadRunOne(side, shard, run) : null);
    withReportJob({ runs: 2, statuses: onlyOneRun }, ({ merge }) => {
        const proc = merge();
        assert.notEqual(proc.status, 0);
        assert.match(proc.stdout, /::error::Need >=2 complete runs for cross-run gating, got 1/);
    });
});

test('merge step: memory reports drop the excluded examples too', () => {
    withReportJob({ statuses: hungInHeadRunOne }, ({ dir, merge, read }) => {
        const shardDir = path.join(dir, 'reports/browser-benchmarks/shards');
        for (const side of ['head', 'base']) {
            fs.writeFileSync(
                path.join(shardDir, `${side}-0.mem.json`),
                JSON.stringify(shardReport({ healthy: 'success', hung: 'success' }, { memory: true }))
            );
        }
        const proc = merge();
        assert.equal(proc.status, 0, proc.stderr + proc.stdout);
        assert.deepEqual(Object.keys(read('head.mem.json').examples), ['healthy']);
        assert.deepEqual(Object.keys(read('base.mem.json').examples), ['healthy']);
    });
});

test('compare step: healthy examples are compared and the hung example is listed in the report', () => {
    withReportJob({ statuses: hungInHeadRunOne }, ({ merge, compare, dir }) => {
        assert.equal(merge().status, 0);
        const proc = compare();
        assert.equal(proc.status, 0, proc.stderr + proc.stdout);

        const log = fs.readFileSync(path.join(dir, 'reports/browser-benchmark.log'), 'utf8');
        assert.match(log, /Excluded — failed or timed out \(1\), not compared:/);
        assert.match(log, /! hung: head r1 timeout; skipped: base r1, base r2, base r3, head r2, head r3\n/);
        assert.match(log, /healthy/);
        assert.match(log, /other/);

        const json = JSON.parse(fs.readFileSync(path.join(dir, 'reports/browser-benchmark.json'), 'utf8'));
        assert.deepEqual(json.excluded, [
            'hung: head r1 timeout; skipped: base r1, base r2, base r3, head r2, head r3',
        ]);
        assert.deepEqual(json.rankedByTime.map((r) => r.test).sort(), ['healthy / t', 'other / t']);
    });
});

test('report job: a shard whose only example hung leaves the other shard compared and the hang listed', () => {
    const wholeShardHung = (side, shard, run) =>
        shard === 0 ? (side === 'head' && run === 1 ? { hung: 'timeout' } : {}) : { other: 'success' };
    withReportJob({ statuses: wholeShardHung }, ({ merge, compare, read, dir }) => {
        const proc = merge();
        assert.equal(proc.status, 0, proc.stderr + proc.stdout);
        assert.match(proc.stdout, /Merged 3 complete run\(s\)\./);
        assert.deepEqual(Object.keys(read('head.r1.json').examples), ['other']);

        const compared = compare();
        assert.equal(compared.status, 0, compared.stderr + compared.stdout);
        const json = JSON.parse(fs.readFileSync(path.join(dir, 'reports/browser-benchmark.json'), 'utf8'));
        assert.deepEqual(
            json.rankedByTime.map((r) => r.test),
            ['other / t']
        );
        assert.deepEqual(json.excluded, [
            'hung: head r1 timeout; skipped: base r1, base r2, base r3, head r2, head r3',
        ]);
    });
});

test('report job: when every example was excluded nothing is compared and the job fails, listing them', () => {
    const everythingHung = (side, shard, run) => (side === 'head' && run === 1 ? { [`hung${shard}`]: 'timeout' } : {});
    withReportJob({ statuses: everythingHung }, ({ merge, compare }) => {
        assert.equal(merge().status, 0);
        const proc = compare();
        assert.notEqual(proc.status, 0);
        assert.match(proc.stderr, /No example could be compared/);
        assert.match(proc.stderr, /! hung0: head r1 timeout/);
        assert.match(proc.stderr, /! hung1: head r1 timeout/);
    });
});

// --- Examples that fail only on the base are reported as head-only "New" rows ---

const reportJson = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'reports/browser-benchmark.json'), 'utf8'));
const reportLog = (dir) => fs.readFileSync(path.join(dir, 'reports/browser-benchmark.log'), 'utf8');

test('report job: a brand-new example that 404s on the base passes and is listed as New (head only)', () => {
    const notOnBase = (side) => ({ 'new-one': side === 'base' ? NOT_FOUND : 'success' });
    withReportJob({ shards: 1, statuses: notOnBase }, ({ merge, compare, read, dir }) => {
        const merged = merge();
        assert.equal(merged.status, 0, merged.stderr + merged.stdout);
        assert.match(merged.stdout, /::warning::Excluded from the comparison: new-one: .*\[base-only: not on base/);
        for (const run of [1, 2, 3]) {
            assert.deepEqual(Object.keys(read(`head.r${run}.json`).examples), ['new-one']);
            assert.deepEqual(Object.keys(read(`base.r${run}.json`).examples), []);
        }

        const compared = compare();
        assert.equal(compared.status, 0, compared.stderr + compared.stdout);
        const json = reportJson(dir);
        assert.deepEqual(json.rankedByTime, []);
        assert.deepEqual(json.excluded, []);
        assert.deepEqual(
            json.newHeadOnly.map(({ test: name, reason }) => [name, reason]),
            [['new-one / t', 'not on base']]
        );

        const log = reportLog(dir);
        assert.match(log, /New \(head only\)/);
        assert.match(log, /new-one \/ t/);
        assert.match(log, /base-only: not on base/);
        assert.doesNotMatch(log, /No example could be compared/);
    });
});

test('report job: a base error that is not a 404 among matched examples is a New row with reason base failed', () => {
    const baseErroredOnce = (side, shard, run) =>
        shard === 0
            ? { healthy: 'success', flaky: side === 'base' && run === 2 ? BROKEN_BASE : 'success' }
            : { other: 'success' };
    withReportJob({ statuses: baseErroredOnce }, ({ merge, compare, dir }) => {
        assert.equal(merge().status, 0);
        const compared = compare();
        assert.equal(compared.status, 0, compared.stderr + compared.stdout);

        const json = reportJson(dir);
        assert.deepEqual(json.rankedByTime.map((r) => r.test).sort(), ['healthy / t', 'other / t']);
        assert.deepEqual(
            json.newHeadOnly.map(({ test: name, reason }) => [name, reason]),
            [['flaky / t', 'base failed']]
        );
        assert.deepEqual(json.excluded, []);
        // The matched table and the New section stay apart: the new row is never in the ranked comparison.
        assert.doesNotMatch(JSON.stringify(json.rankedByTime), /flaky/);
        assert.match(reportLog(dir), /base-only: base failed/);
    });
});

test('report job: a head error on the only example still fails the job', () => {
    const headErrors = (side) => ({ only: side === 'head' ? 'error' : 'success' });
    withReportJob({ shards: 1, statuses: headErrors }, ({ merge, compare }) => {
        assert.equal(merge().status, 0);
        const proc = compare();
        assert.notEqual(proc.status, 0);
        assert.match(proc.stderr, /No example could be compared/);
        assert.match(proc.stderr, /! only: head r1 error/);
    });
});

test('report job: a head error on one run of an example that also 404s on the base is excluded from both sides', () => {
    const notOnBaseAndHeadErrs = (side, shard, run) =>
        shard === 0
            ? { healthy: 'success', mixed: side === 'base' ? NOT_FOUND : run === 2 ? 'error' : 'success' }
            : { other: 'success' };
    withReportJob({ statuses: notOnBaseAndHeadErrs }, ({ merge, compare, read, dir }) => {
        assert.equal(merge().status, 0);
        for (const side of ['head', 'base']) {
            assert.deepEqual(Object.keys(read(`${side}.r1.json`).examples).sort(), ['healthy', 'other']);
        }
        assert.equal(compare().status, 0);
        const json = reportJson(dir);
        assert.deepEqual(json.newHeadOnly, []);
        assert.equal(json.excluded.length, 1);
        assert.match(json.excluded[0], /^mixed: /);
        assert.doesNotMatch(json.excluded[0], /base-only/);
    });
});

test('report job: a base timeout on the only example still fails the job and drops it from both sides', () => {
    // The base hangs in r1; `remaining` then drops the example from the later passes on both sides.
    const baseHangs = (side, shard, run) => (run === 1 ? { only: side === 'base' ? 'timeout' : 'success' } : {});
    withReportJob({ shards: 1, statuses: baseHangs }, ({ merge, compare, read }) => {
        const merged = merge();
        assert.equal(merged.status, 0, merged.stderr + merged.stdout);
        assert.doesNotMatch(merged.stdout, /base-only/);
        assert.deepEqual(Object.keys(read('head.r1.json').examples), []);
        assert.deepEqual(Object.keys(read('base.r1.json').examples), []);

        const proc = compare();
        assert.notEqual(proc.status, 0);
        assert.match(proc.stderr, /No example could be compared/);
        assert.match(proc.stderr, /! only: base r1 timeout/);
    });
});

test('report job: an example failing on both sides is excluded from both, as before', () => {
    const bothFail = (side, shard) => (shard === 0 ? { healthy: 'success', broken: 'error' } : { other: 'success' });
    withReportJob({ statuses: bothFail }, ({ merge, compare, read, dir }) => {
        const merged = merge();
        assert.equal(merged.status, 0, merged.stderr + merged.stdout);
        assert.doesNotMatch(merged.stdout, /base-only/);
        for (const side of ['head', 'base']) {
            assert.deepEqual(Object.keys(read(`${side}.r1.json`).examples).sort(), ['healthy', 'other']);
        }
        assert.equal(compare().status, 0);
        const json = reportJson(dir);
        assert.deepEqual(json.newHeadOnly, []);
        assert.match(json.excluded[0], /^broken: base r1 error, base r2 error, base r3 error, head r1 error/);
    });
});

test('report job: a wholly missing shard file still fails closed when a base-only example exists', () => {
    const lostShard = (side, shard, run) =>
        side === 'head' && shard === 1 && run > 1
            ? null
            : { [`ex${shard}`]: side === 'base' && shard === 0 ? NOT_FOUND : 'success' };
    withReportJob({ statuses: lostShard }, ({ merge }) => {
        const proc = merge();
        assert.notEqual(proc.status, 0);
        assert.match(proc.stdout, /::error::Need >=2 complete runs/);
    });
});

test('merge step: memory reports keep a base-only example on the head and drop it from the base', () => {
    const notOnBase = (side, shard) =>
        shard === 0 ? { healthy: 'success', 'new-one': side === 'base' ? NOT_FOUND : 'success' } : {};
    withReportJob({ statuses: notOnBase }, ({ dir, merge, read }) => {
        const shardDir = path.join(dir, 'reports/browser-benchmarks/shards');
        for (const side of ['head', 'base']) {
            fs.writeFileSync(
                path.join(shardDir, `${side}-0.mem.json`),
                JSON.stringify(shardReport({ healthy: 'success', 'new-one': 'success' }, { memory: true }))
            );
        }
        const proc = merge();
        assert.equal(proc.status, 0, proc.stderr + proc.stdout);
        assert.deepEqual(Object.keys(read('head.mem.json').examples).sort(), ['healthy', 'new-one']);
        assert.deepEqual(Object.keys(read('base.mem.json').examples), ['healthy']);
    });
});

test('merge --side: base-only entries are kept only for head, and anything else is dropped from every side', () => {
    const entries = [
        { example: 'b', baseOnly: true, reason: 'not on base' },
        { example: 'plain' },
        { example: 'stringly', baseOnly: 'true' },
        { example: 'falsy', baseOnly: false },
    ];
    withFiles(
        {
            s0: shardReport({ a: 'success', b: 'success', plain: 'success', stringly: 'success', falsy: 'success' }),
            excluded: entries,
        },
        (p) => {
            const kept = (side) => {
                const output = path.join(p.dir, `${side ?? 'none'}.json`);
                const proc = node(MERGE, [
                    '--exclude',
                    p.excluded,
                    ...(side ? ['--side', side] : []),
                    '--output',
                    output,
                    p.s0,
                ]);
                assert.equal(proc.status, 0, proc.stderr);
                return Object.keys(JSON.parse(fs.readFileSync(output, 'utf8')).examples).sort();
            };
            assert.deepEqual(kept('head'), ['a', 'b']);
            assert.deepEqual(kept('base'), ['a']);
            assert.deepEqual(kept(undefined), ['a']);
        }
    );
});

test('merge --side rejects a value other than head or base', () => {
    withFiles({ s0: shardReport({ a: 'success' }), excluded: [] }, (p) => {
        const proc = node(MERGE, [
            '--exclude',
            p.excluded,
            '--side',
            'both',
            '--output',
            path.join(p.dir, 'o.json'),
            p.s0,
        ]);
        assert.notEqual(proc.status, 0);
    });
});

test('compare: a head-only row carries the head median, min, sample count and cross-run CV', () => {
    // Per-run medians are 12 and 22; the cross-run CV is their sample standard deviation over their mean.
    const head1 = report({ shared: [result('t')], fresh: [result('t', { timings: [10, 12, 14] })] });
    const head2 = report({ shared: [result('t')], fresh: [result('t', { timings: [20, 22, 24] })] });
    const base = report({ shared: [result('t')] });
    const expectedCvPct = (Math.sqrt((5 ** 2 + 5 ** 2) / (2 - 1)) / 17) * 100;
    withFiles({ head1, head2, base1: base, base2: base, excluded: [baseOnlyEntry('fresh')] }, (p) => {
        const { status, stderr, json } = runCompare(
            { base: [p.base1, p.base2], compare: [p.head1, p.head2], excluded: p.excluded },
            { format: 'json' }
        );
        assert.equal(status, 0, stderr);
        assert.equal(json.newHeadOnly.length, 1);
        const [row] = json.newHeadOnly;
        assert.equal(row.test, 'fresh / t');
        assert.equal(row.reason, 'not on base');
        assert.equal(row.runCount, 2);
        assert.equal(row.samples, 3);
        assert.equal(Number(row.medianMs), 17, 'median of the run medians 12 and 22');
        assert.equal(Number(row.minMs), 10, 'the smallest min across runs');
        assert.ok(Math.abs(row.crossRunCvPct - expectedCvPct) < 1e-6, `CV ${row.crossRunCvPct} != ${expectedCvPct}`);
        assert.deepEqual(
            json.rankedByTime.map((r) => r.test),
            ['shared / t']
        );
        assert.deepEqual(json.excluded, []);
    });
});

test('compare: New (head only) is its own table section, apart from the matched table', () => {
    const head = report({ shared: [result('t')], fresh: [result('t')] });
    const base = report({ shared: [result('t')] });
    withFiles({ head, base, excluded: [baseOnlyEntry('fresh', 'base failed')] }, (p) => {
        const out = runCompare({ base: p.base, compare: p.head, excluded: p.excluded }, { format: 'table' });
        assert.equal(out.status, 0, out.stderr);
        const at = out.stdout.indexOf('New (head only)');
        assert.ok(at >= 0, 'has a New (head only) section');
        assert.doesNotMatch(out.stdout.slice(0, at), /fresh/);
        assert.match(out.stdout.slice(at), /fresh \/ t/);
        assert.match(out.stdout.slice(at), /base-only: base failed/);
        assert.doesNotMatch(out.stdout, /Excluded/);
    });
});

test('compare: an example that is new on the head without any excluded entry is still a New row, with no reason', () => {
    const head = report({ shared: [result('t')], fresh: [result('t')] });
    const base = report({ shared: [result('t')] });
    withFiles({ head, base }, (p) => {
        const { status, json } = runCompare({ base: p.base, compare: p.head }, { format: 'json' });
        assert.equal(status, 0);
        assert.deepEqual(
            json.newHeadOnly.map((r) => [r.test, r.reason]),
            [['fresh / t', null]]
        );
    });
});

test('compare: a new head-only row is never regression-gated, however slow, while a slow matched one is', () => {
    const slow = { timings: [5000, 5000, 5000] };
    const base = report({ shared: [result('t')] });
    withFiles(
        {
            base,
            head: report({ shared: [result('t')], fresh: [result('t', slow)] }),
            slowMatched: report({ shared: [result('t', slow)] }),
            excluded: [baseOnlyEntry('fresh')],
        },
        (p) => {
            // No --report-only here, unlike the workflow, so a gate on the new row would make this exit 1.
            const newRow = runCompare({ base: p.base, compare: p.head, excluded: p.excluded }, { format: 'table' });
            assert.equal(newRow.status, 0, newRow.stderr + newRow.stdout);
            assert.doesNotMatch(newRow.stdout, /Notable Regressions/);
            assert.match(newRow.stdout, /fresh \/ t/);

            const matched = runCompare({ base: p.base, compare: p.slowMatched }, { format: 'table' });
            assert.equal(matched.status, 1, 'the same timings on a matched example do trip the gate');
        }
    );
});

test('compare: only new examples (nothing matched) passes, and nothing at all with everything excluded fails', () => {
    const head = report({ fresh: [result('t')] });
    const base = report({});
    withFiles({ head, base, excluded: [baseOnlyEntry('fresh')], hung: [EXCLUDED_ENTRY] }, (p) => {
        assert.equal(runCompare({ base: p.base, compare: p.head, excluded: p.excluded }).status, 0);
        const failing = runCompare({ base: p.base, compare: p.base, excluded: p.hung });
        assert.equal(failing.status, 1);
    });
});

test('compare: nothing matched but one new row passes even while another example is excluded', () => {
    const head = report({ fresh: [result('t')] });
    const base = report({});
    withFiles({ head, base, excluded: [baseOnlyEntry('fresh'), EXCLUDED_ENTRY] }, (p) => {
        const { status, stderr, json } = runCompare(
            { base: p.base, compare: p.head, excluded: p.excluded },
            { format: 'json' }
        );
        assert.equal(status, 0, stderr);
        assert.deepEqual(
            json.newHeadOnly.map((r) => r.test),
            ['fresh / t']
        );
        assert.deepEqual(json.excluded, ['hung: head r1 timeout; skipped: base r1']);
    });
});

test('compare: a base-only entry with no head results fails closed and is listed, never silently dropped', () => {
    // E.g. the head reports were merged without --side head, which dropped the example from both sides.
    const empty = report({});
    withFiles({ head: empty, base: empty, excluded: [baseOnlyEntry('fresh')] }, (p) => {
        const { status, stderr } = runCompare({ base: p.base, compare: p.head, excluded: p.excluded });
        assert.equal(status, 1);
        assert.match(stderr, /No example could be compared/);
        assert.match(stderr, /! fresh: base r1 error/);
    });
});

test('compare: an orphan base-only entry is listed as excluded while the others still show as New or matched', () => {
    const head = report({ shared: [result('t')], fresh: [result('t')] });
    const base = report({ shared: [result('t')] });
    withFiles({ head, base, excluded: [baseOnlyEntry('fresh'), baseOnlyEntry('orphan', 'base failed')] }, (p) => {
        const { status, json } = runCompare(
            { base: p.base, compare: p.head, excluded: p.excluded },
            { format: 'json' }
        );
        assert.equal(status, 0);
        assert.deepEqual(
            json.newHeadOnly.map((r) => r.test),
            ['fresh / t']
        );
        assert.equal(json.excluded.length, 1);
        assert.match(json.excluded[0], /^orphan: /);
    });
});

test('compare: an empty comparison with nothing excluded still succeeds, as before', () => {
    withFiles({ run: report({}), none: [] }, (p) => {
        const out = node(COMPARE, ['--base', p.run, '--compare', p.run, '--excluded', p.none]);
        assert.equal(out.status, 0, out.stderr);
    });
});

// --- Workflow settings ---

const stepScripts = workflow.jobs.benchmark.steps.map(runOf).join('\n');

test('workflow: the per-example timeout is a single setting above the healthy 218s maximum and below the old 600s', () => {
    const timeoutMs = Number(workflow.env.AG_EXAMPLE_TIMEOUT_MS);
    assert.ok(Number.isInteger(timeoutMs));
    assert.ok(timeoutMs > 218_000, `${timeoutMs}ms must leave headroom over the 218s healthy maximum`);
    assert.ok(timeoutMs < 600_000, `${timeoutMs}ms should be below the old 600s timeout`);
    assert.doesNotMatch(stepScripts, /--timeout 600000/);
    assert.equal((stepScripts.match(/--timeout "\$\{AG_EXAMPLE_TIMEOUT_MS\}"/g) ?? []).length, 2);
});

test('workflow: the shard count is 5 or 6 and the matrix is built from the weighted sharding', () => {
    assert.ok([5, 6].includes(Number(workflow.env.AG_SHARD_COUNT)), `AG_SHARD_COUNT ${workflow.env.AG_SHARD_COUNT}`);
    const resolveScripts = workflow.jobs.resolve.steps.map(runOf).join('\n');
    assert.match(resolveScripts, /benchmark-examples\.js --shards "\$AG_SHARD_COUNT"/);
});

test('workflow: the old per-run failure skip is gone, so one hung example cannot drop whole runs', () => {
    assert.doesNotMatch(runOf(mergeStep), /summary\.error/);
    assert.doesNotMatch(runOf(mergeStep), /failed\/timed-out example/);
});

test('workflow: the report job hands the excluded list to the merges and to the comparison', () => {
    assert.equal((runOf(mergeStep).match(/merge-browser-results\.js --exclude /g) ?? []).length, 3);
    assert.match(runOf(compareStep), /--excluded reports\/browser-benchmarks\/excluded\.json/);
});

test('workflow: the job timeout covers a balanced shard plus one hung example per shard', () => {
    const jobMinutes = workflow.jobs.benchmark['timeout-minutes'];
    assert.ok(jobMinutes <= 90, 'the benchmark job should not be allowed to run longer than before');
    // A shard that hits the per-example timeout once in its timing passes and once in each memory pass.
    const hungMinutes = (3 * Number(workflow.env.AG_EXAMPLE_TIMEOUT_MS)) / 60_000;
    assert.ok(hungMinutes < jobMinutes / 2, `three timeouts (${hungMinutes}m) should stay well inside ${jobMinutes}m`);
});
