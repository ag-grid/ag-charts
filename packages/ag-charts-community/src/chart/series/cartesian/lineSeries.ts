import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type {
    AgLineSeriesLabelFormatterParams,
    AgLineSeriesOptionsKeys,
    AgLineSeriesTooltipRendererParams,
    FontStyle,
    FontWeight,
} from '../../../options/agChartOptions';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Path2D } from '../../../scene/path2D';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { NUMBER, OPT_COLOR_STRING, OPT_LINE_DASH, OPT_STRING, Validate } from '../../../util/validation';
import { isNumber } from '../../../util/value';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModelOptions, UngroupedDataItem } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import { animationValidation, createDatumId, diff } from '../../data/processors';
import { Label } from '../../label';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import type {
    CartesianAnimationData,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
} from './cartesianSeries';
import { CartesianSeries } from './cartesianSeries';
import { prepareLinePathAnimation } from './lineUtil';
import { markerSwipeScaleInAnimation, resetMarkerFn, resetMarkerPositionFn } from './markerUtil';
import { buildResetPathFn, pathSwipeInAnimation } from './pathUtil';

interface LineNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly point: CartesianSeriesNodeDatum['point'] & {
        readonly moveTo: boolean;
    };
    readonly label?: {
        readonly text: string;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly textAlign: CanvasTextAlign;
        readonly textBaseline: CanvasTextBaseline;
        readonly fill: string;
    };
}

type LineAnimationData = CartesianAnimationData<Group, LineNodeDatum>;

export class LineSeries extends CartesianSeries<Group, LineNodeDatum> {
    static className = 'LineSeries';
    static type = 'line' as const;

    readonly label = new Label<AgLineSeriesLabelFormatterParams>();
    readonly marker = new SeriesMarker<AgLineSeriesOptionsKeys, LineNodeDatum>();
    readonly tooltip = new SeriesTooltip<AgLineSeriesTooltipRendererParams>();

    @Validate(OPT_STRING)
    title?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = '#874349';

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(NUMBER(0))
    strokeWidth: number = 2;

    @Validate(NUMBER(0, 1))
    strokeOpacity: number = 1;

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

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    override async processData(dataController: DataController) {
        const { xKey, yKey, data } = this;

        if (xKey == null || yKey == null || data == null) return;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const { isContinuousX, isContinuousY } = this.isContinuous();

        const props: DataModelOptions<any, false>['props'] = [];

        // If two or more datums share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datums and
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

        await this.requestDataModel<any>(dataController, data, { props });

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

    async createNodeData() {
        const { processedData, dataModel, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!processedData || !dataModel || !xAxis || !yAxis) {
            return [];
        }

        const { label, yKey = '', xKey = '' } = this;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: LineNodeDatum[] = [];
        const size = this.marker.enabled ? this.marker.size : 0;

        const xIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;

        let moveTo = true;
        let nextPoint: UngroupedDataItem<any, any> | undefined;
        for (let i = 0; i < processedData.data.length; i++) {
            const { datum, values } = nextPoint ?? processedData.data[i];
            const xDatum = values[xIdx];
            const yDatum = values[yIdx];

            if (yDatum === undefined) {
                moveTo = true;
            } else {
                const x = xScale.convert(xDatum) + xOffset;
                if (isNaN(x)) {
                    moveTo = true;
                    nextPoint = undefined;
                    continue;
                }

                nextPoint =
                    processedData.data[i + 1]?.values[yIdx] === undefined ? undefined : processedData.data[i + 1];

                const y = yScale.convert(yDatum) + yOffset;

                const labelText = this.getLabelText(
                    label,
                    {
                        value: yDatum,
                        datum,
                        xKey,
                        yKey,
                        xName: this.xName,
                        yName: this.yName,
                    },
                    (value) => (isNumber(value) ? value.toFixed(2) : String(value))
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
                    capDefaults: { lengthRatioMultiplier: this.marker.getDiameter(), lengthMax: Infinity },
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
        return this.marker.isDirty();
    }

    protected override markerFactory() {
        const { shape } = this.marker;
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
        const { seriesRectHeight: height, seriesRectWidth: width } = this.nodeDataDependencies;

        lineNode.setProperties({
            fill: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            opacity,
            stroke: this.stroke,
            strokeWidth: this.getStrokeWidth(this.strokeWidth),
            strokeOpacity: this.strokeOpacity,
            lineDash: this.lineDash,
            lineDashOffset: this.lineDashOffset,
        });

        if (!animationEnabled) {
            lineNode.visible = visible;
        }

        if (lineNode.clipPath == null) {
            lineNode.clipPath = new Path2D();
            lineNode.clipScalingX = 1;
            lineNode.clipScalingY = 1;
        }
        lineNode.clipPath?.clear({ trackChanges: true });
        lineNode.clipPath?.rect(-25, -25, (width ?? 0) + 50, (height ?? 0) + 50);
    }

    protected override async updateMarkerSelection(opts: {
        nodeData: LineNodeDatum[];
        markerSelection: Selection<Marker, LineNodeDatum>;
        markerGroup?: Group;
    }) {
        let { nodeData } = opts;
        const { markerSelection } = opts;
        const { shape, enabled } = this.marker;
        nodeData = shape && enabled ? nodeData : [];

        if (this.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        return markerSelection.update(nodeData, undefined, (datum) => this.getDatumId(datum));
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, LineNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey = '', yKey = '', marker, stroke, strokeWidth, strokeOpacity } = this;
        const baseStyle = mergeDefaults(highlighted && this.highlightStyle.item, marker.getStyle(), {
            stroke,
            strokeWidth,
            strokeOpacity,
        });

        const applyTranslation = this.ctx.animationManager.isSkipped();
        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey }, baseStyle, { applyTranslation });
        });

        if (!highlighted) {
            this.marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: LineNodeDatum[];
        labelSelection: Selection<Text, LineNodeDatum>;
    }) {
        let { labelData } = opts;
        const { labelSelection } = opts;
        const { shape, enabled } = this.marker;
        labelData = shape && enabled ? labelData : [];

        return labelSelection.update(labelData);
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, LineNodeDatum> }) {
        const { labelSelection } = opts;
        const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.label;

        labelSelection.each((text, datum) => {
            const { point, label } = datum;

            if (datum && label && labelEnabled) {
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
        const { xKey, yKey, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, tooltip, marker, id: seriesId } = this;
        const { datum, xValue, yValue } = nodeDatum;
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(this.title ?? yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        const baseStyle = mergeDefaults({ fill: marker.stroke }, marker.getStyle(), { strokeWidth: this.strokeWidth });
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
                seriesId,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { id, data, xKey, yKey, yName, visible, title, marker, stroke, strokeOpacity } = this;

        if (!(data?.length && xKey && yKey && legendType === 'category')) {
            return [];
        }

        return [
            {
                legendType: 'category',
                id: id,
                itemId: yKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: title ?? yName ?? yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: marker.stroke ?? stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: marker.fillOpacity ?? 1,
                    strokeOpacity: marker.strokeOpacity ?? strokeOpacity ?? 1,
                    strokeWidth: marker.strokeWidth ?? 0,
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
        const { seriesRectWidth: width = 0 } = this.nodeDataDependencies;

        this.updateLinePaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, paths.flat());
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections, width);
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

        super.resetAllAnimation(animationData);

        if (contextData.length === 0 || !previousContextData || previousContextData.length === 0) {
            animationManager.skipCurrentBatch();
            this.updateLinePaths(paths, contextData);
            return;
        }

        const [path] = paths;
        const [newData] = contextData;
        const [oldData] = previousContextData;

        const fns = prepareLinePathAnimation(newData, oldData, this.processedData?.reduced?.diff);
        if (fns === undefined) {
            animationManager.skipCurrentBatch();
            this.updateLinePaths(paths, contextData);
            return;
        }

        fromToMotion(this.id, 'marker', animationManager, markerSelections, fns.marker as any);
        fromToMotion(this.id, 'path_properties', animationManager, path, fns.pathProperties);
        pathMotion(this.id, 'path_update', animationManager, path, fns.path);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', animationManager, annotationSelections);
    }

    private getDatumId(datum: LineNodeDatum) {
        return createDatumId([`${datum.xValue}`]);
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    override getBandScalePadding() {
        return { inner: 1, outer: 0.1 };
    }

    protected nodeFactory() {
        return new Group();
    }
}
