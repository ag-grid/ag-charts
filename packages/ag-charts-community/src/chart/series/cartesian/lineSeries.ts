import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { Node, PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { Quadtree } from '../../../util/quadtree';
import { sanitizeHtml } from '../../../util/sanitize';
import { isFiniteNumber } from '../../../util/type-guards';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModelOptions, UngroupedDataItem } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import { animationValidation, createDatumId, diff } from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMatch, SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { CartesianAnimationData, CartesianSeriesNodeDataContext } from './cartesianSeries';
import { CartesianSeries } from './cartesianSeries';
import { LineNodeDatum, LineSeriesProperties } from './lineSeriesProperties';
import { prepareLinePathAnimation } from './lineUtil';
import { markerFadeInAnimation, markerSwipeScaleInAnimation, resetMarkerFn, resetMarkerPositionFn } from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, updateClipPath } from './pathUtil';

type LineAnimationData = CartesianAnimationData<Group, LineNodeDatum>;

export class LineSeries extends CartesianSeries<Group, LineNodeDatum> {
    static className = 'LineSeries';
    static type = 'line' as const;

    override properties = new LineSeriesProperties();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            hasMarkers: true,
            pickModes: [
                SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            markerSelectionGarbageCollection: false,
            animationResetFns: {
                path: buildResetPathFn({ getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
        });
    }

    override async processData(dataController: DataController) {
        if (!this.properties.isValid() || this.data == null) {
            return;
        }

        const { xKey, yKey } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const { isContinuousX, isContinuousY } = this.isContinuous();

        const props: DataModelOptions<any, false>['props'] = [];

        // If two or more datum share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datum and
        // automatically garbage collect the marker selection.
        if (!isContinuousX) {
            props.push(keyProperty(this, xKey, isContinuousX, { id: 'xKey' }));
            if (animationEnabled && this.processedData) {
                props.push(diff(this.processedData));
            }
        }
        if (animationEnabled) {
            props.push(animationValidation(this, isContinuousX ? ['xValue'] : []));
        }

        props.push(
            valueProperty(this, xKey, isContinuousX, { id: 'xValue' }),
            valueProperty(this, yKey, isContinuousY, { id: 'yValue', invalidValue: undefined })
        );

        await this.requestDataModel<any>(dataController, this.data, { props });

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { axes, dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const xDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        if (direction === ChartAxisDirection.X) {
            const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);
            if (xDef?.def.type === 'value' && xDef.def.valueType === 'category') {
                return domain;
            }

            return fixNumericExtent(extent(domain), xAxis);
        } else {
            const domain = dataModel.getDomain(this, `yValue`, 'value', processedData);
            return fixNumericExtent(domain as any, yAxis);
        }
    }

    private quadtree?: Quadtree<Node> = undefined;

    async createNodeData() {
        const { processedData, dataModel, axes } = this;

        this.quadtree = undefined;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!processedData || !dataModel || !xAxis || !yAxis) {
            return [];
        }

        const { xKey, yKey, xName, yName, marker, label, connectMissingData } = this.properties;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: LineNodeDatum[] = [];
        const size = marker.enabled ? marker.size : 0;

        const xIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;

        let moveTo = true;
        let nextPoint: UngroupedDataItem<any, any> | undefined;
        for (let i = 0; i < processedData.data.length; i++) {
            const { datum, values } = nextPoint ?? processedData.data[i];
            const xDatum = values[xIdx];
            const yDatum = values[yIdx];

            if (yDatum === undefined) {
                moveTo = !connectMissingData;
            } else {
                const x = xScale.convert(xDatum) + xOffset;
                if (isNaN(x)) {
                    moveTo = !connectMissingData;
                    nextPoint = undefined;
                    continue;
                }

                nextPoint =
                    processedData.data[i + 1]?.values[yIdx] === undefined ? undefined : processedData.data[i + 1];

                const y = yScale.convert(yDatum) + yOffset;

                const labelText = this.getLabelText(
                    label,
                    { value: yDatum, datum, xKey, yKey, xName, yName },
                    (value) => (isFiniteNumber(value) ? value.toFixed(2) : String(value))
                );

                nodeData.push({
                    series: this,
                    datum,
                    yKey,
                    xKey,
                    point: { x, y, moveTo, size },
                    midPoint: { x, y },
                    yValue: yDatum,
                    xValue: xDatum,
                    capDefaults: { lengthRatioMultiplier: this.properties.marker.getDiameter(), lengthMax: Infinity },
                    label: labelText
                        ? {
                              text: labelText,
                              fontStyle: label.fontStyle,
                              fontWeight: label.fontWeight,
                              fontSize: label.fontSize,
                              fontFamily: label.fontFamily,
                              textAlign: 'center',
                              textBaseline: 'bottom',
                              fill: label.color,
                          }
                        : undefined,
                });
                moveTo = false;
            }
        }

        return [
            {
                itemId: yKey,
                nodeData,
                labelData: nodeData,
                scales: super.calculateScaling(),
                visible: this.visible,
            },
        ];
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

        lineNode.setProperties({
            fill: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            opacity,
            stroke: this.properties.stroke,
            strokeWidth: this.getStrokeWidth(this.properties.strokeWidth),
            strokeOpacity: this.properties.strokeOpacity,
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
        const { shape, enabled } = this.properties.marker;
        nodeData = shape && enabled ? nodeData : [];

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
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey }, baseStyle, { applyTranslation });
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
            const { point, label } = datum;

            if (datum && label && enabled) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = label.textAlign;
                text.textBaseline = label.textBaseline;
                text.text = label.text;
                text.x = point.x;
                text.y = point.y - 10;
                text.fill = color;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: LineNodeDatum): string {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }

        const { xKey, yKey, xName, yName, strokeWidth, marker, tooltip } = this.properties;
        const { datum, xValue, yValue } = nodeDatum;
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
                xKey,
                xName,
                yKey,
                yName,
                title,
                color,
                seriesId: this.id,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (!(this.data?.length && this.properties.isValid() && legendType === 'category')) {
            return [];
        }

        const { yKey, yName, stroke, strokeOpacity, strokeWidth, lineDash, title, marker, visible } = this.properties;

        const color0 = 'rgba(0, 0, 0, 0)';
        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
                enabled: visible,
                label: {
                    text: title ?? yName ?? yKey,
                },
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
        ];
    }

    protected override async updatePaths(opts: {
        contextData: CartesianSeriesNodeDataContext<LineNodeDatum>;
        paths: Path[];
    }) {
        this.updateLinePaths([opts.paths], [opts.contextData]);
    }

    private updateLinePaths(paths: Path[][], contextData: CartesianSeriesNodeDataContext<LineNodeDatum>[]) {
        contextData.forEach(({ nodeData }, contextDataIndex) => {
            const [lineNode] = paths[contextDataIndex];

            const { path: linePath } = lineNode;

            linePath.clear({ trackChanges: true });
            for (const data of nodeData) {
                if (data.point.moveTo) {
                    linePath.moveTo(data.point.x, data.point.y);
                } else {
                    linePath.lineTo(data.point.x, data.point.y);
                }
            }
            lineNode.checkPathDirty();
        });
    }

    protected override animateEmptyUpdateReady(animationData: LineAnimationData) {
        const { markerSelections, labelSelections, annotationSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateLinePaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, paths.flat());
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', animationManager, annotationSelections);
    }

    protected override animateReadyResize(animationData: LineAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateLinePaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    protected override animateWaitingUpdateReady(animationData: LineAnimationData) {
        const { animationManager } = this.ctx;
        const { markerSelections, labelSelections, annotationSelections, contextData, paths, previousContextData } =
            animationData;
        const [path] = paths;

        super.resetAllAnimation(animationData);

        const update = () => {
            this.updateLinePaths(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData.length === 0 || previousContextData?.length === 0) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, markerSelections, 'added');
            pathFadeInAnimation(this, 'path_properties', animationManager, path ?? []);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, annotationSelections);
            return;
        }

        const [newData] = contextData;
        const [oldData] = previousContextData ?? [];

        const fns = prepareLinePathAnimation(newData, oldData, this.processedData?.reduced?.diff);
        if (fns === undefined) {
            skip();
            return;
        }

        markerFadeInAnimation(this, animationManager, markerSelections);
        fromToMotion(this.id, 'path_properties', animationManager, path, fns.pathProperties);
        pathMotion(this.id, 'path_update', animationManager, path, fns.path);
        if (fns.hasMotion) {
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, annotationSelections);
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

    private getQuadTree() {
        if (this.quadtree === undefined) {
            this.quadtree = new Quadtree(100, 10, this.contentGroup.computeTransformedBBox());
            for (const children of this.contentGroup.children) {
                for (const node of children.children) {
                    this.quadtree.addValue(node.computeTransformedBBox() ?? BBox.NaN, node);
                }
            }
        }
        return this.quadtree;
    }

    protected override pickNodeExactShape(point: Point): SeriesNodePickMatch | undefined {
        //*
        for (const { value } of this.getQuadTree().pickValues(point.x, point.y)) {
            if (value.containsPoint(point.x, point.y)) {
                return { datum: value.datum, distance: 0 };
            }
        }
        //*/

        return super.pickNodeExactShape(point);
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        point;
        /*
        const { nearest, distanceSquared } = this.getQuadTree().findNearest(point.x, point.y);
        if (nearest !== undefined) {
            return { datum: nearest.value.datum, distance: Math.sqrt(distanceSquared) };
        }
        //*/

        return undefined;
    }
}
