import { _ModuleSupport } from 'ag-charts-community';
import {
    type DynamicContext,
    type NormalisedNightingaleSeriesOwnOptions,
    Sector,
    SectorBox,
    SectorGlowRing,
    SeriesContentZIndexMap,
    SeriesZIndexMap,
    polarSectorObstacles,
} from 'ag-charts-core';
import type { Selection } from 'ag-charts-core';

import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import {
    getInnerRadius,
    getOuterRadius,
    getRadii,
    prepareNightingaleAnimationFunctions,
    resetNightingaleSelectionFn,
} from './nightingaleUtil';

export class NightingaleSeries extends RadialColumnSeriesBase<
    Sector<RadialColumnNodeDatum>,
    NormalisedNightingaleSeriesOwnOptions
> {
    static override readonly className = 'NightingaleSeries';
    static readonly type = 'nightingale' as const;

    private readonly glowRing = new SectorGlowRing();

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    }

    override setZIndex(zIndex: number): boolean {
        super.setZIndex(zIndex);

        // Ensures highlights always appear on top. A series brought to front also lifts them to the level of the glow overlay,
        // where the extra `zIndex` places them above it, so that no other series' glow covers them.
        const level = zIndex === Number.MAX_VALUE ? zIndex : 0;
        this.contentGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, 0, SeriesContentZIndexMap.FOREGROUND, zIndex];
        this.highlightGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, level, SeriesContentZIndexMap.HIGHLIGHT, zIndex];
        this.labelGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, level, SeriesContentZIndexMap.LABEL, zIndex];

        return true;
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `nightingale-stack-${groupIndex}-yValues`;
    }

    protected override nodeFactory(): Sector<RadialColumnNodeDatum> {
        return new Sector<RadialColumnNodeDatum>();
    }

    protected updateItemPath(node: Sector, datum: RadialColumnNodeDatum, highlight: boolean) {
        const { negative } = datum;
        const { cornerRadius } = this.options;
        node.centerX = 0;
        node.centerY = 0;
        node.startOuterCornerRadius = negative ? 0 : cornerRadius;
        node.endOuterCornerRadius = negative ? 0 : cornerRadius;
        node.startInnerCornerRadius = negative ? cornerRadius : 0;
        node.endInnerCornerRadius = negative ? cornerRadius : 0;
        if (highlight) {
            const { startAngle, endAngle } = datum;
            const { innerRadius, outerRadius, clipInnerRadius, clipOuterRadius } = getRadii(datum);
            node.innerRadius = innerRadius;
            node.outerRadius = outerRadius;
            node.startAngle = startAngle;
            node.endAngle = endAngle;
            node.clipSector = new SectorBox(startAngle, endAngle, clipInnerRadius, clipOuterRadius);
        }
    }

    protected override updateGlowEnds(selection: Selection<RadialColumnNodeDatum, Sector<RadialColumnNodeDatum>>) {
        if (!selection.nodes().some((node) => node.fillGlow?.enabled === true)) {
            this.glowRing.release();
            return;
        }

        // This runs before the sectors are laid out, so the radii come from the datum, as `updateItemPath` takes them.
        this.glowRing.endGlows(
            selection,
            (ring, sector, datum) =>
                ring.add(sector, datum.startAngle, datum.endAngle, getInnerRadius(datum), getOuterRadius(datum)),
            true
        );
    }

    getLabelObstacles() {
        const sectors = this.nodeData.map((datum) => {
            const { clipInnerRadius, clipOuterRadius } = getRadii(datum);
            return {
                startAngle: datum.startAngle,
                endAngle: datum.endAngle,
                innerRadius: Math.min(clipInnerRadius, clipOuterRadius),
                outerRadius: Math.max(clipInnerRadius, clipOuterRadius),
            };
        });
        return polarSectorObstacles(sectors, this.centerX, this.centerY);
    }

    protected override getColumnTransitionFunctions() {
        const axisZeroRadius = this.isRadiusAxisReversed() ? this.radius : this.getAxisInnerRadius();
        return prepareNightingaleAnimationFunctions(axisZeroRadius);
    }
}
