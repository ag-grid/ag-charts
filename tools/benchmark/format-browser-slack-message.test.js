const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { SLACK_ATTACHMENT_TEXT_LIMIT, SLACK_SECTION_TEXT_LIMIT, fitItems } = require('./format-utils');

const {
    COMPARE,
    EXCLUDED_ENTRY,
    baseOnlyEntry,
    node,
    report,
    result,
    runCompare,
    withFiles,
} = require('./memory-fixtures');

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

const newRow = (name, reason = null) => ({
    test: name,
    reason,
    runCount: 3,
    medianMs: '10.0',
    minMs: '9.0',
    samples: 5,
});

test('slack message lists the new head-only examples by name in its notes', () => {
    const message = format(
        comparison({
            added: ['new-one / t', 'flaky / t'],
            newHeadOnly: [newRow('new-one / t', 'not on base'), newRow('flaky / t', 'base failed')],
        })
    );
    assert.equal(notesOf(message), '2 new (head only: new-one / t, flaky / t)');
});

test('slack message does not count a new head-only example twice as added', () => {
    const message = format(comparison({ added: ['a / t'], newHeadOnly: [newRow('a / t')] }));
    assert.doesNotMatch(notesOf(message), /added/);
    assert.match(notesOf(message), /1 new \(head only: a \/ t\)/);
});

test('slack message joins the new note with the other notes and keeps the healthy comparison', () => {
    const message = format(
        comparison({
            added: ['a / t'],
            newHeadOnly: [newRow('a / t')],
            errors: ['e1'],
            excluded: ['hung: head r1 timeout'],
        })
    );
    assert.equal(notesOf(message), '1 new (head only: a / t) | 1 errors | 1 excluded (failed or timed out: hung)');
    assert.match(JSON.stringify(message), /healthy\/case/);
});

test('slack message has no new note for an empty or absent newHeadOnly list', () => {
    assert.equal(notesOf(format(comparison({ newHeadOnly: [] }))), undefined);
    assert.equal(notesOf(format(comparison())), undefined);
});

test('compare output with a base-only example feeds the slack message end to end', () => {
    withFiles(
        {
            head: report({ healthy: [result('t')], fresh: [result('t')] }),
            base: report({ healthy: [result('t')] }),
            excluded: [baseOnlyEntry('fresh')],
        },
        (p) => {
            const { status, stderr, json } = runCompare(
                { base: p.base, compare: p.head, excluded: p.excluded },
                { format: 'json' }
            );
            assert.equal(status, 0, stderr);
            assert.equal(notesOf(format(json)), '1 new (head only: fresh / t)');
        }
    );
});

/** Slack rejects the whole post (`invalid_blocks`) when any section's text is longer than this. */
const assertSectionsFit = (message) => {
    for (const block of message.blocks.filter(({ type }) => type === 'section')) {
        assert.ok(block.text.text.length <= SLACK_SECTION_TEXT_LIMIT, `${block.text.text.length} chars`);
    }
};

const variant = (example, i) =>
    `${example} / 1000 bar items / Operation=Chart Create, Styler=Styler, no shadow or glow, series shadow and glow set ${i}`;

test('slack message counts many new head-only examples per benchmark so the notes fit in a section', () => {
    // As on 25 Nov: a version gate added 52 long variant names and Slack refused the post
    const newHeadOnly = [
        ...Array.from({ length: 24 }, (_, i) => ({ ...newRow(variant('item-styler', i)), exampleName: 'item-styler' })),
        ...Array.from({ length: 13 }, (_, i) => newRow(variant('shadow-root', i))),
        ...Array.from({ length: 15 }, (_, i) => newRow(variant(`gap-${i % 5}`, i))),
    ];
    const message = format(comparison({ newHeadOnly }));
    assertSectionsFit(message);
    assert.equal(
        notesOf(message),
        '52 new (head only: item-styler ×24, shadow-root ×13, gap-0 ×3, gap-1 ×3, gap-2 ×3, +2 more)'
    );
});

test('slack message names only the first few excluded examples', () => {
    const excluded = Array.from({ length: 8 }, (_, i) => `hung-${i}: head r1 timeout`);
    assert.equal(
        notesOf(format(comparison({ excluded }))),
        '8 excluded (failed or timed out: hung-0, hung-1, hung-2, hung-3, hung-4, +3 more)'
    );
});

test('slack message cuts the full timing attachment to whole rows inside its code block', () => {
    const rankedByTime = Array.from({ length: 2000 }, (_, i) => ranked(variant('wide', i), i % 50));
    const message = format(comparison({ rankedByTime }));
    assertSectionsFit(message);
    const { text } = message.attachments[0];
    assert.ok(text.length <= SLACK_ATTACHMENT_TEXT_LIMIT, `${text.length} chars`);
    assert.match(text, /^```\nTest +%/);
    assert.match(text, /\n…and \d+ more rows\n```$/);
});

test('fitItems leaves a list that fits unchanged', () => {
    assert.equal(fitItems(['a', 'b'], 10, { head: '<', tail: '>' }), '<a\nb>');
});

test('fitItems drops whole items from the end and counts them before the tail', () => {
    const items = ['row-1', 'row-2', 'row-3', 'row-4'];
    const text = fitItems(items, 25, { head: '```\n', tail: '\n```' });
    assert.equal(text, '```\nrow-1\n…and 3 more\n```');
    assert.equal(fitItems(items, 20, { separator: ' | ', more: (n) => `+${n}` }), 'row-1 | row-2 | +2');
});

test('fitItems never exceeds the limit, even when the head alone is too long', () => {
    assert.equal(fitItems(['a'], 5, { head: 'heading' }), 'headi');
});
