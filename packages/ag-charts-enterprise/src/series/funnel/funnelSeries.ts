import {
    type AgFunnelSeriesLabelFormatterParams,
    type AgFunnelSeriesOptions,
    type AgFunnelSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { RequireOptional } from 'ag-charts-core';
import { mergeDefaults } from 'ag-charts-core';

import {
    BaseFunnelSeries,
    type Bounds,
    type FunnelAnimationData,
    type FunnelNodeDatum,
    type FunnelNodeLabelDatum,
} from './baseFunnelSeries';
import { FunnelProperties } from './funnelProperties';

const {
    ChartAxisDirection,
    resetBarSelectionsFn,
    prepareBarAnimationFunctions,
    midpointStartingBarPosition,
    createDatumId,
    Rect,
    motion,
} = _ModuleSupport;

export class FunnelSeries extends BaseFunnelSeries<_ModuleSupport.Rect<FunnelNodeDatum>, AgFunnelSeriesOptions> {
    static readonly className = 'FunnelSeries';
    static readonly type = 'funnel' as const;

    override properties = new FunnelProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            animationResetFns: {
                datum: resetBarSelectionsFn,
            },
        });
    }

    override getBandScalePadding() {
        return { inner: this.properties.spacingRatio, outer: 0 };
    }

    protected override connectorEnabled() {
        return this.properties.dropOff.enabled;
    }

    protected override connectorStyle(index: number): RequireOptional<AgFunnelSeriesStyle> & { opacity: number } {
        return mergeDefaults(this.properties.dropOff.getStyle(), this.properties.getStyle(index));
    }

    protected override nodeFactory(): _ModuleSupport.Rect {
        return new Rect();
    }

    protected override createLabelData({
        datumIndex,
        rect,
        yDatum,
        datum,
        visible,
    }: {
        datumIndex: number;
        rect: Bounds;
        barAlongX: boolean;
        yDatum: number;
        datum: any;
        visible: boolean;
    }): FunnelNodeLabelDatum | undefined {
        const { valueKey, stageKey, label } = this.properties;

        if (!label.enabled) return;

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y).domain;
        const text = this.getLabelText<AgFunnelSeriesLabelFormatterParams>(
            yDatum,
            datum,
            valueKey,
            'y',
            yDomain,
            label,
            { itemId: valueKey, value: yDatum, datum, stageKey, valueKey }
        );

        return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            textAlign: 'center',
            textBaseline: 'middle',
            text,
            itemId: stageKey,
            datum,
            datumIndex,
            series: this,
            visible,
        };
    }

    protected getItemStyle({ datum, datumIndex }: Pick<FunnelNodeDatum, 'datum' | 'datumIndex'>, isHighlight: boolean) {
        const { id: seriesId, properties } = this;
        const { stageKey, valueKey, itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const baseStyle = mergeDefaults(highlightStyle, properties.getStyle(datumIndex));
        let style = baseStyle;

        if (itemStyler != null) {
            const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        highlightState: highlightStateString,
                        stageKey,
                        valueKey,
                        ...style,
                    });
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, FunnelNodeDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }

        const { shadow } = this.properties;

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((rect, datum) => {
            const style = this.getItemStyle(datum, isHighlight);
            rect.setStyleProperties(style, fillBBox);

            rect.visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
            rect.crisp = datum.crisp;
            rect.fillShadow = shadow;
        });
    }

    protected tooltipStyle(datum: unknown, datumIndex: number) {
        return this.getItemStyle({ datum, datumIndex }, false);
    }

    override animateEmptyUpdateReady(params: FunnelAnimationData<_ModuleSupport.Rect>) {
        super.animateEmptyUpdateReady(params);

        const { datumSelection } = params;
        const isVertical = this.isVertical();
        const mode = 'normal';

        const barFns = prepareBarAnimationFunctions(midpointStartingBarPosition(isVertical, mode), 'unknown');
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], barFns);
    }

    override animateWaitingUpdateReady(data: FunnelAnimationData<_ModuleSupport.Rect>) {
        super.animateWaitingUpdateReady(data);
        const { datumSelection: datumSelections } = data;
        const { processedData } = this;
        const dataDiff = processedData?.reduced?.diff?.[this.id];

        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'fade'), 'added');
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [datumSelections],
            fns,
            (_, datum) => datum.xValue,
            dataDiff
        );
    }

    protected override hasItemStylers(): boolean {
        return this.properties.itemStyler != null || this.properties.label.itemStyler != null;
    }
}
