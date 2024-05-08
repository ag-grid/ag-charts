import type { AgWaterfallSeriesItemType } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import type { WaterfallSeriesItem, WaterfallSeriesTotal } from './waterfallSeriesProperties';
import { WaterfallSeriesProperties } from './waterfallSeriesProperties';

const {
    adjustLabelPlacement,
    SeriesNodePickMode,
    fixNumericExtent,
    valueProperty,
    keyProperty,
    accumulativeValueProperty,
    trailingAccumulatedValueProperty,
    ChartAxisDirection,
    getRectConfig,
    updateRect,
    checkCrisp,
    updateLabelNode,
    prepareBarAnimationFunctions,
    collapsedStartingBarPosition,
    resetBarSelectionsFn,
    seriesLabelFadeInAnimation,
    resetLabelFn,
    animationValidation,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
    isFiniteNumber,
    computeBarFocusBounds,
} = _ModuleSupport;
const { Rect, motion } = _Scene;
const { sanitizeHtml, isContinuous } = _Util;
const { ContinuousScale } = _Scale;

type WaterfallNodeLabelDatum = Readonly<_Scene.Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
};

type WaterfallNodePointDatum = _ModuleSupport.SeriesNodeDatum['point'] & {
    readonly x2: number;
    readonly y2: number;
};

interface WaterfallNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<_Scene.Point> {
    readonly index: number;
    readonly itemId: AgWaterfallSeriesItemType;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly label: WaterfallNodeLabelDatum;
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
    readonly opacity: number;
    readonly clipBBox?: _Scene.BBox;
}

interface WaterfallContext extends _ModuleSupport.CartesianSeriesNodeDataContext<WaterfallNodeDatum> {
    pointData?: WaterfallNodePointDatum[];
}

type WaterfallAnimationData = _ModuleSupport.CartesianAnimationData<
    _Scene.Rect,
    WaterfallNodeDatum,
    WaterfallNodeDatum,
    WaterfallContext
>;

export class WaterfallSeries extends _ModuleSupport.AbstractBarSeries<
    _Scene.Rect,
    WaterfallSeriesProperties,
    WaterfallNodeDatum,
    WaterfallNodeDatum,
    WaterfallContext
> {
    static readonly className = 'WaterfallSeries';
    static readonly type = 'waterfall' as const;

    override properties = new WaterfallSeriesProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
            pathsZIndexSubOrderOffset: [-1, -1],
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    private seriesItemTypes: Set<AgWaterfallSeriesItemType> = new Set(['positive', 'negative', 'total']);

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yKey, totals } = this.properties;
        const { data = [] } = this;

        if (!this.properties.isValid() || !this.visible) return;

        const positiveNumber = (v: any) => {
            return isContinuous(v) && Number(v) >= 0;
        };

        const negativeNumber = (v: any) => {
            return isContinuous(v) && Number(v) < 0;
        };

        const totalTypeValue = (v: any) => {
            return v === 'total' || v === 'subtotal';
        };

        const propertyDefinition = {
            missingValue: undefined,
            invalidValue: undefined,
        };

        const dataWithTotals: any[] = [];

        const totalsMap = totals.reduce<Map<number, WaterfallSeriesTotal[]>>((result, total) => {
            const totalsAtIndex = result.get(total.index);
            if (totalsAtIndex) {
                totalsAtIndex.push(total);
            } else {
                result.set(total.index, [total]);
            }
            return result;
        }, new Map());

        data.forEach((datum, i) => {
            dataWithTotals.push(datum);
            // Use the `toString` method to make the axis labels unique as they're used as categories in the axis scale domain.
            // Add random id property as there is caching for the axis label formatter result. If the label object is not unique, the axis label formatter will not be invoked.
            totalsMap.get(i)?.forEach((total) => dataWithTotals.push({ ...total.toJson(), [xKey]: total.axisLabel }));
        });

        const extraProps = [];

        if (!this.ctx.animationManager.isSkipped()) {
            extraProps.push(animationValidation());
        }

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const { processedData } = await this.requestDataModel<any, any, true>(dataController, dataWithTotals, {
            props: [
                keyProperty(xKey, xScaleType, { id: `xValue` }),
                accumulativeValueProperty(yKey, yScaleType, {
                    ...propertyDefinition,
                    id: `yCurrent`,
                }),
                accumulativeValueProperty(yKey, yScaleType, {
                    ...propertyDefinition,
                    missingValue: 0,
                    id: `yCurrentTotal`,
                }),
                accumulativeValueProperty(yKey, yScaleType, {
                    ...propertyDefinition,
                    id: `yCurrentPositive`,
                    validation: positiveNumber,
                }),
                accumulativeValueProperty(yKey, yScaleType, {
                    ...propertyDefinition,
                    id: `yCurrentNegative`,
                    validation: negativeNumber,
                }),
                trailingAccumulatedValueProperty(yKey, yScaleType, {
                    ...propertyDefinition,
                    id: `yPrevious`,
                }),
                valueProperty(yKey, yScaleType, { id: `yRaw` }), // Raw value pass-through.
                valueProperty('totalType', 'band', {
                    id: `totalTypeValue`,
                    missingValue: undefined,
                    validation: totalTypeValue,
                }),
                ...(isContinuousX ? [_ModuleSupport.SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;

        this.updateSeriesItemTypes();

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel, smallestDataInterval } = this;
        if (!processedData || !dataModel) return [];

        const {
            keys: [keys],
            values,
        } = processedData.domain;

        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);

        if (direction === this.getCategoryDirection()) {
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                return keys;
            }

            const scalePadding = isFiniteNumber(smallestDataInterval) ? smallestDataInterval : 0;
            const keysExtent = _ModuleSupport.extent(keys) ?? [NaN, NaN];

            const categoryAxis = this.getCategoryAxis();
            const isReversed = Boolean(categoryAxis?.isReversed());
            const isDirectionY = direction === ChartAxisDirection.Y;

            const padding0 = isReversed === isDirectionY ? 0 : -scalePadding;
            const padding1 = isReversed === isDirectionY ? scalePadding : 0;

            const d0 = keysExtent[0] + padding0;
            const d1 = keysExtent[1] + padding1;

            return fixNumericExtent([d0, d1], categoryAxis);
        } else {
            const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent');
            const yExtent = values[yCurrIndex];
            const fixedYExtent = [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])];
            return fixNumericExtent(fixedYExtent);
        }
    }

    async createNodeData() {
        const { data, dataModel, smallestDataInterval } = this;
        const { line } = this.properties;
        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();

        if (!(data && categoryAxis && valueAxis && dataModel)) {
            return;
        }

        const xScale = categoryAxis.scale;
        const yScale = valueAxis.scale;

        const categoryAxisReversed = categoryAxis.isReversed();

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

        const barWidth =
            (ContinuousScale.is(xScale) ? xScale.calcBandwidth(smallestDataInterval) : xScale.bandwidth) ?? 10;

        if (this.processedData?.type !== 'ungrouped') {
            return;
        }

        const context: WaterfallContext = {
            itemId: this.properties.yKey,
            nodeData: [],
            labelData: [],
            pointData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
        };
        if (!this.visible) return context;

        const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yRaw`);
        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`);

        const pointData: WaterfallNodePointDatum[] = [];

        const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent');
        const yPrevIndex = dataModel.resolveProcessedDataIndexById(this, 'yPrevious');
        const yCurrTotalIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentTotal');

        function getValues(
            isTotal: boolean,
            isSubtotal: boolean,
            values: any[]
        ): { cumulativeValue: number | undefined; trailingValue: number | undefined } {
            if (isTotal || isSubtotal) {
                return {
                    cumulativeValue: values[yCurrTotalIndex],
                    trailingValue: isSubtotal ? trailingSubtotal : 0,
                };
            }

            return {
                cumulativeValue: values[yCurrIndex],
                trailingValue: values[yPrevIndex],
            };
        }

        function getValue(
            isTotal: boolean,
            isSubtotal: boolean,
            rawValue?: number,
            cumulativeValue?: number,
            trailingValue?: number
        ) {
            if (isTotal) {
                return cumulativeValue;
            }
            if (isSubtotal) {
                return (cumulativeValue ?? 0) - (trailingValue ?? 0);
            }
            return rawValue;
        }

        let trailingSubtotal = 0;
        const { xKey, yKey, xName, yName } = this.properties;

        this.processedData?.data.forEach(({ keys, datum, values }, dataIndex) => {
            const datumType = values[totalTypeIndex];

            const isSubtotal = this.isSubtotal(datumType);
            const isTotal = this.isTotal(datumType);
            const isTotalOrSubtotal = isTotal || isSubtotal;

            const xDatum = keys[xIndex];
            const x = Math.round(xScale.convert(xDatum));

            const rawValue = values[yRawIndex];

            const { cumulativeValue, trailingValue } = getValues(isTotal, isSubtotal, values);

            if (isTotalOrSubtotal) {
                trailingSubtotal = cumulativeValue ?? 0;
            }

            const currY = Math.round(yScale.convert(cumulativeValue));
            const trailY = Math.round(yScale.convert(trailingValue));

            const value = getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue);
            const isPositive = (value ?? 0) >= 0;

            const seriesItemType = this.getSeriesItemType(isPositive, datumType);
            const { fill, stroke, strokeWidth, label } = this.getItemConfig(seriesItemType);

            const y = isPositive ? currY : trailY;
            const bottomY = isPositive ? trailY : currY;
            const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));

            const rect = {
                x: barAlongX ? Math.min(y, bottomY) : x,
                y: barAlongX ? x : Math.min(y, bottomY),
                width: barAlongX ? barHeight : barWidth,
                height: barAlongX ? barWidth : barHeight,
            };

            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const pointY = isTotalOrSubtotal ? currY : trailY;
            const pixelAlignmentOffset = (Math.floor(line.strokeWidth) % 2) / 2;

            const startY = categoryAxisReversed ? currY : pointY;
            const stopY = categoryAxisReversed ? pointY : currY;

            let startCoordinates: { x: number; y: number };
            let stopCoordinates: { x: number; y: number };
            if (barAlongX) {
                startCoordinates = {
                    x: startY + pixelAlignmentOffset,
                    y: rect.y,
                };
                stopCoordinates = {
                    x: stopY + pixelAlignmentOffset,
                    y: rect.y + rect.height,
                };
            } else {
                startCoordinates = {
                    x: rect.x,
                    y: startY + pixelAlignmentOffset,
                };
                stopCoordinates = {
                    x: rect.x + rect.width,
                    y: stopY + pixelAlignmentOffset,
                };
            }

            const pathPoint = {
                // lineTo
                x: categoryAxisReversed ? stopCoordinates.x : startCoordinates.x,
                y: categoryAxisReversed ? stopCoordinates.y : startCoordinates.y,
                // moveTo
                x2: categoryAxisReversed ? startCoordinates.x : stopCoordinates.x,
                y2: categoryAxisReversed ? startCoordinates.y : stopCoordinates.y,
                size: 0,
            };

            pointData.push(pathPoint);

            const labelText = this.getLabelText(
                label,
                {
                    itemId: seriesItemType === 'subtotal' ? 'total' : seriesItemType,
                    value,
                    datum,
                    xKey,
                    yKey,
                    xName,
                    yName,
                },
                (v) => (isFiniteNumber(v) ? v.toFixed(2) : String(v))
            );

            const nodeDatum: WaterfallNodeDatum = {
                index: dataIndex,
                series: this,
                itemId: seriesItemType,
                datum,
                cumulativeValue: cumulativeValue ?? 0,
                xValue: xDatum,
                yValue: value,
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
                label: {
                    text: labelText,
                    ...adjustLabelPlacement({
                        isPositive: (value ?? -1) >= 0,
                        isVertical: !barAlongX,
                        placement: label.placement,
                        padding: label.padding,
                        rect,
                    }),
                },
            };

            context.nodeData.push(nodeDatum);
            context.labelData.push(nodeDatum);
        });

        const connectorLinesEnabled = this.properties.line.enabled;
        if (yCurrIndex !== undefined && connectorLinesEnabled) {
            context.pointData = pointData;
        }

        return context;
    }

    private updateSeriesItemTypes() {
        const { dataModel, seriesItemTypes, processedData } = this;

        if (!dataModel || !processedData) {
            return;
        }

        seriesItemTypes.clear();

        const yPositiveIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentPositive');
        const yNegativeIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentNegative');
        const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`);

        const positiveDomain = processedData.domain.values[yPositiveIndex] ?? [];
        const negativeDomain = processedData.domain.values[yNegativeIndex] ?? [];

        if (positiveDomain.length > 0) {
            seriesItemTypes.add('positive');
        }

        if (negativeDomain.length > 0) {
            seriesItemTypes.add('negative');
        }

        const itemTypes = processedData?.domain.values[totalTypeIndex];
        if (!itemTypes) {
            return;
        }

        itemTypes.forEach((type) => {
            if (type === 'total' || type === 'subtotal') {
                seriesItemTypes.add('total');
            }
        });
    }

    private isSubtotal(datumType: AgWaterfallSeriesItemType) {
        return datumType === 'subtotal';
    }

    private isTotal(datumType: AgWaterfallSeriesItemType) {
        return datumType === 'total';
    }

    protected override nodeFactory() {
        return new Rect();
    }

    private getSeriesItemType(isPositive: boolean, datumType?: AgWaterfallSeriesItemType): AgWaterfallSeriesItemType {
        return datumType ?? (isPositive ? 'positive' : 'negative');
    }

    private getItemConfig(seriesItemType: AgWaterfallSeriesItemType): WaterfallSeriesItem {
        switch (seriesItemType) {
            case 'positive': {
                return this.properties.item.positive;
            }
            case 'negative': {
                return this.properties.item.negative;
            }
            case 'subtotal':
            case 'total': {
                return this.properties.item.total;
            }
        }
    }

    protected override async updateDatumSelection(opts: {
        nodeData: WaterfallNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { id: seriesId, ctx } = this;
        const {
            yKey,
            highlightStyle: { item: itemHighlightStyle },
        } = this.properties;

        const categoryAxis = this.getCategoryAxis();
        const crisp = checkCrisp(categoryAxis?.visibleRange);

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        datumSelection.each((rect, datum) => {
            const seriesItemType = datum.itemId;
            const {
                fillOpacity,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
                cornerRadius,
                formatter,
                shadow: fillShadow,
            } = this.getItemConfig(seriesItemType);
            const style: _ModuleSupport.RectConfig = {
                fill: datum.fill,
                stroke: datum.stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                cornerRadius,
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig({
                datum,
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                formatter,
                seriesId,
                itemId: datum.itemId,
                ctx,
                value: datum.yValue,
                yKey,
            });
            config.crisp = crisp;
            config.visible = visible;
            updateRect({ rect, config });
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: WaterfallNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, WaterfallNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        if (labelData.length === 0) {
            return labelSelection.update([]);
        }

        const itemId = labelData[0].itemId;
        const { label } = this.getItemConfig(itemId);
        const data = label.enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, WaterfallNodeDatum> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.getItemConfig(datum.itemId).label, datum.label);
        });
    }

    getTooltipHtml(nodeDatum: WaterfallNodeDatum): _ModuleSupport.TooltipContent {
        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();

        if (!this.properties.isValid() || !categoryAxis || !valueAxis) {
            return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;
        }

        const { id: seriesId } = this;
        const { xKey, yKey, xName, yName, tooltip } = this.properties;
        const { datum, itemId, xValue, yValue } = nodeDatum;
        const { fill, strokeWidth, name, formatter } = this.getItemConfig(itemId);

        let format;

        if (formatter) {
            format = this.ctx.callbackCache.call(formatter, {
                datum,
                value: yValue,
                xKey,
                yKey,
                fill,
                strokeWidth,
                highlighted: false,
                seriesId,
                itemId: nodeDatum.itemId,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';

        const xString = sanitizeHtml(categoryAxis.formatDatum(xValue));
        const yString = sanitizeHtml(valueAxis.formatDatum(yValue));

        const isTotal = this.isTotal(itemId);
        const isSubtotal = this.isSubtotal(itemId);
        let ySubheading;
        if (isTotal) {
            ySubheading = 'Total';
        } else if (isSubtotal) {
            ySubheading = 'Subtotal';
        } else {
            ySubheading = name ?? yName ?? yKey;
        }

        const title = sanitizeHtml(yName);
        const content =
            `<b>${sanitizeHtml(xName ?? xKey)}</b>: ${xString}<br/>` +
            `<b>${sanitizeHtml(ySubheading)}</b>: ${yString}`;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            { seriesId, itemId, datum, xKey, yKey, xName, yName, color, title }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType) {
        if (legendType !== 'category') {
            return [];
        }

        const { id, seriesItemTypes } = this;
        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];
        const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.substring(1);

        seriesItemTypes.forEach((item) => {
            const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, name } = this.getItemConfig(item);
            legendData.push({
                legendType: 'category',
                id,
                itemId: item,
                seriesId: id,
                enabled: true,
                label: { text: name ?? capitalise(item) },
                symbols: [{ marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } }],
            });
        });

        return legendData;
    }

    protected override toggleSeriesItem(): void {
        // Legend item toggling is unsupported.
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection, contextData, paths }: WaterfallAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, 'normal'));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], fns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);

        const { pointData } = contextData;
        if (!pointData) return;

        const [lineNode] = paths;
        if (this.isVertical()) {
            this.animateConnectorLinesVertical(lineNode, pointData);
        } else {
            this.animateConnectorLinesHorizontal(lineNode, pointData);
        }
    }

    protected animateConnectorLinesHorizontal(lineNode: _Scene.Path, pointData: WaterfallNodePointDatum[]) {
        const { path: linePath } = lineNode;

        this.updateLineNode(lineNode);

        const valueAxis = this.getValueAxis();
        const valueAxisReversed = valueAxis?.isReversed();
        const compare = valueAxisReversed ? (v: number, v2: number) => v < v2 : (v: number, v2: number) => v > v2;

        const startX = valueAxis?.scale.convert(0);
        const endX = pointData.reduce(
            (end, point) => {
                if (compare(point.x, end)) {
                    end = point.x;
                }
                return end;
            },
            valueAxisReversed ? Infinity : 0
        );

        const scale = (value: number, start1: number, end1: number, start2: number, end2: number) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };

        this.ctx.animationManager.animate({
            id: `${this.id}_connectors`,
            groupId: this.id,
            phase: 'initial',
            from: startX,
            to: endX,
            ease: _ModuleSupport.Motion.easeOut,
            collapsable: false,
            onUpdate(pointX) {
                linePath.clear(true);

                pointData.forEach((point, index) => {
                    const x = scale(pointX, startX, endX, startX, point.x);
                    const x2 = scale(pointX, startX, endX, startX, point.x2);
                    if (index !== 0) {
                        linePath.lineTo(x, point.y);
                    }
                    linePath.moveTo(x2, point.y2);
                });

                lineNode.checkPathDirty();
            },
        });
    }

    protected animateConnectorLinesVertical(lineNode: _Scene.Path, pointData: WaterfallNodePointDatum[]) {
        const { path: linePath } = lineNode;

        this.updateLineNode(lineNode);

        const valueAxis = this.getValueAxis();
        const valueAxisReversed = valueAxis?.isReversed();
        const compare = valueAxisReversed ? (v: number, v2: number) => v > v2 : (v: number, v2: number) => v < v2;

        const startY = valueAxis?.scale.convert(0);
        const endY = pointData.reduce(
            (end, point) => {
                if (compare(point.y, end)) {
                    end = point.y;
                }
                return end;
            },
            valueAxisReversed ? 0 : Infinity
        );

        const scale = (value: number, start1: number, end1: number, start2: number, end2: number) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };

        this.ctx.animationManager.animate({
            id: `${this.id}_connectors`,
            groupId: this.id,
            phase: 'initial',
            from: startY,
            to: endY,
            ease: _ModuleSupport.Motion.easeOut,
            collapsable: false,
            onUpdate(pointY) {
                linePath.clear(true);

                pointData.forEach((point, index) => {
                    const y = scale(pointY, startY, endY, startY, point.y);
                    const y2 = scale(pointY, startY, endY, startY, point.y2);
                    if (index !== 0) {
                        linePath.lineTo(point.x, y);
                    }
                    linePath.moveTo(point.x2, y2);
                });

                lineNode.checkPathDirty();
            },
        });
    }

    override animateReadyResize(data: WaterfallAnimationData) {
        super.animateReadyResize(data);
        this.resetConnectorLinesPath(data);
    }

    protected override async updatePaths(opts: {
        seriesHighlighted?: boolean | undefined;
        itemId?: string | undefined;
        contextData: WaterfallContext;
        paths: _Scene.Path[];
        seriesIdx: number;
    }): Promise<void> {
        this.resetConnectorLinesPath({ contextData: opts.contextData, paths: opts.paths });
    }

    resetConnectorLinesPath({ contextData, paths }: { contextData: WaterfallContext; paths: Array<_Scene.Path> }) {
        if (paths.length === 0) {
            return;
        }

        const [lineNode] = paths;

        this.updateLineNode(lineNode);

        const { path: linePath } = lineNode;
        linePath.clear(true);

        const { pointData } = contextData;
        if (!pointData) {
            return;
        }
        pointData.forEach((point, index) => {
            if (index !== 0) {
                linePath.lineTo(point.x, point.y);
            }
            linePath.moveTo(point.x2, point.y2);
        });

        lineNode.checkPathDirty();
    }

    protected updateLineNode(lineNode: _Scene.Path) {
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.properties.line;
        lineNode.setProperties({
            fill: undefined,
            stroke,
            strokeWidth: this.getStrokeWidth(strokeWidth),
            strokeOpacity,
            lineDash,
            lineDashOffset,
            lineJoin: 'round',
            pointerEvents: _Scene.PointerEvents.None,
        });
    }

    protected isLabelEnabled() {
        const { positive, negative, total } = this.properties.item;
        return positive.label.enabled || negative.label.enabled || total.label.enabled;
    }

    protected override onDataChange() {}

    protected computeFocusBounds({ datumIndex, seriesRect }: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        return computeBarFocusBounds(this.contextNodeData?.nodeData[datumIndex], this.contentGroup, seriesRect);
    }
}
