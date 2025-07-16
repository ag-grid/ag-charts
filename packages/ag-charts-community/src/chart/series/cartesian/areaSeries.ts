import type { RequireOptional } from 'ag-charts-core';
import { isDefined } from 'ag-charts-core';
import {
    type AgAreaSeriesLabelFormatterParams,
    type AgAreaSeriesOptions,
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgSeriesMarkerStyle,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/extent';
import { mergeDefaults } from '../../../util/object';
import { isContinuous } from '../../../util/value';
import { LogAxis } from '../../axis/logAxis';
import { TimeAxis } from '../../axis/timeAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModel, DatumPropertyDefinition, ProcessedData, PropertyDefinition } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import {
    animationValidation,
    groupAccumulativeValueProperty,
    groupStackValueProperty,
    keyProperty,
    normaliseGroupTo,
    processedDataIsAnimatable,
    valueProperty,
} from '../../data/processors';
import { getLabelStyles } from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import type { Marker } from '../../marker/marker';
import { type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesContentZIndexMap, SeriesZIndexMap } from '../seriesZIndexMap';
import { applyShapeStyle, getShapeFill } from '../shapeUtil';
import { datumStylerProperties } from '../util';
import { AreaSeriesProperties } from './areaSeriesProperties';
import {
    type AreaSeriesNodeDataContext,
    type LabelSelectionDatum,
    type MarkerSelectionDatum,
    plotAreaPathFill,
    prepareAreaPathAnimation,
} from './areaUtil';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
    RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD,
} from './cartesianSeries';
import { type LineSeriesDataAggregationFilter, aggregateLineData } from './lineAggregation';
import { type LinePathSpan, type LineSpanPointDatum, interpolatePoints, plotLinePathStroke } from './lineUtil';
import {
    computeMarkerFocusBounds,
    markerFadeInAnimation,
    markerSwipeScaleInAnimation,
    resetMarkerFn,
    resetMarkerPositionFn,
} from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, updateClipPath } from './pathUtil';

const CROSS_FILTER_AREA_FILL_OPACITY_FACTOR = 0.125;
const CROSS_FILTER_AREA_STROKE_OPACITY_FACTOR = 0.25;

type AreaAnimationData = CartesianAnimationData<
    Group,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext
>;

export class AreaSeries extends CartesianSeries<
    Group,
    AgAreaSeriesOptions,
    AreaSeriesProperties,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext
> {
    static readonly className = 'AreaSeries';
    static readonly type = 'area' as const;

    override properties = new AreaSeriesProperties();

    override connectsToYAxis = true;

    private dataAggregationFilters: LineSeriesDataAggregationFilter[] | undefined = undefined;

    readonly backgroundGroup = new Group({
        name: `${this.id}-background`,
        zIndex: SeriesZIndexMap.BACKGROUND,
    });

    override get pickModeAxis() {
        return 'main' as const;
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: 'xValue',
            pathsPerSeries: ['fill', 'stroke'],
            pathsZIndexSubOrderOffset: [0, 1000],
            hasMarkers: true,
            markerSelectionGarbageCollection: false,
            pickModes: [SeriesNodePickMode.AXIS_ALIGNED, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            animationResetFns: {
                path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
            clipFocusBox: false,
        });
    }

    override renderToOffscreenCanvas(): boolean {
        return (
            super.renderToOffscreenCanvas() ||
            (this.contextNodeData != null &&
                (this.contextNodeData.fillData.spans.length > RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD ||
                    this.contextNodeData.strokeData.spans.length > RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD))
        );
    }

    override attachSeries(seriesContentNode: Group, seriesNode: Group, annotationNode: Group | undefined): void {
        super.attachSeries(seriesContentNode, seriesNode, annotationNode);

        seriesContentNode.appendChild(this.backgroundGroup);
    }

    override detachSeries(
        seriesContentNode: Group | undefined,
        seriesNode: Group,
        annotationNode: Group | undefined
    ): void {
        super.detachSeries(seriesContentNode, seriesNode, annotationNode);

        seriesContentNode?.removeChild(this.backgroundGroup);
    }

    protected override attachPaths([fill, stroke]: Path[]) {
        this.backgroundGroup.appendChild(fill);

        this.contentGroup.appendChild(stroke);
        stroke.zIndex = -1;
    }

    protected override detachPaths([fill, stroke]: Path[]) {
        this.backgroundGroup.removeChild(fill);

        this.contentGroup.removeChild(stroke);
    }

    private isStacked() {
        const stackCount = this.seriesGrouping?.stackCount ?? 1;
        return stackCount > 1;
    }

    private _isStacked: boolean | undefined = undefined;
    override setSeriesIndex(index: number) {
        const isStacked = this.isStacked();
        const isStackedChanged = isStacked === this._isStacked;
        this._isStacked = isStackedChanged;

        return super.setSeriesIndex(index, isStackedChanged);
    }

    override setZIndex(zIndex: number) {
        super.setZIndex(zIndex);

        if (this.isStacked()) {
            this.backgroundGroup.zIndex = [SeriesZIndexMap.BACKGROUND, zIndex];
            this.contentGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.FOREGROUND];
        } else {
            this.backgroundGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.FOREGROUND, 0];
            this.contentGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.FOREGROUND, 1];
        }
    }

    override async processData(dataController: DataController) {
        if (this.data == null) return;

        const { data, visible, seriesGrouping: { groupIndex = this.id, stackCount = 1 } = {} } = this;
        const { xKey, yKey, yFilterKey, connectMissingData, normalizedTo } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const stacked = stackCount > 1 || normalizedTo != null;

        const idMap = {
            value: `area-stack-${groupIndex}-yValue`,
            values: `area-stack-${groupIndex}-yValues`,
            stack: `area-stack-${groupIndex}-yValue-stack`,
            marker: `area-stack-${groupIndex}-yValues-marker`,
        };

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if ((isDefined(normalizedTo) || connectMissingData) && stackCount > 1) {
            common.invalidValue = 0;
        }
        if (!visible) {
            common.forceValue = 0;
        }

        const props: PropertyDefinition<any, any>[] = [
            keyProperty(xKey, xScaleType, { id: 'xValue' }),
            valueProperty(yKey, yScaleType, { id: `yValueRaw`, ...common }),
            ...(yFilterKey != null ? [valueProperty(yFilterKey, yScaleType, { id: 'yFilterRaw' })] : []),
            ...groupStackValueProperty(yKey, yScaleType, { id: `yValueStack`, ...common, groupId: idMap.stack }),
            valueProperty(yKey, yScaleType, { id: `yValue`, ...common, groupId: idMap.value }),
        ];

        if (stacked) {
            props.push(
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window',
                    'current',
                    { id: `yValueEnd`, ...common, groupId: idMap.values },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    'current',
                    { id: `yValueCumulative`, ...common, groupId: idMap.marker },
                    yScaleType
                )
            );
        }

        if (isDefined(normalizedTo)) {
            props.push(normaliseGroupTo(Object.values(idMap), normalizedTo));
        }
        if (animationEnabled) {
            props.push(animationValidation());
        }

        const { dataModel, processedData } = await this.requestDataModel<any, any>(dataController, data, {
            props: props,
            groupByKeys: stacked,
            groupByData: !stacked,
        });

        this.dataAggregationFilters = this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(xValue: any, pixelSize: number): [number, number] {
        const { marker } = this.properties;
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const r = marker.enabled ? 0.5 * marker.size * pixelSize : 0;
        return [x - r, x + r];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number): [number, number] {
        const { marker } = this.properties;
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        const r = marker.enabled ? 0.5 * marker.size * pixelSize : 0;
        return [y - r, y + r];
    }

    private yCumulativeKey(processData: ProcessedData<any>) {
        return processData.type === 'grouped' ? 'yValueCumulative' : 'yValue';
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel, axes } = this;
        if (!processedData || !dataModel) return [];

        const yAxis = axes[ChartAxisDirection.Y];

        if (direction === ChartAxisDirection.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            return fixNumericExtent(extent(keys));
        }

        const yExtent = this.domainForClippedRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(processedData)],
            'xValue'
        );

        if (yAxis instanceof LogAxis || yAxis instanceof TimeAxis) {
            return fixNumericExtent(yExtent);
        } else {
            const fixedYExtent = Number.isFinite(yExtent[1] - yExtent[0])
                ? [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]]
                : [];
            return fixNumericExtent(fixedYExtent);
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): [number, number] {
        const [y0, y1] = this.domainForVisibleRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(this.processedData!)],
            'xValue',
            visibleRange
        );
        return [Math.min(y0, 0), Math.max(y1, 0)];
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        return this.countVisibleItems(
            'xValue',
            [this.yCumulativeKey(this.processedData!)],
            xVisibleRange,
            yVisibleRange,
            minVisibleItems
        );
    }

    private aggregateData(dataModel: DataModel<any, any>, processedData: ProcessedData<any>) {
        if (processedData.type === 'grouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const { scale } = xAxis;
        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValueRaw`, processedData);
        const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);

        return aggregateLineData(scale, xValues, yValues, domain);
    }

    override createNodeData() {
        const { axes, data, processedData, dataModel, dataAggregationFilters } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !data || !dataModel || !processedData) return;

        const {
            yKey,
            xKey,
            xName,
            yName,
            yFilterKey,
            marker,
            label,
            fill: seriesFill,
            stroke: seriesStroke,
            connectMissingData,
            interpolation,
        } = this.properties;
        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);
        const { isContinuousY } = this.getScaleInformation({ xScale, yScale });

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const stacked = processedData.type === 'grouped';

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const yRawValues = dataModel.resolveColumnById(this, `yValueRaw`, processedData);
        const yEndValues = stacked ? dataModel.resolveColumnById(this, `yValueEnd`, processedData) : yRawValues;
        const yCumulativeValues = stacked
            ? dataModel.resolveColumnById(this, `yValueCumulative`, processedData)
            : yRawValues;
        const yFilterValues =
            yFilterKey != null ? dataModel.resolveColumnById(this, 'yFilterRaw', processedData) : undefined;
        const yStackValues =
            processedData.type === 'grouped'
                ? dataModel.resolveColumnById<number[]>(this, 'yValueStack', processedData)
                : undefined;

        const labelData: LabelSelectionDatum[] = [];
        const markerData: MarkerSelectionDatum[] = [];
        const { visibleSameStackCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);

        let crossFiltering = false;
        const { dataSources } = processedData;
        const rawData = dataSources.get(this.id) ?? [];

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);
        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        let startIndex = 0;
        let endIndex = 0;
        const indices = dataAggregationFilter?.indices;
        [startIndex, endIndex] = this.visibleRangeIndices('xValue', xAxis.range, indices);
        startIndex = Math.max(startIndex - 1, 0);
        endIndex = Math.min(endIndex + 1, indices?.length ?? xValues.length);
        // @todo(AG-13575) Remove this if block
        if (processedData.input.count < 1e3) {
            startIndex = 0;
            endIndex = processedData.input.count;
        }

        const createMarkerCoordinate = (xDatum: any, yEnd: number, rawYDatum: any): SizedPoint => {
            let currY;

            // if not normalized, the invalid data points will be processed as `undefined` in processData()
            // if normalized, the invalid data points will be processed as 0 rather than `undefined`
            // check if unprocessed datum is valid as we only want to show markers for valid points
            if (
                isDefined(this.properties.normalizedTo) ? isContinuousY && isContinuous(rawYDatum) : !isNaN(rawYDatum)
            ) {
                currY = yEnd;
            }

            return {
                x: xScale.convert(xDatum) + xOffset,
                y: yScale.convert(currY),
                size: marker.size,
            };
        };

        const handleDatum = (datumIndex: number) => {
            const xDatum = xValues[datumIndex];
            if (xDatum == null) return;

            const seriesDatum = rawData[datumIndex];
            const yDatum = yRawValues[datumIndex];
            const yValueCumulative = yCumulativeValues[datumIndex];
            const yValueEnd = yEndValues[datumIndex];

            const validPoint = Number.isFinite(yDatum);

            // marker data
            const point = createMarkerCoordinate(xDatum, +yValueCumulative, yDatum);

            const selected = yFilterValues != null ? yFilterValues[datumIndex] === yDatum : undefined;
            if (selected === false) {
                crossFiltering = true;
            }

            if (validPoint && marker) {
                markerData.push({
                    series: this,
                    itemId: yKey,
                    datum: seriesDatum,
                    datumIndex,
                    midPoint: { x: point.x, y: point.y },
                    cumulativeValue: yValueEnd,
                    yValue: yDatum,
                    xValue: xDatum,
                    yKey,
                    xKey,
                    point,
                    fill: marker.fill ?? seriesFill,
                    stroke: marker.stroke ?? seriesStroke,
                    strokeWidth: marker.strokeWidth ?? this.getStrokeWidth(this.properties.strokeWidth),
                    selected,
                });
            }

            // label data
            if (label.enabled && validPoint) {
                const labelText = this.getLabelText<AgAreaSeriesLabelFormatterParams>(
                    yDatum,
                    seriesDatum,
                    yKey,
                    'y',
                    yDomain,
                    label,
                    { value: yDatum, datum: seriesDatum, xKey, yKey, xName, yName }
                );

                labelData.push({
                    series: this,
                    itemId: yKey,
                    datum: seriesDatum,
                    datumIndex,
                    x: point.x,
                    y: point.y,
                    labelText,
                });
            }
        };

        if (processedData.type === 'grouped') {
            for (const { datumIndex } of dataModel.forEachGroupDatum(this, processedData)) {
                handleDatum(datumIndex);
            }
        } else {
            for (let i = startIndex; i < endIndex; i += 1) {
                const datumIndex = indices?.[i] ?? i;
                if (xValues[datumIndex] == null) continue;
                handleDatum(datumIndex);
            }
        }

        const spansForPoints = (points: Array<LineSpanPointDatum[] | { skip: number }>): Array<LinePathSpan | null> => {
            return points.flatMap((p): Array<LinePathSpan | null> => {
                return Array.isArray(p) ? interpolatePoints(p, interpolation) : new Array(p.skip).fill(null);
            });
        };

        const createPoint = (xDatum: any, yDatum: any): LineSpanPointDatum => ({
            point: {
                x: xScale.convert(xDatum) + xOffset,
                y: yScale.convert(yDatum),
            },
            xDatum,
            yDatum,
        });

        const getSeriesSpans = (index: number) => {
            const points: Array<LineSpanPointDatum[] | { skip: number }> = [];

            const handleSeriesPoint = (pIdx: number | undefined, datumIndex: number, nIdx: number | undefined) => {
                const xDatum = xValues[datumIndex];
                const yDatum = yStackValues != null ? yStackValues?.[datumIndex][index] : yRawValues[datumIndex];

                if (connectMissingData && !Number.isFinite(yRawValues[datumIndex])) return;

                const yDatumIsFinite = Number.isFinite(yDatum);

                let yValueEndBackwards = 0;
                let yBackwardsFinite = true;
                let yValueEndForwards = 0;
                let yForwardsFinite = true;
                if (yStackValues == null) {
                    yBackwardsFinite = pIdx == null || Number.isFinite(yRawValues[pIdx]);
                    yForwardsFinite = nIdx == null || Number.isFinite(yRawValues[nIdx]);

                    yValueEndBackwards = pIdx != null && Number.isFinite(yRawValues[pIdx]) ? yDatum : 0;
                    yValueEndForwards = nIdx != null && Number.isFinite(yRawValues[nIdx]) ? yDatum : 0;
                } else {
                    const yValueStack = yStackValues[datumIndex];
                    const lastYValueStack = pIdx != null ? yStackValues[pIdx] : undefined;
                    const nextYValueStack = nIdx != null ? yStackValues[nIdx] : undefined;

                    for (let j = 0; j <= index; j += 1) {
                        const value = yValueStack[j];

                        if (Number.isFinite(value)) {
                            const lastWasFinite = lastYValueStack == null || Number.isFinite(lastYValueStack[j]);
                            const nextWasFinite = nextYValueStack == null || Number.isFinite(nextYValueStack[j]);

                            if (lastWasFinite) {
                                yValueEndBackwards += value;
                            } else {
                                yBackwardsFinite = false;
                            }
                            if (nextWasFinite) {
                                yValueEndForwards += value;
                            } else {
                                yForwardsFinite = false;
                            }
                        }
                    }
                }

                const currentPoints: LineSpanPointDatum[] | { skip: number } | undefined = points[points.length - 1];
                if (
                    !connectMissingData &&
                    (!yBackwardsFinite ||
                        !yForwardsFinite ||
                        !yDatumIsFinite ||
                        yValueEndBackwards !== yValueEndForwards)
                ) {
                    if (!yDatumIsFinite && Array.isArray(currentPoints) && currentPoints.length === 1) {
                        points[points.length - 1] = { skip: 1 };
                    } else {
                        const pointBackwards = createPoint(xDatum, yValueEndBackwards);
                        const pointForwards = createPoint(xDatum, yValueEndForwards);

                        if (Array.isArray(currentPoints)) {
                            currentPoints.push(pointBackwards);
                        } else if (currentPoints != null) {
                            currentPoints.skip += 1;
                        }
                        points.push(yDatumIsFinite ? [pointForwards] : { skip: 0 });
                    }
                } else {
                    const yValue = connectMissingData ? yDatum : Math.max(yValueEndBackwards, yValueEndForwards);
                    const point = createPoint(xDatum, yValue);

                    if (Array.isArray(currentPoints)) {
                        currentPoints.push(point);
                    } else if (currentPoints != null) {
                        currentPoints.skip += 1;
                        points.push([point]);
                    } else {
                        points.push([point]);
                    }
                }
            };

            if (processedData.type === 'grouped') {
                for (const {
                    datumIndexes: [pIdx, datumIndex, nIdx],
                } of dataModel.forEachGroupDatumTuple(this, processedData)) {
                    handleSeriesPoint(pIdx, datumIndex, nIdx);
                }
            } else {
                // Track the previous, current, and next datum indices
                // Excluding all datum indices where the xValue is nil
                let pIdx: number | undefined;
                let datumIndex: number | undefined;
                for (let i = startIndex; i < endIndex; i += 1) {
                    const nIdx = indices?.[i] ?? i;
                    if (xValues[nIdx] == null) continue;

                    if (datumIndex != null) {
                        handleSeriesPoint(pIdx, datumIndex, nIdx);
                    }

                    pIdx = datumIndex;
                    datumIndex = nIdx;
                }

                if (datumIndex != null) {
                    handleSeriesPoint(pIdx, datumIndex, undefined);
                }
            }

            return spansForPoints(points);
        };

        const stackIndex = this.seriesGrouping?.stackIndex ?? 0;

        const getAxisSpans = () => {
            const getPoint = (datumIndex: number) => {
                const xDatum = xValues[datumIndex];
                const yDatum = yStackValues?.[datumIndex][stackIndex] ?? yRawValues[datumIndex];

                if (connectMissingData && !Number.isFinite(yDatum)) return;
                return createPoint(xDatum, 0);
            };

            let yValueZeroPoints: Array<LineSpanPointDatum | undefined>;
            if (processedData.type === 'grouped') {
                yValueZeroPoints = Array.from(dataModel.forEachGroupDatum(this, processedData), ({ datumIndex }) => {
                    return getPoint(datumIndex);
                });
            } else {
                yValueZeroPoints = [];
                for (let i = startIndex; i < endIndex; i += 1) {
                    const datumIndex = indices?.[i] ?? i;
                    if (xValues[datumIndex] == null) continue;
                    yValueZeroPoints.push(getPoint(datumIndex));
                }
            }

            yValueZeroPoints = yValueZeroPoints.filter((x): x is LineSpanPointDatum => x != null);

            return interpolatePoints(yValueZeroPoints as LineSpanPointDatum[], interpolation);
        };

        const currentSeriesSpans = getSeriesSpans(stackIndex);

        const phantomSpans = currentSeriesSpans.map((): LinePathSpan => null!);
        for (let j = stackIndex - 1; j >= -1; j -= 1) {
            let spans: Array<LinePathSpan | null> | undefined; // lazily init
            for (let i = 0; i < phantomSpans.length; i += 1) {
                if (phantomSpans[i] != null) continue;
                spans ??= j !== -1 ? getSeriesSpans(j) : getAxisSpans();
                phantomSpans[i] = spans[i]!;
            }
        }

        const fillSpans = currentSeriesSpans.map((span, index) => span ?? phantomSpans[index]);
        const strokeSpans = currentSeriesSpans.filter((span): span is LinePathSpan => span != null);

        const context: AreaSeriesNodeDataContext = {
            itemId: yKey,
            fillData: { itemId: yKey, spans: fillSpans, phantomSpans },
            strokeData: { itemId: yKey, spans: strokeSpans },
            labelData,
            nodeData: markerData,
            scales: this.calculateScaling(),
            visible: this.visible,
            stackVisible: visibleSameStackCount > 0,
            crossFiltering,
        };

        return context;
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    protected override updatePathNodes(opts: { paths: Path[]; visible: boolean; animationEnabled: boolean }) {
        const { visible, animationEnabled } = opts;
        const [fill, stroke] = opts.paths;
        const crossFiltering = this.contextNodeData?.crossFiltering === true;

        const {
            strokeWidth,
            stroke: strokeColor,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            fill: fillColor,
            fillOpacity,
            opacity,
        } = mergeDefaults(this.getHighlightStyle(), this.properties);

        stroke.setProperties({
            fill: undefined,
            lineCap: 'round',
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            stroke: strokeColor,
            strokeWidth,
            strokeOpacity: strokeOpacity * (crossFiltering ? CROSS_FILTER_AREA_STROKE_OPACITY_FACTOR : 1),
            lineDash,
            lineDashOffset,
            opacity,
            visible: visible || animationEnabled,
        });

        const seriesFill = getShapeFill(
            fillColor,
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );

        applyShapeStyle(
            fill,
            {
                fill: seriesFill,
                stroke: undefined,
                fillOpacity: fillOpacity * (crossFiltering ? CROSS_FILTER_AREA_FILL_OPACITY_FACTOR : 1),
            },
            undefined,
            this.getShapeFillBBox()
        );

        fill.setProperties({
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            fillShadow: this.properties.shadow,
            opacity,
            visible: visible || animationEnabled,
        });

        updateClipPath(this, stroke);
        updateClipPath(this, fill);
    }

    protected override updatePaths(opts: { contextData: AreaSeriesNodeDataContext; paths: Path[] }) {
        this.updateAreaPaths(opts.paths, opts.contextData);
    }

    private updateAreaPaths(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        for (const path of paths) {
            path.visible = contextData.visible;
        }

        if (contextData.visible) {
            this.updateFillPath(paths, contextData);
            this.updateStrokePath(paths, contextData);
        } else {
            for (const path of paths) {
                path.path.clear();
                path.markDirty('AreaSeries');
            }
        }
    }

    private updateFillPath(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        const [fill] = paths;

        fill.path.clear();
        plotAreaPathFill(fill, contextData.fillData);
        fill.markDirty('AreaSeries');
    }

    private updateStrokePath(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        const { spans } = contextData.strokeData;
        const [, stroke] = paths;

        stroke.path.clear();
        plotLinePathStroke(stroke, spans);
        stroke.markDirty('AreaSeries');
    }

    protected override updateMarkerSelection(opts: {
        nodeData: MarkerSelectionDatum[];
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
    }) {
        const { nodeData, markerSelection } = opts;
        const markersEnabled = this.properties.marker.enabled || this.contextNodeData?.crossFiltering === true;

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        return markerSelection.update(markersEnabled ? nodeData : []);
    }

    protected override updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight } = opts;
        const { xKey, yKey, marker, stroke, strokeWidth, strokeOpacity } = this.properties;
        const xDomain = this.getSeriesDomain(ChartAxisDirection.X);
        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);

        const fillBBox = this.getShapeFillBBox();
        const markerStyle = marker.getStyle();

        markerSelection.each((node, datum) => {
            const { xValue, yValue } = datum;
            const highlightStyle = this.getHighlightStyle(isHighlight, datum.datumIndex);
            const baseStyle = mergeDefaults(highlightStyle, markerStyle, {
                stroke,
                strokeWidth,
                strokeOpacity,
            });
            this.updateMarkerStyle(
                marker,
                node,
                datum.datum,
                datum.point,
                datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
                isHighlight,
                baseStyle,
                fillBBox,
                { selected: datum.selected }
            );
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    protected override updateLabelSelection(opts: {
        labelData: LabelSelectionDatum[];
        labelSelection: Selection<Text, LabelSelectionDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData);
    }

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, LabelSelectionDatum> }) {
        opts.labelSelection.each((text, datum) => {
            const { x, y, labelText } = datum;

            const style = getLabelStyles(this, datum, this.properties, this.properties.label);
            const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = style;
            if (labelText && labelEnabled && this.visible) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = 'center';
                text.textBaseline = 'bottom';
                text.text = labelText;
                text.x = x;
                text.y = y - 10;
                text.fill = color;
                text.fillOpacity = this.getHighlightStyle(false, datum.datumIndex).opacity ?? 1;
                text.visible = true;
                text.setBoxing(style);
            } else {
                text.visible = false;
            }
        });
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xKey, xName, yKey, yName, tooltip, marker, legendItemName } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData)[datumIndex];

        const { xDomain, yDomain } = this.cachedDatumCallback('domain', () => ({
            xDomain: this.getSeriesDomain(ChartAxisDirection.X),
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y),
        }))!;

        if (xValue == null) return;

        const style = marker.getStyle();

        const activeStyle = this.getMarkerStyle(
            marker,
            datum,
            datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
            false,
            undefined,
            style
        );

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                symbol: this.legendItemSymbol(),
                data: [
                    {
                        label: yName,
                        fallbackLabel: yKey,
                        value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, yKey, legendItemName),
                    },
                ],
            },
            {
                seriesId,
                datum,
                title: yName,
                xKey,
                xName,
                yKey,
                yName,
                ...(activeStyle as RequireOptional<AgSeriesMarkerStyle>),
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    legendItemSymbol(): LegendSymbolOptions {
        const {
            fill,
            stroke,
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            marker,
            fillGradientDefaults,
            fillPatternDefaults,
            fillImageDefaults,
        } = this.properties;
        const useAreaFill = !marker.enabled || marker.fill === undefined;

        const legendMarkerFill = useAreaFill
            ? getShapeFill(fill, fillGradientDefaults, fillPatternDefaults, fillImageDefaults)
            : getShapeFill(
                  marker.fill,
                  marker.fillGradientDefaults,
                  marker.fillPatternDefaults,
                  marker.fillImageDefaults
              );

        const markerStyle = this.getMarkerStyle(marker, undefined, undefined, false, undefined, {
            fill: legendMarkerFill,
            fillOpacity: useAreaFill ? fillOpacity : marker.fillOpacity,
        });

        return {
            marker: {
                ...markerStyle,
                enabled: marker.enabled || strokeWidth <= 0,
            },
            line: {
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
            },
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

        const { yKey: itemId, yName, legendItemName, showInLegend } = this.properties;

        return [
            {
                legendType,
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: {
                    text: legendItemName ?? yName ?? itemId,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady(animationData: AreaAnimationData) {
        const { markerSelection, labelSelection, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([markerSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelection);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
    }

    protected override animateReadyResize(animationData: AreaAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateAreaPaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    override animateWaitingUpdateReady(animationData: AreaAnimationData) {
        const { animationManager } = this.ctx;
        const { markerSelection, labelSelection, contextData, paths, previousContextData } = animationData;
        const [fill, stroke] = paths;

        if (contextData.visible === false && previousContextData?.visible === false) return;

        // Handling initially hidden series case gracefully.
        if (fill == null && stroke == null) return;

        this.resetMarkerAnimation(animationData);
        this.resetLabelAnimation(animationData);

        const update = () => {
            this.resetPathAnimation(animationData);
            this.updateAreaPaths(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, 'added', markerSelection);
            pathFadeInAnimation(this, 'fill_path_properties', animationManager, 'add', fill);
            pathFadeInAnimation(this, 'stroke_path_properties', animationManager, 'add', stroke);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
            return;
        }

        if (contextData.crossFiltering !== previousContextData.crossFiltering) {
            skip();
            return;
        }

        const fns = prepareAreaPathAnimation(contextData, previousContextData);
        if (fns === undefined) {
            // Un-animatable - skip all animations.
            skip();
            return;
        } else if (fns.status === 'no-op') {
            return;
        }

        markerFadeInAnimation(this, animationManager, undefined, markerSelection);

        fromToMotion(this.id, 'fill_path_properties', animationManager, [fill], fns.fill.pathProperties);
        pathMotion(this.id, 'fill_path_update', animationManager, [fill], fns.fill.path);

        fromToMotion(this.id, 'stroke_path_properties', animationManager, [stroke], fns.stroke.pathProperties);
        pathMotion(this.id, 'stroke_path_update', animationManager, [stroke], fns.stroke.path);

        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);

        // The animation may clip spans
        // When using smooth interpolation, the bezier spans are clipped using an approximation
        // This can result in artefacting, which may be present on the final frame
        // To remove this on the final frame, re-draw the series without animations
        this.ctx.animationManager.animate({
            id: this.id,
            groupId: 'reset_after_animation',
            phase: 'trailing',
            from: {},
            to: {},
            onComplete: () => this.updateAreaPaths(paths, contextData),
        });
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }

    public getFormattedMarkerStyle(datum: MarkerSelectionDatum): AgSeriesMarkerStyle & { size: number } {
        const { xValue, yValue, xKey, yKey } = datum;
        const xDomain = this.getSeriesDomain(ChartAxisDirection.X);
        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);
        return this.getMarkerStyle(
            this.properties.marker,
            datum.datum,
            datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
            true
        );
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
