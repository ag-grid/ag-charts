import { type AgFunnelSeriesStyle, _ModuleSupport } from 'ag-charts-community';

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
    checkCrisp,
    resetBarSelectionsFn,
    prepareBarAnimationFunctions,
    midpointStartingBarPosition,
    createDatumId,
    formatValue,
    Rect,
    motion,
    applyShapeStyle,
} = _ModuleSupport;

type ItemStyle = Pick<AgFunnelSeriesStyle, 'fill' | 'stroke'> & Required<Omit<AgFunnelSeriesStyle, 'fill' | 'stroke'>>;

export class FunnelSeries extends BaseFunnelSeries<_ModuleSupport.Rect> {
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
        const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = this.properties;
        return {
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
        };
    }

    protected override connectorStyle(): FunnelSeriesShapeStyle {
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.dropOff;
        return { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset };
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

        return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            textAlign: 'center',
            textBaseline: 'middle',
            text: this.getLabelText(label, { itemId: stageKey, value: yDatum, datum, valueKey, stageKey }, (value) =>
                formatValue(value, 0)
            ),
            itemId: stageKey,
            datum,
            datumIndex,
            series: this,
            visible,
        };
    }

    private getItemBaseStyle(highlighted: boolean): ItemStyle {
        const { properties } = this;
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return {
            fill: highlightStyle?.fill,
            fillOpacity: highlightStyle?.fillOpacity ?? properties.fillOpacity,
            stroke: highlightStyle?.stroke,
            strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
            strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
            lineDash: highlightStyle?.lineDash ?? properties.lineDash,
            lineDashOffset: highlightStyle?.lineDashOffset ?? properties.lineDashOffset,
        };
    }

    private getItemStyleOverrides(
        datumId: string,
        datum: any,
        datumIndex: number,
        format: ItemStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;
        const { stageKey, valueKey, fills, strokes, itemStyler } = properties;

        const fill = format.fill ?? fills[datumIndex % fills.length] ?? 'black';
        const stroke = format.stroke ?? strokes[datumIndex % strokes.length] ?? 'black';

        const overrides: Partial<ItemStyle> = {};

        if (!highlighted) {
            overrides.fill = fill;
            overrides.stroke = stroke;
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, highlighted ? 'highlight' : 'node'),
                () => {
                    const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = format;
                    return itemStyler({
                        seriesId,
                        datum,
                        highlighted,
                        stageKey,
                        valueKey,
                        fill,
                        fillOpacity,
                        stroke,
                        strokeOpacity,
                        strokeWidth,
                        lineDash,
                        lineDashOffset,
                    });
                }
            );

            Object.assign(overrides, itemStyle);
        }

        return overrides;
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, FunnelNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp = checkCrisp(
            xAxis?.scale,
            xAxis?.visibleRange,
            this.smallestDataInterval,
            this.largestDataInterval
        );

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        const style = this.getItemBaseStyle(isHighlight);

        datumSelection.each((rect, datum) => {
            const { datumIndex } = datum;
            const overrides = this.getItemStyleOverrides(
                String(datum.datumIndex),
                datum.datum,
                datumIndex,
                style,
                isHighlight
            );

            applyShapeStyle(rect, style, overrides);

            rect.visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            rect.crisp = crisp;
        });
    }

    protected tooltipStyle(datum: any, datumIndex: number) {
        const style = this.getItemBaseStyle(false) as any as Required<ItemStyle>;
        Object.assign(
            style,
            this.getItemStyleOverrides(String(datum.datumIndex), datum.datum, datumIndex, style, false)
        );
        return style;
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
