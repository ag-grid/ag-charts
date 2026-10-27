import type { AgCollectedValue, AgSeriesCollectedValue, _ModuleSupport } from 'ag-charts-community';
import {
    ChartAxisDirection,
    type DynamicContext,
    callWithContext,
    isArray,
    isObjectWithStringProperty,
} from 'ag-charts-core';

type StatusBarSeries = _ModuleSupport.ChartService['series'][number];

export interface StatusBarAnchor {
    readonly series: StatusBarSeries;
    readonly datumIndex: number;
}

// Series whose value keys are declared in an order that does not match how their values are usually read.
const DEFAULT_KEY_ORDER: Partial<Record<string, readonly string[]>> = {
    ohlc: ['openKey', 'highKey', 'lowKey', 'closeKey'],
    candlestick: ['openKey', 'highKey', 'lowKey', 'closeKey'],
};

/**
 * The values of every enabled series at the anchor's category, in series order. A series without an item at that
 * category contributes nothing.
 */
export function collectAnchoredValues(
    ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
    anchor: StatusBarAnchor
): AgCollectedValue[] {
    const { chartService } = ctx;
    const values: AgCollectedValue[] = [];
    for (const series of chartService.series) {
        if (!series.isEnabled()) continue;
        const datumIndex =
            series === anchor.series
                ? anchor.datumIndex
                : chartService.getSharedHighlightMatch?.(anchor.series, anchor.datumIndex, series);
        if (datumIndex != null) collectSeriesValues(ctx, series, datumIndex, values);
    }
    return values;
}

/** The values of every enabled series at its own datum from `pickIndex`, for when nothing is hovered. */
export function collectFallbackValues(
    ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
    pickIndex: (series: StatusBarSeries) => number | undefined
): AgCollectedValue[] {
    const values: AgCollectedValue[] = [];
    for (const series of ctx.chartService.series) {
        if (!series.isEnabled()) continue;
        const datumIndex = pickIndex(series);
        if (datumIndex != null) collectSeriesValues(ctx, series, datumIndex, values);
    }
    return values;
}

function collectSeriesValues(
    ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
    series: StatusBarSeries,
    datumIndex: number,
    out: AgCollectedValue[]
) {
    const datum = series.datumAt?.(datumIndex);
    if (datum == null) return;

    const defaults = defaultSeriesValues(series, datumIndex, datum);
    const collected = runCollector(ctx, series, datum, defaults);
    if (collected == null) {
        out.push(...defaults);
        return;
    }

    for (const entry of collected) {
        if (!isObjectWithStringProperty(entry, 'key')) continue;
        const { key, label, value, formattedValue, color } = entry;
        out.push({
            seriesId: series.id,
            key,
            label,
            value,
            formattedValue: formattedValue ?? formatKeyValue(series, key, value, datum),
            color: color ?? series.datumColor?.(datumIndex, key),
            datum,
        });
    }
}

function runCollector(
    ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
    series: StatusBarSeries,
    datum: unknown,
    defaults: AgCollectedValue[]
): AgSeriesCollectedValue[] | undefined {
    const { collector } = series.options;
    if (collector == null) return;

    let collected: ReturnType<typeof collector>;
    try {
        collected = callWithContext([series.options, ctx.chartService], collector, {
            seriesId: series.id,
            datum,
            values: defaults,
        });
    } catch (e) {
        ctx.logger.warnOnce('User callback errored, ignoring', e);
        return;
    }
    if (collected == null) return;
    if (isArray(collected)) return collected;
    ctx.logger.warnOnce('Series `collector` must return an array of values, ignoring');
}

/** The axis the series' values lie on, which is `x` for a horizontal series. */
function valueAxisDirection(series: StatusBarSeries) {
    return series.resolveKeyDirection(ChartAxisDirection.Y);
}

function defaultSeriesValues(series: StatusBarSeries, datumIndex: number, datum: unknown): AgCollectedValue[] {
    const direction = valueAxisDirection(series);
    const keys = series.getKeys(direction);
    const names = series.getNames(direction);
    const order = DEFAULT_KEY_ORDER[series.type];
    const keyProperties = order == null ? undefined : series.getKeyProperties(direction);

    const values: AgCollectedValue[] = [];
    for (let i = 0; i < keys.length; i++) {
        const index = order == null || keyProperties == null ? i : keyProperties.indexOf(order[i]);
        const key = keys[index];
        if (key == null) continue;
        const value = series.readDatumKey?.(datum, key);
        values.push({
            seriesId: series.id,
            key,
            label: names[index] ?? key,
            value,
            formattedValue: series.formatDatumValue(direction, value, datum, key, 'status-bar'),
            color: series.datumColor?.(datumIndex, key),
            datum,
        });
    }
    return values;
}

function formatKeyValue(series: StatusBarSeries, key: string, value: unknown, datum: unknown) {
    for (const direction of [ChartAxisDirection.X, ChartAxisDirection.Y]) {
        if (series.getKeys(direction).includes(key)) {
            return series.formatDatumValue(direction, value, datum, key, 'status-bar');
        }
    }
}
