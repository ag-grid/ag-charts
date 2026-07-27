import type { DistantObject, Logger, Point } from 'ag-charts-core';

import type { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import type { SeriesNodePickMatch } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';

export type QuadtreeCompatibleNode<D> = Node<D> & DistantObject & { readonly midPoint: { x: number; y: number } };

export function addHitTestersToQuadtree<TDatum extends SeriesNodeDatum, TNode extends QuadtreeCompatibleNode<TDatum>>(
    quadtree: QuadtreeNearest<TDatum>,
    hitTesters: Iterable<TNode>,
    logger: Logger
) {
    for (const node of hitTesters) {
        const datum: TDatum | undefined = node.datum;
        if (datum === undefined) {
            logger.error('undefined datum');
        } else {
            quadtree.addValue(node, datum);
        }
    }
}

type SeriesWithQuadtreeNearest<TDatum extends SeriesNodeDatum> = {
    readonly contentGroup: Group;
    getQuadTree(): QuadtreeNearest<TDatum>;
};

export function findQuadtreeMatch<TDatum extends SeriesNodeDatum>(
    series: SeriesWithQuadtreeNearest<TDatum>,
    point: Point
): SeriesNodePickMatch | undefined {
    const { x, y } = point;
    const { nearest, distanceSquared } = series.getQuadTree().find(x, y);
    if (nearest !== undefined) {
        return { datum: nearest.value, distance: Math.sqrt(distanceSquared), target: series.contentGroup };
    }

    return undefined;
}
