import { _ModuleSupport } from 'ag-charts-community';

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
    getRectConfig,
    updateRect,
    checkCrisp,
    resetBarSelectionsFn,
    prepareBarAnimationFunctions,
    midpointStartingBarPosition,
    formatValue,
    Rect,
    motion,
} = _ModuleSupport;

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
            fill: undefined,
            fillOpacity,
            stroke: undefined,
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
        rect,
        yDatum,
        datum,
        visible,
    }: {
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
            series: this,
            visible,
        };
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, FunnelNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { id: seriesId, ctx } = this;
        const {
            stageKey,
            valueKey,
            highlightStyle: { item: itemHighlightStyle },
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
            itemStyler,
            shadow: fillShadow,
        } = this.properties;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp = checkCrisp(
            xAxis?.scale,
            xAxis?.visibleRange,
            this.smallestDataInterval,
            this.largestDataInterval
        );

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        datumSelection.each((rect, datum) => {
            const style: _ModuleSupport.RectConfig = {
                fill: datum.fill,
                stroke: datum.stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow,
                strokeWidth: this.getStrokeWidth(strokeWidth),
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig(this, datum.itemId, {
                datum,
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                itemStyler,
                seriesId,
                ctx,
                stageKey,
                valueKey,
            });
            config.crisp = crisp;
            config.visible = visible;
            updateRect(rect, config);
        });
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
        const dataDiff = processedData?.reduced?.diff;

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
