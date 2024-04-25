import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type { AgTooltipRendererResult } from '../../../options/agChartOptions';
import type { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import { sanitizeHtml } from '../../../util/sanitize';
import ticks, { tickStep } from '../../../util/ticks';
import { isNumber } from '../../../util/type-guards';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { area, groupAverage, groupCount, groupSum } from '../../data/aggregateFunctions';
import type { DataController } from '../../data/dataController';
import type { AggregatePropertyDefinition, GroupByFn, PropertyDefinition } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import { SORT_DOMAIN_GROUPS, createDatumId, diff } from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { EMPTY_TOOLTIP_CONTENT, TooltipContent } from '../../tooltip/tooltip';
import {
    PickFocusInputs,
    Series,
    SeriesNodePickMatch,
    SeriesNodePickMode,
    keyProperty,
    valueProperty,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import {
    collapsedStartingBarPosition,
    computeBarFocusBounds,
    prepareBarAnimationFunctions,
    resetBarSelectionsFn,
} from './barUtil';
import {
    type CartesianAnimationData,
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { HistogramNodeDatum, HistogramSeriesProperties } from './histogramSeriesProperties';
import { addHitTestersToQuadtree, childrenIter, findQuadtreeMatch } from './quadtreeUtil';

enum HistogramSeriesNodeTag {
    Bin,
    Label,
}

const defaultBinCount = 10;

type HistogramAnimationData = CartesianAnimationData<Rect, HistogramNodeDatum>;

export class HistogramSeries extends CartesianSeries<Rect, HistogramSeriesProperties, HistogramNodeDatum> {
    static readonly className = 'HistogramSeries';
    static readonly type = 'histogram' as const;

    override properties = new HistogramSeriesProperties();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    calculatedBins: [number, number][] = [];

    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    private deriveBins(xDomain: [number, number]): [number, number][] {
        const binStarts = ticks(xDomain[0], xDomain[1], defaultBinCount);
        const binSize = tickStep(xDomain[0], xDomain[1], defaultBinCount);
        const [firstBinEnd] = binStarts;

        const expandStartToBin = (n: number): [number, number] => [n, n + binSize];
        return [[firstBinEnd - binSize, firstBinEnd], ...binStarts.map(expandStartToBin)];
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
        const precision = this.calculatePrecision(step);

        for (let i = 0; i < count; i++) {
            const a = Math.round((start + i * step) * precision) / precision;
            let b = Math.round((start + (i + 1) * step) * precision) / precision;
            if (i === count - 1) {
                b = Math.max(b, stop);
            }

            bins[i] = [a, b];
        }

        return bins;
    }

    private calculatePrecision(step: number): number {
        let precision = 10;
        if (isFinite(step) && step > 0) {
            while (step < 1) {
                precision *= 10;
                step *= 10;
            }
        }
        return precision;
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

    override async processData(dataController: DataController) {
        if (!this.visible) {
            this.processedData = undefined;
            this.animationState.transition('updateData');
        }

        const { xKey, yKey, areaPlot, aggregation } = this.properties;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ yScale, xScale });

        const props: PropertyDefinition<any>[] = [keyProperty(xKey, xScaleType), SORT_DOMAIN_GROUPS];
        if (yKey) {
            let aggProp: AggregatePropertyDefinition<any, any, any> = groupCount('groupAgg');

            if (aggregation === 'count') {
                // Nothing to do.
            } else if (aggregation === 'sum') {
                aggProp = groupSum('groupAgg');
            } else if (aggregation === 'mean') {
                aggProp = groupAverage('groupAgg');
            }
            if (areaPlot) {
                aggProp = area('groupAgg', aggProp);
            }
            props.push(valueProperty(yKey, yScaleType, { invalidValue: undefined }), aggProp);
        } else {
            let aggProp = groupCount('groupAgg');

            if (areaPlot) {
                aggProp = area('groupAgg', aggProp);
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

            const bins = isNumber(this.properties.binCount)
                ? this.calculateNiceBins(xExtent, this.properties.binCount)
                : this.properties.bins ?? this.deriveBins(xExtent);
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

        if (!this.ctx.animationManager.isSkipped() && this.processedData) {
            props.push(diff(this.processedData, false));
        }

        await this.requestDataModel<any>(dataController, this.data, { props, groupByFn });

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;

        if (!processedData || !dataModel || !this.calculatedBins.length) return [];

        const yDomain = dataModel.getDomain(this, `groupAgg`, 'aggregate', processedData);
        const xDomainMin = this.calculatedBins?.[0][0];
        const xDomainMax = this.calculatedBins?.[(this.calculatedBins?.length ?? 0) - 1][1];
        if (direction === ChartAxisDirection.X) {
            return fixNumericExtent([xDomainMin, xDomainMax]);
        }

        return fixNumericExtent(yDomain);
    }

    async createNodeData() {
        const {
            id: seriesId,
            axes,
            processedData,
            ctx: { callbackCache },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis) {
            return;
        }

        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;
        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, cornerRadius } = this.properties;
        const {
            formatter: labelFormatter = (params) => String(params.value),
            fontStyle: labelFontStyle,
            fontWeight: labelFontWeight,
            fontSize: labelFontSize,
            fontFamily: labelFontFamily,
            color: labelColor,
        } = this.properties.label;

        const nodeData: HistogramNodeDatum[] = [];
        const context = {
            itemId: this.properties.yKey ?? this.id,
            nodeData,
            labelData: nodeData,
            scales: this.calculateScaling(),
            animationValid: true,
            visible: this.visible,
        };
        if (!this.visible || !processedData || processedData.type !== 'grouped') return context;

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
            const w = Math.abs(xMaxPx - xMinPx);
            const h = Math.abs(yMaxPx - yZeroPx);

            const x = Math.min(xMinPx, xMaxPx);
            const y = Math.min(yZeroPx, yMaxPx);

            let selectionDatumLabel = undefined;
            if (total !== 0) {
                selectionDatumLabel = {
                    text:
                        callbackCache.call(labelFormatter, {
                            value: total,
                            datum,
                            seriesId,
                            xKey,
                            yKey,
                            xName,
                            yName,
                        }) ?? String(total),
                    fontStyle: labelFontStyle,
                    fontWeight: labelFontWeight,
                    fontSize: labelFontSize,
                    fontFamily: labelFontFamily,
                    fill: labelColor,
                    x: x + w / 2,
                    y: y + h / 2,
                };
            }

            const nodeMidPoint = {
                x: x + w / 2,
                y: y + h / 2,
            };

            const yAxisReversed = yAxis.isReversed();

            nodeData.push({
                series: this,
                datum, // required by SeriesNodeDatum, but might not make sense here
                // since each selection is an aggregation of multiple data.
                aggregatedValue: total,
                frequency,
                domain: domain as [number, number],
                yKey,
                xKey,
                x,
                y,
                xValue: xMinPx,
                yValue: yMaxPx,
                width: w,
                height: h,
                midPoint: nodeMidPoint,
                fill: fill,
                stroke: stroke,
                cornerRadius,
                topLeftCornerRadius: !yAxisReversed,
                topRightCornerRadius: !yAxisReversed,
                bottomRightCornerRadius: yAxisReversed,
                bottomLeftCornerRadius: yAxisReversed,
                opacity: 1,
                strokeWidth: strokeWidth,
                label: selectionDatumLabel,
            });
        });

        return context;
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override async updateDatumSelection(opts: {
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

    protected override async updateDatumNodes(opts: {
        datumSelection: Selection<Rect, HistogramNodeDatum>;
        isHighlight: boolean;
    }) {
        const { isHighlight: isDatumHighlighted } = opts;
        const {
            fillOpacity: seriesFillOpacity,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            shadow,
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    fillOpacity: highlightFillOpacity = seriesFillOpacity,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                },
            },
        } = this.properties;

        opts.datumSelection.each((rect, datum, index) => {
            const {
                cornerRadius,
                topLeftCornerRadius,
                topRightCornerRadius,
                bottomRightCornerRadius,
                bottomLeftCornerRadius,
            } = datum;
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
            rect.lineDash = lineDash;
            rect.lineDashOffset = lineDashOffset;
            rect.topLeftCornerRadius = topLeftCornerRadius ? cornerRadius : 0;
            rect.topRightCornerRadius = topRightCornerRadius ? cornerRadius : 0;
            rect.bottomRightCornerRadius = bottomRightCornerRadius ? cornerRadius : 0;
            rect.bottomLeftCornerRadius = bottomLeftCornerRadius ? cornerRadius : 0;
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
        const labelEnabled = this.isLabelEnabled();

        opts.labelSelection.each((text, datum) => {
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

    protected override initQuadTree(quadtree: QuadtreeNearest<HistogramNodeDatum>) {
        addHitTestersToQuadtree(quadtree, childrenIter<Rect>(this.contentGroup.children[0]));
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }

    getTooltipHtml(nodeDatum: HistogramNodeDatum): TooltipContent {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { xKey, yKey, xName, yName, fill: color, aggregation, tooltip } = this.properties;
        const {
            aggregatedValue,
            frequency,
            domain: [rangeMin, rangeMax],
            itemId,
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
            itemId,
            xKey,
            xName,
            yKey,
            yName,
            color,
            title,
            seriesId: this.id,
        });
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (!this.data?.length || legendType !== 'category') {
            return [];
        }

        const { xKey, yName, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, visible } = this.properties;

        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: xKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: yName ?? xKey ?? 'Frequency',
                },
                marker: {
                    fill: fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity,
                    strokeWidth,
                },
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: HistogramAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes, 'normal'));
        fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], fns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    override animateWaitingUpdateReady(data: HistogramAnimationData) {
        const dataDiff = this.processedData?.reduced?.diff;
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes, 'normal'));

        fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [data.datumSelection],
            fns,
            (_, datum) => createDatumId(datum.domain),
            dataDiff
        );

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, data.labelSelection);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({ datumIndex, seriesRect }: PickFocusInputs): BBox | undefined {
        return computeBarFocusBounds(this.contextNodeData?.nodeData[datumIndex], this.contentGroup, seriesRect);
    }
}
