/** Median of a list of numbers; null when there are none. */
function median(values) {
    if (!values?.length) return null;
    const sorted = values.toSorted((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Percentage change from `before` to `after`, to one decimal place; null against a zero baseline. */
function pctChange(before, after) {
    return before === 0 ? null : Math.round(((after - before) / before) * 1000) / 10;
}

module.exports = { median, pctChange };
