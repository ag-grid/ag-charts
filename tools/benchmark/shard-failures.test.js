const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
    collectExcluded,
    formatExcluded,
    isBaseOnly,
    remainingExamples,
    timedOutExamples,
} = require('./shard-failures');
const { BROKEN_BASE: BROKEN, NOT_FOUND, node, shardReport, withFiles } = require('./memory-fixtures');

const SHARD_FAILURES = path.join(__dirname, 'shard-failures.js');

// --- remaining: which examples later passes still run ---

test('remainingExamples drops an example that timed out in an earlier pass and keeps the order', () => {
    withFiles({ r1: shardReport({ a: 'success', hung: 'timeout', c: 'success' }) }, (p) => {
        assert.deepEqual(remainingExamples(['a', 'hung', 'c'], [p.r1]), ['a', 'c']);
    });
});

test('remainingExamples keeps an example that merely errored, so it runs in every pass as before', () => {
    withFiles({ r1: shardReport({ a: 'success', flaky: 'error' }) }, (p) => {
        assert.deepEqual(remainingExamples(['a', 'flaky'], [p.r1]), ['a', 'flaky']);
    });
});

test('remainingExamples gathers timeouts across every report and ignores reports that do not exist', () => {
    withFiles({ r1: shardReport({ x: 'timeout' }), r2: shardReport({ y: 'timeout' }) }, (p) => {
        const missing = path.join(p.dir, 'never-written.json');
        assert.deepEqual([...timedOutExamples([p.r1, missing, p.r2])].sort(), ['x', 'y']);
        assert.deepEqual(remainingExamples(['x', 'y', 'z'], [missing, p.r1, p.r2]), ['z']);
        assert.deepEqual(remainingExamples(['x', 'y', 'z'], []), ['x', 'y', 'z']);
    });
});

test('remainingExamples tolerates a report with no examples', () => {
    withFiles({ empty: { summary: {} } }, (p) => {
        assert.deepEqual(remainingExamples(['a'], [p.empty]), ['a']);
    });
});

test('CLI remaining prints the comma-separated survivors', () => {
    withFiles({ r1: shardReport({ hung: 'timeout', a: 'success' }) }, (p) => {
        const out = node(SHARD_FAILURES, ['remaining', '--examples', 'a,hung,b', p.r1, path.join(p.dir, 'none.json')]);
        assert.equal(out.status, 0, out.stderr);
        assert.equal(out.stdout, 'a,b\n');
    });
});

test('CLI remaining accepts whitespace-separated names and prints an empty line when nothing is left', () => {
    withFiles({ r1: shardReport({ hung: 'timeout' }) }, (p) => {
        assert.equal(node(SHARD_FAILURES, ['remaining', '--examples', 'a hung', p.r1]).stdout, 'a\n');
        assert.equal(node(SHARD_FAILURES, ['remaining', '--examples', 'hung', p.r1]).stdout, '\n');
    });
});

test('CLI rejects an unknown command or missing options with usage and a non-zero exit', () => {
    for (const args of [[], ['bogus'], ['excluded'], ['excluded', '--shards-dir', 'x']]) {
        const out = node(SHARD_FAILURES, args);
        assert.equal(out.status, 1, `${args.join(' ')} should fail`);
        assert.match(out.stderr, /Usage: shard-failures\.js/);
    }
});

// --- excluded: what the report leaves out and lists ---

/** Writes `{ file: statuses }` into a temp directory and runs `fn(dir)`. */
const withShards = (files, fn) =>
    withFiles(Object.fromEntries(Object.entries(files).map(([file, s]) => [file, shardReport(s)])), (p) => {
        // withFiles names each file `<key>.json`, which is exactly the shard report naming.
        return fn(p.dir);
    });

test('collectExcluded is empty when every example succeeded in every pass', () => {
    withShards({ 'head-0.r1': { a: 'success' }, 'base-0.r1': { a: 'success' } }, (dir) => {
        assert.deepEqual(collectExcluded(dir), []);
    });
});

test('collectExcluded names a hung example with its side, status and the passes that skipped it', () => {
    withShards(
        {
            // head r1 hung on `hung`; every later pass of the shard skips it.
            'head-0.r1': { a: 'success', hung: 'timeout' },
            'base-0.r1': { a: 'success' },
            'head-0.r2': { a: 'success' },
            'base-0.r2': { a: 'success' },
        },
        (dir) => {
            const [entry, ...rest] = collectExcluded(dir);
            assert.equal(rest.length, 0);
            assert.equal(entry.example, 'hung');
            assert.deepEqual(entry.failed, [{ side: 'head', pass: 'r1', status: 'timeout', error: 'timeout in hung' }]);
            assert.deepEqual(entry.skipped, [
                { side: 'base', pass: 'r1' },
                { side: 'base', pass: 'r2' },
                { side: 'head', pass: 'r2' },
            ]);
            assert.deepEqual(formatExcluded([entry]), ['hung: head r1 timeout; skipped: base r1, base r2, head r2']);
        }
    );
});

test('collectExcluded lists an errored example once per failing pass and nothing as skipped', () => {
    withShards(
        {
            'head-1.r1': { flaky: 'error', ok: 'success' },
            'base-1.r1': { flaky: 'error', ok: 'success' },
            'head-1.r2': { flaky: 'success', ok: 'success' },
        },
        (dir) => {
            const [entry, ...rest] = collectExcluded(dir);
            assert.equal(rest.length, 0);
            assert.equal(entry.example, 'flaky');
            assert.deepEqual(
                entry.failed.map(({ side, pass, status }) => `${side} ${pass} ${status}`),
                ['base r1 error', 'head r1 error']
            );
            assert.deepEqual(entry.skipped, []);
            assert.deepEqual(formatExcluded([entry]), ['flaky: base r1 error, head r1 error']);
        }
    );
});

test('collectExcluded reports every failing example sorted by name, across shards', () => {
    withShards(
        {
            'head-0.r1': { zeta: 'timeout', a: 'success' },
            'head-1.r1': { alpha: 'error' },
        },
        (dir) => {
            assert.deepEqual(
                collectExcluded(dir).map((e) => e.example),
                ['alpha', 'zeta']
            );
        }
    );
});

test('collectExcluded only counts a pass as skipped within the same shard', () => {
    withShards(
        {
            'head-0.r1': { hung: 'timeout' },
            // Shard 1 never ran `hung`, so its passes are not "skipped" passes of it.
            'head-1.r1': { other: 'success' },
        },
        (dir) => {
            assert.deepEqual(collectExcluded(dir)[0].skipped, []);
        }
    );
});

test('collectExcluded ignores the advisory memory pass and files that are not timing passes', () => {
    withShards(
        {
            'head-0.r1': { a: 'success' },
            'head-0.mem': { a: 'timeout' },
            excluded: { a: 'timeout' },
        },
        (dir) => {
            assert.deepEqual(collectExcluded(dir), []);
        }
    );
});

test('CLI excluded writes the JSON file and prints one line per excluded example', () => {
    withShards({ 'head-0.r1': { hung: 'timeout' }, 'base-0.r1': {} }, (dir) => {
        const output = path.join(dir, 'out', 'excluded.json');
        fs.mkdirSync(path.dirname(output));
        const out = node(SHARD_FAILURES, ['excluded', '--shards-dir', dir, '--output', output]);
        assert.equal(out.status, 0, out.stderr);
        assert.equal(out.stdout, 'hung: head r1 timeout; skipped: base r1\n');
        const written = JSON.parse(fs.readFileSync(output, 'utf8'));
        assert.deepEqual(
            written.map((e) => e.example),
            ['hung']
        );
    });
});

test('CLI excluded writes an empty list when nothing failed, so downstream steps can always read it', () => {
    withShards({ 'head-0.r1': { a: 'success' } }, (dir) => {
        const output = path.join(dir, 'excluded.out');
        const out = node(SHARD_FAILURES, ['excluded', '--shards-dir', dir, '--output', output]);
        assert.equal(out.status, 0, out.stderr);
        assert.equal(out.stdout, '');
        assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), []);
    });
});

test('collectExcluded treats a missing shards directory as no shards, and the CLI writes an empty list', () => {
    withShards({}, (dir) => {
        const missing = path.join(dir, 'never-created');
        assert.deepEqual(collectExcluded(missing), []);

        const output = path.join(dir, 'excluded.json');
        const out = node(SHARD_FAILURES, ['excluded', '--shards-dir', missing, '--output', output]);
        assert.equal(out.status, 0, out.stderr);
        assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), []);
    });
});

// --- base-only: an example that failed only on the base is shown as a head-only row ---

test('collectExcluded marks an example that 404ed on the base in every pass as base-only: not on base', () => {
    withShards(
        {
            'head-0.r1': { 'new-one': 'success' },
            'base-0.r1': { 'new-one': NOT_FOUND },
            'head-0.r2': { 'new-one': 'success' },
            'base-0.r2': { 'new-one': NOT_FOUND },
        },
        (dir) => {
            const [entry, ...rest] = collectExcluded(dir);
            assert.equal(rest.length, 0);
            assert.equal(entry.example, 'new-one');
            assert.equal(entry.baseOnly, true);
            assert.equal(entry.reason, 'not on base');
            assert.deepEqual(
                entry.failed.map(({ side, pass, status }) => `${side} ${pass} ${status}`),
                ['base r1 error', 'base r2 error']
            );
            assert.equal(isBaseOnly(entry), true);
            assert.deepEqual(formatExcluded([entry]), [
                'new-one: base r1 error, base r2 error [base-only: not on base]',
            ]);
        }
    );
});

test('collectExcluded gives a base error that is not an HTTP 404 the reason base failed', () => {
    withShards({ 'head-0.r1': { a: 'success' }, 'base-0.r1': { a: BROKEN } }, (dir) => {
        const [entry] = collectExcluded(dir);
        assert.equal(entry.baseOnly, true);
        assert.equal(entry.reason, 'base failed');
        assert.match(formatExcluded([entry])[0], /\[base-only: base failed/);
    });
});

test('collectExcluded gives a mix of 404 and other base errors the reason base failed', () => {
    withShards(
        {
            'head-0.r1': { a: 'success' },
            'base-0.r1': { a: NOT_FOUND },
            'head-0.r2': { a: 'success' },
            'base-0.r2': { a: BROKEN },
        },
        (dir) => {
            assert.equal(collectExcluded(dir)[0].reason, 'base failed');
        }
    );
});

test('collectExcluded keeps a base error in a single pass base-only when the head succeeded in all passes', () => {
    withShards(
        {
            'head-0.r1': { a: 'success' },
            'base-0.r1': { a: 'success' },
            'head-0.r2': { a: 'success' },
            'base-0.r2': { a: BROKEN },
        },
        (dir) => {
            assert.equal(collectExcluded(dir)[0].baseOnly, true);
        }
    );
});

test('collectExcluded is not base-only when the head also failed, in the same or another pass', () => {
    withShards({ 'head-0.r1': { a: BROKEN }, 'base-0.r1': { a: BROKEN } }, (dir) => {
        const [entry] = collectExcluded(dir);
        assert.equal(entry.baseOnly, undefined);
        assert.equal(isBaseOnly(entry), false);
    });
    withShards(
        {
            'head-0.r1': { a: 'success' },
            'base-0.r1': { a: NOT_FOUND },
            'head-0.r2': { a: 'error' },
            'base-0.r2': { a: 'success' },
        },
        (dir) => {
            assert.equal(collectExcluded(dir)[0].baseOnly, undefined);
        }
    );
});

test('collectExcluded is not base-only for a head error or a head timeout alone', () => {
    for (const status of ['error', 'timeout']) {
        withShards({ 'head-0.r1': { a: status }, 'base-0.r1': { a: 'success' } }, (dir) => {
            assert.equal(collectExcluded(dir)[0].baseOnly, undefined, `head ${status}`);
        });
    }
});

test('collectExcluded is not base-only for a base timeout, which the head passes then skip', () => {
    withShards(
        {
            'head-0.r1': { a: 'success' },
            'base-0.r1': { a: 'timeout' },
            // `remaining` drops a timed-out example from later passes on both sides.
            'head-0.r2': { other: 'success' },
            'base-0.r2': { other: 'success' },
        },
        (dir) => {
            const [entry] = collectExcluded(dir);
            assert.equal(entry.example, 'a');
            assert.equal(entry.baseOnly, undefined);
        }
    );
});

test('collectExcluded is not base-only when a base error comes with a base timeout', () => {
    withShards(
        {
            'head-0.r1': { a: 'success' },
            'base-0.r1': { a: NOT_FOUND },
            'head-0.r2': { a: 'success' },
            'base-0.r2': { a: 'timeout' },
        },
        (dir) => {
            assert.equal(collectExcluded(dir)[0].baseOnly, undefined);
        }
    );
});

test('collectExcluded is not base-only when a head pass of the shard lacks the example', () => {
    withShards(
        {
            'head-0.r1': { a: 'success' },
            'base-0.r1': { a: BROKEN },
            // The head's second pass has other examples but no `a`, so the head did not succeed in every pass.
            'head-0.r2': { other: 'success' },
            'base-0.r2': { a: 'success', other: 'success' },
        },
        (dir) => {
            assert.equal(collectExcluded(dir)[0].baseOnly, undefined);
        }
    );
});

test('collectExcluded classifies each example on its own', () => {
    withShards(
        {
            'head-0.r1': { onlyBase: 'success', both: 'error', hung: 'timeout' },
            'base-0.r1': { onlyBase: NOT_FOUND, both: 'error' },
        },
        (dir) => {
            assert.deepEqual(
                collectExcluded(dir).map(({ example, baseOnly }) => [example, baseOnly === true]),
                [
                    ['both', false],
                    ['hung', false],
                    ['onlyBase', true],
                ]
            );
        }
    );
});

test('isBaseOnly accepts only baseOnly === true, so a missing or malformed field fails closed', () => {
    assert.equal(isBaseOnly({ example: 'a', baseOnly: true }), true);
    for (const entry of [
        { example: 'a' },
        { baseOnly: 'true' },
        { baseOnly: 1 },
        { baseOnly: false },
        null,
        undefined,
    ]) {
        assert.equal(isBaseOnly(entry), false, JSON.stringify(entry));
    }
});

test('formatExcluded marks only the base-only entries and falls back to base failed without a reason', () => {
    const failed = [{ side: 'base', pass: 'r1', status: 'error' }];
    const [plain, marked, noReason] = formatExcluded([
        { example: 'x', failed, skipped: [] },
        { example: 'y', failed, skipped: [], baseOnly: true, reason: 'not on base' },
        { example: 'z', failed, skipped: [], baseOnly: true },
    ]);
    assert.equal(plain, 'x: base r1 error');
    assert.equal(marked, 'y: base r1 error [base-only: not on base]');
    assert.match(noReason, /\[base-only: base failed\]/);
});

test('CLI excluded writes baseOnly and reason to the JSON and marks the printed line', () => {
    withShards(
        { 'head-0.r1': { 'new-one': 'success', hung: 'timeout' }, 'base-0.r1': { 'new-one': NOT_FOUND } },
        (dir) => {
            const output = path.join(dir, 'excluded.out');
            const out = node(SHARD_FAILURES, ['excluded', '--shards-dir', dir, '--output', output]);
            assert.equal(out.status, 0, out.stderr);
            const lines = out.stdout.trimEnd().split('\n');
            assert.equal(lines.length, 2);
            assert.match(lines[0], /^hung: head r1 timeout/);
            assert.doesNotMatch(lines[0], /base-only/);
            assert.match(lines[1], /^new-one: base r1 error \[base-only: not on base/);
            const written = JSON.parse(fs.readFileSync(output, 'utf8'));
            assert.deepEqual(
                written.map(({ example, baseOnly, reason }) => [example, baseOnly, reason]),
                [
                    ['hung', undefined, undefined],
                    ['new-one', true, 'not on base'],
                ]
            );
        }
    );
});
