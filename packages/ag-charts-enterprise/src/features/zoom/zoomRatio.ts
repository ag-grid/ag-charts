import { _ModuleSupport, _Util } from 'ag-charts-community';

import { UNIT } from './zoomUtils';

const { ActionOnSet } = _ModuleSupport;

export class ZoomRatio {
    @ActionOnSet<ZoomRatio>({
        changeValue(min?: number) {
            this.onChange?.({ min: min ?? UNIT.min, max: this.max ?? UNIT.max });
        },
    })
    public min?: number;

    @ActionOnSet<ZoomRatio>({
        changeValue(max?: number) {
            this.onChange?.({ min: this.min ?? UNIT.min, max: max ?? UNIT.max });
        },
    })
    public max?: number;

    constructor(private readonly onChange: (ratio: { min: number; max: number }) => void) {}
}
