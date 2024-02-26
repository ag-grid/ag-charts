import type { BBoxLike } from './bboxset';

type BBox = BBoxLike;

class KdNode<V> {
    bbox: BBox;
    value: V;
    left: KdNode<V> | null;
    right: KdNode<V> | null;

    constructor(bbox: BBox, value: V) {
        this.bbox = bbox;
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

export class KdTree<V> {
    root: KdNode<V> | null = null;

    clear() {
        this.root = null;
    }

    addValue(bbox: BBox, value: V) {
        this.root = this.insert(this.root, bbox, value, 0);
    }

    private insert(node: KdNode<V> | null, bbox: BBox, value: V, depth: number): KdNode<V> {
        if (node === null) {
            return new KdNode(bbox, value);
        }

        const dimension = depth % 2; // alternate between x and y dimensions

        if (bboxContainsPoint(bbox, node.bbox, dimension)) {
            // If the new bounding box contains the current node's bounding box, insert recursively to the right
            node.right = this.insert(node.right, bbox, value, depth + 1);
        } else {
            // Otherwise, insert recursively to the left
            node.left = this.insert(node.left, bbox, value, depth + 1);
        }

        return node;
    }

    pickValues(x: number, y: number): Iterable<{ bbox: BBox; value: V }> {
        const result: { bbox: BBox; value: V }[] = [];
        this.search(this.root, x, y, 0, result);
        return result;
    }

    private search(node: KdNode<V> | null, x: number, y: number, depth: number, result: { bbox: BBox; value: V }[]) {
        if (node === null) {
            return;
        }

        const dimension = depth % 2;

        if (node.bbox.containsPoint(x, y)) {
            // If the current node's bounding box contains the point, add it to the result
            result.push({ bbox: node.bbox, value: node.value });
        }

        if ((dimension === 0 && x < node.bbox.x) || (dimension === 1 && y < node.bbox.y)) {
            // If the point lies to the left (for x dimension) or below (for y dimension), search left subtree
            this.search(node.left, x, y, depth + 1, result);
        } else if (
            (dimension === 0 && x >= node.bbox.x + node.bbox.width) ||
            (dimension === 1 && y >= node.bbox.y + node.bbox.height)
        ) {
            // If the point lies to the right (for x dimension) or above (for y dimension), search right subtree
            this.search(node.right, x, y, depth + 1, result);
        } else {
            // If the point might lie on both sides, search both subtrees
            this.search(node.left, x, y, depth + 1, result);
            this.search(node.right, x, y, depth + 1, result);
        }
    }
}

function bboxContainsPoint(bbox1: BBox, bbox2: BBox, dimension: number): boolean {
    if (dimension === 0) {
        // x dimension
        return bbox1.x <= bbox2.x && bbox1.x + bbox1.width >= bbox2.x + bbox2.width;
    } else {
        // y dimension
        return bbox1.y <= bbox2.y && bbox1.y + bbox1.height >= bbox2.y + bbox2.height;
    }
}
