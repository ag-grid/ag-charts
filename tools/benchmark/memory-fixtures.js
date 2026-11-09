/** Shared builders for the memory-pass tests: reports, temp files and the comparison/merge CLIs. */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MB = 1024 * 1024;
const COMPARE = path.join(__dirname, 'compare-browser-results.js');
const MERGE = path.join(__dirname, 'merge-browser-results.js');

/** A test result; `allocationMb` and `stdErrMb` are per measured iteration, omitted when undefined. */
function result(testCase, { allocationMb, stdErrMb, timings = [10, 10, 10] } = {}) {
    return {
        testCase,
        params: {},
        averageTime: timings[0],
        minTime: Math.min(...timings),
        maxTime: Math.max(...timings),
        sampleCount: timings.length,
        timings,
        ...(allocationMb !== undefined && {
            allocation: {
                bytesPerIteration: allocationMb * MB,
                totalBytes: allocationMb * MB * timings.length,
                iterations: timings.length,
                ...(stdErrMb !== undefined && { stdErrBytes: stdErrMb * MB }),
            },
        }),
    };
}

function exampleEntry(results, status = 'success') {
    return { status, data: { version: '14.0.0', results }, durationMs: 1 };
}

/** A report from `{ exampleName: results[] }`; `memory` marks it as a memory-pass report. */
function report(examples, { memory = false } = {}) {
    return {
        timestamp: '2026-01-01T00:00:00.000Z',
        environment: { browser: 'chromium' },
        summary: { total: Object.keys(examples).length, success: Object.keys(examples).length, error: 0, timeout: 0 },
        ...(memory && { memoryPass: { samplingIntervalBytes: 4096 } }),
        examples: Object.fromEntries(Object.entries(examples).map(([name, results]) => [name, exampleEntry(results)])),
    };
}

/** A shard report with the given `{ name: status | { status, error } }` examples; a non-success example carries an error. */
function shardReport(statuses, { memory = false } = {}) {
    return {
        ...report({}, { memory }),
        examples: Object.fromEntries(
            Object.entries(statuses).map(([name, value]) => {
                const { status, error = `${status} in ${name}\nstack line` } =
                    typeof value === 'string' ? { status: value } : value;
                return [name, status === 'success' ? exampleEntry([result('t')]) : { status, error, durationMs: 1 }];
            })
        ),
        summary: { total: Object.keys(statuses).length },
    };
}

/** The excluded-examples list the shard-failures step writes: `hung` timed out on head, so base skipped it. */
const EXCLUDED_ENTRY = {
    example: 'hung',
    shard: '0',
    failed: [{ side: 'head', pass: 'r1', status: 'timeout' }],
    skipped: [{ side: 'base', pass: 'r1' }],
};

/** Base-side page results for `shardReport`: the example is not on the base site, or fails there some other way. */
const NOT_FOUND = { status: 'error', error: 'HTTP 404 for https://example.test/benchmarks/examples/new-one' };
const BROKEN_BASE = { status: 'error', error: 'page.goto: net::ERR_FAILED' };

/** An excluded-list entry for an example that failed only on the base, as the shard-failures step writes it. */
function baseOnlyEntry(example, reason = 'not on base') {
    return {
        example,
        shard: '0',
        failed: [{ side: 'base', pass: 'r1', status: 'error' }],
        skipped: [],
        baseOnly: true,
        reason,
    };
}

/** Writes each report to `<tmp>/<name>.json`, runs `fn(paths)` (with `paths.dir`) and cleans up. */
function withFiles(files, fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-pass-'));
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

/** The compare CLI's argv for the given report paths; only the sides supplied are included. */
function compareArgs({ base, compare, baseMemory, compareMemory, excluded, format }) {
    return [
        '--base',
        ...[base].flat(),
        '--compare',
        ...[compare].flat(),
        ...(excluded ? ['--excluded', excluded] : []),
        ...(baseMemory ? ['--base-memory', baseMemory] : []),
        ...(compareMemory ? ['--compare-memory', compareMemory] : []),
        ...(format ? ['--format', format] : []),
    ];
}

/** Runs a script under node. Colour is forced off: `nx test` sets FORCE_COLOR, which would wrap table cells in escapes. */
function node(script, args) {
    return spawnSync(process.execPath, [script, ...args], {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
    });
}

/** Runs the comparison and returns `{ status, stdout, stderr, json }`; `json` is parsed for `format: 'json'`. */
function runCompare(paths, { format } = {}) {
    const proc = node(COMPARE, compareArgs({ ...paths, format }));
    return {
        status: proc.status,
        stdout: proc.stdout,
        stderr: proc.stderr,
        json: format === 'json' ? JSON.parse(proc.stdout) : null,
    };
}

/** Last `n` cells of a console.table row, with the quoting around string cells removed. */
function lastCells(line, n) {
    return line
        .split('│')
        .map((c) => c.trim().replace(/^'(.*)'$/, '$1'))
        .filter(Boolean)
        .slice(-n);
}

module.exports = {
    COMPARE,
    BROKEN_BASE,
    EXCLUDED_ENTRY,
    MB,
    MERGE,
    NOT_FOUND,
    baseOnlyEntry,
    compareArgs,
    exampleEntry,
    lastCells,
    node,
    report,
    result,
    runCompare,
    shardReport,
    withFiles,
};
