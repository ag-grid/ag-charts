import type { DistantObject } from '../../../scene/nearest';
import type { Node } from '../../../scene/node';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
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

export function addHitTestersToQuadtree<TNode extends QuadtreeCompatibleNode, TDatum extends CartesianSeriesNodeDatum>(
    quadtree: QuadtreeNearest<TDatum>,
    hitTesters: Iterable<TNode>
) {
    for (const node of hitTesters) {
        const datum: TDatum | undefined = node.datum;
        if (datum !== undefined) {
            quadtree.addValue(node, datum);
        } else {
            Logger.error('undefined datum');
        }
    }

    return;
}
