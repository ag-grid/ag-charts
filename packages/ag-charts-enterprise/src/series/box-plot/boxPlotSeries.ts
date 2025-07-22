import {
    type AgBoxPlotHighlightStyleOptions,
    type AgBoxPlotSeriesOptions,
    type AgBoxPlotSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { DeepRequired } from 'ag-charts-core';

import { readDatum } from '../../utils/datum';
import { prepareBoxPlotFromTo, resetBoxPlotSelectionsScalingCenterFn } from './blotPlotUtil';
import { BoxPlotGroup } from './boxPlotGroup';
import { BoxPlotSeriesProperties } from './boxPlotSeriesProperties';
import type { BoxPlotNodeDatum } from './boxPlotTypes';

const {
    extractDecoratedProperties,
    fixNumericExtent,
    keyProperty,
    mergeDefaults,
    SeriesNodePickMode,
    SMALLEST_KEY_INTERVAL,
    valueProperty,
    diff,
    animationValidation,
    computeBarFocusBounds,
    createDatumId,
    ContinuousScale,
    ChartAxisDirection,
    motion,
    isGradientFill,
    getShapeStyle,
} = _ModuleSupport;

class BoxPlotSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<BoxPlotNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly minKey?: string;
    readonly q1Key?: string;
    readonly medianKey?: string;
    readonly q3Key?: string;
    readonly maxKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: BoxPlotNodeDatum, series: BoxPlotSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.minKey = series.properties.minKey;
        this.q1Key = series.properties.q1Key;
        this.medianKey = series.properties.medianKey;
        this.q3Key = series.properties.q3Key;
        this.maxKey = series.properties.maxKey;
    }
}

export class BoxPlotSeries extends _ModuleSupport.AbstractBarSeries<
    BoxPlotGroup,
    AgBoxPlotSeriesOptions,
    BoxPlotSeriesProperties,
    BoxPlotNodeDatum
> {
    static readonly className = 'BoxPlotSeries';
    static readonly type = 'box-plot' as const;

    override properties = new BoxPlotSeriesProperties();

    protected override readonly NodeEvent = BoxPlotSeriesNodeEvent;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            propertyKeys: {
                x: ['xKey'],
                y: ['medianKey', 'q1Key', 'q3Key', 'minKey', 'maxKey'],
            },
            propertyNames: {
                x: ['xName'],
                y: ['medianName', 'q1Name', 'q3Name', 'minName', 'maxName'],
            },
            categoryKey: 'xValue',
            pathsPerSeries: [],
        });
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (!this.visible) return;

        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const extraProps = [];
        if (animationEnabled && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const { processedData } = await this.requestDataModel(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: `xValue` }),
                valueProperty(minKey, yScaleType, { id: `minValue` }),
                valueProperty(q1Key, yScaleType, { id: `q1Value` }),
                valueProperty(medianKey, yScaleType, { id: `medianValue` }),
                valueProperty(q3Key, yScaleType, { id: `q3Value` }),
                valueProperty(maxKey, yScaleType, { id: `maxValue` }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return [];

        if (direction !== this.getBarDirection()) {
            const { index, def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = processedData.domain.keys[index];
            if (def.type === 'key' && def.valueType === 'category') {
                return keys;
            }
            return this.padBandExtent(keys);
        }

        const yExtent = this.domainForClippedRange(direction, ['minValue', 'maxValue'], 'xValue');
        return fixNumericExtent(yExtent);
    }

    override getSeriesRange(_direction: _ModuleSupport.ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['maxValue', 'minValue'], 'xValue', visibleRange);
    }

    override createNodeData() {
        const { visible, dataModel, processedData } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(dataModel && processedData && xAxis && yAxis)) return;

        const { xKey, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } =
            this.properties;

        const nodeData: BoxPlotNodeDatum[] = [];

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const minValues = dataModel.resolveColumnById(this, 'minValue', processedData);
        const q1Values = dataModel.resolveColumnById(this, 'q1Value', processedData);
        const medianValues = dataModel.resolveColumnById(this, 'medianValue', processedData);
        const q3Values = dataModel.resolveColumnById(this, 'q3Value', processedData);
        const maxValues = dataModel.resolveColumnById(this, 'maxValue', processedData);

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const barOffset = ContinuousScale.is(xAxis.scale) ? barWidth * -0.5 : 0;
        const { groupScale } = this;
        const isVertical = this.isVertical();

        const context = {
            itemId: xKey,
            nodeData,
            labelData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.groupScale),
            visible: this.visible,
        };

        if (!visible) return context;

        const rawData = processedData.dataSources.get(this.id) ?? [];
        rawData.forEach((datum, datumIndex) => {
            const xValue = xValues[datumIndex];
            if (xValue == null) return;

            const minValue = minValues[datumIndex];
            const q1Value = q1Values[datumIndex];
            const medianValue = medianValues[datumIndex];
            const q3Value = q3Values[datumIndex];
            const maxValue = maxValues[datumIndex];

            if (
                [minValue, q1Value, medianValue, q3Value, maxValue].some((value) => typeof value !== 'number') ||
                minValue > q1Value ||
                q1Value > medianValue ||
                medianValue > q3Value ||
                q3Value > maxValue
            ) {
                return;
            }

            const scaledValues = {
                xValue: Math.round(xAxis.scale.convert(xValue)),
                minValue: Math.round(yAxis.scale.convert(minValue)),
                q1Value: Math.round(yAxis.scale.convert(q1Value)),
                medianValue: Math.round(yAxis.scale.convert(medianValue)),
                q3Value: Math.round(yAxis.scale.convert(q3Value)),
                maxValue: Math.round(yAxis.scale.convert(maxValue)),
            };

            scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex))) + barOffset;

            const bandwidth = Math.round(barWidth);
            const height = Math.abs(scaledValues.q3Value - scaledValues.q1Value);
            const midX = scaledValues.xValue + bandwidth / 2;
            const midY = Math.min(scaledValues.q3Value, scaledValues.q1Value) + height / 2;

            const midPoint = {
                x: isVertical ? midX : midY,
                y: isVertical ? midY : midX,
            };

            let focusRect: (typeof nodeData)[number]['focusRect'];

            if (isVertical) {
                focusRect = {
                    x: midPoint.x - bandwidth / 2,
                    y: scaledValues.minValue,
                    width: bandwidth,
                    height: scaledValues.maxValue - scaledValues.minValue,
                };
            } else {
                focusRect = {
                    x: scaledValues.minValue,
                    y: midPoint.y - bandwidth / 2,
                    width: scaledValues.maxValue - scaledValues.minValue,
                    height: bandwidth,
                };
            }

            nodeData.push({
                series: this,
                itemId: xValue,
                datum,
                datumIndex,
                xKey,
                bandwidth,
                scaledValues,
                cap,
                whisker,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                midPoint,
                focusRect,
            });
        });

        return context;
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
        } = this.properties;

        return {
            marker: getShapeStyle(
                {
                    fill,
                    fillOpacity,
                    stroke,
                    strokeOpacity,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                },
                fillGradientDefaults,
                fillPatternDefaults,
                fillImageDefaults
            ),
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;
        const { xKey, yName, showInLegend, legendItemName } = this.properties;

        if (!xKey || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId: seriesId,
                seriesId: seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId: seriesId }),
                label: {
                    text: legendItemName ?? yName ?? seriesId,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const {
            xKey,
            xName,
            yName,
            medianKey,
            medianName,
            q1Key,
            q1Name,
            q3Key,
            q3Name,
            minKey,
            minName,
            maxKey,
            maxName,
            legendItemName,
            tooltip,
        } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const minValue = dataModel.resolveColumnById(this, `minValue`, processedData)[datumIndex];
        const q1Value = dataModel.resolveColumnById(this, `q1Value`, processedData)[datumIndex];
        const medianValue = dataModel.resolveColumnById(this, `medianValue`, processedData)[datumIndex];
        const q3Value = dataModel.resolveColumnById(this, `q3Value`, processedData)[datumIndex];
        const maxValue = dataModel.resolveColumnById(this, `maxValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const format = this.getItemStyle({ datumIndex, datum }, false);

        const data: _ModuleSupport.TooltipContentDataRow[] = [
            {
                label: minName,
                fallbackLabel: minKey,
                value: this.getAxisValueText(yAxis, 'tooltip', minValue, datum, minKey, legendItemName),
            },
            {
                label: q1Name,
                fallbackLabel: q1Key,
                value: this.getAxisValueText(yAxis, 'tooltip', q1Value, datum, q1Key, legendItemName),
            },
            {
                label: medianName,
                fallbackLabel: medianKey,
                value: this.getAxisValueText(yAxis, 'tooltip', medianValue, datum, medianKey, legendItemName),
            },
            {
                label: q3Name,
                fallbackLabel: q3Key,
                value: this.getAxisValueText(yAxis, 'tooltip', q3Value, datum, q3Key, legendItemName),
            },
            {
                label: maxName,
                fallbackLabel: maxKey,
                value: this.getAxisValueText(yAxis, 'tooltip', maxValue, datum, maxKey, legendItemName),
            },
        ];

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                title: legendItemName ?? yName,
                symbol: this.legendItemSymbol(),
                data: data,
            },
            {
                seriesId,
                datum,
                title: yName,
                xKey,
                xName,
                yName,
                medianKey,
                medianName,
                q1Key,
                q1Name,
                q3Key,
                q3Name,
                minKey,
                minName,
                maxKey,
                maxName,
                ...format,
            }
        );
    }

    protected override animateEmptyUpdateReady({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<BoxPlotGroup, BoxPlotNodeDatum>) {
        const isVertical = this.isVertical();
        const { from, to } = prepareBoxPlotFromTo(isVertical);
        motion.resetMotion([datumSelection], resetBoxPlotSelectionsScalingCenterFn(isVertical));
        motion.staticFromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], from, to, {
            phase: 'initial',
        });
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected override updateDatumSelection(opts: {
        nodeData: BoxPlotNodeDatum[];
        datumSelection: _ModuleSupport.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
        seriesIdx: number;
    }) {
        const data = opts.nodeData ?? [];
        return opts.datumSelection.update(data);
    }

    private getItemStyle(
        { datumIndex, datum }: Partial<BoxPlotNodeDatum>,
        isHighlight: boolean
    ): Required<AgBoxPlotSeriesStyle> {
        const { id: seriesId, properties } = this;

        const {
            xKey,
            minKey,
            q1Key,
            medianKey,
            q3Key,
            maxKey,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
            itemStyler,
        } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight);
        let style = getShapeStyle(
            mergeDefaults(highlightStyle, properties.getStyle()),
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults
        );

        if (itemStyler != null && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        xKey,
                        minKey,
                        q1Key,
                        medianKey,
                        q3Key,
                        maxKey,
                        highlighted: isHighlight,
                        ...style,
                    });
                }
            );

            if (overrides) {
                style = getShapeStyle(
                    mergeDefaults(overrides, style),
                    fillGradientDefaults,
                    fillPatternDefaults,
                    fillImageDefaults
                );
            }
        }

        return style;
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }) {
        const isVertical = this.isVertical();
        const isReversedValueAxis = this.getValueAxis()?.isReversed();
        datumSelection.each((boxPlotGroup, nodeDatum) => {
            let activeStyles = this.getFormattedStyles(nodeDatum, isHighlight ? 'highlight' : 'node');

            const highlightStyle = this.getHighlightStyle(isHighlight, nodeDatum?.datumIndex);

            activeStyles = mergeDefaults(highlightStyle, activeStyles);

            const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;

            activeStyles.whisker = mergeDefaults(activeStyles.whisker, {
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });

            const fillBBox = this.getShapeFillBBox();
            boxPlotGroup.updateDatumStyles(
                nodeDatum,
                activeStyles as DeepRequired<AgBoxPlotHighlightStyleOptions>,
                isVertical,
                isReversedValueAxis,
                fillBBox
            );
        });
    }

    protected updateLabelNodes() {
        // Labels are unsupported.
    }

    protected override updateLabelSelection(opts: {
        labelData: BoxPlotNodeDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, BoxPlotNodeDatum>;
        seriesIdx: number;
    }) {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData);
    }

    protected override nodeFactory() {
        return new BoxPlotGroup();
    }

    getFormattedStyles(nodeDatum: BoxPlotNodeDatum, scope: 'tooltip' | 'node' | 'highlight'): AgBoxPlotSeriesStyle {
        const { id: seriesId, properties } = this;
        const {
            xKey,
            minKey,
            q1Key,
            medianKey,
            q3Key,
            maxKey,
            itemStyler,
            cornerRadius,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
        } = properties;
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } = nodeDatum;
        const datum = readDatum(nodeDatum);
        let fill;
        let fillOpacity: number = 1;

        if (isGradientFill(nodeDatum.fill)) {
            fill = nodeDatum.fill;
        } else {
            fill = nodeDatum.fill;
            fillOpacity = properties.fillOpacity;
        }

        let styles: Required<AgBoxPlotSeriesStyle> = getShapeStyle(
            {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                cornerRadius,
                cap: extractDecoratedProperties(cap),
                whisker: extractDecoratedProperties(whisker),
            },
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults
        );

        if (itemStyler) {
            const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
            const highlightState = this.getHighlightStateString(
                activeHighlight,
                scope === 'highlight',
                nodeDatum.datumIndex
            );
            const formatStyles = this.cachedDatumCallback(createDatumId(nodeDatum.datumIndex, scope), () =>
                this.callWithContext(itemStyler, {
                    datum,
                    seriesId,
                    highlighted: scope === 'highlight',
                    highlightState,
                    ...styles,
                    xKey,
                    minKey,
                    q1Key,
                    medianKey,
                    q3Key,
                    maxKey,
                })
            );

            if (formatStyles) {
                styles = getShapeStyle(
                    mergeDefaults(formatStyles, styles),
                    fillGradientDefaults,
                    fillPatternDefaults,
                    fillImageDefaults
                );
            }
        }

        return styles;
    }

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex].focusRect);
    }
}
