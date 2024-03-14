import type { BBox } from '../../../scene/bbox';
import type { DistantObject } from '../../../scene/nearest';
import type { Node } from '../../../scene/node';
import { QuadtreeNearest } from '../../../scene/util/quadtree';
import { Logger } from '../../../util/logger';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

type QuadtreeCompatibleNode = Node & DistantObject & { readonly midPoint: { x: number; y: number } };

export function* childrenIter<TNode extends Node = Node>(parent: Node): Iterable<TNode> {
    for (const node of parent.children) {
        yield node as TNode;
    }
}

export function* childrenOfChildrenIter<TNode extends Node = Node>(contentGroup: Node): Iterable<TNode> {
    for (const children of contentGroup.children) {
        for (const node of children.children) {
            yield node as TNode;
        }
    }
}

export function createQuadtree<TNode extends QuadtreeCompatibleNode, TDatum extends CartesianSeriesNodeDatum>(
    seriesRect: BBox | undefined,
    hitTesters: Iterable<TNode>
): QuadtreeNearest<TDatum> {
    const quadtree = new QuadtreeNearest<TDatum>(100, 10, seriesRect);
    for (const node of hitTesters) {
        const datum: TDatum | undefined = node.datum;
        if (datum !== undefined) {
            quadtree.addValue(node, datum);
        } else {
            Logger.error('undefined datum');
        }
    }

    return quadtree;
}
