import { BaseProperties } from '../../util/properties';
import { RedrawType } from '../changeDetectable';

export class ChangeDetectableProperties extends BaseProperties {
    protected _dirty: RedrawType = RedrawType.MAJOR;

    protected markDirty(_source: any, type = RedrawType.TRIVIAL) {
        if (this._dirty < type) {
            this._dirty = type;
        }
    }

    markClean(_opts?: { force?: boolean; recursive?: boolean }) {
        this._dirty = RedrawType.NONE;
    }

    isDirty(): boolean {
        return this._dirty > RedrawType.NONE;
    }
}
