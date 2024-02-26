import { BBox } from '../scene/bbox';

export class Quadtree<V> {
    private readonly root: QuadtreeNode<V>;

    constructor(capacity: number, boundary: BBox) {
        this.root = new QuadtreeNode<V>(boundary, capacity);
    }

    clear() {
        this.root.clear();
    }

    addValue(bbox: BBox, value: V): void {
        this.root.addValue(bbox, value);
    }

    pickValues(x: number, y: number): Iterable<{ bbox: BBox; value: V }> {
        const foundValues: { bbox: BBox; value: V }[] = [];
        this.root.query(x, y, foundValues);
        return foundValues;
    }
}

class QuadtreeNode<V> {
    private readonly boundary: BBox;
    private readonly capacity: number;
    private readonly values: Array<{ bbox: BBox; value: V }>;
    private readonly divided: boolean;
    private nw: QuadtreeNode<V> | null;
    private ne: QuadtreeNode<V> | null;
    private sw: QuadtreeNode<V> | null;
    private se: QuadtreeNode<V> | null;

    constructor(boundary: BBox, capacity: number) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.values = [];
        this.divided = false;
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }

    clear() {
        this.values.length = 0;
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }

    addValue(bbox: BBox, value: V): void {
        if (!this.boundary.containsPoint(bbox.x, bbox.y)) {
            return;
        }

        if (this.values.length < this.capacity) {
            this.values.push({ bbox, value });
        } else {
            if (!this.divided) {
                this.subdivide();
            }
            this.nw!.addValue(bbox, value);
            this.ne!.addValue(bbox, value);
            this.sw!.addValue(bbox, value);
            this.se!.addValue(bbox, value);
        }
    }

    query(x: number, y: number, foundValues: { bbox: BBox; value: V }[]): void {
        if (!this.boundary.containsPoint(x, y)) {
            return;
        }

        for (const { bbox, value } of this.values) {
            if (bbox.containsPoint(x, y)) {
                foundValues.push({ bbox, value });
            }
        }

        if (this.divided) {
            this.nw!.query(x, y, foundValues);
            this.ne!.query(x, y, foundValues);
            this.sw!.query(x, y, foundValues);
            this.se!.query(x, y, foundValues);
        }
    }

    private subdivide(): void {
        const { x, y, width, height } = this.boundary;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const nwBoundary = new BBox(x, y, halfWidth, halfHeight);
        const neBoundary = new BBox(x + halfWidth, y, halfWidth, halfHeight);
        const swBoundary = new BBox(x, y + halfHeight, halfWidth, halfHeight);
        const seBoundary = new BBox(x + halfWidth, y + halfHeight, halfWidth, halfHeight);
        this.nw = new QuadtreeNode<V>(nwBoundary, this.capacity);
        this.ne = new QuadtreeNode<V>(neBoundary, this.capacity);
        this.sw = new QuadtreeNode<V>(swBoundary, this.capacity);
        this.se = new QuadtreeNode<V>(seBoundary, this.capacity);
    }
}
