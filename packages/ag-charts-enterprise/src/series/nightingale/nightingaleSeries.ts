import { _ModuleSupport } from 'ag-charts-community';
import {
    type DynamicContext,
    type NormalisedNightingaleSeriesOwnOptions,
    PolarZIndexMap,
    Sector,
    SectorBox,
    type SectorGlowEntry,
    polarSectorObstacles,
    setSectorGlowEnds,
} from 'ag-charts-core';
import type { Selection } from 'ag-charts-core';

import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { getRadii, prepareNightingaleAnimationFunctions, resetNightingaleSelectionFn } from './nightingaleUtil';

export class NightingaleSeries extends RadialColumnSeriesBase<
    Sector<RadialColumnNodeDatum>,
    NormalisedNightingaleSeriesOwnOptions
> {
    static override readonly className = 'NightingaleSeries';
    static readonly type = 'nightingale' as const;

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    }

    override setZIndex(zIndex: number): boolean {
        super.setZIndex(zIndex);

        // Ensures highlights always appear on top
        this.contentGroup.zIndex = [0, PolarZIndexMap.FOREGROUND, zIndex];
        this.highlightGroup.zIndex = [0, PolarZIndexMap.HIGHLIGHT, zIndex];
        this.labelGroup.zIndex = [0, PolarZIndexMap.LABEL, zIndex];

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
        if (!selection.nodes().some((node) => node.fillGlow?.enabled === true)) return;

        const ring: SectorGlowEntry[] = [];
        selection.each((sector, { startAngle, endAngle }) => {
            if (endAngle > startAngle) ring.push({ sector, startAngle, endAngle });
        });
        ring.sort((a, b) => a.startAngle - b.startAngle);
        setSectorGlowEnds(ring, true);
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
