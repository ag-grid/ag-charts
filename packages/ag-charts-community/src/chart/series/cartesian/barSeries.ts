import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type {
    AgBarSeriesStyle,
    AgErrorBoundSeriesTooltipRendererParams,
    FontStyle,
    FontWeight,
} from '../../../options/agChartOptions';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
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
    normaliseGroupTo,
} from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { EMPTY_TOOLTIP_CONTENT, type TooltipContent } from '../../tooltip/tooltip';
import {
    type PickFocusInputs,
    SeriesNodePickMode,
    groupAccumulativeValueProperty,
    keyProperty,
    valueProperty,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { AbstractBarSeries } from './abstractBarSeries';
import { BarSeriesProperties } from './barSeriesProperties';
import { type RectConfig, computeBarFocusBounds } from './barUtil';
import {
    checkCrisp,
    collapsedStartingBarPosition,
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
    readonly fontStyle?: FontStyle;
    readonly fontWeight?: FontWeight;
    readonly fontSize: number;
    readonly fontFamily: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    readonly fill?: string;
}

interface BarNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum, Readonly<Point> {
    readonly xValue: string | number;
    readonly yValue: string | number;
    readonly valueIndex: number;
    readonly cumulativeValue: number;
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

enum BarSeriesNodeTag {
    Bar,
    Label,
}

export class BarSeries extends AbstractBarSeries<Rect, BarSeriesProperties, BarNodeDatum> {
    static readonly className = 'BarSeries';
    static readonly type = 'bar' as const;

    override properties = new BarSeriesProperties();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasHighlightedLabels: true,
            datumSelectionGarbageCollection: false,
            animationAlwaysUpdateSelections: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    override async processData(dataController: DataController) {
        if (!this.properties.isValid() || !this.data) {
            return;
        }

        const { seriesGrouping: { groupIndex = this.id } = {}, data = [] } = this;
        const { xKey, yKey, normalizedTo } = this.properties;

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
        const { processedData, dataModel, smallestDataInterval } = this;
        if (!processedData || !dataModel || processedData.data.length === 0) return [];

        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();

        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yExtent = dataModel.getDomain(this, `yValue-end`, 'value', processedData);

        if (direction === this.getCategoryDirection()) {
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            const scalePadding = isFiniteNumber(smallestDataInterval) ? smallestDataInterval * 0.5 : 0;
            const keysExtent = extent(keys) ?? [NaN, NaN];

            const d0 = keysExtent[0] + -scalePadding;
            const d1 = keysExtent[1] + scalePadding;
            return fixNumericExtent([d0, d1], categoryAxis);
        } else if (this.getValueAxis() instanceof LogAxis) {
            return fixNumericExtent(yExtent, valueAxis);
        } else {
            const fixedYExtent = [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])];
            return fixNumericExtent(fixedYExtent, valueAxis);
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
        const yStartIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-start`);
        const yEndIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-end`);
        const yRangeIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-range`);
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const context = {
            itemId: yKey,
            nodeData: [] as BarNodeDatum[],
            labelData: [] as BarNodeDatum[],
            scales: this.calculateScaling(),
            visible: this.visible || animationEnabled,
        };

        const { groupScale, processedData } = this;
        processedData?.data.forEach(({ keys, datum: seriesDatum, values, aggValues }) => {
            values.forEach((value, valueIndex) => {
                const xValue = keys[xIndex];
                const x = xScale.convert(xValue);

                const currY = +value[yEndIndex];
                const prevY = +value[yStartIndex];
                const yRawValue = value[yRawIndex];
                const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);
                const isUpward = isPositive !== yReversed;
                const yRange = aggValues?.[yRangeIndex][isPositive ? 1 : 0] ?? 0;
                const barX = x + groupScale.convert(String(groupIndex)) + barOffset;

                if (isNaN(currY)) return;

                const y = yScale.convert(currY);
                const bottomY = yScale.convert(prevY);

                const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

                const bboxHeight = yScale.convert(yRange);
                const bboxBottom = yScale.convert(0);

                const rect = {
                    x: barAlongX ? Math.min(y, bottomY) : barX,
                    y: barAlongX ? barX : Math.min(y, bottomY),
                    width: barAlongX ? Math.abs(bottomY - y) : barWidth,
                    height: barAlongX ? barWidth : Math.abs(bottomY - y),
                };

                const clipBBox = new BBox(rect.x, rect.y, rect.width, rect.height);

                const barRect = {
                    x: barAlongX ? Math.min(bboxBottom, bboxHeight) : barX,
                    y: barAlongX ? barX : Math.min(bboxBottom, bboxHeight),
                    width: barAlongX ? Math.abs(bboxBottom - bboxHeight) : barWidth,
                    height: barAlongX ? barWidth : Math.abs(bboxBottom - bboxHeight),
                    clipBBox,
                };

                const {
                    fontStyle: labelFontStyle,
                    fontWeight: labelFontWeight,
                    fontSize: labelFontSize,
                    fontFamily: labelFontFamily,
                    color: labelColor,
                    placement,
                } = label;

                const labelText = this.getLabelText(
                    this.properties.label,
                    {
                        datum: seriesDatum[valueIndex],
                        value: yRawValue,
                        xKey,
                        yKey,
                        xName,
                        yName,
                        legendItemName,
                    },
                    (v) => (isFiniteNumber(v) ? v.toFixed(2) : String(v))
                );
                const labelDatum = labelText
                    ? {
                          text: labelText,
                          fill: labelColor,
                          fontStyle: labelFontStyle,
                          fontWeight: labelFontWeight,
                          fontSize: labelFontSize,
                          fontFamily: labelFontFamily,
                          ...adjustLabelPlacement({
                              isPositive,
                              isVertical: !barAlongX,
                              placement,
                              rect,
                          }),
                      }
                    : undefined;

                const lengthRatioMultiplier = this.shouldFlipXY() ? rect.height : rect.width;
                const nodeData: BarNodeDatum = {
                    series: this,
                    itemId: yKey,
                    datum: seriesDatum[valueIndex],
                    valueIndex,
                    cumulativeValue: currY,
                    xValue,
                    yValue: yRawValue,
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
                    label: labelDatum,
                    missing: yRawValue == null,
                };
                context.nodeData.push(nodeData);
                context.labelData.push(nodeData);
            });
        });

        return context;
    }

    protected nodeFactory() {
        return new Rect();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: BarNodeDatum[];
        datumSelection: Selection<Rect, BarNodeDatum>;
    }) {
        return opts.datumSelection.update(
            opts.nodeData,
            (rect) => {
                rect.tag = BarSeriesNodeTag.Bar;
            },
            (datum) => createDatumId(datum.xValue, datum.valueIndex)
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
            formatter,
            shadow,
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

        opts.datumSelection.each((rect, datum) => {
            const style: RectConfig = {
                fill,
                stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow: shadow,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                cornerRadius: datum.cornerRadius,
                topLeftCornerRadius: datum.topLeftCornerRadius,
                topRightCornerRadius: datum.topRightCornerRadius,
                bottomRightCornerRadius: datum.bottomRightCornerRadius,
                bottomLeftCornerRadius: datum.bottomLeftCornerRadius,
            };
            const visible = categoryAlongX
                ? (datum.clipBBox?.width ?? datum.width) > 0
                : (datum.clipBBox?.height ?? datum.height) > 0;

            const config = getRectConfig({
                datum,
                ctx: this.ctx,
                seriesId: this.id,
                isHighlighted: opts.isHighlight,
                highlightStyle: itemHighlightStyle,
                yKey,
                style,
                formatter,
                stackGroup,
            });
            config.crisp = crisp;
            config.visible = visible;
            updateRect({ rect, config });
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: BarNodeDatum[];
        labelSelection: Selection<Text, BarNodeDatum>;
    }) {
        const data = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(data, (text) => {
            text.tag = BarSeriesNodeTag.Label;
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

        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, tooltip, formatter, stackGroup, legendItemName } =
            this.properties;
        const { xValue, yValue, datum, itemId } = nodeDatum;

        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        let format: AgBarSeriesStyle | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                seriesId,
                datum,
                xKey,
                yKey,
                stackGroup,
                fill,
                stroke,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                highlighted: false,
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
            (_, datum) => createDatumId(datum.xValue, datum.valueIndex),
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
