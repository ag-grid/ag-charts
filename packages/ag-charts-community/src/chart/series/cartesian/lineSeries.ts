import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type {
    AgCartesianSeriesMarkerFormat,
    AgLineSeriesLabelFormatterParams,
    AgLineSeriesTooltipRendererParams,
    AgTooltipRendererResult,
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
import { sanitizeHtml } from '../../../util/sanitize';
import { NUMBER, OPT_COLOR_STRING, OPT_LINE_DASH, OPT_STRING, Validate } from '../../../util/validation';
import { isNumber } from '../../../util/value';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModelOptions, UngroupedDataItem } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import { createDatumId } from '../../data/processors';
import { Label } from '../../label';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesTooltip } from '../seriesTooltip';
import type {
    CartesianAnimationData,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
    ErrorBoundSeriesNodeDatum,
} from './cartesianSeries';
import { CartesianSeries, CartesianSeriesMarker } from './cartesianSeries';
import { prepareLinePathAnimation } from './lineUtil';
import {
    getMarkerConfig,
    markerSwipeScaleInAnimation,
    resetMarkerFn,
    resetMarkerPositionFn,
    updateMarker,
} from './markerUtil';

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
    readonly marker = new CartesianSeriesMarker();
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
                path: () => ({ clipScalingX: 1, clipScalingY: 1 }),
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
        const { xKey = '', yKey = '' } = this;
        const data = xKey && yKey && this.data ? this.data : [];

        const { isContinuousX, isContinuousY } = this.isContinuous();

        const props: DataModelOptions<any, false>['props'] = [];

        props.push(
            valueProperty(this, xKey, isContinuousX, { id: 'xValue' }),
            valueProperty(this, yKey, isContinuousY, { id: 'yValue', invalidValue: undefined })
        );

        await this.requestDataModel<any>(dataController, data, {
            props,
            dataVisible: this.visible,
        });

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
        let lastXValue: number = -Infinity;
        let isXUniqueAndOrdered = true;
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

                isXUniqueAndOrdered &&= lastXValue < x;
                lastXValue = x;

                nodeData.push({
                    series: this,
                    datum,
                    yKey,
                    xKey,
                    point: { x, y, moveTo, size },
                    midPoint: { x, y },
                    yValue: yDatum,
                    xValue: xDatum,
                    capDefaults: { lengthRatio: 1, lengthRatioMultiplier: this.marker.size, lengthMax: Infinity },
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
                animationValid: isXUniqueAndOrdered,
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

    protected override async updatePaths(opts: {
        seriesHighlighted?: boolean;
        contextData: CartesianSeriesNodeDataContext<LineNodeDatum>;
        paths: Path[];
    }) {
        const {
            paths: [lineNode],
        } = opts;
        const { seriesRectHeight: height, seriesRectWidth: width } = this.nodeDataDependencies;

        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.pointerEvents = PointerEvents.None;
        lineNode.opacity = 1;

        lineNode.stroke = this.stroke;
        lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
        lineNode.strokeOpacity = this.strokeOpacity;

        lineNode.lineDash = this.lineDash;
        lineNode.lineDashOffset = this.lineDashOffset;

        if (lineNode.clipPath == null) {
            lineNode.clipPath = new Path2D();
        }
        lineNode.clipMode = 'normal';
        lineNode.clipPath?.clear({ trackChanges: true });
        lineNode.clipPath?.rect(0, 0, width ?? 0, height ?? 0);
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
        }

        const idFn = this.ctx.animationManager.isSkipped()
            ? undefined
            : (datum: LineNodeDatum) => this.getDatumId(datum);
        return markerSelection.update(nodeData, undefined, idFn);
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, LineNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const {
            id: seriesId,
            xKey = '',
            yKey = '',
            marker,
            stroke,
            strokeWidth,
            strokeOpacity,
            highlightStyle: { item: markerHighlightStyle },
            visible,
            ctx,
        } = this;

        const customMarker = typeof marker.shape === 'function';

        markerSelection.each((node, datum) => {
            const styles = getMarkerConfig({
                datum,
                highlighted,
                formatter: marker.formatter,
                markerStyle: marker,
                seriesStyle: { stroke, strokeWidth, strokeOpacity },
                highlightStyle: markerHighlightStyle,
                seriesId,
                ctx,
                xKey,
                yKey,
                size: datum.point.size,
                strokeWidth,
            });

            const point = this.ctx.animationManager.isSkipped() ? datum.point : undefined;
            const config = { ...styles, point, visible, customMarker };
            updateMarker({ node, config });
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

        const { formatter: markerFormatter, fill: markerFill, stroke, strokeWidth: markerStrokeWidth, size } = marker;
        const strokeWidth = markerStrokeWidth ?? this.strokeWidth;

        let format: AgCartesianSeriesMarkerFormat | undefined;
        if (markerFormatter) {
            format = markerFormatter({
                datum,
                xKey,
                yKey,
                fill: markerFill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
                seriesId,
            });
        }

        const color = format?.fill ?? stroke ?? markerFill;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum,
            xKey,
            xName,
            yKey,
            yName,
            title,
            color,
            seriesId,
            ...this.getModuleTooltipParams(datum),
        });
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

    private updateLinePaths(
        paths: Path[][],
        contextData: CartesianSeriesNodeDataContext<LineNodeDatum, LineNodeDatum>[]
    ) {
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
        const { markerSelections, labelSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;
        const { seriesRectWidth: width = 0 } = this.nodeDataDependencies;

        this.updateLinePaths(paths, contextData);
        staticFromToMotion(
            `${this.id}_swipe_path`,
            animationManager,
            paths.map((p) => p[0]),
            { clipScalingX: 0 },
            { clipScalingX: 1 }
        );
        resetMotion(markerSelections, resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelections, width);
        seriesLabelFadeInAnimation(this, animationManager, labelSelections);
    }

    protected override animateReadyResize(animationData: LineAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateLinePaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    protected override animateWaitingUpdateReady(animationData: LineAnimationData) {
        const { animationManager } = this.ctx;
        const { markerSelections, labelSelections, contextData, paths, previousContextData } = animationData;

        if (
            !previousContextData ||
            !contextData.every((d) => d.animationValid) ||
            !previousContextData.every((d) => d.animationValid)
        ) {
            this.updateLinePaths(paths, contextData);
            super.resetAllAnimation(animationData);
            return;
        }

        const [path] = paths;
        const [newData] = contextData;
        const [oldData] = previousContextData;

        const fns = prepareLinePathAnimation(newData, oldData);
        fromToMotion(`${this.id}_marker_update`, animationManager, markerSelections as any, fns.marker as any);
        fromToMotion(`${this.id}_path_properties`, animationManager, path, fns.pathProperties);
        pathMotion(`${this.id}_path_update`, animationManager, path, fns.path);
        seriesLabelFadeInAnimation(this, animationManager, labelSelections);
    }

    private getDatumId(datum: LineNodeDatum) {
        if (this.ctx.animationManager.isSkipped()) return '';
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
