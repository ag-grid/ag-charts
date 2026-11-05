import type { AgCollectedValue, AgSeriesCollectedValue, _ModuleSupport } from 'ag-charts-community';
import {
    ChartAxisDirection,
    type DynamicContext,
    callWithContext,
    drawnItemColor,
    isArray,
    isObjectWithStringProperty,
} from 'ag-charts-core';

type StatusBarSeries = _ModuleSupport.ChartService['series'][number];

export interface StatusBarAnchor {
    readonly series: StatusBarSeries;
    readonly datumIndex: number;
}

const MISSING_VALUE_TEXT = '—';

/** The values of every enabled series at the anchor's category, in series order. */
export function collectAnchoredValues(
    ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
    anchor: StatusBarAnchor
): AgCollectedValue[] {
    return collectValues(ctx, (series) =>
        series === anchor.series
            ? anchor.datumIndex
            : ctx.chartService.getSharedHighlightMatch?.(anchor.series, anchor.datumIndex, series)
    );
}

/** The values of every enabled series at its own datum from `pickIndex`, for when nothing is hovered. */
export function collectValues(
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
    const datumValues = series.getDatumValues?.(datumIndex, 'status-bar');
    if (datumValues == null) return;

    const { datum, style } = datumValues;
    const datumColor = drawnItemColor(style);
    const defaults = datumValues.values.map(
        ({ key, name, value, formattedValue, missing, color, category }): AgCollectedValue => ({
            seriesId: series.id,
            key,
            label: name ?? key,
            value,
            formattedValue: missing ? MISSING_VALUE_TEXT : formattedValue,
            color: color ?? datumColor,
            category,
            datum,
        })
    );

    const collected = runCollector(ctx, series, datum, defaults);
    if (collected == null) {
        out.push(...defaults);
        return;
    }

    for (const entry of collected) {
        if (!isObjectWithStringProperty(entry, 'key')) continue;
        const { key, label, value, formattedValue, color, category } = entry;
        out.push({
            seriesId: series.id,
            key,
            label,
            value,
            formattedValue:
                formattedValue ??
                (value == null || Number.isNaN(value) ? MISSING_VALUE_TEXT : formatKeyValue(series, key, value, datum)),
            color: color ?? defaults.find((d) => d.key === key)?.color ?? datumColor,
            category,
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

function formatKeyValue(series: StatusBarSeries, key: string, value: unknown, datum: unknown) {
    for (const direction of [ChartAxisDirection.X, ChartAxisDirection.Y]) {
        if (series.getKeys(direction).includes(key)) {
            return series.formatDatumValue(direction, value, datum, key, 'status-bar');
        }
    }
}
