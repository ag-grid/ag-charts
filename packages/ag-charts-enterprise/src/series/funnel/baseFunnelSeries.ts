import {
    type AgConeFunnelSeriesLabelPlacement,
    type AgFunnelSeriesLabelFormatterParams,
    type AgFunnelSeriesLabelPlacement,
    type AgFunnelSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type {
    BoxBounds,
    DomainWithMetadata,
    DynamicContext,
    FillStrokeMorph,
    LabelFit,
    Normalised,
    NormalisedTextOrSegments,
    PlacedLabel,
    Point,
    PointLabelDatum,
    RequireOptional,
} from 'ag-charts-core';
import {
    ChartAxisDirection,
    SeriesZIndexMap,
    applyBarLabelOrientation,
    applyPlacedBarLabelVisibility,
    barLabelObstacles,
    barLabelRoutesThroughEngine,
    buildBarPositionedLabelDatum,
    fontWithSize,
    maxValue,
    measureLabelText,
    resolveLabelFit,
    resolveLabelFitDescriptors,
} from 'ag-charts-core';
import type { AgNumericValue, PaddingOptions } from 'ag-charts-types';

import type { BaseFunnelProperties } from './baseFunnelSeriesProperties';
import { FunnelConnector } from './funnelConnector';
import { prepareConnectorAnimationFunctions, resetConnectorSelectionsFn } from './funnelUtil';

const {
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    updateLabelNode,
    buildBarLabelCandidates,
    createBarCandidateStyleResolver,
    expandPlacementLabelBoxExtent,
    fitLabelToContainerAutoSize,
    styledBarLabelBox,
    SMALLEST_KEY_INTERVAL,
    LARGEST_KEY_INTERVAL,
    diff,
    fixNumericExtent,
    seriesLabelFadeInAnimation,
    resetMotion,
    resetLabelFn,
    animationValidation,
    computeBarFocusBounds,
    Group,
    Selection,
    PointerEvents,
    motion,
    checkCrisp,
    createDatumId,
    getItemId,
} = _ModuleSupport;

/** The placement vocabularies of the funnel family; each series uses one of them. */
export type FunnelLabelPlacement = AgFunnelSeriesLabelPlacement | AgConeFunnelSeriesLabelPlacement;

export type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type NormalisedFunnelSeriesStyle = Normalised<AgFunnelSeriesStyle, never, FillStrokeMorph>;

/** `Rect` scales oversized radii down to fit the shape, so mirror that clamp to match what is drawn. */
function renderedCornerRadius(cornerRadius: number, { width, height }: Bounds) {
    if (cornerRadius <= 0) return 0;
    return Math.min(cornerRadius, width / 2, height / 2);
}

export type FunnelNodeLabelDatum = Point & {
    datumIndex: number;
    text: NormalisedTextOrSegments;
    /** Text the placement engine fitted to its chosen candidate; rendered in place of `text` when set. */
    fittedText?: NormalisedTextOrSegments;
    /** Reduced font size the text was fitted at; `undefined` when it renders at the configured size. */
    fittedFontSize?: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    /** Always upright: these series expose no label orientation. */
    rotation: number;
    /** Flush offset written by the placement engine to keep a label inside its region. */
    offsetX?: number;
    offsetY?: number;
    region?: BoxBounds;
    /** Public resolved placement, coarsened to select the placement styles where a series has them. */
    placement?: FunnelLabelPlacement;
    /** Pre-positioned cascade candidates, present only when the label routes through the engine. */
    candidates?: readonly _ModuleSupport.BarPositionedCandidate<FunnelLabelPlacement>[];
    /** Own bar rect, so a positioned candidate avoids neighbouring bars but never its own. */
    ownBox?: BoxBounds;
    /** Engine-routed label the placement engine dropped (no candidate fit); rendered invisible. */
    hidden?: boolean;
    datum: any;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    visible: boolean;
};

/**
 * Everything a funnel-family label needs that is invariant across the datums of one node-data pass:
 * the resolved placement lists, the axis flags they are positioned against, and the fit inputs.
 */
export interface FunnelLabelContext {
    /** Bar-vocabulary placements, index-parallel with {@link reportedPlacements}. */
    placements: readonly _ModuleSupport.BarLabelPlacement[];
    /** The public placement values the label datum and `itemStyler` report. */
    reportedPlacements: readonly FunnelLabelPlacement[];
    isVertical: boolean;
    isUpward: boolean;
    /** Cross-axis extent for the inside regions of a divider with no thickness of its own. */
    insideCrossRegion?: BoxBounds;
    routesThroughEngine: boolean;
    plotRegion?: BoxBounds;
    labelFit?: LabelFit;
    boxPadding: Required<PaddingOptions>;
    yDomain: any[];
}

export interface FunnelNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<Point> {
    readonly index: number;
    readonly width: number;
    readonly height: number;
    readonly label: FunnelNodeLabelDatum | undefined;
    readonly visible: boolean;

    // Required for types
    readonly crisp: boolean;
    readonly opacity?: number;
    readonly clipBBox?: _ModuleSupport.BBox;
}

interface FunnelConnectorDatum {
    readonly datum: FunnelNodeDatum;
    readonly datumIndex: number;
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    readonly x3: number;
    readonly y3: number;
    readonly opacity: number;
    readonly startCornerRadius: number;
    readonly endCornerRadius: number;
}

interface FunnelContext extends _ModuleSupport.AbstractBarSeriesNodeDataContext<FunnelNodeDatum, FunnelNodeLabelDatum> {
    connectorData: FunnelConnectorDatum[];
}

/**
 * Base type interface for funnel series types.
 * Constrains datum, label, context, and properties types while leaving node and options open for subclasses.
 */
export interface BaseFunnelSeriesTypes extends _ModuleSupport.AbstractBarSeriesTypes {
    readonly node: _ModuleSupport.QuadtreeCompatibleNode<FunnelNodeDatum>;
    readonly properties: BaseFunnelProperties<this['options']>;
    readonly datum: FunnelNodeDatum;
    readonly label: FunnelNodeLabelDatum;
    readonly context: FunnelContext;
}

export interface FunnelAnimationData<
    TNode extends _ModuleSupport.QuadtreeCompatibleNode<FunnelNodeDatum>,
> extends _ModuleSupport.CartesianAnimationData<FunnelNodeDatum, TNode, FunnelNodeLabelDatum, FunnelContext> {}

export abstract class BaseFunnelSeries<
    TTypes extends BaseFunnelSeriesTypes,
> extends _ModuleSupport.AbstractBarSeries<TTypes> {
    override createNodeParams(datum: FunnelNodeDatum) {
        return {
            ...super.createNodeParams(datum),
            xKey: this.properties.stageKey,
            yKey: this.properties.valueKey,
        };
    }

    protected readonly connectorNodeGroup = this.contentGroup.appendChild(
        new Group({
            name: `${this.id}-series-connectorNodes`,
            zIndex: SeriesZIndexMap.BACKGROUND,
        })
    );
    protected connectorSelection = Selection.select<FunnelConnector<FunnelConnectorDatum>>(
        this.connectorNodeGroup,
        () => this.connectionFactory()
    );

    override get pickModeAxis() {
        return 'main-category' as const;
    }

    constructor({
        moduleCtx,
        animationResetFns,
    }: {
        moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>;
        animationResetFns: {
            datum: (
                node: _ModuleSupport.NodeOf<TTypes>,
                datum: FunnelNodeDatum
            ) => _ModuleSupport.AnimationValue & Partial<_ModuleSupport.NodeOf<TTypes>>;
        };
    }) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.AXIS_ALIGNED, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            propertyKeys: {
                x: ['stageKey'],
                y: ['valueKey'],
            },
            propertyNames: {
                x: [],
                y: [],
            },
            categoryKey: 'xValue',
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: animationResetFns.datum,
                label: resetLabelFn,
            },
        });

        this.connectorNodeGroup.pointerEvents = PointerEvents.None;
    }

    override setZIndex(zIndex: number): boolean {
        super.setZIndex(zIndex);

        this.connectorNodeGroup.zIndex = [SeriesZIndexMap.BACKGROUND, zIndex];

        return true;
    }

    protected override isVertical(): boolean {
        return !super.isVertical();
    }

    protected abstract connectorEnabled(): boolean;

    /** Radius of the segment corners the drop-off connectors have to butt up against. */
    protected connectorCornerRadius(): number {
        return 0;
    }

    protected abstract connectorStyle(index: number): RequireOptional<AgFunnelSeriesStyle> & { opacity: number };

    private connectionFactory() {
        return new FunnelConnector<FunnelConnectorDatum>();
    }

    override getKeyAxis(direction: ChartAxisDirection): string | undefined {
        // Do not flip series axis keys for funnel series
        if (direction === ChartAxisDirection.X) return this.properties.xKeyAxis;
        if (direction === ChartAxisDirection.Y) return this.properties.yKeyAxis;
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { stageKey, valueKey } = this.properties;
        const { visible, id: seriesId } = this;

        const validation = (_value: unknown, _datum: unknown, index: number) =>
            visible && (this.ctx.legendManager?.getItemEnabled({ seriesId, itemId: index }) ?? true);

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const extraProps = [];
        if (this.needsDataModelDiff() && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (!this.ctx.animationManager.isSkipped()) {
            extraProps.push(animationValidation());
        }

        const visibleProps = this.visible ? {} : { forceValue: 0 };
        const allowNullKey = this.properties.allowNullKeys ?? false;
        const { processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(stageKey, xScaleType, { id: 'xValue', allowNullKey }),
                valueProperty(valueKey, yScaleType, { id: `yValue`, ...visibleProps, validation, invalidValue: 0 }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL, LARGEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: false,
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
        this.largestDataInterval = processedData.reduced?.largestKeyInterval;

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const {
            processedData,
            dataModel,
            id: seriesId,
            ctx: { legendManager },
        } = this;
        if (!processedData || !dataModel) return { domain: [] };

        const {
            keys: [keys],
        } = processedData.domain;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                if (!this.hasData) return { domain: [] };
                const domain = keys.filter(
                    (_key, index) => legendManager?.getItemEnabled({ seriesId, itemId: index }) ?? true
                );
                const sortMetadata = dataModel.getKeySortMetadata(this, 'xValue', processedData);
                return { domain, sortMetadata };
            }
            return { domain: this.padBandExtent(keys) };
        } else {
            const yExtent = this.domainForClippedRange(direction, ['yValue'], 'xValue');
            // maxValue preserves an exact bigint; Math.max throws on bigint operands.
            let maxExtent: AgNumericValue = -Infinity;
            for (const v of yExtent) maxExtent = maxValue(maxExtent, v);
            const fixedYExtent = [-maxExtent, maxExtent];
            return { domain: fixNumericExtent(fixedYExtent) };
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, _visibleRange: [any, any]): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override createNodeData() {
        const {
            hasData,
            data,
            dataModel,
            processedData,
            id: seriesId,
            ctx: { legendManager },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(hasData && data && xAxis && yAxis && dataModel && processedData?.type === 'ungrouped')) {
            return;
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const { stageKey, valueKey } = this.properties;

        const itemId = `${valueKey}`;

        const context: FunnelContext = {
            itemId,
            nodeData: [],
            labelData: [],
            connectorData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.ctx.seriesStateManager.getGroupScale(this)!),
            visible: this.visible,
        };

        const isVisible = this.visible;
        if (!isVisible) return context;

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData, 'mixed-numeric');

        const { groupOffset, barOffset, barWidth } = this.getBarDimensions();

        const crisp = checkCrisp(
            xAxis?.scale,
            xAxis?.visibleRange,
            this.smallestDataInterval,
            this.largestDataInterval
        );

        const labelContext = this.createLabelContext(barAlongX);

        interface ConnectorConfig {
            itemId: string;
            rect: Bounds;
            nodeDatum: FunnelNodeDatum;
            datumIndex: number;
        }
        let previousConnection: ConnectorConfig | undefined;
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        for (const [datumIndex, datum] of rawData.entries()) {
            const visible = isVisible && (legendManager?.getItemEnabled({ seriesId, itemId: datumIndex }) ?? true);

            const xDatum = xValues[datumIndex];
            // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
            if (xDatum === undefined && !this.properties.allowNullKeys) continue; // eslint-disable-line sonarjs/different-types-comparison

            const xConverted = xScale.convert(xDatum);
            if (!Number.isFinite(xConverted)) continue;
            const x = xConverted + groupOffset + barOffset;

            const yDatum = yValues[datumIndex];
            const yNegative = Math.round(yScale.convert(-yDatum));
            const yPositive = Math.round(yScale.convert(yDatum));

            const style = this.getItemStyle({ datum, datumIndex }, false);

            const barHeight = Math.max(style.strokeWidth ?? 0, Math.abs(yPositive - yNegative));

            const rect: Bounds = {
                x: barAlongX ? Math.min(yPositive, yNegative) : x,
                y: barAlongX ? x : Math.min(yPositive, yNegative),
                width: barAlongX ? barHeight : barWidth,
                height: barAlongX ? barWidth : barHeight,
            };

            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const labelData: FunnelNodeDatum['label'] = this.createFunnelLabelDatum({
                labelContext,
                datumIndex,
                rect,
                yDatum,
                datum,
                visible,
            });

            const nodeDatum: FunnelNodeDatum = {
                index: datumIndex,
                series: this,
                datum,
                datumIndex,
                xValue: xDatum,
                yValue: yDatum,
                xKey: stageKey,
                yKey: valueKey,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                midPoint: nodeMidPoint,
                crisp,
                label: labelData,
                visible,
            };

            context.nodeData.push(nodeDatum);

            if (labelData != null) {
                context.labelData.push(labelData);
            }

            if (previousConnection != null) {
                const prevRect = previousConnection.rect;
                const startNodeDatum = previousConnection.nodeDatum;
                const startDatumIndex = previousConnection.datumIndex;
                const startCornerRadius = renderedCornerRadius(this.connectorCornerRadius(), prevRect);
                const endCornerRadius = renderedCornerRadius(this.connectorCornerRadius(), rect);
                if (barAlongX) {
                    context.connectorData.push({
                        datum: startNodeDatum,
                        datumIndex: startDatumIndex,
                        x0: prevRect.x,
                        y0: prevRect.y + prevRect.height,
                        x1: prevRect.x + prevRect.width,
                        y1: prevRect.y + prevRect.height,
                        x2: rect.x + rect.width,
                        y2: rect.y,
                        x3: rect.x,
                        y3: rect.y,
                        opacity: 1,
                        startCornerRadius,
                        endCornerRadius,
                    });
                } else {
                    context.connectorData.push({
                        datum: startNodeDatum,
                        datumIndex: startDatumIndex,
                        x0: prevRect.x + prevRect.width,
                        y0: prevRect.y,
                        x1: rect.x,
                        y1: rect.y,
                        x2: rect.x,
                        y2: rect.y + rect.height,
                        x3: prevRect.x + prevRect.width,
                        y3: prevRect.y + prevRect.height,
                        opacity: 1,
                        startCornerRadius,
                        endCornerRadius,
                    });
                }
            }

            if (visible) {
                previousConnection = {
                    itemId,
                    rect,
                    nodeDatum,
                    datumIndex: datumIndex,
                };
            }
        }

        return context;
    }

    protected resolveItemId(datum: unknown, datumIndex: number) {
        return getItemId({ series: this, datum, datumIndex }, this.data?.dataIdKey);
    }

    protected abstract getItemStyle(
        _: Partial<FunnelNodeDatum>,
        _isHighlight: boolean
    ): RequireOptional<AgFunnelSeriesStyle>;

    /** The placement a label falls back to when none resolves, in this series' own vocabulary. */
    protected abstract defaultLabelPlacement(): FunnelLabelPlacement;

    /** Maps this series' placement vocabulary onto the bar candidates it is positioned by. */
    protected abstract resolveLabelPlacements(barAlongX: boolean): {
        placements: readonly _ModuleSupport.BarLabelPlacement[];
        reportedPlacements: readonly FunnelLabelPlacement[];
        isVertical: boolean;
        isUpward: boolean;
        insideCrossRegion?: BoxBounds;
    };

    /** The placement-style overrides for a resolved placement; `undefined` where a series has none. */
    protected labelPlacementStyle(
        _placement: FunnelLabelPlacement | undefined
    ): _ModuleSupport.LabelPlacementStyle | undefined {
        return undefined;
    }

    private labelStylerParams(): RequireOptional<AgFunnelSeriesLabelFormatterParams> {
        return { stageKey: this.properties.stageKey, valueKey: this.properties.valueKey };
    }

    private createLabelContext(barAlongX: boolean): FunnelLabelContext {
        const { label } = this.properties;
        const { placements, reportedPlacements, isVertical, isUpward, insideCrossRegion } =
            this.resolveLabelPlacements(barAlongX);
        const boxPadding = expandPlacementLabelBoxExtent(label);
        const labelFit = resolveLabelFit(label, !label.collision.alwaysShow);
        return {
            placements,
            reportedPlacements,
            isVertical,
            isUpward,
            insideCrossRegion,
            routesThroughEngine: barLabelRoutesThroughEngine(
                undefined,
                label.placement,
                label.collision.alwaysShow,
                labelFit
            ),
            plotRegion: this.resolveLabelPlotRegion(label.collision),
            labelFit,
            boxPadding,
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y).domain,
        };
    }

    private createFunnelLabelDatum({
        labelContext,
        datumIndex,
        rect,
        yDatum,
        datum,
        visible,
    }: {
        labelContext: FunnelLabelContext;
        datumIndex: number;
        rect: Bounds;
        yDatum: AgNumericValue;
        datum: any;
        visible: boolean;
    }): FunnelNodeLabelDatum | undefined {
        const { stageKey, valueKey, label } = this.properties;

        if (!label.enabled) return;

        const text = this.getLabelText<AgFunnelSeriesLabelFormatterParams>(
            yDatum,
            datum,
            valueKey,
            'y',
            labelContext.yDomain,
            label,
            { itemId: this.resolveItemId(datum, datumIndex), value: yDatum, datum, stageKey, valueKey }
        );

        const labelDatum: FunnelNodeLabelDatum = {
            x: 0,
            y: 0,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            textAlign: 'center',
            textBaseline: 'middle',
            text,
            ownBox: rect,
            hidden: false,
            datum,
            datumIndex,
            series: this,
            visible,
        };

        const measured = measureLabelText(text, label);
        const candidates = buildBarLabelCandidates<AgFunnelSeriesLabelFormatterParams, FunnelLabelPlacement>({
            isUpward: labelContext.isUpward,
            isVertical: labelContext.isVertical,
            placements: labelContext.placements,
            reportedPlacements: labelContext.reportedPlacements,
            orientations: ['horizontal'],
            spacing: label.spacing,
            label,
            textWidth: measured.width,
            textHeight: measured.height,
            rect,
            insideCrossRegion: labelContext.insideCrossRegion,
            hideable: !label.collision.alwaysShow,
            plotRegion: labelContext.plotRegion,
            fitted: labelContext.labelFit != null,
            text,
            styleDatum: labelDatum,
            resolveStyle: createBarCandidateStyleResolver(
                this,
                label,
                this.labelStylerParams(),
                undefined,
                (placement) => labelContext.reportedPlacements[labelContext.placements.indexOf(placement)]
            ),
        });

        // The engine picks the first candidate that fits; the first is baked so rendering is correct
        // even when the label never routes through the engine.
        const [first] = candidates;
        if (first != null) {
            labelDatum.x = first.anchor.x;
            labelDatum.y = first.anchor.y;
            labelDatum.textAlign = first.anchor.textAlign;
            labelDatum.textBaseline = first.anchor.textBaseline;
            labelDatum.region = first.region;
            labelDatum.placement = first.placement;
        }

        if (labelContext.routesThroughEngine) {
            labelDatum.candidates = candidates;
        } else {
            // Nothing re-fits this label later, so bound its text to the region it was baked into.
            const fitted = fitLabelToContainerAutoSize(text, labelContext.labelFit, label, first?.fitTo?.container);
            labelDatum.fittedText = fitted.text;
            labelDatum.fittedFontSize = fitted.fontSize;
        }

        return labelDatum;
    }

    protected override updateNodes(seriesHighlighted: boolean, nodeRefresh: boolean) {
        super.updateNodes(seriesHighlighted, nodeRefresh);

        const { connectorSelection } = this;
        const connectorData = this.contextNodeData?.connectorData ?? [];
        this.connectorSelection = this.updateConnectorSelection({ connectorSelection, connectorData });
        this.updateConnectorNodes({ connectorSelection });
    }

    protected override updateDatumSelection(opts: {
        nodeData: FunnelNodeDatum[];
        datumSelection: _ModuleSupport.Selection<FunnelNodeDatum, _ModuleSupport.NodeOf<TTypes>>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
    }

    private updateConnectorSelection(opts: {
        connectorData: FunnelConnectorDatum[];
        connectorSelection: _ModuleSupport.Selection<FunnelConnectorDatum, FunnelConnector<FunnelConnectorDatum>>;
    }) {
        const { connectorData, connectorSelection } = opts;
        return connectorSelection.update(this.connectorEnabled() ? connectorData : [], undefined, (connector) =>
            this.getDatumId(connector.datum)
        );
    }

    private updateConnectorNodes(opts: {
        connectorSelection: _ModuleSupport.Selection<FunnelConnectorDatum, FunnelConnector<FunnelConnectorDatum>>;
    }) {
        const fillBBox = this.getShapeFillBBox();
        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

        opts.connectorSelection.each((connector, datum) => {
            // Colour refs are resolved during theme-merge, so the style is already normalised by render.
            const { fill, fillOpacity, stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
                this.connectorStyle(datum.datumIndex) as RequireOptional<NormalisedFunnelSeriesStyle> & {
                    opacity: number;
                };

            connector.setProperties(resetConnectorSelectionsFn(connector, datum));

            connector.capsAlongX = barAlongX;
            connector.startCornerRadius = datum.startCornerRadius;
            connector.endCornerRadius = datum.endCornerRadius;

            connector.setStyleProperties(
                {
                    fill,
                    stroke,
                    fillOpacity,
                    strokeOpacity,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                },
                fillBBox
            );
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: FunnelNodeLabelDatum[];
        labelSelection: FunnelAnimationData<_ModuleSupport.NodeOf<TTypes>>['labelSelection'];
    }) {
        const labelData = this.properties.label.enabled ? opts.labelData : [];
        return opts.labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<FunnelNodeLabelDatum, _ModuleSupport.Text<FunnelNodeLabelDatum>>;
        isHighlight?: boolean;
    }) {
        const params = this.labelStylerParams();
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const { isHighlight = false, labelSelection } = opts;
        labelSelection.each((textNode, datum) => {
            if (datum.hidden) {
                textNode.visible = false;
                return;
            }
            const highlightStyle = this.getHighlightStyle(isHighlight, datum.datumIndex);
            textNode.visible = datum.visible || isHighlight;
            textNode.fillOpacity = highlightStyle.opacity ?? 1;
            textNode.opacity = highlightStyle.opacity ?? 1;
            updateLabelNode(
                this,
                textNode,
                params,
                this.properties.label,
                datum,
                { isHighlight, activeHighlight },
                undefined,
                this.labelPlacementStyle(datum.placement),
                { placement: datum.placement, orientation: 'horizontal' }
            );
        });
    }

    getLabelObstacles() {
        const { label } = this.properties;
        const box = expandPlacementLabelBoxExtent(label);
        return barLabelObstacles(
            this.contextNodeData?.nodeData,
            this.contextNodeData?.labelData,
            this.isLabelEnabled() && !this.usesPlacedLabels,
            (labelDatum) => ({ label: labelDatum, config: fontWithSize(label, labelDatum.fittedFontSize), box })
        );
    }

    override getLabelData(): PointLabelDatum[] {
        const { label } = this.properties;
        if (!this.usesPlacedLabels || !label.enabled) return [];
        const box = expandPlacementLabelBoxExtent(label);
        const collideWith = label.collision.resolveCollideWith();
        const threshold = label.collision.threshold ?? 0;
        const fitFor = resolveLabelFitDescriptors(label, box, !label.collision.alwaysShow);
        const resolveStyle = createBarCandidateStyleResolver(
            this,
            label,
            this.labelStylerParams(),
            undefined,
            (placement) => this.fromBarPlacement(placement)
        );
        const data: PointLabelDatum[] = [];
        for (const labelDatum of this.contextNodeData?.labelData ?? []) {
            if (labelDatum.text === '' || labelDatum.candidates == null) continue;
            const styled = styledBarLabelBox(
                resolveStyle,
                labelDatum,
                this.toBarPlacement(labelDatum.placement),
                'horizontal',
                labelDatum.text
            );
            const { width, height } = measureLabelText(labelDatum.text, label);
            const size = styled?.size ?? { width: width + box.left + box.right, height: height + box.top + box.bottom };
            const configuredFit = fitFor(labelDatum.text);
            const fit =
                configuredFit == null || styled == null
                    ? configuredFit
                    : { ...configuredFit, font: styled.font, boxPadding: styled.boxPadding };
            data.push(
                buildBarPositionedLabelDatum(
                    labelDatum.text,
                    size.width,
                    size.height,
                    labelDatum.candidates,
                    labelDatum,
                    labelDatum.ownBox ?? { x: labelDatum.x, y: labelDatum.y, width: 0, height: 0 },
                    label.collision.alwaysShow,
                    collideWith,
                    threshold,
                    true,
                    fit
                )
            );
        }
        return data;
    }

    override updatePlacedLabelData(placed: PlacedLabel<FunnelNodeLabelDatum>[]) {
        applyBarLabelOrientation(placed);
        applyPlacedBarLabelVisibility(this.contextNodeData?.labelData, placed, (labelDatum) => labelDatum);
        this.refreshPlacedLabelNodes();
    }

    protected override resolveUsesPlacedLabels(): boolean {
        const { label } = this.properties;
        const alwaysShow = label.collision.alwaysShow;
        return barLabelRoutesThroughEngine(undefined, label.placement, alwaysShow, resolveLabelFit(label, !alwaysShow));
    }

    /** The bar placement a public one maps onto, for the styled box a baked label reserves. */
    protected abstract toBarPlacement(placement: FunnelLabelPlacement | undefined): _ModuleSupport.BarLabelPlacement;

    /** Inverse of {@link toBarPlacement}, so an `itemStyler` is told the placement in its own vocabulary. */
    protected abstract fromBarPlacement(placement: _ModuleSupport.BarLabelPlacement): FunnelLabelPlacement | undefined;

    protected override getHighlightLabelData(
        _labelData: FunnelNodeLabelDatum[],
        highlightedItem: FunnelNodeDatum
    ): FunnelNodeLabelDatum[] | undefined {
        // The live label object, not a copy: the placement engine writes back through this reference.
        if (highlightedItem.label) {
            return [highlightedItem.label];
        }

        return undefined;
    }

    protected abstract tooltipStyle(datum: any, datumIndex: number): Required<AgFunnelSeriesStyle>;

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { stageKey, valueKey, tooltip, legendItemName } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveKeysById(this, 'xValue', processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData, 'mixed-numeric')[datumIndex];

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return; // eslint-disable-line sonarjs/different-types-comparison

        return this.formatTooltipWithContext(
            tooltip,
            {
                symbol: this.legendItemSymbol(datumIndex),
                data: [
                    {
                        label: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, stageKey, legendItemName),
                        value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, valueKey, legendItemName),
                    },
                ],
            },
            { seriesId, datum, title: stageKey, stageKey, valueKey, ...this.tooltipStyle(datum, datumIndex) }
        );
    }

    protected override resetAllAnimation(
        data: _ModuleSupport.CartesianAnimationData<
            FunnelNodeDatum,
            _ModuleSupport.NodeOf<TTypes>,
            FunnelNodeLabelDatum,
            FunnelContext
        >
    ): void {
        super.resetAllAnimation(data);

        resetMotion([this.connectorSelection], resetConnectorSelectionsFn);
    }

    override animateEmptyUpdateReady({ labelSelection }: FunnelAnimationData<_ModuleSupport.NodeOf<TTypes>>) {
        const { connectorSelection } = this;
        const isVertical = this.isVertical();
        const mode = 'normal';

        const connectorFns = prepareConnectorAnimationFunctions(isVertical, mode);
        motion.fromToMotion(this.id, 'connectors', this.ctx.animationManager, [connectorSelection], connectorFns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    override animateWaitingUpdateReady(data: FunnelAnimationData<_ModuleSupport.NodeOf<TTypes>>) {
        const { labelSelection: labelSelections } = data;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }

    private getDatumId(datum: FunnelNodeDatum) {
        return createDatumId(datum.xValue);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex]);
    }

    private legendItemSymbol(datumIndex: number): _ModuleSupport.LegendSymbolOptions {
        // Colour refs are resolved during theme-merge, so the style is already normalised by render.
        const { strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset, fill, stroke } =
            this.properties.getStyle(datumIndex) as Required<NormalisedFunnelSeriesStyle> & { opacity: number };

        return {
            marker: {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            id: seriesId,
            processedData,
            dataModel,
            ctx: { legendManager },
            visible,
        } = this;

        if (!dataModel || !processedData || legendType !== 'category') {
            return [];
        }

        const { showInLegend } = this.properties;

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);

        return (processedData.dataSources.get(this.id)?.data ?? [])
            .map((datum, datumIndex): _ModuleSupport.CategoryLegendDatum | undefined => {
                const stageValue = xValues[datumIndex];
                const allowNullKeys = this.properties.allowNullKeys ?? false;
                if (stageValue == null && !allowNullKeys) return;

                return {
                    legendType: 'category',
                    id: seriesId,
                    datum,
                    itemId: datumIndex,
                    seriesId,
                    enabled: visible && (legendManager?.getItemEnabled({ seriesId, itemId: datumIndex }) ?? true),
                    label: { text: String(stageValue) },
                    symbol: this.legendItemSymbol(datumIndex),
                    skipAnimations: true,
                    hideInLegend: !showInLegend,
                };
            })
            .filter((datum): datum is _ModuleSupport.CategoryLegendDatum => datum != null);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.selection.enabled ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
