import type { AgErrorBoundSeriesTooltipRendererParams } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { isDefined, isFiniteNumber } from '../../../util/type-guards';
import type { RequireOptional } from '../../../util/types';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModelOptions, DatumPropertyDefinition } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import {
    animationValidation,
    createDatumId,
    diff,
    groupAccumulativeValueProperty,
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
import type { CartesianAnimationData, CartesianSeriesNodeDataContext } from './cartesianSeries';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { type LineNodeDatum, LineSeriesProperties } from './lineSeriesProperties';
import { pathRangePoints, pathRanges, prepareLinePathAnimation } from './lineUtil';
import {
    computeMarkerFocusBounds,
    markerFadeInAnimation,
    markerSwipeScaleInAnimation,
    resetMarkerFn,
    resetMarkerPositionFn,
} from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, plotPath, updateClipPath } from './pathUtil';

const CROSS_FILTER_LINE_STROKE_OPACITY_FACTOR = 0.25;

interface LineSeriesNodeDataContext extends CartesianSeriesNodeDataContext<LineNodeDatum> {
    crossFiltering: boolean;
}

type LineAnimationData = CartesianAnimationData<Group, LineNodeDatum, LineNodeDatum, LineSeriesNodeDataContext>;

export class LineSeries extends CartesianSeries<
    Group,
    LineSeriesProperties,
    LineNodeDatum,
    LineNodeDatum,
    LineSeriesNodeDataContext
> {
    static readonly className = 'LineSeries';
    static readonly type = 'line' as const;

    override properties = new LineSeriesProperties();

    override get nearestNodeAxis() {
        return 'main-category' as const;
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            hasMarkers: true,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            markerSelectionGarbageCollection: false,
            animationResetFns: {
                path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
        });
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
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if (connectMissingData && stackCount > 1) {
            common.invalidValue = 0;
        }
        if (!visible) {
            common.forceValue = 0;
        }

        const props: DataModelOptions<any, false>['props'] = [];

        // If two or more datum share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datum and
        // automatically garbage collect the marker selection.
        if (!isContinuousX) {
            props.push(keyProperty(xKey, xScaleType, { id: 'xKey' }));
        }

        props.push(
            valueProperty(xKey, xScaleType, { id: 'xValue' }),
            valueProperty(yKey, yScaleType, {
                id: `yValueRaw`,
                ...common,
                invalidValue: undefined,
            })
        );

        if (yFilterKey != null) {
            props.push(valueProperty(yFilterKey, yScaleType, { id: 'yFilterRaw' }));
        }

        if (stackCount > 1) {
            const ids = [
                `line-stack-${groupIndex}-yValues`,
                `line-stack-${groupIndex}-yValues-trailing`,
                `line-stack-${groupIndex}-yValues-marker`,
            ];

            props.push(
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window',
                    'current',
                    { id: `yValueEnd`, ...common, groupId: ids[0] },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window-trailing',
                    'current',
                    { id: `yValueStart`, ...common, groupId: ids[1] },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    'current',
                    { id: `yValueCumulative`, ...common, groupId: ids[2] },
                    yScaleType
                )
            );

            if (isDefined(normalizedTo)) {
                props.push(normaliseGroupTo([ids[0], ids[1], ids[2]], normalizedTo, 'range'));
            }
        }

        if (animationEnabled) {
            props.push(animationValidation(isContinuousX ? ['xValue'] : undefined));
            if (this.processedData) {
                props.push(diff(this.processedData));
            }
        }

        await this.requestDataModel<any>(dataController, data, { props });

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData?.data.length) return [];

        const xDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        if (direction === ChartAxisDirection.X) {
            const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);
            if (xDef?.def.type === 'value' && xDef.def.valueType === 'category') {
                return domain;
            }

            return fixNumericExtent(extent(domain));
        } else {
            const stackCount = this.seriesGrouping?.stackCount ?? 1;
            const domain =
                stackCount > 1
                    ? dataModel.getDomain(this, `yValueEnd`, 'value', processedData)
                    : dataModel.getDomain(this, `yValueRaw`, 'value', processedData);
            return fixNumericExtent(domain);
        }
    }

    async createNodeData() {
        const { processedData, dataModel, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!processedData || !dataModel || !xAxis || !yAxis) {
            return;
        }

        const { xKey, yKey, yFilterKey, xName, yName, marker, label, connectMissingData, legendItemName } =
            this.properties;
        const stacked = (this.seriesGrouping?.stackCount ?? 1) > 1;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: LineNodeDatum[] = [];
        const size = marker.enabled ? marker.size : 0;

        const xIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const yIdx = dataModel.resolveProcessedDataIndexById(this, `yValueRaw`);
        const ySelectionIdx =
            yFilterKey != null ? dataModel.resolveProcessedDataIndexById(this, `yFilterRaw`) : undefined;
        const yCumulativeIdx = stacked ? dataModel.resolveProcessedDataIndexById(this, `yValueCumulative`) : yIdx;
        const yEndIdx = stacked ? dataModel.resolveProcessedDataIndexById(this, `yValueEnd`) : undefined;

        let moveTo = true;
        let crossFiltering = false;
        // let nextPoint: UngroupedDataItem<any, any> | undefined;
        processedData.data?.forEach(({ datum, values }) => {
            const xDatum = values[xIdx];
            const yDatum = values[yIdx];
            const yCumulativeDatum = values[yCumulativeIdx];
            const yEndDatum = yEndIdx != null ? values[yEndIdx] : undefined;

            if (yDatum == null) {
                moveTo ||= !connectMissingData;
                return;
            }

            const x = xScale.convert(xDatum) + xOffset;
            if (isNaN(x)) {
                moveTo ||= !connectMissingData;
                return;
            }

            const y = yScale.convert(yCumulativeDatum) + yOffset;

            const selected = ySelectionIdx != null ? values[ySelectionIdx] === yDatum : undefined;
            if (selected === false) {
                crossFiltering = true;
            }

            const labelText = this.getLabelText(
                label,
                { value: yDatum, datum, xKey, yKey, xName, yName, legendItemName },
                (value) => (isFiniteNumber(value) ? value.toFixed(2) : String(value))
            );

            nodeData.push({
                series: this,
                datum,
                yKey,
                xKey,
                point: { x, y, moveTo, size },
                midPoint: { x, y },
                cumulativeValue: yEndDatum,
                yValue: yDatum,
                xValue: xDatum,
                capDefaults: {
                    lengthRatioMultiplier: this.properties.marker.getDiameter(),
                    lengthMax: Infinity,
                },
                labelText,
                selected,
            });
            moveTo = false;
        });

        return {
            itemId: yKey,
            nodeData,
            labelData: nodeData,
            scales: this.calculateScaling(),
            visible: this.visible,
            crossFiltering,
        };
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
        seriesHighlighted?: boolean;
        paths: Path[];
        opacity: number;
        visible: boolean;
        animationEnabled: boolean;
    }) {
        const {
            paths: [lineNode],
            opacity,
            visible,
            animationEnabled,
        } = opts;
        const crossFiltering = this.contextNodeData?.crossFiltering === true;

        lineNode.setProperties({
            fill: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            opacity,
            stroke: this.properties.stroke,
            strokeWidth: this.getStrokeWidth(this.properties.strokeWidth),
            strokeOpacity:
                this.properties.strokeOpacity * (crossFiltering ? CROSS_FILTER_LINE_STROKE_OPACITY_FACTOR : 1),
            lineDash: this.properties.lineDash,
            lineDashOffset: this.properties.lineDashOffset,
        });

        if (!animationEnabled) {
            lineNode.visible = visible;
        }

        updateClipPath(this, lineNode);
    }

    protected override async updateMarkerSelection(opts: {
        nodeData: LineNodeDatum[];
        markerSelection: Selection<Marker, LineNodeDatum>;
        markerGroup?: Group;
    }) {
        let { nodeData } = opts;
        const { markerSelection } = opts;
        const markersEnabled = this.properties.marker.enabled || this.contextNodeData?.crossFiltering === true;
        nodeData = markersEnabled ? nodeData : [];

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        return markerSelection.update(nodeData, undefined, (datum) => createDatumId(datum.xValue));
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, LineNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yKey, stroke, strokeWidth, strokeOpacity, marker, highlightStyle } = this.properties;
        const baseStyle = mergeDefaults(highlighted && highlightStyle.item, marker.getStyle(), {
            stroke,
            strokeWidth,
            strokeOpacity,
        });

        const applyTranslation = this.ctx.animationManager.isSkipped();
        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey }, baseStyle, {
                applyTranslation,
                selected: datum.selected,
            });
        });

        if (!highlighted) {
            marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: LineNodeDatum[];
        labelSelection: Selection<Text, LineNodeDatum>;
    }) {
        return opts.labelSelection.update(this.isLabelEnabled() ? opts.labelData : []);
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, LineNodeDatum> }) {
        const { enabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.properties.label;

        opts.labelSelection.each((text, datum) => {
            if (enabled && datum?.labelText) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = 'center';
                text.textBaseline = 'bottom';
                text.text = datum.labelText;
                text.x = datum.point.x;
                text.y = datum.point.y - 10;
                text.fill = color;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: LineNodeDatum): TooltipContent {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { xKey, yKey, xName, yName, strokeWidth, marker, tooltip } = this.properties;
        const { datum, xValue, yValue, itemId } = nodeDatum;
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(this.properties.title ?? yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        const baseStyle = mergeDefaults({ fill: marker.stroke }, marker.getStyle(), { strokeWidth });
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
                title,
                color,
                seriesId: this.id,
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (!(this.data?.length && this.properties.isValid() && legendType === 'category')) {
            return [];
        }

        const { yKey, yName, stroke, strokeOpacity, strokeWidth, lineDash, title, marker, visible, legendItemName } =
            this.properties;

        const color0 = 'rgba(0, 0, 0, 0)';
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: yKey,
                legendItemName,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: legendItemName ?? title ?? yName ?? yKey,
                },
                symbols: [
                    {
                        marker: {
                            shape: marker.shape,
                            fill: marker.fill ?? color0,
                            stroke: marker.stroke ?? stroke ?? color0,
                            fillOpacity: marker.fillOpacity ?? 1,
                            strokeOpacity: marker.strokeOpacity ?? strokeOpacity ?? 1,
                            strokeWidth: marker.strokeWidth ?? 0,
                            enabled: marker.enabled,
                        },
                        line: {
                            stroke: stroke ?? color0,
                            strokeOpacity,
                            strokeWidth,
                            lineDash,
                        },
                    },
                ],
            },
        ];
    }

    protected override async updatePaths(opts: {
        contextData: CartesianSeriesNodeDataContext<LineNodeDatum>;
        paths: Path[];
    }) {
        this.updateLinePaths(opts.paths, opts.contextData);
    }

    private updateLinePaths(paths: Path[], contextData: CartesianSeriesNodeDataContext<LineNodeDatum>) {
        const { interpolation } = this.properties;
        const { nodeData } = contextData;
        const [lineNode] = paths;

        lineNode.path.clear(true);
        for (const range of pathRanges(nodeData)) {
            plotPath(pathRangePoints(nodeData, range), lineNode, interpolation);
        }
        lineNode.checkPathDirty();
    }

    protected override animateEmptyUpdateReady(animationData: LineAnimationData) {
        const { markerSelection, labelSelection, annotationSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateLinePaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([markerSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelection);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
        seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
    }

    protected override animateReadyResize(animationData: LineAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateLinePaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    protected override animateWaitingUpdateReady(animationData: LineAnimationData) {
        const { animationManager } = this.ctx;
        const {
            markerSelection: markerSelections,
            labelSelection: labelSelections,
            annotationSelections,
            contextData,
            paths,
            previousContextData,
        } = animationData;
        const [path] = paths;

        this.resetMarkerAnimation(animationData);
        this.resetLabelAnimation(animationData);

        const update = () => {
            this.resetPathAnimation(animationData);
            this.updateLinePaths(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, 'added', markerSelections);
            pathFadeInAnimation(this, 'path_properties', animationManager, 'add', path);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
            return;
        }

        if (contextData.crossFiltering !== previousContextData.crossFiltering) {
            skip();
            return;
        }

        let fns: ReturnType<typeof prepareLinePathAnimation>;
        try {
            fns = prepareLinePathAnimation(
                contextData,
                previousContextData,
                this.processedData?.reduced?.diff,
                this.properties.interpolation
            );
        } catch {
            // @todo(CRT-468) - this code will likely be replaced with area-series implementation
            fns = undefined;
        }

        if (fns === undefined) {
            skip();
            return;
        } else if (fns.status === 'no-op') {
            return;
        }

        markerFadeInAnimation(this, animationManager, undefined, markerSelections);
        fromToMotion(this.id, 'path_properties', animationManager, [path], fns.pathProperties);

        if (fns.status === 'added') {
            this.updateLinePaths(paths, contextData);
        } else if (fns.status === 'removed') {
            this.updateLinePaths(paths, previousContextData);
        } else {
            pathMotion(this.id, 'path_update', animationManager, [path], fns.path);
        }

        if (fns.hasMotion) {
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
        }
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    override getBandScalePadding() {
        return { inner: 1, outer: 0.1 };
    }

    protected nodeFactory() {
        return new Group();
    }

    public getFormattedMarkerStyle(datum: LineNodeDatum) {
        const { xKey, yKey } = this.properties;
        return this.getMarkerStyle(this.properties.marker, { datum, xKey, yKey, highlighted: true });
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
