/**
 * Allocation (memory-pass) helpers shared by the browser benchmark runner and the comparison scripts.
 *
 * The runner's memory pass samples V8 allocations through CDP `HeapProfiler` around each measured
 * iteration and records `allocation.bytesPerIteration` on the matching result. The comparison
 * reads those results from separate memory-pass reports, so timing medians are never taken from a
 * pass that ran with sampling attached.
 */

const BYTES_PER_MB = 1024 * 1024;

/**
 * Total bytes in a CDP `HeapProfiler.stopSampling` profile.
 *
 * Every node's `selfSize` is already scaled by V8 to estimate the true allocated size, so the sum
 * over the call tree is the estimate for the whole window. Iterative: deep call trees would blow
 * the stack on a recursive walk.
 */
function sumSamplingProfileBytes(profile) {
    let total = 0;
    const stack = profile?.head ? [profile.head] : [];
    while (stack.length > 0) {
        const node = stack.pop();
        total += node.selfSize ?? 0;
        if (node.children) stack.push(...node.children);
    }
    return total;
}

function median(values) {
    if (values.length === 0) return null;
    const sorted = values.toSorted((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Per-test allocation of one report: Map(key -> bytes per measured iteration).
 *
 * Results without allocation data (a harness that predates the memory pass, or an example that
 * errored) are left out, so a missing key always means "no data" and never "zero bytes".
 *
 * @param {object} report - A browser benchmark JSON report.
 * @param {(exampleName: string, result: object) => string} keyFn - Builds the comparison key.
 */
function extractAllocationRun(report, keyFn) {
    const results = new Map();
    for (const [exampleName, example] of Object.entries(report?.examples ?? {})) {
        if (example.status !== 'success' || !Array.isArray(example.data?.results)) continue;
        for (const result of example.data.results) {
            const bytes = result.allocation?.bytesPerIteration;
            if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) continue;
            results.set(keyFn(exampleName, result), bytes);
        }
    }
    return results;
}

/** Median of each key's bytes per iteration across independent memory-pass reports. */
function aggregateAllocation(reports, keyFn) {
    const perKey = new Map();
    for (const report of reports) {
        for (const [key, bytes] of extractAllocationRun(report, keyFn)) {
            const values = perKey.get(key);
            if (values) values.push(bytes);
            else perKey.set(key, [bytes]);
        }
    }
    const merged = new Map();
    for (const [key, values] of perKey) merged.set(key, median(values));
    return merged;
}

/**
 * Before/after allocation for one matched test. A side without data stays null, and the delta and
 * percentage need both sides, so a missing side reads as "unknown" rather than as a spurious win
 * or regression.
 */
function allocationChange(beforeBytes, afterBytes) {
    const toMb = (bytes) => (typeof bytes === 'number' ? bytes / BYTES_PER_MB : null);
    const hasBoth = typeof beforeBytes === 'number' && typeof afterBytes === 'number';
    return {
        beforeMb: toMb(beforeBytes),
        afterMb: toMb(afterBytes),
        deltaMb: hasBoth ? (afterBytes - beforeBytes) / BYTES_PER_MB : null,
        pctChange:
            hasBoth && beforeBytes !== 0 ? Math.round(((afterBytes - beforeBytes) / beforeBytes) * 1000) / 10 : null,
    };
}

/** MB to two decimals, `—` when unknown; `signed` adds an explicit `+` for deltas. */
function formatMb(mb, { signed = false } = {}) {
    if (mb === null || mb === undefined || Number.isNaN(mb)) return '—';
    // A tiny negative would otherwise print as "-0.00".
    const text = mb.toFixed(2).replace(/^-0\.00$/, '0.00');
    return signed && mb > 0 && text !== '0.00' ? `+${text}` : text;
}

module.exports = {
    BYTES_PER_MB,
    aggregateAllocation,
    allocationChange,
    extractAllocationRun,
    formatMb,
    median,
    sumSamplingProfileBytes,
};
