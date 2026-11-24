import { type BoxBounds, isFiniteBox } from './boxBounds';

/** Return `true` to stop the query early (a match was found). */
export type SpatialIndexVisitor<R> = (ref: R) => boolean | void;

/**
 * Uniform-grid spatial index over a known bounds. Built once per layout pass and reused across
 * passes (backing cell arrays are cleared, not reallocated). Stores opaque refs keyed by their
 * bounding box; the precise overlap test is left to the query visitor.
 *
 * A ref may be stored in several cells when its box spans them, so a visitor can be invoked more
 * than once for the same ref — callers must keep the precise test idempotent (any-collision is).
 */
export class SpatialIndex<R> {
    private invCellSize = 1;
    private cols = 0;
    private rows = 0;
    private originX = 0;
    private originY = 0;
    private cellCount = 0;
    private readonly cells: R[][] = [];

    reset(bounds: BoxBounds, cellSize: number) {
        // Written so NaN falls back to 1: a NaN cell count would leave this shared index unallocated for later charts.
        let clampedCellSize = cellSize >= 1 ? cellSize : 1;
        // Cap total cells so a degenerate cell size can't build a per-pixel grid over large bounds. Cell size
        // affects query cost only, not correctness, so growing it here is safe.
        const MAX_CELLS = 1 << 14;
        const area = Math.max(0, bounds.width) * Math.max(0, bounds.height);
        if (area > MAX_CELLS * clampedCellSize * clampedCellSize) {
            clampedCellSize = Math.sqrt(area / MAX_CELLS);
        }
        this.invCellSize = 1 / clampedCellSize;
        this.cols = gridCellsAcross(bounds.x, bounds.width, clampedCellSize);
        this.rows = gridCellsAcross(bounds.y, bounds.height, clampedCellSize);
        // A single-cell axis ignores its origin, so a non-finite one can't turn every lookup into NaN.
        this.originX = this.cols > 1 ? bounds.x : 0;
        this.originY = this.rows > 1 ? bounds.y : 0;

        const count = this.cols * this.rows;
        const clearTo = Math.max(this.cellCount, count);
        for (let i = 0; i < clearTo; i++) {
            if (this.cells[i] == null) {
                this.cells[i] = [];
            } else {
                this.cells[i].length = 0;
            }
        }
        this.cellCount = count;
    }

    /** Empties every cell, so a shared index holds no refs between passes. */
    clear() {
        for (let i = 0; i < this.cellCount; i++) {
            this.cells[i].length = 0;
        }
    }

    insert(box: BoxBounds, ref: R) {
        const { cols, cells } = this;
        const minCx = this.clampCol(box.x);
        const maxCx = this.clampCol(box.x + box.width);
        const minCy = this.clampRow(box.y);
        const maxCy = this.clampRow(box.y + box.height);
        for (let cy = minCy; cy <= maxCy; cy++) {
            const rowOffset = cy * cols;
            for (let cx = minCx; cx <= maxCx; cx++) {
                cells[rowOffset + cx].push(ref);
            }
        }
    }

    /** Removes the last occurrence of `ref` from each cell `box` spans, keeping the other refs in order; `box` must be the one it was inserted with. */
    remove(box: BoxBounds, ref: R) {
        const { cols, cells } = this;
        const minCx = this.clampCol(box.x);
        const maxCx = this.clampCol(box.x + box.width);
        const minCy = this.clampRow(box.y);
        const maxCy = this.clampRow(box.y + box.height);
        for (let cy = minCy; cy <= maxCy; cy++) {
            const rowOffset = cy * cols;
            for (let cx = minCx; cx <= maxCx; cx++) {
                const cell = cells[rowOffset + cx];
                // Searched from the end: a ref removed soon after it was inserted sits near it.
                const at = cell.lastIndexOf(ref);
                if (at < 0) continue;
                // Shifted by hand: `splice` allocates the array of removed refs.
                for (let i = at + 1, ln = cell.length; i < ln; i++) {
                    cell[i - 1] = cell[i];
                }
                cell.length -= 1;
            }
        }
    }

    query(box: BoxBounds, visitor: SpatialIndexVisitor<R>): boolean {
        const { cols, cells } = this;
        const minCx = this.clampCol(box.x);
        const maxCx = this.clampCol(box.x + box.width);
        const minCy = this.clampRow(box.y);
        const maxCy = this.clampRow(box.y + box.height);
        for (let cy = minCy; cy <= maxCy; cy++) {
            const rowOffset = cy * cols;
            for (let cx = minCx; cx <= maxCx; cx++) {
                const cell = cells[rowOffset + cx];
                for (let i = 0, ln = cell.length; i < ln; i++) {
                    if (visitor(cell[i]) === true) return true;
                }
            }
        }
        return false;
    }

    private clampCol(x: number): number {
        return Math.min(this.cols - 1, Math.max(0, Math.floor((x - this.originX) * this.invCellSize)));
    }

    private clampRow(y: number): number {
        return Math.min(this.rows - 1, Math.max(0, Math.floor((y - this.originY) * this.invCellSize)));
    }
}

/** Grid cells along one axis; non-finite bounds collapse to one cell so the shared index stays usable. */
export function gridCellsAcross(origin: number, extent: number, cellSize: number): number {
    const cells = Math.ceil(extent / cellSize);
    return Number.isFinite(origin) && cells > 1 && cells < Infinity ? cells : 1;
}

/**
 * Heuristic {@link SpatialIndex} cell size: the mean extent (`extentSum / extentCount`), floored at
 * 1. Cell size only affects query performance, not correctness, so sizing cells to the typical box
 * keeps queries near O(1).
 */
export function gridCellSize(extentSum: number, extentCount: number): number {
    const mean = extentCount > 0 ? extentSum / extentCount : 1;
    return mean >= 1 ? mean : 1;
}

/** Scratch index reused across all `anyOverlap` calls (cleared, not reallocated). */
const overlapIndex = new SpatialIndex<unknown>();

/**
 * Index-backed any-collision test: does any `queryBox` overlap any `obstacle`? Obstacle AABBs prune
 * the candidate set via a shared spatial index, and the caller's `exact` predicate runs only on the
 * survivors. Geometry-agnostic — the caller supplies the precise test (e.g. `boxOverlapsSector` for
 * pie wedges) so this one primitive serves every label source.
 */
export function anyOverlap<R>(
    queryBoxes: readonly BoxBounds[],
    obstacles: readonly { box: BoxBounds; ref: R }[],
    exact: (queryBox: BoxBounds, ref: R) => boolean
): boolean {
    if (queryBoxes.length === 0 || obstacles.length === 0) {
        return false;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let extentSum = 0;
    let extentCount = 0;
    const extend = (b: BoxBounds) => {
        if (!isFiniteBox(b)) return;
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
        extentSum += b.width + b.height;
        extentCount += 2;
    };
    for (const box of queryBoxes) {
        extend(box);
    }
    for (const obstacle of obstacles) {
        extend(obstacle.box);
    }

    const bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    const index = overlapIndex as SpatialIndex<R>;
    index.reset(bounds, gridCellSize(extentSum, extentCount));
    for (const obstacle of obstacles) {
        if (isFiniteBox(obstacle.box)) index.insert(obstacle.box, obstacle.ref);
    }

    let queryBox: BoxBounds | null = null;
    const visit: SpatialIndexVisitor<R> = (ref) => queryBox != null && exact(queryBox, ref);
    for (const box of queryBoxes) {
        if (!isFiniteBox(box)) continue;
        queryBox = box;
        if (index.query(box, visit)) {
            return true;
        }
    }
    return false;
}
