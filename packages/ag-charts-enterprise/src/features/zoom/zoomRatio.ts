import { _ModuleSupport, _Util } from 'ag-charts-community';

import { UNIT } from './zoomUtils';

const { ActionOnSet } = _ModuleSupport;

export class ZoomRatio {
    @ActionOnSet<ZoomRatio>({
        changeValue(start?: number) {
            this.onChange?.({ min: start ?? UNIT.min, max: this.end ?? UNIT.max });
        },
    })
    public start?: number;

    @ActionOnSet<ZoomRatio>({
        changeValue(end?: number) {
            this.onChange?.({ min: this.start ?? UNIT.min, max: end ?? UNIT.max });
        },
    })
    public end?: number;

    constructor(private readonly onChange: (ratio: { min: number; max: number }) => void) {}
}
