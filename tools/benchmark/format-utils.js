/**
 * Shared formatting utilities for the browser benchmark comparison and
 * Slack-formatting scripts.
 */

/**
 * Format a percentage change value for display.
 * Returns "N/A" for null/undefined, otherwise "+X%" or "-X%".
 */
function formatPercentageChange(pctChange) {
    if (pctChange === null || pctChange === undefined) {
        return 'N/A';
    }
    return `${pctChange > 0 ? '+' : ''}${pctChange}%`;
}

/**
 * Detect whether a data key represents a percentage change field.
 */
function isPercentageKey(key) {
    return key.startsWith('pct') && key.endsWith('Change');
}

/**
 * Format a cell value, applying percentage formatting for percentage keys.
 */
function formatCellValue(key, value) {
    if (isPercentageKey(key)) {
        return formatPercentageChange(value);
    }
    return String(value ?? '');
}

/**
 * Format benchmark data as a fixed-width text table suitable for Slack code blocks.
 *
 * @param {Array<object>} data - Array of result objects (must have a `test` field).
 * @param {string[]} headers - Data keys to include as columns (after `test`).
 * @param {string[]} [headerLabels] - Display labels for columns (defaults to header keys).
 * @param {object} [opts]
 * @param {number} [opts.maxWidth=80] - Maximum table width in characters.
 * @param {boolean} [opts.truncate=true] - Show top 5 / bottom 5 with a gap separator.
 */
function formatTable(data, headers, headerLabels, { maxWidth = 80, truncate = true } = {}) {
    // Build row set
    let rows;
    if (truncate) {
        rows = [...data.slice(0, 5)];
        if (data.length >= 10) {
            rows.push({}, ...data.slice(-5));
        } else if (data.length > 5) {
            rows.push(...data.slice(5));
        }
    } else {
        rows = data;
    }

    const dataKeys = ['test', ...headers];
    const labels = ['Test', ...(headerLabels || headers)];
    const padding = 2;

    // Calculate column widths
    const colWidths = labels.map((h) => h.length);
    for (const row of rows) {
        if (Object.keys(row).length > 0) {
            dataKeys.forEach((key, i) => {
                const val = formatCellValue(key, row[key]);
                colWidths[i] = Math.max(colWidths[i], val.length);
            });
        }
    }

    // Constrain first column to fit within max width
    const otherColsWidth = colWidths.slice(1).reduce((sum, w) => sum + w, 0);
    const spacingWidth = (labels.length - 1) * padding;
    colWidths[0] = Math.min(colWidths[0], maxWidth - otherColsWidth - spacingWidth);

    // Header row
    let table =
        labels
            .map((h, i) => {
                const text = i === 0 ? h.slice(0, colWidths[0]) : h;
                return i === 0 ? text.padEnd(colWidths[i]) : text.padStart(colWidths[i]);
            })
            .join('  ') + '\n';
    table += labels.map((_, i) => '='.repeat(colWidths[i])).join('==') + '\n';

    // Data rows
    for (const row of rows) {
        if (Object.keys(row).length === 0) {
            table += labels.map((_, i) => '.'.repeat(colWidths[i])).join('..') + '\n';
        } else {
            table +=
                dataKeys
                    .map((key, i) => {
                        const val = formatCellValue(key, row[key]);
                        const text =
                            i === 0 ? (val.length > colWidths[0] ? val.slice(0, colWidths[0] - 3) + '...' : val) : val;
                        return i === 0 ? text.padEnd(colWidths[i]) : text.padStart(colWidths[i]);
                    })
                    .join('  ') + '\n';
        }
    }

    return table;
}

/** Slack rejects a section block whose `text` is longer than this (`invalid_blocks`). */
const SLACK_SECTION_TEXT_LIMIT = 3000;

/**
 * Slack documents no limit for an attachment's `text`, but truncates a message's `text` past 40,000 characters and
 * rejects an oversized attachment payload. Stay well inside the former, leaving room for the blocks.
 */
const SLACK_ATTACHMENT_TEXT_LIMIT = 35000;

/**
 * Join `items` between `head` and `tail`, dropping whole items until the result is at most `limit` characters long.
 * Dropped items are counted in a `more(n)` item where they were, so a code block keeps its closing fence and a reader
 * can see the list was cut.
 *
 * @param {string[]} items
 * @param {number} limit
 * @param {object} [opts]
 * @param {string} [opts.head=''] - Text before the first item.
 * @param {string} [opts.tail=''] - Text after the last item.
 * @param {string} [opts.separator='\n'] - Text between items.
 * @param {(n: number) => string} [opts.more] - The item that stands in for `n` dropped items.
 * @param {'end' | 'middle'} [opts.dropFrom='end'] - `middle` keeps both ends of a ranked table: best and worst rows.
 */
function fitItems(
    items,
    limit,
    { head = '', tail = '', separator = '\n', more = (n) => `…and ${n} more`, dropFrom = 'end' } = {}
) {
    const render = (count) => {
        const dropped = items.length - count;
        let kept = items;
        if (dropped > 0 && dropFrom === 'middle') {
            const start = Math.ceil(count / 2);
            kept = [...items.slice(0, start), more(dropped), ...items.slice(start + dropped)];
        } else if (dropped > 0) {
            kept = [...items.slice(0, count), more(dropped)];
        }
        return head + kept.join(separator) + tail;
    };
    let count = items.length;
    let text = render(count);
    while (text.length > limit && count > 0) text = render(--count);
    return text.slice(0, limit);
}

/**
 * Name the first `maxNames` entries of `names`, then count the rest, e.g. `a, b, c, +4 more`.
 *
 * @param {string[]} names
 * @param {number} maxNames
 */
function listNames(names, maxNames) {
    const shown = names.slice(0, maxNames);
    if (names.length > maxNames) shown.push(`+${names.length - maxNames} more`);
    return shown.join(', ');
}

/**
 * Count entries by group, largest group first, e.g. `item-styler-shadow-glow ×24, shadow-root ×13, +1 more`.
 *
 * @param {string[]} groups - The group of each entry; repeated groups are counted.
 * @param {number} maxGroups
 */
function countByGroup(groups, maxGroups) {
    const counts = new Map();
    for (const group of groups) counts.set(group, (counts.get(group) ?? 0) + 1);
    const ranked = [...counts].sort((a, b) => b[1] - a[1]).map(([group, n]) => `${group} ×${n}`);
    return listNames(ranked, maxGroups);
}

/**
 * Validate that required Slack environment variables are set.
 * @returns {{ channel: string, username: string, icon_url: string }}
 */
function requireSlackEnv() {
    const channel = process.env.SLACK_CHANNEL;
    const username = process.env.SLACK_USERNAME;
    const icon_url = process.env.SLACK_ICON;

    if (!channel) throw new Error('SLACK_CHANNEL is not set');
    if (!username) throw new Error('SLACK_USERNAME is not set');
    if (!icon_url) throw new Error('SLACK_ICON is not set');

    return { channel, username, icon_url };
}

module.exports = {
    SLACK_ATTACHMENT_TEXT_LIMIT,
    SLACK_SECTION_TEXT_LIMIT,
    countByGroup,
    fitItems,
    formatPercentageChange,
    formatTable,
    listNames,
    requireSlackEnv,
};
