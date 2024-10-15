import type { AgSeriesMarkerStyle } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { Node } from '../../../scene/node';
import { PointerEvents } from '../../../scene/node';
import type { Point, SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { formatValue } from '../../../util/format.util';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { isDefined, isFiniteNumber } from '../../../util/type-guards';
import { isContinuous } from '../../../util/value';
import { LogAxis } from '../../axis/logAxis';
import { TimeAxis } from '../../axis/timeAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DatumPropertyDefinition } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import {
    animationValidation,
    groupAccumulativeValueProperty,
    groupStackValueProperty,
    keyProperty,
    normaliseGroupTo,
    valueProperty,
} from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { EMPTY_TOOLTIP_CONTENT, type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesZIndexMap } from '../seriesZIndexMap';
import { AreaSeriesProperties } from './areaSeriesProperties';
import {
    type AreaPathSpan,
    type AreaSeriesNodeDataContext,
    type LabelSelectionDatum,
    type MarkerSelectionDatum,
    prepareAreaPathAnimation,
} from './areaUtil';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { type Span, SpanJoin, linearPoints, smoothPoints, stepPoints } from './lineInterpolation';
import { plotSpan } from './lineInterpolationPlotting';
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
    AreaSeriesProperties,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext
> {
    static readonly className = 'AreaSeries';
    static readonly type = 'area' as const;

    override properties = new AreaSeriesProperties();

    readonly backgroundGroup = new Group({
        name: `${this.id}-background`,
        zIndex: SeriesZIndexMap.BACKGROUND,
    });

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
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
        });
    }

    override attachSeries(seriesNode: Node, annotationNode: Node | undefined, labelNode: Node | undefined): void {
        super.attachSeries(seriesNode, annotationNode, labelNode);

        seriesNode.appendChild(this.backgroundGroup);
    }

    override detachSeries(seriesNode: Node, annotationNode: Node | undefined, labelNode: Node | undefined): void {
        super.detachSeries(seriesNode, annotationNode, labelNode);

        seriesNode.removeChild(this.backgroundGroup);
    }

    override setSeriesIndex(index: number) {
        if (!super.setSeriesIndex(index)) return false;

        this.backgroundGroup.zIndex = [index, SeriesZIndexMap.BACKGROUND];

        return true;
    }

    protected override attachPaths([fill, stroke]: Path[]) {
        this.backgroundGroup.append(fill);
        this.contentGroup.append(stroke);
    }

    override async processData(dataController: DataController) {
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        const { data, visible, seriesGrouping: { groupIndex = this.id, stackCount = 1 } = {} } = this;
        const { xKey, yKey, yFilterKey, connectMissingData, normalizedTo } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const idMap = {
            value: `area-stack-${groupIndex}-yValue`,
            values: `area-stack-${groupIndex}-yValues`,
            stack: `area-stack-${groupIndex}-yValue-stack`,
            marker: `area-stack-${groupIndex}-yValues-marker`,
        };

        const extraProps = [];
        if (isDefined(normalizedTo)) {
            extraProps.push(normaliseGroupTo(Object.values(idMap), normalizedTo, 'range'));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if (connectMissingData && stackCount > 1) {
            common.invalidValue = 0;
        }
        if (!visible) {
            common.forceValue = 0;
        }
        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(xKey, xScaleType, { id: 'xValue' }),
                valueProperty(yKey, yScaleType, { id: `yValueRaw`, ...common }),
                ...(yFilterKey != null ? [valueProperty(yFilterKey, yScaleType, { id: 'yFilterRaw' })] : []),
                ...groupStackValueProperty(yKey, yScaleType, { id: `yValueStack`, ...common, groupId: idMap.stack }),
                valueProperty(yKey, yScaleType, { id: `yValue`, ...common, groupId: idMap.value }),
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
                ),
                ...extraProps,
            ],
            groupByKeys: true,
            groupByData: false,
        });

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel, axes } = this;
        if (!processedData || !dataModel || processedData.data.length === 0) return [];

        const yAxis = axes[ChartAxisDirection.Y];
        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yExtent = dataModel.getDomain(this, `yValueEnd`, 'value', processedData);

        if (direction === ChartAxisDirection.X) {
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            return fixNumericExtent(extent(keys));
        } else if (yAxis instanceof LogAxis || yAxis instanceof TimeAxis) {
            return fixNumericExtent(yExtent);
        } else {
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent);
        }
    }

    async createNodeData() {
        const { axes, data, processedData: { data: groupedData } = {}, dataModel } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !data || !dataModel || !this.properties.isValid()) {
            return;
        }

        const {
            yKey,
            xKey,
            yFilterKey,
            marker,
            label,
            fill: seriesFill,
            stroke: seriesStroke,
            connectMissingData,
        } = this.properties;
        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;

        const { isContinuousY } = this.getScaleInformation({ xScale, yScale });

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [`yValueEnd`, `yValueRaw`, `yValueCumulative`]);
        const yFilterIndex =
            yFilterKey != null ? dataModel.resolveProcessedDataIndexById(this, 'yFilterRaw') : undefined;
        const yValueStackIndex = dataModel.resolveProcessedDataIndexById(this, 'yValueStack');

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

        const itemId = yKey;
        const labelData: LabelSelectionDatum[] = [];
        const markerData: MarkerSelectionDatum[] = [];
        const { visibleSameStackCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);

        let datumIdx = -1;
        let crossFiltering = false;
        groupedData?.forEach((datumGroup) => {
            const {
                keys,
                keys: [xDatum],
                datum: datumArray,
                values: valuesArray,
            } = datumGroup;

            valuesArray.forEach((values, valueIdx) => {
                datumIdx++;

                const seriesDatum = datumArray[valueIdx];
                const dataValues = dataModel.resolveProcessedDataDefsValues(defs, { keys, values });
                const { yValueRaw: yDatum, yValueCumulative, yValueEnd } = dataValues;

                const validPoint = Number.isFinite(yDatum);

                // marker data
                const point = createMarkerCoordinate(xDatum, +yValueCumulative, yDatum);

                const selected = yFilterIndex != null ? values[yFilterIndex] === yDatum : undefined;
                if (selected === false) {
                    crossFiltering = true;
                }

                if (validPoint && marker) {
                    markerData.push({
                        index: datumIdx,
                        series: this,
                        itemId,
                        datum: seriesDatum,
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
                if (validPoint && label) {
                    const labelText = this.getLabelText(
                        label,
                        {
                            value: yDatum,
                            datum: seriesDatum,
                            xKey,
                            yKey,
                            xName: this.properties.xName,
                            yName: this.properties.yName,
                        },
                        formatValue
                    );

                    labelData.push({
                        index: datumIdx,
                        series: this,
                        itemId: yKey,
                        datum: seriesDatum,
                        x: point.x,
                        y: point.y,
                        labelText,
                    });
                }
            });
        });

        type AreaSpanPointDatum = {
            point: Point;
            xDatum: any;
            yDatum: any;
        };
        const { interpolation } = this.properties;
        const interpolatePoints = (points: AreaSpanPointDatum[]): Array<AreaPathSpan> => {
            let spans: Span[];
            const pointsIter = points.map((point) => point.point);
            switch (interpolation.type) {
                case 'linear':
                    spans = linearPoints(pointsIter);
                    break;
                case 'smooth':
                    spans = smoothPoints(pointsIter, interpolation.tension);
                    break;
                case 'step':
                    spans = stepPoints(pointsIter, interpolation.position);
                    break;
            }
            return spans.map((span, i) => ({
                span,
                xValue0: points[i].xDatum,
                yValue0: points[i].yDatum,
                xValue1: points[i + 1].xDatum,
                yValue1: points[i + 1].yDatum,
            }));
        };

        const spansForPoints = (points: Array<AreaSpanPointDatum[] | { skip: number }>): Array<AreaPathSpan | null> => {
            return points.flatMap((p): Array<AreaPathSpan | null> => {
                return Array.isArray(p) ? interpolatePoints(p) : new Array(p.skip).fill(null);
            });
        };

        const dataValues = groupedData?.flatMap((datumGroup) => {
            const {
                keys: [xDatum],
                values: valuesArray,
            } = datumGroup;
            return valuesArray.map((values) => ({ xDatum, values }));
        });

        const createPoint = (xDatum: any, yDatum: any): AreaSpanPointDatum => ({
            point: {
                x: xScale.convert(xDatum) + xOffset,
                y: yScale.convert(yDatum),
            },
            xDatum,
            yDatum,
        });

        const getSeriesSpans = (index: number) => {
            const points: Array<AreaSpanPointDatum[] | { skip: number }> = [];

            if (dataValues == null) return [];

            for (let i = 0; i < dataValues.length; i += 1) {
                const { xDatum, values } = dataValues[i];
                const yValueStack: number[] = values[yValueStackIndex];
                const yDatum = yValueStack[index];

                const yDatumIsFinite = Number.isFinite(yDatum);

                if (connectMissingData && !yDatumIsFinite) continue;

                const lastYValueStack: number[] | undefined = dataValues[i - 1]?.values[yValueStackIndex];
                const nextYValueStack: number[] | undefined = dataValues[i + 1]?.values[yValueStackIndex];

                let yValueEndBackwards = 0;
                let yValueEndForwards = 0;
                for (let j = 0; j <= index; j += 1) {
                    const value = yValueStack[j];

                    if (Number.isFinite(value)) {
                        const lastWasFinite = lastYValueStack == null || Number.isFinite(lastYValueStack[j]);
                        const nextWasFinite = nextYValueStack == null || Number.isFinite(nextYValueStack[j]);

                        if (lastWasFinite) {
                            yValueEndBackwards += value;
                        }
                        if (nextWasFinite) {
                            yValueEndForwards += value;
                        }
                    }
                }

                const currentPoints: AreaSpanPointDatum[] | { skip: number } | undefined = points[points.length - 1];
                if (!connectMissingData && (yValueEndBackwards !== yValueEndForwards || !yDatumIsFinite)) {
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
                    const yValueEnd = Math.max(yValueEndBackwards, yValueEndForwards);
                    const point = createPoint(xDatum, yValueEnd);

                    if (Array.isArray(currentPoints)) {
                        currentPoints.push(point);
                    } else if (currentPoints != null) {
                        currentPoints.skip += 1;
                        points.push([point]);
                    } else {
                        points.push([point]);
                    }
                }
            }

            return spansForPoints(points);
        };

        const stackIndex = this.seriesGrouping?.stackIndex ?? 0;

        const getAxisSpans = () => {
            if (dataValues == null) return [];
            const yValueZeroPoints = dataValues
                .map<AreaSpanPointDatum | undefined>(({ xDatum, values }) => {
                    const yValueStack: number[] = values[yValueStackIndex];
                    const yDatum = yValueStack[stackIndex];

                    if (connectMissingData && !Number.isFinite(yDatum)) return;
                    return createPoint(xDatum, 0);
                })
                .filter((x): x is AreaSpanPointDatum => x != null);

            return interpolatePoints(yValueZeroPoints);
        };

        const currentSeriesSpans = getSeriesSpans(stackIndex);

        const phantomSpans = currentSeriesSpans.map((): AreaPathSpan => null!);
        for (let j = stackIndex - 1; j >= -1; j -= 1) {
            let spans: Array<AreaPathSpan | null> | undefined; // lazily init
            for (let i = 0; i < phantomSpans.length; i += 1) {
                if (phantomSpans[i] != null) continue;
                spans ??= j !== -1 ? getSeriesSpans(j) : getAxisSpans();
                phantomSpans[i] = spans[i]!;
            }
        }

        const fillSpans = currentSeriesSpans.map((span, index) => span ?? phantomSpans[index]);
        const strokeSpans = currentSeriesSpans.filter((span): span is AreaPathSpan => span != null);

        const context: AreaSeriesNodeDataContext = {
            itemId,
            fillData: { itemId, spans: fillSpans, phantomSpans },
            strokeData: { itemId, spans: strokeSpans },
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

    protected override markerFactory() {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    protected override async updatePathNodes(opts: {
        paths: Path[];
        opacity: number;
        visible: boolean;
        animationEnabled: boolean;
    }) {
        const { opacity, visible, animationEnabled } = opts;
        const [fill, stroke] = opts.paths;
        const crossFiltering = this.contextNodeData?.crossFiltering === true;

        const strokeWidth = this.getStrokeWidth(this.properties.strokeWidth);
        stroke.setProperties({
            fill: undefined,
            lineJoin: (stroke.lineCap = 'round'),
            pointerEvents: PointerEvents.None,
            stroke: this.properties.stroke,
            strokeWidth,
            strokeOpacity:
                this.properties.strokeOpacity * (crossFiltering ? CROSS_FILTER_AREA_STROKE_OPACITY_FACTOR : 1),
            lineDash: this.properties.lineDash,
            lineDashOffset: this.properties.lineDashOffset,
            opacity,
            visible: visible || animationEnabled,
        });
        fill.setProperties({
            stroke: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            fill: this.properties.fill,
            fillOpacity: this.properties.fillOpacity * (crossFiltering ? CROSS_FILTER_AREA_FILL_OPACITY_FACTOR : 1),
            fillShadow: this.properties.shadow,
            opacity,
            visible: visible || animationEnabled,
        });

        updateClipPath(this, stroke);
        updateClipPath(this, fill);
    }

    protected override async updatePaths(opts: { contextData: AreaSeriesNodeDataContext; paths: Path[] }) {
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
                path.checkPathDirty();
            }
        }
    }

    private updateFillPath(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        const { spans, phantomSpans } = contextData.fillData;
        const [fill] = paths;
        const { path } = fill;

        path.clear(true);
        for (let i = 0; i < spans.length; i += 1) {
            const { span } = spans[i];
            const phantomSpan = phantomSpans[i].span;
            plotSpan(path, span, SpanJoin.MoveTo, false);
            plotSpan(path, phantomSpan, SpanJoin.LineTo, true);
            path.closePath();
        }
        fill.checkPathDirty();
    }

    private updateStrokePath(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        const { spans } = contextData.strokeData;
        const [, stroke] = paths;
        const { path } = stroke;

        path.clear(true);
        for (const { span } of spans) {
            plotSpan(path, span, SpanJoin.MoveTo, false);
        }
        stroke.checkPathDirty();
    }

    protected override async updateMarkerSelection(opts: {
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

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yKey, marker, fill, stroke, strokeWidth, fillOpacity, strokeOpacity, highlightStyle } =
            this.properties;
        const baseStyle = mergeDefaults(highlighted && highlightStyle.item, marker.getStyle(), {
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
            strokeOpacity,
        });

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey }, baseStyle, {
                selected: datum.selected,
            });
        });

        if (!highlighted) {
            this.properties.marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: LabelSelectionDatum[];
        labelSelection: Selection<Text, LabelSelectionDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData);
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, LabelSelectionDatum> }) {
        const { labelSelection } = opts;
        const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.properties.label;
        labelSelection.each((text, datum) => {
            const { x, y, labelText } = datum;

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
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: MarkerSelectionDatum): TooltipContent {
        const { id: seriesId, axes, dataModel } = this;
        const { xKey, xName, yName, tooltip, marker } = this.properties;
        const { yKey, xValue, yValue, datum, itemId } = nodeDatum;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !(xAxis && yAxis && isFiniteNumber(yValue)) || !dataModel) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        const baseStyle = mergeDefaults({ fill: this.properties.fill }, marker.getStyle(), {
            stroke: this.properties.stroke,
            strokeWidth: this.properties.strokeWidth,
        });
        const { fill: color } = this.getMarkerStyle(
            marker,
            { datum: nodeDatum, xKey, yKey, highlighted: false },
            baseStyle
        );

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                datum,
                itemId,
                xKey,
                xName,
                yKey,
                yName,
                color,
                title,
                seriesId,
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (
            !this.data?.length ||
            !this.properties.isValid() ||
            !this.properties.showInLegend ||
            legendType !== 'category'
        ) {
            return [];
        }

        const {
            yKey,
            yName,
            fill,
            stroke,
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            marker,
            visible,
            legendItemName,
        } = this.properties;

        const useAreaFill = !marker.enabled || marker.fill === undefined;
        return [
            {
                legendType,
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: legendItemName ?? yName ?? yKey,
                },
                symbols: [
                    {
                        marker: {
                            shape: marker.shape,
                            fill: useAreaFill ? fill : marker.fill,
                            fillOpacity: useAreaFill ? fillOpacity : marker.fillOpacity,
                            stroke: marker.stroke ?? stroke,
                            strokeOpacity: marker.strokeOpacity ?? strokeOpacity,
                            strokeWidth: marker.strokeWidth ?? 0,
                            enabled: marker.enabled || strokeWidth <= 0,
                        },
                        line: {
                            stroke,
                            strokeOpacity,
                            strokeWidth,
                            lineDash,
                        },
                    },
                ],
                legendItemName,
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
        const { xKey, yKey } = datum;
        return this.getMarkerStyle(this.properties.marker, { datum, xKey, yKey, highlighted: true });
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
