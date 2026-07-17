import {
    type LabelObstacle,
    type NormalisedPaddingOptions,
    type SeriesLabels,
    isPointLabelDatum,
    placeLabels,
} from 'ag-charts-core';

import { BBox } from '../../scene/bbox';
import type { ISeries, ISeriesProperties, SeriesNodeDatum } from '../series/seriesTypes';

export class LabelManager {
    private readonly labelData: Map<string, SeriesLabels> = new Map();

    updateLabels(
        visibleSeries: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>[],
        padding: NormalisedPaddingOptions,
        seriesRect = BBox.zero
    ) {
        const bounds = {
            x: -padding.left,
            y: -padding.top,
            width: seriesRect.width + padding.left + padding.right,
            height: seriesRect.height + padding.top + padding.bottom,
        };
        const placedLabelSeries = visibleSeries.filter((s) => s.usesPlacedLabels);
        const expectedSeriesId = new Set(placedLabelSeries.map((s) => s.id));
        for (const seriesId of this.labelData.keys()) {
            if (!expectedSeriesId.has(seriesId)) {
                this.labelData.delete(seriesId);
            }
        }

        // No series places labels, so gathering obstacles and running placement would be wasted work.
        if (placedLabelSeries.length === 0) return;

        for (const series of placedLabelSeries) {
            const labelData = series.getLabelData();
            if (labelData.every(isPointLabelDatum)) {
                this.labelData.set(series.id, { datums: labelData, defaults: series.getLabelDefaults?.() });
            }
        }

        // Every visible series can contribute entity obstacles (bar rects, sectors, markers) that
        // any series' labels must avoid, even series that don't place labels of their own.
        const obstacles: LabelObstacle[] = [];
        for (const series of visibleSeries) {
            const seriesObstacles = series.getLabelObstacles?.();
            if (seriesObstacles == null) continue;
            for (const obstacle of seriesObstacles) {
                obstacles.push(obstacle);
            }
        }

        const placedLabels = placeLabels(this.labelData, bounds, 5, obstacles);
        for (const series of placedLabelSeries) {
            series.updatePlacedLabelData?.(placedLabels.get(series.id) ?? []);
        }
    }
}
