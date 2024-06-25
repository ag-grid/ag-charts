import { type AgNightingaleSeriesOptions, type AgRadialSeriesStyle, _ModuleSupport, _Scene } from 'ag-charts-community';

import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBaseProperties } from '../radial-column/radialColumnSeriesBaseProperties';
import { getRadii, prepareNightingaleAnimationFunctions, resetNightingaleSelectionFn } from './nightingaleUtil';

const { Sector, SectorBox } = _Scene;

export class NightingaleSeries extends RadialColumnSeriesBase<_Scene.Sector> {
    static readonly className = 'NightingaleSeries';
    static readonly type = 'nightingale' as const;

    override properties = new RadialColumnSeriesBaseProperties<AgNightingaleSeriesOptions>();

    // TODO: Enable once the options contract has been revisited
    // @Validate(POSITIVE_NUMBER)
    // sectorSpacing = 1;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `nightingale-stack-${groupIndex}-yValues`;
    }

    protected override nodeFactory(): _Scene.Sector {
        return new Sector();
    }

    protected updateItemPath(
        node: _Scene.Sector,
        datum: RadialColumnNodeDatum,
        highlight: boolean,
        _format: AgRadialSeriesStyle | undefined
    ) {
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

        // TODO: Enable once the options contract has been revisited
        // const appliedHighlightStyle = highlight ? this.highlightStyle.item : undefined;

        // const hasStroke = (format?.stroke ?? appliedHighlightStyle?.stroke ?? this.stroke) != null;

        // const strokeWidth = hasStroke
        //     ? format?.strokeWidth ?? (highlight ? appliedHighlightStyle?.strokeWidth : undefined) ?? this.strokeWidth
        //     : 0;
        // node.inset = (this.sectorSpacing + strokeWidth) / 2;
    }

    protected override getColumnTransitionFunctions() {
        const axisZeroRadius = this.isRadiusAxisReversed() ? this.radius : this.getAxisInnerRadius();
        return prepareNightingaleAnimationFunctions(axisZeroRadius);
    }
}
