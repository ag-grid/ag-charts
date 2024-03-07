import { BBox } from '../bbox';
import { NearestResult, nearestSquared } from '../nearest';
import type { Point } from '../point';

type QuadtreeNearest<V> = NearestResult<QuadtreeElem<V>>;

export type QuadtreeHitTester = {
    getCachedBBox(): BBox;
    distanceSquared(point: Point): number;
    containsPoint(x: number, y: number): boolean;
};

class QuadtreeElem<V> {
    constructor(
        public hitTester: QuadtreeHitTester,
        public value: V
    ) {}

    distanceSquared(point: Point) {
        return this.hitTester.distanceSquared(point);
    }
}

function pickNearest<V>(best: QuadtreeNearest<V>, other: QuadtreeNearest<V>): QuadtreeNearest<V> {
    if (other.nearest === undefined || best.distanceSquared < other.distanceSquared) {
        return best;
    } else {
        return other;
    }
}

export class Quadtree<V> {
    private readonly root: QuadtreeNode<V>;

    constructor(capacity: number, maxdepth: number, boundary?: BBox) {
        this.root = new QuadtreeNode<V>(capacity, maxdepth, boundary);
    }

    clear(boundary: BBox) {
        this.root.clear(boundary);
    }

    addValue(hitTester: QuadtreeHitTester, value: V): void {
        this.root.addElem(new QuadtreeElem(hitTester, value));
    }

    findExact(x: number, y: number): Iterable<QuadtreeElem<V>> {
        const foundValues: QuadtreeElem<V>[] = [];
        this.root.findExact(x, y, foundValues);
        return foundValues;
    }

    findNearest(x: number, y: number): QuadtreeNearest<V> {
        const best = { nearest: undefined, distanceSquared: Infinity };
        return this.root.findNearest({ x, y }, best);
    }
}

class QuadtreeSubdivisions<V> {
    constructor(
        private readonly nw: QuadtreeNode<V>,
        private readonly ne: QuadtreeNode<V>,
        private readonly sw: QuadtreeNode<V>,
        private readonly se: QuadtreeNode<V>
    ) {}

    addElem(elem: QuadtreeElem<V>) {
        this.nw.addElem(elem);
        this.ne.addElem(elem);
        this.sw.addElem(elem);
        this.se.addElem(elem);
    }

    findExact(x: number, y: number, foundElems: QuadtreeElem<V>[]): void {
        this.nw.findExact(x, y, foundElems);
        this.ne.findExact(x, y, foundElems);
        this.sw.findExact(x, y, foundElems);
        this.se.findExact(x, y, foundElems);
    }

    findNearest(target: Point, best: QuadtreeNearest<V>): QuadtreeNearest<V> {
        best = pickNearest(best, this.nw.findNearest(target, best));
        best = pickNearest(best, this.ne.findNearest(target, best));
        best = pickNearest(best, this.sw.findNearest(target, best));
        best = pickNearest(best, this.se.findNearest(target, best));
        return best;
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
        if (!this.boundary.collidesBBox(e.hitTester.getCachedBBox())) {
            return;
        }

        if (this.subdivisions === undefined) {
            if (this.maxdepth === 0 || this.elems.length < this.capacity) {
                this.elems.push(e);
            } else {
                this.subdivide(e);
            }
        } else {
            this.subdivisions.addElem(e);
        }
    }

    findExact(x: number, y: number, foundElems: QuadtreeElem<V>[]): void {
        if (!this.boundary.containsPoint(x, y)) {
            return;
        }

        if (this.subdivisions === undefined) {
            for (const elem of this.elems) {
                if (elem.hitTester.containsPoint(x, y)) {
                    foundElems.push(elem);
                }
            }
        } else {
            this.subdivisions.findExact(x, y, foundElems);
        }
    }

    findNearest(target: Point, best: QuadtreeNearest<V>): QuadtreeNearest<V> {
        if (best.distanceSquared === 0 || this.boundary.distanceSquared(target) > best.distanceSquared) {
            return best;
        }

        if (this.subdivisions === undefined) {
            return pickNearest(best, nearestSquared(target, this.elems, best.distanceSquared));
        } else {
            return this.subdivisions.findNearest(target, best);
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
