import { type AgNightingaleSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { PolarZIndexMap } from 'ag-charts-core';

import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBaseProperties } from '../radial-column/radialColumnSeriesBaseProperties';
import { getRadii, prepareNightingaleAnimationFunctions, resetNightingaleSelectionFn } from './nightingaleUtil';

const { Sector, SectorBox } = _ModuleSupport;

export class NightingaleSeries extends RadialColumnSeriesBase<_ModuleSupport.Sector> {
    static override readonly className = 'NightingaleSeries';
    static readonly type = 'nightingale' as const;

    override properties = new RadialColumnSeriesBaseProperties<AgNightingaleSeriesOptions>();

    // TODO: Enable once the options contract has been revisited
    // @TempValidate
    // sectorSpacing = 1;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
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

    protected override nodeFactory(): _ModuleSupport.Sector {
        return new Sector();
    }

    protected updateItemPath(node: _ModuleSupport.Sector, datum: RadialColumnNodeDatum, highlight: boolean) {
        const { negative } = datum;
        node.centerX = 0;
        node.centerY = 0;
        node.startOuterCornerRadius = negative ? 0 : this.properties.cornerRadius;
        node.endOuterCornerRadius = negative ? 0 : this.properties.cornerRadius;
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

    protected override hasItemStylers(): boolean {
        return (
            this.properties.itemStyler != null ||
            this.properties.styler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
