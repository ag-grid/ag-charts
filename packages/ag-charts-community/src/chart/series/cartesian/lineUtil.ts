import { FROM_TO_MIXINS, type NodeUpdateState } from '../../../motion/fromToMotion';
import type { Path } from '../../../scene/shape/path';
import { transformIntegratedCategoryValue } from '../../../util/value';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { CartesianSeriesNodeDataContext } from './cartesianSeries';
import { prepareMarkerAnimation } from './markerUtil';
import type { BackfillSplitMode, PathNodeDatumLike, PathPoint, PathPointChange, PathPointMap } from './pathUtil';
import { backfillPathPointData, minMax, renderPartialPath } from './pathUtil';
import { Scaling, areScalingEqual } from './scaling';

function scale(val: number | string | Date, scaling?: Scaling) {
    if (!scaling) return NaN;

    if (val instanceof Date) {
        val = val.getTime();
    }
    if (scaling.type === 'continuous' && typeof val === 'number') {
        const domainRatio = (val - scaling.domain[0]) / (scaling.domain[1] - scaling.domain[0]);
        return domainRatio * (scaling.range[1] - scaling.range[0]) + scaling.range[0];
    }
    if (scaling.type === 'log' && typeof val === 'number') {
        return scaling.convert(val);
    }

    // Category axis case.
    const matchingIndex = scaling.domain.findIndex((d) => d === val);
    if (matchingIndex >= 0) {
        return scaling.range[matchingIndex];
    }

    // We failed to convert using the scale.
    return NaN;
}

function scalesChanged(newData: LineContextLike, oldData: LineContextLike) {
    return !areScalingEqual(newData.scales.x, oldData.scales.x) || !areScalingEqual(newData.scales.y, oldData.scales.y);
}

function closeMatch<T extends number | string>(a: T, b: T) {
    const an = Number(a);
    const bn = Number(b);
    if (!isNaN(an) && !isNaN(bn)) {
        return Math.abs(bn - an) < 0.25;
    }
    return a === b;
}

function calculateMoveTo(from = false, to = false): PathPoint['moveTo'] {
    if (from === to) {
        return !!from;
    }

    return from ? 'in' : 'out';
}

type LineContextLike = {
    scales: CartesianSeriesNodeDataContext['scales'];
    nodeData: PathNodeDatumLike[];
    visible: boolean;
};

export function pairContinuousData(
    newData: LineContextLike,
    oldData: LineContextLike,
    opts: {
        backfillSplitMode?: BackfillSplitMode;
    } = {}
) {
    const { backfillSplitMode = 'intersect' } = opts;
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

    const pairUp = (
        from?: PathNodeDatumLike,
        to?: PathNodeDatumLike,
        xValue?: any,
        change: PathPointChange = 'move'
    ) => {
        if (from && (isNaN(from.point.x) || isNaN(from.point.y))) {
            // Default to 'to' position if 'from' is invalid.
            from = to;
        }
        const resultPoint = {
            from: from?.point,
            to: to?.point,
            moveTo: calculateMoveTo(from?.point.moveTo, to?.point.moveTo),
            change,
        };
        if (change === 'move') {
            resultMap.moved[xValue] = resultPoint;
            oldIdx++;
            newIdx++;
        } else if (change === 'in') {
            resultMap.added[xValue] = resultPoint;
            newIdx++;
        } else if (change === 'out') {
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

    backfillPathPointData(result, backfillSplitMode);
    return { result, resultMap };
}

export function pairCategoryData(
    newData: LineContextLike,
    oldData: LineContextLike,
    diff: ProcessedOutputDiff | undefined,
    opts: {
        backfillSplitMode?: BackfillSplitMode;
        multiDatum?: boolean;
    } = {}
) {
    const { backfillSplitMode = 'intersect', multiDatum = false } = opts;
    const result: PathPoint[] = [];
    const resultMapSingle: PathPointMap<false> = {
        added: {},
        moved: {},
        removed: {},
    };
    const resultMapMulti: PathPointMap<true> = {
        added: {},
        moved: {},
        removed: {},
    };

    let previousResultPoint: PathPoint | undefined = undefined;
    let previousXValue: any | undefined = undefined;
    const addToResultMap = (xValue: string, result: PathPoint) => {
        const type: keyof PathPointMap =
            result.change === 'move' ? 'moved' : result.change === 'in' ? 'added' : 'removed';
        if (multiDatum) {
            resultMapMulti[type][xValue] ??= [];
            resultMapMulti[type][xValue].push(result);
        } else {
            resultMapSingle[type][xValue] = result;
        }

        previousResultPoint = result;
        previousXValue = transformIntegratedCategoryValue(xValue);
    };

    let oldIndex = 0;
    let newIndex = 0;
    let isXUnordered = false;
    while (oldIndex < oldData.nodeData.length || newIndex < newData.nodeData.length) {
        const before = oldData.nodeData[oldIndex];
        const after = newData.nodeData[newIndex];
        const bXValue = transformIntegratedCategoryValue(before?.xValue);
        const aXValue = transformIntegratedCategoryValue(after?.xValue);

        let resultPoint: PathPoint;
        if (bXValue === aXValue) {
            resultPoint = {
                change: 'move',
                moveTo: calculateMoveTo(before.point.moveTo ?? false, after.point.moveTo),
                from: before.point,
                to: after.point,
            };
            addToResultMap(before?.xValue, resultPoint);
            oldIndex++;
            newIndex++;
        } else if (diff !== undefined && diff.removed.indexOf(String(bXValue)) >= 0) {
            resultPoint = {
                change: 'out',
                moveTo: before.point.moveTo ?? false,
                from: before.point,
            };
            addToResultMap(before?.xValue, resultPoint);
            oldIndex++;
        } else if (diff !== undefined && diff.added.indexOf(String(aXValue)) >= 0) {
            resultPoint = {
                change: 'in',
                moveTo: after.point.moveTo ?? false,
                to: after.point,
            };
            addToResultMap(after?.xValue, resultPoint);
            newIndex++;
        } else if (multiDatum && previousResultPoint && previousXValue === bXValue) {
            resultPoint = {
                ...(previousResultPoint as PathPoint),
            };
            addToResultMap(before?.xValue, resultPoint);
            oldIndex++;
        } else if (multiDatum && previousResultPoint && previousXValue === aXValue) {
            resultPoint = {
                ...(previousResultPoint as PathPoint),
            };
            addToResultMap(after?.xValue, resultPoint);
            newIndex++;
        } else {
            isXUnordered = true;
            break;
        }

        result.push(resultPoint);
    }

    let previousX = -Infinity;
    isXUnordered ||= result.some((pathPoint) => {
        const { change: marker, to: { x = -Infinity } = {} } = pathPoint;

        if (marker === 'out') return;
        const result = x < previousX;
        previousX = x;
        return result;
    });
    if (isXUnordered) {
        return { result: undefined, resultMap: undefined };
    }

    backfillPathPointData(result, backfillSplitMode);

    if (multiDatum) {
        return { result, resultMap: resultMapMulti };
    }
    return { result, resultMap: resultMapSingle };
}

export function determinePathStatus(newData: LineContextLike, oldData: LineContextLike) {
    let status: NodeUpdateState = 'updated';

    const visible = (data: LineContextLike) => {
        return data.visible;
    };

    if (!visible(oldData) && visible(newData)) {
        status = 'added';
    } else if (visible(oldData) && !visible(newData)) {
        status = 'removed';
    }
    return status;
}

function prepareLinePathPropertyAnimation(status: NodeUpdateState, visibleToggleMode: 'fade' | 'none') {
    const phase: NodeUpdateState = visibleToggleMode === 'none' ? 'updated' : status;

    const result = {
        fromFn: (_path: Path) => {
            let mixin;
            if (status === 'removed') {
                mixin = { finish: { visible: false } };
            } else if (status === 'added') {
                mixin = { start: { visible: true } };
            } else {
                mixin = {};
            }
            return { ...FROM_TO_MIXINS[phase], ...mixin };
        },
        toFn: (_path: Path) => {
            return { ...FROM_TO_MIXINS[phase] };
        },
    };

    if (visibleToggleMode === 'fade') {
        return {
            fromFn: (path: Path) => {
                const opacity = status === 'added' ? 0 : path.opacity;
                return { opacity, ...result.fromFn(path) };
            },
            toFn: (path: Path) => {
                const opacity = status === 'removed' ? 0 : 1;
                return { opacity, ...result.toFn(path) };
            },
        };
    }

    return result;
}

export function prepareLinePathAnimationFns(
    newData: LineContextLike,
    oldData: LineContextLike,
    pairData: PathPoint[],
    visibleToggleMode: 'fade' | 'none',
    render: (pairData: PathPoint[], ratios: Partial<Record<PathPointChange, number>>, path: Path) => void
) {
    const status = determinePathStatus(newData, oldData);
    const removePhaseFn = (ratio: number, path: Path) => {
        render(pairData, { move: 0, out: ratio }, path);
    };
    const updatePhaseFn = (ratio: number, path: Path) => {
        render(pairData, { move: ratio }, path);
    };
    const addPhaseFn = (ratio: number, path: Path) => {
        render(pairData, { move: 1, in: ratio }, path);
    };
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

export function prepareLinePathAnimation(
    newData: LineContextLike,
    oldData: LineContextLike,
    diff?: ProcessedOutputDiff
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const wasCategoryBased = oldData.scales.x?.type === 'category';
    if (isCategoryBased !== wasCategoryBased) {
        // Not comparable.
        return;
    }

    const { result: pairData, resultMap: pairMap } = isCategoryBased
        ? pairCategoryData(newData, oldData, diff)
        : pairContinuousData(newData, oldData);

    let status: NodeUpdateState = 'updated';
    if (oldData.visible && !newData.visible) {
        status = 'removed';
    } else if (!oldData.visible && newData.visible) {
        status = 'added';
    }

    if (pairData === undefined || pairMap === undefined) {
        return;
    }

    const hasMotion: boolean = (diff?.changed ?? true) || scalesChanged(newData, oldData) || status !== 'updated';
    const pathFns = prepareLinePathAnimationFns(newData, oldData, pairData, 'fade', renderPartialPath);
    const marker = prepareMarkerAnimation(pairMap, status);
    return { ...pathFns, marker, hasMotion };
}
