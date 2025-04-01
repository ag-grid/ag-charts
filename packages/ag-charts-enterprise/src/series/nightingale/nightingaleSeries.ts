import { type AgNightingaleSeriesOptions, _ModuleSupport } from 'ag-charts-community';

import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBaseProperties } from '../radial-column/radialColumnSeriesBaseProperties';
import { getRadii, prepareNightingaleAnimationFunctions, resetNightingaleSelectionFn } from './nightingaleUtil';

const { Sector, SectorBox, PolarZIndexMap } = _ModuleSupport;

export class NightingaleSeries extends RadialColumnSeriesBase<_ModuleSupport.Sector> {
    static readonly className = 'NightingaleSeries';
    static readonly type = 'nightingale' as const;

    override properties = new RadialColumnSeriesBaseProperties<AgNightingaleSeriesOptions<unknown>>();

    // TODO: Enable once the options contract has been revisited
    // @TempValidate
    // sectorSpacing = 1;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    }

    override setSeriesIndex(index: number) {
        if (!super.setSeriesIndex(index)) return false;

        // Ensures highlights always appear on top
        this.contentGroup.zIndex = [0, PolarZIndexMap.FOREGROUND, index];
        this.highlightGroup.zIndex = [0, PolarZIndexMap.HIGHLIGHT, index];
        this.labelGroup.zIndex = [0, PolarZIndexMap.LABEL, index];

        return true;
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `nightingale-stack-${groupIndex}-yValues`;
    }

    protected override nodeFactory(): _ModuleSupport.Sector {
        return new Sector();
    }

    protected updateItemPath(node: _ModuleSupport.Sector, datum: RadialColumnNodeDatum, highlight: boolean) {
        const { negative } = datum;
        node.centerX = 0;
        node.centerY = 0;
        node.startOuterCornerRadius = !negative ? this.properties.cornerRadius : 0;
        node.endOuterCornerRadius = !negative ? this.properties.cornerRadius : 0;
        node.startInnerCornerRadius = negative ? this.properties.cornerRadius : 0;
        node.endInnerCornerRadius = negative ? this.properties.cornerRadius : 0;
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

    protected override getColumnTransitionFunctions() {
        const axisZeroRadius = this.isRadiusAxisReversed() ? this.radius : this.getAxisInnerRadius();
        return prepareNightingaleAnimationFunctions(axisZeroRadius);
    }
}
