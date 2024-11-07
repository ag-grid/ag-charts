import type { PartialPathPoint } from './pathUtil';

export function* pathRanges<T extends { point: PartialPathPoint }>(points: T[]) {
    let start = -1;
    let end = 0;
    for (const { point } of points) {
        if (point.moveTo) {
            const range = start >= 0 ? { start, end } : undefined;
            start = end;
            end = start;

            if (range !== undefined) {
                yield range;
            }
        }

        end += 1;
    }

    if (start !== -1) {
        yield { start, end };
    }
}

export function* pathRangePoints<T extends { point: PartialPathPoint }>(
    points: T[],
    { start, end }: { start: number; end: number }
) {
    for (let i = start; i < end; i += 1) {
        yield points[i].point;
    }
}

export function* pathRangePointsReverse<T extends { point: PartialPathPoint }>(
    points: T[],
    { start, end }: { start: number; end: number }
) {
    for (let i = end - 1; i >= start; i -= 1) {
        yield points[i].point;
    }
}
