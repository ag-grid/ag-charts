import {
    type BoxBounds,
    type LabelObstacle,
    type NormalisedPaddingOptions,
    type PlacedLabel,
    type SeriesLabels,
    isPointLabelDatum,
    placeLabels,
} from 'ag-charts-core';

import { BBox } from '../../scene/bbox';
import type { ISeries, ISeriesProperties, SeriesNodeDatum } from '../series/seriesTypes';

/**
 * Identity of the placement inputs: each visible series' node-data version (label data and obstacles
 * both derive from node data) and the layout bounds. Unchanged between two updates means placement
 * would produce the same result.
 */
function placementSignature(
    visibleSeries: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>[],
    bounds: BoxBounds
): string {
    let series = '';
    for (const s of visibleSeries) {
        series += `${s.id}:${s.nodeDataVersion};`;
    }
    return `${series}|${bounds.x},${bounds.y},${bounds.width},${bounds.height}`;
}

export class LabelManager {
    private readonly labelData: Map<string, SeriesLabels> = new Map();
    private lastPlacementSignature?: string;
    private lastPlacedLabels?: Map<string, PlacedLabel[]>;

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
        if (placedLabelSeries.length === 0) {
            this.lastPlacementSignature = undefined;
            this.lastPlacedLabels = undefined;
            return;
        }

        // updateLabels runs on every SERIES_UPDATE, including hover/highlight. Placement inputs (label
        // data and obstacles, both derived from node data) and the bounds are unchanged then, so reuse
        // the cached placement rather than re-sorting, rebuilding the obstacle index and re-solving. The
        // placement is still re-applied below, since that also refreshes per-datum highlight styling.
        const signature = placementSignature(visibleSeries, bounds);
        let placedLabels = this.lastPlacedLabels;
        if (placedLabels == null || signature !== this.lastPlacementSignature) {
            placedLabels = this.computePlacement(placedLabelSeries, visibleSeries, bounds);
            this.lastPlacementSignature = signature;
            this.lastPlacedLabels = placedLabels;
        }

        for (const series of placedLabelSeries) {
            series.updatePlacedLabelData?.(placedLabels.get(series.id) ?? []);
        }
    }

    private computePlacement(
        placedLabelSeries: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>[],
        visibleSeries: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>[],
        bounds: BoxBounds
    ): Map<string, PlacedLabel[]> {
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

        return placeLabels(this.labelData, bounds, 5, obstacles);
    }
}
