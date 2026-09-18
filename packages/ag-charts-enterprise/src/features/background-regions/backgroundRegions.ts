import { _ModuleSupport } from 'ag-charts-community';
import {
    ChartAxisDirection,
    CleanupRegistry,
    type DynamicContext,
    type ModuleInstance,
    type NormalisedSeriesAreaBackgroundRegion,
    type ResolvedContribution,
    jsonDiff,
    readContributedValue,
} from 'ag-charts-core';

import { CartesianBackgroundRegion } from './cartesianBackgroundRegion';

interface Region {
    readonly instance: _ModuleSupport.BackgroundRegion;
    readonly options: NormalisedSeriesAreaBackgroundRegion;
}

export class BackgroundRegions implements ModuleInstance, _ModuleSupport.SeriesAreaContent {
    readonly underlay = new _ModuleSupport.Group({ name: 'BackgroundRegions-Region' });
    readonly overlay = new _ModuleSupport.Group({ name: 'BackgroundRegions-Label' });

    private regions: Region[] = [];
    private lastRegionOptions: NormalisedSeriesAreaBackgroundRegion[] | undefined;
    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
        contributions: Iterable<ResolvedContribution>
    ) {
        this.cleanup.register(
            ctx.seriesArea.attach(this),
            () => this.detachRegions(),
            ctx.chartState.observe((get) => {
                const regions = readContributedValue(contributions, 'chart', get('options'));
                this.applyRegionOptions(regions as NormalisedSeriesAreaBackgroundRegion[] | undefined);
            })
        );
    }

    destroy() {
        this.cleanup.flush();
    }

    update(clipRect: _ModuleSupport.BBox | undefined) {
        // Labels stay unclipped so outside positions remain visible, matching cross line labels.
        this.underlay.setClipRectCanvasSpace(clipRect);

        // Axes are resolved here rather than when the options arrive, as they may not exist yet then.
        let index = 0;
        for (const { instance, options } of this.regions) {
            instance.xAxis = this.resolveAxis(ChartAxisDirection.X, options.xRange?.axis, 'xRange');
            instance.yAxis = this.resolveAxis(ChartAxisDirection.Y, options.yRange?.axis, 'yRange');
            instance.update(index);
            index++;
        }
    }

    private applyRegionOptions(options: NormalisedSeriesAreaBackgroundRegion[] | undefined) {
        if (this.optionsEquivalent(options)) return;

        this.lastRegionOptions = options;
        this.detachRegions();

        this.regions =
            options?.map((regionOptions) => {
                const instance = new CartesianBackgroundRegion(this.ctx.logger);
                instance.setOptions(regionOptions);
                this.underlay.appendChild(instance.regionGroup);
                this.overlay.appendChild(instance.labelGroup);
                return { instance, options: regionOptions };
            }) ?? [];
    }

    private detachRegions() {
        for (const { instance } of this.regions) {
            instance.regionGroup.remove();
            instance.labelGroup.remove();
        }
        this.regions = [];
    }

    private resolveAxis(direction: ChartAxisDirection, axisKey: string | undefined, optionsKey: string) {
        const { axisManager, logger } = this.ctx;
        const axisID = axisKey == null ? undefined : axisManager.getRemappedAxisId(axisKey);

        if (axisKey != null && axisID == null) {
            logger.warnOnce(
                `No axis found matching \`seriesArea.backgroundRegions[].${optionsKey}.axis\` of \`${axisKey}\`, using the primary axis.`
            );
        }

        return axisID == null ? axisManager.getAxisContext(direction).at(0) : axisManager.getAxisIdContext(axisID);
    }

    private optionsEquivalent(options: NormalisedSeriesAreaBackgroundRegion[] | undefined) {
        const previous = this.lastRegionOptions;
        if (options === previous) return true;
        if (options == null || previous == null) return false;
        return jsonDiff(previous, options) == null;
    }
}
