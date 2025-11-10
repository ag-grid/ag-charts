import type { DistantObject } from 'ag-charts-core';
import { Logger, type Point } from 'ag-charts-core';

import type { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import type { SeriesNodePickMatch } from '../series';
import type { DatumIndexType, SeriesNodeDatum } from '../seriesTypes';

export type QuadtreeCompatibleNode = Node & DistantObject & { readonly midPoint: { x: number; y: number } };

export function addHitTestersToQuadtree<
    TNode extends QuadtreeCompatibleNode,
    TDatum extends SeriesNodeDatum<DatumIndexType>,
>(quadtree: QuadtreeNearest<TDatum>, hitTesters: Iterable<TNode>) {
    for (const node of hitTesters) {
        const datum: TDatum | undefined = node.datum;
        if (datum === undefined) {
            Logger.error('undefined datum');
        } else {
            quadtree.addValue(node, datum);
        }
    }
}

type SeriesWithQuadtreeNearest<TDatum extends SeriesNodeDatum<DatumIndexType>> = {
    readonly contentGroup: Group;
    getQuadTree(): QuadtreeNearest<TDatum>;
};

export function findQuadtreeMatch<TDatum extends SeriesNodeDatum<DatumIndexType>>(
    series: SeriesWithQuadtreeNearest<TDatum>,
    point: Point
): SeriesNodePickMatch | undefined {
    const { x, y } = point;
    const { nearest, distanceSquared } = series.getQuadTree().find(x, y);
    if (nearest !== undefined) {
        return { datum: nearest.value, distance: Math.sqrt(distanceSquared) };
    }

    return undefined;
}
