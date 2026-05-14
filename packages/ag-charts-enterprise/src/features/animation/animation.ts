import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, type DynamicContext } from 'ag-charts-core';

export class Animation extends AbstractModuleInstance {
    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();
        ctx.animationManager.skip(false);
        this.cleanup.register(
            () => ctx.animationManager.skip(true),
            ctx.chartState.observe((get) => {
                ctx.animationManager.skip(get('options', 'animation.enabled') === false);
            }),
            ctx.chartState.observe((get) => {
                const duration = get('options', 'animation.duration');
                if (duration != null) {
                    ctx.animationManager.defaultDuration = duration;
                }
            }),
            ctx.chartState.observe((get) => {
                ctx.animationManager.maxAnimatableItems = get('options', 'animation.maxAnimatableItems') ?? Infinity;
            })
        );
    }
}
