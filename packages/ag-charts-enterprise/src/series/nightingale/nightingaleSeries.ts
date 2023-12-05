import { type AgRadialSeriesFormat, _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AngleCategoryAxis } from '../../axes/angle-category/angleCategoryAxis';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { prepareNightingaleAnimationFunctions, resetNightingaleSelectionFn } from './nightingaleUtil';

const { Validate, NUMBER } = _ModuleSupport;
const { Sector } = _Scene;

export class NightingaleSeries extends RadialColumnSeriesBase<_Scene.Sector> {
    static className = 'NightingaleSeries';
    static type = 'nightingale' as const;

    @Validate(NUMBER(0))
    sectorSpacing = 1;

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
        format: AgRadialSeriesFormat | undefined
    ) {
        node.centerX = 0;
        node.centerY = 0;
        if (highlight) {
            node.innerRadius = datum.innerRadius;
            node.outerRadius = datum.outerRadius;
            node.startAngle = datum.startAngle;
            node.endAngle = datum.endAngle;
        }

        const appliedHighlightStyle = highlight ? this.highlightStyle.item : undefined;

        const hasStroke = (format?.stroke ?? appliedHighlightStyle?.stroke ?? this.stroke) != null;
        const hasPadding = (this.axes.x as AngleCategoryAxis).paddingInner > 0;

        const strokeWidth = hasStroke
            ? format?.strokeWidth ?? (highlight ? appliedHighlightStyle?.strokeWidth : undefined) ?? this.strokeWidth
            : 0;

        node.concentricEdgeInset = (this.sectorSpacing + strokeWidth) / 2;
        node.radialEdgeInset = ((!hasPadding ? this.sectorSpacing : 0) + strokeWidth) / 2;
    }

    protected override getColumnTransitionFunctions() {
        const axisInnerRadius = this.getAxisInnerRadius();
        return prepareNightingaleAnimationFunctions(axisInnerRadius);
    }
}
