import type { AgAxisBoundSeries, CssColor, FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { ModuleInstance } from '../../module/baseModule';
import type { ModuleContext, ModuleContextWithParent } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import type { AxisOptionModule } from '../../module/optionsModule';
import type { FromToDiff } from '../../motion/fromToMotion';
import { fromToMotion } from '../../motion/fromToMotion';
import { resetMotion } from '../../motion/resetMotion';
import { ContinuousScale } from '../../scale/continuousScale';
import { LogScale } from '../../scale/logScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Group, TransformableGroup } from '../../scene/group';
import { Matrix } from '../../scene/matrix';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { type TextSizeProperties, TransformableText } from '../../scene/shape/text';
import { Translatable } from '../../scene/transformable';
import type { PlacedLabelDatum } from '../../scene/util/labelPlacement';
import { axisLabelsOverlap } from '../../scene/util/labelPlacement';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { areArrayNumbersEqual } from '../../util/equal';
import { createId } from '../../util/id';
import { jsonDiff } from '../../util/json';
import { Logger } from '../../util/logger';
import { clamp, countFractionDigits, findMinMax, findRangeExtent, round } from '../../util/number';
import { ObserveChanges } from '../../util/proxy';
import { StateMachine } from '../../util/stateMachine';
import { createIdsGenerator } from '../../util/tempUtils';
import { CachedTextMeasurerPool, type TextMeasurer, TextUtils } from '../../util/textMeasurer';
import { BOOLEAN, OBJECT, STRING_ARRAY, Validate } from '../../util/validation';
import { Caption } from '../caption';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import type { AxisGroups, ChartAxis, ChartAxisLabel, ChartAxisLabelFlipFlag } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import type { CrossLine } from '../crossline/crossLine';
import type { AnimationManager } from '../interaction/animationManager';
import { calculateLabelBBox, calculateLabelRotation, getLabelSpacing, getTextAlign, getTextBaseline } from '../label';
import type { AxisLayout } from '../layout/layoutManager';
import type { ISeries } from '../series/seriesTypes';
import { ZIndexMap } from '../zIndexMap';
import { AxisGridLine } from './axisGridLine';
import { AxisInterval } from './axisInterval';
import { AxisLabel } from './axisLabel';
import { AxisLine } from './axisLine';
import { AxisTick, type TickInterval } from './axisTick';
import { AxisTitle } from './axisTitle';
import type { AxisLineDatum } from './axisUtil';
import {
    prepareAxisAnimationContext,
    prepareAxisAnimationFunctions,
    resetAxisGroupFn,
    resetAxisLabelSelectionFn,
    resetAxisLineSelectionFn,
    resetAxisSelectionFn,
} from './axisUtil';

type TickStrategyParams = {
    index: number;
    tickData: TickData;
    textProps: TextSizeProperties;
    labelOverlap: boolean;
    terminate: boolean;
    primaryTickCount?: number;
};

type TickStrategyResult = {
    index: number;
    tickData: TickData;
    autoRotation: number;
    terminate: boolean;
};

type TickStrategy = (params: TickStrategyParams) => TickStrategyResult;

enum TickGenerationType {
    CREATE,
    CREATE_SECONDARY,
    FILTER,
    VALUES,
}

export type TickDatum = {
    tickLabel: string;
    tick: any;
    tickId: string;
    translationY: number;
};

export type LabelNodeDatum = {
    tickId: string;
    fill?: CssColor;
    fontFamily?: FontFamily;
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    rotation: number;
    rotationCenterX: number;
    text: string;
    textAlign?: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    visible: boolean;
    x: number;
    y: number;
    translationY: number;
    range: number[];
};

type TickData = { rawTicks: any[]; fractionDigits: number; ticks: TickDatum[]; labelCount: number };

interface TickGenerationParams {
    primaryTickCount?: number;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    labelX: number;
    sideFlag: ChartAxisLabelFlipFlag;
}

interface TickGenerationResult {
    tickData: TickData;
    primaryTickCount?: number;
    combinedRotation: number;
    textBaseline: CanvasTextBaseline;
    textAlign: CanvasTextAlign;
    labelData: PlacedLabelDatum[];
}

type AxisAnimationState = 'empty' | 'ready';
type AxisAnimationEvent = { reset: undefined; resize: undefined; update: FromToDiff };

export type AxisModuleMap = ModuleMap<AxisOptionModule, ModuleInstance, ModuleContextWithParent<AxisContext>>;

class TranslatableLine extends Translatable(Line) {}

/**
 * A general purpose linear axis with no notion of orientation.
 * The axis is always rendered vertically, with horizontal labels positioned to the left
 * of the axis line by default. The axis can be {@link rotation | rotated} by an arbitrary angle,
 * so that it can be used as a top, right, bottom, left, radial or any other kind
 * of linear axis.
 * The generic `D` parameter is the type of the domain of the axis' scale.
 * The output range of the axis' scale is always numeric (screen coordinates).
 */
export abstract class Axis<S extends Scale<D, number, TickInterval<S>> = Scale<any, number, any>, D = any>
    implements ChartAxis
{
    static readonly defaultTickMinSpacing = 50;

    protected static CrossLineConstructor: new () => CrossLine<any> = CartesianCrossLine;

    readonly id = createId(this);

    @Validate(BOOLEAN)
    nice: boolean = true;

    /** Reverse the axis scale domain. */
    @Validate(BOOLEAN)
    reverse: boolean = false;

    @Validate(STRING_ARRAY)
    keys: string[] = [];

    @Validate(OBJECT)
    readonly interval = new AxisInterval();

    dataDomain: { domain: D[]; clipped: boolean } = { domain: [], clipped: false };

    get type(): string {
        return (this.constructor as any).type ?? '';
    }

    abstract get direction(): ChartAxisDirection;

    layoutConstraints: ChartAxis['layoutConstraints'] = {
        stacked: true,
        align: 'start',
        width: 100,
        unit: 'percent',
    };

    boundSeries: ISeries<unknown, unknown>[] = [];
    includeInvisibleDomains: boolean = false;

    interactionEnabled = true;

    readonly axisGroup = new TransformableGroup({ name: `${this.id}-axis` });

    protected lineNode = this.axisGroup.appendChild(new TranslatableLine({ name: `${this.id}-Axis-line` }));
    protected readonly tickLineGroup = this.axisGroup.appendChild(new Group({ name: `${this.id}-Axis-tick-lines` }));
    protected readonly tickLabelGroup = this.axisGroup.appendChild(new Group({ name: `${this.id}-Axis-tick-labels` }));
    protected readonly labelGroup = new Group({
        name: `${this.id}-Labels`,
        zIndex: ZIndexMap.SERIES_ANNOTATION,
    });

    readonly gridGroup = new TransformableGroup({ name: `${this.id}-Axis-grid`, zIndex: ZIndexMap.AXIS_GRID });
    protected readonly gridLineGroup = this.gridGroup.appendChild(new Group({ name: `${this.id}-gridLines` }));

    protected readonly crossLineRangeGroup = new TransformableGroup({
        name: `${this.id}-CrossLines-Range`,
        zIndex: ZIndexMap.SERIES_CROSSLINE_RANGE,
    });
    protected readonly crossLineLineGroup = new TransformableGroup({
        name: `${this.id}-CrossLines-Line`,
        zIndex: ZIndexMap.SERIES_CROSSLINE_LINE,
    });
    protected readonly crossLineLabelGroup = new TransformableGroup({
        name: `${this.id}-CrossLines-Label`,
        zIndex: ZIndexMap.SERIES_LABEL,
    });

    protected tickLineGroupSelection = Selection.select(this.tickLineGroup, TranslatableLine, false);
    protected tickLabelGroupSelection = Selection.select<TransformableText, LabelNodeDatum>(
        this.tickLabelGroup,
        TransformableText,
        false
    );
    protected gridLineGroupSelection = Selection.select(this.gridLineGroup, TranslatableLine, false);

    private _crossLines: CrossLine[] = [];
    set crossLines(value: CrossLine[]) {
        const { CrossLineConstructor } = this.constructor as typeof Axis;
        this._crossLines.forEach((crossLine) => this.detachCrossLine(crossLine));
        this._crossLines = value.map((crossLine) => {
            const instance = new CrossLineConstructor();
            instance.set(crossLine);
            return instance;
        });
        this._crossLines.forEach((crossLine) => {
            this.attachCrossLine(crossLine);
            this.initCrossLine(crossLine);
        });
    }
    get crossLines() {
        return this._crossLines;
    }

    readonly line = new AxisLine();
    readonly tick = new AxisTick();
    readonly gridLine = new AxisGridLine();
    readonly label = this.createLabel();

    protected defaultTickMinSpacing: number = Axis.defaultTickMinSpacing;

    readonly translation = { x: 0, y: 0 };
    rotation: number = 0; // axis rotation angle in degrees

    protected readonly layout: Pick<AxisLayout, 'label'> = {
        label: {
            fractionDigits: 0,
            padding: this.label.padding,
            format: this.label.format,
        },
    };

    protected axisContext?: AxisContext;

    protected animationManager: AnimationManager;
    private readonly animationState: StateMachine<AxisAnimationState, AxisAnimationEvent>;

    private readonly destroyFns: Array<() => void> = [];

    constructor(
        protected readonly moduleCtx: ModuleContext,
        readonly scale: S
    ) {
        this.range = this.scale.range.slice() as [number, number];
        this.crossLines.forEach((crossLine) => this.initCrossLine(crossLine));

        this.axisGroup.appendChild(this.title.caption.node);

        this.animationManager = moduleCtx.animationManager;
        this.animationState = new StateMachine<AxisAnimationState, AxisAnimationEvent>('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: () => this.resetSelectionNodes(),
                },
                reset: 'empty',
            },
            ready: {
                update: (data: FromToDiff) => this.animateReadyUpdate(data),
                resize: () => this.resetSelectionNodes(),
                reset: 'empty',
            },
        });

        let previousSize: { width: number; height: number } | undefined = undefined;
        this.destroyFns.push(
            this.title.caption.registerInteraction(this.moduleCtx, 'afterend'),
            moduleCtx.layoutManager.addListener('layout:complete', (e) => {
                // Fire resize animation action if chart canvas size changes.
                if (previousSize != null && jsonDiff(e.chart, previousSize) != null) {
                    this.animationState.transition('resize');
                }
                previousSize = { ...e.chart };
            })
        );
    }

    resetAnimation(phase: ChartAnimationPhase) {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        }
    }

    private attachCrossLine(crossLine: CrossLine) {
        this.crossLineRangeGroup.appendChild(crossLine.rangeGroup);
        this.crossLineLineGroup.appendChild(crossLine.lineGroup);
        this.crossLineLabelGroup.appendChild(crossLine.labelGroup);
    }

    private detachCrossLine(crossLine: CrossLine) {
        this.crossLineRangeGroup.removeChild(crossLine.rangeGroup);
        this.crossLineLineGroup.removeChild(crossLine.lineGroup);
        this.crossLineLabelGroup.removeChild(crossLine.labelGroup);
    }

    destroy() {
        this.moduleMap.destroy();
        this.destroyFns.forEach((f) => f());
    }

    protected updateRange() {
        const { range: rr, visibleRange: vr, scale } = this;
        const span = (rr[1] - rr[0]) / (vr[1] - vr[0]);
        const shift = span * vr[0];
        const start = rr[0] - shift;

        scale.setVisibleRange?.(vr);
        scale.range = [start, start + span];
        this.crossLines.forEach((crossLine) => {
            crossLine.clippedRange = [rr[0], rr[1]];
        });
    }

    setCrossLinesVisible(visible: boolean) {
        this.crossLineRangeGroup.visible = visible;
        this.crossLineLineGroup.visible = visible;
        this.crossLineLabelGroup.visible = visible;
    }

    attachAxis(groups: AxisGroups) {
        groups.gridNode.appendChild(this.gridGroup);
        groups.axisNode.appendChild(this.axisGroup);
        groups.labelNode.appendChild(this.labelGroup);
        groups.crossLineRangeNode.appendChild(this.crossLineRangeGroup);
        groups.crossLineLineNode.appendChild(this.crossLineLineGroup);
        groups.crossLineLabelNode.appendChild(this.crossLineLabelGroup);
    }

    detachAxis(groups: AxisGroups) {
        groups.gridNode.removeChild(this.gridGroup);
        groups.axisNode.removeChild(this.axisGroup);
        groups.labelNode.removeChild(this.labelGroup);
        groups.crossLineRangeNode.removeChild(this.crossLineRangeGroup);
        groups.crossLineLineNode.removeChild(this.crossLineLineGroup);
        groups.crossLineLabelNode.removeChild(this.crossLineLabelGroup);
    }

    attachLabel(axisLabelNode: Node) {
        this.labelGroup.append(axisLabelNode);
    }

    range: [number, number] = [0, 1];
    visibleRange: [number, number] = [0, 1];

    /**
     * Checks if a point or an object is in range.
     * @param x A point (or object's starting point).
     * @param tolerance Expands the range on both ends by this amount.
     */
    inRange(x: number, tolerance = 0): boolean {
        const [min, max] = findMinMax(this.range);
        return x >= min - tolerance && x <= max + tolerance;
    }

    protected datumFormatter?: (datum: any) => string;
    protected labelFormatter?: (datum: any) => string;
    protected onFormatChange(ticks: any[], fractionDigits: number, _domain: any[], format?: string) {
        const { scale } = this;
        const logScale = scale instanceof LogScale;

        const defaultFormatter = (formatOffset: number) =>
            logScale
                ? String
                : (x: any) => (typeof x === 'number' ? x.toFixed(fractionDigits + formatOffset) : String(x));

        if (format && scale && scale.tickFormat) {
            try {
                const formatter = scale.tickFormat({ ticks, specifier: format });
                this.labelFormatter = formatter;
                this.datumFormatter = formatter;
            } catch (e) {
                this.labelFormatter = defaultFormatter(0);
                this.datumFormatter = defaultFormatter(1);
                Logger.warnOnce(`the axis label format string ${format} is invalid. No formatting will be applied`);
            }
        } else {
            this.labelFormatter = defaultFormatter(0);
            this.datumFormatter = defaultFormatter(1);
        }
    }

    @Validate(OBJECT)
    readonly title = new AxisTitle();

    /**
     * The length of the grid. The grid is only visible in case of a non-zero value.
     */
    @ObserveChanges<Axis>((target, value, oldValue) => target.onGridLengthChange(value, oldValue))
    gridLength: number = 0;

    /**
     * The distance between the grid ticks and the axis ticks.
     */
    gridPadding = 0;

    /**
     * Is used to avoid collisions between axis labels and series.
     */
    seriesAreaPadding = 0;

    protected onGridLengthChange(value: number, prevValue: number) {
        // Was visible and now invisible, or was invisible and now visible.
        if (prevValue ^ value) {
            this.onGridVisibilityChange();
        }
        this.crossLines.forEach((crossLine) => this.initCrossLine(crossLine));
    }

    protected onGridVisibilityChange() {
        this.gridLineGroupSelection.clear();
    }

    protected createLabel(): ChartAxisLabel {
        return new AxisLabel();
    }

    /**
     * Creates/removes/updates the scene graph nodes that constitute the axis.
     */
    update(animated = true): number | undefined {
        if (!this.tickGenerationResult) {
            return;
        }
        const { rotation, parallelFlipRotation, regularFlipRotation } = this.calculateRotations();
        const sideFlag = this.label.getSideFlag();
        this.updatePosition();

        const lineData = this.getAxisLineCoordinates();
        const { tickData, combinedRotation, textBaseline, textAlign, primaryTickCount } = this.tickGenerationResult;
        const previousTicks = this.tickLabelGroupSelection.nodes().map((node) => node.datum.tickId);
        this.updateSelections(lineData, tickData.ticks, {
            combinedRotation,
            textAlign,
            textBaseline,
            range: this.scale.range,
        });

        if (!animated || this.animationManager.isSkipped()) {
            this.resetSelectionNodes();
        } else {
            const diff = this.calculateUpdateDiff(previousTicks, tickData);
            this.animationState.transition('update', diff);
        }

        this.updateAxisLine();
        this.updateLabels();
        this.updateVisibility();
        this.updateGridLines(sideFlag);
        this.updateTickLines();
        this.updateTitle({ anyTickVisible: tickData.ticks.length > 0 });
        this.updateCrossLines({ rotation, parallelFlipRotation, regularFlipRotation });
        this.updateLayoutState(tickData.fractionDigits);

        return primaryTickCount;
    }

    private getAxisLineCoordinates(): AxisLineDatum {
        const [min, max] = findMinMax(this.range);
        return { x: 0, y1: min, y2: max };
    }

    private getTickLineCoordinates(datum: TickDatum) {
        const sideFlag = this.label.getSideFlag();
        const x = sideFlag * this.getTickSize();
        const x1 = Math.min(0, x);
        const x2 = x1 + Math.abs(x);
        const y = datum.translationY;
        return { x1, x2, y };
    }

    private getTickLabelProps(
        datum: TickDatum,
        params: {
            combinedRotation: number;
            textBaseline: CanvasTextBaseline;
            textAlign: CanvasTextAlign;
            range: number[];
        }
    ): LabelNodeDatum {
        const { label } = this;
        const { combinedRotation, textBaseline, textAlign, range } = params;
        const text = datum.tickLabel;
        const sideFlag = label.getSideFlag();
        const labelX = sideFlag * (this.getTickSize() + label.padding + this.seriesAreaPadding);
        const visible = text !== '' && text != null;
        return {
            tickId: datum.tickId,
            translationY: datum.translationY,
            fill: label.color,
            fontFamily: label.fontFamily,
            fontSize: label.fontSize,
            fontStyle: label.fontStyle,
            fontWeight: label.fontWeight,
            rotation: combinedRotation,
            rotationCenterX: labelX,
            text,
            textAlign,
            textBaseline,
            visible,
            x: labelX,
            y: 0,
            range,
        };
    }

    protected getTickSize() {
        return this.tick.enabled ? this.tick.size : 6;
    }

    private setTitleProps(caption: Caption, params: { spacing: number }) {
        const { title } = this;

        if (!title.enabled) {
            caption.enabled = false;
            caption.node.visible = false;
            return;
        }

        caption.color = title.color;
        caption.fontFamily = title.fontFamily;
        caption.fontSize = title.fontSize;
        caption.fontStyle = title.fontStyle;
        caption.fontWeight = title.fontWeight;
        caption.enabled = title.enabled;
        caption.wrapping = title.wrapping;

        const titleNode = caption.node;
        const padding = (title.spacing ?? 0) + params.spacing;
        const sideFlag = this.label.getSideFlag();

        const parallelFlipRotation = normalizeAngle360(this.rotation);
        const titleRotationFlag =
            sideFlag === -1 && parallelFlipRotation > Math.PI && parallelFlipRotation < Math.PI * 2 ? -1 : 1;
        const rotation = (titleRotationFlag * sideFlag * Math.PI) / 2;
        const textBaseline = titleRotationFlag === 1 ? 'bottom' : 'top';

        const { range } = this;
        const x = Math.floor((titleRotationFlag * sideFlag * (range[0] + range[1])) / 2);
        const y = sideFlag === -1 ? Math.floor(titleRotationFlag * -padding) : Math.floor(-padding);

        const { callbackCache } = this.moduleCtx;
        const { formatter = (p) => p.defaultValue } = title;
        const text = callbackCache.call(formatter, this.getTitleFormatterParams());
        caption.text = text;

        titleNode.setProperties({ visible: true, text, textBaseline, x, y, rotation });
    }

    private tickGenerationResult: TickGenerationResult | undefined = undefined;

    calculateLayout(domain?: any[], primaryTickCount?: number): { primaryTickCount: number | undefined; bbox: BBox } {
        const { rotation, parallelFlipRotation, regularFlipRotation } = this.calculateRotations();
        const sideFlag = this.label.getSideFlag();
        const labelX = sideFlag * (this.getTickSize() + this.label.padding + this.seriesAreaPadding);

        this.updateScale(domain);

        this.tickGenerationResult = this.generateTicks({
            primaryTickCount,
            parallelFlipRotation,
            regularFlipRotation,
            labelX,
            sideFlag,
        });

        const { tickData, combinedRotation, textBaseline, textAlign, ...ticksResult } = this.tickGenerationResult;

        this.updateLayoutState(tickData.fractionDigits);

        const boxes: BBox[] = [];

        const { x, y1, y2 } = this.getAxisLineCoordinates();
        const lineBox = new BBox(
            x + Math.min(sideFlag * this.seriesAreaPadding, 0),
            y1,
            this.seriesAreaPadding,
            y2 - y1
        );
        boxes.push(lineBox);

        if (this.tick.enabled) {
            tickData.ticks.forEach((datum) => {
                const { x1, x2, y } = this.getTickLineCoordinates(datum);
                const tickLineBox = new BBox(x1, y, x2 - x1, 0);
                boxes.push(tickLineBox);
            });
        }

        if (this.label.enabled) {
            const tempText = new TransformableText();
            tickData.ticks.forEach((datum) => {
                const labelProps = this.getTickLabelProps(datum, {
                    combinedRotation,
                    textAlign,
                    textBaseline,
                    range: this.scale.range,
                });
                if (!labelProps.visible) {
                    return;
                }

                tempText.setProperties({
                    ...labelProps,
                    translationY: Math.round(datum.translationY),
                });

                const box = tempText.getBBox();
                if (box) {
                    boxes.push(box);
                }
            });
        }

        if (this.title?.enabled) {
            const caption = new Caption();
            const spacing = BBox.merge(boxes).width;
            this.setTitleProps(caption, { spacing });
            const titleBox = caption.node.getBBox();
            if (titleBox) {
                boxes.push(titleBox);
            }
        }

        const bbox = BBox.merge(boxes);
        const transformedBBox = this.getTransformBox(bbox);
        const anySeriesActive = this.isAnySeriesActive();

        this.crossLines.forEach((crossLine) => {
            crossLine.sideFlag = -sideFlag as ChartAxisLabelFlipFlag;
            crossLine.direction = rotation === -Math.PI / 2 ? ChartAxisDirection.X : ChartAxisDirection.Y;
            if (crossLine instanceof CartesianCrossLine) {
                crossLine.label.parallel ??= this.label.parallel;
            }
            crossLine.parallelFlipRotation = parallelFlipRotation;
            crossLine.regularFlipRotation = regularFlipRotation;
            crossLine.calculateLayout?.(anySeriesActive, this.reverse);
        });

        return {
            primaryTickCount: ticksResult.primaryTickCount,
            bbox: transformedBBox,
        };
    }

    private updateLayoutState(fractionDigits: number) {
        this.layout.label = {
            fractionDigits: fractionDigits,
            padding: this.label.padding,
            format: this.label.format,
        };
    }

    protected getTransformBox(bbox: BBox) {
        const matrix = new Matrix();
        const { rotation, translationX, translationY } = this.getAxisTransform();
        Matrix.updateTransformMatrix(matrix, 1, 1, rotation, translationX, translationY);
        return matrix.transformBBox(bbox);
    }

    setDomain(domain: D[]) {
        this.dataDomain = this.normaliseDataDomain(domain);
        if (this.reverse) {
            this.dataDomain.domain.reverse();
        }
        this.scale.domain = this.dataDomain.domain;
    }

    updateScale(domain?: any[]) {
        if (domain) {
            this.setDomain(domain);
        } else {
            this.calculateDomain();
        }

        this.updateRange();
        this.scale.interval = this.interval.step;

        if (ContinuousScale.is(this.scale)) {
            this.scale.nice = this.nice;
            this.scale.update();
        }
    }

    private calculateRotations() {
        const rotation = toRadians(this.rotation);
        // When labels are parallel to the axis line, the `parallelFlipFlag` is used to
        // flip the labels to avoid upside-down text, when the axis is rotated
        // such that it is in the right hemisphere, i.e. the angle of rotation
        // is in the [0, π] interval.
        // The rotation angle is normalized, so that we have an easier time checking
        // if it's in the said interval. Since the axis is always rendered vertically
        // and then rotated, zero rotation means 12 (not 3) o-clock.
        // -1 = flip
        //  1 = don't flip (default)
        const parallelFlipRotation = normalizeAngle360(rotation);
        const regularFlipRotation = normalizeAngle360(rotation - Math.PI / 2);
        return { rotation, parallelFlipRotation, regularFlipRotation };
    }

    private generateTicks({
        primaryTickCount,
        parallelFlipRotation,
        regularFlipRotation,
        labelX,
        sideFlag,
    }: TickGenerationParams): TickGenerationResult {
        const {
            scale,
            interval: { minSpacing, maxSpacing },
            label: { parallel, rotation, fontFamily, fontSize, fontStyle, fontWeight },
        } = this;

        const secondaryAxis = primaryTickCount !== undefined;

        const { defaultRotation, configuredRotation, parallelFlipFlag, regularFlipFlag } = calculateLabelRotation({
            rotation,
            parallel,
            regularFlipRotation,
            parallelFlipRotation,
        });

        const initialRotation = configuredRotation + defaultRotation;
        const labelMatrix = new Matrix();

        const { maxTickCount } = this.estimateTickCount({ minSpacing, maxSpacing });

        const continuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        let textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);
        const textBaseline = getTextBaseline(parallel, configuredRotation, sideFlag, parallelFlipFlag);
        const font = TextUtils.toFontString({ fontFamily, fontSize, fontStyle, fontWeight });
        const textMeasurer = CachedTextMeasurerPool.getMeasurer({ font });

        const textProps: TextSizeProperties = {
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            textBaseline,
            textAlign,
        };

        let tickData: TickData = {
            rawTicks: [],
            fractionDigits: 0,
            ticks: [],
            labelCount: 0,
        };

        let index = 0;
        let autoRotation = 0;
        let labelOverlap = true;
        let labelData: PlacedLabelDatum[] = [];
        let terminate = false;
        while (labelOverlap && index <= maxIterations) {
            if (terminate) {
                break;
            }
            autoRotation = 0;
            textAlign = getTextAlign(parallel, configuredRotation, 0, sideFlag, regularFlipFlag);

            const tickStrategies = this.getTickStrategies({ secondaryAxis, index });

            for (const strategy of tickStrategies) {
                ({ tickData, index, autoRotation, terminate } = strategy({
                    index,
                    tickData,
                    textProps,
                    labelOverlap,
                    terminate,
                    primaryTickCount,
                }));

                const rotated = configuredRotation !== 0 || autoRotation !== 0;
                const labelRotation = initialRotation + autoRotation;
                const labelSpacing = getLabelSpacing(this.label.minSpacing, rotated);
                Matrix.updateTransformMatrix(labelMatrix, 1, 1, labelRotation, 0, 0);

                textAlign = getTextAlign(parallel, configuredRotation, autoRotation, sideFlag, regularFlipFlag);
                labelData = this.createLabelData(tickData.ticks, labelX, labelMatrix, textMeasurer);
                labelOverlap = this.label.avoidCollisions ? axisLabelsOverlap(labelData, labelSpacing) : false;
            }
        }

        const combinedRotation = defaultRotation + configuredRotation + autoRotation;

        if (!secondaryAxis && tickData.rawTicks.length > 0) {
            primaryTickCount = tickData.rawTicks.length;
        }

        return { tickData, primaryTickCount, combinedRotation, textBaseline, textAlign, labelData };
    }

    private getTickStrategies({
        index: iteration,
        secondaryAxis,
    }: {
        index: number;
        secondaryAxis: boolean;
    }): TickStrategy[] {
        const { scale, label } = this;
        const { minSpacing } = this.interval;
        const continuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const avoidLabelCollisions = label.enabled && label.avoidCollisions;
        const filterTicks = !continuous && iteration !== 0 && avoidLabelCollisions;
        const autoRotate = label.autoRotate === true && label.rotation === undefined;

        const strategies: TickStrategy[] = [];
        let tickGenerationType: TickGenerationType;
        if (this.interval.values) {
            tickGenerationType = TickGenerationType.VALUES;
        } else if (secondaryAxis) {
            tickGenerationType = TickGenerationType.CREATE_SECONDARY;
        } else if (filterTicks) {
            tickGenerationType = TickGenerationType.FILTER;
        } else {
            tickGenerationType = TickGenerationType.CREATE;
        }

        const tickGenerationStrategy = ({ index, tickData, primaryTickCount, terminate }: TickStrategyParams) =>
            this.createTickData(tickGenerationType, index, tickData, terminate, primaryTickCount);

        strategies.push(tickGenerationStrategy);

        if (!continuous && !isNaN(minSpacing)) {
            const tickFilterStrategy = ({ index, tickData, primaryTickCount, terminate }: TickStrategyParams) =>
                this.createTickData(TickGenerationType.FILTER, index, tickData, terminate, primaryTickCount);
            strategies.push(tickFilterStrategy);
        }

        if (!avoidLabelCollisions) {
            return strategies;
        }

        if (autoRotate) {
            const autoRotateStrategy = ({ index, tickData, labelOverlap, terminate }: TickStrategyParams) => ({
                index,
                tickData,
                autoRotation: this.getAutoRotation(labelOverlap),
                terminate,
            });

            strategies.push(autoRotateStrategy);
        }

        return strategies;
    }

    createTickData(
        tickGenerationType: TickGenerationType,
        index: number,
        tickData: TickData,
        terminate: boolean,
        primaryTickCount?: number
    ): TickStrategyResult {
        const { scale } = this;
        const { step, values, minSpacing, maxSpacing } = this.interval;
        const { maxTickCount, minTickCount, defaultTickCount } = this.estimateTickCount({ minSpacing, maxSpacing });

        const continuous = ContinuousScale.is(scale) || OrdinalTimeScale.is(scale);
        const maxIterations = !continuous || isNaN(maxTickCount) ? 10 : maxTickCount;

        let tickCount = continuous ? Math.max(defaultTickCount - index, minTickCount) : maxTickCount;

        const regenerateTicks =
            step === undefined &&
            values === undefined &&
            tickCount > minTickCount &&
            (continuous || tickGenerationType === TickGenerationType.FILTER);

        let unchanged = true;
        while (unchanged && index <= maxIterations) {
            const prevTicks = tickData.rawTicks;
            tickCount = continuous ? Math.max(defaultTickCount - index, minTickCount) : maxTickCount;

            const { rawTicks, fractionDigits, ticks, labelCount } = this.getTicks({
                tickGenerationType,
                previousTicks: prevTicks,
                tickCount,
                minTickCount,
                maxTickCount,
                primaryTickCount,
            });

            tickData.rawTicks = rawTicks;
            tickData.fractionDigits = fractionDigits;
            tickData.ticks = ticks;
            tickData.labelCount = labelCount;

            unchanged = regenerateTicks ? areArrayNumbersEqual(rawTicks, prevTicks) : false;
            index++;
        }

        const shouldTerminate = step !== undefined || values !== undefined;

        terminate ||= shouldTerminate;

        return { tickData, index, autoRotation: 0, terminate };
    }

    private createLabelData(
        tickData: TickDatum[],
        labelX: number,
        labelMatrix: Matrix,
        textMeasurer: TextMeasurer
    ): PlacedLabelDatum[] {
        const labelData: PlacedLabelDatum[] = [];
        for (const { tickLabel, translationY } of tickData) {
            if (!tickLabel) continue;

            const { width, height } = textMeasurer.measureLines(tickLabel);
            const bbox = new BBox(labelX, translationY, width, height);
            const labelDatum = calculateLabelBBox(tickLabel, bbox, labelMatrix);

            labelData.push(labelDatum);
        }

        return labelData;
    }

    private getAutoRotation(labelOverlap: boolean): number {
        return labelOverlap ? normalizeAngle360(toRadians(this.label.autoRotateAngle ?? 0)) : 0;
    }

    private getTicks({
        tickGenerationType,
        previousTicks,
        tickCount,
        minTickCount,
        maxTickCount,
        primaryTickCount,
    }: {
        tickGenerationType: TickGenerationType;
        previousTicks: TickDatum[];
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
        primaryTickCount?: number;
    }) {
        const { range, scale, visibleRange } = this;
        const idGenerator = createIdsGenerator();

        let rawTicks: any[];

        switch (tickGenerationType) {
            case TickGenerationType.VALUES:
                rawTicks = this.interval.values!;
                if (ContinuousScale.is(scale)) {
                    const [d0, d1] = findMinMax(scale.getDomain().map(Number));
                    rawTicks = rawTicks.filter((value) => value >= d0 && value <= d1).sort((a, b) => a - b);
                }
                break;
            case TickGenerationType.CREATE_SECONDARY:
                if (ContinuousScale.is(scale)) {
                    // `updateSecondaryAxisTicks` mutates `scale.domain` based on `primaryTickCount`
                    rawTicks = this.updateSecondaryAxisTicks(primaryTickCount);
                } else {
                    // AG-10654 Just use normal ticks for categorical axes.
                    rawTicks = this.createTicks(tickCount, minTickCount, maxTickCount);
                }
                break;
            case TickGenerationType.FILTER:
                rawTicks = this.filterTicks(previousTicks, tickCount);
                break;
            default:
                rawTicks = this.createTicks(tickCount, minTickCount, maxTickCount);
                break;
        }

        const fractionDigits = rawTicks.reduce(
            (max, tick) => Math.max(max, typeof tick === 'number' ? countFractionDigits(tick) : 0),
            0
        );
        const halfBandwidth = (scale.bandwidth ?? 0) / 2;
        const ticks: TickDatum[] = [];

        let labelCount = 0;

        // Only get the ticks within a sliding window of the visible range to improve performance
        const start = Math.max(0, Math.floor(visibleRange[0] * rawTicks.length));
        const end = Math.min(rawTicks.length, Math.ceil(visibleRange[1] * rawTicks.length));

        const filteredTicks = rawTicks.slice(start, end);
        // When the scale domain or the ticks change, the label format may change
        this.onFormatChange(filteredTicks, fractionDigits, rawTicks, this.label.format);

        for (let i = 0; i < filteredTicks.length; i++) {
            const tick = filteredTicks[i];
            const translationY = scale.convert(tick) + halfBandwidth;

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (range.length > 0 && !this.inRange(translationY, 0.001)) continue;

            const tickLabel = this.formatTick(tick, fractionDigits, start + i);

            // Create a tick id from the label, or as an increment of the last label if this tick label is blank
            ticks.push({ tick, tickId: idGenerator(tickLabel), tickLabel, translationY: Math.floor(translationY) });

            if (tickLabel === '' || tickLabel == null) {
                continue;
            }
            labelCount++;
        }

        return { rawTicks, fractionDigits, ticks, labelCount };
    }

    private filterTicks(ticks: any, tickCount: number): any[] {
        const { minSpacing, maxSpacing } = this.interval;
        const tickSpacing = !isNaN(minSpacing) || !isNaN(maxSpacing);
        const keepEvery = tickSpacing ? Math.ceil(ticks.length / tickCount) : 2;
        return ticks.filter((_: any, i: number) => i % keepEvery === 0);
    }

    private createTicks(tickCount: number, minTickCount: number, maxTickCount: number): D[] {
        const { scale } = this;

        if (tickCount && (ContinuousScale.is(scale) || OrdinalTimeScale.is(scale))) {
            scale.tickCount = tickCount;
            scale.minTickCount = minTickCount ?? 0;
            scale.maxTickCount = maxTickCount ?? Infinity;
        }

        return scale.ticks?.() ?? [];
    }

    protected estimateTickCount({ minSpacing, maxSpacing }: { minSpacing: number; maxSpacing: number }): {
        minTickCount: number;
        maxTickCount: number;
        defaultTickCount: number;
    } {
        const rangeWithBleed = this.calculateRangeWithBleed();
        const defaultMinSpacing = Math.max(
            this.defaultTickMinSpacing,
            rangeWithBleed / ContinuousScale.defaultMaxTickCount
        );

        if (isNaN(minSpacing)) {
            minSpacing = defaultMinSpacing;
        }

        if (isNaN(maxSpacing)) {
            maxSpacing = rangeWithBleed;
        }

        if (minSpacing > maxSpacing) {
            if (minSpacing === defaultMinSpacing) {
                minSpacing = maxSpacing;
            } else {
                maxSpacing = minSpacing;
            }
        }

        const maxTickCount = Math.max(1, Math.floor(rangeWithBleed / minSpacing));
        const minTickCount = Math.min(maxTickCount, Math.ceil(rangeWithBleed / maxSpacing));
        const defaultTickCount = clamp(minTickCount, ContinuousScale.defaultTickCount, maxTickCount);

        return { minTickCount, maxTickCount, defaultTickCount };
    }

    private updateVisibility() {
        if (this.moduleCtx.animationManager.isSkipped()) {
            this.resetSelectionNodes();
        }

        this.tickLineGroup.visible = this.tick.enabled;
        this.gridLineGroup.visible = this.gridLine.enabled;
        this.tickLabelGroup.visible = this.label.enabled;
    }

    protected updateCrossLines({
        rotation,
        parallelFlipRotation,
        regularFlipRotation,
    }: {
        rotation: number;
        parallelFlipRotation: number;
        regularFlipRotation: number;
    }) {
        const sideFlag = this.label.getSideFlag();
        const anySeriesActive = this.isAnySeriesActive();
        this.crossLines.forEach((crossLine) => {
            crossLine.sideFlag = -sideFlag as ChartAxisLabelFlipFlag;
            crossLine.direction = rotation === -Math.PI / 2 ? ChartAxisDirection.X : ChartAxisDirection.Y;
            if (crossLine instanceof CartesianCrossLine) {
                crossLine.label.parallel ??= this.label.parallel;
            }
            crossLine.parallelFlipRotation = parallelFlipRotation;
            crossLine.regularFlipRotation = regularFlipRotation;
            crossLine.update(anySeriesActive);
        });
    }

    protected updateTickLines() {
        const { tick, label } = this;
        const sideFlag = label.getSideFlag();
        this.tickLineGroupSelection.each((line) => {
            line.strokeWidth = tick.width;
            line.stroke = tick.stroke;
            line.x1 = sideFlag * this.getTickSize();
            line.x2 = 0;
        });
    }

    protected calculateAvailableRange(): number {
        return findRangeExtent(this.range);
    }

    /**
     * Calculates the available range with an additional "bleed" beyond the canvas that encompasses the full axis when
     * the visible range is only a portion of the axis.
     */
    protected calculateRangeWithBleed() {
        const visibleScale = 1 / findRangeExtent(this.visibleRange);
        return round(this.calculateAvailableRange() * visibleScale, 2);
    }

    protected calculateDomain() {
        const visibleSeries = this.boundSeries.filter((s) => this.includeInvisibleDomains || s.isEnabled());
        const domains = visibleSeries.flatMap((series) => series.getDomain(this.direction));
        this.setDomain(domains);
    }

    protected getAxisTransform() {
        return {
            rotation: toRadians(this.rotation),
            translationX: Math.floor(this.translation.x),
            translationY: Math.floor(this.translation.y),
        };
    }

    updatePosition() {
        const { crossLineRangeGroup, crossLineLineGroup, crossLineLabelGroup, axisGroup, gridGroup, translation } =
            this;
        const { rotation } = this.calculateRotations();
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);

        crossLineRangeGroup.setProperties({ rotation, translationX, translationY });
        crossLineLineGroup.setProperties({ rotation, translationX, translationY });
        crossLineLabelGroup.setProperties({ rotation, translationX, translationY });
        gridGroup.setProperties({ rotation, translationX, translationY });
        axisGroup.datum = this.getAxisTransform();
    }

    updateSecondaryAxisTicks(_primaryTickCount: number | undefined): any[] {
        throw new Error('AG Charts - unexpected call to updateSecondaryAxisTicks() - check axes configuration.');
    }

    protected updateSelections(
        lineData: AxisLineDatum,
        data: TickDatum[],
        params: {
            combinedRotation: number;
            textBaseline: CanvasTextBaseline;
            textAlign: CanvasTextAlign;
            range: number[];
        }
    ) {
        const getDatumId = (datum: { tickId: string }) => datum.tickId;
        const labelsData = data.map((d) => this.getTickLabelProps(d, params));

        this.lineNode.datum = lineData;
        this.gridLineGroupSelection.update(this.gridLength ? data : [], undefined, getDatumId);
        this.tickLineGroupSelection.update(data, undefined, getDatumId);
        this.tickLabelGroupSelection.update(labelsData, undefined, getDatumId);
    }

    private updateAxisLine() {
        const { enabled, stroke, width } = this.line;
        // Without this the layout isn't consistent when enabling/disabling the line, padding configurations are not respected.
        this.lineNode.setProperties({ stroke, strokeWidth: enabled ? width : 0 });
    }

    protected updateGridLines(sideFlag: ChartAxisLabelFlipFlag) {
        const {
            gridLine: { style, width },
            gridPadding,
            gridLength,
        } = this;

        if (gridLength === 0 || style.length === 0) {
            return;
        }
        this.gridLineGroupSelection.each((line, _, index) => {
            const { stroke, lineDash } = style[index % style.length];
            line.setProperties({
                x1: gridPadding,
                x2: -sideFlag * gridLength + gridPadding,
                stroke,
                strokeWidth: width,
                lineDash,
            });
        });
    }

    protected updateLabels() {
        if (!this.label.enabled) return;

        // Apply label option values
        this.tickLabelGroupSelection.each((node, datum) => {
            node.setProperties(datum, [
                'fill',
                'fontFamily',
                'fontSize',
                'fontStyle',
                'fontWeight',
                'text',
                'textAlign',
                'textBaseline',
            ]);
        });
    }

    protected updateTitle(params: { anyTickVisible: boolean }): void {
        const { title, lineNode, tickLineGroup, tickLabelGroup } = this;

        let spacing = 0;
        if (title.enabled && params.anyTickVisible) {
            const tickBBox = Group.computeChildrenBBox([tickLineGroup, tickLabelGroup, lineNode]);
            spacing += tickBBox.width + (this.tickLabelGroup.visible ? 0 : this.seriesAreaPadding);
        }
        this.setTitleProps(title.caption, { spacing });
    }

    // For formatting (nice rounded) tick values.
    formatTick(datum: any, fractionDigits: number, index: number): string {
        return String(this.getFormatter(index, true)(datum, fractionDigits));
    }

    // For formatting arbitrary values between the ticks.
    formatDatum(datum: any): string {
        return String(this.getFormatter()(datum));
    }

    getFormatter(index: number = 0, isTickLabel?: boolean): (datum: any, fractionDigits?: number) => string {
        const {
            label,
            labelFormatter,
            datumFormatter,
            moduleCtx: { callbackCache },
        } = this;

        if (label.formatter) {
            return (datum, fractionDigits) =>
                callbackCache.call(label.formatter!, { value: datum, index, fractionDigits }) ?? datum;
        } else if (!isTickLabel && datumFormatter) {
            return (datum) => callbackCache.call(datumFormatter, datum) ?? String(datum);
        } else if (labelFormatter) {
            return (datum) => callbackCache.call(labelFormatter, datum) ?? String(datum);
        }
        // The axis is using a logScale or the`datum` is an integer, a string or an object
        return (datum) => String(datum);
    }

    getBBox(): BBox {
        return this.axisGroup.getBBox();
    }

    getRegionNode(): Node | undefined {
        return undefined;
    }

    initCrossLine(crossLine: CrossLine) {
        crossLine.scale = this.scale;
        crossLine.gridLength = this.gridLength;
    }

    isAnySeriesActive() {
        return this.boundSeries.some((s) => this.includeInvisibleDomains || s.isEnabled());
    }

    clipTickLines(x: number, y: number, width: number, height: number) {
        this.tickLineGroup.setClipRect(new BBox(x, y, width, height));
    }

    clipGrid(x: number, y: number, width: number, height: number) {
        this.gridGroup.setClipRect(new BBox(x, y, width, height));
    }

    protected getTitleFormatterParams() {
        const { direction } = this;
        const boundSeries: AgAxisBoundSeries[] = [];
        for (const series of this.boundSeries) {
            const keys = series.getKeys(direction);
            const names = series.getNames(direction);
            for (let idx = 0; idx < keys.length; idx++) {
                boundSeries.push({ key: keys[idx], name: names[idx] });
            }
        }
        return { direction, boundSeries, defaultValue: this.title?.text };
    }

    normaliseDataDomain(d: D[]): { domain: D[]; clipped: boolean } {
        return { domain: [...d], clipped: false };
    }

    getLayoutState(): AxisLayout {
        return {
            id: this.id,
            rect: this.getBBox(),
            gridPadding: this.gridPadding,
            seriesAreaPadding: this.seriesAreaPadding,
            tickSize: this.getTickSize(),
            direction: this.direction,
            domain: this.dataDomain.domain,
            scale: this.scale,
            ...this.layout,
        };
    }

    private readonly moduleMap: AxisModuleMap = new ModuleMap();

    getModuleMap(): AxisModuleMap {
        return this.moduleMap;
    }

    public createModuleContext(): ModuleContextWithParent<AxisContext> {
        this.axisContext ??= this.createAxisContext();
        return { ...this.moduleCtx, parent: this.axisContext };
    }

    createAxisContext(): AxisContext {
        const { scale } = this;
        return {
            axisId: this.id,
            scale: this.scale,
            direction: this.direction,
            continuous: ContinuousScale.is(scale) || OrdinalTimeScale.is(scale),
            seriesKeyProperties: () =>
                this.boundSeries.reduce((keys, series) => {
                    const seriesKeys = series.getKeyProperties(this.direction);

                    seriesKeys.forEach((key) => {
                        if (keys.indexOf(key) < 0) {
                            keys.push(key);
                        }
                    });

                    return keys;
                }, [] as string[]),
            scaleValueFormatter: (specifier?: string) => this.getScaleValueFormatter(specifier),
            scaleInvert: OrdinalTimeScale.is(scale)
                ? (val) => scale.invertNearest?.(val)
                : (val) => scale.invert?.(val),
            scaleInvertNearest: (val) => scale.invertNearest?.(val),
            attachLabel: (node: Node) => this.attachLabel(node),
            inRange: (x, tolerance) => this.inRange(x, tolerance),
        };
    }

    private getScaleValueFormatter(format?: string) {
        const { scale } = this;
        if (format && scale && scale.tickFormat) {
            try {
                return scale.tickFormat({ specifier: format });
            } catch (e) {
                Logger.warnOnce(`the format string ${format} is invalid, ignoring.`);
            }
        }

        return this.getFormatter();
    }

    animateReadyUpdate(diff: FromToDiff) {
        const { animationManager } = this.moduleCtx;
        const selectionCtx = prepareAxisAnimationContext(this);
        const fns = prepareAxisAnimationFunctions(selectionCtx);

        fromToMotion(this.id, 'axis-group', animationManager, [this.axisGroup], fns.group);
        fromToMotion(this.id, 'line', animationManager, [this.lineNode], fns.line);
        fromToMotion(
            this.id,
            'line-paths',
            animationManager,
            [this.gridLineGroupSelection, this.tickLineGroupSelection],
            fns.tick,
            (_, d) => d.tickId,
            diff
        );
        fromToMotion(
            this.id,
            'tick-labels',
            animationManager,
            [this.tickLabelGroupSelection],
            fns.label,
            (_, d) => d.tickId,
            diff
        );
    }

    protected resetSelectionNodes() {
        const { gridLineGroupSelection, tickLineGroupSelection, tickLabelGroupSelection, lineNode } = this;

        const selectionCtx = prepareAxisAnimationContext(this);
        resetMotion([this.axisGroup], resetAxisGroupFn());
        resetMotion([gridLineGroupSelection, tickLineGroupSelection], resetAxisSelectionFn(selectionCtx));
        resetMotion([tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([lineNode], resetAxisLineSelectionFn());
    }

    private calculateUpdateDiff(previous: string[], tickData: TickData) {
        const added = new Set<string>();
        const removed = new Set<string>();
        const tickMap: Record<string, TickData['ticks'][number]> = {};
        const tickCount = Math.max(previous.length, tickData.ticks.length);

        for (let i = 0; i < tickCount; i++) {
            const tickDatum = tickData.ticks[i];
            const prev = previous[i];
            const tick = tickDatum?.tickId;

            tickMap[tick ?? prev] = tickDatum;

            if (prev === tick) {
                continue;
            }

            if (removed.has(tick)) {
                removed.delete(tick);
            } else if (tick) {
                added.add(tick);
            }

            if (added.has(prev)) {
                added.delete(prev);
            } else if (prev) {
                removed.add(prev);
            }
        }

        return { changed: added.size > 0 || removed.size > 0, added, removed };
    }

    isReversed() {
        return this.reverse;
    }
}
