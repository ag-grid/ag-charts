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
    const scale = (val: number, scaling?: Scaling) => {
        if (!scaling) return NaN;

        const domainRatio = (val - scaling.domain[0]) / (scaling.domain[1] - scaling.domain[0]);
        return domainRatio * (scaling.range[1] - scaling.range[0]) + scaling.range[0];
    };
    const toNewScale = (oldData: { xValue?: number; yValue?: number }) => {
        return {
            x: scale(oldData.xValue ?? NaN, newData.scales.x),
            y: scale(oldData.yValue ?? NaN, newData.scales.y),
        };
    };
    const toOldScale = (newData: { xValue?: number; yValue?: number }) => {
        return {
            x: scale(newData.xValue ?? NaN, oldData.scales.x),
            y: scale(newData.yValue ?? NaN, oldData.scales.y),
        };
    };
    const closeMatch = (a: number, b: number) => {
        return Math.abs(b - a) < 0.25;
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

        let oldIdx = 0;
        let newIdx = 0;

        const from: (LineNodeDatum | undefined)[] = [undefined, undefined, undefined];
        const to: (LineNodeDatum | undefined)[] = [undefined, undefined, undefined];

        const minFromNode = oldData.nodeData[0];
        const maxFromNode = oldData.nodeData.slice(-1)[0];
        const minToNode = newData.nodeData[0];
        const maxToNode = newData.nodeData.slice(-1)[0];

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
            } else if (fromShifted && fromShifted.x < minToNode.point.x) {
                // Missing old point before first new point.
                pairUp(from[1], minToNode, from[1].xValue, 'out');
            } else if (fromShifted && fromShifted.x > maxToNode.point.x) {
                // Missing old point after last new point.
                pairUp(from[1], maxToNode, from[1].xValue, 'out');
            } else if (toUnshifted && toUnshifted.x < minFromNode.point.x) {
                // Missing new point before first old point.
                pairUp(minFromNode, to[1], to[1].xValue, 'in');
            } else if (toUnshifted && toUnshifted.x > maxFromNode.point.x) {
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
            } else {
                throw new Error('Unable to process points');
            }
        }

        return { result, resultMap };
    };

    const { result: pairData, resultMap: pairMap } = pair();

    const intermediateFn = (ratio: number, path: Path) => {
        const { path: linePath } = path;

        for (const data of pairData) {
            const x = data.xFrom + (data.xTo - data.xFrom) * ratio;
            const y = data.yFrom + (data.yTo - data.yFrom) * ratio;
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

    return { path: { intermediateFn }, marker: { fromFn, toFn } };
}

function findPointOnLine(a: { x: number; y: number }, b: { x: number; y: number }, targetX: number) {
    const m = (b.y - a.y) / (b.x - a.x);
    // Find a point a distance along the line from `a` and `b`
    const y = (targetX - a.x) * m + a.y;
    return { x: targetX, y };
}
