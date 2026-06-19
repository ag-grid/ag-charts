import type {
    AgBaseRadialColumnSeriesOptions,
    AgRadialSeriesLabelFormatterParams,
    AgRadialSeriesStyle,
    SelectionState,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    ChartAxisDirection,
    type DomainWithMetadata,
    type DynamicContext,
    type FillStrokeMorph,
    type Normalised,
    type NormalisedTextOrSegments,
    type Point,
    isDefined,
    isGradientFill,
    maxValue,
    minValue,
    normalizeAngle360,
    zeroLike,
} from 'ag-charts-core';
import type { AgNumericValue, CssColor } from 'ag-charts-types';

import { AngleCategoryAxis } from '../../axes/angle-category/angleCategoryAxis';
import { type RadialSeriesStyleResult, getItemStyle, getStyle } from '../util/radialUtil';
import type { RadialColumnSeriesBaseProperties } from './radialColumnSeriesBaseProperties';

const {
    DEFAULT_POLAR_DIRECTION_KEYS,
    DEFAULT_POLAR_DIRECTION_NAMES,
    PolarAxis,
    diff,
    fixNumericExtent,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    resetLabelFn,
    seriesLabelFadeInAnimation,
    seriesLabelFadeOutAnimation,
    valueProperty,
    animationValidation,
    createDatumId,
    SeriesNodePickMode,
    CategoryScale,
    motion,
    updateLabelNode,
    getItemStyles,
} = _ModuleSupport;

type NormalisedRadialSeriesStyle = Normalised<AgRadialSeriesStyle, never, FillStrokeMorph>;

class RadialColumnSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RadialColumnNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(
        type: TEvent,
        nativeEvent: Event,
        datum: RadialColumnNodeDatum,
        series: RadialColumnSeriesBase<any>,
        selectionState: SelectionState | undefined
    ) {
        super(type, nativeEvent, datum, series, selectionState);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
    }
}

interface RadialColumnLabelNodeDatum {
    x: number;
    y: number;
    text: NormalisedTextOrSegments;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

export interface RadialColumnNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    readonly label?: RadialColumnLabelNodeDatum;
    readonly angleValue: any;
    readonly radiusValue: any;
    readonly negative: boolean;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly stackInnerRadius: number;
    readonly stackOuterRadius: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly midAngle: number;
    readonly axisInnerRadius: number;
    readonly axisOuterRadius: number;
    readonly columnWidth: number;
    readonly index: number;
    style?: AgRadialSeriesStyle;
}

interface RadialColumnSeriesNodeDataContext extends _ModuleSupport.DataModelSeriesNodeDataContext<
    RadialColumnNodeDatum,
    RadialColumnNodeDatum
> {
    styles: _ModuleSupport.SeriesNodeStyleContext<AgRadialSeriesStyle>;
}

export abstract class RadialColumnSeriesBase<
    ItemPathType extends
        | _ModuleSupport.Sector<RadialColumnNodeDatum>
        | _ModuleSupport.RadialColumnShape<RadialColumnNodeDatum>,
> extends _ModuleSupport.PolarSeries<
    RadialColumnNodeDatum,
    AgBaseRadialColumnSeriesOptions,
    RadialColumnSeriesBaseProperties<AgBaseRadialColumnSeriesOptions>,
    ItemPathType,
    RadialColumnNodeDatum,
    RadialColumnSeriesNodeDataContext
> {
    protected override readonly NodeEvent = RadialColumnSeriesNodeEvent;

    private readonly groupScale = new CategoryScale<string>();

    public contextNodeData?: RadialColumnSeriesNodeDataContext;

    constructor(
        moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>,
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
            categoryKey: 'angleValue',
            propertyKeys: DEFAULT_POLAR_DIRECTION_KEYS,
            propertyNames: DEFAULT_POLAR_DIRECTION_NAMES,
            canHaveAxes: true,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            animationResetFns: {
                ...animationResetFns,
                label: resetLabelFn,
            },
        });
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return { domain: [] };

        if (direction === ChartAxisDirection.Angle) {
            return dataModel.getDomain(this, 'angleValue', 'key', processedData);
        } else {
            const yExtent = dataModel.getDomain(this, 'radiusValue-end', 'value', processedData).domain;
            // minValue/maxValue (not Math.min/max, which throw on bigint) keep an exact bigint extent, and
            // zeroLike keeps the baseline the same type so fixNumericExtent never sees a mixed extent.
            const fixedYExtent = [
                minValue(yExtent[0], zeroLike(yExtent[0])),
                maxValue(yExtent[1], zeroLike(yExtent[1])),
            ];
            return { domain: fixNumericExtent(fixedYExtent) };
        }
    }

    protected abstract getStackId(): string;

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
        const allowNullKey = this.properties.allowNullKeys ?? false;

        await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(angleKey, angleScaleType, { id: 'angleValue', allowNullKey }),
                valueProperty(radiusKey, radiusScaleType, {
                    id: 'radiusValue-raw',
                    invalidValue: null,
                    ...visibleProps,
                }),
                ...groupAccumulativeValueProperty(
                    radiusKey,
                    'normal',
                    {
                        id: `radiusValue-end`,
                        rangeId: `radiusValue-range`,
                        invalidValue: null,
                        groupId: stackGroupId,
                        separateNegative: true,
                        ...visibleProps,
                    },
                    radiusScaleType
                ),
                ...groupAccumulativeValueProperty(
                    radiusKey,
                    'trailing',
                    {
                        id: `radiusValue-start`,
                        invalidValue: null,
                        groupId: stackGroupTrailingId,
                        separateNegative: true,
                        ...visibleProps,
                    },
                    radiusScaleType
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
        if (r !== cache.r || cx !== cache.cx || cy !== cache.cy) {
            this.circleCache = { r, cx, cy };
            return true;
        }
        return false;
    }

    protected isRadiusAxisReversed() {
        return this.axes[ChartAxisDirection.Radius]?.isReversed();
    }

    maybeRefreshNodeData() {
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
        const { processedData, dataModel, groupScale } = this;

        if (!dataModel || processedData?.type !== 'grouped') return;

        const angleAxis = this.axes[ChartAxisDirection.Angle];
        const radiusAxis = this.axes[ChartAxisDirection.Radius];
        const angleScale = angleAxis?.scale;
        const radiusScale = radiusAxis?.scale;

        if (!angleScale || !radiusScale) {
            return;
        }

        const angleValues = dataModel.resolveKeysById(this, `angleValue`, processedData);
        const radiusStartValues = dataModel.resolveColumnById(
            this,
            `radiusValue-start`,
            processedData,
            'mixed-numeric'
        );
        const radiusEndValues = dataModel.resolveColumnById(this, `radiusValue-end`, processedData, 'mixed-numeric');
        const radiusRawValues = dataModel.resolveColumnById(this, `radiusValue-raw`, processedData, 'mixed-numeric');

        let groupPaddingInner = 0;
        let groupPaddingOuter = 0;
        if (angleAxis instanceof AngleCategoryAxis) {
            groupPaddingInner = angleAxis.options.groupPaddingInner;
            groupPaddingOuter = angleAxis.options.paddingInner;
        }

        const groupAngleStep = angleScale.bandwidth ?? 0;
        const paddedGroupAngleStep = groupAngleStep * (1 - groupPaddingOuter);

        const { index: groupIndex, visibleGroupCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);
        groupScale.domain = Array.from({ length: visibleGroupCount }).map((_, i) => String(i));
        groupScale.range = [-paddedGroupAngleStep / 2, paddedGroupAngleStep / 2];
        groupScale.paddingInner = visibleGroupCount > 1 ? groupPaddingInner : 0;

        const radiusAxisReversed = this.isRadiusAxisReversed();
        const axisInnerRadius = this.getAxisInnerRadius();
        const axisOuterRadius = this.radius;

        const axisTotalRadius = axisOuterRadius + axisInnerRadius;

        const { angleKey, radiusKey, angleName, radiusName, legendItemName, label } = this.properties;

        const radiusDomain = this.getSeriesDomain(ChartAxisDirection.Radius).domain;

        const getLabelNodeDatum = (
            datum: RadialColumnNodeDatum,
            radiusDatum: AgNumericValue,
            x: number,
            y: number
        ): RadialColumnLabelNodeDatum | undefined => {
            const labelText = this.getLabelText<AgRadialSeriesLabelFormatterParams>(
                radiusDatum,
                datum,
                radiusKey,
                'radius',
                radiusDomain,
                label,
                { value: radiusDatum, datum, angleKey, radiusKey, angleName, radiusName, legendItemName }
            );

            if (labelText) {
                return { x, y, text: labelText, textAlign: 'center', textBaseline: 'middle' };
            }
        };

        const nodeData: RadialColumnNodeDatum[] = [];
        const styles = getItemStyles((nodeDatum: RadialColumnNodeDatum | undefined, isHighlight, highlightState) =>
            getItemStyle(this, nodeDatum, isHighlight, highlightState, undefined, undefined)
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
        for (const { datumIndex } of dataModel.forEachGroupDatum(this, processedData)) {
            const datum = rawData[datumIndex];
            const angleDatum = angleValues[datumIndex];
            // eslint-disable-next-line sonarjs/different-types-comparison
            if (angleDatum === undefined && !this.properties.allowNullKeys) return;

            const radiusDatum = radiusRawValues[datumIndex];
            const isPositive = radiusDatum >= 0 && !Object.is(radiusDatum, -0);
            const innerRadiusDatum = radiusStartValues[datumIndex];
            const outerRadiusDatum = radiusEndValues[datumIndex];
            const negative = isPositive === radiusAxisReversed;
            if (innerRadiusDatum === undefined || outerRadiusDatum === undefined) return;

            let startAngle: number;
            let endAngle: number;
            let angle: number;
            if (rawData.length === 1) {
                startAngle = -0.5 * Math.PI;
                endAngle = 1.5 * Math.PI;
                angle = startAngle;
            } else {
                const groupAngle = angleScale.convert(angleDatum);
                startAngle = normalizeAngle360(groupAngle + groupScale.convert(String(groupIndex)));
                endAngle = normalizeAngle360(startAngle + groupScale.bandwidth);
                angle = startAngle + groupScale.bandwidth / 2;
            }

            const innerRadius = axisTotalRadius - radiusScale.convert(innerRadiusDatum);
            const outerRadius = axisTotalRadius - radiusScale.convert(outerRadiusDatum);
            const midRadius = (innerRadius + outerRadius) / 2;

            const x = Math.cos(angle) * midRadius;
            const y = Math.sin(angle) * midRadius;

            const labelNodeDatum = this.properties.label.enabled
                ? getLabelNodeDatum(datum as any, radiusDatum, x, y)
                : undefined;

            const columnWidth = this.getColumnWidth(startAngle, endAngle);

            nodeData.push({
                series: this,
                datum,
                datumIndex,
                point: { x, y, size: 0 },
                midPoint: { x, y },
                label: labelNodeDatum,
                angleValue: angleDatum,
                radiusValue: radiusDatum,
                negative,
                innerRadius,
                outerRadius,
                stackInnerRadius: innerRadius,
                stackOuterRadius: outerRadius,
                startAngle,
                endAngle,
                midAngle: angle,
                axisInnerRadius,
                axisOuterRadius,
                columnWidth,
                index: datumIndex,
            });
        }

        return {
            itemId: radiusKey,
            nodeData,
            labelData: nodeData,
            styles,
        };
    }

    protected getColumnWidth(_startAngle: number, _endAngle: number) {
        return Number.NaN;
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

    protected abstract updateItemPath(node: ItemPathType, datum: RadialColumnNodeDatum, highlight: boolean): void;

    protected updateSectorSelection(
        selection: _ModuleSupport.Selection<RadialColumnNodeDatum, ItemPathType>,
        isHighlight: boolean
    ) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        let selectionData: RadialColumnNodeDatum[] = [];
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        if (isHighlight) {
            if (activeHighlight?.datum && activeHighlight.series === this) {
                selectionData.push(activeHighlight as RadialColumnNodeDatum);
            }
        } else {
            selectionData = this.nodeData;
        }

        const radiusAxisReversed = this.isRadiusAxisReversed();
        const axisInnerRadius = radiusAxisReversed ? this.radius : this.getAxisInnerRadius();
        const axisOuterRadius = radiusAxisReversed ? this.getAxisInnerRadius() : this.radius;

        const fillBBox = this.getShapeFillBBox();
        const hasItemStylers = this.hasItemStylers();
        // No itemStyler: style is a pure function of (highlightState, selectionState); cache by state.
        const styleCache =
            hasItemStylers && this.properties.itemStyler == null
                ? new Map<string, RadialSeriesStyleResult>()
                : undefined;

        selection
            .update(selectionData, undefined, (datum) => this.getDatumId(datum))
            .each((node, nodeDatum) => {
                const { midPoint } = nodeDatum;

                const selectionState = this.getDataSelectionState(nodeDatum.datumIndex);
                const candidateState = this.getDataCandidacyState(nodeDatum.datumIndex);
                if (hasItemStylers) {
                    const highlightState = this.getHighlightState(activeHighlight, isHighlight, nodeDatum.datumIndex);

                    if (styleCache == null) {
                        nodeDatum.style = getItemStyle(
                            this,
                            nodeDatum,
                            isHighlight,
                            highlightState,
                            selectionState,
                            candidateState
                        );
                    } else {
                        const stateKey = `${highlightState}:${selectionState ?? '-'}:${candidateState ?? '-'}`;
                        let cached = styleCache.get(stateKey);
                        if (cached === undefined) {
                            // Concrete nodeDatum required: getStyle treats `undefined` as "ignore styler".
                            cached = getItemStyle(
                                this,
                                nodeDatum,
                                isHighlight,
                                highlightState,
                                selectionState,
                                candidateState
                            );
                            styleCache.set(stateKey, cached);
                        }
                        nodeDatum.style = cached;
                    }
                }
                const bringToFront = !_ModuleSupport.isUnselected(selectionState);
                node.zIndex = bringToFront ? 1 : 0;

                const style =
                    nodeDatum.style ??
                    contextNodeData.styles[this.getHighlightState(highlightedDatum, isHighlight, nodeDatum.datumIndex)];

                const fill = style.fill;
                const itemBounds = isGradientFill(fill) && fill.bounds === 'item';
                const fillParams = itemBounds
                    ? { centerX: midPoint?.x ?? 0, centerY: midPoint?.y ?? 0 }
                    : { centerX: 0, centerY: 0, innerRadius: axisInnerRadius, outerRadius: axisOuterRadius };

                this.updateItemPath(node, nodeDatum, isHighlight);

                node.setStyleProperties(style as NormalisedRadialSeriesStyle, fillBBox, fillParams);

                node.cornerRadius = style.cornerRadius ?? 0;
                node.lineJoin = 'round';
            });
    }

    protected updateLabels() {
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightDatum =
            activeHighlight?.series === this && activeHighlight?.datum
                ? (activeHighlight as RadialColumnNodeDatum)
                : undefined;
        const highlightData = highlightDatum ? [highlightDatum] : [];

        this.labelSelection.update(this.nodeData).each((node, datum) => {
            updateLabelNode(this, node, this.properties, this.properties.label, datum.label, {
                isHighlight: false,
                activeHighlight,
            });
            node.fillOpacity = this.getHighlightStyle(false, datum.datumIndex).opacity ?? 1;
        });

        this.highlightLabelSelection
            .update(highlightData, undefined, (datum) => this.getDatumId(datum))
            .each((node, datum) => {
                updateLabelNode(this, node, this.properties, this.properties.label, datum.label, {
                    isHighlight: true,
                    activeHighlight,
                });
                node.fillOpacity = this.getHighlightStyle(true, datum.datumIndex).opacity ?? 1;
            });
    }

    protected abstract getColumnTransitionFunctions(): {
        fromFn: _ModuleSupport.FromToMotionPropFn<any, any, any>;
        toFn: _ModuleSupport.FromToMotionPropFn<any, any, any>;
    };

    protected override animateEmptyUpdateReady() {
        const { labelSelection } = this;

        const fns = this.getColumnTransitionFunctions();
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

        const fns = this.getColumnTransitionFunctions();
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
        const angleValue = dataModel.resolveKeysById(this, `angleValue`, processedData)[datumIndex];
        const radiusValue = dataModel.resolveColumnById(this, `radiusValue-raw`, processedData, 'mixed-numeric')[
            datumIndex
        ];

        // eslint-disable-next-line sonarjs/different-types-comparison
        if (angleValue === undefined && !this.properties.allowNullKeys) return;

        const format = getItemStyle(this, nodeDatum, false, undefined, undefined, undefined);
        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(angleAxis, 'tooltip', angleValue, datum, angleKey, undefined),
                symbol: this.legendItemSymbol(),
                data: [
                    {
                        label: radiusName,
                        fallbackLabel: radiusKey,
                        value: this.getAxisValueText(radiusAxis, 'tooltip', radiusValue, datum, radiusKey, undefined),
                        missing: _ModuleSupport.isTooltipValueMissing(radiusValue),
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

    protected override pickNodesInBBoxPredicate() {
        return _ModuleSupport.pickSectorsInBBoxPredicate(this);
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = getStyle(
            this,
            false,
            _ModuleSupport.HighlightState.None,
            undefined,
            undefined
        );

        const markerStyle = {
            fill: fill ?? 'rgba(0, 0, 0, 0)',
            stroke: (stroke ?? 'rgba(0, 0, 0, 0)') as CssColor, // resolved at runtime
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

        const { radiusKey, radiusName, legendItemName, showInLegend } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId: radiusKey,
                seriesId,
                enabled: visible,
                label: {
                    text: legendItemName ?? radiusName ?? radiusKey,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    getDatumId(datum: RadialColumnNodeDatum) {
        return createDatumId(datum.angleValue);
    }

    override computeLabelsBBox() {
        return null;
    }
}
