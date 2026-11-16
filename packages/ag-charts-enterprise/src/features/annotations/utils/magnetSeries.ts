import type { _ModuleSupport } from 'ag-charts-community';
import type { Point, Scale } from 'ag-charts-core';

type Axis = Pick<_ModuleSupport.AxisContext, 'scale' | 'inRange'>;
type Series = _ModuleSupport.ISeries<_ModuleSupport.SeriesNodeDatum, _ModuleSupport.ISeriesOptions>;
type Datum = _ModuleSupport.SeriesNodeDatum & Partial<_ModuleSupport.ErrorBoundSeriesNodeDatum>;

/**
 * The points in the series area that the magnet can snap to for `series` at `point`: one for each value of the datum
 * that the series picks for highlighting, at the datum's x position. Points beyond the axes are not on the chart, so are
 * left out.
 */
export function getMagnetPoints(series: Series, point: Point, axes: { x: Axis; y: Axis }): Point[] {
    const datum: Datum | undefined = series.pickNodes(point, 'highlight')?.picks[0]?.datum;
    if (datum == null || datum.missing === true) return [];

    const x = datum.midPoint?.x ?? point.x;
    if (!axes.x.inRange(x)) return [];

    return getValuePositions(series, datum, axes.y.scale)
        .filter((y) => axes.y.inRange(y))
        .map((y) => ({ x, y }));
}

/**
 * A multi-valued series, such as a candlestick, offers each of its crosshair snap values, and any other series its
 * plotted value.
 */
function getValuePositions(series: Series, datum: Datum, scale: Scale<any, any>): number[] {
    const halfBandwidth = (scale.bandwidth ?? 0) / 2;
    const toPosition = (value: unknown) => scale.convert(value) + halfBandwidth;

    const snapValues = series.getCrosshairSnapValues?.(datum);
    if (snapValues != null) {
        return Object.values(snapValues)
            .filter((value) => value != null)
            .map(toPosition);
    }

    const plotted = datum.cumulativeValueExact ?? datum.cumulativeValue;
    const position = plotted == null ? datum.midPoint?.y : toPosition(plotted);
    return position == null ? [] : [position];
}
