const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { COMPARE, EXCLUDED_ENTRY, node, report, result, withFiles } = require('./memory-fixtures');

/** The Slack message the nightly posts: how failed or timed-out examples are listed beside the comparison. */

const FORMAT = path.join(__dirname, 'format-browser-slack-message.js');
const SLACK_ENV = { SLACK_CHANNEL: 'c', SLACK_USERNAME: 'u', SLACK_ICON: 'i' };

const ranked = (test_, pct) => ({ test: test_, pctTimeChange: pct, beforeMs: 10, afterMs: 12 });
const comparison = (extra = {}) => ({
    base: 'base',
    compare: 'head',
    rankedByTime: [ranked('healthy/case', 5)],
    ...extra,
});

function format(input) {
    return withFiles({ input }, (p) => {
        const proc = spawnSync(process.execPath, [FORMAT, '--input', p.input], {
            encoding: 'utf8',
            env: { ...process.env, ...SLACK_ENV },
        });
        assert.equal(proc.status, 0, proc.stderr);
        return JSON.parse(proc.stdout);
    });
}

/** The text of the trailing notes block, or undefined when the message has none (the timings table comes last). */
const notesOf = (message) => {
    const text = message.blocks.at(-1).text.text;
    return text.startsWith('*Timings*') ? undefined : text;
};

test('slack message lists the excluded examples by name in its notes', () => {
    const message = format(
        comparison({
            excluded: ['data-selection-zoom-bar: head r1 timeout; skipped: base r1, head r2', 'broken: base r2 error'],
        })
    );
    assert.equal(notesOf(message), '2 excluded (failed or timed out: data-selection-zoom-bar, broken)');
});

test('slack message joins the excluded note with the other notes', () => {
    const message = format(
        comparison({
            added: ['a'],
            errors: ['e1', 'e2'],
            excluded: ['hung: head r1 timeout'],
            skippedBelowMinVersion: ['s'],
        })
    );
    assert.equal(
        notesOf(message),
        '1 added | 2 errors | 1 excluded (failed or timed out: hung) | 1 skipped (base below min version)'
    );
});

test('slack message has no notes block, and no excluded note, when nothing was excluded', () => {
    assert.equal(notesOf(format(comparison())), undefined);
    assert.equal(notesOf(format(comparison({ excluded: [] }))), undefined);
    // A comparison written before the `excluded` field existed still formats
    assert.equal(notesOf(format(comparison({ added: ['a'] }))), '1 added');
});

test('slack message still carries the healthy comparison when examples were excluded', () => {
    const message = format(comparison({ excluded: ['hung: head r1 timeout'] }));
    const text = JSON.stringify(message);
    assert.match(text, /healthy\/case/);
    assert.match(message.attachments[0].title, /Full Timing Results \(1 benchmarks\)/);
    assert.doesNotMatch(message.attachments[0].text, /hung/);
});

test('compare output with excluded examples feeds the slack message end to end', () => {
    withFiles({ run: report({ healthy: [result('t')] }), excluded: [EXCLUDED_ENTRY] }, (p) => {
        const proc = node(COMPARE, ['--base', p.run, '--compare', p.run, '--excluded', p.excluded, '--format', 'json']);
        assert.equal(proc.status, 0, proc.stderr);
        const message = format(JSON.parse(proc.stdout));
        assert.equal(notesOf(message), '1 excluded (failed or timed out: hung)');
        assert.match(JSON.stringify(message), /healthy/);
    });
});
