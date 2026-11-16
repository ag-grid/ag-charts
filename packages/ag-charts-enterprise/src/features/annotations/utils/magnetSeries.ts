import type { _ModuleSupport } from 'ag-charts-community';
import type { Point, Scale } from 'ag-charts-core';

type Series = _ModuleSupport.ISeries<_ModuleSupport.SeriesNodeDatum, _ModuleSupport.ISeriesOptions>;
type Datum = _ModuleSupport.SeriesNodeDatum & Partial<_ModuleSupport.ErrorBoundSeriesNodeDatum>;

/**
 * The positions on the y-axis `scale` that the magnet can snap to for `series` at `point`: the values of the datum that
 * the series picks for highlighting. A multi-valued series, such as a candlestick, offers each of its crosshair snap
 * values, and any other series its plotted value.
 */
export function getMagnetPositions(series: Series, point: Point, scale: Scale<any, any>): number[] {
    const datum: Datum | undefined = series.pickNodes(point, 'highlight')?.picks[0]?.datum;
    if (datum == null || datum.missing === true) return [];

    const halfBandwidth = (scale.bandwidth ?? 0) / 2;
    const toPosition = (value: unknown) => scale.convert(value) + halfBandwidth;

    const snapValues = series.getCrosshairSnapValues?.(datum);
    if (snapValues != null) {
        return Object.values(snapValues)
            .filter((value) => value != null)
            .map(toPosition);
    }

    const plotted = datum.cumulativeValueExact ?? datum.cumulativeValue;
    if (plotted != null) return [toPosition(plotted)];
    return datum.midPoint != null ? [datum.midPoint.y] : [];
}
