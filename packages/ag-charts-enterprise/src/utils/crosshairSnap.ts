import { isFiniteNumericValue } from 'ag-charts-core';

export interface CrosshairSnapConfig {
    readonly snapTo: readonly string[] | undefined;
    readonly mode: 'all' | 'nearest';
}

interface CrosshairSnapOptions {
    readonly crosshairSnapTo?: readonly string[];
    readonly crosshairSnapMode?: 'all' | 'nearest';
}

/** Maps the `crosshairSnapTo` value names to the series' key properties, dropping unknown names and duplicates. */
export function resolveCrosshairSnapConfig(
    options: CrosshairSnapOptions,
    valueKeys: readonly string[]
): CrosshairSnapConfig {
    const { crosshairSnapTo, crosshairSnapMode = 'all' } = options;
    if (crosshairSnapTo == null) return { snapTo: undefined, mode: crosshairSnapMode };

    const snapTo = new Set<string>();
    for (const name of crosshairSnapTo) {
        const key = `${name}Key`;
        if (valueKeys.includes(key)) snapTo.add(key);
    }
    return { snapTo: Array.from(snapTo), mode: crosshairSnapMode };
}

/** Builds a snap-value record from `[keyProperty, value]` pairs, omitting values that are not finite numerics. */
export function collectCrosshairSnapValues(
    entries: ReadonlyArray<readonly [string, unknown]>
): Partial<Record<string, unknown>> {
    const values: Partial<Record<string, unknown>> = {};
    for (const [key, value] of entries) {
        if (isFiniteNumericValue(value)) values[key] = value;
    }
    return values;
}
