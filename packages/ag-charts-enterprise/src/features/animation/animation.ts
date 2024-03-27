import { _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, POSITIVE_NUMBER, ObserveChanges, Validate } = _ModuleSupport;

export class Animation extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ObserveChanges<Animation>((target, newValue) => {
        target.ctx.animationManager.skip(!newValue);
    })
    @Validate(BOOLEAN)
    public enabled: boolean = true;

    @ObserveChanges<Animation>((target, newValue) => {
        target.ctx.animationManager.defaultDuration = newValue;
    })
    @Validate(POSITIVE_NUMBER, { optional: true })
    public duration?: number;

    constructor(protected readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        ctx.animationManager.skip(false);
    }
}
