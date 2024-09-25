import type { AgTooltipRendererResult } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { FunnelConnector } from './funnelConnector';
import { FunnelProperties } from './funnelProperties';
import { prepareConnectorAnimationFunctions, resetConnectorSelectionsFn } from './funnelUtil';

const {
    SeriesNodePickMode,
    Layers,
    valueProperty,
    keyProperty,
    ChartAxisDirection,
    getRectConfig,
    updateRect,
    checkCrisp,
    updateLabelNode,
    SMALLEST_KEY_INTERVAL,
    LARGEST_KEY_INTERVAL,
    diff,
    prepareBarAnimationFunctions,
    midpointStartingBarPosition,
    resetBarSelectionsFn,
    fixNumericExtent,
    seriesLabelFadeInAnimation,
    resetMotion,
    resetLabelFn,
    animationValidation,
    createDatumId,
    isFiniteNumber,
    computeBarFocusBounds,
} = _ModuleSupport;
const { Group, Rect, Selection, PointerEvents, motion } = _Scene;
const { sanitizeHtml } = _Util;
const { ContinuousScale } = _Scale;

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type FunnelNodeLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};

interface FunnelNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<_Scene.Point> {
    readonly index: number;
    readonly valueIndex: number;
    readonly itemId: string;
    readonly width: number;
    readonly height: number;
    readonly label: FunnelNodeLabelDatum | undefined;
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
    readonly opacity: number;
    readonly clipBBox?: _Scene.BBox;
}

interface FunnelConnectorDatum {
    readonly datum: FunnelNodeDatum;
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    readonly x3: number;
    readonly y3: number;
    readonly fill: string;
    readonly stroke: string;
    readonly opacity: number;
}

interface FunnelContext extends _ModuleSupport.CartesianSeriesNodeDataContext<FunnelNodeDatum, FunnelNodeLabelDatum> {
    connectorData: FunnelConnectorDatum[];
}

interface FunnelAnimationData
    extends _ModuleSupport.CartesianAnimationData<_Scene.Rect, FunnelNodeDatum, FunnelNodeLabelDatum, FunnelContext> {}

class FunnelSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<FunnelNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: FunnelNodeDatum, series: FunnelSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yKey = series.properties.yKey;
    }
}

export class FunnelSeries extends _ModuleSupport.AbstractBarSeries<
    _Scene.Rect,
    FunnelProperties,
    FunnelNodeDatum,
    FunnelNodeLabelDatum,
    FunnelContext
> {
    static readonly className = 'FunnelSeries';
    static readonly type = 'funnel' as const;

    override properties = new FunnelProperties();

    protected override readonly NodeEvent = FunnelSeriesNodeEvent;

    private readonly connectorNodeGroup = this.contentGroup.appendChild(
        new Group({
            name: `${this.id}-series-connectorNodes`,
            zIndex: Layers.SERIES_LAYER_ZINDEX,
            zIndexSubOrder: this.getGroupZIndexSubOrder('data'),
        })
    );
    private connectorSelection = Selection.select<FunnelConnector, FunnelConnectorDatum>(this.connectorNodeGroup, () =>
        this.connectionFactory()
    );

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            directionKeys: {
                x: ['xKey'],
                y: ['yKey'],
            },
            directionNames: {
                x: ['xName'],
                y: ['yName'],
            },
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });

        this.connectorNodeGroup.pointerEvents = PointerEvents.None;
    }

    private connectionFactory() {
        return new FunnelConnector();
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        if (!this.properties.isValid()) {
            return;
        }

        const { xKey, yKey } = this.properties;

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const extraProps = [];
        if (!this.ctx.animationManager.isSkipped()) {
            if (this.processedData) {
                extraProps.push(diff(this.processedData));
            }
            extraProps.push(animationValidation());
        }

        const visibleProps = this.visible ? {} : { forceValue: 0 };
        const { processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: 'xValue' }),
                valueProperty(yKey, yScaleType, { id: `yValue`, ...visibleProps }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL, LARGEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: true,
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
        this.largestDataInterval = processedData.reduced?.largestKeyInterval;

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!processedData || !dataModel) return [];

        const {
            keys: [keys],
            values,
        } = processedData.domain;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                return keys;
            }
            return this.padBandExtent(keys);
        } else {
            const yIndex = dataModel.resolveProcessedDataIndexById(this, 'yValue');
            const yExtent = values[yIndex][1];
            const fixedYExtent = [-yExtent, yExtent];
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

        if (!(data && xAxis && yAxis && dataModel)) {
            return;
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const { xKey, yKey, fills, strokes, strokeWidth } = this.properties;

        const itemId = `${yKey}`;

        const context: FunnelContext = {
            itemId,
            nodeData: [],
            labelData: [],
            connectorData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
        };
        if (!visible) return context;

        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const yIndex = dataModel.resolveProcessedDataIndexById(this, `yValue`);

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const barOffset = ContinuousScale.is(xScale) ? barWidth * -0.5 : 0;

        interface ConnectorConfig {
            itemId: string;
            rect: Bounds;
            fill: string;
            stroke: string;
        }
        let previousConnection: ConnectorConfig | undefined;
        processedData?.data.forEach(({ keys, datum, values }, dataIndex) => {
            values.forEach((value, valueIndex) => {
                const xDatum = keys[xIndex];
                const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex)) + barOffset;

                const yDatum = value[yIndex];
                const yNegative = Math.round(yScale.convert(-yDatum));
                const yPositive = Math.round(yScale.convert(yDatum));

                const barHeight = Math.max(strokeWidth, Math.abs(yPositive - yNegative));

                const rect: Bounds = {
                    x: barAlongX ? Math.min(yPositive, yNegative) : x,
                    y: barAlongX ? x : Math.min(yPositive, yNegative),
                    width: barAlongX ? barHeight : barWidth,
                    height: barAlongX ? barWidth : barHeight,
                };

                const nodeMidPoint = {
                    x: rect.x + rect.width / 2,
                    y: rect.y + rect.height / 2,
                };

                const labelData: FunnelNodeDatum['label'] = this.createLabelData({
                    rect,
                    barAlongX,
                    yDatum,
                    datum: datum[valueIndex],
                    series: this,
                });

                const fill = fills[dataIndex % fills.length] ?? 'black';
                const stroke = strokes[dataIndex % strokes.length] ?? 'black';

                const nodeDatum: FunnelNodeDatum = {
                    index: dataIndex,
                    valueIndex,
                    series: this,
                    itemId,
                    datum: datum[valueIndex],
                    xValue: xDatum,
                    yValue: yDatum,
                    yKey,
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
                    label: labelData,
                };

                context.nodeData.push(nodeDatum);

                if (labelData != null) {
                    context.labelData.push(labelData);
                }

                if (previousConnection != null) {
                    const prevRect = previousConnection.rect;
                    if (barAlongX) {
                        context.connectorData.push({
                            datum: nodeDatum,
                            x0: prevRect.x,
                            y0: prevRect.y + prevRect.height,
                            x1: prevRect.x + prevRect.width,
                            y1: prevRect.y + prevRect.height,
                            x2: rect.x + rect.width,
                            y2: rect.y,
                            x3: rect.x,
                            y3: rect.y,
                            fill: previousConnection.fill,
                            stroke: previousConnection.stroke,
                            opacity: 1,
                        });
                    } else {
                        context.connectorData.push({
                            datum: nodeDatum,
                            x0: prevRect.x + prevRect.width,
                            y0: prevRect.y,
                            x1: rect.x,
                            y1: rect.y,
                            x2: rect.x,
                            y2: rect.y + rect.height,
                            x3: prevRect.x + prevRect.width,
                            y3: prevRect.y + prevRect.height,
                            fill: previousConnection.fill,
                            stroke: previousConnection.stroke,
                            opacity: 1,
                        });
                    }
                }

                previousConnection = { itemId, rect, fill, stroke };
            });
        });

        return context;
    }

    private createLabelData({
        rect,
        yDatum,
        datum,
        series,
    }: {
        rect: Bounds;
        barAlongX: boolean;
        yDatum: number;
        datum: any;
        series: FunnelSeries;
    }): FunnelNodeLabelDatum | undefined {
        const { xKey, yKey, xName, yName, legendItemName, label } = this.properties;

        if (rect.height < label.fontSize) return;

        const yLabel: FunnelNodeLabelDatum = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            textAlign: 'center',
            textBaseline: 'middle',
            text: this.getLabelText(
                label,
                { itemId: yKey, value: yDatum, legendItemName, datum, xKey, yKey, xName, yName },
                (v) => (isFiniteNumber(v) ? v.toFixed(0) : String(v))
            ),
            itemId: yKey,
            datum,
            series,
        };

        return yLabel;
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override async updateNodes(
        highlightedItems: FunnelNodeDatum[] | undefined,
        seriesHighlighted: boolean,
        anySeriesItemEnabled: boolean
    ): Promise<void> {
        await super.updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled);

        const { connectorSelection } = this;
        const connectorData = this.contextNodeData?.connectorData ?? [];
        this.connectorSelection = await this.updateConnectorSelection({ connectorSelection, connectorData });
        await this.updatConnectorNodes({ connectorSelection });
    }

    protected override async updateDatumSelection(opts: {
        nodeData: FunnelNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, FunnelNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, FunnelNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { id: seriesId, ctx } = this;
        const {
            yKey,
            highlightStyle: { item: itemHighlightStyle },
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
            const { fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset, itemStyler } = this.properties;
            const style: _ModuleSupport.RectConfig = {
                fill: datum.fill,
                stroke: datum.stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                cornerRadius: this.properties.cornerRadius,
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig({
                datum,
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                itemStyler,
                seriesId,
                ctx,
                yKey,
            });
            config.crisp = crisp;
            config.visible = visible;
            updateRect(rect, config);
        });
    }

    private async updateConnectorSelection(opts: {
        connectorData: FunnelConnectorDatum[];
        connectorSelection: _Scene.Selection<FunnelConnector, FunnelConnectorDatum>;
    }) {
        const enabled = this.properties.connector.enabled;
        const { connectorData, connectorSelection } = opts;
        return connectorSelection.update(enabled ? connectorData : [], undefined, (connector) =>
            this.getDatumId(connector.datum)
        );
    }

    private async updatConnectorNodes(opts: {
        connectorSelection: _Scene.Selection<FunnelConnector, FunnelConnectorDatum>;
    }) {
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.connector;

        opts.connectorSelection.each((connector, datum) => {
            connector.setProperties(resetConnectorSelectionsFn(connector, datum));
            connector.fill = fill ?? datum.fill;
            connector.fillOpacity = fillOpacity;
            connector.stroke = stroke ?? datum.stroke;
            connector.strokeOpacity = strokeOpacity;
            connector.strokeWidth = strokeWidth;
            connector.lineDash = lineDash;
            connector.lineDashOffset = lineDashOffset;
        });
    }

    protected override getHighlightLabelData(
        labelData: FunnelNodeLabelDatum[],
        highlightedItem: FunnelNodeDatum
    ): FunnelNodeLabelDatum[] | undefined {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }

    protected async updateLabelSelection(opts: {
        labelData: FunnelNodeLabelDatum[];
        labelSelection: FunnelAnimationData['labelSelection'];
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

    getTooltipHtml(nodeDatum: FunnelNodeDatum): _ModuleSupport.TooltipContent {
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;
        }

        const {
            xKey,
            yKey,
            xName,
            yName,
            strokeWidth,
            itemStyler,
            tooltip,
            fillOpacity,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            legendItemName,
        } = this.properties;
        const { datum, xValue, yValue, fill, stroke } = nodeDatum;

        let format;
        if (itemStyler) {
            format = callbackCache.call(itemStyler, {
                highlighted: false,
                seriesId,
                datum,
                xKey,
                yKey,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        const title = xString;
        const content = yString;

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        return tooltip.toTooltipHtml(defaults, {
            itemId: undefined,
            datum,
            xKey,
            xName,
            yKey,
            yName,
            color,
            seriesId,
            title,
            legendItemName,
        });
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, visible } = this;

        if (legendType !== 'category') {
            return [];
        }

        const {
            fills: [fill],
            strokes: [stroke],
            strokeWidth,
            fillOpacity,
            strokeOpacity,
            yName,
            yKey,
        } = this.properties;
        const legendItemText = yName ?? yKey;

        return [
            {
                legendType: 'category',
                id,
                itemId: yKey,
                seriesId: id,
                enabled: visible,
                label: { text: `${legendItemText}` },
                symbols: [{ marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } }],
            },
        ];
    }

    private resetConnectorAnimation(_data: FunnelAnimationData) {
        const { connectorSelection } = this;
        resetMotion([connectorSelection], resetConnectorSelectionsFn);
    }

    protected override resetAllAnimation(
        data: _ModuleSupport.CartesianAnimationData<_Scene.Rect, FunnelNodeDatum, FunnelNodeLabelDatum, FunnelContext>
    ): void {
        super.resetAllAnimation(data);

        this.resetConnectorAnimation(data);
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: FunnelAnimationData) {
        const { connectorSelection } = this;
        const isVertical = this.isVertical();
        const mode = 'normal';

        const barFns = prepareBarAnimationFunctions(midpointStartingBarPosition(isVertical, mode));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], barFns);

        const connectorFns = prepareConnectorAnimationFunctions(isVertical, mode);
        motion.fromToMotion(this.id, 'connectors', this.ctx.animationManager, [connectorSelection], connectorFns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    override animateWaitingUpdateReady(data: FunnelAnimationData) {
        const { datumSelection: datumSelections, labelSelection: labelSelections } = data;
        const { processedData } = this;
        const dataDiff = processedData?.reduced?.diff;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'fade'));
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [datumSelections],
            fns,
            (_, datum) => createDatumId(datum.xValue, datum.valueIndex),
            dataDiff
        );

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }

    private getDatumId(datum: FunnelNodeDatum) {
        return `${datum.xValue}-${datum.valueIndex}`;
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected override onDataChange() {}

    protected computeFocusBounds({ datumIndex, seriesRect }: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        return computeBarFocusBounds(this.contextNodeData?.nodeData[datumIndex], this.contentGroup, seriesRect);
    }
}
