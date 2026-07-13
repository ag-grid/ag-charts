import { expect } from 'vitest';

import type { AgChartOptions } from 'ag-charts-types';

import { type Chart, expectNonBlank, prepareTestOptions, waitForChartStability } from './utils';

/** Shared fixtures for bigint / ISO-datetime series coverage. */

export const BIG = 9_007_199_254_740_993n; // MAX_SAFE_INTEGER + 2
export const NEG_BIG = -9_007_199_254_740_993n;

// Every scaled value exceeds Number.MAX_VALUE, forcing the bigint path.
export const MAGNITUDE = BigInt(Number.MAX_VALUE);

export function scaleToBigInt(value: number): bigint {
    return BigInt(value) * MAGNITUDE;
}

// Out of safe-integer range but small enough that Number() stays finite (the aggregation regime).
const FINITE_MAGNITUDE = 2n ** 50n;

export function scaleToBigIntFinite(value: number): bigint {
    return BigInt(value) * FINITE_MAGNITUDE;
}

// Above AGGREGATION_THRESHOLD so columns flow through the high-volume aggregation path.
export const HIGH_VOLUME_COUNT = 5_000;

const WAVE = (i: number) => Math.round(Math.sin(i / 7) * 40 + Math.sin(i / 311) * 30); // ~[-70, 70]
export const HIGH_VOLUME_SIGNALS: ReadonlyArray<readonly [string, (i: number) => number]> = [
    ['positive', (i) => WAVE(i) + 100], // ~[30, 170]
    ['straddling-zero', WAVE],
    ['negative', (i) => WAVE(i) - 100], // ~[-170, -30]
];

const HIDDEN = { enabled: false } as const;

// Value-dependent decorations are stripped so only the series shapes contribute pixels.
const STRIPPED_AXIS = { line: HIDDEN, gridLine: HIDDEN, tick: HIDDEN, label: HIDDEN } as const;

/** Strip all axis decorations from an object-form `axes` map, keeping each axis `type`/`nice` intact. */
export function stripAxes<T extends Record<string, Record<string, unknown>>>(axes: T): T {
    const stripped: Record<string, unknown> = {};
    for (const key of Object.keys(axes)) {
        stripped[key] = { ...axes[key], ...STRIPPED_AXIS };
    }
    return stripped as T;
}

/** Decoration-free number/number axes for magnitude-invariance pixel comparisons. */
export const STRIPPED_NUMBER_AXES = stripAxes({
    x: { type: 'number', nice: false },
    y: { type: 'number', nice: false },
});

/** Decoration-free time/number axes for ISO-vs-epoch pixel comparisons. */
export const STRIPPED_TIME_AXES = stripAxes({
    x: { type: 'time', nice: false },
    y: { type: 'number', nice: false },
});

/** Decoration-free unit-time/number axes for banded series (e.g. bar, ohlc, range-bar). */
export const STRIPPED_UNIT_TIME_AXES = stripAxes({
    x: { type: 'unit-time' },
    y: { type: 'number', nice: false },
});

interface Snapshotter {
    snapshot: () => ImageData;
}

type ChartFactory = (options: AgChartOptions) => Promise<Chart>;

export interface MagnitudePair {
    /** Options whose data sits within the Number range. */
    small: AgChartOptions;
    /** The same options with every value scaled by `MAGNITUDE` into the bigint domain. */
    large: AgChartOptions;
}

/**
 * Build a {@link MagnitudePair} by running `buildData` with identity (Number) and `toBig` (bigint) mappings,
 * so both variants share identical ratios and geometry across the bigint boundary.
 */
export function magnitudePair(
    base: Record<string, unknown>,
    buildData: (toValue: (value: number) => number | bigint) => unknown[],
    toBig: (value: number) => bigint = scaleToBigInt
): MagnitudePair {
    return {
        small: { ...base, data: buildData((value) => value) } as AgChartOptions,
        large: { ...base, data: buildData(toBig) } as AgChartOptions,
    };
}

/**
 * Build a pair of options rendering the same time series with numeric-epoch x values (`small`)
 * and ISO 8601 string x values (`large`), one row per minute from 2024-01-01T00:00Z.
 */
export function isoEpochPair(
    base: Record<string, unknown>,
    count: number,
    buildRow: (x: number | string, i: number) => unknown = (x, i) => ({ x, y: Math.sin(i / 10) })
): MagnitudePair {
    const startMs = Date.UTC(2024, 0, 1);
    const at = (i: number) => startMs + i * 60_000;
    return {
        small: { ...base, data: Array.from({ length: count }, (_, i) => buildRow(at(i), i)) } as AgChartOptions,
        large: {
            ...base,
            data: Array.from({ length: count }, (_, i) => buildRow(new Date(at(i)).toISOString(), i)),
        } as AgChartOptions,
    };
}

/**
 * Render `before`, update the SAME chart to `after`, and assert pixel-for-pixel identity.
 * The mock canvas only tracks the first chart created per test, so the comparison must reuse
 * one chart via `update()` — cross-create snapshots would compare a stale canvas against itself.
 * `create` is `createChart` (community) or `createEnterpriseChart` (enterprise); `ctx` is the
 * `setupMockCanvas()` handle from the calling suite.
 */
export async function expectPixelIdenticalAcrossUpdate(
    ctx: Snapshotter,
    create: ChartFactory,
    before: AgChartOptions,
    after: AgChartOptions
): Promise<void> {
    const chart = await create(before);
    try {
        const beforeImage = ctx.snapshot();
        expectNonBlank(beforeImage);
        // `update()` bypasses the create-time preparation in `create`, so re-apply the test
        // sizing/theme (and the animation-off default) before updating.
        await chart.publicApi!.update(prepareTestOptions({ animation: { enabled: false }, ...after }));
        await waitForChartStability(chart);
        const afterImage = ctx.snapshot();
        expect(afterImage).toMatchImage(beforeImage);
    } finally {
        chart.destroy();
    }
}

/** Assert the `small` (Number) and `large` (bigint) variants of a {@link MagnitudePair} render identically. */
export async function expectPixelIdenticalAcrossMagnitude(
    ctx: Snapshotter,
    create: ChartFactory,
    { small, large }: MagnitudePair
): Promise<void> {
    await expectPixelIdenticalAcrossUpdate(ctx, create, small, large);
}
