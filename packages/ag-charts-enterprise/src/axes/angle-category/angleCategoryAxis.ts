import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import { AngleAxis } from '../angle/angleAxis';

const { NUMBER, Validate } = _ModuleSupport;
const { BandScale } = _Scale;

export class AngleCategoryAxis extends AngleAxis {
    static className = 'AngleCategoryAxis';
    static type = 'angle-category' as const;

    @Validate(NUMBER(0, 1))
    groupPaddingInner: number = 0;

    @Validate(NUMBER(0, 1))
    paddingInner: number = 0;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new BandScale());
    }
}
