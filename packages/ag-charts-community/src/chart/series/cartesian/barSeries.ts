import type { AgBarSeriesStyle, AgErrorBoundSeriesTooltipRendererParams } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import { sanitizeHtml } from '../../../util/sanitize';
import { isFiniteNumber } from '../../../util/type-guards';
import type { RequireOptional } from '../../../util/types';
import { LogAxis } from '../../axis/logAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import {
    LARGEST_KEY_INTERVAL,
    SMALLEST_KEY_INTERVAL,
    animationValidation,
    createDatumId,
    diff,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    valueProperty,
} from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { EMPTY_TOOLTIP_CONTENT, type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { AbstractBarSeries } from './abstractBarSeries';
import { BarSeriesProperties } from './barSeriesProperties';
import {
    type RectConfig,
    checkCrisp,
    collapsedStartingBarPosition,
    computeBarFocusBounds,
    getRectConfig,
    prepareBarAnimationFunctions,
    resetBarSelectionsFn,
    updateRect,
} from './barUtil';
import {
    type CartesianAnimationData,
    type CartesianSeriesNodeDatum,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { adjustLabelPlacement, updateLabelNode } from './labelUtil';

interface BarNodeLabelDatum extends Readonly<Point> {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
}

interface BarNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum, Readonly<Point> {
    readonly xValue: string | number;
    readonly yValue: string | number;
    readonly valueIndex: number;
    readonly cumulativeValue: number;
    readonly phantom: boolean;
    readonly width: number;
    readonly height: number;
    readonly fill: string | undefined;
    readonly stroke: string | undefined;
    readonly opacity: number | undefined;
    readonly strokeWidth: number;
    readonly cornerRadius: number;
    readonly topLeftCornerRadius: boolean;
    readonly topRightCornerRadius: boolean;
    readonly bottomRightCornerRadius: boolean;
    readonly bottomLeftCornerRadius: boolean;
    readonly clipBBox: BBox | undefined;
    readonly label?: BarNodeLabelDatum;
}

type BarAnimationData = CartesianAnimationData<Rect, BarNodeDatum>;

export class BarSeries extends AbstractBarSeries<Rect, BarSeriesProperties, BarNodeDatum> {
    static readonly className = 'BarSeries';
    static readonly type = 'bar' as const;

    override properties = new BarSeriesProperties();

    override get nearestNodeAxis() {
        return this.properties.sparklineMode ? ('main' as const) : undefined;
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: [],
            hasHighlightedLabels: true,
            datumSelectionGarbageCollection: false,
            animationAlwaysUpdateSelections: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    private crossFilteringEnabled() {
        return (
            this.properties.yFilterKey != null && (this.seriesGrouping == null || this.seriesGrouping.stackIndex === 0)
        );
    }

    override async processData(dataController: DataController) {
        if (!this.properties.isValid() || !this.data) {
            return;
        }

        const { seriesGrouping: { groupIndex = this.id } = {}, data = [] } = this;
        const { xKey, yKey, yFilterKey, normalizedTo } = this.properties;

        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;

        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const stackGroupName = `bar-stack-${groupIndex}-yValues`;
        const stackGroupTrailingName = `${stackGroupName}-trailing`;

        const extraProps = [];
        if (isFiniteNumber(normalizedTo)) {
            extraProps.push(
                normaliseGroupTo([stackGroupName, stackGroupTrailingName], Math.abs(normalizedTo), 'range')
            );
        }
        if (animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const visibleProps = this.visible ? {} : { forceValue: 0 };
        const { processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(xKey, xScaleType, { id: 'xValue' }),
                valueProperty(yKey, yScaleType, { id: `yValue-raw`, invalidValue: null, ...visibleProps }),
                ...(this.crossFilteringEnabled()
                    ? [
                          valueProperty(yFilterKey!, yScaleType, {
                              id: `yFilterValue`,
                              invalidValue: null,
                              ...visibleProps,
                          }),
                      ]
                    : []),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    'current',
                    {
                        id: `yValue-end`,
                        rangeId: `yValue-range`,
                        invalidValue: null,
                        missingValue: 0,
                        groupId: stackGroupName,
                        separateNegative: true,
                        ...visibleProps,
                    },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'trailing',
                    'current',
                    {
                        id: `yValue-start`,
                        invalidValue: null,
                        missingValue: 0,
                        groupId: stackGroupTrailingName,
                        separateNegative: true,
                        ...visibleProps,
                    },
                    yScaleType
                ),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL, LARGEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: true,
            groupByData: false,
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
        this.largestDataInterval = processedData.reduced?.largestKeyInterval;

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!dataModel || !processedData?.data.length) return [];

        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);

        let yExtent = dataModel.getDomain(this, `yValue-end`, 'value', processedData);
        const yFilterExtent = this.crossFilteringEnabled()
            ? dataModel.getDomain(this, `yFilterValue`, 'value', processedData)
            : undefined;
        if (yFilterExtent != null) {
            yExtent = [Math.min(yExtent[0], yFilterExtent[0]), Math.max(yExtent[1], yFilterExtent[1])];
        }

        if (direction === this.getCategoryDirection()) {
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }
            return this.padBandExtent(keys);
        } else if (this.getValueAxis() instanceof LogAxis) {
            return fixNumericExtent(yExtent);
        } else {
            const fixedYExtent = [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])];
            return fixNumericExtent(fixedYExtent);
        }
    }

    async createNodeData() {
        const { dataModel } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !xAxis || !yAxis || !this.properties.isValid()) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, cornerRadius, legendItemName, label } =
            this.properties;

        const yReversed = yAxis.isReversed();

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const barOffset = ContinuousScale.is(xScale) ? barWidth * -0.5 : 0;

        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-raw`);
        const yFilterIndex = this.crossFilteringEnabled()
            ? dataModel.resolveProcessedDataIndexById(this, `yFilterValue`)
            : undefined;
        const yStartIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-start`);
        const yEndIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-end`);
        const yRangeIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-range`);
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const nodeDatum = ({
            datum,
            valueIndex,
            xValue,
            yValue,
            cumulativeValue,
            phantom,
            currY,
            prevY,
            isPositive,
            yRange,
            labelText,
            crossScale = 1,
        }: {
            datum: any;
            valueIndex: number;
            xValue: number;
            yValue: number;
            cumulativeValue: number;
            phantom: boolean;
            currY: number;
            prevY: number;
            isPositive: boolean;
            yRange: number;
            labelText: string | undefined;
            crossScale: number | undefined;
        }): BarNodeDatum => {
            const x = xScale.convert(xValue);

            const isUpward = isPositive !== yReversed;
            const barX = x + groupScale.convert(String(groupIndex)) + barOffset;

            const y = yScale.convert(currY);
            const bottomY = yScale.convert(prevY);

            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

            const bboxHeight = yScale.convert(yRange);
            const bboxBottom = yScale.convert(0);

            const xOffset = barWidth * 0.5 * (1 - crossScale);
            const rect = {
                x: barAlongX ? Math.min(y, bottomY) : barX + xOffset,
                y: barAlongX ? barX + xOffset : Math.min(y, bottomY),
                width: barAlongX ? Math.abs(bottomY - y) : barWidth * crossScale,
                height: barAlongX ? barWidth * crossScale : Math.abs(bottomY - y),
            };

            const clipBBox = new BBox(rect.x, rect.y, rect.width, rect.height);

            const barRect = {
                x: barAlongX ? Math.min(bboxBottom, bboxHeight) : barX + xOffset,
                y: barAlongX ? barX + xOffset : Math.min(bboxBottom, bboxHeight),
                width: barAlongX ? Math.abs(bboxBottom - bboxHeight) : barWidth * crossScale,
                height: barAlongX ? barWidth * crossScale : Math.abs(bboxBottom - bboxHeight),
            };

            const lengthRatioMultiplier = this.shouldFlipXY() ? rect.height : rect.width;

            return {
                series: this,
                itemId: phantom ? createDatumId(yKey, phantom) : yKey,
                datum,
                valueIndex,
                cumulativeValue,
                phantom,
                xValue,
                yValue,
                yKey,
                xKey,
                capDefaults: {
                    lengthRatioMultiplier: lengthRatioMultiplier,
                    lengthMax: lengthRatioMultiplier,
                },
                x: barRect.x,
                y: barRect.y,
                width: barRect.width,
                height: barRect.height,
                midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
                fill,
                stroke,
                opacity: 1,
                strokeWidth,
                cornerRadius,
                topLeftCornerRadius: barAlongX !== isUpward,
                topRightCornerRadius: isUpward,
                bottomRightCornerRadius: barAlongX === isUpward,
                bottomLeftCornerRadius: !isUpward,
                clipBBox,
                label:
                    labelText != null
                        ? {
                              text: labelText,
                              ...adjustLabelPlacement({
                                  isPositive,
                                  isVertical: !barAlongX,
                                  placement: label.placement,
                                  rect,
                              }),
                          }
                        : undefined,
                missing: yValue == null,
                focusable: !phantom,
            };
        };

        const { groupScale, processedData } = this;
        const phantomNodes: BarNodeDatum[] = [];
        const nodes: BarNodeDatum[] = [];
        const labels: BarNodeDatum[] = [];
        processedData?.data.forEach(({ keys, datum: seriesDatum, values, aggValues }) => {
            values.forEach((value, valueIndex) => {
                const xValue = keys[xIndex];
                const yRawValue = value[yRawIndex];
                const yStart = Number(value[yStartIndex]);
                const yFilterValue = yFilterIndex != null ? Number(value[yFilterIndex]) : undefined;
                const yEnd = Number(value[yEndIndex]);
                const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);
                const yRange = aggValues?.[yRangeIndex][isPositive ? 1 : 0] ?? 0;

                if (!Number.isFinite(yEnd)) return;
                if (yFilterValue != null && !Number.isFinite(yFilterValue)) return;

                const labelText =
                    yRawValue != null
                        ? this.getLabelText(
                              this.properties.label,
                              {
                                  datum: seriesDatum[valueIndex],
                                  value: yFilterValue ?? yRawValue,
                                  xKey,
                                  yKey,
                                  xName,
                                  yName,
                                  legendItemName,
                              },
                              (v) => (isFiniteNumber(v) ? v.toFixed(2) : String(v))
                          )
                        : undefined;

                const inset = yFilterValue != null && yFilterValue > yRawValue;

                const nodeData = nodeDatum({
                    datum: seriesDatum[valueIndex],
                    valueIndex,
                    xValue,
                    yValue: yFilterValue ?? yRawValue,
                    cumulativeValue: yFilterValue ?? yEnd,
                    phantom: false,
                    currY: yFilterValue != null ? yStart + yFilterValue : yEnd,
                    prevY: yStart,
                    isPositive,
                    yRange: Math.max(yStart + (yFilterValue ?? -Infinity), yRange),
                    labelText,
                    crossScale: inset ? 0.6 : undefined,
                });
                nodes.push(nodeData);
                labels.push(nodeData);

                if (yFilterValue != null) {
                    const phantomNodeData = nodeDatum({
                        datum: seriesDatum[valueIndex],
                        valueIndex,
                        xValue,
                        yValue: yFilterValue,
                        cumulativeValue: yFilterValue,
                        phantom: true,
                        currY: yEnd,
                        prevY: yStart,
                        isPositive,
                        yRange,
                        labelText: undefined,
                        crossScale: undefined,
                    });
                    phantomNodes.push(phantomNodeData);
                }
            });
        });

        return {
            itemId: yKey,
            nodeData: phantomNodes.length > 0 ? [...phantomNodes, ...nodes] : nodes,
            labelData: labels,
            scales: this.calculateScaling(),
            visible: this.visible || animationEnabled,
        };
    }

    protected nodeFactory() {
        return new Rect();
    }

    protected override getHighlightData(
        nodeData: BarNodeDatum[],
        highlightedItem: BarNodeDatum
    ): BarNodeDatum[] | undefined {
        const highlightItem = nodeData.find(
            (nodeDatum) => nodeDatum.datum === highlightedItem.datum && !nodeDatum.phantom
        );
        return highlightItem != null ? [highlightItem] : undefined;
    }

    protected override async updateDatumSelection(opts: {
        nodeData: BarNodeDatum[];
        datumSelection: Selection<Rect, BarNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) =>
            createDatumId(datum.xValue, datum.valueIndex, datum.phantom)
        );
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: Selection<Rect, BarNodeDatum>;
        isHighlight: boolean;
    }) {
        if (!this.properties.isValid()) {
            return;
        }

        const {
            yKey,
            stackGroup,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            itemStyler,
            shadow,
            highlightStyle: { item: itemHighlightStyle },
        } = this.properties;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp =
            this.properties.crisp ??
            checkCrisp(xAxis?.scale, xAxis?.visibleRange, this.smallestDataInterval, this.largestDataInterval);
        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        const style: RectConfig = {
            fill,
            stroke,
            lineDash,
            lineDashOffset,
            fillShadow: shadow,
            strokeWidth: this.getStrokeWidth(strokeWidth),
            fillOpacity: 0,
            strokeOpacity: 0,
        };
        const rectParams = {
            datum: undefined as unknown as BarNodeDatum,
            ctx: this.ctx,
            seriesId: this.id,
            isHighlighted: opts.isHighlight,
            highlightStyle: itemHighlightStyle,
            yKey,
            style,
            itemStyler,
            stackGroup,
        };
        opts.datumSelection.each((rect, datum) => {
            style.fillOpacity = fillOpacity * (datum.phantom ? 0.2 : 1);
            style.strokeOpacity = strokeOpacity * (datum.phantom ? 0.2 : 1);
            style.cornerRadius = datum.cornerRadius;
            style.topLeftCornerRadius = datum.topLeftCornerRadius;
            style.topRightCornerRadius = datum.topRightCornerRadius;
            style.bottomRightCornerRadius = datum.bottomRightCornerRadius;
            style.bottomLeftCornerRadius = datum.bottomLeftCornerRadius;
            const visible = categoryAlongX
                ? (datum.clipBBox?.width ?? datum.width) > 0
                : (datum.clipBBox?.height ?? datum.height) > 0;

            rectParams.datum = datum;
            const config = getRectConfig(rectParams);
            config.crisp = crisp;
            config.visible = visible;
            updateRect(rect, config);
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: BarNodeDatum[];
        labelSelection: Selection<Text, BarNodeDatum>;
    }) {
        const data = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(data, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, BarNodeDatum> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.properties.label, datum.label);
        });
    }

    getTooltipHtml(nodeDatum: BarNodeDatum): TooltipContent {
        const {
            id: seriesId,
            processedData,
            ctx: { callbackCache },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!processedData || !this.properties.isValid() || !xAxis || !yAxis) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, tooltip, itemStyler, stackGroup, legendItemName } =
            this.properties;
        const { xValue, yValue, datum, itemId } = nodeDatum;

        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        let format: AgBarSeriesStyle | undefined;

        if (itemStyler) {
            format = callbackCache.call(itemStyler, {
                seriesId,
                datum,
                xKey,
                yKey,
                stackGroup,
                fill,
                stroke,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                highlighted: false,
                cornerRadius: this.properties.cornerRadius,
                fillOpacity: this.properties.fillOpacity,
                strokeOpacity: this.properties.strokeOpacity,
                lineDash: this.properties.lineDash ?? [],
                lineDashOffset: this.properties.lineDashOffset,
            });
        }

        const color = format?.fill ?? fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                itemId,
                datum,
                xKey,
                yKey,
                xName,
                yName,
                stackGroup,
                title,
                color,
                legendItemName,
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { showInLegend } = this.properties;

        if (legendType !== 'category' || !this.data?.length || !this.properties.isValid() || !showInLegend) {
            return [];
        }

        const { yKey, yName, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, legendItemName, visible } =
            this.properties;

        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
                enabled: visible,
                label: { text: legendItemName ?? yName ?? yKey },
                symbols: [{ marker: { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } }],
                legendItemName,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection, annotationSelections }: BarAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, 'normal'));

        fromToMotion(this.id, 'nodes', this.ctx.animationManager, [datumSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, ...annotationSelections);
    }

    override animateWaitingUpdateReady(data: BarAnimationData) {
        const { datumSelection, labelSelection, annotationSelections, previousContextData } = data;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const dataDiff = this.processedData?.reduced?.diff;
        const mode = previousContextData == null ? 'fade' : 'normal';
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, mode));

        fromToMotion(
            this.id,
            'nodes',
            this.ctx.animationManager,
            [datumSelection],
            fns,
            (_, datum) => createDatumId(datum.xValue, datum.valueIndex, datum.phantom),
            dataDiff
        );

        const hasMotion = dataDiff?.changed ?? true;
        if (hasMotion) {
            seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
            seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, ...annotationSelections);
        }
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({ datumIndex, seriesRect }: PickFocusInputs): BBox | undefined {
        const datumBox = this.contextNodeData?.nodeData[datumIndex].clipBBox;
        return computeBarFocusBounds(datumBox, this.contentGroup, seriesRect);
    }
}
