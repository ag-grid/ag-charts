const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { selectMemoryExamples } = require('./memory-examples');
const { node } = require('./memory-fixtures');

/** Which examples get the memory pass: `high-perf-*` always, the zoom family unless a bare `/benchmarks` run. */

const MEMORY_EXAMPLES = path.join(__dirname, 'memory-examples.js');
const SHARD = ['data-selection-zoom-bar', 'high-perf-bar', 'simple-chart', 'data-selection-zoom-line-area'];

test('high-perf examples get the memory pass on every trigger, and other examples never do', () => {
    for (const event of ['schedule', 'push', 'workflow_dispatch', 'issue_comment']) {
        assert.deepEqual(selectMemoryExamples(['simple-chart', 'high-perf-bar', 'high-perf-line'], { event }), [
            'high-perf-bar',
            'high-perf-line',
        ]);
    }
});

test('the zoom family gets the memory pass on scheduled, release-branch and manual runs', () => {
    for (const event of ['schedule', 'push', 'workflow_dispatch']) {
        assert.deepEqual(selectMemoryExamples(SHARD, { event }), [
            'data-selection-zoom-bar',
            'high-perf-bar',
            'data-selection-zoom-line-area',
        ]);
    }
});

test('a bare /benchmarks comment skips the zoom family but keeps high-perf', () => {
    assert.deepEqual(selectMemoryExamples(SHARD, { event: 'issue_comment' }), ['high-perf-bar']);
    assert.deepEqual(selectMemoryExamples(SHARD, { event: 'issue_comment', requested: [] }), ['high-perf-bar']);
});

test('a /benchmarks comment that names a zoom example keeps its memory pass, and only that one', () => {
    const requested = ['data-selection-zoom-bar', 'high-perf-bar'];
    assert.deepEqual(selectMemoryExamples(SHARD, { event: 'issue_comment', requested }), [
        'data-selection-zoom-bar',
        'high-perf-bar',
    ]);
});

test('selection keeps the candidates order and tolerates an empty shard', () => {
    assert.deepEqual(selectMemoryExamples([], { event: 'schedule' }), []);
    assert.deepEqual(selectMemoryExamples(['high-perf-z', 'high-perf-a'], { event: 'schedule' }), [
        'high-perf-z',
        'high-perf-a',
    ]);
});

test('CLI prints the selection as a comma list, from comma or whitespace separated input', () => {
    const run = (...args) => node(MEMORY_EXAMPLES, args);

    const scheduled = run('--event', 'schedule', '--candidates', SHARD.join(','));
    assert.equal(scheduled.status, 0, scheduled.stderr);
    assert.equal(scheduled.stdout, 'data-selection-zoom-bar,high-perf-bar,data-selection-zoom-line-area\n');

    const bare = run('--event', 'issue_comment', '--candidates', SHARD.join(','), '--requested', '');
    assert.equal(bare.stdout, 'high-perf-bar\n');

    // The comment's own spacing and commas, as the resolve job forwards them.
    const named = run(
        '--event',
        'issue_comment',
        '--candidates',
        SHARD.join(','),
        '--requested',
        ', data-selection-zoom-bar,high-perf-bar,'
    );
    assert.equal(named.stdout, 'data-selection-zoom-bar,high-perf-bar\n');

    const none = run('--event', 'issue_comment', '--candidates', 'data-selection-zoom-bar');
    assert.equal(none.status, 0, none.stderr);
    assert.equal(none.stdout, '\n');
});

test('CLI without an event or candidates prints usage and fails', () => {
    for (const args of [[], ['--event', 'schedule'], ['--candidates', 'a']]) {
        const out = node(MEMORY_EXAMPLES, args);
        assert.equal(out.status, 1);
        assert.match(out.stderr, /Usage: memory-examples\.js/);
    }
});
