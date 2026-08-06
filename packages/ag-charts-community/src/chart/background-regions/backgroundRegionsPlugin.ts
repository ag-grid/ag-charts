import {
    AbstractModuleInstance,
    ChartAxisDirection,
    type DynamicContext,
    type SeriesAreaPluginModuleInstance,
    jsonDiff,
} from 'ag-charts-core';

import type { ChartSeriesAreaRegistry } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import type { SeriesAreaContext } from '../series-area/seriesAreaContext';
import type { BackgroundRegion } from './backgroundRegion';

interface NormalisedSeriesAreaBackgroundRegion {}

export class BackgroundRegionsPlugin extends AbstractModuleInstance implements SeriesAreaPluginModuleInstance {
    private instances: BackgroundRegion[] = [];
    private lastOptions: NormalisedSeriesAreaBackgroundRegion[] | undefined;

    private readonly regionGroup = new Group({ name: 'BackgroundRegions-Region' });
    private readonly labelGroup = new Group({ name: 'BackgroundRegions-Label' });

    constructor(private readonly ctx: DynamicContext<ChartSeriesAreaRegistry<SeriesAreaContext>>) {
        super();
        this.ctx = ctx;
        this.ctx.parent.attachSeriesAreaUnderlay(this.regionGroup);
        this.ctx.parent.attachSeriesAreaUnderlay(this.labelGroup);
    }

    applyOptions(options: NormalisedSeriesAreaBackgroundRegion[]) {
        if (this.optionsEquivalent(options)) {
            return;
        }
        this.lastOptions = options;

        for (const region of this.instances) {
            this.detachInstance(region);
        }

        if (options == null) {
            this.instances = [];
            return;
        }

        this.instances = options.map((regionOptions) => {
            const instance = this.ctx.backgroundRegion;
            instance.set(regionOptions);
            this.attachInstance(instance);
            this.initInstance(instance);
            return instance;
        });
    }

    setVisible(visible: boolean): void {
        this.regionGroup.visible = visible;
        this.labelGroup.visible = visible;
    }

    getInstances(): readonly BackgroundRegion[] {
        return this.instances;
    }

    onSeriesAreaUpdate(): void {
        for (const instance of this.instances) {
            // TODO: visible flag
            instance.update(true);
        }
    }

    override destroy(): void {
        for (const region of this.instances) {
            this.detachInstance(region);
        }
        this.instances = [];
        this.regionGroup.remove();
        this.labelGroup.remove();
        super.destroy();
    }

    private attachInstance(region: BackgroundRegion): void {
        this.regionGroup.appendChild(region.regionGroup);
        this.labelGroup.appendChild(region.labelGroup);
    }

    private detachInstance(region: BackgroundRegion): void {
        region.regionGroup.remove();
        region.labelGroup.remove();
    }

    private initInstance(region: BackgroundRegion): void {
        const xAxisContext =
            region.xRange?.axis == null
                ? this.ctx.axisManager.getAxisContext(ChartAxisDirection.X).at(0)
                : this.ctx.axisManager.getAxisIdContext(region.xRange.axis);

        const yAxisContext =
            region.yRange?.axis == null
                ? this.ctx.axisManager.getAxisContext(ChartAxisDirection.Y).at(0)
                : this.ctx.axisManager.getAxisIdContext(region.yRange.axis);

        region.xScale = xAxisContext?.scale;
        region.yScale = yAxisContext?.scale;
    }

    private optionsEquivalent(options: NormalisedSeriesAreaBackgroundRegion[] | undefined): boolean {
        const previous = this.lastOptions;
        if (options === previous) return true;
        if (options == null || previous == null) return false;
        return jsonDiff(previous, options) == null;
    }
}
