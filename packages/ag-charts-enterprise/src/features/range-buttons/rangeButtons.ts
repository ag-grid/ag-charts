import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { BOOLEAN, ActionOnSet, Validate } = _ModuleSupport;

export class RangeButtons extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<RangeButtons>({
        changeValue(enabled) {
            this.ctx.toolbarManager.toggleVisibility('range-buttons', enabled);
        },
    })
    @Validate(BOOLEAN)
    public enabled: boolean = false;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
    }
}
