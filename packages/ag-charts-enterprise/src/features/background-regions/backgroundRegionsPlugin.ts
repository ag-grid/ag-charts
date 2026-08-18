import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ChartAxisDirection,
    type DynamicContext,
    type NormalisedSeriesAreaBackgroundRegion,
    type SeriesAreaPluginModuleInstance,
    jsonDiff,
} from 'ag-charts-core';

export class BackgroundRegionsPlugin extends AbstractModuleInstance implements SeriesAreaPluginModuleInstance {
    private instances: _ModuleSupport.BackgroundRegion[] = [];
    private lastOptions: NormalisedSeriesAreaBackgroundRegion[] | undefined;

    private readonly regionGroup = new _ModuleSupport.Group({ name: 'BackgroundRegions-Region' });
    private readonly labelGroup = new _ModuleSupport.Group({ name: 'BackgroundRegions-Label' });

    constructor(
        private readonly ctx: DynamicContext<_ModuleSupport.ChartSeriesAreaRegistry<_ModuleSupport.SeriesAreaContext>>
    ) {
        super();
        this.ctx = ctx;
        this.ctx.parent.attachSeriesAreaUnderlay(this.regionGroup);
        this.ctx.parent.attachSeriesAreaOverlay(this.labelGroup);
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
            instance.setOptions(regionOptions);
            this.attachInstance(instance);
            this.initInstance(instance, regionOptions);
            return instance;
        });
    }

    setVisible(visible: boolean): void {
        this.regionGroup.visible = visible;
        this.labelGroup.visible = visible;
    }

    getInstances(): readonly _ModuleSupport.BackgroundRegion[] {
        return this.instances;
    }

    onSeriesAreaUpdate(clipRect: _ModuleSupport.BBox | undefined): void {
        // Labels are deliberately unclipped so outside positions remain visible past the plot edge,
        // matching cross line labels.
        this.regionGroup.setClipRectCanvasSpace(clipRect);

        for (const instance of this.instances) {
            instance.update();
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

    private attachInstance(region: _ModuleSupport.BackgroundRegion): void {
        this.regionGroup.appendChild(region.regionGroup);
        this.labelGroup.appendChild(region.labelGroup);
    }

    private detachInstance(region: _ModuleSupport.BackgroundRegion): void {
        region.regionGroup.remove();
        region.labelGroup.remove();
    }

    private initInstance(region: _ModuleSupport.BackgroundRegion, opts: NormalisedSeriesAreaBackgroundRegion): void {
        region.xScale = this.resolveScale(ChartAxisDirection.X, opts.xRange?.axis, 'xRange');
        region.yScale = this.resolveScale(ChartAxisDirection.Y, opts.yRange?.axis, 'yRange');
    }

    private resolveScale(direction: ChartAxisDirection, axisKey: string | undefined, optionsKey: string) {
        const axisID = axisKey == null ? undefined : this.ctx.axisManager.getRemappedAxisId(axisKey);

        if (axisKey != null && axisID == null) {
            this.ctx.logger.warnOnce(
                `No axis found matching \`seriesArea.backgroundRegions[].${optionsKey}.axis\` of \`${axisKey}\`, using the primary axis.`
            );
        }

        const axisContext =
            axisID == null
                ? this.ctx.axisManager.getAxisContext(direction).at(0)
                : this.ctx.axisManager.getAxisIdContext(axisID);

        return axisContext?.scale;
    }

    private optionsEquivalent(options: NormalisedSeriesAreaBackgroundRegion[] | undefined): boolean {
        const previous = this.lastOptions;
        if (options === previous) return true;
        if (options == null || previous == null) return false;
        return jsonDiff(previous, options) == null;
    }
}
