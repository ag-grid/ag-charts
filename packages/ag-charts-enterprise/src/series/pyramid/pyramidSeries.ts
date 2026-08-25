import {
    type AgPyramidSeriesItemStylerParams,
    type AgPyramidSeriesLabelFormatterParams,
    type AgPyramidSeriesOptions,
    type AgPyramidSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type BoxBounds,
    type CallbackParamRules,
    type ChartAnimationPhase,
    type DomainWithMetadata,
    type DynamicContext,
    type FillStrokeMorph,
    type LabelFit,
    type LabelObstacle,
    type Normalised,
    type NormalisedColorType,
    type NormalisedTextOrSegments,
    type PlacedLabel,
    type Point,
    type PointLabelDatum,
    type RequireOptional,
    StateMachine,
    type Writeable,
    applyBarLabelOrientation,
    applyPlacedBarLabelVisibility,
    bakedLabelObstacles,
    barLabelRoutesThroughEngine,
    buildBarPositionedLabelDatum,
    cachedTextMeasurer,
    fontWithSize,
    isArray,
    measureLabelText,
    measureTextSegments,
    mergeDefaults,
    resolveLabelFit,
    resolveLabelFitDescriptors,
    toNumber,
    toPlainText,
    toTextString,
    trapezoidBandRect,
    trapezoidBox,
    trapezoidFitRegion,
    trapezoidOverlapsBox,
    withFitRegion,
} from 'ag-charts-core';
import type { AgFunnelSeriesLabelPlacement, AgNumericValue } from 'ag-charts-types';

import { FunnelConnector } from '../funnel/funnelConnector';
import {
    FUNNEL_TO_BAR_PLACEMENT,
    pyramidLabelBand,
    pyramidPlacementAxes,
    pyramidStageTrapezoid,
    resolveFunnelPlacements,
    toResolvedFunnelPlacement,
} from '../funnel/funnelLabelPlacement';
import { PyramidProperties } from './pyramidProperties';
import { applyPyramidDatum, preparePyramidAnimationFunctions } from './pyramidUtil';

const {
    valueProperty,
    SeriesNodePickMode,
    createDatumId,
    BBox,
    Group,
    Selection,
    Text,
    PointerEvents,
    fromToMotion,
    seriesLabelFadeInAnimation,
    getLabelStyles,
    updateLabelNode,
    buildBarLabelCandidates,
    createBarCandidateStyleResolver,
    expandLabelBoxExtent,
    expandPlacementLabelBoxExtent,
    fitLabelToContainerAutoSize,
    pickPlacementStyle,
    styledBarLabelBox,
} = _ModuleSupport;

type PyramidStageLabelDatum = Readonly<Point> & {
    readonly text: NormalisedTextOrSegments;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    readonly visible: boolean;
};

type PyramidNodeLabelDatum = Point & {
    datumIndex: number;
    datum: any;
    series: _ModuleSupport.SeriesNodeDatum['series'];
    text: NormalisedTextOrSegments;
    /** Text the placement engine fitted to its chosen candidate; rendered in place of `text` when set. */
    fittedText?: NormalisedTextOrSegments;
    /** Reduced font size the text was fitted at; `undefined` when it renders at the configured size. */
    fittedFontSize?: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    /** Always upright: pyramid exposes no label orientation. */
    rotation: number;
    /** Flush offset written by the placement engine to keep a label inside its region. */
    offsetX?: number;
    offsetY?: number;
    region?: BoxBounds;
    placement?: AgFunnelSeriesLabelPlacement;
    /** Pre-positioned cascade candidates, present only when the label routes through the engine. */
    candidates?: readonly _ModuleSupport.BarPositionedCandidate<AgFunnelSeriesLabelPlacement>[];
    /** Own stage bounds, so a positioned candidate avoids neighbouring stages but never its own. */
    ownBox?: BoxBounds;
    /** Engine-routed label the placement engine dropped (no candidate fit); rendered invisible. */
    hidden?: boolean;
    visible: boolean;
};

/**
 * Everything a pyramid label needs that is invariant across the stages of one node-data pass: the
 * resolved placement lists, the axis flags they are positioned against, and the fit inputs.
 */
interface PyramidLabelContext {
    /** Bar-vocabulary placements, index-parallel with {@link reportedPlacements}. */
    placements: readonly _ModuleSupport.BarLabelPlacement[];
    reportedPlacements: readonly AgFunnelSeriesLabelPlacement[];
    isVertical: boolean;
    isUpward: boolean;
    routesThroughEngine: boolean;
    plotRegion?: BoxBounds;
    labelFit?: LabelFit;
}

type PyramidStageValue = string | number | { toString(): string };

type NormalisedPyramidSeriesStyle = Normalised<AgPyramidSeriesStyle, never, FillStrokeMorph>;

interface PyramidNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum, Readonly<Point> {
    readonly index: number;
    readonly xValue: PyramidStageValue;
    readonly yValue: AgNumericValue;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
    readonly label: PyramidNodeLabelDatum | undefined;
    style: NormalisedPyramidSeriesStyle;
}

interface PyramidNodeDataContext extends _ModuleSupport.DataModelSeriesNodeDataContext<
    PyramidNodeDatum,
    PyramidNodeLabelDatum
> {
    stageLabelData: PyramidStageLabelDatum[] | undefined;
    bounds: _ModuleSupport.BBox;
}

type PyramidAnimationState = 'empty' | 'ready';
type PyramidAnimationEvent = {
    update: undefined;
    clear: undefined;
    reset: undefined;
    skip: undefined;
};

export class PyramidSeries extends _ModuleSupport.DataModelSeries<
    PyramidNodeDatum,
    AgPyramidSeriesOptions,
    PyramidProperties,
    PyramidNodeLabelDatum,
    PyramidNodeDataContext
> {
    static override readonly className = 'PyramidSeries';
    static readonly type = 'pyramid' as const;

    override properties = new PyramidProperties();

    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));
    private readonly stageLabelGroup = this.contentGroup.appendChild(new Group({ name: 'stageLabelGroup' }));

    public datumSelection = Selection.select<FunnelConnector<PyramidNodeDatum>>(this.itemGroup, () =>
        this.nodeFactory()
    );
    private labelSelection = Selection.select<_ModuleSupport.Text<PyramidNodeLabelDatum>>(this.itemLabelGroup, Text);
    private stageLabelSelection = Selection.select<_ModuleSupport.Text<PyramidStageLabelDatum>>(
        this.stageLabelGroup,
        Text
    );
    private highlightLabelSelection = Selection.select<_ModuleSupport.Text<PyramidNodeLabelDatum>>(
        this.highlightLabelGroup,
        Text
    );
    private highlightDatumSelection = Selection.select<FunnelConnector<PyramidNodeDatum>>(this.highlightNodeGroup, () =>
        this.nodeFactory()
    );

    public contextNodeData?: PyramidNodeDataContext;

    private readonly animationState = new StateMachine<PyramidAnimationState, PyramidAnimationEvent>(
        'empty',
        {
            empty: {
                update: {
                    target: 'ready',
                    action: () => this.animateEmptyUpdateReady(),
                },
                reset: 'empty',
                skip: 'ready',
            },
            ready: {
                clear: 'empty',
                reset: 'empty',
                skip: 'ready',
            },
        },
        () => this.checkProcessedDataAnimatable()
    );

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx,
            categoryKey: undefined,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH, SeriesNodePickMode.NEAREST_NODE],
        });

        this.itemLabelGroup.pointerEvents = PointerEvents.None;
        this.stageLabelGroup.pointerEvents = PointerEvents.None;

        this.cleanup.register(this.ctx.eventsHub.on('legend:item-click', (event) => this.onLegendItemClick(event)));
    }

    private nodeFactory(): FunnelConnector<PyramidNodeDatum> {
        return new FunnelConnector<PyramidNodeDatum>();
    }

    public override getNodeData(): PyramidNodeDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    override resetAnimation(phase: ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null) return;

        const {
            id: seriesId,
            visible,
            ctx: { legendManager },
        } = this;

        const { stageKey, valueKey } = this.properties;

        const xScaleType = 'category';
        const yScaleType = 'number';

        const validation = (_value: unknown, _datum: unknown, index: number) =>
            visible && (legendManager?.getItemEnabled({ seriesId, itemId: index }) ?? true);
        const visibleProps = this.visible ? {} : { forceValue: 0 };
        const allowNullKey = this.properties.allowNullKeys ?? false;
        await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(stageKey, xScaleType, { id: 'xValue', allowNullKey }),
                valueProperty(valueKey, yScaleType, { id: `yValue`, ...visibleProps, validation, invalidValue: 0 }),
            ],
        });
    }

    override createNodeData() {
        const {
            id: seriesId,
            dataModel,
            processedData,
            properties,
            visible,
            ctx: { legendManager },
        } = this;
        const {
            stageKey,
            valueKey,
            direction,
            reverse = direction === 'horizontal',
            spacing,
            aspectRatio,
            label,
            stageLabel,
        } = properties;

        if (dataModel == null || processedData == null) return;

        const horizontal = direction === 'horizontal';

        const xValues = dataModel.resolveColumnById<PyramidStageValue>(this, `xValue`, processedData, 'object');
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData, 'mixed-numeric');

        const xDomain = dataModel.getDomain(this, 'xValue', 'value', processedData).domain;
        const yDomain = dataModel.getDomain(this, 'yValue', 'value', processedData).domain;

        const isRtl = this.ctx.domManager.isRtl;
        const textMeasurer = cachedTextMeasurer(stageLabel);
        const placeLeft = (stageLabel.placement === 'after') === isRtl;

        let textAlign: CanvasTextAlign;
        let textBaseline: CanvasTextBaseline;
        if (horizontal) {
            textAlign = 'center';
            textBaseline = stageLabel.placement === 'before' ? 'bottom' : 'top';
        } else {
            textAlign = placeLeft ? 'right' : 'left';
            textBaseline = 'middle';
        }

        const stageLabelData: PyramidStageLabelDatum[] | undefined = stageLabel.enabled ? [] : undefined;
        let maxLabelWidth = 0;
        let maxLabelHeight = 0;
        let yTotal = 0;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        for (const [datumIndex, datum] of rawData.entries()) {
            const xValue = xValues[datumIndex];
            // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
            if (xValue === undefined && !this.properties.allowNullKeys) continue; // eslint-disable-line sonarjs/different-types-comparison
            const yValue = yValues[datumIndex];
            const enabled = visible && (legendManager?.getItemEnabled({ seriesId, itemId: datumIndex }) ?? true);

            yTotal += toNumber(yValue);

            if (stageLabelData == null) continue;

            const text = this.getLabelText<AgPyramidSeriesLabelFormatterParams>(
                xValue,
                datum,
                stageKey,
                'x',
                xDomain,
                this.properties.stageLabel,
                { datum, value: yValue, stageKey, valueKey },
                this.properties.allowNullKeys ?? false
            );

            const { width, height } = isArray(text)
                ? measureTextSegments(text, label)
                : textMeasurer.measureLines(toTextString(text));
            maxLabelWidth = Math.max(maxLabelWidth, width);
            maxLabelHeight = Math.max(maxLabelHeight, height);

            stageLabelData.push({
                x: Number.NaN,
                y: Number.NaN,
                text,
                textAlign,
                textBaseline,
                visible: enabled,
            });
        }

        const seriesRectWidth = this._nodeDataDependencies?.seriesRectWidth ?? 0;
        const seriesRectHeight = this._nodeDataDependencies?.seriesRectHeight ?? 0;
        const totalSpacing = spacing * (processedData.input.count - 1);

        let bounds: _ModuleSupport.BBox;
        if (horizontal) {
            const verticalInset = maxLabelHeight + stageLabel.spacing;
            bounds = new BBox(
                0,
                stageLabel.placement === 'before' ? verticalInset : 0,
                seriesRectWidth,
                seriesRectHeight - verticalInset
            );
        } else {
            const horizontalInset = maxLabelWidth + stageLabel.spacing;
            bounds = new BBox(placeLeft ? horizontalInset : 0, 0, seriesRectWidth - horizontalInset, seriesRectHeight);
        }

        if (aspectRatio != null && aspectRatio !== 0) {
            const directionalAspectRatio = direction === 'horizontal' ? 1 / aspectRatio : aspectRatio;
            const constrainedWidth = Math.min(bounds.width, bounds.height * directionalAspectRatio);
            const constrainedHeight = constrainedWidth / directionalAspectRatio;

            bounds = new BBox(
                bounds.x + (bounds.width - constrainedWidth) / 2,
                bounds.y + (bounds.height - constrainedHeight) / 2,
                constrainedWidth,
                constrainedHeight
            );
        }

        let labelX: number | undefined;
        let labelY: number | undefined;
        if (horizontal) {
            labelY =
                stageLabel.placement === 'before'
                    ? bounds.y - stageLabel.spacing
                    : bounds.y + bounds.height + stageLabel.spacing;
        } else {
            labelX = placeLeft ? bounds.x - stageLabel.spacing : bounds.x + bounds.width + stageLabel.spacing;
        }

        const availableWidth = bounds.width - (horizontal ? totalSpacing : 0);
        const availableHeight = bounds.height - (horizontal ? 0 : totalSpacing);

        if (availableWidth < 0 || availableHeight < 0) return;

        const nodeData: PyramidNodeDatum[] = [];
        const labelData: PyramidNodeLabelDatum[] = [];
        const labelContext = this.createLabelContext(horizontal);
        let yStart = 0;
        let stageLabelIndex = 0;
        for (const [datumIndex, datum] of rawData.entries()) {
            const xValue = xValues[datumIndex];
            // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
            if (xValue === undefined && !this.properties.allowNullKeys) continue; // eslint-disable-line sonarjs/different-types-comparison
            const yValue = yValues[datumIndex];

            const enabled = visible && (legendManager?.getItemEnabled({ seriesId, itemId: datumIndex }) ?? true);

            const yEnd = yStart + toNumber(yValue);

            const yMidRatio = (yStart + yEnd) / (2 * yTotal);
            const yRangeRatio = (yEnd - yStart) / yTotal;

            const xOffset = horizontal ? availableWidth * yMidRatio + spacing * datumIndex : availableWidth * 0.5;
            const yOffset = horizontal ? availableHeight * 0.5 : availableHeight * yMidRatio + spacing * datumIndex;

            const x = bounds.x + xOffset;
            const y = bounds.y + yOffset;

            if (stageLabelData != null) {
                const stageLabelDatum = stageLabelData[stageLabelIndex++] as Writeable<PyramidStageLabelDatum>;
                stageLabelDatum.x = labelX ?? x;
                stageLabelDatum.y = labelY ?? y;
            }

            let top: number;
            let right: number;
            let bottom: number;
            let left: number;
            if (horizontal) {
                const barWidth = availableWidth * yRangeRatio;
                top = barWidth;
                bottom = barWidth;

                const y0 = (xOffset + barWidth / 2) * (availableHeight / bounds.width);
                const y1 = (xOffset - barWidth / 2) * (availableHeight / bounds.width);
                right = reverse ? bounds.height - y0 : y0;
                left = reverse ? bounds.height - y1 : y1;
            } else {
                const barHeight = availableHeight * yRangeRatio;
                right = barHeight;
                left = barHeight;

                const x0 = (yOffset - barHeight / 2) * (availableWidth / bounds.height);
                const x1 = (yOffset + barHeight / 2) * (availableWidth / bounds.height);
                top = reverse ? bounds.width - x0 : x0;
                bottom = reverse ? bounds.width - x1 : x1;
            }

            const text = this.getLabelText<AgPyramidSeriesLabelFormatterParams>(
                yValue,
                datum,
                valueKey,
                'y',
                yDomain,
                label,
                {
                    datum,
                    value: yValue,
                    stageKey,
                    valueKey,
                }
            );
            const labelDatum = this.createLabelDatum({
                labelContext,
                stage: { x, y, top, right, bottom, left },
                horizontal,
                text,
                datum,
                datumIndex,
                visible: enabled,
            });

            labelData.push(labelDatum);

            nodeData.push({
                series: this,
                datum,
                datumIndex,
                index: datumIndex,
                xValue,
                yValue,
                x,
                y,
                top,
                right,
                bottom,
                left,
                label: labelDatum,
                enabled,
                midPoint: {
                    x,
                    y,
                },
                style: this.getItemStyle({ datumIndex, datum }, false),
            });

            yStart = yEnd;
        }

        return {
            itemId: seriesId,
            nodeData,
            labelData,
            stageLabelData,
            bounds,
        };
    }

    private labelStylerParams(): RequireOptional<AgPyramidSeriesLabelFormatterParams> {
        const { stageKey, valueKey } = this.properties;
        return { stageKey, valueKey };
    }

    private routesThroughEngine(): boolean {
        const { label } = this.properties;
        const alwaysShow = label.collision.alwaysShow;
        return barLabelRoutesThroughEngine(undefined, label.placement, alwaysShow, resolveLabelFit(label, !alwaysShow));
    }

    private createLabelContext(horizontal: boolean): PyramidLabelContext {
        const { label } = this.properties;
        const reportedPlacements = resolveFunnelPlacements(label.placement, 'inside-center');
        return {
            placements: reportedPlacements.map((placement) => FUNNEL_TO_BAR_PLACEMENT[placement]),
            reportedPlacements,
            ...pyramidPlacementAxes(horizontal),
            routesThroughEngine: this.routesThroughEngine(),
            plotRegion: this.resolveLabelPlotRegion(label.collision),
            labelFit: resolveLabelFit(label, !label.collision.alwaysShow),
        };
    }

    private createLabelDatum({
        labelContext,
        stage,
        horizontal,
        text,
        datum,
        datumIndex,
        visible,
    }: {
        labelContext: PyramidLabelContext;
        stage: { x: number; y: number; top: number; right: number; bottom: number; left: number };
        horizontal: boolean;
        text: NormalisedTextOrSegments;
        datum: unknown;
        datumIndex: number;
        visible: boolean;
    }): PyramidNodeLabelDatum {
        const { label } = this.properties;
        const trapezoid = pyramidStageTrapezoid(stage, horizontal);
        const stageBox = trapezoidBox(trapezoid);

        const labelDatum: PyramidNodeLabelDatum = {
            x: stage.x,
            y: stage.y,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            textAlign: 'center',
            textBaseline: 'middle',
            text,
            ownBox: stageBox,
            hidden: false,
            datum,
            datumIndex,
            series: this,
            visible,
        };

        if (!label.enabled) return labelDatum;

        const measured = measureLabelText(text, label);
        const resolveStyle = createBarCandidateStyleResolver(
            this,
            label,
            this.labelStylerParams(),
            undefined,
            (placement) => labelContext.reportedPlacements[labelContext.placements.indexOf(placement)]
        );
        const spanOf = (size: { width: number; height: number }) => (trapezoid.vertical ? size.height : size.width);
        const buildCandidates = (index: number, rect: BoxBounds) =>
            buildBarLabelCandidates<AgPyramidSeriesLabelFormatterParams, AgFunnelSeriesLabelPlacement>({
                isUpward: labelContext.isUpward,
                isVertical: labelContext.isVertical,
                placements: [labelContext.placements[index]],
                reportedPlacements: [labelContext.reportedPlacements[index]],
                orientations: ['horizontal'],
                spacing: label.spacing,
                label,
                textWidth: measured.width,
                textHeight: measured.height,
                rect,
                hideable: !label.collision.alwaysShow,
                plotRegion: labelContext.plotRegion,
                fitted: labelContext.labelFit != null,
                shapeAt: (anchor) => trapezoidFitRegion(trapezoid, trapezoid.vertical ? anchor.y : anchor.x),
                text,
                styleDatum: labelDatum,
                resolveStyle,
            });
        // An inside label is bound by the stage width across the band its own text occupies; an outside one
        // by the stage's bounding box, so a tapering end does not pull it into the shape. Narrowing the
        // cross axis cannot move an anchor, so an inside placement's first pass only locates that band.
        const placementCandidates = (index: number, spanExtent: number) => {
            const located = buildCandidates(index, stageBox);
            if (located.length === 0 || !labelContext.placements[index].startsWith('inside')) return located;
            const [bandLo, bandHi] = pyramidLabelBand(trapezoid, located[0].anchor, spanExtent);
            return buildCandidates(index, trapezoidBandRect(trapezoid, bandLo, bandHi));
        };
        const candidates = labelContext.placements.flatMap((_, index) => placementCandidates(index, spanOf(measured)));

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
            const anchorSpan = trapezoid.vertical ? labelDatum.y : labelDatum.x;
            const region = trapezoidFitRegion(trapezoid, anchorSpan);
            let fitted = fitLabelToContainerAutoSize(
                text,
                withFitRegion(labelContext.labelFit, region),
                label,
                first?.fitTo?.container
            );
            if (labelContext.labelFit != null && first != null) {
                // Wrapping can leave the text taller than the band its width was measured across, which a
                // tapering stage has less room for.
                const fittedSpan = spanOf(measureLabelText(fitted.text, fontWithSize(label, fitted.fontSize)));
                if (fittedSpan > spanOf(measured)) {
                    const refitted = placementCandidates(0, fittedSpan);
                    fitted = fitLabelToContainerAutoSize(
                        text,
                        labelContext.labelFit,
                        label,
                        refitted[0]?.fitTo?.container
                    );
                }
            }
            labelDatum.fittedText = fitted.text;
            labelDatum.fittedFontSize = fitted.fontSize;
        }

        return labelDatum;
    }

    private labelPlacementStyle(placement: AgFunnelSeriesLabelPlacement | undefined) {
        const { label } = this.properties;
        return placement == null ? undefined : pickPlacementStyle(label, toResolvedFunnelPlacement(placement));
    }

    getLabelObstacles(): LabelObstacle[] | undefined {
        const { label, stageLabel, direction } = this.properties;
        const horizontal = direction === 'horizontal';
        const labelBox = expandPlacementLabelBoxExtent(label);
        const stageLabelBox = expandLabelBoxExtent(stageLabel);
        const obstacles: LabelObstacle[] = [];
        for (const nodeDatum of this.contextNodeData?.nodeData ?? []) {
            const trapezoid = pyramidStageTrapezoid(nodeDatum, horizontal);
            obstacles.push({
                kind: 'custom',
                box: trapezoidBox(trapezoid),
                overlaps: (box) => trapezoidOverlapsBox(trapezoid, box),
                category: 'seriesItem',
            });
        }
        const stageLabels = bakedLabelObstacles(this.contextNodeData?.stageLabelData, (labelDatum) => ({
            label: labelDatum.visible ? { ...labelDatum, rotation: 0 } : undefined,
            config: stageLabel,
            box: stageLabelBox,
        }));
        const valueLabels =
            this.usesPlacedLabels || !label.enabled
                ? undefined
                : bakedLabelObstacles(this.contextNodeData?.labelData, (labelDatum) => ({
                      label: labelDatum.visible ? labelDatum : undefined,
                      config: fontWithSize(label, labelDatum.fittedFontSize),
                      box: labelBox,
                  }));
        for (const baked of [stageLabels, valueLabels]) {
            if (baked != null) obstacles.push(...baked);
        }
        return obstacles.length > 0 ? obstacles : undefined;
    }

    override getLabelData(): PointLabelDatum[] {
        const { label } = this.properties;
        if (!this.usesPlacedLabels || !label.enabled) return [];
        const box = expandPlacementLabelBoxExtent(label);
        const collideWith = label.collision.resolveCollideWith();
        const threshold = label.collision.threshold ?? 0;
        const fitFor = resolveLabelFitDescriptors(label, box, !label.collision.alwaysShow);
        const stylerParams = this.labelStylerParams();
        const data: PointLabelDatum[] = [];
        for (const labelDatum of this.contextNodeData?.labelData ?? []) {
            if (labelDatum.text === '' || labelDatum.candidates == null) continue;
            // The styler is promised the funnel placement, not the bar placement the geometry runs on, so
            // this datum's own placement is what the resolver reports back.
            const reported = labelDatum.placement ?? 'inside-center';
            const styled = styledBarLabelBox(
                createBarCandidateStyleResolver(this, label, stylerParams, undefined, () => reported),
                labelDatum,
                FUNNEL_TO_BAR_PLACEMENT[reported],
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

    override updatePlacedLabelData(placed: PlacedLabel<PyramidNodeLabelDatum>[]) {
        applyBarLabelOrientation(placed);
        applyPlacedBarLabelVisibility(this.contextNodeData?.labelData, placed, (labelDatum) => labelDatum);
        this.refreshPlacedLabelNodes();
    }

    // The highlight label is copied from its node datum, so it is rebuilt here to pick up whatever the
    // placement engine wrote back before both selections are re-rendered.
    private refreshPlacedLabelNodes() {
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight() as PyramidNodeDatum | undefined;
        const highlightItem =
            highlightedDatum?.series === this && highlightedDatum.datum != null ? highlightedDatum : undefined;
        this.highlightLabelSelection = this.highlightLabelSelection.update(
            this.getHighlightLabelData([], highlightItem) ?? []
        );
        this.itemLabelGroup.batchedUpdate(() => {
            this.updateValueLabelNodes({ labelSelection: this.labelSelection, isHighlight: false });
        });
        this.highlightLabelGroup.batchedUpdate(() => {
            this.updateValueLabelNodes({ labelSelection: this.highlightLabelSelection, isHighlight: true });
        });
    }

    updateSelections() {
        if (this.nodeDataRefresh) {
            this.contextNodeData = this.createNodeData();
            this.nodeDataRefresh = false;
        }
        this.usesPlacedLabels = this.routesThroughEngine();
    }

    override update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }) {
        this.checkResize(seriesRect);

        const {
            datumSelection,
            labelSelection,
            stageLabelSelection,
            highlightDatumSelection,
            highlightLabelSelection,
        } = this;

        this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        let highlightedDatum: PyramidNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];
        const stageLabelData = this.contextNodeData?.stageLabelData ?? [];

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumStyles({ datumSelection, isHighlight: false });
        this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = this.updateLabelSelection({ labelData, labelSelection });
        this.updateValueLabelNodes({ labelSelection: this.labelSelection, isHighlight: false });

        this.stageLabelSelection = this.updateStageLabelSelection({ stageLabelData, stageLabelSelection });
        this.updateStageLabelNodes({
            labelSelection: stageLabelSelection,
            labelProperties: this.properties.stageLabel,
            checkActiveHighlight: true,
        });

        const highlightLabelData = this.getHighlightLabelData(labelData, highlightedDatum) ?? [];
        this.highlightLabelSelection = highlightLabelSelection.update(highlightLabelData);
        this.updateValueLabelNodes({ labelSelection: this.highlightLabelSelection, isHighlight: true });

        this.highlightDatumSelection = this.updateDatumSelection({
            nodeData: highlightedDatum == null ? [] : [highlightedDatum],
            datumSelection: highlightDatumSelection,
        });
        this.updateDatumStyles({ datumSelection: highlightDatumSelection, isHighlight: true });
        this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });

        this.animationState.transition('update');
    }

    private updateDatumSelection(opts: {
        nodeData: PyramidNodeDatum[];
        datumSelection: _ModuleSupport.Selection<PyramidNodeDatum, FunnelConnector<PyramidNodeDatum>>;
    }) {
        return opts.datumSelection.update(opts.nodeData);
    }

    protected getItemStyle(
        { datumIndex, datum }: Partial<PyramidNodeDatum>,
        isHighlight: boolean
    ): Required<NormalisedPyramidSeriesStyle> {
        const { properties } = this;
        const { itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const selectionStyle = this.getSelectionStyle(datumIndex);
        const baseStyle = mergeDefaults(selectionStyle, highlightStyle, properties.getStyle(datumIndex));
        let style = baseStyle as Required<NormalisedPyramidSeriesStyle>; // refs resolved at runtime

        if (itemStyler != null && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, style);
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<NormalisedPyramidSeriesStyle>
    ) {
        const { id: seriesId, properties } = this;
        const { stageKey, valueKey } = properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const selectionState = this.getSelectionStateString(datumIndex);
        const candidateState = this.getCandidateStateString(datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            stageKey,
            valueKey,
            highlightState,
            selectionState,
            candidateState,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgPyramidSeriesItemStylerParams<unknown, unknown>>;
    }

    private updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<PyramidNodeDatum, FunnelConnector<PyramidNodeDatum>>;
        isHighlight: boolean;
    }) {
        datumSelection.each((_, nodeDatum) => {
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight);
        });
    }

    private updateDatumNodes({
        datumSelection,
    }: {
        datumSelection: _ModuleSupport.Selection<PyramidNodeDatum, FunnelConnector<PyramidNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { properties } = this;
        const { shadow } = properties;

        const bounds = this.contextNodeData?.bounds;
        const fillBBox: _ModuleSupport.ShapeFillBBox | undefined = bounds
            ? { series: bounds, axis: bounds }
            : undefined;

        datumSelection.each((connector, nodeDatum) => {
            connector.setStyleProperties(nodeDatum.style, fillBBox);

            applyPyramidDatum(connector, nodeDatum);

            connector.fillShadow = shadow;
        });
    }

    private updateLabelSelection(opts: {
        labelData: PyramidNodeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<PyramidNodeLabelDatum, _ModuleSupport.Text<PyramidNodeLabelDatum>>;
    }) {
        return opts.labelSelection.update(this.properties.label.enabled ? opts.labelData : []);
    }

    private updateStageLabelSelection(opts: {
        stageLabelData: PyramidStageLabelDatum[];
        stageLabelSelection: _ModuleSupport.Selection<
            PyramidStageLabelDatum,
            _ModuleSupport.Text<PyramidStageLabelDatum>
        >;
    }) {
        return opts.stageLabelSelection.update(opts.stageLabelData);
    }

    private updateValueLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<PyramidNodeLabelDatum, _ModuleSupport.Text<PyramidNodeLabelDatum>>;
        isHighlight: boolean;
    }) {
        const { label } = this.properties;
        const params = this.labelStylerParams();
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const { labelSelection, isHighlight } = opts;

        labelSelection.each((textNode, labelDatum) => {
            if (labelDatum.hidden) {
                textNode.visible = false;
                return;
            }
            const placementStyle = this.labelPlacementStyle(labelDatum.placement);
            const highlightStyle = this.getHighlightStyle(isHighlight, labelDatum.datumIndex);
            // Text opacity carries the label's own box fill opacity as well as the highlight dimming.
            const opacity = (highlightStyle.opacity ?? 1) * (placementStyle?.fillOpacity ?? label.fillOpacity ?? 1);
            textNode.opacity = opacity;
            textNode.fillOpacity = opacity;
            updateLabelNode(
                this,
                textNode,
                params,
                label,
                labelDatum,
                { isHighlight, activeHighlight },
                undefined,
                placementStyle,
                { placement: labelDatum.placement, orientation: 'horizontal' }
            );
            // A stage the legend disabled keeps its label hidden wherever the shared helper drew one.
            if (!labelDatum.visible && !isHighlight) {
                textNode.visible = false;
            }
        });
    }

    private updateStageLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<PyramidStageLabelDatum, _ModuleSupport.Text<PyramidStageLabelDatum>>;
        labelProperties: _ModuleSupport.Label<AgPyramidSeriesLabelFormatterParams>;
        isHighlight?: boolean;
        checkActiveHighlight?: boolean;
    }) {
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const { labelSelection, labelProperties, isHighlight = false, checkActiveHighlight = false } = opts;

        labelSelection.each((label, nodeDatum, datumIndex) => {
            const { visible, x, y, text, textAlign, textBaseline } = nodeDatum;
            const datumIsHighlighted =
                isHighlight || (checkActiveHighlight && activeHighlight?.datumIndex === datumIndex);
            const highlightStyle = this.getHighlightStyle(datumIsHighlighted, datumIndex);

            const style = getLabelStyles(
                this,
                undefined,
                this.properties,
                labelProperties,
                datumIsHighlighted,
                activeHighlight
            );

            const { color: fill, fontSize, fontStyle, fontWeight, fontFamily } = style;
            label.visible = visible && style.enabled === true;
            label.x = x;
            label.y = y;
            label.text = text;
            label.fill = fill;
            label.opacity = (highlightStyle.opacity ?? 1) * (style.fillOpacity ?? 1);
            label.fillOpacity = (highlightStyle.opacity ?? 1) * (style.fillOpacity ?? 1);
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textAlign = textAlign;
            label.textBaseline = textBaseline;
            label.setBoxing(style);
        });
    }

    protected getHighlightLabelData(
        _labelData: PyramidNodeLabelDatum[],
        highlightedItem?: PyramidNodeDatum
    ): PyramidNodeLabelDatum[] | undefined {
        if (highlightedItem?.label) {
            return [{ ...highlightedItem.label }];
        }

        return undefined;
    }

    protected override computeFocusBounds(
        opts: _ModuleSupport.PickFocusInputs
    ): _ModuleSupport.BBox | _ModuleSupport.Path | undefined {
        const datum = this.getNodeData()?.[opts.datumIndex];
        if (datum === undefined) return;

        for (const node of this.datumSelection) {
            if (node.datum === datum) {
                return node.node;
            }
        }
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { stageKey, valueKey, tooltip } = properties;

        if (!dataModel || !processedData) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveColumnById<PyramidStageValue>(this, 'xValue', processedData, 'object')[
            datumIndex
        ];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData, 'mixed-numeric')[datumIndex];

        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return;

        const label = this.getLabelText<AgPyramidSeriesLabelFormatterParams>(
            xValue,
            datum,
            stageKey,
            'x',
            dataModel.getDomain(this, 'xValue', 'value', processedData).domain,
            this.properties.stageLabel,
            { datum, value: xValue, stageKey, valueKey }
        );

        const format = this.getItemStyle({ datumIndex, datum }, false);
        return this.formatTooltipWithContext(
            tooltip,
            {
                symbol: this.legendItemSymbol(datumIndex),
                data: [{ label: toPlainText(label), value: toPlainText(String(yValue)) }],
            },
            {
                seriesId,
                datum,
                title: undefined,
                stageKey,
                valueKey,
                ...format,
            }
        );
    }

    override getSeriesDomain(): DomainWithMetadata<any> {
        return { domain: [Number.NaN, Number.NaN] };
    }

    override getSeriesRange(): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override pickNodeClosestDatum({ x, y }: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum | undefined;
        let minNode: _ModuleSupport.Node<unknown> | undefined;

        this.datumSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
                minNode = node;
            }
        });

        return minDatum == null || minNode == null
            ? undefined
            : { datum: minDatum, distance: Math.sqrt(minDistanceSquared), target: minNode };
    }

    private legendItemSymbol(datumIndex: number) {
        const { fills, strokes, strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset } = this.properties;
        const fill = (fills[datumIndex] ?? 'black') as NormalisedColorType; // refs resolved at runtime
        const stroke = strokes[datumIndex] ?? 'black';
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

    override getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            processedData,
            dataModel,
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        if (!dataModel || !processedData || legendType !== 'category') {
            return [];
        }

        const { showInLegend } = this.properties;
        const stageValues = dataModel.resolveColumnById<PyramidStageValue>(this, `xValue`, processedData, 'object');

        return (processedData.dataSources.get(this.id)?.data ?? [])
            .map((datum, datumIndex): _ModuleSupport.CategoryLegendDatum | undefined => {
                const stageValue = stageValues[datumIndex];
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
                    hideInLegend: !showInLegend,
                };
            })
            .filter((datum): datum is _ModuleSupport.CategoryLegendDatum => datum != null);
    }

    protected animateReset() {
        this.ctx.animationManager.skipCurrentBatch();
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
    }

    private animateEmptyUpdateReady() {
        const { datumSelection, labelSelection, properties } = this;

        const fns = preparePyramidAnimationFunctions(properties.direction);
        fromToMotion(this.id, 'nodes', this.ctx.animationManager, [datumSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.selection.enabled ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
