import { _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, NUMBER, ActionOnSet, Validate } = _ModuleSupport;

export class Animation extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<Animation>({
        newValue(value: boolean) {
            if (this.animationManager) {
                this.animationManager.skip(!value);
            }
        },
    })
    @Validate(BOOLEAN)
    public enabled = true;

    @ActionOnSet<Animation>({
        newValue(value: number) {
            if (this.animationManager) {
                this.animationManager.defaultDuration = value;
                this.animationManager.skip(value === 0);
            }
        },
    })
    @Validate(NUMBER(0))
    public duration?: number;

    animationManager: _ModuleSupport.AnimationManager;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        this.animationManager = ctx.animationManager;
        this.animationManager.skip(false);
    }
}
