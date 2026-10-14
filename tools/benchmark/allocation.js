/** Allocation (memory-pass) helpers shared by the browser benchmark runner and the comparison scripts. */

const { median, pctChange } = require('./stats');

const BYTES_PER_MB = 1024 * 1024;

/** A delta within this many standard errors of zero is sampling noise, not a change. */
const ALLOCATION_NOISE_SIGMAS = 2;

/**
 * Total bytes in a CDP `HeapProfiler.stopSampling` profile. V8 already scales each node's `selfSize`
 * to the estimated true size, so the sum over the tree is the estimate for the whole window.
 * Iterative: a deep call tree would overflow the stack on a recursive walk.
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

const isNonNegative = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * Per-test allocation of one report: Map(key -> { bytes, stdErrBytes }) in bytes per measured
 * iteration. Results without allocation data (an older harness, or an errored example) are left
 * out, so a missing key always means "no data" and never "zero bytes". `stdErrBytes` is null when
 * the harness recorded no standard error (fewer than two measured iterations).
 *
 * @param {object} report - A browser benchmark JSON report.
 * @param {(exampleName: string, result: object) => string} keyFn - Builds the comparison key.
 */
function extractAllocationRun(report, keyFn) {
    const results = new Map();
    for (const [exampleName, example] of Object.entries(report?.examples ?? {})) {
        if (example.status !== 'success' || !Array.isArray(example.data?.results)) continue;
        for (const result of example.data.results) {
            const { bytesPerIteration, stdErrBytes } = result.allocation ?? {};
            if (!isNonNegative(bytesPerIteration)) continue;
            results.set(keyFn(exampleName, result), {
                bytes: bytesPerIteration,
                stdErrBytes: isNonNegative(stdErrBytes) ? stdErrBytes : null,
            });
        }
    }
    return results;
}

/** Median of each key's bytes (and of its standard errors) across independent memory-pass reports. */
function aggregateAllocation(reports, keyFn) {
    const perKey = new Map();
    for (const report of reports) {
        for (const [key, value] of extractAllocationRun(report, keyFn)) {
            const values = perKey.get(key);
            if (values) values.push(value);
            else perKey.set(key, [value]);
        }
    }
    const merged = new Map();
    for (const [key, values] of perKey) {
        merged.set(key, {
            bytes: median(values.map((v) => v.bytes)),
            stdErrBytes: median(values.map((v) => v.stdErrBytes).filter((v) => v !== null)),
        });
    }
    return merged;
}

/**
 * Before/after allocation for one matched test, from `{ bytes, stdErrBytes }` values (undefined when
 * a side has no data). The delta and percentage need both sides, so a missing side reads as
 * "unknown" rather than as a win or regression. `withinNoise` is null when either side has no
 * standard error to judge the delta against.
 */
function allocationChange(before, after) {
    const toMb = (side) => (side ? side.bytes / BYTES_PER_MB : null);
    const hasBoth = Boolean(before && after);
    const hasNoise = hasBoth && before.stdErrBytes !== null && after.stdErrBytes !== null;
    const noiseBytes = hasNoise ? ALLOCATION_NOISE_SIGMAS * Math.hypot(before.stdErrBytes, after.stdErrBytes) : null;
    return {
        beforeMb: toMb(before),
        afterMb: toMb(after),
        deltaMb: hasBoth ? (after.bytes - before.bytes) / BYTES_PER_MB : null,
        pctChange: hasBoth ? pctChange(before.bytes, after.bytes) : null,
        noiseMb: hasNoise ? noiseBytes / BYTES_PER_MB : null,
        withinNoise: hasNoise ? Math.abs(after.bytes - before.bytes) <= noiseBytes : null,
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
    ALLOCATION_NOISE_SIGMAS,
    BYTES_PER_MB,
    aggregateAllocation,
    allocationChange,
    extractAllocationRun,
    formatMb,
    sumSamplingProfileBytes,
};
