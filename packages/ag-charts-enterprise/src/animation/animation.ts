import { _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, ActionOnSet, Validate } = _ModuleSupport;

export class Animation extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<Animation>({
        newValue(value: boolean) {
            if (!this.animationManager) return;
            this.animationManager.skipAnimations = !value;
        },
    })
    @Validate(BOOLEAN)
    public enabled = true;

    animationManager: _ModuleSupport.AnimationManager;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        this.animationManager = ctx.animationManager;
        this.animationManager.skipAnimations = false;
    }
}
