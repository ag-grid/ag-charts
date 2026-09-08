import { _ModuleSupport } from 'ag-charts-community';
import {
    ChartAxisDirection,
    type DynamicContext,
    type NormalisedSeriesAreaBackgroundRegion,
    jsonDiff,
} from 'ag-charts-core';

import { CartesianBackgroundRegion } from '../background-regions/cartesianBackgroundRegion';

export class SeriesArea extends _ModuleSupport.SeriesArea {
    private instances: _ModuleSupport.BackgroundRegion[] = [];
    private lastRegionOptions: NormalisedSeriesAreaBackgroundRegion[] | undefined;

    private readonly regionGroup = new _ModuleSupport.Group({ name: 'BackgroundRegions-Region' });
    private readonly labelGroup = new _ModuleSupport.Group({ name: 'BackgroundRegions-Label' });

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(ctx);

        this.underlayGroup.appendChild(this.regionGroup);
        this.overlayGroup.appendChild(this.labelGroup);

        this.cleanup.register(() => {
            this.detachInstances();
            this.regionGroup.remove();
            this.labelGroup.remove();
        });
    }

    override applyOptions() {
        // Read from chart state rather than the retained property: `set()` leaves a property untouched
        // when a full update omits it, which would keep stale regions alive.
        this.applyRegionOptions(this.ctx.chartState.getValue('options', 'seriesArea')?.backgroundRegions);
    }

    protected override onUpdate(clipRect: _ModuleSupport.BBox | undefined): void {
        // Labels are deliberately unclipped so outside positions remain visible past the series area edge,
        // matching cross line labels.
        this.regionGroup.setClipRectCanvasSpace(clipRect);

        let index = 0;
        for (const instance of this.instances) {
            instance.update(index);
            index++;
        }
    }

    private applyRegionOptions(options: NormalisedSeriesAreaBackgroundRegion[] | undefined) {
        if (this.optionsEquivalent(options)) return;

        this.lastRegionOptions = options;
        this.detachInstances();

        this.instances =
            options?.map((regionOptions) => {
                const instance = new CartesianBackgroundRegion(this.ctx.logger);
                instance.setOptions(regionOptions);
                this.attachInstance(instance);
                this.initInstance(instance, regionOptions);
                return instance;
            }) ?? [];
    }

    private attachInstance(region: _ModuleSupport.BackgroundRegion): void {
        this.regionGroup.appendChild(region.regionGroup);
        this.labelGroup.appendChild(region.labelGroup);
    }

    private detachInstances(): void {
        for (const region of this.instances) {
            region.regionGroup.remove();
            region.labelGroup.remove();
        }
        this.instances = [];
    }

    private initInstance(region: _ModuleSupport.BackgroundRegion, opts: NormalisedSeriesAreaBackgroundRegion): void {
        region.xAxis = this.resolveAxis(ChartAxisDirection.X, opts.xRange?.axis, 'xRange');
        region.yAxis = this.resolveAxis(ChartAxisDirection.Y, opts.yRange?.axis, 'yRange');
    }

    private resolveAxis(direction: ChartAxisDirection, axisKey: string | undefined, optionsKey: string) {
        const axisID = axisKey == null ? undefined : this.ctx.axisManager.getRemappedAxisId(axisKey);

        if (axisKey != null && axisID == null) {
            this.ctx.logger.warnOnce(
                `No axis found matching \`seriesArea.backgroundRegions[].${optionsKey}.axis\` of \`${axisKey}\`, using the primary axis.`
            );
        }

        return axisID == null
            ? this.ctx.axisManager.getAxisContext(direction).at(0)
            : this.ctx.axisManager.getAxisIdContext(axisID);
    }

    private optionsEquivalent(options: NormalisedSeriesAreaBackgroundRegion[] | undefined): boolean {
        const previous = this.lastRegionOptions;
        if (options === previous) return true;
        if (options == null || previous == null) return false;
        return jsonDiff(previous, options) == null;
    }
}
