import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, ObserveChanges, Property } from 'ag-charts-core';

export class Animation extends AbstractModuleInstance {
    @ObserveChanges<Animation>((target: Animation, newValue?: boolean) => {
        target.ctx.animationManager.skip(!newValue);
    })
    @Property
    public enabled: boolean = true;

    @ObserveChanges<Animation>((target: Animation, newValue?: number) => {
        if (newValue != null) {
            target.ctx.animationManager.defaultDuration = newValue;
        }
    })
    @Property
    public duration?: number;

    @ObserveChanges<Animation>((target: Animation, newValue?: number) => {
        target.ctx.animationManager.maxAnimatableItems = newValue ?? Infinity;
    })
    @Property
    public maxAnimatableItems?: number;

    constructor(protected readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        ctx.animationManager.skip(false);
        this.cleanup.register(() => ctx.animationManager.skip(true));
    }
}
