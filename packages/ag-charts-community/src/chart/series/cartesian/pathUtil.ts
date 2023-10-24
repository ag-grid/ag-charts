import { LABEL_PHASE } from '../../../motion/animation';
import { staticFromToMotion } from '../../../motion/fromToMotion';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { AnimationManager } from '../../interaction/animationManager';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

export type PathPointChange = 'move' | 'in' | 'out';

export type PathPoint = {
    from?: { x: number; y: number };
    to?: { x: number; y: number };
    change: PathPointChange;
    moveTo: true | false | 'in' | 'out';
};
export type PathPointMap = {
    [key in 'moved' | 'added' | 'removed']: { [key: string]: PathPoint };
};
export interface PathNodeDatumLike extends Pick<CartesianSeriesNodeDatum, 'xValue'> {
    readonly point: Point & { moveTo?: boolean };
}

export function minMax(nodeData: PathNodeDatumLike[]) {
    return nodeData.reduce<{ min?: PathNodeDatumLike; max?: PathNodeDatumLike }>(
        ({ min, max }, node: PathNodeDatumLike) => {
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

function intersectionOnLine(a: { x: number; y: number }, b: { x: number; y: number }, targetX: number) {
    const m = (b.y - a.y) / (b.x - a.x);
    // Find a point a distance along the line from `a` and `b`
    const y = (targetX - a.x) * m + a.y;
    return { x: targetX, y };
}

function backfillPathPoint(
    results: PathPoint[],
    process: PathPointChange,
    skip: PathPointChange,
    processFn: (toProcess: PathPoint[], prevMarkerIdx: number, nextMarkerIdx: number) => void
) {
    let prevMarkerIdx = -1,
        nextMarkerIdx = 0;
    const toProcess: PathPoint[] = [];
    while (nextMarkerIdx < results.length) {
        if (results[nextMarkerIdx].change === process) {
            toProcess.push(results[nextMarkerIdx]);
            nextMarkerIdx++;
            continue;
        }

        if (results[nextMarkerIdx].change === skip) {
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

export type BackfillSplitMode = 'intersect' | 'static';
export type BackfillAddMode = 'fan-out' | 'static';
export function backfillPathPointData(result: PathPoint[], splitMode: BackfillSplitMode) {
    backfillPathPoint(result, 'out', 'in', (toProcess, sIdx, eIdx) => {
        if (sIdx === -1 && result[eIdx]) {
            toProcess.forEach((d) => (d.to = result[eIdx].from));
        } else if (eIdx === result.length && result[sIdx]) {
            toProcess.forEach((d) => (d.to = result[sIdx].from));
        } else if (splitMode === 'intersect' && result[sIdx]?.from && result[eIdx]?.from) {
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
        } else if (splitMode === 'intersect' && result[sIdx]?.to && result[eIdx]?.to) {
            toProcess.forEach((d) => (d.from = intersectionOnLine(result[sIdx].to!, result[eIdx].to!, d.to!.x)));
        } else {
            toProcess.forEach((d) => (d.from = d.to));
        }
    });
}

export function pathSwipeInAnimation({ id }: { id: string }, animationManager: AnimationManager, paths: Path[]) {
    staticFromToMotion(
        id,
        'path_properties',
        animationManager,
        paths,
        { clipScalingX: 0 },
        { clipScalingX: 1 },
        {
            start: { clipMode: 'normal' },
            finish: { clipMode: undefined },
        }
    );
}

export function pathFadeInAnimation<T>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    selection: Selection<Path, T>[] | Path[]
) {
    staticFromToMotion(id, subId, animationManager, selection, { opacity: 0 }, { opacity: 1 }, LABEL_PHASE);
}

export function pathFadeOutAnimation<T>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    selection: Selection<Path, T>[] | Path[]
) {
    staticFromToMotion(id, subId, animationManager, selection, { opacity: 1 }, { opacity: 0 }, LABEL_PHASE);
}

export function resetPathFn(_node: Path) {
    return { opacity: 1, clipScalingX: 1, clipMode: undefined };
}
