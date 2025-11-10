import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, Property } from 'ag-charts-core';

const { ObserveChanges } = _ModuleSupport;
export class Animation extends AbstractModuleInstance {
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

    @ObserveChanges<Animation>((target, newValue) => {
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
