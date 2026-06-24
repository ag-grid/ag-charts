import {
    type BoxBounds,
    type NormalisedPaddingOptions,
    type PointLabelDatum,
    SpatialIndex,
    type SpatialIndexVisitor,
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
    /** Scratch index reused across all `anyObstacleCollision` calls (cleared, not reallocated). */
    private readonly obstacleIndex = new SpatialIndex<unknown>();

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

    /**
     * Index-backed any-collision test: does any `queryBox` overlap any `obstacle`? Obstacle AABBs
     * prune the candidate set via the shared spatial index, and the caller's `exact` predicate runs
     * only on the survivors. Geometry-agnostic — the caller supplies the precise test (e.g.
     * `boxOverlapsSector` for pie wedges) so this one primitive serves every label source.
     */
    anyObstacleCollision<R>(
        queryBoxes: readonly BoxBounds[],
        obstacles: readonly { box: BoxBounds; ref: R }[],
        exact: (queryBox: BoxBounds, ref: R) => boolean
    ): boolean {
        if (queryBoxes.length === 0 || obstacles.length === 0) {
            return false;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let dimSum = 0;
        let dimCount = 0;
        const extend = (b: BoxBounds) => {
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.width);
            maxY = Math.max(maxY, b.y + b.height);
            dimSum += b.width + b.height;
            dimCount += 2;
        };
        for (const box of queryBoxes) {
            extend(box);
        }
        for (const obstacle of obstacles) {
            extend(obstacle.box);
        }

        const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        const cellSize = dimCount > 0 ? dimSum / dimCount : 1;
        const index = this.obstacleIndex as SpatialIndex<R>;
        index.reset(bounds, cellSize);
        for (const obstacle of obstacles) {
            index.insert(obstacle.box, obstacle.ref);
        }

        let queryBox: BoxBounds | null = null;
        const visit: SpatialIndexVisitor<R> = (ref) => queryBox != null && exact(queryBox, ref);
        for (const box of queryBoxes) {
            queryBox = box;
            if (index.query(box, visit)) {
                return true;
            }
        }
        return false;
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
