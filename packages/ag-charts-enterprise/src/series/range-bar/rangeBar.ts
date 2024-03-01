import type { AgTooltipRendererResult } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { RangeBarProperties } from './rangeBarProperties';

const {
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    ChartAxisDirection,
    getRectConfig,
    updateRect,
    checkCrisp,
    updateLabelNode,
    SMALLEST_KEY_INTERVAL,
    diff,
    prepareBarAnimationFunctions,
    midpointStartingBarPosition,
    resetBarSelectionsFn,
    fixNumericExtent,
    seriesLabelFadeInAnimation,
    resetLabelFn,
    animationValidation,
    createDatumId,
} = _ModuleSupport;
const { ContinuousScale, Rect, PointerEvents, motion } = _Scene;
const { sanitizeHtml, isNumber, extent } = _Util;

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type RangeBarNodeLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};

interface RangeBarNodeDatum
    extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>,
        Readonly<_Scene.Point> {
    readonly index: number;
    readonly itemId: string;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
    readonly width: number;
    readonly height: number;
    readonly labels: RangeBarNodeLabelDatum[];
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
    readonly opacity: number;
    readonly cornerRadiusBbox?: _Scene.BBox;
}

type RangeBarContext = _ModuleSupport.CartesianSeriesNodeDataContext<RangeBarNodeDatum, RangeBarNodeLabelDatum>;

type RangeBarAnimationData = _ModuleSupport.CartesianAnimationData<
    _Scene.Rect,
    RangeBarNodeDatum,
    RangeBarNodeLabelDatum
>;

class RangeBarSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RangeBarNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RangeBarNodeDatum, series: RangeBarSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yLowKey = series.properties.yLowKey;
        this.yHighKey = series.properties.yHighKey;
    }
}

export class RangeBarSeries extends _ModuleSupport.AbstractBarSeries<
    _Scene.Rect,
    RangeBarProperties,
    RangeBarNodeDatum,
    RangeBarNodeLabelDatum
> {
    static readonly className = 'RangeBarSeries';
    static readonly type = 'range-bar' as const;

    override properties = new RangeBarProperties();

    protected override readonly NodeEvent = RangeBarSeriesNodeEvent;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            directionKeys: {
                x: ['xKey'],
                y: ['yLowKey', 'yHighKey'],
            },
            directionNames: {
                x: ['xName'],
                y: ['yLowName', 'yHighName', 'yName'],
            },
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    protected override resolveKeyDirection(direction: _ModuleSupport.ChartAxisDirection) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        if (!this.properties.isValid()) {
            return;
        }

        const { xKey, yLowKey, yHighKey } = this.properties;
        const isContinuousX = ContinuousScale.is(this.getCategoryAxis()?.scale);
        const isContinuousY = ContinuousScale.is(this.getValueAxis()?.scale);

        const extraProps = [];
        if (!this.ctx.animationManager.isSkipped()) {
            if (this.processedData) {
                extraProps.push(diff(this.processedData));
            }
            extraProps.push(animationValidation(this));
        }

        const visibleProps = this.visible ? {} : { forceValue: 0 };
        const { processedData } = await this.requestDataModel<any, any, true>(dataController, this.data ?? [], {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yLowKey, isContinuousY, { id: `yLowValue`, ...visibleProps }),
                valueProperty(this, yHighKey, isContinuousY, { id: `yHighValue`, ...visibleProps }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: true,
        });

        this.smallestDataInterval = {
            x: processedData.reduced?.smallestKeyInterval ?? Infinity,
            y: Infinity,
        };

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return [];

        const {
            domain: {
                keys: [keys],
                values,
            },
        } = processedData;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);

            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                return keys;
            }

            const { reduced: { [SMALLEST_KEY_INTERVAL.property]: smallestX } = {} } = processedData;
            const scalePadding = smallestX != null && isFinite(smallestX) ? smallestX : 0;
            const keysExtent = extent(keys) ?? [NaN, NaN];

            const categoryAxis = this.getCategoryAxis();
            const isReversed = categoryAxis?.isReversed();
            if (direction === ChartAxisDirection.Y) {
                const d0 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
                const d1 = keysExtent[1] + (isReversed ? scalePadding : 0);
                return fixNumericExtent([d0, d1], categoryAxis);
            }

            const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
            const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
            return fixNumericExtent([d0, d1], categoryAxis);
        } else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue').index;
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue').index;
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return fixNumericExtent(fixedYExtent);
        }
    }

    async createNodeData() {
        const {
            data,
            dataModel,
            groupScale,
            processedData,
            properties: { visible },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(data && visible && xAxis && yAxis && dataModel)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const { xKey, yLowKey, yHighKey, fill, stroke, strokeWidth } = this.properties;

        const itemId = `${yLowKey}-${yHighKey}`;

        const contexts: RangeBarContext[] = [];

        const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`).index;
        const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`).index;
        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        processedData?.data.forEach(({ keys, datum, values }, dataIndex) => {
            values.forEach((value, contextIndex) => {
                contexts[contextIndex] ??= {
                    itemId,
                    nodeData: [],
                    labelData: [],
                    scales: super.calculateScaling(),
                    visible: this.visible,
                };

                const xDatum = keys[xIndex];
                const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex));

                const rawLowValue = value[yLowIndex];
                const rawHighValue = value[yHighIndex];

                const yLowValue = Math.min(rawLowValue, rawHighValue);
                const yHighValue = Math.max(rawLowValue, rawHighValue);
                const yLow = Math.round(yScale.convert(yLowValue));
                const yHigh = Math.round(yScale.convert(yHighValue));

                const y = yHigh;
                const bottomY = yLow;
                const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));

                const rect: Bounds = {
                    x: barAlongX ? Math.min(y, bottomY) : x,
                    y: barAlongX ? x : Math.min(y, bottomY),
                    width: barAlongX ? barHeight : barWidth,
                    height: barAlongX ? barWidth : barHeight,
                };

                const nodeMidPoint = {
                    x: rect.x + rect.width / 2,
                    y: rect.y + rect.height / 2,
                };

                const labelData: RangeBarNodeDatum['labels'] = this.createLabelData({
                    rect,
                    barAlongX,
                    yLowValue,
                    yHighValue,
                    datum: datum[contextIndex],
                    series: this,
                });

                const nodeDatum: RangeBarNodeDatum = {
                    index: dataIndex,
                    series: this,
                    itemId,
                    datum: datum[contextIndex],
                    xValue: xDatum,
                    yLowValue: rawLowValue,
                    yHighValue: rawHighValue,
                    yLowKey,
                    yHighKey,
                    xKey,
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    midPoint: nodeMidPoint,
                    fill,
                    stroke,
                    strokeWidth,
                    opacity: 1,
                    labels: labelData,
                };

                contexts[contextIndex].nodeData.push(nodeDatum);
                contexts[contextIndex].labelData.push(...labelData);
            });
        });

        return contexts;
    }

    private createLabelData({
        rect,
        barAlongX,
        yLowValue,
        yHighValue,
        datum,
        series,
    }: {
        rect: Bounds;
        barAlongX: boolean;
        yLowValue: number;
        yHighValue: number;
        datum: any;
        series: RangeBarSeries;
    }): RangeBarNodeLabelDatum[] {
        const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, label } = this.properties;
        const labelParams = { datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName };

        const { placement, padding } = label;
        const paddingDirection = placement === 'outside' ? 1 : -1;
        const labelPadding = padding * paddingDirection;

        const yLowLabel: RangeBarNodeLabelDatum = {
            x: rect.x + (barAlongX ? -labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : rect.height + labelPadding),
            textAlign: barAlongX ? 'left' : 'center',
            textBaseline: barAlongX ? 'middle' : 'bottom',
            text: this.getLabelText(label, { itemId: 'low', value: yLowValue, ...labelParams }, (value) =>
                isNumber(value) ? value.toFixed(2) : ''
            ),
            itemId: 'low',
            datum,
            series,
        };
        const yHighLabel: RangeBarNodeLabelDatum = {
            x: rect.x + (barAlongX ? rect.width + labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : -labelPadding),
            textAlign: barAlongX ? 'right' : 'center',
            textBaseline: barAlongX ? 'middle' : 'top',
            text: this.getLabelText(label, { itemId: 'high', value: yHighValue, ...labelParams }, (value) =>
                isNumber(value) ? value.toFixed(2) : ''
            ),
            itemId: 'high',
            datum,
            series,
        };

        if (placement === 'outside') {
            yLowLabel.textAlign = barAlongX ? 'right' : 'center';
            yLowLabel.textBaseline = barAlongX ? 'middle' : 'top';

            yHighLabel.textAlign = barAlongX ? 'left' : 'center';
            yHighLabel.textBaseline = barAlongX ? 'middle' : 'bottom';
        }
        return [yLowLabel, yHighLabel];
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: RangeBarNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { id: seriesId, ctx } = this;
        const {
            yLowKey,
            yHighKey,
            highlightStyle: { item: itemHighlightStyle },
        } = this.properties;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp = checkCrisp(xAxis?.visibleRange);

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        datumSelection.each((rect, datum) => {
            const {
                fillOpacity,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
                formatter,
                shadow: fillShadow,
            } = this.properties;
            const style: _ModuleSupport.RectConfig = {
                fill: datum.fill,
                stroke: datum.stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                cornerRadius: this.properties.cornerRadius,
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig({
                datum,
                lowValue: datum.yLowValue,
                highValue: datum.yHighValue,
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                formatter,
                seriesId,
                itemId: datum.itemId,
                ctx,
                yLowKey,
                yHighKey,
            });
            config.crisp = crisp;
            config.visible = visible;
            updateRect({ rect, config });
        });
    }

    protected override getHighlightLabelData(
        labelData: RangeBarNodeLabelDatum[],
        highlightedItem: RangeBarNodeDatum
    ): RangeBarNodeLabelDatum[] | undefined {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }

    protected async updateLabelSelection(opts: {
        labelData: RangeBarNodeLabelDatum[];
        labelSelection: RangeBarAnimationData['labelSelections'][number];
    }) {
        const labelData = this.properties.label.enabled ? opts.labelData : [];
        return opts.labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, any> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.properties.label, datum);
        });
    }

    getTooltipHtml(nodeDatum: RangeBarNodeDatum): string {
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }

        const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, fill, strokeWidth, formatter, tooltip } =
            this.properties;
        const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;

        let format;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                xKey,
                yLowKey,
                yHighKey,
                fill,
                strokeWidth,
                highlighted: false,
                seriesId,
                itemId,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml(yAxis.formatDatum(yHighValue));

        const xSubheading = xName ?? xKey;
        const yLowSubheading = yLowName ?? yLowKey;
        const yHighSubheading = yHighName ?? yHighKey;

        const title = sanitizeHtml(yName);

        const content = yName
            ? `<b>${sanitizeHtml(xSubheading)}</b>: ${xString}<br>` +
              `<b>${sanitizeHtml(yLowSubheading)}</b>: ${yLowString}<br>` +
              `<b>${sanitizeHtml(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum,
            xKey,
            xName,
            yLowKey,
            yLowName,
            yHighKey,
            yHighName,
            yName,
            color,
            seriesId,
            itemId,
        });
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, visible } = this;

        if (legendType !== 'category') {
            return [];
        }

        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } =
            this.properties;
        const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;

        return [
            {
                legendType: 'category',
                id,
                itemId: `${yLowKey}-${yHighKey}`,
                seriesId: id,
                enabled: visible,
                label: { text: `${legendItemText}` },
                marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth },
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelections, labelSelections }: RangeBarAnimationData) {
        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'normal'));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }

    override animateWaitingUpdateReady(data: RangeBarAnimationData) {
        const { datumSelections, labelSelections } = data;
        const { processedData } = this;
        const dataDiff = processedData?.reduced?.diff;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'fade'));
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            datumSelections,
            fns,
            (_, datum) => createDatumId(datum.xValue),
            dataDiff
        );

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }

    private getDatumId(datum: RangeBarNodeDatum) {
        return `${datum.xValue}`;
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected override onDataChange() {}
}
