import {
    AbstractModuleInstance,
    type AxisPluginModuleInstance,
    type DynamicContext,
    type NormalisedAxisCrossLineOptions,
} from 'ag-charts-core';

import type { AxisContext } from '../../module/axisContext';
import type { ChartAxisRegistry } from '../../module/moduleContext';
import type { CrossLine } from './crossLine';

/**
 * Axis plugin that owns a per-axis runtime list of {@link CrossLine} instances.
 *
 * Each `applyOptions` call reconciles the existing instances against the supplied
 * options array: previously-attached cross-lines are detached, then a fresh
 * instance is created via {@link AxisContext.crossLineHooks}.createCrossLine,
 * configured with the user options, attached to the axis-owned scene groups,
 * and initialised. Per invariant I1 the options array is read-only — the plugin
 * stores its own runtime state on the per-instance `CrossLine`s, never on the
 * incoming options.
 */
export class CrossLinesPlugin extends AbstractModuleInstance implements AxisPluginModuleInstance {
    static readonly className = 'CrossLines';

    private readonly axisCtx: AxisContext;
    private instances: CrossLine[] = [];

    constructor(ctx: DynamicContext<ChartAxisRegistry<AxisContext>>) {
        super();
        this.axisCtx = ctx.parent;
    }

    applyOptions(options: NormalisedAxisCrossLineOptions[] | undefined): void {
        const hooks = this.axisCtx.crossLineHooks;
        if (hooks == null) {
            return;
        }

        for (const crossLine of this.instances) {
            hooks.detachCrossLine(crossLine);
        }

        if (options == null) {
            this.instances = [];
            return;
        }

        this.instances = options.map((crossLineOptions) => {
            const instance = hooks.createCrossLine();
            instance.set(crossLineOptions);
            hooks.attachCrossLine(instance);
            hooks.initCrossLine(instance);
            return instance;
        });
    }

    getInstances(): readonly CrossLine[] {
        return this.instances;
    }

    override destroy(): void {
        const hooks = this.axisCtx.crossLineHooks;
        if (hooks != null) {
            for (const crossLine of this.instances) {
                hooks.detachCrossLine(crossLine);
            }
        }
        this.instances = [];
        super.destroy();
    }
}
