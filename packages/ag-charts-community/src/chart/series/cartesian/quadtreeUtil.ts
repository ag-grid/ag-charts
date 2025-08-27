import { Logger, type Point } from 'ag-charts-core';

import type { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import type { DistantObject } from '../../../util/nearest';
import type { SeriesNodePickMatch } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';

export type QuadtreeCompatibleNode<D> = Node<D> & DistantObject & { readonly midPoint: { x: number; y: number } };

export function addHitTestersToQuadtree<
    TDatum extends SeriesNodeDatum<unknown>,
    TNode extends QuadtreeCompatibleNode<TDatum>,
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

type SeriesWithQuadtreeNearest<TDatum extends SeriesNodeDatum<unknown>> = {
    readonly contentGroup: Group;
    getQuadTree(): QuadtreeNearest<TDatum>;
};

export function findQuadtreeMatch<TDatum extends SeriesNodeDatum<unknown>>(
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
