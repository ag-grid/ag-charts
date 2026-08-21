import type { Scale } from 'ag-charts-core';
import { ChartAxisDirection, isNegative } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import type { ApplyFn, FromToMotionPropFn, NodeUpdateState } from '../../../motion/fromToMotion';
import { NODE_UPDATE_STATE_TO_PHASE_MAPPING } from '../../../motion/fromToMotion';
import { BandScale } from '../../../scale/bandScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import type { Rect } from '../../../scene/shape/rect';
import { Transformable } from '../../../scene/transformable';
import type { ChartAxis } from '../../chartAxis';
import type { ISeries, ISeriesProperties, SeriesNodeDatum } from '../seriesTypes';

export function checkCrisp(
    scale: Scale<any, any> | undefined,
    visibleRange: number[] | undefined,
    smallestDataInterval: AgNumericValue | undefined,
    largestDataInterval: AgNumericValue | undefined
): boolean {
    if (visibleRange != null) {
        const [visibleMin, visibleMax] = visibleRange;
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        if (isZoomed) return false;
    }

    if (ContinuousScale.is(scale)) {
        const spacing = scale.calcBandwidth(largestDataInterval) - scale.calcBandwidth(smallestDataInterval);
        if (spacing > 0 && spacing < 1) return false;
    }
    if (BandScale.is(scale)) {
        const { bandwidth, step } = scale;

        if (bandwidth > 0 && bandwidth < 1) return false;

        const spacing = step - bandwidth;
        if (spacing > 0 && spacing < 1) return false;
    }

    return true;
}

const isDatumNegative = (datum: AnimatableBarDatum) => {
    return isNegative((datum as any).yValue ?? 0);
};

export type InitialPosition<T> = {
    isVertical: boolean;
    mode: 'normal' | 'fade';
    calculate: (datum: T, prevDatum?: T) => T;
};
export function collapsedStartingBarPosition(
    isVertical: boolean,
    axes: { [K in ChartAxisDirection]?: ChartAxis },
    mode: 'normal' | 'fade'
): InitialPosition<AnimatableBarDatum> {
    const { startingX, startingY } = getStartingValues(isVertical, axes);

    const calculate = (datum: AnimatableBarDatum, prevDatum?: AnimatableBarDatum) => {
        let x = isVertical ? datum.x : startingX;
        let y = isVertical ? startingY : datum.y;
        let width = isVertical ? datum.width : 0;
        let height = isVertical ? 0 : datum.height;
        const { opacity = 1 } = datum;

        if (prevDatum && (Number.isNaN(x) || Number.isNaN(y))) {
            ({ x, y } = prevDatum);
            width = isVertical ? prevDatum.width : 0;
            height = isVertical ? 0 : prevDatum.height;
            if (isVertical && !isDatumNegative(prevDatum)) {
                y += prevDatum.height;
            } else if (!isVertical && isDatumNegative(prevDatum)) {
                x += prevDatum.width;
            }
        }

        let clipBBox: BBox | undefined;
        if (datum.clipBBox == null) {
            clipBBox = undefined;
        } else if (isDatumNegative(datum)) {
            clipBBox = isVertical ? new BBox(x, y - height, width, height) : new BBox(x - width, y, width, height);
        } else {
            clipBBox = new BBox(x, y, width, height);
        }

        return { x, y, width, height, clipBBox, opacity };
    };

    return { isVertical, calculate, mode };
}

export function midpointStartingBarPosition(
    isVertical: boolean,
    mode: 'normal' | 'fade'
): InitialPosition<AnimatableBarDatum> {
    return {
        isVertical,
        calculate: (datum, prevDatum?) => {
            let x = isVertical ? datum.x : datum.x + datum.width / 2;
            let y = isVertical ? datum.y + datum.height / 2 : datum.y;
            let width = isVertical ? datum.width : 0;
            let height = isVertical ? 0 : datum.height;

            if (prevDatum && (Number.isNaN(x) || Number.isNaN(y))) {
                x = isVertical ? prevDatum.x : prevDatum.x + prevDatum.width / 2;
                y = isVertical ? prevDatum.y + prevDatum.height / 2 : prevDatum.y;
                width = isVertical ? prevDatum.width : 0;
                height = isVertical ? 0 : prevDatum.height;
            }

            return { x, y, width, height, clipBBox: datum.clipBBox, opacity: datum.opacity ?? 1 };
        },
        mode,
    };
}

type AnimatableBarDatum = {
    x: number;
    y: number;
    height: number;
    width: number;
    clipBBox?: BBox;
    opacity?: number;
};
type RectDatum = {
    crisp: boolean;
};
type BarRect = Rect<AnimatableBarDatum & RectDatum>;

export function prepareBarAnimationFunctions<T extends AnimatableBarDatum>(
    initPos: InitialPosition<T>,
    unknownStatus: NodeUpdateState
) {
    const isRemoved = (datum?: T) => datum == null || Number.isNaN(datum.x) || Number.isNaN(datum.y);

    // Animate to the device-snapped category position so the settle crisp is a no-op. Only the
    // category dimension is snapped; the value dimension may legitimately collapse to 0.
    const alignScratch = { start: 0, length: 0 };
    const snapCategory = (rect: BarRect, geom: AnimatableBarDatum): AnimatableBarDatum => {
        const dir = rect.crispCentreDirection;
        if (dir == null) return geom;

        const coord = dir === 'x' ? geom.x : geom.y;
        if (!Number.isFinite(coord)) return geom;

        const extent = dir === 'x' ? geom.width : geom.height;
        // Thin bars edge-snap at render; pre-snapping their width/clip here would diverge from that path
        // and reintroduce the sub-pixel jitter the edge snap avoids, so leave them for the crisp render.
        if (!rect.centreSnapApplies(extent)) return geom;
        const { start, length } = rect.alignCentre(coord, extent, alignScratch);
        const { clipBBox } = geom;
        if (dir === 'x') {
            // Keep the clip's category extent on the snapped body, else it trims a sub-pixel sliver.
            return {
                ...geom,
                x: start,
                width: length,
                clipBBox: clipBBox && new BBox(start, clipBBox.y, length, clipBBox.height),
            };
        }
        return {
            ...geom,
            y: start,
            height: length,
            clipBBox: clipBBox && new BBox(clipBBox.x, start, clipBBox.width, length),
        };
    };

    const fromFn: FromToMotionPropFn<AnimatableBarDatum, BarRect, AnimatableBarDatum> = (rect, datum, status) => {
        if (status === 'updated' && isRemoved(rect.unsafeDatum)) {
            status = 'removed';
        } else if (status === 'updated' && isRemoved(rect.unsafePreviousDatum)) {
            status = 'added';
        }

        // Continue from current rendering location.
        let source: AnimatableBarDatum;
        if (status === 'unknown' || status === 'added') {
            // Handle series add case, after initial load. This is distinct from legend toggle on.
            if (rect.previousDatum == null && initPos.mode === 'fade') {
                source = {
                    ...resetBarSelectionsFn(rect, datum),
                    opacity: 0,
                };
            } else {
                source = initPos.calculate(rect.unsafeDatum, rect.unsafePreviousDatum);
            }

            if (status === 'unknown') {
                status = unknownStatus;
            }
        } else {
            source = {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                clipBBox: rect.clipBBox,
                opacity: rect.opacity ?? 1,
            };
        }

        const phase = NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
        return { ...snapCategory(rect, source), phase };
    };
    const toFn: FromToMotionPropFn<AnimatableBarDatum, BarRect, AnimatableBarDatum> = (rect, datum, status) => {
        if (status === 'removed' && rect.datum == null && initPos.mode === 'fade') {
            // Handle series remove case, after initial load. This is distinct from legend toggle off.
            return { ...resetBarSelectionsFn(rect, datum), opacity: 0 };
        } else if (status === 'removed' || isRemoved(rect.unsafeDatum)) {
            return initPos.calculate(rect.unsafeDatum, rect.unsafePreviousDatum);
        } else {
            return snapCategory(rect, {
                x: datum.x,
                y: datum.y,
                width: datum.width,
                height: datum.height,
                clipBBox: datum.clipBBox,
                opacity: datum.opacity ?? 1,
            });
        }
    };
    const applyFn: ApplyFn<AnimatableBarDatum, BarRect, AnimatableBarDatum> = (rect, datum, status) => {
        // Use aggressive bypass method that writes directly to backing fields
        rect.resetAnimationProperties(datum.x, datum.y, datum.width, datum.height, datum.opacity ?? 1, datum.clipBBox);
        rect.crisp = status === 'end' && (rect.datum?.crisp ?? false);
    };

    return { toFn, fromFn, applyFn };
}

function getStartingValues(isVertical: boolean, axes: { [K in ChartAxisDirection]?: ChartAxis }) {
    const axis = axes[isVertical ? ChartAxisDirection.Y : ChartAxisDirection.X];

    let startingX = Infinity;
    let startingY = 0;

    if (!axis) {
        return { startingX, startingY };
    }

    if (isVertical) {
        startingY = axis.scale.convert(ContinuousScale.is(axis.scale) ? 0 : Math.max(...axis.range));
    } else {
        startingX = axis.scale.convert(ContinuousScale.is(axis.scale) ? 0 : Math.min(...axis.range));
    }

    return { startingX, startingY };
}

export function resetBarSelectionsFn(
    rect: BarRect,
    { x, y, width, height, clipBBox, opacity = 1 }: AnimatableBarDatum
) {
    return { x, y, width, height, clipBBox, opacity, crisp: rect.datum?.crisp ?? false };
}

/**
 * High-performance direct reset for bar selections.
 * Bypasses resetMotion callback pattern and decorator system entirely.
 * Uses batchedUpdate to consolidate markDirty calls per selection.
 */
export function resetBarSelectionsDirect<D extends AnimatableBarDatum & { crisp?: boolean }>(
    selections: { nodes(): Iterable<Rect<D>>; cleanup(): void; batchedUpdate(fn: () => void): void }[]
): void {
    for (const selection of selections) {
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetBarNodes() {
            for (const node of nodes) {
                const datum = node.datum;
                if (datum == null) continue;

                // Direct method bypasses decorators - writes to __x, __y, etc.
                node.resetAnimationProperties(
                    datum.x,
                    datum.y,
                    datum.width,
                    datum.height,
                    datum.opacity ?? 1,
                    datum.clipBBox
                );
                node.crisp = datum.crisp ?? false;
            }
            // Important: cleanup garbage-collected nodes (same as resetMotion does)
            selection.cleanup();
        });
    }
}

export function computeBarFocusBounds(
    series: ISeries<SeriesNodeDatum, ISeriesProperties>,
    datum: { x: number; y: number; width: number; height: number } | undefined
): BBox | undefined {
    if (datum === undefined) return undefined;

    const { x, y, width, height } = datum;
    return Transformable.toCanvas(series.contentGroup, new BBox(x, y, width, height));
}
