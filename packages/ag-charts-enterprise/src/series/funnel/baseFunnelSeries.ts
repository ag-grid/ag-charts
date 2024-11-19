import type { AgTooltipRendererResult } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import type { BaseFunnelProperties } from './baseFunnelSeriesProperties';
import { FunnelConnector } from './funnelConnector';
import { prepareConnectorAnimationFunctions, resetConnectorSelectionsFn } from './funnelUtil';

const {
    SeriesNodePickMode,
    SeriesZIndexMap,
    valueProperty,
    keyProperty,
    ChartAxisDirection,
    updateLabelNode,
    SMALLEST_KEY_INTERVAL,
    LARGEST_KEY_INTERVAL,
    diff,
    fixNumericExtent,
    seriesLabelFadeInAnimation,
    resetMotion,
    resetLabelFn,
    animationValidation,
    computeBarFocusBounds,
    sanitizeHtml,
    createDatumId,
    ContinuousScale,
    Group,
    Selection,
    PointerEvents,
    motion,
} = _ModuleSupport;

export type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type FunnelNodeLabelDatum = Readonly<_ModuleSupport.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    visible: boolean;
};

export interface FunnelNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<_ModuleSupport.Point> {
    readonly index: number;
    readonly itemId: string;
    readonly width: number;
    readonly height: number;
    readonly label: FunnelNodeLabelDatum | undefined;
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
    readonly opacity: number;
    readonly clipBBox?: _ModuleSupport.BBox;
    readonly visible: boolean;
}

export interface FunnelConnectorDatum {
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

export interface FunnelContext
    extends _ModuleSupport.CartesianSeriesNodeDataContext<FunnelNodeDatum, FunnelNodeLabelDatum> {
    connectorData: FunnelConnectorDatum[];
}

export interface FunnelAnimationData<TNode extends _ModuleSupport.QuadtreeCompatibleNode>
    extends _ModuleSupport.CartesianAnimationData<TNode, FunnelNodeDatum, FunnelNodeLabelDatum, FunnelContext> {}

class FunnelSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<FunnelNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: FunnelNodeDatum, series: BaseFunnelSeries<any>) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.stageKey;
        this.yKey = series.properties.valueKey;
    }
}

export interface FunnelSeriesShapeStyle {
    fill: string | undefined;
    fillOpacity: number;
    stroke: string | undefined;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
}

export abstract class BaseFunnelSeries<
    TNode extends _ModuleSupport.QuadtreeCompatibleNode,
> extends _ModuleSupport.AbstractBarSeries<
    TNode,
    BaseFunnelProperties<any>,
    FunnelNodeDatum,
    FunnelNodeLabelDatum,
    FunnelContext
> {
    // @ts-expect-error xKey/yKey renamed
    protected override readonly NodeEvent = FunnelSeriesNodeEvent;

    protected readonly connectorNodeGroup = this.contentGroup.appendChild(
        new Group({
            name: `${this.id}-series-connectorNodes`,
            zIndex: SeriesZIndexMap.BACKGROUND,
        })
    );
    protected connectorSelection = Selection.select<FunnelConnector, FunnelConnectorDatum>(
        this.connectorNodeGroup,
        () => this.connectionFactory()
    );

    override get pickModeAxis() {
        return 'main-category' as const;
    }

    constructor({
        moduleCtx,
        animationResetFns,
    }: {
        moduleCtx: _ModuleSupport.ModuleContext;
        animationResetFns: {
            datum: (node: TNode, datum: FunnelNodeDatum) => _ModuleSupport.AnimationValue & Partial<TNode>;
        };
    }) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.AXIS_ALIGNED, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            directionKeys: {
                x: ['stageKey'],
                y: ['valueKey'],
            },
            directionNames: {
                x: [],
                y: [],
            },
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: animationResetFns.datum,
                label: resetLabelFn,
            },
        });

        this.connectorNodeGroup.pointerEvents = PointerEvents.None;
    }

    override setSeriesIndex(index: number): boolean {
        if (!super.setSeriesIndex(index)) return false;

        this.connectorNodeGroup.zIndex = [SeriesZIndexMap.BACKGROUND, index];

        return true;
    }

    protected override isVertical(): boolean {
        return !super.isVertical();
    }

    protected abstract connectorEnabled(): boolean;

    protected abstract barStyle(): FunnelSeriesShapeStyle;

    protected abstract connectorStyle(): FunnelSeriesShapeStyle;

    private connectionFactory() {
        return new FunnelConnector();
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        if (!this.properties.isValid()) {
            return;
        }

        const { stageKey, valueKey } = this.properties;

        const { visible, id: seriesId } = this;

        const validation = (_value: unknown, _datum: unknown, index: number) =>
            visible && this.ctx.legendManager.getItemEnabled({ seriesId, itemId: index });

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const extraProps = [];
        if (!this.ctx.animationManager.isSkipped()) {
            if (this.processedData) {
                extraProps.push(diff(this.id, this.processedData));
            }
            extraProps.push(animationValidation());
        }

        const visibleProps = this.visible ? {} : { forceValue: 0 };
        const { processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(stageKey, xScaleType, { id: 'xValue' }),
                valueProperty(valueKey, yScaleType, { id: `yValue`, ...visibleProps, validation, invalidValue: 0 }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL, LARGEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: false,
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
        this.largestDataInterval = processedData.reduced?.largestKeyInterval;

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const {
            processedData,
            dataModel,
            id: seriesId,
            ctx: { legendManager },
        } = this;
        if (!processedData || !dataModel) return [];

        const {
            keys: [keys],
            values,
        } = processedData.domain;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                if (!this.hasData) return [];
                return keys.filter((_key, index) => legendManager.getItemEnabled({ seriesId, itemId: index }));
            }
            return this.padBandExtent(keys);
        } else {
            const yIndex = dataModel.resolveProcessedDataIndexById(this, 'yValue');
            const yExtent = values[yIndex][1];
            const fixedYExtent = [-yExtent, yExtent];
            return fixNumericExtent(fixedYExtent);
        }
    }

    override createNodeData() {
        const {
            hasData,
            data,
            dataModel,
            groupScale,
            processedData,
            id: seriesId,
            ctx: { legendManager },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (
            !(
                hasData &&
                data &&
                xAxis &&
                yAxis &&
                dataModel &&
                processedData?.type === 'ungrouped' &&
                processedData.rawData.length !== 0
            )
        ) {
            return;
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const { stageKey, valueKey, fills, strokes } = this.properties;
        const { strokeWidth } = this.barStyle();

        const itemId = `${valueKey}`;

        const context: FunnelContext = {
            itemId,
            nodeData: [],
            labelData: [],
            connectorData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
        };

        const isVisible = this.visible && this.properties.visible;
        if (!isVisible) return context;

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData);

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const barOffset = ContinuousScale.is(xScale) ? barWidth * -0.5 : 0;

        interface ConnectorConfig {
            itemId: string;
            rect: Bounds;
            fill: string;
            stroke: string;
        }
        let previousConnection: ConnectorConfig | undefined;
        processedData.rawData.forEach((datum, datumIndex) => {
            const visible = isVisible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex });

            const xDatum = xValues[datumIndex];
            if (xDatum == null) return;

            const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex)) + barOffset;

            const yDatum = yValues[datumIndex];
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
                datum,
                visible,
            });

            const fill = fills[datumIndex % fills.length] ?? 'black';
            const stroke = strokes[datumIndex % strokes.length] ?? 'black';

            const nodeDatum: FunnelNodeDatum = {
                index: datumIndex,
                series: this,
                itemId,
                datum,
                xValue: xDatum,
                yValue: yDatum,
                xKey: stageKey,
                yKey: valueKey,
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
                visible,
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

            if (visible) {
                previousConnection = { itemId, rect, fill, stroke };
            }
        });

        return context;
    }

    protected abstract createLabelData({
        rect,
        yDatum,
        datum,
    }: {
        rect: Bounds;
        barAlongX: boolean;
        yDatum: number;
        datum: any;
        visible: boolean;
    }): FunnelNodeLabelDatum | undefined;

    protected override updateNodes(
        highlightedItems: FunnelNodeDatum[] | undefined,
        seriesHighlighted: boolean,
        anySeriesItemEnabled: boolean
    ) {
        super.updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled);

        const { connectorSelection } = this;
        const connectorData = this.contextNodeData?.connectorData ?? [];
        this.connectorSelection = this.updateConnectorSelection({ connectorSelection, connectorData });
        this.updateConnectorNodes({ connectorSelection });
    }

    protected override updateDatumSelection(opts: {
        nodeData: FunnelNodeDatum[];
        datumSelection: _ModuleSupport.Selection<TNode, FunnelNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
    }

    private updateConnectorSelection(opts: {
        connectorData: FunnelConnectorDatum[];
        connectorSelection: _ModuleSupport.Selection<FunnelConnector, FunnelConnectorDatum>;
    }) {
        const { connectorData, connectorSelection } = opts;
        return connectorSelection.update(this.connectorEnabled() ? connectorData : [], undefined, (connector) =>
            this.getDatumId(connector.datum)
        );
    }

    private updateConnectorNodes(opts: {
        connectorSelection: _ModuleSupport.Selection<FunnelConnector, FunnelConnectorDatum>;
    }) {
        const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.connectorStyle();

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

    protected updateLabelSelection(opts: {
        labelData: FunnelNodeLabelDatum[];
        labelSelection: FunnelAnimationData<TNode>['labelSelection'];
    }) {
        const labelData = this.properties.label.enabled ? opts.labelData : [];
        return opts.labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected updateLabelNodes(opts: { labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.properties.label, datum);
        });
    }

    getTooltipHtml(nodeDatum: FunnelNodeDatum): _ModuleSupport.TooltipContent {
        const { id: seriesId } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;
        }

        const { stageKey, valueKey, itemStyler, tooltip } = this.properties;
        const { strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset } = this.barStyle();
        const { datum, xValue, yValue, fill, stroke } = nodeDatum;

        let format;
        if (itemStyler) {
            format = this.cachedDatumCallback(createDatumId(datum.index, 'tooltip'), () =>
                itemStyler({
                    highlighted: false,
                    seriesId,
                    datum,
                    stageKey,
                    valueKey,
                    fill,
                    fillOpacity,
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                })
            );
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
            stageKey,
            valueKey,
            color,
            seriesId,
            title,
        });
    }

    protected override resetAllAnimation(
        data: _ModuleSupport.CartesianAnimationData<TNode, FunnelNodeDatum, FunnelNodeLabelDatum, FunnelContext>
    ): void {
        super.resetAllAnimation(data);

        resetMotion([this.connectorSelection], resetConnectorSelectionsFn);
    }

    override animateEmptyUpdateReady({ labelSelection }: FunnelAnimationData<TNode>) {
        const { connectorSelection } = this;
        const isVertical = this.isVertical();
        const mode = 'normal';

        const connectorFns = prepareConnectorAnimationFunctions(isVertical, mode);
        motion.fromToMotion(this.id, 'connectors', this.ctx.animationManager, [connectorSelection], connectorFns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    override animateWaitingUpdateReady(data: FunnelAnimationData<TNode>) {
        const { labelSelection: labelSelections } = data;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }

    private getDatumId(datum: FunnelNodeDatum) {
        return `${datum.xValue}`;
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({
        datumIndex,
        seriesRect,
    }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this.contextNodeData?.nodeData[datumIndex], this.contentGroup, seriesRect);
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            id: seriesId,
            processedData,
            dataModel,
            ctx: { legendManager },
            visible,
        } = this;

        if (!dataModel || !processedData || legendType !== 'category' || !this.properties.isValid()) {
            return [];
        }

        const { strokeWidth, fillOpacity, strokeOpacity } = this.barStyle();
        const { fills, strokes, showInLegend } = this.properties;

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);

        return processedData.rawData
            .map((_datum, datumIndex): _ModuleSupport.CategoryLegendDatum | undefined => {
                const stageValue = xValues[datumIndex];
                if (stageValue == null) return;

                const fill = fills[datumIndex % fills.length] ?? 'black';
                const stroke = strokes[datumIndex % strokes.length] ?? 'black';

                return {
                    legendType: 'category',
                    id: seriesId,
                    itemId: datumIndex,
                    seriesId,
                    enabled: visible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex }),
                    label: { text: stageValue },
                    symbols: [{ marker: { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } }],
                    skipAnimations: true,
                    hideInLegend: !showInLegend,
                };
            })
            .filter((datum): datum is _ModuleSupport.CategoryLegendDatum => datum != null);
    }
}
