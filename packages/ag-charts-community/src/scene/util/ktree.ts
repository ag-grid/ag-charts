import type { BBox } from '../bbox';

interface BBoxProvider {
    computeBBox(): BBox | undefined;
}

interface TreeNode<V> {
    bbox: BBoxProvider;
    value: V;
    left?: TreeNode<V>;
    right?: TreeNode<V>;
}

export class KTree<V> {
    private root?: TreeNode<V>;

    add(value: V, bbox: BBoxProvider): void {
        this.root = this.insert(this.root, value, bbox, 0);
    }

    private insert(node: TreeNode<V> | undefined, value: V, bbox: BBoxProvider, depth: number): TreeNode<V> {
        if (node === undefined) {
            return { bbox, value, left: undefined, right: undefined };
        }

        const bbox1 = bbox.computeBBox();
        const bbox2 = node.bbox.computeBBox();
        if (bbox1 !== undefined && bbox2 !== undefined) {
            const axis = depth % 2; // alternate between x and y dimensions
            if (bbox1[axis === 0 ? 'x' : 'y'] < bbox2[axis === 0 ? 'x' : 'y']) {
                node.left = this.insert(node.left, value, bbox, depth + 1);
            } else {
                node.right = this.insert(node.right, value, bbox, depth + 1);
            }
        }

        return node;
    }

    find(x: number, y: number): V | undefined {
        return this.search(this.root, x, y, 0);
    }

    private search(node: TreeNode<V> | undefined, x: number, y: number, depth: number): V | undefined {
        const bbox = node?.bbox.computeBBox();
        if (node === undefined || bbox === undefined) {
            return undefined;
        }

        if (bbox?.containsPoint(x, y)) {
            return node.value;
        }

        const axis = depth % 2;
        if ((axis === 0 ? x : y) < bbox[axis === 0 ? 'x' : 'y']) {
            return this.search(node.left, x, y, depth + 1);
        } else {
            return this.search(node.right, x, y, depth + 1);
        }
    }
}
