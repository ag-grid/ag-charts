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

    constructor(length: number) {
        this.selection = new Uint8Array(length);
    }

    // --- Single datum ---

    select(datumIndex: number): void {
        this.selection[datumIndex] = 1;
    }

    deselect(datumIndex: number): void {
        this.selection[datumIndex] = 0;
    }

    toggle(datumIndex: number): void {
        this.selection[datumIndex] ^= 1;
    }

    isSelected(datumIndex: number): boolean {
        return this.selection[datumIndex] === 1;
    }

    // --- Range ---

    selectRange(startIndex: number, endIndex: number): void {
        this.selection.fill(1, startIndex, endIndex);
    }

    deselectRange(startIndex: number, endIndex: number): void {
        this.selection.fill(0, startIndex, endIndex);
    }

    // --- Bulk ---

    clear(): void {
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

    getSelectedCount(): number {
        let count = 0;
        for (let i = 0; i < this.selection.length; i++) {
            count += this.selection[i];
        }
        return count;
    }

    getSelectedIndices(): number[] {
        const indices: number[] = [];
        for (let i = 0; i < this.selection.length; i++) {
            if (this.selection[i] === 1) {
                indices.push(i);
            }
        }
        return indices;
    }
}
