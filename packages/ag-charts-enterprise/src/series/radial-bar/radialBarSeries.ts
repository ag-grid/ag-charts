import {
    type AgRadialBarSeriesOptions,
    type AgRadialSeriesLabelFormatterParams,
    type AgRadialSeriesStyle,
    type TextOrSegments,
    _ModuleSupport,
} from 'ag-charts-community';
import { type Point, angleBetween, isDefined, isGradientFill } from 'ag-charts-core';

import { RadiusCategoryAxis } from '../../axes/radius-category/radiusCategoryAxis';
import { readDatum } from '../../utils/datum';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { getItemStyle, getStyle } from '../util/radialUtil';
import { RadialBarSeriesProperties } from './radialBarSeriesProperties';
import { prepareRadialBarSeriesAnimationFunctions, resetRadialBarSelectionsFn } from './radialBarUtil';

const {
    DEFAULT_POLAR_DIRECTION_KEYS,
    DEFAULT_POLAR_DIRECTION_NAMES,
    ChartAxisDirection,
    PolarAxis,
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
    createDatumId,
    CategoryScale,
    Sector,
    SectorBox,
    motion,
    updateLabelNode,
    getItemStyles,
} = _ModuleSupport;

class RadialBarSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RadialBarNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: RadialBarNodeDatum, series: RadialBarSeries) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
    }
}

interface RadialBarLabelNodeDatum {
    text: TextOrSegments;
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

interface RadialBarNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly label?: RadialBarLabelNodeDatum;
    readonly angleValue: any;
    readonly radiusValue: any;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly clipSector: _ModuleSupport.SectorBox;
    readonly reversed: boolean;
    readonly index: number;
    style?: Required<AgRadialSeriesStyle>;
}

export interface RadialBarSeriesNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<RadialBarNodeDatum, RadialBarNodeDatum> {
    styles: _ModuleSupport.SeriesNodeStyleContext<Required<AgRadialSeriesStyle>>;
}

export class RadialBarSeries extends _ModuleSupport.PolarSeries<
    RadialBarNodeDatum,
    AgRadialBarSeriesOptions,
    RadialBarSeriesProperties<AgRadialBarSeriesOptions>,
    _ModuleSupport.Sector,
    RadialBarNodeDatum,
    RadialBarSeriesNodeDataContext
> {
    static readonly className = 'RadialBarSeries';
    static readonly type = 'radial-bar' as const;

    override properties = new RadialBarSeriesProperties();

    protected override readonly NodeEvent = RadialBarSeriesNodeEvent;

    private readonly groupScale = new CategoryScale<string>();

    private contextNodeData?: RadialBarSeriesNodeDataContext;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            categoryKey: 'radiusValue',
            propertyKeys: DEFAULT_POLAR_DIRECTION_KEYS,
            propertyNames: DEFAULT_POLAR_DIRECTION_NAMES,
            canHaveAxes: true,
            animationResetFns: {
                item: resetRadialBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    protected override nodeFactory(): _ModuleSupport.Sector {
        return new Sector();
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        if (direction === ChartAxisDirection.Angle) {
            const xExtent = dataModel.getDomain(this, 'angleValue-end', 'value', processedData);
            const fixedXExtent = [Math.min(xExtent[0], 0), Math.max(xExtent[1], 0)];
            return fixNumericExtent(fixedXExtent);
        } else {
            return dataModel.getDomain(this, 'radiusValue', 'key', processedData);
        }
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { angleKey, radiusKey, normalizedTo } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const stackGroupId = this.getStackId();
        const stackGroupTrailingId = `${stackGroupId}-trailing`;

        const extraProps = [];

        if (isDefined(normalizedTo)) {
            extraProps.push(normaliseGroupTo([stackGroupId, stackGroupTrailingId], Math.abs(normalizedTo)));
        }

        if (this.needsDataModelDiff() && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const visibleProps = this.visible ? {} : { forceValue: 0 };

        const radiusScaleType = this.axes[ChartAxisDirection.Radius]?.scale.type;
        const angleScaleType = this.axes[ChartAxisDirection.Angle]?.scale.type;

        await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(radiusKey, radiusScaleType, { id: 'radiusValue' }),
                valueProperty(angleKey, angleScaleType, {
                    id: 'angleValue-raw',
                    invalidValue: null,
                    ...visibleProps,
                }),
                ...groupAccumulativeValueProperty(
                    angleKey,
                    'normal',
                    {
                        id: `angleValue-end`,
                        rangeId: `angleValue-range`,
                        invalidValue: null,
                        groupId: stackGroupId,
                        separateNegative: true,
                        ...visibleProps,
                    },
                    angleScaleType
                ),
                ...groupAccumulativeValueProperty(
                    angleKey,
                    'trailing',
                    {
                        id: `angleValue-start`,
                        invalidValue: null,
                        groupId: stackGroupTrailingId,
                        separateNegative: true,
                        ...visibleProps,
                    },
                    angleScaleType
                ),
                ...extraProps,
            ],
            groupByKeys: true,
            groupByData: false,
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

    protected maybeRefreshNodeData() {
        const circleChanged = this.didCircleChange();
        if (!circleChanged && !this.nodeDataRefresh) return;
        this.contextNodeData = this.createNodeData();
        this.nodeData = this.contextNodeData?.nodeData ?? [];
        this.nodeDataRefresh = false;
    }

    protected getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection.Radius];
        return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }

    override createNodeData() {
        const { processedData, dataModel } = this;

        if (!dataModel || !processedData || processedData.type !== 'grouped') return;

        const angleAxis = this.axes[ChartAxisDirection.Angle];
        const radiusAxis = this.axes[ChartAxisDirection.Radius];
        const angleScale = angleAxis?.scale;
        const radiusScale = radiusAxis?.scale;

        if (!angleScale || !radiusScale) {
            return;
        }

        const radiusValues = dataModel.resolveKeysById<number>(this, 'radiusValue', processedData);
        const angleStartValues = dataModel.resolveColumnById(this, `angleValue-start`, processedData);
        const angleEndValues = dataModel.resolveColumnById(this, `angleValue-end`, processedData);
        const angleRawValues = dataModel.resolveColumnById(this, `angleValue-raw`, processedData);

        const angleRangeIndex = dataModel.resolveProcessedDataIndexById(this, `angleValue-range`);

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

        const angleAxisReversed = angleAxis.isReversed();
        const radiusAxisReversed = radiusAxis.isReversed();

        const axisInnerRadius = radiusAxisReversed ? this.radius : this.getAxisInnerRadius();
        const axisOuterRadius = radiusAxisReversed ? this.getAxisInnerRadius() : this.radius;
        const axisTotalRadius = axisOuterRadius + axisInnerRadius;

        const angleDomain = this.getSeriesDomain(ChartAxisDirection.Angle);

        const { angleKey, radiusKey, angleName, radiusName, legendItemName, label } = this.properties;

        const getLabelNodeDatum = (
            datum: RadialColumnNodeDatum,
            angleDatum: number,
            x: number,
            y: number
        ): RadialBarLabelNodeDatum | undefined => {
            const labelText = this.getLabelText<AgRadialSeriesLabelFormatterParams>(
                angleDatum,
                datum,
                angleKey,
                'angle',
                angleDomain,
                label,
                { value: angleDatum, datum, angleKey, radiusKey, angleName, radiusName, legendItemName }
            );
            if (labelText) {
                return { x, y, text: labelText, textAlign: 'center', textBaseline: 'middle' };
            }
        };

        const nodeData: RadialBarNodeDatum[] = [];
        const styles = getItemStyles((nodeDatum: RadialBarNodeDatum | undefined, isHighlight, highlightState) =>
            getItemStyle(this, nodeDatum, isHighlight, highlightState)
        );
        const context = {
            itemId: radiusKey,
            nodeData,
            labelData: nodeData,
            styles,
        };
        if (!this.visible) return context;

        const { dataSources } = processedData;
        const rawData = dataSources.get(this.id)?.data ?? [];
        for (const { datumIndex, group } of dataModel.forEachGroupDatum(this, processedData)) {
            const datum = rawData[datumIndex];
            const radiusDatum = radiusValues[datumIndex];
            if (radiusDatum == null) return;

            const angleDatum = angleRawValues[datumIndex];
            const angleStartDatum = angleStartValues[datumIndex];
            const angleEndDatum = angleEndValues[datumIndex];
            const isPositive = angleDatum >= 0 && !Object.is(angleDatum, -0);
            const angleRange = group.aggregation[angleRangeIndex][isPositive ? 1 : 0];
            const reversed = isPositive === angleAxisReversed;

            let startAngle = angleScale.convert(angleStartDatum, { clamp: true });
            let endAngle = angleScale.convert(angleEndDatum, { clamp: true });

            let rangeStartAngle = angleScale.convert(0, { clamp: true });
            let rangeEndAngle = angleScale.convert(angleRange, { clamp: true });

            if (reversed) {
                [rangeStartAngle, rangeEndAngle] = [rangeEndAngle, rangeStartAngle];
                [startAngle, endAngle] = [endAngle, startAngle];
            }

            const dataRadius = axisTotalRadius - radiusScale.convert(radiusDatum);
            const innerRadius = dataRadius + groupScale.convert(String(groupIndex));
            const outerRadius = innerRadius + barWidth;
            const midRadius = (innerRadius + outerRadius) / 2;
            const midAngle = startAngle + angleBetween(startAngle, endAngle) / 2;
            const x = Math.cos(midAngle) * midRadius;
            const y = Math.sin(midAngle) * midRadius;
            const labelNodeDatum = this.properties.label.enabled
                ? getLabelNodeDatum(datum as any, angleDatum, x, y)
                : undefined;

            const clipSector = new SectorBox(startAngle, endAngle, innerRadius, outerRadius);

            nodeData.push({
                series: this,
                datum,
                datumIndex,
                point: { x, y, size: 0 },
                midPoint: { x, y },
                label: labelNodeDatum,
                angleValue: angleDatum,
                radiusValue: radiusDatum,
                innerRadius,
                outerRadius,
                startAngle: rangeStartAngle,
                endAngle: rangeEndAngle,
                clipSector,
                reversed,
                index: datumIndex,
            });
        }

        return context;
    }

    update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }) {
        const resize = this.checkResize(seriesRect);
        this.maybeRefreshNodeData();

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
        selection: _ModuleSupport.Selection<_ModuleSupport.Sector, RadialBarNodeDatum>,
        isHighlight: boolean
    ) {
        let selectionData: RadialBarNodeDatum[] = [];
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        if (isHighlight) {
            if (activeHighlight?.datum && activeHighlight.series === this) {
                selectionData.push(activeHighlight as RadialBarNodeDatum);
            }
        } else {
            selectionData = this.nodeData;
        }

        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const fillBBox = this.getShapeFillBBox();
        const hasItemStylers = this.hasItemStylers();

        selection
            .update(selectionData, undefined, (datum) => this.getDatumId(datum))
            .each((node, nodeDatum) => {
                const datum = readDatum(nodeDatum);
                if (datum == null) return;

                if (hasItemStylers) {
                    const highlightState = this.getHighlightState(activeHighlight, isHighlight, nodeDatum.datumIndex);
                    nodeDatum.style = getItemStyle(this, nodeDatum, isHighlight, highlightState);
                }

                const style =
                    nodeDatum.style ??
                    contextNodeData.styles[this.getHighlightState(highlightedDatum, isHighlight, nodeDatum.datumIndex)];

                const cornerRadius = style.cornerRadius;

                const fill = style.fill;
                const fillParams: _ModuleSupport.GradientParams | undefined =
                    isGradientFill(fill) && fill.bounds !== 'item' ? { centerX: 0, centerY: 0 } : undefined;

                node.setStyleProperties(style, fillBBox, fillParams);

                node.lineJoin = 'round';
                node.inset = node.stroke == null ? 0 : node.strokeWidth / 2;

                node.startInnerCornerRadius = datum.reversed ? cornerRadius : 0;
                node.startOuterCornerRadius = datum.reversed ? cornerRadius : 0;
                node.endInnerCornerRadius = datum.reversed ? 0 : cornerRadius;
                node.endOuterCornerRadius = datum.reversed ? 0 : cornerRadius;

                if (isHighlight) {
                    node.startAngle = nodeDatum.startAngle;
                    node.endAngle = nodeDatum.endAngle;
                    node.clipSector = nodeDatum.clipSector;
                    node.innerRadius = nodeDatum.innerRadius;
                    node.outerRadius = nodeDatum.outerRadius;
                }
            });
    }

    protected updateLabels() {
        const { properties } = this;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightDatum =
            activeHighlight?.series === this && activeHighlight?.datum
                ? (activeHighlight as RadialBarNodeDatum)
                : undefined;
        const highlightData = highlightDatum ? [highlightDatum] : [];

        this.labelSelection.update(this.nodeData).each((node, datum) => {
            const isHighlight = false;
            updateLabelNode(this, node, properties, properties.label, datum.label, isHighlight, activeHighlight);
            node.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
        });

        this.highlightLabelSelection
            .update(highlightData, undefined, (datum) => this.getDatumId(datum))
            .each((node, datum) => {
                const isHighlight = true;
                updateLabelNode(this, node, properties, properties.label, datum.label, isHighlight, activeHighlight);
                node.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
            });
    }

    private getBarTransitionFunctions() {
        const angleScale = this.axes[ChartAxisDirection.Angle]?.scale;
        let axisZeroAngle = 0;
        if (!angleScale) {
            return prepareRadialBarSeriesAnimationFunctions(axisZeroAngle);
        }

        const d0 = Math.min(angleScale.domain[0], angleScale.domain[1]);
        const d1 = Math.max(angleScale.domain[0], angleScale.domain[1]);
        if (d0 <= 0 && d1 >= 0) {
            axisZeroAngle = angleScale.convert(0);
        }

        return prepareRadialBarSeriesAnimationFunctions(axisZeroAngle);
    }

    protected override animateEmptyUpdateReady() {
        const { labelSelection } = this;

        const fns = this.getBarTransitionFunctions();
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [this.itemSelection], fns);
        seriesLabelFadeInAnimation(
            this,
            'labels',
            this.ctx.animationManager,
            labelSelection,
            this.highlightLabelSelection
        );
    }

    override animateClearingUpdateEmpty() {
        const { itemSelection } = this;
        const { animationManager } = this.ctx;

        const fns = this.getBarTransitionFunctions();
        motion.fromToMotion(this.id, 'datums', animationManager, [itemSelection], fns);

        seriesLabelFadeOutAnimation(
            this,
            'labels',
            animationManager,
            this.labelSelection,
            this.highlightLabelSelection
        );
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { angleKey, angleName, radiusKey, radiusName, legendItemName, tooltip } = properties;
        const angleAxis = axes[ChartAxisDirection.Angle];
        const radiusAxis = axes[ChartAxisDirection.Radius];
        const nodeDatum = this.nodeData?.[datumIndex];

        if (!dataModel || !processedData || !angleAxis || !radiusAxis || !nodeDatum) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const radiusValue = dataModel.resolveKeysById(this, `radiusValue`, processedData)[datumIndex];
        const angleValue = dataModel.resolveColumnById(this, `angleValue-raw`, processedData)[datumIndex];

        if (radiusValue == null) return;

        const format = getItemStyle(this, nodeDatum, false);

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(radiusAxis, 'tooltip', radiusValue, datum, radiusKey, undefined),
                symbol: this.legendItemSymbol(),
                data: [
                    {
                        label: angleName,
                        fallbackLabel: angleKey,
                        value: this.getAxisValueText(angleAxis, 'tooltip', angleValue, datum, angleKey, undefined),
                        missing: _ModuleSupport.isTooltipValueMissing(angleValue),
                    },
                ],
            },
            {
                seriesId,
                datum,
                title: angleName,
                angleKey,
                angleName,
                radiusKey,
                radiusName,
                legendItemName,
                ...format,
            }
        );
    }

    protected override pickNodeClosestDatum(point: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        return this.pickNodeNearestDistantObject(point, this.itemSelection.nodes());
    }

    private legendItemSymbol() {
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = getStyle(
            this,
            false,
            _ModuleSupport.HighlightState.None
        );

        const markerStyle = {
            fill: fill ?? 'rgba(0, 0, 0, 0)',
            stroke: stroke ?? 'rgba(0, 0, 0, 0)',
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
        };

        if (isGradientFill(markerStyle.fill)) {
            markerStyle.fill = { ...markerStyle.fill, gradient: 'linear', rotation: 0, reverse: false };
        }

        return {
            marker: markerStyle,
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const { id: seriesId, visible } = this;

        const { angleKey, angleName, legendItemName, showInLegend } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId: angleKey,
                seriesId,
                enabled: visible,
                label: {
                    text: legendItemName ?? angleName ?? angleKey,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    getDatumId(datum: RadialBarNodeDatum) {
        return createDatumId(datum.radiusValue);
    }

    override computeLabelsBBox() {
        return null;
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `radialBar-stack-${groupIndex}-xValues`;
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.itemStyler != null ||
            this.properties.styler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
