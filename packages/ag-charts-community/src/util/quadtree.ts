import { BBox } from '../scene/bbox';

type QuadtreeElem<V> = { bbox: BBox; value: V };

export class Quadtree<V> {
    private readonly root: QuadtreeNode<V>;

    constructor(capacity: number, maxdepth: number, boundary?: BBox) {
        this.root = new QuadtreeNode<V>(capacity, maxdepth, boundary);
    }

    clear(boundary: BBox) {
        this.root.clear(boundary);
    }

    addValue(bbox: BBox, value: V): void {
        this.root.addElem({ bbox, value });
    }

    pickValues(x: number, y: number): Iterable<QuadtreeElem<V>> {
        const foundValues: QuadtreeElem<V>[] = [];
        this.root.query(x, y, foundValues);
        return foundValues;
    }
}

class QuadtreeSubdivisions<V> {
    constructor(
        private nw: QuadtreeNode<V>,
        private ne: QuadtreeNode<V>,
        private sw: QuadtreeNode<V>,
        private se: QuadtreeNode<V>
    ) {}

    addElem(elem: QuadtreeElem<V>) {
        this.nw.addElem(elem);
        this.ne.addElem(elem);
        this.sw.addElem(elem);
        this.se.addElem(elem);
    }

    query(x: number, y: number, foundElems: QuadtreeElem<V>[]): void {
        this.nw.query(x, y, foundElems);
        this.ne.query(x, y, foundElems);
        this.sw.query(x, y, foundElems);
        this.se.query(x, y, foundElems);
    }
}

class QuadtreeNode<V> {
    private boundary: BBox;
    private readonly elems: Array<QuadtreeElem<V>>;

    private subdivisions?: QuadtreeSubdivisions<V>;

    constructor(
        private readonly capacity: number,
        private readonly maxdepth: number,
        boundary?: BBox
    ) {
        this.boundary = boundary ?? BBox.NaN;
        this.elems = [];
        this.subdivisions = undefined;
    }

    clear(boundary: BBox) {
        this.elems.length = 0;
        this.boundary = boundary;
        this.subdivisions = undefined;
    }

    addElem(e: QuadtreeElem<V>) {
        if (!this.boundary.collidesBBox(e.bbox)) {
            return;
        }

        if (this.subdivisions !== undefined) {
            this.subdivisions.addElem(e);
        } else {
            if (this.maxdepth === 0 || this.elems.length < this.capacity) {
                this.elems.push(e);
            } else {
                this.subdivide(e);
            }
        }
    }

    query(x: number, y: number, foundElems: QuadtreeElem<V>[]): void {
        if (!this.boundary.containsPoint(x, y)) {
            return;
        }

        if (this.subdivisions !== undefined) {
            this.subdivisions.query(x, y, foundElems);
        } else {
            for (const { bbox, value } of this.elems) {
                if (bbox.containsPoint(x, y)) {
                    foundElems.push({ bbox, value });
                }
            }
        }
    }

    private subdivide(newElem: QuadtreeElem<V>): void {
        this.subdivisions = this.makeSubdivisions();

        for (const e of this.elems) {
            this.subdivisions.addElem(e);
        }
        this.subdivisions.addElem(newElem);
        this.elems.length = 0;
    }

    private makeSubdivisions(): QuadtreeSubdivisions<V> {
        const { x, y, width, height } = this.boundary;
        const { capacity } = this;
        const depth = this.maxdepth - 1;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const nwBoundary = new BBox(x, y, halfWidth, halfHeight);
        const neBoundary = new BBox(x + halfWidth, y, halfWidth, halfHeight);
        const swBoundary = new BBox(x, y + halfHeight, halfWidth, halfHeight);
        const seBoundary = new BBox(x + halfWidth, y + halfHeight, halfWidth, halfHeight);

        return new QuadtreeSubdivisions(
            new QuadtreeNode<V>(capacity, depth, nwBoundary),
            new QuadtreeNode<V>(capacity, depth, neBoundary),
            new QuadtreeNode<V>(capacity, depth, swBoundary),
            new QuadtreeNode<V>(capacity, depth, seBoundary)
        );
    }
}
