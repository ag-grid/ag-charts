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
        if (clipRect) {
            const translatedClipRect = new _ModuleSupport.BBox(0, 0, clipRect.width, clipRect.height);

            this.regionGroup.setClipRectCanvasSpace(translatedClipRect);
            this.labelGroup.setClipRectCanvasSpace(translatedClipRect);
        }

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
        const xAxisID =
            opts.xRange?.axis == null ? undefined : this.ctx.axisManager.getRemappedAxisId(opts.xRange.axis);
        const yAxisID =
            opts.yRange?.axis == null ? undefined : this.ctx.axisManager.getRemappedAxisId(opts.yRange.axis);

        const xAxisContext =
            xAxisID == null
                ? this.ctx.axisManager.getAxisContext(ChartAxisDirection.X).at(0)
                : this.ctx.axisManager.getAxisIdContext(xAxisID);

        const yAxisContext =
            yAxisID == null
                ? this.ctx.axisManager.getAxisContext(ChartAxisDirection.Y).at(0)
                : this.ctx.axisManager.getAxisIdContext(yAxisID);

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
