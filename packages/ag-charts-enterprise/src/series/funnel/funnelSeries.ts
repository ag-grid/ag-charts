import {
    type AgFunnelSeriesLabelFormatterParams,
    type AgFunnelSeriesOptions,
    _ModuleSupport,
} from 'ag-charts-community';

import {
    BaseFunnelSeries,
    type Bounds,
    type FunnelAnimationData,
    type FunnelNodeDatum,
    type FunnelNodeLabelDatum,
    type FunnelSeriesShapeStyle,
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
    applyShapeStyle,
    getShapeStyle,
    mergeDefaults,
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

    protected override barStyle(): FunnelSeriesShapeStyle {
        const {
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
        } = this.properties;
        return {
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
        };
    }

    protected override connectorStyle(): FunnelSeriesShapeStyle {
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.dropOff;
        return {
            fill,
            fillOpacity,
            stroke,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
            fillGradientDefaults: this.properties.fillGradientDefaults,
            fillPatternDefaults: this.properties.fillPatternDefaults,
            fillImageDefaults: this.properties.fillImageDefaults,
        };
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

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);
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

    private getItemStyle({ datum }: Partial<FunnelNodeDatum>, datumIndex: number, isHighlight: boolean) {
        const { id: seriesId, properties } = this;
        const { stageKey, valueKey, itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const baseStyle = mergeDefaults(highlightStyle, properties.getStyle(datumIndex));
        let style = getShapeStyle(
            baseStyle,
            properties.fillGradientDefaults,
            properties.fillPatternDefaults,
            properties.fillImageDefaults
        );

        if (itemStyler != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        highlighted: isHighlight,
                        stageKey,
                        valueKey,
                        ...style,
                    });
                }
            );

            if (overrides) {
                style = getShapeStyle(
                    mergeDefaults(overrides, style),
                    properties.fillGradientDefaults,
                    properties.fillPatternDefaults,
                    properties.fillImageDefaults
                );
            }
        }

        return style;
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, FunnelNodeDatum>;
        isHighlight: boolean;
    }) {
        const { shadow } = this.properties;
        const { datumSelection, isHighlight } = opts;

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((rect, datum) => {
            const { datumIndex } = datum;
            const style = this.getItemStyle(datum, datumIndex, isHighlight);

            applyShapeStyle(rect, style, fillBBox);

            rect.visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            rect.crisp = datum.crisp;
            rect.fillShadow = shadow;
        });
    }

    protected tooltipStyle(datum: unknown, datumIndex: number) {
        return this.getItemStyle({ datumIndex, datum }, datumIndex, false);
    }

    override animateEmptyUpdateReady(params: FunnelAnimationData<_ModuleSupport.Rect>) {
        super.animateEmptyUpdateReady(params);

        const { datumSelection } = params;
        const isVertical = this.isVertical();
        const mode = 'normal';

        const barFns = prepareBarAnimationFunctions(midpointStartingBarPosition(isVertical, mode));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], barFns);
    }

    override animateWaitingUpdateReady(data: FunnelAnimationData<_ModuleSupport.Rect>) {
        super.animateWaitingUpdateReady(data);
        const { datumSelection: datumSelections } = data;
        const { processedData } = this;
        const dataDiff = processedData?.reduced?.diff?.[this.id];

        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'fade'));
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
}
