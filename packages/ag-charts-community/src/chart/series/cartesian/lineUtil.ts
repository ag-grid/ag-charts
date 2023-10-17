import { FROM_TO_MIXINS, type NodeUpdateState } from '../../../motion/fromToMotion';
import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
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
    from?: { x: number; y: number };
    to?: { x: number; y: number };
    marker: MarkerChange;
    moveTo: boolean;
};

function isLineNodeDatum(v: LineNodeDatum | {}): v is LineNodeDatum {
    return 'point' in v;
}

function scale(val: number | string | Date, scaling?: Scaling) {
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

    // We failed to convert using the scale.
    return NaN;
}

function minMax(data: CartesianSeriesNodeDataContext<LineNodeDatum>) {
    return data.nodeData.reduce<{ min?: LineNodeDatum; max?: LineNodeDatum }>(({ min, max }, node: LineNodeDatum) => {
        if (min == null || min.point.x > node.point.x) {
            min = node;
        }
        if (max == null || max.point.x < node.point.x) {
            max = node;
        }
        return { min, max };
    }, {});
}

function backfillPathPoint(
    results: PathPoint[],
    process: MarkerChange,
    skip: MarkerChange,
    processFn: (toProcess: PathPoint[], prevMarkerIdx: number, nextMarkerIdx: number) => void
) {
    let prevMarkerIdx = -1,
        nextMarkerIdx = 0;
    const toProcess: PathPoint[] = [];
    while (nextMarkerIdx < results.length) {
        if (results[nextMarkerIdx].marker === process) {
            toProcess.push(results[nextMarkerIdx]);
            nextMarkerIdx++;
            continue;
        }

        if (results[nextMarkerIdx].marker === skip) {
            nextMarkerIdx++;
            continue;
        }

        if (toProcess.length > 0) {
            processFn(toProcess, prevMarkerIdx, nextMarkerIdx);
            toProcess.length = 0;
        }
        prevMarkerIdx = nextMarkerIdx;
        nextMarkerIdx++;
    }

    if (toProcess.length > 0) {
        processFn(toProcess, prevMarkerIdx, nextMarkerIdx);
    }
}

function closeMatch<T extends number | string>(a: T, b: T) {
    const an = Number(a);
    const bn = Number(b);
    if (!isNaN(an) && !isNaN(bn)) {
        return Math.abs(bn - an) < 0.25;
    }
    return a === b;
}

function backfillPathPointData(result: PathPoint[]) {
    backfillPathPoint(result, 'out', 'in', (toProcess, sIdx, eIdx) => {
        if (sIdx === -1 && result[eIdx]) {
            toProcess.forEach((d) => (d.to = result[eIdx].from));
        } else if (eIdx === result.length && result[sIdx]) {
            toProcess.forEach((d) => (d.to = result[sIdx].from));
        } else if (result[sIdx]?.from && result[eIdx]?.from) {
            toProcess.forEach((d) => (d.to = findPointOnLine(result[sIdx].from!, result[eIdx].from!, d.from!.x)));
        } else {
            toProcess.forEach((d) => (d.to = d.from));
        }
    });

    backfillPathPoint(result, 'in', 'out', (toProcess, sIdx, eIdx) => {
        if (sIdx === -1 && result[eIdx]) {
            toProcess.forEach((d) => (d.from = result[eIdx].to));
        } else if (eIdx === result.length && result[sIdx]) {
            toProcess.forEach((d) => (d.from = result[sIdx].to));
        } else if (result[sIdx]?.to && result[eIdx]?.to) {
            toProcess.forEach((d) => (d.from = findPointOnLine(result[sIdx].to!, result[eIdx].to!, d.to!.x)));
        } else {
            toProcess.forEach((d) => (d.from = d.to));
        }
    });
}

function pairContinuousData(
    newData: CartesianSeriesNodeDataContext<LineNodeDatum>,
    oldData: CartesianSeriesNodeDataContext<LineNodeDatum>
) {
    const toNewScale = (oldDatum: { xValue?: number; yValue?: number }) => {
        return {
            x: scale(oldDatum.xValue ?? NaN, newData.scales.x),
            y: scale(oldDatum.yValue ?? NaN, newData.scales.y),
        };
    };
    const toOldScale = (newDatum: { xValue?: number; yValue?: number }) => {
        return {
            x: scale(newDatum.xValue ?? NaN, oldData.scales.x),
            y: scale(newDatum.yValue ?? NaN, oldData.scales.y),
        };
    };

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
        from: PathPoint['from'] | LineNodeDatum,
        to: PathPoint['to'] | LineNodeDatum,
        xValue?: any,
        marker: MarkerChange = 'move'
    ) => {
        if (from && isLineNodeDatum(from)) {
            from = from.point;
        }
        if (to && isLineNodeDatum(to)) {
            to = to.point;
        }

        const resultPoint = { from, to, moveTo, marker };
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

    let oldIdx = 0;
    let newIdx = 0;
    while (oldIdx < oldData.nodeData.length || newIdx < newData.nodeData.length) {
        const from = oldData.nodeData[oldIdx];
        const to = newData.nodeData[newIdx];

        const fromShifted = from ? toNewScale(from) : undefined;
        const toUnshifted = to ? toOldScale(to) : undefined;

        const NA = undefined;
        if (fromShifted && closeMatch(fromShifted.x, to?.point.x)) {
            pairUp(from, to, to.xValue, 'move');
        } else if (fromShifted && fromShifted.x < (minToNode?.point.x ?? -Infinity)) {
            pairUp(from, NA, from.xValue, 'out');
        } else if (fromShifted && fromShifted.x > (maxToNode?.point.x ?? Infinity)) {
            pairUp(from, NA, from.xValue, 'out');
        } else if (toUnshifted && toUnshifted.x < (minFromNode?.point.x ?? -Infinity)) {
            pairUp(NA, to, to.xValue, 'in');
        } else if (toUnshifted && toUnshifted.x > (maxFromNode?.point.x ?? Infinity)) {
            pairUp(NA, to, to.xValue, 'in');
        } else if (fromShifted && fromShifted.x < to?.point.x) {
            pairUp(from, NA, from.xValue, 'out');
        } else if (toUnshifted && toUnshifted.x < from?.point.x) {
            pairUp(NA, to, to.xValue, 'in');
        } else if (from) {
            pairUp(from, NA, from.xValue, 'out');
        } else if (to) {
            pairUp(NA, to, to.xValue, 'in');
        } else {
            throw new Error('Unable to process points');
        }
    }

    backfillPathPointData(result);
    return { result, resultMap };
}

function pairCategoryData(
    newData: CartesianSeriesNodeDataContext<LineNodeDatum>,
    oldData: CartesianSeriesNodeDataContext<LineNodeDatum>,
    diff: ProcessedOutputDiff
) {
    const result: PathPoint[] = [];
    const resultMap: {
        [key in 'moved' | 'added' | 'removed']: { [key: string | number]: PathPoint };
    } = {
        added: {},
        moved: {},
        removed: {},
    };

    // Process oldData first to maintain old order if possible.
    for (const next of oldData.nodeData) {
        let resultPoint: PathPoint;
        if (diff.removed.indexOf(next.xValue) >= 0) {
            resultPoint = {
                marker: 'out',
                moveTo: next.point.moveTo,
                from: next.point,
            };
            resultMap.removed[next.xValue] = resultPoint;
        } else {
            resultPoint = {
                marker: 'move',
                moveTo: next.point.moveTo,
                from: next.point,
            };
            resultMap.moved[next.xValue] = resultPoint;
        }
        result.push(resultPoint);
    }

    // Process newData to mixin updated/new coordinates/markers.
    for (const next of newData.nodeData) {
        const addedIdx = diff.added.indexOf(next.xValue);
        if (addedIdx >= 0) {
            const resultPoint: PathPoint = {
                marker: 'in',
                moveTo: next.point.moveTo,
                to: next.point,
            };
            resultMap.added[next.xValue] = resultPoint;
            result.splice(diff.addedIndices[addedIdx], 0, resultPoint);
        } else {
            resultMap.moved[next.xValue].to = next.point;
        }
    }

    backfillPathPointData(result);

    return { result, resultMap };
}

export function prepareLinePathAnimation(
    newData: CartesianSeriesNodeDataContext<LineNodeDatum>,
    oldData: CartesianSeriesNodeDataContext<LineNodeDatum>,
    diff?: ProcessedOutputDiff
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const { result: pairData, resultMap: pairMap } =
        isCategoryBased && diff ? pairCategoryData(newData, oldData, diff) : pairContinuousData(newData, oldData);

    const render = (ratios: Partial<Record<MarkerChange, number>>, path: Path) => {
        const { path: linePath } = path;
        for (const data of pairData) {
            const ratio = ratios[data.marker];
            if (ratio == null) continue;

            const { from, to } = data;
            if (from == null || to == null) continue;

            const x = from.x + (to.x - from.x) * ratio;
            const y = from.y + (to.y - from.y) * ratio;
            if (data.moveTo) {
                linePath.moveTo(x, y);
            } else {
                linePath.lineTo(x, y);
            }
        }
    };

    const markerStatus = (datum: LineNodeDatum): { point?: PathPoint; status: NodeUpdateState } => {
        const { xValue } = datum;

        if (pairMap.moved[xValue]) {
            return { point: pairMap.moved[xValue], status: 'updated' };
        } else if (pairMap.removed[xValue]) {
            return { point: pairMap.removed[xValue], status: 'removed' };
        } else if (pairMap.added[xValue]) {
            return { point: pairMap.added[xValue], status: 'added' };
        }

        return { status: 'unknown' };
    };
    const fromFn = (marker: Marker, datum: LineNodeDatum, _status: NodeUpdateState) => {
        const { status, point } = markerStatus(datum);
        if (status === 'unknown') return { opacity: 0 };

        const defaults = {
            translationX: marker.translationX,
            translationY: marker.translationY,
            opacity: marker.opacity,
            ...FROM_TO_MIXINS[status],
        };

        if (status === 'added') {
            return { ...defaults, opacity: 0, translationX: point?.from?.x, translationY: point?.from?.y };
        }

        return defaults;
    };

    const toFn = (_marker: Marker, datum: LineNodeDatum, _status: NodeUpdateState) => {
        const { status, point } = markerStatus(datum);
        if (status === 'unknown') return { opacity: 0 };

        const defaults = { translationX: datum.point.x, translationY: datum.point.y, opacity: 1 };

        if (status === 'removed') {
            return { ...defaults, translationX: point?.to?.x, translationY: point?.to?.y, opacity: 0 };
        }

        return defaults;
    };

    let status: NodeUpdateState = 'updated';
    if (oldData.nodeData.length === 0 && newData.nodeData.length > 0) {
        status = 'added';
    } else if (oldData.nodeData.length > 0 && newData.nodeData.length === 0) {
        status = 'removed';
    }

    const removePhaseFn = (ratio: number, path: Path) => {
        if (status === 'added') addPhaseFn(1, path);
        if (status === 'removed') render({ move: 0, out: 0 }, path);
        if (status === 'updated') render({ move: 0, out: ratio }, path);
    };
    const updatePhaseFn = (ratio: number, path: Path) => {
        if (status === 'added') addPhaseFn(1, path);
        if (status === 'removed') removePhaseFn(0, path);
        if (status === 'updated') render({ move: ratio }, path);
    };
    const addPhaseFn = (ratio: number, path: Path) => {
        if (status === 'added') render({ move: 1, in: 1 }, path);
        if (status === 'removed') removePhaseFn(0, path);
        if (status === 'updated') render({ move: 1, in: ratio }, path);
    };

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

            return { opacity: status === 'removed' ? 0 : path.opacity, ...FROM_TO_MIXINS[status] };
        },
    };

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties, marker: { fromFn, toFn } };
}

function findPointOnLine(a: { x: number; y: number }, b: { x: number; y: number }, targetX: number) {
    const m = (b.y - a.y) / (b.x - a.x);
    // Find a point a distance along the line from `a` and `b`
    const y = (targetX - a.x) * m + a.y;
    return { x: targetX, y };
}
