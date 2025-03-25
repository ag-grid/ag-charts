import { isDate, isNumber } from 'ag-charts-core';
import type { AgHistogramBinDatum } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import { findMinMax } from '../../../util/number';
import { createTicks, tickStep } from '../../../util/ticks';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { area, groupAverage, groupCount, groupSum } from '../../data/aggregateFunctions';
import type { DataController } from '../../data/dataController';
import type { AggregatePropertyDefinition, GroupByFn, PropertyDefinition } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import {
    SORT_DOMAIN_GROUPS,
    createDatumId,
    diff,
    keyProperty,
    rowCountProperty,
    valueProperty,
} from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { type TooltipContent, type TooltipContentDataRow } from '../../tooltip/tooltip';
import { type PickFocusInputs, type SeriesNodePickMatch, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { applyShapeStyle, getShapeStyle } from '../shapeUtil';
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
import { type HistogramNodeDatum, HistogramSeriesProperties } from './histogramSeriesProperties';
import { addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';

const defaultBinCount = 10;

type HistogramAnimationData = CartesianAnimationData<Rect<HistogramNodeDatum>, HistogramNodeDatum>;

export class HistogramSeries extends CartesianSeries<
    Rect<HistogramNodeDatum>,
    HistogramSeriesProperties,
    HistogramNodeDatum
> {
    static readonly className = 'HistogramSeries';
    static readonly type = 'histogram' as const;

    override properties = new HistogramSeriesProperties();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: undefined,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
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
        const binStarts = createTicks(xDomain[0], xDomain[1], defaultBinCount);
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
            // Special property - data model needs at least one value property to perform grouping.
            props.push(rowCountProperty('count'));

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

            return (keys) => {
                let xValue = keys[0];
                if (isDate(xValue)) {
                    xValue = xValue.getTime();
                }
                if (!isNumber(xValue)) return [];

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
            props.push(diff(this.id, this.processedData, false));
        }

        await this.requestDataModel<any>(dataController, this.data, {
            props,
            groupByFn,
        });

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(): [number, number] {
        return [NaN, NaN];
    }

    override yCoordinateRange(): [number, number] {
        return [NaN, NaN];
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

    override getSeriesRange(_direction: ChartAxisDirection, [r0, r1]: [any, any]): [number, number] {
        const { dataModel, processedData } = this;
        if (!dataModel || processedData?.type !== 'grouped') return [NaN, NaN];

        const xScale = this.axes[ChartAxisDirection.X]!.scale;

        const yMin = 0;
        let yMax = -Infinity;
        processedData.groups.forEach(({ keys, aggregation }) => {
            const [[negativeAgg, positiveAgg] = [0, 0]] = aggregation;
            const [xDomainMin, xDomainMax] = keys;

            const [x0, x1] = findMinMax([xScale.convert(xDomainMin), xScale.convert(xDomainMax)]);

            if (x1 >= r0 && x0 <= r1) {
                const total = negativeAgg + positiveAgg;
                yMax = Math.max(yMax, total);
            }
        });

        if (yMin > yMax) return [NaN, NaN];

        return [yMin, yMax];
    }

    override createNodeData() {
        const { id: seriesId, axes, processedData, dataModel } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !dataModel) {
            return;
        }

        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;
        const { xKey, yKey, xName, yName } = this.properties;
        const labelFormatter = this.properties.label.formatter;

        const nodeData: HistogramNodeDatum[] = [];
        const context = {
            itemId: this.properties.yKey ?? this.id,
            nodeData,
            labelData: nodeData,
            scales: this.calculateScaling(),
            animationValid: true,
            visible: this.visible,
        };
        if (!this.visible || processedData == null || processedData.type !== 'grouped') {
            return context;
        }

        processedData.groups.forEach((group, groupIndex) => {
            const { keys, datumIndices, aggregation } = group;
            const [[negativeAgg, positiveAgg] = [0, 0]] = aggregation;
            const frequency = datumIndices.length;
            const domain = keys;
            const [xDomainMin, xDomainMax] = domain;
            const datum = [...dataModel.forEachDatum(this, processedData, group)];

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
                    x: x + w / 2,
                    y: y + h / 2,
                    text:
                        this.cachedDatumCallback(createDatumId(groupIndex, 'label'), () =>
                            labelFormatter?.({
                                value: total,
                                datum,
                                seriesId,
                                xKey,
                                yKey,
                                xName,
                                yName,
                            })
                        ) ?? yAxis.formatDatum(total),
                };
            }

            const nodeMidPoint = {
                x: x + w / 2,
                y: y + h / 2,
            };

            const yAxisReversed = yAxis.isReversed();

            nodeData.push({
                series: this,
                datumIndex: groupIndex,
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
                topLeftCornerRadius: !yAxisReversed,
                topRightCornerRadius: !yAxisReversed,
                bottomRightCornerRadius: yAxisReversed,
                bottomLeftCornerRadius: yAxisReversed,
                label: selectionDatumLabel,
                crisp: true,
            });
        });

        // AG-11323 Sort bins from left-to-right for intuitive keyboard navigation.
        nodeData.sort((a, b) => a.x - b.x);

        return context;
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override updateDatumSelection(opts: {
        nodeData: HistogramNodeDatum[];
        datumSelection: Selection<Rect, HistogramNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;

        return datumSelection.update(nodeData, undefined, (datum: HistogramNodeDatum) => datum.domain.join('_'));
    }

    private getItemBaseStyle(highlighted: boolean) {
        const { properties } = this;

        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return getShapeStyle(
            {
                fill: highlightStyle?.fill ?? properties.fill,
                fillOpacity: highlightStyle?.fillOpacity ?? properties.fillOpacity,
                stroke: highlightStyle?.stroke ?? properties.stroke,
                strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
                strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
                lineDash: highlightStyle?.lineDash ?? properties.lineDash,
                lineDashOffset: highlightStyle?.lineDashOffset ?? properties.lineDashOffset,
                cornerRadius: properties.cornerRadius,
            },
            properties.fillGradientDefaults,
            properties.fillPatternDefaults
        );
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<Rect, HistogramNodeDatum>;
        isHighlight: boolean;
    }) {
        const { isHighlight: isDatumHighlighted } = opts;
        const { shadow } = this.properties;

        const style = this.getItemBaseStyle(isDatumHighlighted);
        const fillBBox = this.getShapeFillBBox();

        opts.datumSelection.each((rect, datum) => {
            const { cornerRadius } = style;
            const { topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius } =
                datum;

            applyShapeStyle(rect, style, undefined, fillBBox);
            rect.topLeftCornerRadius = topLeftCornerRadius ? cornerRadius : 0;
            rect.topRightCornerRadius = topRightCornerRadius ? cornerRadius : 0;
            rect.bottomRightCornerRadius = bottomRightCornerRadius ? cornerRadius : 0;
            rect.bottomLeftCornerRadius = bottomLeftCornerRadius ? cornerRadius : 0;
            rect.crisp = datum.crisp;
            rect.fillShadow = shadow;
            rect.visible = datum.height > 0; // prevent stroke from rendering for zero height columns
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: HistogramNodeDatum[];
        labelSelection: Selection<Text, HistogramNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
            text.textAlign = 'center';
            text.textBaseline = 'middle';
        });
    }

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, HistogramNodeDatum> }) {
        const { fontStyle, fontWeight, fontFamily, fontSize, color } = this.properties.label;
        const labelEnabled = this.isLabelEnabled();

        opts.labelSelection.each((text, datum) => {
            if (labelEnabled && datum?.label) {
                text.text = datum.label.text;
                text.x = datum.label.x;
                text.y = datum.label.y;
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontFamily = fontFamily;
                text.fontSize = fontSize;
                text.fill = color;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<HistogramNodeDatum>) {
        const { value: childNode } = this.contentGroup.children().next();
        if (childNode) {
            addHitTestersToQuadtree(quadtree, childNode.children() as Iterable<Rect>);
        }
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const {
            id: seriesId,
            dataModel,
            processedData,
            axes,
            properties,
            ctx: { localeManager },
        } = this;
        const { xKey, xName, yKey, yName, tooltip } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || processedData?.type !== 'grouped' || !xAxis || !yAxis) {
            return;
        }

        const group = processedData.groups[datumIndex];
        const { aggregation, datumIndices, keys } = group;
        const [[negativeAgg, positiveAgg] = [0, 0]] = aggregation;
        const frequency = datumIndices.length;
        const domain = keys;
        const [rangeMin, rangeMax]: number[] = domain;
        const aggregatedValue = negativeAgg + positiveAgg;
        const datum: AgHistogramBinDatum<any> = {
            data: [...dataModel.forEachDatum(this, processedData, group)],
            aggregatedValue,
            frequency,
            domain: domain as any,
        };

        const data: TooltipContentDataRow[] = [
            {
                label: xName,
                fallbackLabel: xKey,
                value: `${xAxis.formatDatum(rangeMin)} - ${xAxis.formatDatum(rangeMax)}`,
            },
            { label: localeManager.t('seriesHistogramTooltipFrequency'), value: yAxis.formatDatum(frequency) },
        ];

        if (yKey != null) {
            let label: string;
            switch (properties.aggregation) {
                case 'sum':
                    label = localeManager.t('seriesHistogramTooltipSum', { yName: yName ?? yKey });
                    break;
                case 'mean':
                    label = localeManager.t('seriesHistogramTooltipMean', { yName: yName ?? yKey });
                    break;
                case 'count':
                    label = localeManager.t('seriesHistogramTooltipCount', { yName: yName ?? yKey });
                    break;
            }

            data.push({ label, value: yAxis.formatDatum(aggregatedValue) });
        }

        return this.formatTooltipWithContext(
            tooltip,
            {
                symbol: this.legendItemSymbol(),
                data,
            },
            {
                seriesId,
                datum,
                title: yName,
                xKey,
                xName,
                yKey,
                yName,
                xRange: [rangeMin, rangeMax] satisfies [number, number],
                frequency,
                ...this.getItemBaseStyle(false),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
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
        } = this.properties;

        return {
            marker: getShapeStyle(
                {
                    fill: fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                },
                fillGradientDefaults,
                fillPatternDefaults
            ),
        };
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { xKey: itemId, yName, showInLegend } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: {
                    text: yName ?? itemId ?? 'Frequency',
                },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: HistogramAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes, 'normal'));
        fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], fns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    override animateWaitingUpdateReady(data: HistogramAnimationData) {
        const dataDiff = this.processedData?.reduced?.diff?.[this.id];
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

    protected computeFocusBounds({ datumIndex }: PickFocusInputs): BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex]);
    }
}
