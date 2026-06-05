import { type PointLabelDatum, isPointLabelDatum, placeLabels } from 'ag-charts-core';
import type { AgChartPaddingOptions } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import type { ISeries, ISeriesProperties, SeriesNodeDatum } from '../series/seriesTypes';

export class SeriesLabelLayoutManager {
    private readonly labelData: Map<string, PointLabelDatum[]> = new Map();

    updateLabels(
        placedLabelSeries: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>[],
        padding: Required<AgChartPaddingOptions>,
        seriesRect = BBox.zero
    ) {
        const bounds = {
            x: -padding.left,
            y: -padding.top,
            width: seriesRect.width + padding.left + padding.right,
            height: seriesRect.height + padding.top + padding.bottom,
        };
        const expectedSeriesId = new Set(placedLabelSeries.map((s) => s.id));
        for (const seriesId of this.labelData.keys()) {
            if (!expectedSeriesId.has(seriesId)) {
                this.labelData.delete(seriesId);
            }
        }

        for (const series of placedLabelSeries) {
            const labelData = series.getLabelData();
            if (labelData.every(isPointLabelDatum)) {
                this.labelData.set(series.id, labelData);
            }
        }

        const placedLabels = placeLabels(this.labelData, bounds, 5);
        for (const series of placedLabelSeries) {
            series.updatePlacedLabelData?.(placedLabels.get(series.id) ?? []);
        }
    }
}
