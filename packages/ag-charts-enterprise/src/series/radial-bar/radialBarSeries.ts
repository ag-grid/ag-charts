import type {
    AgRadialSeriesFormat,
    AgRadialSeriesFormatterParams,
    AgRadialSeriesLabelFormatterParams,
    AgRadialSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { RadiusCategoryAxis } from '../../axes/radius-category/radiusCategoryAxis';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { prepareRadialBarSeriesAnimationFunctions, resetRadialBarSelectionsFn } from './radialBarUtil';

const {
    ChartAxisDirection,
    HighlightStyle,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_STRING,
    PolarAxis,
    STRING,
    Validate,
    diff,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    valueProperty,
    fixNumericExtent,
    resetLabelFn,
    seriesLabelFadeInAnimation,
    seriesLabelFadeOutAnimation,
    animationValidation,
} = _ModuleSupport;

const { BandScale } = _Scale;
const { Sector, motion } = _Scene;
const { angleBetween, isNumber, sanitizeHtml } = _Util;

class RadialBarSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeClickEvent<RadialBarNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RadialBarNodeDatum, series: RadialBarSeries) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.radiusKey = series.radiusKey;
    }
}

interface RadialBarLabelNodeDatum {
    text: string;
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

export interface RadialBarNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: RadialBarLabelNodeDatum;
    readonly angleValue: any;
    readonly radiusValue: any;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly index: number;
}

export class RadialBarSeries extends _ModuleSupport.PolarSeries<RadialBarNodeDatum, _Scene.Sector> {
    static className = 'RadialBarSeries';
    static type = 'radial-bar' as const;

    protected override readonly NodeClickEvent = RadialBarSeriesNodeClickEvent;

    readonly label = new _Scene.Label<AgRadialSeriesLabelFormatterParams>();

    protected nodeData: RadialBarNodeDatum[] = [];

    tooltip = new _ModuleSupport.SeriesTooltip<AgRadialSeriesTooltipRendererParams>();

    @Validate(STRING)
    angleKey = '';

    @Validate(OPT_STRING)
    angleName?: string = undefined;

    @Validate(STRING)
    radiusKey: string = '';

    @Validate(OPT_STRING)
    radiusName?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    fill?: string = 'black';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = 'black';

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgRadialSeriesFormatterParams<any>) => AgRadialSeriesFormat = undefined;

    @Validate(NUMBER(-360, 360))
    rotation = 0;

    @Validate(NUMBER(0))
    strokeWidth = 1;

    @Validate(OPT_STRING)
    stackGroup?: string = undefined;

    @Validate(OPT_NUMBER())
    normalizedTo?: number;

    override readonly highlightStyle = new HighlightStyle();

    private groupScale = new BandScale<string>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            useLabelLayer: true,
            canHaveAxes: true,
            animationResetFns: {
                item: resetRadialBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    protected override nodeFactory(): _Scene.Sector {
        return new Sector();
    }

    override addChartEventListeners(): void {
        this.ctx.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        this.ctx.chartEventManager?.addListener('legend-item-double-click', (event) =>
            this.onLegendItemDoubleClick(event)
        );
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { axes, dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        if (direction === ChartAxisDirection.X) {
            const angleAxis = axes[ChartAxisDirection.X];
            const xExtent = dataModel.getDomain(this, 'angleValue-end', 'value', processedData);
            const fixedXExtent = [xExtent[0] > 0 ? 0 : xExtent[0], xExtent[1] < 0 ? 0 : xExtent[1]];
            return fixNumericExtent(fixedXExtent as any, angleAxis);
        } else {
            return dataModel.getDomain(this, 'radiusValue', 'key', processedData);
        }
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { data = [], visible } = this;
        const { angleKey, radiusKey } = this;

        if (!angleKey || !radiusKey) return;

        const stackGroupId = this.getStackId();
        const stackGroupTrailingId = `${stackGroupId}-trailing`;

        const normalizedToAbs = Math.abs(this.normalizedTo ?? NaN);
        const normaliseTo = normalizedToAbs && isFinite(normalizedToAbs) ? normalizedToAbs : undefined;
        const extraProps = [];
        if (normaliseTo) {
            extraProps.push(normaliseGroupTo(this, [stackGroupId, stackGroupTrailingId], normaliseTo, 'range'));
        }

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        if (animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation(this));
        }

        const visibleProps = this.visible || !animationEnabled ? {} : { forceValue: 0 };

        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(this, radiusKey, false, { id: 'radiusValue' }),
                valueProperty(this, angleKey, true, {
                    id: 'angleValue-raw',
                    invalidValue: null,
                    ...visibleProps,
                }),
                ...groupAccumulativeValueProperty(this, angleKey, true, 'normal', 'current', {
                    id: `angleValue-end`,
                    invalidValue: null,
                    groupId: stackGroupId,
                    ...visibleProps,
                }),
                ...groupAccumulativeValueProperty(this, angleKey, true, 'trailing', 'current', {
                    id: `angleValue-start`,
                    invalidValue: null,
                    groupId: stackGroupTrailingId,
                    ...visibleProps,
                }),
                ...extraProps,
            ],
            dataVisible: visible || animationEnabled,
        });

        this.animationState.transition('updateData');
    }

    protected circleCache = { r: 0, cx: 0, cy: 0 };

    protected didCircleChange() {
        const r = this.radius;
        const cx = this.centerX;
        const cy = this.centerY;
        const cache = this.circleCache;
        if (!(r === cache.r && cx === cache.cx && cy === cache.cy)) {
            this.circleCache = { r, cx, cy };
            return true;
        }
        return false;
    }

    protected async maybeRefreshNodeData() {
        const circleChanged = this.didCircleChange();
        if (!circleChanged && !this.nodeDataRefresh) return;
        const [{ nodeData = [] } = {}] = await this.createNodeData();
        this.nodeData = nodeData;
        this.nodeDataRefresh = false;
    }

    protected getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }

    async createNodeData() {
        const { processedData, dataModel, angleKey, radiusKey } = this;

        if (!processedData || !dataModel || !angleKey || !radiusKey) {
            return [];
        }

        const angleAxis = this.axes[ChartAxisDirection.X];
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        const angleScale = angleAxis?.scale;
        const radiusScale = radiusAxis?.scale;

        if (!angleScale || !radiusScale) {
            return [];
        }

        const angleStartIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-start`).index;
        const angleEndIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-end`).index;
        const angleRawIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-raw`).index;

        let groupPaddingInner = 0;
        if (radiusAxis instanceof RadiusCategoryAxis) {
            groupPaddingInner = radiusAxis.groupPaddingInner;
        }

        const { groupScale } = this;
        const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
        groupScale.range = [0, Math.abs(radiusScale.bandwidth ?? 0)];
        groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;

        const barWidth = groupScale.bandwidth >= 1 ? groupScale.bandwidth : groupScale.rawBandwidth;

        const axisInnerRadius = this.getAxisInnerRadius();
        const axisOuterRadius = this.radius;
        const axisTotalRadius = axisOuterRadius + axisInnerRadius;

        const getLabelNodeDatum = (
            datum: RadialColumnNodeDatum,
            angleDatum: number,
            x: number,
            y: number
        ): RadialBarLabelNodeDatum | undefined => {
            const labelText = this.getLabelText(
                this.label,
                {
                    value: angleDatum,
                    datum,
                    angleKey,
                    radiusKey,
                    angleName: this.angleName,
                    radiusName: this.radiusName,
                },
                (value) => (isNumber(value) ? value.toFixed(2) : String(value))
            );
            if (labelText) {
                return { x, y, text: labelText, textAlign: 'center', textBaseline: 'middle' };
            }
        };

        const nodeData = processedData.data.map((group, index): RadialBarNodeDatum => {
            const { datum, keys, values } = group;

            const radiusDatum = keys[0];
            const angleDatum = values[angleRawIndex];
            const angleStartDatum = values[angleStartIndex];
            const angleEndDatum = values[angleEndIndex];

            let startAngle = Math.max(angleScale.convert(angleStartDatum), angleScale.range[0]);
            let endAngle = Math.min(angleScale.convert(angleEndDatum), angleScale.range[1]);
            if (angleDatum < 0) {
                const tempAngle = startAngle;
                startAngle = endAngle;
                endAngle = tempAngle;
            }

            const dataRadius = axisTotalRadius - radiusScale.convert(radiusDatum);
            const innerRadius = dataRadius + groupScale.convert(String(groupIndex));
            const outerRadius = innerRadius + barWidth;
            const midRadius = (innerRadius + outerRadius) / 2;
            const midAngle = startAngle + angleBetween(startAngle, endAngle) / 2;
            const x = Math.cos(midAngle) * midRadius;
            const y = Math.sin(midAngle) * midRadius;
            const labelNodeDatum = this.label.enabled ? getLabelNodeDatum(datum, angleDatum, x, y) : undefined;

            return {
                series: this,
                datum,
                point: { x, y, size: 0 },
                midPoint: { x, y },
                label: labelNodeDatum,
                angleValue: angleDatum,
                radiusValue: radiusDatum,
                innerRadius,
                outerRadius,
                startAngle,
                endAngle,
                index,
            };
        });

        return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
    }

    async update({ seriesRect }: { seriesRect?: _Scene.BBox }) {
        const resize = this.checkResize(seriesRect);
        await this.maybeRefreshNodeData();

        this.contentGroup.translationX = this.centerX;
        this.contentGroup.translationY = this.centerY;
        this.highlightGroup.translationX = this.centerX;
        this.highlightGroup.translationY = this.centerY;
        if (this.labelGroup) {
            this.labelGroup.translationX = this.centerX;
            this.labelGroup.translationY = this.centerY;
        }

        this.updateSectorSelection(this.itemSelection, false);
        this.updateSectorSelection(this.highlightSelection, true);
        this.updateLabels();

        if (resize) {
            this.animationState.transition('resize');
        }
        this.animationState.transition('update');
    }

    protected updateSectorSelection(
        selection: _Scene.Selection<_Scene.Sector, RadialBarNodeDatum>,
        highlight: boolean
    ) {
        let selectionData: RadialBarNodeDatum[] = [];
        if (highlight) {
            const highlighted = this.ctx.highlightManager?.getActiveHighlight();
            if (highlighted?.datum && highlighted.series === this) {
                selectionData = [highlighted as RadialBarNodeDatum];
            }
        } else {
            selectionData = this.nodeData;
        }

        const highlightedStyle = highlight ? this.highlightStyle.item : undefined;
        const fill = highlightedStyle?.fill ?? this.fill;
        const fillOpacity = highlightedStyle?.fillOpacity ?? this.fillOpacity;
        const stroke = highlightedStyle?.stroke ?? this.stroke;
        const strokeOpacity = this.strokeOpacity;
        const strokeWidth = highlightedStyle?.strokeWidth ?? this.strokeWidth;

        const idFn = (datum: RadialBarNodeDatum) => datum.radiusValue;
        selection.update(selectionData, undefined, idFn).each((node, datum) => {
            const format = this.formatter
                ? this.ctx.callbackCache.call(this.formatter, {
                      datum,
                      fill,
                      stroke,
                      strokeWidth,
                      highlighted: highlight,
                      angleKey: this.angleKey,
                      radiusKey: this.radiusKey,
                      seriesId: this.id,
                  })
                : undefined;

            node.fill = format?.fill ?? fill;
            node.fillOpacity = format?.fillOpacity ?? fillOpacity;
            node.stroke = format?.stroke ?? stroke;
            node.strokeOpacity = strokeOpacity;
            node.strokeWidth = format?.strokeWidth ?? strokeWidth;
            node.lineDash = this.lineDash;
            node.lineJoin = 'round';
            node.inset = (format?.strokeWidth ?? strokeWidth) / 2;

            if (highlight) {
                node.startAngle = datum.startAngle;
                node.endAngle = datum.endAngle;
                node.innerRadius = datum.innerRadius;
                node.outerRadius = datum.outerRadius;
            }
        });
    }

    protected updateLabels() {
        const { label, labelSelection } = this;
        labelSelection.update(this.nodeData).each((node, datum) => {
            if (label.enabled && datum.label) {
                node.x = datum.label.x;
                node.y = datum.label.y;

                node.fill = label.color;

                node.fontFamily = label.fontFamily;
                node.fontSize = label.fontSize;
                node.fontStyle = label.fontStyle;
                node.fontWeight = label.fontWeight;
                node.text = datum.label.text;
                node.textAlign = datum.label.textAlign;
                node.textBaseline = datum.label.textBaseline;

                node.visible = true;
            } else {
                node.visible = false;
            }
        });
    }

    protected override animateEmptyUpdateReady() {
        const { labelSelection } = this;

        const fns = prepareRadialBarSeriesAnimationFunctions(this.axes);
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [this.itemSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, [labelSelection]);
    }

    override animateClearingUpdateEmpty() {
        const { itemSelection } = this;
        const { animationManager } = this.ctx;

        const fns = prepareRadialBarSeriesAnimationFunctions(this.axes);
        motion.fromToMotion(this.id, 'datums', animationManager, [itemSelection], fns);

        seriesLabelFadeOutAnimation(this, 'labels', animationManager, [this.labelSelection]);
    }

    getTooltipHtml(nodeDatum: RadialBarNodeDatum): string {
        const {
            id: seriesId,
            axes,
            angleKey,
            angleName,
            radiusKey,
            radiusName,
            fill,
            formatter,
            stroke,
            strokeWidth,
            tooltip,
            dataModel,
        } = this;
        const { angleValue, radiusValue, datum } = nodeDatum;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(angleKey && radiusKey) || !(xAxis && yAxis && isNumber(angleValue)) || !dataModel) {
            return '';
        }

        const angleString = xAxis.formatDatum(angleValue);
        const radiusString = yAxis.formatDatum(radiusValue);
        const title = sanitizeHtml(angleName);
        const content = sanitizeHtml(`${radiusString}: ${angleString}`);

        const { fill: color } = (formatter &&
            this.ctx.callbackCache.call(formatter, {
                datum,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                angleKey,
                radiusKey,
                seriesId,
            })) ?? { fill };

        return tooltip.toTooltipHtml(
            { title, backgroundColor: fill, content },
            { seriesId, datum, color, title, angleKey, radiusKey, angleName, radiusName }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, data, angleKey, angleName, radiusKey, visible } = this;

        if (!(data?.length && angleKey && radiusKey && legendType === 'category')) {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: angleKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: angleName ?? angleKey,
                },
                marker: {
                    fill: this.fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: this.stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: this.fillOpacity ?? 1,
                    strokeOpacity: this.strokeOpacity ?? 1,
                    strokeWidth: this.strokeWidth,
                },
            },
        ];
    }

    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent) {
        const { enabled, itemId, series } = event;

        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }

    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent) {
        const { enabled, itemId, series, numVisibleItems } = event;

        const totalVisibleItems = Object.values(numVisibleItems).reduce((p, v) => p + v, 0);

        const wasClicked = series.id === this.id;
        const newEnabled = wasClicked || (enabled && totalVisibleItems === 1);

        this.toggleSeriesItem(itemId, newEnabled);
    }

    override computeLabelsBBox() {
        return null;
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `radialBar-stack-${groupIndex}-xValues`;
    }
}
