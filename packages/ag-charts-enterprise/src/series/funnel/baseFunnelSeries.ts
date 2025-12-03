import {
    type AgFunnelSeriesLabelFormatterParams,
    type AgFunnelSeriesStyle,
    type TextOrSegments,
    _ModuleSupport,
} from 'ag-charts-community';
import type { DomainInput, Point, RequireOptional } from 'ag-charts-core';

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
    ContinuousScale,
    Group,
    Selection,
    PointerEvents,
    motion,
    checkCrisp,
    createDatumId,
} = _ModuleSupport;

export type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type FunnelNodeLabelDatum = Readonly<Point> & {
    datumIndex: number;
    text: TextOrSegments;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    visible: boolean;
};

export interface FunnelNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<Point> {
    readonly index: number;
    readonly itemId: string;
    readonly width: number;
    readonly height: number;
    readonly label: FunnelNodeLabelDatum | undefined;
    readonly visible: boolean;

    // Required for types
    readonly crisp: boolean;
    readonly opacity?: number;
    readonly clipBBox?: _ModuleSupport.BBox;
}

interface FunnelConnectorDatum {
    readonly datum: FunnelNodeDatum;
    readonly datumIndex: number;
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    readonly x3: number;
    readonly y3: number;
    readonly opacity: number;
}

interface FunnelContext extends _ModuleSupport.AbstractBarSeriesNodeDataContext<FunnelNodeDatum, FunnelNodeLabelDatum> {
    connectorData: FunnelConnectorDatum[];
}

export interface FunnelAnimationData<TNode extends _ModuleSupport.QuadtreeCompatibleNode>
    extends _ModuleSupport.CartesianAnimationData<TNode, FunnelNodeDatum, FunnelNodeLabelDatum, FunnelContext> {}

class FunnelSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<FunnelNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: FunnelNodeDatum, series: BaseFunnelSeries<any, object>) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.stageKey;
        this.yKey = series.properties.valueKey;
    }
}

export abstract class BaseFunnelSeries<
    TNode extends _ModuleSupport.QuadtreeCompatibleNode,
    TOpts extends object,
> extends _ModuleSupport.AbstractBarSeries<
    TNode,
    TOpts,
    BaseFunnelProperties<TOpts>,
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
            propertyKeys: {
                x: ['stageKey'],
                y: ['valueKey'],
            },
            propertyNames: {
                x: [],
                y: [],
            },
            categoryKey: 'xValue',
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: animationResetFns.datum,
                label: resetLabelFn,
            },
        });

        this.connectorNodeGroup.pointerEvents = PointerEvents.None;
    }

    override setZIndex(zIndex: number): boolean {
        super.setZIndex(zIndex);

        this.connectorNodeGroup.zIndex = [SeriesZIndexMap.BACKGROUND, zIndex];

        return true;
    }

    protected override isVertical(): boolean {
        return !super.isVertical();
    }

    protected abstract connectorEnabled(): boolean;

    protected abstract connectorStyle(index: number): RequireOptional<AgFunnelSeriesStyle> & { opacity: number };

    private connectionFactory() {
        return new FunnelConnector();
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { stageKey, valueKey } = this.properties;
        const { visible, id: seriesId } = this;

        const validation = (_value: unknown, _datum: unknown, index: number) =>
            visible && this.ctx.legendManager.getItemEnabled({ seriesId, itemId: index });

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const extraProps = [];
        if (this.needsDataModelDiff() && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (!this.ctx.animationManager.isSkipped()) {
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

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): DomainInput<any> {
        const {
            processedData,
            dataModel,
            id: seriesId,
            ctx: { legendManager },
        } = this;
        if (!processedData || !dataModel) return { domain: [] };

        const {
            keys: [keys],
        } = processedData.domain;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                if (!this.hasData) return { domain: [] };
                const domain = keys.filter((_key, index) => legendManager.getItemEnabled({ seriesId, itemId: index }));
                const sortMetadata = dataModel.getKeySortMetadata(this, 'xValue', processedData);
                return { domain, sortMetadata };
            }
            return { domain: this.padBandExtent(keys) };
        } else {
            const yExtent = this.domainForClippedRange(direction, ['yValue'], 'xValue');
            const maxExtent = Math.max(...yExtent);
            const fixedYExtent = [-maxExtent, maxExtent];
            return { domain: fixNumericExtent(fixedYExtent) };
        }
    }

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [Number.NaN, Number.NaN];
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

        if (!(hasData && data && xAxis && yAxis && dataModel && processedData?.type === 'ungrouped')) {
            return;
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const { stageKey, valueKey } = this.properties;

        const itemId = `${valueKey}`;

        const context: FunnelContext = {
            itemId,
            nodeData: [],
            labelData: [],
            connectorData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.groupScale),
            visible: this.visible,
        };

        const isVisible = this.visible;
        if (!isVisible) return context;

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData);

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const barOffset = ContinuousScale.is(xScale) ? barWidth * -0.5 : 0;

        const crisp = checkCrisp(
            xAxis?.scale,
            xAxis?.visibleRange,
            this.smallestDataInterval,
            this.largestDataInterval
        );

        interface ConnectorConfig {
            itemId: string;
            rect: Bounds;
            nodeDatum: FunnelNodeDatum;
            datumIndex: number;
        }
        let previousConnection: ConnectorConfig | undefined;
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        for (const [datumIndex, datum] of rawData.entries()) {
            const visible = isVisible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex });

            const xDatum = xValues[datumIndex];
            if (xDatum == null) continue;

            const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex)) + barOffset;

            const yDatum = yValues[datumIndex];
            const yNegative = Math.round(yScale.convert(-yDatum));
            const yPositive = Math.round(yScale.convert(yDatum));

            const style = this.getItemStyle({ datum, datumIndex }, false);

            const barHeight = Math.max(style.strokeWidth ?? 0, Math.abs(yPositive - yNegative));

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
                datumIndex,
                rect,
                barAlongX,
                yDatum,
                datum,
                visible,
            });

            const nodeDatum: FunnelNodeDatum = {
                index: datumIndex,
                series: this,
                itemId,
                datum,
                datumIndex,
                xValue: xDatum,
                yValue: yDatum,
                xKey: stageKey,
                yKey: valueKey,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                midPoint: nodeMidPoint,
                crisp,
                label: labelData,
                visible,
            };

            context.nodeData.push(nodeDatum);

            if (labelData != null) {
                context.labelData.push(labelData);
            }

            if (previousConnection != null) {
                const prevRect = previousConnection.rect;
                const startNodeDatum = previousConnection.nodeDatum;
                const startDatumIndex = previousConnection.datumIndex;
                if (barAlongX) {
                    context.connectorData.push({
                        datum: startNodeDatum,
                        datumIndex: startDatumIndex,
                        x0: prevRect.x,
                        y0: prevRect.y + prevRect.height,
                        x1: prevRect.x + prevRect.width,
                        y1: prevRect.y + prevRect.height,
                        x2: rect.x + rect.width,
                        y2: rect.y,
                        x3: rect.x,
                        y3: rect.y,
                        opacity: 1,
                    });
                } else {
                    context.connectorData.push({
                        datum: startNodeDatum,
                        datumIndex: startDatumIndex,
                        x0: prevRect.x + prevRect.width,
                        y0: prevRect.y,
                        x1: rect.x,
                        y1: rect.y,
                        x2: rect.x,
                        y2: rect.y + rect.height,
                        x3: prevRect.x + prevRect.width,
                        y3: prevRect.y + prevRect.height,
                        opacity: 1,
                    });
                }
            }

            if (visible) {
                previousConnection = {
                    itemId,
                    rect,
                    nodeDatum,
                    datumIndex: datumIndex,
                };
            }
        }

        return context;
    }

    protected abstract getItemStyle(
        _: Partial<FunnelNodeDatum>,
        _isHighlight: boolean
    ): RequireOptional<AgFunnelSeriesStyle>;

    protected abstract createLabelData({
        datumIndex,
        rect,
        yDatum,
        datum,
    }: {
        datumIndex: number;
        rect: Bounds;
        barAlongX: boolean;
        yDatum: number;
        datum: any;
        visible: boolean;
    }): FunnelNodeLabelDatum | undefined;

    protected override updateNodes(seriesHighlighted: boolean, nodeRefresh: boolean) {
        super.updateNodes(seriesHighlighted, nodeRefresh);

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
        const fillBBox = this.getShapeFillBBox();

        opts.connectorSelection.each((connector, datum) => {
            const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
                this.connectorStyle(datum.datumIndex);

            connector.setProperties(resetConnectorSelectionsFn(connector, datum));

            connector.setStyleProperties(
                {
                    fill,
                    stroke,
                    fillOpacity,
                    strokeOpacity,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                },
                fillBBox
            );
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: FunnelNodeLabelDatum[];
        labelSelection: FunnelAnimationData<TNode>['labelSelection'];
    }) {
        const labelData = this.properties.label.enabled ? opts.labelData : [];
        return opts.labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, FunnelNodeLabelDatum>;
        isHighlight?: boolean;
    }) {
        const params: RequireOptional<AgFunnelSeriesLabelFormatterParams> = {
            stageKey: this.properties.stageKey,
            valueKey: this.properties.valueKey,
        };
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const { isHighlight = false, labelSelection } = opts;
        labelSelection.each((textNode, datum) => {
            const highlightStyle = this.getHighlightStyle(isHighlight, datum.datumIndex);
            textNode.visible = datum.visible || isHighlight;
            textNode.fillOpacity = highlightStyle.opacity ?? 1;
            textNode.opacity = highlightStyle.opacity ?? 1;
            updateLabelNode(this, textNode, params, this.properties.label, datum, isHighlight, activeHighlight);
        });
    }

    protected override getHighlightLabelData(
        _labelData: FunnelNodeLabelDatum[],
        highlightedItem: FunnelNodeDatum
    ): FunnelNodeLabelDatum[] | undefined {
        if (highlightedItem.label) {
            return [{ ...highlightedItem.label }];
        }

        return undefined;
    }

    protected abstract tooltipStyle(datum: any, datumIndex: number): Required<AgFunnelSeriesStyle>;

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { stageKey, valueKey, tooltip, legendItemName } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveKeysById(this, 'xValue', processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];

        if (xValue == null) return;

        return this.formatTooltipWithContext(
            tooltip,
            {
                symbol: this.legendItemSymbol(datumIndex),
                data: [
                    {
                        label: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, stageKey, legendItemName),
                        value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, valueKey, legendItemName),
                    },
                ],
            },
            { seriesId, datum, title: stageKey, stageKey, valueKey, ...this.tooltipStyle(datum, datumIndex) }
        );
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
        return createDatumId(datum.xValue);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex]);
    }

    private legendItemSymbol(datumIndex: number): _ModuleSupport.LegendSymbolOptions {
        const { strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset, fill, stroke } =
            this.properties.getStyle(datumIndex);

        return {
            marker: {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            id: seriesId,
            processedData,
            dataModel,
            ctx: { legendManager },
            visible,
        } = this;

        if (!dataModel || !processedData || legendType !== 'category') {
            return [];
        }

        const { showInLegend } = this.properties;

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);

        return (processedData.dataSources.get(this.id)?.data ?? [])
            .map((datum, datumIndex): _ModuleSupport.CategoryLegendDatum | undefined => {
                const stageValue = xValues[datumIndex];
                if (stageValue == null) return;

                return {
                    legendType: 'category',
                    id: seriesId,
                    datum,
                    itemId: datumIndex,
                    seriesId,
                    enabled: visible && legendManager.getItemEnabled({ seriesId, itemId: datumIndex }),
                    label: { text: String(stageValue) },
                    symbol: this.legendItemSymbol(datumIndex),
                    skipAnimations: true,
                    hideInLegend: !showInLegend,
                };
            })
            .filter((datum): datum is _ModuleSupport.CategoryLegendDatum => datum != null);
    }

    protected override hasItemStylers(): boolean {
        return this.properties.itemStyler != null || this.properties.label.itemStyler != null;
    }
}
