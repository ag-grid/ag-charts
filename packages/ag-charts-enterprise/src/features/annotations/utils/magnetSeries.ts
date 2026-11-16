import type { _ModuleSupport } from 'ag-charts-community';
import type { Scale } from 'ag-charts-core';

import type { MagnetSeries } from './magnet';

type Series = _ModuleSupport.ISeries<_ModuleSupport.SeriesNodeDatum, _ModuleSupport.ISeriesOptions>;
type Datum = _ModuleSupport.SeriesNodeDatum & Partial<_ModuleSupport.ErrorBoundSeriesNodeDatum>;

/**
 * Adapts a series to the magnet: the datum it picks for the pointer, as for highlighting, and the positions on the
 * y-axis `scale` of its values. A multi-valued series, such as a candlestick, offers each of its values, and any other
 * series offers its plotted value.
 */
export function createMagnetSeries(series: Series, scale: Scale<any, any>): MagnetSeries<Datum> {
    const halfBandwidth = (scale.bandwidth ?? 0) / 2;
    const toPosition = (value: unknown) => scale.convert(value) + halfBandwidth;

    return {
        pickNearest: (point) => {
            const datum = series.pickNodes(point, 'highlight')?.picks[0]?.datum;
            return datum == null || datum.missing === true ? undefined : datum;
        },

        *yPositions(datum) {
            const values = series.getCrosshairSnapValues?.(datum);
            if (values != null) {
                for (const value of Object.values(values)) {
                    if (value != null) yield toPosition(value);
                }
                return;
            }

            const plotted = datum.cumulativeValueExact ?? datum.cumulativeValue;
            if (plotted != null) {
                yield toPosition(plotted);
            } else if (datum.midPoint != null) {
                yield datum.midPoint.y;
            }
        },
    };
}
