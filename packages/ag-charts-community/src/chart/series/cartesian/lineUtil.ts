import { FROM_TO_MIXINS, type NodeUpdateState } from '../../../motion/fromToMotion';
import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { Marker } from '../../marker/marker';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum, Scaling } from './cartesianSeries';
import type { MarkerChange } from './markerUtil';
import type { PathPoint, PathPointMap } from './pathUtil';

type LineNodeDatum = CartesianSeriesNodeDatum & {
    point: CartesianSeriesNodeDatum['point'] & {
        moveTo: boolean;
    };
    xValue?: number;
    yValue?: number;
};

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

function minMax(nodeData: LineNodeDatumLike[]) {
    return nodeData.reduce<{ min?: LineNodeDatumLike; max?: LineNodeDatumLike }>(
        ({ min, max }, node: LineNodeDatumLike) => {
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
            toProcess.forEach((d) => (d.to = intersectionOnLine(result[sIdx].from!, result[eIdx].from!, d.from!.x)));
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
            toProcess.forEach((d) => (d.from = intersectionOnLine(result[sIdx].to!, result[eIdx].to!, d.to!.x)));
        } else {
            toProcess.forEach((d) => (d.from = d.to));
        }
    });
}

function calculateMoveTo(from = false, to = false): PathPoint['moveTo'] {
    if (from === to) {
        return !!from;
    }

    return from ? 'in' : 'out';
}

export interface LineNodeDatumLike extends CartesianSeriesNodeDatum {
    readonly point: CartesianSeriesNodeDatum['point'] & { moveTo?: boolean };
}

type LineContextLike = Pick<CartesianSeriesNodeDataContext<LineNodeDatumLike>, 'scales' | 'nodeData'>;

export function pairContinuousData(newData: LineContextLike, oldData: LineContextLike) {
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

    const pairUp = (from?: LineNodeDatumLike, to?: LineNodeDatumLike, xValue?: any, marker: MarkerChange = 'move') => {
        const resultPoint = {
            from: from?.point,
            to: to?.point,
            moveTo: calculateMoveTo(from?.point.moveTo, to?.point.moveTo),
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
    };

    const { min: minFromNode, max: maxFromNode } = minMax(oldData.nodeData);
    const { min: minToNode, max: maxToNode } = minMax(newData.nodeData);

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

export function pairCategoryData(newData: LineContextLike, oldData: LineContextLike, diff: ProcessedOutputDiff) {
    const result: PathPoint[] = [];
    const resultMap: PathPointMap = {
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
                moveTo: next.point.moveTo ?? false,
                from: next.point,
            };
            resultMap.removed[next.xValue] = resultPoint;
        } else {
            resultPoint = {
                marker: 'move',
                moveTo: next.point.moveTo ?? false,
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
                moveTo: next.point.moveTo ?? false,
                to: next.point,
            };
            resultMap.added[next.xValue] = resultPoint;
            result.splice(diff.addedIndices[addedIdx], 0, resultPoint);
        } else {
            const moved = resultMap.moved[next.xValue];
            moved.to = next.point;
            moved.moveTo = calculateMoveTo(!!moved.moveTo, next.point.moveTo);
        }
    }

    let previousX = -Infinity;
    const isXUnordered = result.some((pathPoint) => {
        const { marker, to: { x = -Infinity } = {} } = pathPoint;

        if (marker === 'out') return;
        const result = x < previousX;
        previousX = x;
        return result;
    });
    if (isXUnordered) {
        return { result: undefined, resultMap: undefined };
    }

    backfillPathPointData(result);

    return { result, resultMap };
}

export function prepareLineMarkerAnimation(pairMap: PathPointMap) {
    const markerStatus = (datum: LineNodeDatumLike): { point?: PathPoint; status: NodeUpdateState } => {
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
    const fromFn = (marker: Marker, datum: LineNodeDatumLike) => {
        const { status, point } = markerStatus(datum);
        if (status === 'unknown') return { opacity: 0 };

        const defaults = {
            translationX: point?.from?.x ?? marker.translationX,
            translationY: point?.from?.y ?? marker.translationY,
            opacity: marker.opacity,
            ...FROM_TO_MIXINS[status],
        };

        if (status === 'added') {
            return { ...defaults, opacity: 0 };
        }

        return defaults;
    };

    const toFn = (_marker: Marker, datum: LineNodeDatumLike) => {
        const { status, point } = markerStatus(datum);
        if (status === 'unknown') return { opacity: 0 };

        const defaults = { translationX: datum.point.x, translationY: datum.point.y, opacity: 1 };

        if (status === 'removed') {
            return { ...defaults, translationX: point?.to?.x, translationY: point?.to?.y, opacity: 0 };
        }

        return defaults;
    };

    return { fromFn, toFn };
}

export function determinePathStatus(newData: LineContextLike, oldData: LineContextLike) {
    let status: NodeUpdateState = 'updated';
    if (oldData.nodeData.length === 0 && newData.nodeData.length > 0) {
        status = 'added';
    } else if (oldData.nodeData.length > 0 && newData.nodeData.length === 0) {
        status = 'removed';
    }
    return status;
}

function prepareLinePathPropertyAnimation(status: NodeUpdateState) {
    return {
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
}

export function prepareLinePathAnimationFns(
    newData: LineContextLike,
    oldData: LineContextLike,
    pairData: PathPoint[],
    render: (pairData: PathPoint[], ratios: Partial<Record<MarkerChange, number>>, path: Path) => void
) {
    const status = determinePathStatus(newData, oldData);
    const removePhaseFn = (ratio: number, path: Path) => {
        if (status === 'added') addPhaseFn(1, path);
        if (status === 'removed') render(pairData, { move: 0, out: 0 }, path);
        if (status === 'updated') render(pairData, { move: 0, out: ratio }, path);
    };
    const updatePhaseFn = (ratio: number, path: Path) => {
        if (status === 'added') addPhaseFn(1, path);
        if (status === 'removed') removePhaseFn(0, path);
        if (status === 'updated') render(pairData, { move: ratio }, path);
    };
    const addPhaseFn = (ratio: number, path: Path) => {
        if (status === 'added') render(pairData, { move: 1, in: 1 }, path);
        if (status === 'removed') removePhaseFn(0, path);
        if (status === 'updated') render(pairData, { move: 1, in: ratio }, path);
    };
    const pathProperties = prepareLinePathPropertyAnimation(status);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

function renderPartialLine(pairData: PathPoint[], ratios: Partial<Record<MarkerChange, number>>, path: Path) {
    const { path: linePath } = path;
    let previousTo: PathPoint['to'];
    for (const data of pairData) {
        const ratio = ratios[data.marker];
        if (ratio == null) continue;

        const { from, to } = data;
        if (from == null || to == null) continue;

        const x = from.x + (to.x - from.x) * ratio;
        const y = from.y + (to.y - from.y) * ratio;
        if (data.moveTo === false) {
            linePath.lineTo(x, y);
        } else if (data.moveTo === true || !previousTo) {
            linePath.moveTo(x, y);
        } else if (previousTo) {
            const moveToRatio = data.moveTo === 'in' ? ratio : 1 - ratio;
            const midPointX = previousTo.x + (x - previousTo.x) * moveToRatio;
            const midPointY = previousTo.y + (y - previousTo.y) * moveToRatio;
            linePath.lineTo(midPointX, midPointY);
            linePath.moveTo(x, y);
        }
        previousTo = to;
    }
}

export function prepareLinePathAnimation(
    newData: LineContextLike,
    oldData: LineContextLike,
    diff?: ProcessedOutputDiff
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const { result: pairData, resultMap: pairMap } =
        isCategoryBased && diff ? pairCategoryData(newData, oldData, diff) : pairContinuousData(newData, oldData);

    if (pairData === undefined || pairMap === undefined) {
        return;
    }

    const pathFns = prepareLinePathAnimationFns(newData, oldData, pairData, renderPartialLine);
    const marker = prepareLineMarkerAnimation(pairMap);
    return { ...pathFns, marker };
}

function intersectionOnLine(a: { x: number; y: number }, b: { x: number; y: number }, targetX: number) {
    const m = (b.y - a.y) / (b.x - a.x);
    // Find a point a distance along the line from `a` and `b`
    const y = (targetX - a.x) * m + a.y;
    return { x: targetX, y };
}
