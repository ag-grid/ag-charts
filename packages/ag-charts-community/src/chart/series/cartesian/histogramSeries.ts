import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import type { DropShadow } from '../../../scene/dropShadow';
import type { SeriesNodeDataContext } from '../series';
import { SeriesTooltip, Series, SeriesNodePickMode, valueProperty, keyProperty } from '../series';
import { Label } from '../../label';
import { PointerEvents } from '../../../scene/node';
import type { ChartLegendDatum, CategoryLegendDatum } from '../../legendDatum';
import type { CartesianAnimationData, CartesianSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries, CartesianSeriesNodeClickEvent, CartesianSeriesNodeDoubleClickEvent } from './cartesianSeries';
import { ChartAxisDirection } from '../../chartAxisDirection';
import ticks, { tickStep } from '../../../util/ticks';
import { sanitizeHtml } from '../../../util/sanitize';
import {
    BOOLEAN,
    NUMBER,
    OPT_ARRAY,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_COLOR_STRING,
    Validate,
    predicateWithMessage,
    OPT_STRING,
} from '../../../util/validation';
import { zipObject } from '../../../util/zip';
import type {
    AgCartesianSeriesLabelFormatterParams,
    AgTooltipRendererResult,
    AgHistogramSeriesOptions,
    FontStyle,
    FontWeight,
    AgHistogramSeriesTooltipRendererParams,
} from '../../agChartOptions';
import type { AggregatePropertyDefinition, GroupByFn, PropertyDefinition } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import { area, groupAverage, groupCount, groupSum } from '../../data/aggregateFunctions';
import { SORT_DOMAIN_GROUPS, createDatumId, diff } from '../../data/processors';
import * as easing from '../../../motion/easing';
import type { ModuleContext } from '../../../util/moduleContext';
import type { DataController } from '../../data/dataController';

const HISTOGRAM_AGGREGATIONS = ['count', 'sum', 'mean'];
const HISTOGRAM_AGGREGATION = predicateWithMessage(
    (v: any) => HISTOGRAM_AGGREGATIONS.includes(v),
    `expecting a histogram aggregation keyword such as 'count', 'sum' or 'mean`
);

enum HistogramSeriesNodeTag {
    Bin,
    Label,
}

class HistogramSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams) => string = undefined;
}

const defaultBinCount = 10;

interface HistogramNodeDatum extends CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly aggregatedValue: number;
    readonly frequency: number;
    readonly domain: [number, number];
    readonly label?: {
        readonly text: string;
        readonly x: number;
        readonly y: number;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly fill: string;
    };
}

type HistogramAggregation = NonNullable<AgHistogramSeriesOptions['aggregation']>;

type HistogramAnimationData = CartesianAnimationData<SeriesNodeDataContext<HistogramNodeDatum>, Rect>;

export class HistogramSeries extends CartesianSeries<SeriesNodeDataContext<HistogramNodeDatum>, Rect> {
    static className = 'HistogramSeries';
    static type = 'histogram' as const;

    readonly label = new HistogramSeriesLabel();

    tooltip = new SeriesTooltip<AgHistogramSeriesTooltipRendererParams>();

    @Validate(OPT_COLOR_STRING)
    fill?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = undefined;

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    constructor(moduleCtx: ModuleContext) {
        super({ moduleCtx, pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH] });

        this.label.enabled = false;
    }

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(BOOLEAN)
    areaPlot: boolean = false;

    @Validate(OPT_ARRAY())
    bins: [number, number][] | undefined = undefined;

    @Validate(HISTOGRAM_AGGREGATION)
    aggregation: HistogramAggregation = 'sum';

    @Validate(OPT_NUMBER(0))
    binCount?: number = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    shadow?: DropShadow = undefined;
    calculatedBins: [number, number][] = [];

    protected highlightedDatum?: HistogramNodeDatum;

    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    private deriveBins(xDomain: [number, number]): [number, number][] {
        if (this.binCount === undefined) {
            const binStarts = ticks(xDomain[0], xDomain[1], defaultBinCount);
            const binSize = tickStep(xDomain[0], xDomain[1], defaultBinCount);
            const firstBinEnd = binStarts[0];

            const expandStartToBin: (n: number) => [number, number] = (n) => [n, n + binSize];

            return [[firstBinEnd - binSize, firstBinEnd], ...binStarts.map(expandStartToBin)];
        } else {
            return this.calculateNiceBins(xDomain, this.binCount);
        }
    }

    private calculateNiceBins(domain: number[], binCount: number): [number, number][] {
        const startGuess = Math.floor(domain[0]);
        const stop = domain[1];

        const segments = binCount || 1;
        const { start, binSize } = this.calculateNiceStart(startGuess, stop, segments);

        return this.getBins(start, stop, binSize, segments);
    }

    private getBins(start: number, stop: number, step: number, count: number): [number, number][] {
        const bins: [number, number][] = [];

        for (let i = 0; i < count; i++) {
            const a = Math.round((start + i * step) * 10) / 10;
            let b = Math.round((start + (i + 1) * step) * 10) / 10;
            if (i === count - 1) {
                b = Math.max(b, stop);
            }

            bins[i] = [a, b];
        }

        return bins;
    }

    private calculateNiceStart(a: number, b: number, segments: number): { start: number; binSize: number } {
        const binSize = Math.abs(b - a) / segments;
        const order = Math.floor(Math.log10(binSize));
        const magnitude = Math.pow(10, order);

        const start = Math.floor(a / magnitude) * magnitude;

        return {
            start,
            binSize,
        };
    }

    async processData(dataController: DataController) {
        const { xKey, yKey, data, areaPlot, aggregation } = this;

        const props: PropertyDefinition<any>[] = [keyProperty(this, xKey, true), SORT_DOMAIN_GROUPS];
        if (yKey) {
            let aggProp: AggregatePropertyDefinition<any, any, any> = groupCount(this, 'groupCount');

            if (aggregation === 'count') {
                // Nothing to do.
            } else if (aggregation === 'sum') {
                aggProp = groupSum(this, 'groupAgg');
            } else if (aggregation === 'mean') {
                aggProp = groupAverage(this, 'groupAgg');
            }
            if (areaPlot) {
                aggProp = area(this, 'groupAgg', aggProp);
            }
            props.push(valueProperty(this, yKey, true, { invalidValue: undefined }), aggProp);
        } else {
            let aggProp = groupCount(this, 'groupAgg');

            if (areaPlot) {
                aggProp = area(this, 'groupAgg', aggProp);
            }
            props.push(aggProp);
        }

        const groupByFn: GroupByFn = (dataSet) => {
            const xExtent = fixNumericExtent(dataSet.domain.keys[0]);
            if (xExtent.length === 0) {
                // No buckets can be calculated.
                dataSet.domain.groups = [];
                return () => [];
            }

            const bins = this.bins ?? this.deriveBins(xExtent);
            const binCount = bins.length;
            this.calculatedBins = [...bins];

            return (item) => {
                const xValue = item.keys[0];
                for (let i = 0; i < binCount; i++) {
                    const nextBin = bins[i];
                    if (xValue >= nextBin[0] && xValue < nextBin[1]) {
                        return nextBin;
                    }
                    if (i === binCount - 1 && xValue <= nextBin[1]) {
                        // Handle edge case of a value being at the maximum extent, and the
                        // final bin aligning with it.
                        return nextBin;
                    }
                }

                return [];
            };
        };

        if (!this.ctx.animationManager.skipAnimations && this.processedData) {
            props.push(diff(this.processedData, false));
        }

        const { dataModel, processedData } = await dataController.request<any>(this.id, data ?? [], {
            props,
            dataVisible: this.visible,
            groupByFn,
        });
        this.dataModel = dataModel;
        this.processedData = processedData;

        this.animationState.transition('updateData');
    }

    getDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;

        if (!processedData || !dataModel) return [];

        const yDomain = dataModel.getDomain(this, `groupAgg`, 'aggregate', processedData);
        const xDomainMin = this.calculatedBins?.[0][0];
        const xDomainMax = this.calculatedBins?.[(this.calculatedBins?.length ?? 0) - 1][1];
        if (direction === ChartAxisDirection.X) {
            return fixNumericExtent([xDomainMin, xDomainMax]);
        }

        return fixNumericExtent(yDomain);
    }

    protected getNodeClickEvent(event: MouseEvent, datum: HistogramNodeDatum): CartesianSeriesNodeClickEvent<any> {
        return new CartesianSeriesNodeClickEvent(this.xKey ?? '', this.yKey ?? '', event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: HistogramNodeDatum
    ): CartesianSeriesNodeDoubleClickEvent<any> {
        return new CartesianSeriesNodeDoubleClickEvent(this.xKey ?? '', this.yKey ?? '', event, datum, this);
    }

    async createNodeData() {
        const {
            axes,
            processedData,
            ctx: { callbackCache },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!this.visible || !xAxis || !yAxis || !processedData || processedData.type !== 'grouped') {
            return [];
        }

        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;
        const { fill, stroke, strokeWidth, id: seriesId, yKey = '', xKey = '' } = this;

        const nodeData: HistogramNodeDatum[] = [];

        const defaultLabelFormatter = (params: { value: number }) => String(params.value);
        const {
            label: {
                formatter: labelFormatter = defaultLabelFormatter,
                fontStyle: labelFontStyle,
                fontWeight: labelFontWeight,
                fontSize: labelFontSize,
                fontFamily: labelFontFamily,
                color: labelColor,
            },
        } = this;

        processedData.data.forEach((group) => {
            const {
                aggValues: [[negativeAgg, positiveAgg]] = [[0, 0]],
                datum,
                datum: { length: frequency },
                keys: domain,
                keys: [xDomainMin, xDomainMax],
            } = group;

            const xMinPx = xScale.convert(xDomainMin);
            const xMaxPx = xScale.convert(xDomainMax);

            const total = negativeAgg + positiveAgg;

            const yZeroPx = yScale.convert(0);
            const yMaxPx = yScale.convert(total);
            const w = xMaxPx - xMinPx;
            const h = Math.abs(yMaxPx - yZeroPx);

            const selectionDatumLabel =
                total !== 0
                    ? {
                          text: callbackCache.call(labelFormatter, { value: total, seriesId }) ?? String(total),
                          fontStyle: labelFontStyle,
                          fontWeight: labelFontWeight,
                          fontSize: labelFontSize,
                          fontFamily: labelFontFamily,
                          fill: labelColor,
                          x: xMinPx + w / 2,
                          y: yMaxPx + h / 2,
                      }
                    : undefined;

            const nodeMidPoint = {
                x: xMinPx + w / 2,
                y: yMaxPx + h / 2,
            };

            nodeData.push({
                series: this,
                datum, // required by SeriesNodeDatum, but might not make sense here
                // since each selection is an aggregation of multiple data.
                aggregatedValue: total,
                frequency,
                domain: domain as [number, number],
                yKey,
                xKey,
                x: xMinPx,
                y: yMaxPx,
                xValue: xMinPx,
                yValue: yMaxPx,
                width: w,
                height: h,
                nodeMidPoint,
                fill: fill,
                stroke: stroke,
                strokeWidth: strokeWidth,
                label: selectionDatumLabel,
            });
        });

        return [{ itemId: this.yKey ?? this.id, nodeData, labelData: nodeData }];
    }

    protected nodeFactory() {
        return new Rect();
    }

    datumSelectionGarbageCollection = false;

    protected async updateDatumSelection(opts: {
        nodeData: HistogramNodeDatum[];
        datumSelection: Selection<Rect, HistogramNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;

        return datumSelection.update(
            nodeData,
            (rect) => {
                rect.tag = HistogramSeriesNodeTag.Bin;
                rect.crisp = true;
            },
            (datum: HistogramNodeDatum) => datum.domain.join('_')
        );
    }

    protected async updateDatumNodes(opts: {
        datumSelection: Selection<Rect, HistogramNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight: isDatumHighlighted } = opts;
        const {
            fillOpacity: seriesFillOpacity,
            strokeOpacity,
            shadow,
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    fillOpacity: highlightFillOpacity = seriesFillOpacity,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                },
            },
        } = this;

        datumSelection.each((rect, datum, index) => {
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : datum.strokeWidth;
            const fillOpacity = isDatumHighlighted ? highlightFillOpacity : seriesFillOpacity;

            rect.fill = (isDatumHighlighted ? highlightedFill : undefined) ?? datum.fill;
            rect.stroke = (isDatumHighlighted ? highlightedStroke : undefined) ?? datum.stroke;
            rect.fillOpacity = fillOpacity;
            rect.strokeOpacity = strokeOpacity;
            rect.strokeWidth = strokeWidth;
            rect.lineDash = this.lineDash;
            rect.lineDashOffset = this.lineDashOffset;
            rect.fillShadow = shadow;
            rect.zIndex = isDatumHighlighted ? Series.highlightedZIndex : index;
            rect.visible = datum.height > 0; // prevent stroke from rendering for zero height columns
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: HistogramNodeDatum[];
        labelSelection: Selection<Text, HistogramNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.tag = HistogramSeriesNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
            text.textAlign = 'center';
            text.textBaseline = 'middle';
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, HistogramNodeDatum> }) {
        const { labelSelection } = opts;
        const labelEnabled = this.label.enabled;

        labelSelection.each((text, datum) => {
            const label = datum.label;

            if (label && labelEnabled) {
                text.text = label.text;
                text.x = label.x;
                text.y = label.y;
                text.fontStyle = label.fontStyle;
                text.fontWeight = label.fontWeight;
                text.fontSize = label.fontSize;
                text.fontFamily = label.fontFamily;
                text.fill = label.fill;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: HistogramNodeDatum): string {
        const { xKey, yKey = '', axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, fill: color, tooltip, aggregation, id: seriesId } = this;
        const {
            aggregatedValue,
            frequency,
            domain,
            domain: [rangeMin, rangeMax],
        } = nodeDatum;
        const title = `${sanitizeHtml(xName ?? xKey)}: ${xAxis.formatDatum(rangeMin)} - ${xAxis.formatDatum(rangeMax)}`;
        let content = yKey
            ? `<b>${sanitizeHtml(yName ?? yKey)} (${aggregation})</b>: ${yAxis.formatDatum(aggregatedValue)}<br>`
            : '';

        content += `<b>Frequency</b>: ${frequency}`;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum: {
                data: nodeDatum.datum,
                aggregatedValue: nodeDatum.aggregatedValue,
                domain: nodeDatum.domain,
                frequency: nodeDatum.frequency,
            },
            xKey,
            xValue: domain,
            xName,
            yKey,
            yValue: aggregatedValue,
            yName,
            color,
            title,
            seriesId,
        });
    }

    getLegendData(): ChartLegendDatum[] {
        const { id, data, xKey, yName, visible, fill, stroke, fillOpacity, strokeOpacity } = this;

        if (!data || data.length === 0) {
            return [];
        }

        const legendData: CategoryLegendDatum[] = [
            {
                legendType: 'category',
                id,
                itemId: xKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: yName ?? xKey ?? 'Frequency',
                },
                marker: {
                    fill: fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity,
                },
            },
        ];
        return legendData;
    }

    animateEmptyUpdateReady({ datumSelections, labelSelections }: HistogramAnimationData) {
        const duration = this.ctx.animationManager.defaultDuration();
        const labelDuration = 200;

        let startingY = 0;
        datumSelections.forEach((datumSelection) =>
            datumSelection.each((_, datum) => {
                startingY = Math.max(startingY, datum.height + datum.y);
            })
        );

        datumSelections.forEach((datumSelection) => {
            datumSelection.each((rect, datum) => {
                this.ctx.animationManager.animateMany(
                    `${this.id}_empty-update-ready_${rect.id}`,
                    [
                        { from: startingY, to: datum.y },
                        { from: 0, to: datum.height },
                    ],
                    {
                        duration,
                        ease: easing.easeOut,
                        onUpdate([y, height]) {
                            rect.y = y;
                            rect.height = height;

                            rect.x = datum.x;
                            rect.width = datum.width;
                        },
                    }
                );
            });
        });

        labelSelections.forEach((labelSelection) => {
            labelSelection.each((label) => {
                this.ctx.animationManager.animate(`${this.id}_empty-update-ready_${label.id}`, {
                    from: 0,
                    to: 1,
                    delay: duration,
                    duration: labelDuration,
                    onUpdate: (opacity) => {
                        label.opacity = opacity;
                    },
                });
            });
        });
    }

    animateReadyUpdate({ datumSelections }: HistogramAnimationData) {
        this.resetSelections(datumSelections);
    }

    animateReadyHighlight(highlightSelection: Selection<Rect, HistogramNodeDatum>) {
        this.resetSelectionRects(highlightSelection);
    }

    animateReadyResize({ datumSelections }: HistogramAnimationData) {
        this.resetSelections(datumSelections);
    }

    animateWaitingUpdateReady({
        datumSelections,
        labelSelections,
    }: {
        datumSelections: Array<Selection<Rect, HistogramNodeDatum>>;
        labelSelections: Array<Selection<Text, HistogramNodeDatum>>;
    }) {
        const { processedData, getDatumId } = this;
        const diff = processedData?.reduced?.diff;

        if (!diff?.changed) {
            this.resetSelections(datumSelections);
            return;
        }

        const totalDuration = this.ctx.animationManager.defaultDuration();
        const labelDuration = 200;

        let sectionDuration = totalDuration;
        if (diff.added.length > 0 && diff.removed.length > 0) {
            sectionDuration = Math.floor(totalDuration / 3);
        } else if (diff.added.length > 0 || diff.removed.length > 0) {
            sectionDuration = Math.floor(totalDuration / 2);
        }

        let startingY = 0;
        datumSelections.forEach((datumSelection) =>
            datumSelection.each((_, datum) => {
                startingY = Math.max(startingY, datum.height + datum.y);
            })
        );

        const addedIds = zipObject(diff.added, true);
        const removedIds = zipObject(diff.removed, true);

        datumSelections.forEach((datumSelection) => {
            datumSelection.each((rect, datum) => {
                let props = [
                    { from: rect.x, to: datum.x },
                    { from: rect.width, to: datum.width },
                    { from: rect.y, to: datum.y },
                    { from: rect.height, to: datum.height },
                ];
                let delay = diff.removed.length > 0 ? sectionDuration : 0;
                let cleanup = false;

                const datumId = getDatumId(datum);
                const contextY = startingY;
                const contextHeight = 0;

                if (addedIds[datumId]) {
                    props = [
                        { from: datum.x, to: datum.x },
                        { from: datum.width, to: datum.width },
                        { from: contextY, to: datum.y },
                        { from: contextHeight, to: datum.height },
                    ];
                    delay += sectionDuration;
                } else if (removedIds[datumId]) {
                    props = [
                        { from: rect.x, to: datum.x },
                        { from: rect.width, to: datum.width },
                        { from: datum.y, to: contextY },
                        { from: datum.height, to: contextHeight },
                    ];
                    delay = 0;
                    cleanup = true;
                }

                this.ctx.animationManager.animateMany(`${this.id}_waiting-update-ready_${rect.id}`, props, {
                    disableInteractions: true,
                    delay,
                    duration: sectionDuration,
                    ease: easing.easeOut,
                    repeat: 0,
                    onUpdate([x, width, y, height]) {
                        rect.x = x;
                        rect.width = width;
                        rect.y = y;
                        rect.height = height;
                    },
                    onComplete() {
                        if (cleanup) datumSelection.cleanup();
                    },
                });
            });
        });

        labelSelections.forEach((labelSelection) => {
            labelSelection.each((label) => {
                label.opacity = 0;

                this.ctx.animationManager.animate(`${this.id}_waiting-update-ready_${label.id}`, {
                    from: 0,
                    to: 1,
                    delay: totalDuration,
                    duration: labelDuration,
                    ease: easing.linear,
                    repeat: 0,
                    onUpdate: (opacity) => {
                        label.opacity = opacity;
                    },
                });
            });
        });
    }

    resetSelections(datumSelections: HistogramAnimationData['datumSelections']) {
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    resetSelectionRects(selection: Selection<Rect, HistogramNodeDatum>) {
        selection.each((rect, datum) => {
            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;
        });
    }

    getDatumId(datum: HistogramNodeDatum) {
        return createDatumId(datum.domain.map((d) => `${d}`));
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
