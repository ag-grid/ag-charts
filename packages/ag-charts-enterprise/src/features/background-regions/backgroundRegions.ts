import { _ModuleSupport } from 'ag-charts-community';
import {
    ChartAxisDirection,
    CleanupRegistry,
    type DynamicContext,
    Group,
    type ModuleInstance,
    type NormalisedSeriesAreaBackgroundRegion,
    type PlacedLabel,
    type PointLabelDatum,
    type ResolvedContribution,
    jsonDiff,
    readContributedValue,
} from 'ag-charts-core';
import type { BBox } from 'ag-charts-core';

import { CartesianBackgroundRegion } from './cartesianBackgroundRegion';

interface Region {
    readonly instance: CartesianBackgroundRegion;
    readonly options: NormalisedSeriesAreaBackgroundRegion;
}

/** The region labels kept or dropped alike, which solve as one group; kept ones resolve before series labels. */
class RegionLabelSource {
    // Solved ahead of cross line labels, so where both could move, the cross line label gives way.
    readonly solveRank = -1;
    private readonly datums = new Map<CartesianBackgroundRegion, PointLabelDatum>();

    constructor(
        readonly id: string,
        private readonly owner: BackgroundRegions,
        private readonly keep: boolean
    ) {}

    get usesPlacedLabels(): boolean {
        for (const instance of this.owner.instances()) {
            if (instance.hasLabel && instance.keepsLabel === this.keep) return true;
        }
        return false;
    }

    get nodeDataVersion(): number {
        return this.owner.nodeDataVersion;
    }

    getLabelData(seriesRect: BBox): PointLabelDatum[] {
        this.datums.clear();
        const container = this.owner.canvasBox();
        for (const instance of this.owner.instances()) {
            if (instance.keepsLabel !== this.keep) continue;
            const datum = instance.getLabelDatum(seriesRect, container);
            if (datum != null) this.datums.set(instance, datum);
        }
        return Array.from(this.datums.values());
    }

    updatePlacedLabelData(labels: PlacedLabel[]): void {
        const placed = new Map(labels.map((label) => [label.datum, label]));
        for (const [instance, datum] of this.datums) {
            const label = placed.get(datum);
            instance.applyLabelPlacement(label == null, label?.candidate);
        }
    }
}

export class BackgroundRegions implements ModuleInstance, _ModuleSupport.SeriesAreaContent {
    readonly underlay = new Group({ name: 'BackgroundRegions-Region' });
    readonly overlay = new Group({ name: 'BackgroundRegions-Label' });

    nodeDataVersion = 0;
    private readonly labelSources = [
        new RegionLabelSource('backgroundRegions:labels', this, true),
        new RegionLabelSource('backgroundRegions:labels:drop', this, false),
    ];

    private regions: Region[] = [];
    private lastRegionOptions: NormalisedSeriesAreaBackgroundRegion[] | undefined;
    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
        contributions: Iterable<ResolvedContribution>
    ) {
        this.cleanup.register(
            ctx.seriesArea.attach(this),
            () => {
                for (const source of this.labelSources) ctx.labelManager.unregisterSource(source.id, source);
            },
            () => this.detachRegions(),
            ctx.chartState.observe((get) => {
                const regions = readContributedValue(contributions, 'chart', get('options'));
                this.applyRegionOptions(regions as NormalisedSeriesAreaBackgroundRegion[] | undefined);
            })
        );
        for (const source of this.labelSources) ctx.labelManager.registerSource(source);
    }

    destroy() {
        this.cleanup.flush();
    }

    update(clipRect: BBox | undefined) {
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
        this.nodeDataVersion++;
    }

    canvasBox() {
        const { width, height } = this.ctx.scene;
        return { x: 0, y: 0, width, height };
    }

    *instances() {
        for (const { instance } of this.regions) yield instance;
    }

    private applyRegionOptions(options: NormalisedSeriesAreaBackgroundRegion[] | undefined) {
        if (this.optionsEquivalent(options)) return;

        this.lastRegionOptions = options;
        this.detachRegions();

        this.regions =
            options?.map((regionOptions) => {
                const instance = new CartesianBackgroundRegion(this.ctx);
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
