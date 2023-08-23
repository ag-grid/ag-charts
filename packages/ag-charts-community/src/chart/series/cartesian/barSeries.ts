import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import { BandScale } from '../../../scale/bandScale';
import type { DropShadow } from '../../../scene/dropShadow';
import type { SeriesNodeDataContext } from '../series';
import {
    SeriesTooltip,
    SeriesNodePickMode,
    keyProperty,
    valueProperty,
    groupAccumulativeValueProperty,
} from '../series';
import { Label } from '../../label';
import { PointerEvents } from '../../../scene/node';
import type { ChartLegendDatum, CategoryLegendDatum } from '../../legendDatum';
import type { CartesianAnimationData, CartesianSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries, CartesianSeriesNodeClickEvent, CartesianSeriesNodeDoubleClickEvent } from './cartesianSeries';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { toTooltipHtml } from '../../tooltip/tooltip';
import { extent } from '../../../util/array';
import { sanitizeHtml } from '../../../util/sanitize';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { Point } from '../../../scene/point';
import type { ValidatePredicate } from '../../../util/validation';
import {
    NUMBER,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    Validate,
    OPTIONAL,
    OPT_STRING,
    OPT_COLOR_STRING,
} from '../../../util/validation';
import { CategoryAxis } from '../../axis/categoryAxis';
import { GroupedCategoryAxis } from '../../axis/groupedCategoryAxis';
import type {
    AgCartesianSeriesLabelFormatterParams,
    AgTooltipRendererResult,
    AgBarSeriesFormatterParams,
    AgBarSeriesTooltipRendererParams,
    AgBarSeriesFormat,
    AgBarSeriesLabelPlacement,
    FontStyle,
    FontWeight,
} from '../../agChartOptions';
import { LogAxis } from '../../axis/logAxis';
import { normaliseGroupTo, SMALLEST_KEY_INTERVAL, diff } from '../../data/processors';
import * as easing from '../../../motion/easing';
import type { RectConfig } from './barUtil';
import { getRectConfig, updateRect, checkCrisp, calculateStep } from './barUtil';
import { updateLabel, createLabelData } from './labelUtil';
import type { ModuleContext } from '../../../util/moduleContext';
import type { DataController } from '../../data/dataController';

const BAR_LABEL_PLACEMENTS: AgBarSeriesLabelPlacement[] = ['inside', 'outside'];
const OPT_BAR_LABEL_PLACEMENT: ValidatePredicate = (v: any, ctx) =>
    OPTIONAL(v, ctx, (v: any) => BAR_LABEL_PLACEMENTS.includes(v));

interface BarNodeLabelDatum extends Readonly<Point> {
    readonly text: string;
    readonly fontStyle?: FontStyle;
    readonly fontWeight?: FontWeight;
    readonly fontSize: number;
    readonly fontFamily: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    readonly fill: string;
}

interface BarNodeDatum extends CartesianSeriesNodeDatum, Readonly<Point> {
    readonly index: number;
    readonly xValue: number;
    readonly yValue: number;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly label?: BarNodeLabelDatum;
}

type BarAnimationData = CartesianAnimationData<SeriesNodeDataContext<BarNodeDatum>, Rect>;

enum BarSeriesNodeTag {
    Bar,
    Label,
}

class BarSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams) => string = undefined;

    @Validate(OPT_BAR_LABEL_PLACEMENT)
    placement: AgBarSeriesLabelPlacement = 'inside';
}

class BarSeriesTooltip extends SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgBarSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

export class BarSeries extends CartesianSeries<SeriesNodeDataContext<BarNodeDatum>, Rect> {
    static className = 'BarSeries';
    static type: 'bar' | 'column' = 'bar' as const;

    readonly label = new BarSeriesLabel();

    tooltip: BarSeriesTooltip = new BarSeriesTooltip();

    @Validate(OPT_COLOR_STRING)
    fill: string = '#c16068';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#874349';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgBarSeriesFormatterParams<any>) => AgBarSeriesFormat = undefined;

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasHighlightedLabels: true,
        });

        this.label.enabled = false;
    }

    /**
     * Used to get the position of bars within each group.
     */
    private groupScale = new BandScale<string>();

    protected resolveKeyDirection(direction: ChartAxisDirection) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }

    @Validate(OPT_STRING)
    stackGroup?: string = undefined;

    @Validate(OPT_NUMBER())
    normalizedTo?: number;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    shadow?: DropShadow = undefined;

    protected smallestDataInterval?: { x: number; y: number } = undefined;
    async processData(dataController: DataController) {
        const { xKey, yKey, normalizedTo, seriesGrouping: { groupIndex = this.id } = {}, data = [] } = this;
        const normalizedToAbs = Math.abs(normalizedTo ?? NaN);

        const isContinuousX = this.getCategoryAxis()?.scale instanceof ContinuousScale;
        const isContinuousY = this.getValueAxis()?.scale instanceof ContinuousScale;
        const stackGroupName = `bar-stack-${groupIndex}-yValues`;
        const stackGroupTrailingName = `${stackGroupName}-trailing`;

        const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
        const extraProps = [];
        if (normaliseTo) {
            extraProps.push(normaliseGroupTo(this, [stackGroupName, stackGroupTrailingName], normaliseTo, 'range'));
        }

        if (!this.ctx.animationManager?.skipAnimations && this.processedData) {
            extraProps.push(diff(this.processedData));
        }

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yKey, isContinuousY, { id: `yValue-raw`, invalidValue: null }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'normal', 'current', {
                    id: `yValue-end`,
                    invalidValue: null,
                    groupId: stackGroupName,
                    separateNegative: true,
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'trailing', 'current', {
                    id: `yValue-start`,
                    invalidValue: null,
                    groupId: stackGroupTrailingName,
                    separateNegative: true,
                }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: true,
            dataVisible: this.visible,
        });

        this.dataModel = dataModel;
        this.processedData = processedData;

        this.smallestDataInterval = {
            x: processedData.reduced?.[SMALLEST_KEY_INTERVAL.property] ?? Infinity,
            y: Infinity,
        };

        this.animationState.transition('updateData');
    }

    getDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!processedData || !dataModel) return [];

        const { reduced: { [SMALLEST_KEY_INTERVAL.property]: smallestX } = {} } = processedData;

        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();

        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yExtent = dataModel.getDomain(this, `yValue-end`, 'value', processedData);

        if (direction === this.getCategoryDirection()) {
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                return keys;
            }

            const scalePadding = isFinite(smallestX) ? smallestX : 0;
            const keysExtent = extent(keys) ?? [NaN, NaN];
            if (direction === ChartAxisDirection.Y) {
                return this.fixNumericExtent([keysExtent[0] + -scalePadding, keysExtent[1]], categoryAxis);
            }
            return this.fixNumericExtent([keysExtent[0], keysExtent[1] + scalePadding], categoryAxis);
        } else if (this.getValueAxis() instanceof LogAxis) {
            return this.fixNumericExtent(yExtent as any, valueAxis);
        } else {
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return this.fixNumericExtent(fixedYExtent as any, valueAxis);
        }
    }

    protected getNodeClickEvent(event: MouseEvent, datum: BarNodeDatum): CartesianSeriesNodeClickEvent<any> {
        return new CartesianSeriesNodeClickEvent(this.xKey ?? '', datum.yKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: BarNodeDatum
    ): CartesianSeriesNodeDoubleClickEvent<any> {
        return new CartesianSeriesNodeDoubleClickEvent(this.xKey ?? '', datum.yKey, event, datum, this);
    }

    private getCategoryAxis(): ChartAxis | undefined {
        const direction = this.getCategoryDirection();
        return this.axes[direction];
    }

    private getValueAxis(): ChartAxis | undefined {
        const direction = this.getBarDirection();
        return this.axes[direction];
    }

    async createNodeData() {
        const { visible, dataModel } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(dataModel && visible && xAxis && yAxis)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const {
            groupScale,
            yKey = '',
            xKey = '',
            fill,
            stroke,
            strokeWidth,
            label,
            id: seriesId,
            processedData,
            ctx,
            ctx: { seriesStateManager },
            smallestDataInterval,
        } = this;

        let xBandWidth = xScale.bandwidth;

        if (xScale instanceof ContinuousScale) {
            const rangeExtent = Math.max(xAxis.range[0], xAxis.range[1]);
            const xDomain = xAxis.scale.getDomain?.();
            const domainExtent = xDomain?.[1] - xDomain?.[0];
            const step = calculateStep(rangeExtent, domainExtent, smallestDataInterval?.x);

            xBandWidth = step;
        }

        const domain = [];
        const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
        for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
            domain.push(String(groupIdx));
        }
        groupScale.domain = domain;
        groupScale.range = [0, xBandWidth ?? 0];

        if (xAxis instanceof CategoryAxis) {
            groupScale.paddingInner = xAxis.groupPaddingInner;
        } else if (xAxis instanceof GroupedCategoryAxis) {
            groupScale.padding = 0.1;
        } else {
            // Number or Time axis
            groupScale.padding = 0;
        }

        // To get exactly `0` padding we need to turn off rounding
        if (groupScale.padding === 0) {
            groupScale.round = false;
        } else {
            groupScale.round = true;
        }

        const barWidth =
            groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume bar charts.
                  groupScale.bandwidth
                : // Handle high-volume bar charts gracefully.
                  groupScale.rawBandwidth;

        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`, 'key').index;
        const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-raw`).index;
        const yStartIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-start`).index;
        const yEndIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-end`).index;
        const context: SeriesNodeDataContext<BarNodeDatum> = {
            itemId: yKey,
            nodeData: [],
            labelData: [],
        };
        processedData?.data.forEach(({ keys, datum: seriesDatum, values }, dataIndex) => {
            const xValue = keys[xIndex];
            const x = xScale.convert(xValue);

            const currY = +values[0][yEndIndex];
            const prevY = +values[0][yStartIndex];
            const yRawValue = values[0][yRawIndex];
            const barX = x + groupScale.convert(String(groupIndex));

            // Bars outside of visible range are not rendered, so we create node data
            // only for the visible subset of user data.
            if (!xAxis.inRange(barX, barWidth)) {
                return;
            }
            if (isNaN(currY)) {
                return;
            }

            const y = yScale.convert(currY, { strict: false });
            const bottomY = yScale.convert(prevY, { strict: false });

            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
            const rect = {
                x: barAlongX ? Math.min(y, bottomY) : barX,
                y: barAlongX ? barX : Math.min(y, bottomY),
                width: barAlongX ? Math.abs(bottomY - y) : barWidth,
                height: barAlongX ? barWidth : Math.abs(bottomY - y),
            };
            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const {
                fontStyle: labelFontStyle,
                fontWeight: labelFontWeight,
                fontSize: labelFontSize,
                fontFamily: labelFontFamily,
                color: labelColor,
                formatter,
                placement,
            } = label;

            const {
                text: labelText,
                textAlign: labelTextAlign,
                textBaseline: labelTextBaseline,
                x: labelX,
                y: labelY,
            } = createLabelData({ value: yRawValue, rect, formatter, placement, seriesId, barAlongX, ctx });

            const nodeData: BarNodeDatum = {
                index: dataIndex,
                series: this,
                itemId: yKey,
                datum: seriesDatum[0],
                cumulativeValue: prevY + currY,
                xValue,
                yValue: yRawValue,
                yKey,
                xKey,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                nodeMidPoint,
                fill,
                stroke,
                strokeWidth,
                label: labelText
                    ? {
                          text: labelText,
                          fontStyle: labelFontStyle,
                          fontWeight: labelFontWeight,
                          fontSize: labelFontSize,
                          fontFamily: labelFontFamily,
                          textAlign: labelTextAlign,
                          textBaseline: labelTextBaseline,
                          fill: labelColor,
                          x: labelX,
                          y: labelY,
                      }
                    : undefined,
            };
            context.nodeData.push(nodeData);
            context.labelData.push(nodeData);
        });

        return [context];
    }

    protected nodeFactory() {
        return new Rect();
    }

    datumSelectionGarbageCollection = false;

    protected async updateDatumSelection(opts: {
        nodeData: BarNodeDatum[];
        datumSelection: Selection<Rect, BarNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;

        const getDatumId = (datum: BarNodeDatum) => datum.xValue;

        return datumSelection.update(nodeData, (rect) => (rect.tag = BarSeriesNodeTag.Bar), getDatumId);
    }

    protected async updateDatumNodes(opts: { datumSelection: Selection<Rect, BarNodeDatum>; isHighlight: boolean }) {
        const { datumSelection, isHighlight } = opts;
        const {
            yKey = '',
            fill,
            stroke,
            fillOpacity,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            shadow,
            formatter,
            id: seriesId,
            highlightStyle: { item: itemHighlightStyle },
            ctx,
            stackGroup,
        } = this;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp = checkCrisp(xAxis?.visibleRange);
        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        datumSelection.each((rect, datum) => {
            const style: RectConfig = {
                fill,
                stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow: shadow,
                strokeWidth: this.getStrokeWidth(this.strokeWidth),
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig({
                datum,
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                formatter,
                seriesId,
                stackGroup,
                ctx,
                yKey,
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
        const { labelData, labelSelection } = opts;
        const { enabled } = this.label;
        const data = enabled ? labelData : [];

        return labelSelection.update(data, (text) => {
            text.tag = BarSeriesNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, BarNodeDatum> }) {
        const { labelSelection } = opts;

        labelSelection.each((text, datum) => {
            const labelDatum = datum.label;

            updateLabel({ labelNode: text, labelDatum, config: this.label, visible: true });
        });
    }

    getTooltipHtml(nodeDatum: BarNodeDatum): string {
        const {
            xKey,
            yKey,
            processedData,
            ctx: { callbackCache },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        const { xValue, yValue, datum } = nodeDatum;

        if (!processedData || !xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, fill, stroke, tooltip, formatter, id: seriesId, stackGroup } = this;
        const { renderer: tooltipRenderer } = tooltip;
        const strokeWidth = this.getStrokeWidth(this.strokeWidth);
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));
        const title = sanitizeHtml(yName);
        const content = xString + ': ' + yString;

        let format: AgBarSeriesFormat | undefined = undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                xKey,
                yKey,
                seriesId,
                stackGroup,
            });
        }

        const color = format?.fill ?? fill;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        if (tooltipRenderer) {
            return toTooltipHtml(
                tooltipRenderer({
                    datum,
                    xKey,
                    xValue,
                    xName,
                    yKey,
                    yValue,
                    yName,
                    color,
                    title,
                    seriesId,
                    stackGroup,
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): ChartLegendDatum[] {
        const {
            id,
            data,
            xKey,
            yKey,
            yName,
            legendItemName,
            fill,
            stroke,
            fillOpacity,
            strokeOpacity,
            visible,
            showInLegend,
        } = this;

        if (!showInLegend || !data?.length || !xKey || !yKey) {
            return [];
        }

        const legendData: CategoryLegendDatum[] = [];

        legendData.push({
            legendType: 'category',
            id,
            itemId: yKey,
            seriesId: id,
            enabled: visible,
            label: {
                text: legendItemName ?? yName ?? yKey,
            },
            legendItemName,
            marker: {
                fill,
                stroke,
                fillOpacity: fillOpacity,
                strokeOpacity: strokeOpacity,
            },
        });

        return legendData;
    }

    animateEmptyUpdateReady({ datumSelections, labelSelections }: BarAnimationData) {
        const duration = this.ctx.animationManager?.defaultOptions.duration ?? 1000;
        const labelDuration = 200;

        const { startingX, startingY } = this.getDirectionStartingValues(datumSelections);

        datumSelections.forEach((datumSelection) => {
            datumSelection.each((rect, datum) => {
                let contextX = startingX;
                let contextWidth = 0;
                let contextY = datum.y;
                let contextHeight = datum.height;

                if (this.getBarDirection() === ChartAxisDirection.Y) {
                    contextX = datum.x;
                    contextWidth = datum.width;
                    contextY = startingY;
                    contextHeight = 0;
                }

                const props = [
                    { from: contextX, to: datum.x },
                    { from: contextWidth, to: datum.width },
                    { from: contextY, to: datum.y },
                    { from: contextHeight, to: datum.height },
                ];

                this.ctx.animationManager?.animateMany(`${this.id}_empty-update-ready_${rect.id}`, props, {
                    duration,
                    ease: easing.easeOut,
                    onUpdate([x, width, y, height]) {
                        rect.x = x;
                        rect.width = width;
                        rect.y = y;
                        rect.height = height;
                    },
                });
            });
        });

        labelSelections.forEach((labelSelection) => {
            labelSelection.each((label) => {
                this.ctx.animationManager?.animate(`${this.id}_empty-update-ready_${label.id}`, {
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

    animateReadyHighlight(highlightSelection: Selection<Rect, BarNodeDatum>) {
        this.resetSelectionRects(highlightSelection);
    }

    animateReadyResize({ datumSelections }: BarAnimationData) {
        this.ctx.animationManager?.reset();
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    animateWaitingUpdateReady({ datumSelections, labelSelections }: BarAnimationData) {
        const { processedData } = this;
        const diff = processedData?.reduced?.diff;

        if (!diff?.changed) {
            datumSelections.forEach((datumSelection) => {
                this.resetSelectionRects(datumSelection);
            });
            return;
        }

        const totalDuration = this.ctx.animationManager?.defaultOptions.duration ?? 1000;
        const labelDuration = 200;

        let sectionDuration = totalDuration;
        if (diff.added.length > 0 || diff.removed.length > 0) {
            sectionDuration = Math.floor(totalDuration / 2);
        }

        const { startingX, startingY } = this.getDirectionStartingValues(datumSelections);

        // Zip an array into an object of keys with a given value
        const zipObject = (props: Array<any>, value = true) => {
            const zipped: { [key: string]: boolean } = {};
            for (let i = 0; i < props.length; i++) {
                zipped[`${props[i]}`] = value;
            }
            return zipped;
        };

        const addedIds = zipObject(diff.added);
        const removedIds = zipObject(diff.removed);

        const rectThrottleGroup = `${this.id}_${Math.random()}`;
        const labelThrottleGroup = `${this.id}_${Math.random()}`;

        datumSelections.forEach((datumSelection) => {
            datumSelection.each((rect, datum) => {
                let props = [
                    { from: rect.x, to: datum.x },
                    { from: rect.width, to: datum.width },
                    { from: rect.y, to: datum.y },
                    { from: rect.height, to: datum.height },
                ];
                let delay = diff.removed.length > 0 ? sectionDuration : 0;
                const duration = sectionDuration;
                let cleanup = false;

                let contextX = startingX;
                let contextWidth = 0;
                let contextY = datum.y;
                let contextHeight = datum.height;

                if (this.getBarDirection() === ChartAxisDirection.Y) {
                    contextX = datum.x;
                    contextWidth = datum.width;
                    contextY = startingY;
                    contextHeight = 0;
                }

                const isAdded = datum.xValue !== undefined && addedIds[datum.xValue] !== undefined;
                const isRemoved = datum.xValue !== undefined && removedIds[datum.xValue] !== undefined;

                if (isAdded) {
                    props = [
                        { from: contextX, to: datum.x },
                        { from: contextWidth, to: datum.width },
                        { from: contextY, to: datum.y },
                        { from: contextHeight, to: datum.height },
                    ];
                } else if (isRemoved) {
                    props = [
                        { from: datum.x, to: contextX },
                        { from: datum.width, to: contextWidth },
                        { from: datum.y, to: contextY },
                        { from: datum.height, to: contextHeight },
                    ];
                    delay = 0;
                    cleanup = true;
                }

                this.ctx.animationManager?.animateManyWithThrottle(
                    `${this.id}_waiting-update-ready_${rect.id}`,
                    props,
                    {
                        delay,
                        duration,
                        ease: easing.easeOut,
                        throttleId: `${this.id}_rects`,
                        throttleGroup: rectThrottleGroup,
                        onUpdate([x, width, y, height]) {
                            rect.x = x;
                            rect.width = width;
                            rect.y = y;
                            rect.height = height;
                        },
                        onComplete() {
                            if (cleanup) datumSelection.cleanup();
                        },
                    }
                );
            });
        });

        labelSelections.forEach((labelSelection) => {
            labelSelection.each((label) => {
                label.opacity = 0;

                this.ctx.animationManager?.animateWithThrottle(`${this.id}_waiting-update-ready_${label.id}`, {
                    from: 0,
                    to: 1,
                    delay: totalDuration,
                    duration: labelDuration,
                    throttleId: `${this.id}_labels`,
                    throttleGroup: labelThrottleGroup,
                    onUpdate: (opacity) => {
                        label.opacity = opacity;
                    },
                });
            });
        });
    }

    resetSelectionRects(selection: Selection<Rect, BarNodeDatum>) {
        selection.each((rect, datum) => {
            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;
        });
        selection.cleanup();
    }

    protected getDirectionStartingValues(datumSelections: Array<Selection<Rect, BarNodeDatum>>) {
        const isColumnSeries = this.getBarDirection() === ChartAxisDirection.Y;

        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        const isContinuousX = xAxis?.scale instanceof ContinuousScale;
        const isContinuousY = yAxis?.scale instanceof ContinuousScale;

        let startingX = Infinity;
        let startingY = 0;

        if (yAxis && isColumnSeries) {
            if (isContinuousY) {
                startingY = yAxis.scale.convert(0);
            } else {
                datumSelections.forEach((datumSelection) =>
                    datumSelection.each((_, datum) => {
                        if (datum.yValue >= 0) {
                            startingY = Math.max(startingY, datum.height + datum.y);
                        }
                    })
                );
            }
        }

        if (xAxis && !isColumnSeries) {
            if (isContinuousX) {
                startingX = xAxis.scale.convert(0);
            } else {
                datumSelections.forEach((datumSelection) =>
                    datumSelection.each((_, datum) => {
                        if (datum.yValue >= 0) {
                            startingX = Math.min(startingX, datum.x);
                        }
                    })
                );
            }
        }

        return { startingX, startingY };
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.3 };
    }

    protected getBarDirection() {
        return ChartAxisDirection.X;
    }

    protected getCategoryDirection() {
        return ChartAxisDirection.Y;
    }
}

export class ColumnSeries extends BarSeries {
    static type = 'column' as const;
    static className = 'ColumnSeries';

    protected getBarDirection() {
        return ChartAxisDirection.Y;
    }

    protected getCategoryDirection() {
        return ChartAxisDirection.X;
    }
}
