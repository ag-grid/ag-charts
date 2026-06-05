import { expect } from 'vitest';

import type { AgChartOptions } from 'ag-charts-types';

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
