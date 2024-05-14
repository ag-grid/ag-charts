import type { Group } from '../../../scene/group';
import type { Node } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import { Logger } from '../../../util/logger';
import type { DistantObject } from '../../../util/nearest';
import type { SeriesNodePickMatch } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';

export type QuadtreeCompatibleNode = Node & DistantObject & { readonly midPoint: { x: number; y: number } };

export function* childrenIter<TNode extends Node = Node>(parent: Node): Iterable<TNode> {
    for (const node of parent.children) {
        yield node as TNode;
    }
}

export function addHitTestersToQuadtree<TNode extends QuadtreeCompatibleNode, TDatum extends SeriesNodeDatum>(
    quadtree: QuadtreeNearest<TDatum>,
    hitTesters: Iterable<TNode>
) {
    for (const node of hitTesters) {
        const datum: TDatum | undefined = node.datum;
        if (datum === undefined) {
            Logger.error('undefined datum');
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
    const { x, y } = series.contentGroup.transformPoint(point.x, point.y);
    const { nearest, distanceSquared } = series.getQuadTree().find(x, y);
    if (nearest !== undefined) {
        return { datum: nearest.value, distance: Math.sqrt(distanceSquared) };
    }

    return undefined;
}
