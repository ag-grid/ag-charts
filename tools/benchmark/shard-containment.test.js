const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const yaml = require('js-yaml');

const { exampleEntry, node, report, result, runCompare, MERGE, withFiles } = require('./memory-fixtures');

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

const shardOf = (statuses, { memory = false } = {}) => ({
    ...report({}, { memory }),
    examples: Object.fromEntries(
        Object.entries(statuses).map(([name, status]) => [
            name,
            status === 'success' ? exampleEntry([result('t')]) : { status, error: `${status}\nat x`, durationMs: 1 },
        ])
    ),
    summary: { total: Object.keys(statuses).length },
});

test('merge --exclude leaves the listed examples out of every shard and keeps the rest', () => {
    withFiles(
        {
            s0: shardOf({ a: 'success', hung: 'timeout' }),
            s1: shardOf({ b: 'success', c: 'error' }),
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
    withFiles({ s0: shardOf({ a: 'success', hung: 'timeout' }) }, (p) => {
        const output = path.join(p.dir, 'merged.json');
        assert.equal(node(MERGE, ['--output', output, p.s0]).status, 0);
        assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(output, 'utf8')).examples).sort(), ['a', 'hung']);
    });
});

test('merge --exclude with an empty list changes nothing', () => {
    withFiles({ s0: shardOf({ a: 'success' }), excluded: [] }, (p) => {
        const output = path.join(p.dir, 'merged.json');
        assert.equal(node(MERGE, ['--exclude', p.excluded, '--output', output, p.s0]).status, 0);
        assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(output, 'utf8')).examples), ['a']);
    });
});

const EXCLUDED_ENTRY = {
    example: 'hung',
    shard: '0',
    failed: [{ side: 'head', pass: 'r1', status: 'timeout' }],
    skipped: [{ side: 'base', pass: 'r1' }],
};

test('compare --excluded compares the healthy examples and lists the excluded ones in the JSON output', () => {
    withFiles({ run: report({ healthy: [result('t')] }), excluded: [EXCLUDED_ENTRY] }, (p) => {
        const out = node(path.join(__dirname, 'compare-browser-results.js'), [
            '--base',
            p.run,
            '--compare',
            p.run,
            '--excluded',
            p.excluded,
            '--format',
            'json',
        ]);
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
        const compare = path.join(__dirname, 'compare-browser-results.js');

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
function withShardJob(fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shard-job-'));
    try {
        const bin = path.join(dir, 'tools/benchmark');
        fs.mkdirSync(bin, { recursive: true });
        fs.copyFileSync(path.join(__dirname, 'shard-failures.js'), path.join(bin, 'shard-failures.js'));
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
            AG_MEMORY_EXAMPLE_PATTERN: '.',
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
    withShardJob(({ run, calls }) => {
        const proc = run(timingStep, { SHARD_EXAMPLES: 'hung', HANG: 'hung' });
        assert.equal(proc.status, 0, proc.stderr);
        // Only the first pass runs; an empty --examples would mean "every example".
        assert.deepEqual(callSummary(calls()), ['head-0.r1.json: hung']);
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
        run(timingStep, { SHARD_EXAMPLES: 'alpha,hung,omega', HANG: 'hung' });
        const before = calls().length;
        const proc = run(memoryStep, { SHARD_EXAMPLES: 'alpha,hung,omega', HANG: 'hung' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls().slice(before)), [
            'head-0.mem.json: alpha,omega',
            'base-0.mem.json: alpha,omega',
        ]);
    });
});

test('memory pass: a hang in the head memory pass is not repeated on the base side', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(memoryStep, { SHARD_EXAMPLES: 'alpha,hung', HANG: 'hung', HANG_ONLY_MEMORY: 'true' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls()), ['head-0.mem.json: alpha,hung', 'base-0.mem.json: alpha']);
    });
});

test('memory pass: when the only example hangs on the head side the base memory pass is skipped', () => {
    withShardJob(({ run, calls }) => {
        const proc = run(memoryStep, { SHARD_EXAMPLES: 'hung', HANG: 'hung', HANG_ONLY_MEMORY: 'true' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.deepEqual(callSummary(calls()), ['head-0.mem.json: hung']);
    });
});

test('memory pass: with every example already hung the pass is skipped without error', () => {
    withShardJob(({ run, calls }) => {
        run(timingStep, { SHARD_EXAMPLES: 'hung', HANG: 'hung' });
        const before = calls().length;
        const proc = run(memoryStep, { SHARD_EXAMPLES: 'hung', HANG: 'hung' });
        assert.equal(proc.status, 0, proc.stderr);
        assert.equal(calls().length, before);
        assert.match(proc.stdout, /skipping the memory pass/);
    });
});

test('memory pass: still honours AG_MEMORY_EXAMPLE_PATTERN and AG_EXAMPLE_TIMEOUT_MS', () => {
    withShardJob(({ run, calls }) => {
        run(memoryStep, {
            SHARD_EXAMPLES: 'high-perf-bar,simple-chart',
            AG_MEMORY_EXAMPLE_PATTERN: '^high-perf-',
            AG_EXAMPLE_TIMEOUT_MS: '4242',
        });
        assert.deepEqual(callSummary(calls()), ['head-0.mem.json: high-perf-bar', 'base-0.mem.json: high-perf-bar']);
        assert.ok(calls().every(({ timeout }) => timeout === '4242'));
    });
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
                            JSON.stringify(shardOf(examples))
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

test('merge step: an errored example in one run is likewise left out of all runs instead of failing the report', () => {
    const erroredOnce = (side, shard, run) =>
        shard === 0
            ? { healthy: 'success', flaky: side === 'base' && run === 2 ? 'error' : 'success' }
            : { other: 'success' };
    withReportJob({ statuses: erroredOnce }, ({ merge, read }) => {
        const proc = merge();
        assert.equal(proc.status, 0, proc.stderr + proc.stdout);
        for (const run of [1, 2, 3]) {
            assert.deepEqual(Object.keys(read(`head.r${run}.json`).examples).sort(), ['healthy', 'other']);
        }
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
                JSON.stringify(shardOf({ healthy: 'success', hung: 'success' }, { memory: true }))
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
