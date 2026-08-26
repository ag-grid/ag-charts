import {
    type AgConeFunnelSeriesLabelPlacement,
    type AgConeFunnelSeriesOptions,
    type AgConeFunnelSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { DynamicContext, RequireOptional } from 'ag-charts-core';

import {
    BaseFunnelSeries,
    type BaseFunnelSeriesTypes,
    type FunnelAnimationData,
    type FunnelNodeDatum,
} from '../funnel/baseFunnelSeries';
import { CONE_FUNNEL_TO_BAR_PLACEMENT, resolveConeFunnelPlacements } from '../funnel/funnelLabelPlacement';
import { ConeFunnelProperties } from './coneFunnelProperties';
import { resetLineSelectionsFn } from './coneFunnelUtil';

const { Line, resetMotion } = _ModuleSupport;

/**
 * Consolidated type interface for ConeFunnelSeries.
 */
interface ConeFunnelSeriesTypes extends BaseFunnelSeriesTypes {
    readonly node: _ModuleSupport.Line<FunnelNodeDatum>;
    readonly options: AgConeFunnelSeriesOptions;
    readonly properties: ConeFunnelProperties;
}

export class ConeFunnelSeries extends BaseFunnelSeries<ConeFunnelSeriesTypes> {
    static override readonly className = 'ConeFunnelSeries';
    static readonly type = 'cone-funnel' as const;

    override properties = new ConeFunnelProperties();

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx,
            animationResetFns: {
                datum: resetLineSelectionsFn,
            },
        });
    }

    override animateWaitingUpdateReady(data: FunnelAnimationData<_ModuleSupport.Line<FunnelNodeDatum>>) {
        super.animateWaitingUpdateReady(data);
        // The datum selection has garbage collection disabled, so exit nodes are only destroyed when a
        // motion completes. Cone-funnel Lines snap rather than animate, so reset them to clean up exits.
        resetMotion([data.datumSelection], resetLineSelectionsFn);
    }

    override get hasData(): boolean {
        const {
            id: seriesId,
            ctx: { legendManager },
        } = this;
        const visibleItems = this.data?.data.reduce(
            (accum, _, datumIndex) =>
                accum + ((legendManager?.getItemEnabled({ seriesId, itemId: datumIndex }) ?? true) ? 1 : 0),
            0
        );
        return visibleItems != null && visibleItems > 1;
    }

    override getBandScalePadding() {
        return { inner: 1, outer: 0 };
    }

    protected override connectorEnabled() {
        return true;
    }

    protected getItemStyle(
        { datumIndex }: Pick<FunnelNodeDatum, 'datumIndex'>,
        _isHighlight: boolean
    ): RequireOptional<AgConeFunnelSeriesStyle> & { opacity: number } {
        return this.properties.getStyle(datumIndex);
    }

    protected override connectorStyle(index: number): RequireOptional<AgConeFunnelSeriesStyle> & { opacity: number } {
        return this.properties.getStyle(index);
    }

    protected override nodeFactory(): _ModuleSupport.Line<FunnelNodeDatum> {
        return new Line<FunnelNodeDatum>();
    }

    protected override defaultLabelPlacement(): AgConeFunnelSeriesLabelPlacement {
        return 'before-center';
    }

    protected override resolveLabelPlacements(barAlongX: boolean) {
        const reportedPlacements = resolveConeFunnelPlacements(
            this.properties.label.placement,
            this.defaultLabelPlacement(),
            barAlongX,
            this.ctx.domManager.isRtl
        );
        return {
            placements: reportedPlacements.map((placement) => CONE_FUNNEL_TO_BAR_PLACEMENT[placement]),
            reportedPlacements,
            // A divider spans the value axis, so `before`/`after` is the cross axis: the bar convention.
            isVertical: !barAlongX,
            isUpward: true,
            // The divider has no thickness, so a `middle-*` region takes its cross extent from the plot.
            insideCrossRegion: this.getSeriesPlotRegion(),
        };
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<FunnelNodeDatum, _ModuleSupport.Line<FunnelNodeDatum>>;
        isHighlight: boolean;
    }) {
        const highlightStyle = this.getHighlightStyle(opts.isHighlight);

        opts.datumSelection.each((line, datum) => {
            line.setProperties(resetLineSelectionsFn(line, datum));
            line.stroke = highlightStyle?.stroke;
            line.strokeWidth = highlightStyle?.strokeWidth ?? 0;
            line.strokeOpacity = highlightStyle?.strokeOpacity ?? 1;
            line.lineDash = highlightStyle?.lineDash;
            line.lineDashOffset = highlightStyle?.lineDashOffset ?? 0;
            line.opacity = highlightStyle?.opacity ?? 1;
        });
    }

    protected tooltipStyle(_datum: any, datumIndex: number) {
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.getStyle(datumIndex);

        return {
            fill,
            fillOpacity,
            stroke,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
        };
    }

    protected override hasItemStylers(): boolean {
        return this.properties.selection.enabled || this.properties.label.itemStyler != null;
    }
}
