import {
    type BoxBounds,
    type NormalisedPaddingOptions,
    type PointLabelDatum,
    isPointLabelDatum,
    placeLabels,
} from 'ag-charts-core';

import { BBox } from '../../scene/bbox';
import type { ISeries, ISeriesProperties, SeriesNodeDatum } from '../series/seriesTypes';

/**
 * A label, with its measured bounding box, contributed to the unified layout pass by some source
 * (a series, axis, legend, etc.). `payload` carries the source-specific datum needed for precise
 * collision tests (marker circles, sector wedges) that a plain box cannot express.
 */
export interface LabelCandidate<TPayload = unknown> {
    readonly box: BoxBounds;
    readonly payload: TPayload;
    readonly source: string;
}

/**
 * A non-series label source (e.g. pie callout labels, axis labels, legend) that participates in
 * the chart-wide label layout. Participants expose the obstacle boxes their placed labels occupy
 * so other sources can avoid them in the unified pass.
 */
export interface LabelLayoutParticipant {
    readonly id: string;
    getLabelObstacles(): readonly LabelCandidate[];
}

export class LabelManager {
    private readonly labelData: Map<string, PointLabelDatum[]> = new Map();
    private readonly participants: Map<string, LabelLayoutParticipant> = new Map();

    registerParticipant(participant: LabelLayoutParticipant) {
        this.participants.set(participant.id, participant);
    }

    unregisterParticipant(id: string) {
        this.participants.delete(id);
    }

    /** Obstacle boxes contributed by every registered participant, for cross-source collision. */
    getParticipantObstacles(): LabelCandidate[] {
        const obstacles: LabelCandidate[] = [];
        for (const participant of this.participants.values()) {
            obstacles.push(...participant.getLabelObstacles());
        }
        return obstacles;
    }

    updateLabels(
        placedLabelSeries: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>[],
        padding: NormalisedPaddingOptions,
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
