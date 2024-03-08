import { BBox } from '../bbox';
import { NearestResult, nearestSquared } from '../nearest';

type QuadtreeNearest<V> = NearestResult<QuadtreeElem<V>>;

export type QuadtreeHitTester = {
    getCachedBBox(): BBox;
    distanceSquared(x: number, y: number): number;
    containsPoint(x: number, y: number): boolean;
};

class QuadtreeElem<V> {
    constructor(
        public hitTester: QuadtreeHitTester,
        public value: V
    ) {}

    distanceSquared(x: number, y: number) {
        return this.hitTester.distanceSquared(x, y);
    }
}

export class Quadtree<V> {
    private readonly exact: QuadtreeNode_Exact<V>;
    private readonly nearest: QuadtreeNode_Nearest<V>;

    constructor(capacity: number, maxdepth: number, boundary?: BBox) {
        this.exact = new QuadtreeNode_Exact<V>(capacity, maxdepth, boundary);
        this.nearest = new QuadtreeNode_Nearest<V>(capacity, maxdepth, boundary);
    }

    clear(boundary: BBox) {
        this.exact.clear(boundary);
        this.nearest.clear(boundary);
    }

    addValue(hitTester: QuadtreeHitTester, value: V): void {
        const elem = new QuadtreeElem(hitTester, value);
        this.exact.addElem(elem);
        this.nearest.addElem(elem);
    }

    findExact(x: number, y: number): Iterable<QuadtreeElem<V>> {
        const foundValues: QuadtreeElem<V>[] = [];
        this.exact.find(x, y, foundValues);
        return foundValues;
    }

    findNearest(x: number, y: number): QuadtreeNearest<V> {
        const arg = { best: { nearest: undefined, distanceSquared: Infinity } };
        this.nearest.find(x, y, arg);
        return arg.best;
    }
}

class QuadtreeSubdivisions<V, FindArg> {
    constructor(
        private readonly nw: QuadtreeNode<V, FindArg>,
        private readonly ne: QuadtreeNode<V, FindArg>,
        private readonly sw: QuadtreeNode<V, FindArg>,
        private readonly se: QuadtreeNode<V, FindArg>
    ) {}

    addElem(elem: QuadtreeElem<V>) {
        this.nw.addElem(elem);
        this.ne.addElem(elem);
        this.sw.addElem(elem);
        this.se.addElem(elem);
    }

    find(x: number, y: number, arg: FindArg): void {
        this.nw.find(x, y, arg);
        this.ne.find(x, y, arg);
        this.sw.find(x, y, arg);
        this.se.find(x, y, arg);
    }
}

abstract class QuadtreeNode<V, FindArg> {
    protected boundary: BBox;
    protected readonly elems: Array<QuadtreeElem<V>>;

    private subdivisions?: QuadtreeSubdivisions<V, FindArg>;

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
        if (this.addCondition(e)) {
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
    }

    protected abstract addCondition(e: QuadtreeElem<V>): boolean;

    find(x: number, y: number, arg: FindArg): void {
        if (this.findCondition(x, y, arg)) {
            if (this.subdivisions === undefined) {
                this.findAction(x, y, arg);
            } else {
                this.subdivisions.find(x, y, arg);
            }
        }
    }

    protected abstract findCondition(x: number, y: number, arg: FindArg): boolean;
    protected abstract findAction(x: number, y: number, arg: FindArg): void;

    private subdivide(newElem: QuadtreeElem<V>): void {
        this.subdivisions = this.makeSubdivisions();

        for (const e of this.elems) {
            this.subdivisions.addElem(e);
        }
        this.subdivisions.addElem(newElem);
        this.elems.length = 0;
    }

    private makeSubdivisions(): QuadtreeSubdivisions<V, FindArg> {
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
            this.child(capacity, depth, nwBoundary),
            this.child(capacity, depth, neBoundary),
            this.child(capacity, depth, swBoundary),
            this.child(capacity, depth, seBoundary)
        );
    }

    protected abstract child(capacity: number, depth: number, childBoundary: BBox): QuadtreeNode<V, FindArg>;
}

class QuadtreeNode_Exact<V> extends QuadtreeNode<V, QuadtreeElem<V>[]> {
    override addCondition(e: QuadtreeElem<V>): boolean {
        return this.boundary.collidesBBox(e.hitTester.getCachedBBox());
    }
    override findCondition(x: number, y: number, _foundElems: QuadtreeElem<V>[]): boolean {
        return this.boundary.containsPoint(x, y);
    }
    override findAction(x: number, y: number, foundElems: QuadtreeElem<V>[]): void {
        for (const elem of this.elems) {
            if (elem.hitTester.containsPoint(x, y)) {
                foundElems.push(elem);
            }
        }
    }
    override child(capacity: number, depth: number, boundary: BBox) {
        return new QuadtreeNode_Exact<V>(capacity, depth, boundary);
    }
}

class QuadtreeNode_Nearest<V> extends QuadtreeNode<V, { best: QuadtreeNearest<V> }> {
    override addCondition(e: QuadtreeElem<V>): boolean {
        const bbox = e.hitTester.getCachedBBox();
        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2;
        return this.boundary.containsPoint(x, y);
    }
    override findCondition(x: number, y: number, arg: { best: QuadtreeNearest<V> }): boolean {
        const { best } = arg;
        return best.distanceSquared !== 0 && this.boundary.distanceSquared(x, y) < best.distanceSquared;
    }
    override findAction(x: number, y: number, arg: { best: QuadtreeNearest<V> }): void {
        const other = nearestSquared(x, y, this.elems, arg.best.distanceSquared);
        if (other.nearest !== undefined && other.distanceSquared < arg.best.distanceSquared) {
            arg.best = other;
        }
    }
    override child(capacity: number, depth: number, boundary: BBox) {
        return new QuadtreeNode_Nearest<V>(capacity, depth, boundary);
    }
}
