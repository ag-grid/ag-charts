import { expect } from 'vitest';

import type { AgChartOptions } from 'ag-charts-types';

/**
 * Shared fixtures for bigint / ISO-datetime series coverage.
 *
 * Two concerns are supported:
 *  - `BIG`/`NEG_BIG` provide out-of-safe-range bigint values for per-series visual snapshots.
 *  - `expectPixelIdenticalAcrossMagnitude` asserts that a series scaled by `MAGNITUDE` (which pushes
 *    every value beyond Number.MAX_VALUE, so it must travel as bigint into `scale.convert()`) renders
 *    to identical pixels. The axis domain scales with the data, so the geometry is unchanged; only the
 *    value-dependent axis decorations (labels, ticks, gridlines) would differ, so they are stripped.
 */

// Beyond Number.MAX_SAFE_INTEGER (2^53 - 1) so values cannot be represented exactly as numbers.
export const BIG = 9_007_199_254_740_993n; // MAX_SAFE_INTEGER + 2
export const NEG_BIG = -9_007_199_254_740_993n;

// Large enough that every scaled value exceeds Number.MAX_VALUE and cannot be represented as a Number.
export const MAGNITUDE = BigInt(Number.MAX_VALUE);

/** Scale a small integer baseline value into the out-of-Number-range bigint domain. */
export function scaleToBigInt(value: number): bigint {
    return BigInt(value) * MAGNITUDE;
}

// Beyond MAX_SAFE_INTEGER (so values must travel as bigint) but small enough that Number() stays finite —
// i.e. the high-volume aggregation regime, where each value is narrowed to a finite double rather than the
// Number.MAX_VALUE → Infinity path the `scaleToBigInt` snapshots exercise. Sign and ratios are preserved,
// so a `scaleToBigIntFinite` chart is geometrically identical to its Number baseline.
const FINITE_MAGNITUDE = 2n ** 50n;

/** Scale a small integer baseline into out-of-safe-range bigint that still narrows to a finite double. */
export function scaleToBigIntFinite(value: number): bigint {
    return BigInt(value) * FINITE_MAGNITUDE;
}

// Above AGGREGATION_THRESHOLD (1000) so the bigint columns flow through the high-volume aggregation path
// (Float64Array writes / the bubble quadtree) that a per-element narrow must guard.
export const HIGH_VOLUME_COUNT = 5_000;

// Deterministic integer signals spanning the sign extremes, as a function of row index. A two-frequency
// sine keeps a varied envelope so any mishandling of the high-volume bigint path surfaces as a pixel diff.
const WAVE = (i: number) => Math.round(Math.sin(i / 7) * 40 + Math.sin(i / 311) * 30); // ~[-70, 70]
export const HIGH_VOLUME_SIGNALS: ReadonlyArray<readonly [string, (i: number) => number]> = [
    ['positive', (i) => WAVE(i) + 100], // ~[30, 170]
    ['straddling-zero', WAVE],
    ['negative', (i) => WAVE(i) - 100], // ~[-170, -30]
];

const HIDDEN = { enabled: false } as const;

// Every value-position-dependent axis decoration is removed so only the series shapes contribute pixels.
// The stripping is value-independent, so the small and scaled charts share an identical plot area.
const STRIPPED_AXIS = { line: HIDDEN, gridLine: HIDDEN, tick: HIDDEN, label: HIDDEN } as const;

/** Strip all axis decorations from an object-form `axes` map, keeping each axis `type`/`nice` intact. */
export function stripAxes<T extends Record<string, Record<string, unknown>>>(axes: T): T {
    // Re-key into a plain map then assert the input shape: each axis keeps its own props and gains the
    // always-valid disabled-decoration props, so the result is structurally still T.
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

interface Snapshotter {
    snapshot: () => ImageData;
}

interface Destroyable {
    destroy: () => void;
}

type ChartFactory = (options: AgChartOptions) => Promise<Destroyable>;

export interface MagnitudePair {
    /** Options whose data sits within the Number range. */
    small: AgChartOptions;
    /** The same options with every value scaled by `MAGNITUDE` into the bigint domain. */
    large: AgChartOptions;
}

/**
 * Build a {@link MagnitudePair} from shared chart options and a data builder. The builder is invoked once
 * with the identity mapping (small/Number data) and once with `toBig` (large/bigint data), so both variants
 * share identical ratios — and therefore identical geometry — across the bigint boundary. `toBig` defaults
 * to {@link scaleToBigInt} (the Number.MAX_VALUE → Infinity path); pass {@link scaleToBigIntFinite} for the
 * high-volume aggregation regime where values narrow to finite doubles.
 */
export function magnitudePair(
    // `series`/`axes` shapes vary across the chart-options union, so the base is an untyped scaffold and
    // the assembled options are asserted to `AgChartOptions` (as the per-series tests do at every call).
    base: Record<string, unknown>,
    buildData: (toValue: (value: number) => number | bigint) => unknown[],
    toBig: (value: number) => bigint = scaleToBigInt
): MagnitudePair {
    return {
        small: { ...base, data: buildData((value) => value) } as AgChartOptions,
        large: { ...base, data: buildData(toBig) } as AgChartOptions,
    };
}

async function renderToImage(create: ChartFactory, options: AgChartOptions, ctx: Snapshotter): Promise<ImageData> {
    const chart = await create(options);
    const image = ctx.snapshot();
    chart.destroy();
    return image;
}

/**
 * Render the `small` (Number) and `large` (bigint) variants in turn and assert pixel-for-pixel identity.
 * `create` is `createChart` (community) or `createEnterpriseChart` (enterprise); `ctx` is the
 * `setupMockCanvas()` handle from the calling suite.
 */
export async function expectPixelIdenticalAcrossMagnitude(
    ctx: Snapshotter,
    create: ChartFactory,
    { small, large }: MagnitudePair
): Promise<void> {
    const smallImage = await renderToImage(create, small, ctx);
    const largeImage = await renderToImage(create, large, ctx);
    expect(largeImage).toMatchImage(smallImage);
}
