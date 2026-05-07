import type { DataChangeDescription } from './dataChangeDescription';

/**
 * Per-series selection state backed by a `Uint8Array` indexed by datum index.
 *
 * The `Uint8Array` is the sole mutable selection state — there is no secondary
 * structure to keep in sync. Series identity scoping is managed by `DataSet`'s
 * `selections: Map<string, DataSetSelection>`.
 */
export class DataSetSelection {
    private selection: Uint8Array;
    private count = 0;

    constructor(length: number) {
        this.selection = new Uint8Array(length);
    }

    // --- Single datum ---

    select(datumIndex: number): number {
        const delta = 1 - this.selection[datumIndex];
        this.count += delta;
        this.selection[datumIndex] = 1;
        return delta;
    }

    deselect(datumIndex: number): number {
        const delta = -this.selection[datumIndex];
        this.count += delta;
        this.selection[datumIndex] = 0;
        return delta;
    }

    toggle(datumIndex: number): number {
        // quickly and branchlessly compute +1 or -1
        const delta = 1 - 2 * this.selection[datumIndex];
        this.count += delta;
        this.selection[datumIndex] ^= 1;
        return delta;
    }

    isSelected(datumIndex: number): boolean {
        return this.selection[datumIndex] === 1;
    }

    isNotSelected(): boolean {
        return this.count === 0;
    }

    isAllSelected(): boolean {
        return this.count === this.selection.length;
    }

    // --- Range ---

    selectRange(startIndex: number, endIndex: number): number {
        if (startIndex > endIndex) return 0;

        let delta: number;
        if (this.isAllSelected()) {
            delta = 0;
        } else if (this.isNotSelected()) {
            delta = endIndex - startIndex;
        } else {
            delta = endIndex - startIndex - this.countRange(startIndex, endIndex);
        }

        this.count += delta;
        this.selection.fill(1, startIndex, endIndex);
        return delta;
    }

    deselectRange(startIndex: number, endIndex: number): number {
        if (startIndex > endIndex) return 0;

        let delta: number;
        if (this.isNotSelected()) {
            delta = 0;
        } else if (this.isAllSelected()) {
            delta = -(endIndex - startIndex);
        } else {
            delta = -this.countRange(startIndex, endIndex);
        }

        this.count += delta;
        this.selection.fill(0, startIndex, endIndex);
        return delta;
    }

    // countRange loops through the whole buffer, but can be avoid in some cases (e.g. all deselected or all selected)
    private countRange(startIndex: number, endIndex: number): number {
        let count = 0;
        for (let i = startIndex; i < endIndex; i++) {
            count += this.selection[i];
        }
        return count;
    }

    // --- Bulk ---

    clear(): void {
        this.count = 0;
        this.selection.fill(0);
    }

    // --- Data lifecycle ---

    applyDataChange(desc: DataChangeDescription): void {
        this.selection = desc.applyToTypedArray(this.selection);
    }

    // --- Query ---

    getLength(): number {
        return this.selection.length;
    }

    /** Direct access for the render loop. */
    getSelection(): Uint8Array {
        return this.selection;
    }
}
