import type { BoxBounds } from './boxBounds';

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
    private cellSize = 1;
    private cols = 0;
    private rows = 0;
    private originX = 0;
    private originY = 0;
    private cellCount = 0;
    private readonly cells: R[][] = [];

    reset(bounds: BoxBounds, cellSize: number) {
        this.cellSize = Math.max(cellSize, 1);
        this.originX = bounds.x;
        this.originY = bounds.y;
        this.cols = Math.max(1, Math.ceil(bounds.width / this.cellSize));
        this.rows = Math.max(1, Math.ceil(bounds.height / this.cellSize));

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
        return Math.min(this.cols - 1, Math.max(0, Math.floor((x - this.originX) / this.cellSize)));
    }

    private clampRow(y: number): number {
        return Math.min(this.rows - 1, Math.max(0, Math.floor((y - this.originY) / this.cellSize)));
    }
}
