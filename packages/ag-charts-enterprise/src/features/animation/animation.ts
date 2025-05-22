import { _ModuleSupport } from 'ag-charts-community';

const { ObserveChanges, Property } = _ModuleSupport;

export class Animation extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ObserveChanges<Animation>((target, newValue) => {
        target.ctx.animationManager.skip(!newValue);
    })
    @Property
    public enabled: boolean = true;

    @ObserveChanges<Animation>((target, newValue) => {
        target.ctx.animationManager.defaultDuration = newValue;
    })
    @Property
    public duration?: number;

    constructor(protected readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        ctx.animationManager.skip(false);

        this.cleanup.register(() => {
            ctx.animationManager.skip(true);
        });
    }
}
