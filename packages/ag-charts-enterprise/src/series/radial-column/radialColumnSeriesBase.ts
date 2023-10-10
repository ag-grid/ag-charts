import type {
    AgRadialSeriesFormat,
    AgRadialSeriesFormatterParams,
    AgRadialSeriesLabelFormatterParams,
    AgRadialSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { AngleCategoryAxis } from '../../axes/angle-category/angleCategoryAxis';
import type { RadialColumnShape } from './radialColumnShape';

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
    fixNumericExtent,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    resetLabelFn,
    seriesLabelFadeInAnimation,
    seriesLabelFadeOutAnimation,
    valueProperty,
} = _ModuleSupport;

const { BandScale } = _Scale;
const { motion } = _Scene;
const { isNumber, normalizeAngle360, sanitizeHtml } = _Util;

class RadialColumnSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeClickEvent<RadialColumnNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(
        type: TEvent,
        nativeEvent: MouseEvent,
        datum: RadialColumnNodeDatum,
        series: RadialColumnSeriesBase<any>
    ) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.radiusKey = series.radiusKey;
    }
}

interface RadialColumnLabelNodeDatum {
    text: string;
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

export interface RadialColumnNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: RadialColumnLabelNodeDatum;
    readonly angleValue: any;
    readonly radiusValue: any;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly axisInnerRadius: number;
    readonly axisOuterRadius: number;
    readonly columnWidth: number;
    readonly index: number;
}

export abstract class RadialColumnSeriesBase<ItemPathType extends _Scene.Sector | RadialColumnShape> extends _ModuleSupport.PolarSeries<
    RadialColumnNodeDatum,
    ItemPathType
> {
    protected override readonly NodeClickEvent = RadialColumnSeriesNodeClickEvent;

    readonly label = new _Scene.Label<AgRadialSeriesLabelFormatterParams>();

    protected nodeData: RadialColumnNodeDatum[] = [];

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

    constructor(
        moduleCtx: _ModuleSupport.ModuleContext,
        {
            animationResetFns,
        }: {
            animationResetFns?: {
                item?: (
                    node: ItemPathType,
                    datum: RadialColumnNodeDatum
                ) => _ModuleSupport.AnimationValue & Partial<ItemPathType>;
            };
        }
    ) {
        super({
            moduleCtx,
            useLabelLayer: true,
            canHaveAxes: true,
            animationResetFns: {
                ...animationResetFns,
                label: resetLabelFn,
            },
        });
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
            return dataModel.getDomain(this, 'angleValue', 'key', processedData);
        } else {
            const radiusAxis = axes[ChartAxisDirection.Y];
            const yExtent = dataModel.getDomain(this, 'radiusValue-end', 'value', processedData);
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return fixNumericExtent(fixedYExtent as any, radiusAxis);
        }
    }

    protected abstract getStackId(): string;

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

        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(this, angleKey, false, { id: 'angleValue' }),
                valueProperty(this, radiusKey, true, { id: 'radiusValue-raw', invalidValue: undefined }),
                ...groupAccumulativeValueProperty(this, radiusKey, true, 'window', 'current', {
                    id: `radiusValue-end`,
                    invalidValue: null,
                    groupId: stackGroupId,
                }),
                ...groupAccumulativeValueProperty(this, radiusKey, true, 'window-trailing', 'current', {
                    id: `radiusValue-start`,
                    invalidValue: null,
                    groupId: stackGroupTrailingId,
                }),
                ...extraProps,
            ],
            dataVisible: visible,
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

    async maybeRefreshNodeData() {
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

        const radiusStartIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-start`).index;
        const radiusEndIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-end`).index;
        const radiusRawIndex = dataModel.resolveProcessedDataIndexById(this, `radiusValue-raw`).index;

        const { label, id: seriesId } = this;

        let groupPaddingInner = 0;
        let groupPaddingOuter = 0;
        if (angleAxis instanceof AngleCategoryAxis) {
            groupPaddingInner = angleAxis.groupPaddingInner;
            groupPaddingOuter = angleAxis.paddingInner;
        }

        const groupAngleStep = angleScale.bandwidth ?? 0;
        const paddedGroupAngleStep = groupAngleStep * (1 - groupPaddingOuter);

        const { groupScale } = this;
        const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
        groupScale.range = [-paddedGroupAngleStep / 2, paddedGroupAngleStep / 2];
        groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;

        const axisInnerRadius = this.getAxisInnerRadius();
        const axisOuterRadius = this.radius;
        const axisTotalRadius = axisOuterRadius + axisInnerRadius;

        const getLabelNodeDatum = (
            datum: RadialColumnNodeDatum,
            radiusDatum: number,
            x: number,
            y: number
        ): RadialColumnLabelNodeDatum | undefined => {
            let labelText = '';
            if (label.formatter) {
                labelText = label.formatter({
                    value: radiusDatum,
                    datum,
                    seriesId,
                    angleKey,
                    radiusKey,
                    angleName: this.angleName,
                    radiusName: this.radiusName,
                });
            } else if (typeof radiusDatum === 'number' && isFinite(radiusDatum)) {
                labelText = radiusDatum.toFixed(2);
            } else if (radiusDatum) {
                labelText = String(radiusDatum);
            }
            if (labelText) {
                const labelX = x;
                const labelY = y;
                return {
                    text: labelText,
                    x: labelX,
                    y: labelY,
                    textAlign: 'center',
                    textBaseline: 'middle',
                };
            }
        };

        const nodeData = processedData.data.map((group, index): RadialColumnNodeDatum => {
            const { datum, keys, values } = group;

            const angleDatum = keys[0];
            const radiusDatum = values[radiusRawIndex];
            const innerRadiusDatum = values[radiusStartIndex];
            const outerRadiusDatum = values[radiusEndIndex];

            const groupAngle = angleScale.convert(angleDatum);
            const startAngle = normalizeAngle360(groupAngle + groupScale.convert(String(groupIndex)));
            const endAngle = normalizeAngle360(startAngle + groupScale.bandwidth);
            const angle = startAngle + groupScale.bandwidth / 2;

            const innerRadius = axisTotalRadius - radiusScale.convert(innerRadiusDatum);
            const outerRadius = axisTotalRadius - radiusScale.convert(outerRadiusDatum);
            const midRadius = (innerRadius + outerRadius) / 2;

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const x = cos * midRadius;
            const y = sin * midRadius;

            const labelNodeDatum = label.enabled ? getLabelNodeDatum(datum, radiusDatum, x, y) : undefined;

            const columnWidth = this.getColumnWidth(startAngle, endAngle);

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
                axisInnerRadius,
                axisOuterRadius,
                columnWidth,
                index,
            };
        });

        return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
    }

    protected getColumnWidth(_startAngle: number, _endAngle: number) {
        return NaN;
    }

    async update() {
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

        this.animationState.transition('update');
    }

    protected abstract updateItemPath(node: ItemPathType, datum: RadialColumnNodeDatum): void;

    protected updateSectorSelection(
        selection: _Scene.Selection<ItemPathType, RadialColumnNodeDatum>,
        highlight: boolean
    ) {
        let selectionData: RadialColumnNodeDatum[] = [];
        if (highlight) {
            const highlighted = this.ctx.highlightManager?.getActiveHighlight();
            if (highlighted?.datum && highlighted.series === this) {
                selectionData = [highlighted as RadialColumnNodeDatum];
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
        selection.update(selectionData).each((node, datum) => {
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

            this.updateItemPath(node, datum);
            node.fill = format?.fill ?? fill;
            node.fillOpacity = format?.fillOpacity ?? fillOpacity;
            node.stroke = format?.stroke ?? stroke;
            node.strokeOpacity = strokeOpacity;
            node.strokeWidth = format?.strokeWidth ?? strokeWidth;
            node.lineDash = this.lineDash;
            node.lineJoin = 'round';
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

    protected abstract getColumnTransitionFunctions(): {
        fromFn: _Scene.FromToMotionPropFn<any, any, any>;
        toFn: _Scene.FromToMotionPropFn<any, any, any>;
    };

    protected override animateEmptyUpdateReady() {
        const { labelSelection } = this;

        const fns = this.getColumnTransitionFunctions();
        motion.fromToMotion(
            `${this.id}_empty-update-ready`,
            this.ctx.animationManager,
            [this.itemSelection],
            fns
        );
        seriesLabelFadeInAnimation(this, this.ctx.animationManager, [labelSelection]);
    }

    override animateWaitingUpdateReady() {
        const { itemSelection, labelSelection, processedData } = this;
        const { animationManager } = this.ctx;
        const diff = processedData?.reduced?.diff;

        if (!diff?.changed) {
            this.resetAllAnimation();
            return;
        }

        const fns = this.getColumnTransitionFunctions();
        motion.fromToMotion(
            `${this.id}_waiting-update-ready`,
            animationManager,
            [itemSelection],
            fns,
            (_, datum) => String(datum.radiusValue),
            diff
        );

        seriesLabelFadeInAnimation(this, this.ctx.animationManager, [labelSelection]);
    }

    override animateClearingUpdateEmpty() {
        const { itemSelection } = this;
        const { animationManager } = this.ctx;

        const fns = this.getColumnTransitionFunctions();
        motion.fromToMotion(`${this.id}_clearing-update-empty`, animationManager, [itemSelection], fns);

        seriesLabelFadeOutAnimation(this, animationManager, [this.labelSelection]);
    }

    getTooltipHtml(nodeDatum: RadialColumnNodeDatum): string {
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

        if (!(angleKey && radiusKey) || !(xAxis && yAxis && isNumber(radiusValue)) || !dataModel) {
            return '';
        }

        const angleString = xAxis.formatDatum(angleValue);
        const radiusString = yAxis.formatDatum(radiusValue);
        const title = sanitizeHtml(radiusName);
        const content = sanitizeHtml(`${angleString}: ${radiusString}`);

        const { fill: color } = (formatter &&
            this.ctx.callbackCache.call(formatter, {
                seriesId,
                datum,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                angleKey,
                radiusKey,
            })) ?? { fill };

        return tooltip.toTooltipHtml(
            { title, backgroundColor: fill, content },
            { seriesId, datum, color, title, angleKey, radiusKey, angleName, radiusName }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, data, angleKey, radiusKey, radiusName, visible } = this;

        if (!(data?.length && angleKey && radiusKey && legendType === 'category')) {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: radiusKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: radiusName ?? radiusKey,
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
}
