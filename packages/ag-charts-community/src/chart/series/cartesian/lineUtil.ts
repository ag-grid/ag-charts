import { FROM_TO_MIXINS, type NodeUpdateState } from '../../../motion/fromToMotion';
import type { Path } from '../../../scene/shape/path';
import type { Marker } from '../../marker/marker';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum, Scaling } from './cartesianSeries';

type LineNodeDatum = CartesianSeriesNodeDatum & {
    point: CartesianSeriesNodeDatum['point'] & {
        moveTo: boolean;
    };
    xValue?: number;
    yValue?: number;
};

type MarkerChange = 'move' | 'in' | 'out';
type PathPoint = {
    xFrom: number;
    xTo: number;
    yFrom: number;
    yTo: number;
    marker: MarkerChange;
    moveTo: boolean;
};

function isLineNodeDatum(v: LineNodeDatum | {}): v is LineNodeDatum {
    return 'point' in v;
}

export function prepareLinePathAnimation(
    newData: CartesianSeriesNodeDataContext<LineNodeDatum>,
    oldData: CartesianSeriesNodeDataContext<LineNodeDatum>
) {
    const scale = (val: number | string | Date, scaling?: Scaling, oldScaling?: Scaling) => {
        if (!scaling) return NaN;

        if (val instanceof Date) {
            val = val.getTime();
        }
        if (scaling.type === 'continuous' && typeof val === 'number') {
            const domainRatio = (val - scaling.domain[0]) / (scaling.domain[1] - scaling.domain[0]);
            return domainRatio * (scaling.range[1] - scaling.range[0]) + scaling.range[0];
        }

        // Category axis case.
        const matchingIndex = scaling.domain.findIndex((d) => d === val);
        if (matchingIndex >= 0) {
            return scaling.range[matchingIndex];
        }

        // Category doesn't exist, approximate the position.
        if (oldScaling) {
            const oldIndex: number = oldScaling.domain.findIndex((d) => d === val);
            return oldScaling.range[oldIndex];
        }

        // We failed to convert using the scale.
        return NaN;
    };
    const toNewScale = (oldDatum: { xValue?: number; yValue?: number }) => {
        return {
            x: scale(oldDatum.xValue ?? NaN, newData.scales.x, oldData.scales.x),
            y: scale(oldDatum.yValue ?? NaN, newData.scales.y),
        };
    };
    const toOldScale = (newDatum: { xValue?: number; yValue?: number }) => {
        return {
            x: scale(newDatum.xValue ?? NaN, oldData.scales.x, newData.scales.x),
            y: scale(newDatum.yValue ?? NaN, oldData.scales.y),
        };
    };
    const closeMatch = <T extends number | string>(a: T, b: T) => {
        const an = Number(a);
        const bn = Number(b);
        if (!isNaN(an) && !isNaN(bn)) {
            return Math.abs(bn - an) < 0.25;
        }
        return a === b;
    };
    const minMax = (data: CartesianSeriesNodeDataContext<LineNodeDatum>) => {
        return data.nodeData.reduce<{ min?: LineNodeDatum; max?: LineNodeDatum }>(
            ({ min, max }, node: LineNodeDatum) => {
                if (min == null || min.point.x > node.point.x) {
                    min = node;
                }
                if (max == null || max.point.x < node.point.x) {
                    max = node;
                }
                return { min, max };
            },
            {}
        );
    };

    const pair = () => {
        const result: PathPoint[] = [];
        const resultMap: {
            [key in 'moved' | 'added' | 'removed']: { [key: string | number]: PathPoint };
        } = {
            added: {},
            moved: {},
            removed: {},
        };

        let moveTo = true;
        const pairUp = (
            from: { x: number; y: number } | LineNodeDatum,
            to: { x: number; y: number } | LineNodeDatum,
            xValue: any,
            marker: MarkerChange = 'move'
        ) => {
            if (isLineNodeDatum(from)) {
                from = from.point;
            }
            if (isLineNodeDatum(to)) {
                to = to.point;
            }

            const resultPoint = {
                xFrom: from.x,
                yFrom: from.y,
                xTo: to.x,
                yTo: to.y,
                moveTo: moveTo,
                marker,
            };
            if (marker === 'move') {
                resultMap.moved[xValue] = resultPoint;
                oldIdx++;
                newIdx++;
            } else if (marker === 'in') {
                resultMap.added[xValue] = resultPoint;
                newIdx++;
            } else if (marker === 'out') {
                resultMap.removed[xValue] = resultPoint;
                oldIdx++;
            }
            result.push(resultPoint);

            moveTo = false;
        };

        const { min: minFromNode, max: maxFromNode } = minMax(oldData);
        const { min: minToNode, max: maxToNode } = minMax(newData);
        if (!minFromNode || !maxFromNode || !minToNode || !maxToNode) {
            return { result, resultMap };
        }

        const from: (LineNodeDatum | undefined)[] = [undefined, undefined, undefined];
        const to: (LineNodeDatum | undefined)[] = [undefined, undefined, undefined];
        let oldIdx = 0;
        let newIdx = 0;
        while (oldIdx < oldData.nodeData.length || newIdx < newData.nodeData.length) {
            from[0] = oldData.nodeData[oldIdx - 1];
            from[1] = oldData.nodeData[oldIdx];
            from[2] = oldData.nodeData[oldIdx + 1];
            to[0] = newData.nodeData[newIdx - 1];
            to[1] = newData.nodeData[newIdx];
            to[2] = newData.nodeData[newIdx + 1];

            const fromShifted = from[1] ? toNewScale(from[1]) : undefined;
            const toUnshifted = to[1] ? toOldScale(to[1]) : undefined;

            if (fromShifted && closeMatch(fromShifted.x, to[1]?.point.x)) {
                // Same point, animate between old and new X/Y position.
                pairUp(from[1], to[1], to[1].xValue, 'move');
            } else if (fromShifted && fromShifted.x < minToNode?.point.x) {
                // Missing old point before first new point.
                pairUp(from[1], minToNode, from[1].xValue, 'out');
            } else if (fromShifted && fromShifted.x > maxToNode?.point.x) {
                // Missing old point after last new point.
                pairUp(from[1], maxToNode, from[1].xValue, 'out');
            } else if (toUnshifted && toUnshifted.x < minFromNode?.point.x) {
                // Missing new point before first old point.
                pairUp(minFromNode, to[1], to[1].xValue, 'in');
            } else if (toUnshifted && toUnshifted.x > maxFromNode?.point.x) {
                // Missing new point after last old point.
                pairUp(maxFromNode, to[1], to[1].xValue, 'in');
            } else if (fromShifted && fromShifted.x < to[1]?.point.x) {
                // Missing old point, animate between old and intersected new X/Y position.
                const toIntersected = findPointOnLine(to[0].point, to[1].point, fromShifted.x);
                pairUp(from[1], toIntersected, from[1].xValue, 'out');
            } else if (toUnshifted && toUnshifted.x < from[1]?.point.x) {
                // Missing new point, animate between intersected old and new X/Y position.
                const fromIntersected = findPointOnLine(from[0].point, from[1].point, toUnshifted.x);
                pairUp(fromIntersected, to[1], to[1].xValue, 'in');
            } else if (from[1]) {
                pairUp(from[1], from[1], from[1].xValue, 'out');
            } else if (to[1]) {
                pairUp(to[1], to[1], to[1].xValue, 'in');
            } else {
                throw new Error('Unable to process points');
            }
        }

        return { result, resultMap };
    };

    const { result: pairData, resultMap: pairMap } = pair();

    const intermediateFn = (ratio: number, path: Path) => {
        const { path: linePath } = path;

        let phase: NodeUpdateState = 'updated';
        if (ratio > FROM_TO_MIXINS['added'].animationDelay) {
            phase = 'added';
        } else if (ratio < FROM_TO_MIXINS['removed'].animationDelay) {
            phase = 'removed';
        }

        const timings = FROM_TO_MIXINS[phase];
        let phaseRatio = (ratio - timings.animationDelay) / timings.animationDuration;
        phaseRatio = Math.min(1, Math.max(0, phaseRatio));

        for (const data of pairData) {
            let animateRatio = 1;
            if (data.marker === 'out') {
                animateRatio = phase === 'removed' ? phaseRatio : 1;
            }
            if (data.marker === 'move') {
                animateRatio = phase === 'removed' ? 0 : 1;
                animateRatio = phase === 'updated' ? phaseRatio : animateRatio;
            }
            if (data.marker === 'in') {
                animateRatio = phase === 'added' ? phaseRatio : 0;
            }

            const x = data.xFrom + (data.xTo - data.xFrom) * animateRatio;
            const y = data.yFrom + (data.yTo - data.yFrom) * animateRatio;
            if (data.moveTo) {
                linePath.moveTo(x, y);
            } else {
                linePath.lineTo(x, y);
            }
        }
    };

    const fromFn = (marker: Marker, datum: LineNodeDatum, status: NodeUpdateState) => {
        const moved = pairMap.moved[datum.xValue];
        if (status === 'unknown' && !moved) {
            status = 'added';
        } else if (status === 'unknown' && moved) {
            status = 'updated';
        } else if (pairMap.removed[datum.xValue]) {
            status = 'removed';
        }

        if (status === 'added') {
            return { opacity: 0, translationX: datum.point.x, translationY: datum.point.y, ...FROM_TO_MIXINS['added'] };
        }

        return {
            translationX: marker.translationX,
            translationY: marker.translationY,
            opacity: marker.opacity,
            ...FROM_TO_MIXINS[status],
        };
    };

    const toFn = (_marker: Marker, datum: LineNodeDatum, status: NodeUpdateState) => {
        if (status === 'removed') {
            return {
                opacity: 0,
            };
        }

        return { translationX: datum.point.x, translationY: datum.point.y, opacity: 1 };
    };

    let status: NodeUpdateState = 'updated';
    if (oldData.nodeData.length === 0 && newData.nodeData.length > 0) {
        status = 'added';
    } else if (oldData.nodeData.length > 0 && newData.nodeData.length === 0) {
        status = 'removed';
    }

    const pathProperties = {
        fromFn: (path: Path) => {
            if (status === 'added') {
                return { opacity: 0, ...FROM_TO_MIXINS['added'] };
            }

            return { opacity: path.opacity, ...FROM_TO_MIXINS[status] };
        },
        toFn: (path: Path) => {
            if (status === 'added') {
                return { opacity: 1, ...FROM_TO_MIXINS['added'] };
            }

            return { opacity: path.opacity, ...FROM_TO_MIXINS[status] };
        },
    };

    return { status, path: { intermediateFn }, pathProperties, marker: { fromFn, toFn } };
}

function findPointOnLine(a: { x: number; y: number }, b: { x: number; y: number }, targetX: number) {
    const m = (b.y - a.y) / (b.x - a.x);
    // Find a point a distance along the line from `a` and `b`
    const y = (targetX - a.x) * m + a.y;
    return { x: targetX, y };
}
