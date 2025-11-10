import { BaseProperties } from 'ag-charts-core';

export class ChangeDetectableProperties extends BaseProperties {
    protected _dirty: boolean = true;

    protected markDirty() {
        this._dirty = true;
    }

    markClean(_opts?: { force?: boolean; recursive?: boolean }) {
        this._dirty = false;
    }

    isDirty(): boolean {
        return this._dirty;
    }

    onChangeDetection(_property: string): void {
        this.markDirty();
    }
}
