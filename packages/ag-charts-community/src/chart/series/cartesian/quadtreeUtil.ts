import {
    BBox,
    type DistantObject,
    type Group,
    type Logger,
    type Node,
    type Point,
    type QuadtreeNearest,
} from 'ag-charts-core';

import type { SeriesNodePickMatch } from '../pickTypes';
import type { SeriesNodeDatum } from '../seriesTypes';

export type QuadtreeCompatibleNode<D> = Node<D> & DistantObject & { readonly midPoint: { x: number; y: number } };

/**
 * A shape's bounds before any gap inset, for a series whose drawn nodes leave the gap unpicked. One per node lifetime:
 * `setBounds` updates it in place, so a rebuild allocates nothing.
 */
export class QuadtreePickBBox extends BBox {
    readonly midPoint = { x: 0, y: 0 };

    constructor() {
        super(0, 0, 0, 0);
    }

    setBounds(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.midPoint.x = x + width / 2;
        this.midPoint.y = y + height / 2;
    }
}

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
