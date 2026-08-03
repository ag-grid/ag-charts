import type {
    AxisID,
    ChartAnimationPhase,
    DynamicContext,
    NormalisedBaseCartesianAxisOptions,
    Scale,
    ZoomMinMax,
} from 'ag-charts-core';
import {
    ChartAxisDirection,
    StateMachine,
    arraysEqual,
    calcLineHeight,
    countLines,
    diffArrays,
    findMinMax,
    isPlainObject,
} from 'ag-charts-core';
import type {
    AgAxisTitleOrientation,
    AgCartesianAxisPosition,
    AgTimeInterval,
    AgTimeIntervalUnit,
} from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { ChartRegistry } from '../../module/moduleContext';
import { type FromToDiff, fromToMotion } from '../../motion/fromToMotion';
import { resetMotion } from '../../motion/resetMotion';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { BBox } from '../../scene/bbox';
import { TranslatableGroup } from '../../scene/group';
import { PointerEvents } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { Rect } from '../../scene/shape/rect';
import { TransformableText } from '../../scene/shape/text';
import type { AxisPrimaryTickCount } from '../../util/secondaryAxisTicks';
import { Caption } from '../caption';
import type { ChartLayout } from '../chartAxis';
import type { AnimationManager } from '../interaction/animationManager';
import { expandLabelPadding } from '../label';
import type { ScrollbarLayout } from '../layout/layoutManager';
import { Axis, AxisGroupZIndexMap, type LabelNodeDatum } from './axis';
import { getAxisLabelSideFlag } from './axisLabelUtil';
import type {
    AxisFillDatum,
    AxisGroupDatumTranslation,
    AxisLabelDatum,
    AxisLineDatum,
    AxisLineDatumCoords,
    TickDatum,
} from './axisUtil';
import {
    NiceMode,
    prepareAxisAnimationContext,
    prepareAxisAnimationFunctions,
    resetAxisFillSelectionFn,
    resetAxisGroupFn,
    resetAxisLabelSelectionFn,
    resetAxisLineSelectionFn,
} from './axisUtil';
import { generateTicks } from './generateTicks';

type AxisAnimationState = 'empty' | 'ready';
type AxisAnimationEvent = { reset: undefined; resize: undefined; update: FromToDiff };

interface GeneratedTicks {
    ticks: TickDatum[];
    tickLines: AxisLineDatum[];
    gridLines: AxisLineDatum[];
    gridFills: AxisFillDatum[];
    labels: LabelNodeDatum[];
    spacing: number;
}

export type GridLineStyleTickDatum = Pick<TickDatum, 'index' | 'tickId' | 'translation'>;

interface TitleOrientationLayout {
    rotation: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

/** The orientation that reproduces the default title rendering for an axis position. */
function defaultTitleOrientation(position: AgCartesianAxisPosition): AgAxisTitleOrientation {
    if (position === 'left') return 'vertical';
    if (position === 'right') return 'vertical-reversed';
    return 'horizontal';
}

/** True when the title text runs across the axis line rather than along it. */
function isTitleAcrossAxis(position: AgCartesianAxisPosition, orientation: AgAxisTitleOrientation): boolean {
    const axisVertical = position === 'left' || position === 'right';
    return (orientation === 'horizontal') === axisVertical;
}

const titleRotations: Record<AgAxisTitleOrientation, number> = {
    horizontal: 0,
    vertical: -Math.PI / 2,
    'vertical-reversed': Math.PI / 2,
};

/**
 * Maps an axis title `orientation` to the rotation, alignment and baseline that place the title on
 * the outer side of the axis line at its midpoint. The rotation is screen-relative; the alignment
 * and baseline keep the title clear of the axis line for the side it sits on.
 */
function getTitleOrientationLayout(
    position: AgCartesianAxisPosition,
    orientation: AgAxisTitleOrientation
): TitleOrientationLayout {
    const rotation = titleRotations[orientation];

    if (isTitleAcrossAxis(position, orientation)) {
        let textAlign: CanvasTextAlign;
        switch (position) {
            case 'left':
                textAlign = 'right';
                break;
            case 'right':
                textAlign = 'left';
                break;
            case 'top':
                textAlign = orientation === 'vertical-reversed' ? 'right' : 'left';
                break;
            case 'bottom':
                textAlign = orientation === 'vertical-reversed' ? 'left' : 'right';
                break;
        }
        return { rotation, textAlign, textBaseline: 'middle' };
    }

    let textBaseline: CanvasTextBaseline;
    switch (position) {
        case 'top':
            textBaseline = 'bottom';
            break;
        case 'bottom':
            textBaseline = 'top';
            break;
        case 'left':
            textBaseline = orientation === 'vertical' ? 'bottom' : 'top';
            break;
        case 'right':
            textBaseline = orientation === 'vertical-reversed' ? 'bottom' : 'top';
            break;
    }
    return { rotation, textAlign: 'center', textBaseline };
}

export abstract class CartesianAxis<
    S extends Scale<D, number, any> = Scale<any, number, any>,
    D = any,
    TOptions extends NormalisedBaseCartesianAxisOptions = NormalisedBaseCartesianAxisOptions,
> extends Axis<S, D, GeneratedTicks, TOptions> {
    static is(value: unknown): value is CartesianAxis<any> {
        return value instanceof CartesianAxis;
    }

    get position(): AgCartesianAxisPosition {
        return this.options.position!;
    }

    readonly crossAxisTranslation: { x: number; y: number } = { x: 0, y: 0 };

    minimumTimeGranularity: AgTimeIntervalUnit | undefined = undefined;

    // Used to define the range the axis line will occupy, e.g. when bandAlignment is not 'justify'.
    lineRange?: [number, number];

    // Axis-local zoom. Managed by ZoomManager via setZoom(). Defaults to the full range; diverges
    // from the direction primary only in independent-axes mode.
    private zoom: ZoomMinMax = { min: 0, max: 1 };

    public getZoom(): ZoomMinMax {
        return this.zoom;
    }

    public setZoom(zoom: ZoomMinMax): void {
        this.zoom = { min: zoom.min, max: zoom.max };
    }

    protected animationManager: AnimationManager;

    protected readonly headingLabelGroup = this.axisGroup.appendChild(
        new TranslatableGroup<AxisGroupDatumTranslation>({ name: `${this.id}-Axis-heading` })
    );
    protected readonly lineNodeGroup = this.axisGroup.appendChild(
        new TranslatableGroup<AxisGroupDatumTranslation>({ name: `${this.id}-Axis-line` })
    );
    protected readonly lineNode = this.lineNodeGroup.appendChild(
        new Line<AxisLineDatumCoords>({ zIndex: AxisGroupZIndexMap.AxisLine })
    );

    protected tickLineGroupSelection = Selection.select<Line<AxisLineDatum>>(this.tickLineGroup, Line, false);
    protected gridLineGroupSelection = Selection.select<Line<AxisLineDatum>>(this.gridLineGroup, Line, false);
    protected gridFillGroupSelection = Selection.select<Rect<AxisFillDatum>>(this.gridFillGroup, Rect, false);

    private readonly tempText = new TransformableText({ debugDirty: false });
    private readonly tempCaption = new Caption();

    protected readonly animationState: StateMachine<AxisAnimationState, AxisAnimationEvent>;

    protected get horizontal() {
        return this.position === 'top' || this.position === 'bottom';
    }

    constructor(moduleCtx: DynamicContext<ChartRegistry>, id: AxisID, scale: S, options: TOptions) {
        super(moduleCtx, id, scale, options);

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

        this.headingLabelGroup.appendChild(this.caption.node);

        let previousSize: readonly [number, number] | undefined = undefined;
        this.cleanup.register(
            moduleCtx.eventsHub.on('layout:complete', (e) => {
                // Fire resize animation action if chart canvas size changes.
                const size = [e.chart.width, e.chart.height] as const;
                if (previousSize != null && !arraysEqual(size, previousSize)) {
                    this.animationState.transition('resize');
                }
                previousSize = size;
            }),
            this.caption.registerInteraction(this.moduleCtx, this.id)
        );
    }

    protected override onGridVisibilityChange(): void {
        // Do nothing, the grid lines and fills are updated in the update method.
    }

    override resetAnimation(phase: ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        }
    }

    get direction() {
        return this.position === 'top' || this.position === 'bottom' ? ChartAxisDirection.X : ChartAxisDirection.Y;
    }

    override createAxisContext(): AxisContext {
        // Mutate rather than spread so the live getters defined on the base context
        // (`range`, `gridLength`, `mirrored`, etc.) are preserved.
        const ctx = super.createAxisContext();
        ctx.position = this.position;
        return ctx;
    }

    protected updateDirection() {
        switch (this.position) {
            case 'top':
                this.mirrored = true;
                this.parallel = true;
                break;
            case 'right':
                this.mirrored = true;
                this.parallel = false;
                break;
            case 'bottom':
                this.mirrored = false;
                this.parallel = true;
                break;
            case 'left':
                this.mirrored = false;
                this.parallel = false;
                break;
        }

        if (this.axisContext) {
            this.axisContext.position = this.position;
            this.axisContext.direction = this.direction;
        }
    }

    override calculateLayout(primaryTickCount?: AxisPrimaryTickCount, chartLayout?: ChartLayout) {
        this.updateDirection();
        return super.calculateLayout(primaryTickCount, chartLayout);
    }

    override calculateTickLayout(
        domain: D[],
        niceMode: NiceMode[],
        visibleRange: [number, number],
        initialPrimaryTickCount?: AxisPrimaryTickCount
    ): {
        niceDomain: D[];
        tickDomain: D[];
        ticks: D[];
        rawTickCount: number | undefined;
        fractionDigits: number;
        timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined;
        bbox: BBox;
        layout: GeneratedTicks;
    } {
        const sideFlag = getAxisLabelSideFlag(this.mirrored);
        const label = this.options.label;
        const labelX = sideFlag * (this.getTickSize() + this.getTickSpacing() + label.spacing + this.seriesAreaPadding);
        const scrollbar = this.chartLayout?.scrollbars?.[this.id];
        const scrollbarThickness = this.getScrollbarThickness(scrollbar);

        if (
            niceMode[0] === NiceMode.Off &&
            niceMode[1] === NiceMode.Off &&
            !label.enabled &&
            !(this.primaryLabel?.enabled ?? false) &&
            this.options.tick.enabled === false &&
            !(this.primaryTick?.enabled ?? false) &&
            this.options.gridLine.enabled === false
        ) {
            const { bbox, spacing } = this.measureAxisLayout(domain, [], [], scrollbar, scrollbarThickness);
            // Performance optimization: if ticks have no effect, don't generate them
            this.setPickTickData([]);
            const layout: GeneratedTicks = {
                ticks: [],
                tickLines: [],
                gridLines: [],
                gridFills: [],
                labels: [],
                spacing,
            };
            return {
                ticks: [],
                rawTickCount: 0,
                tickDomain: domain,
                niceDomain: domain,
                fractionDigits: 0,
                timeInterval: undefined,
                bbox,
                layout,
            };
        }

        const { primaryLabel, scale, range, defaultTickMinSpacing, minimumTimeGranularity } = this;
        const { interval, reverse } = this.options;

        const tickGenerationResult = generateTicks({
            label,
            parallel: this.parallel,
            scale,
            interval,
            primaryLabel,
            domain,
            range,
            reverse,
            niceMode,
            visibleRange,
            defaultTickMinSpacing,
            minimumTimeGranularity,
            sideFlag,
            labelOffset: labelX,
            primaryTickCount: initialPrimaryTickCount,
            axisRotation: this.horizontal ? Math.PI / -2 : 0,
            isVertical: this.direction === ChartAxisDirection.Y,
            sizeLimit: this.chartLayout?.sizeLimit,
            inRange: (translation: number) => this.inRange(translation, 0.001),
            tickFormatter: (...args) => this.tickFormatter(...args),
        });

        const { tickData } = tickGenerationResult;
        const removeOverflowLabels =
            (label?.avoidCollisions ?? true) &&
            this.horizontal &&
            tickData.ticks.length > 2 &&
            (ContinuousScale.is(this.scale) || DiscreteTimeScale.is(this.scale));

        if (removeOverflowLabels) {
            const removeOverflowThreshold = this.chartLayout?.padding.right ?? 0;
            const lastTick = tickData.ticks.at(-1);
            if (
                lastTick?.tickLabel != null &&
                lastTick.translation + lastTick.textMetrics.width / 2 > range[1] + removeOverflowThreshold
            ) {
                lastTick.tickLabel = undefined;
                if (visibleRange[0] === 0 && visibleRange[1] === 1) {
                    tickData.ticks[0].tickLabel = undefined;
                }
            }
        }

        const {
            ticks,
            tickDomain,
            rawTicks,
            rawTickCount,
            fractionDigits,
            timeInterval,
            niceDomain,
            rawFirstTickIndex,
        } = tickData;

        this.setPickTickData(ticks, rawFirstTickIndex);

        const labels = ticks.map((d) => this.getTickLabelProps(d, tickGenerationResult, scrollbarThickness));

        const { position, gridPadding, gridLength } = this;
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;
        const p1 = direction * gridPadding;
        const p2 = direction * (gridLength + gridPadding);

        const gridLines = this.calculateGridLines(ticks, p1, p2);
        const gridFills = this.calculateGridFills(ticks, p1, p2);
        const tickLines = this.calculateTickLines(ticks, direction, scrollbarThickness);
        const { bbox, spacing } = this.measureAxisLayout(tickDomain, ticks, labels, scrollbar, scrollbarThickness);
        const layout: GeneratedTicks = { ticks, gridLines, gridFills, tickLines, labels, spacing };

        return { ticks: rawTicks, rawTickCount, tickDomain, niceDomain, fractionDigits, timeInterval, bbox, layout };
    }

    protected calculateGridLines(ticks: GridLineStyleTickDatum[], p1: number, p2: number) {
        return ticks.map((tick, index) => this.calculateGridLine(tick, index, p1, p2, ticks));
    }

    protected calculateGridLine(
        { index: tickIndex, tickId, translation: offset }: GridLineStyleTickDatum,
        _index: number,
        p1: number,
        p2: number,
        _ticks: GridLineStyleTickDatum[]
    ): AxisLineDatum {
        const { horizontal } = this;
        const gridLine = this.options.gridLine;

        const [x1, y1, x2, y2] = horizontal ? [offset, p1, offset, p2] : [p1, offset, p2, offset];
        const { style } = gridLine;
        const { stroke, strokeWidth = 0, lineDash } = style[tickIndex % style.length] ?? {};

        return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
    }

    protected calculateGridFills(ticks: GridLineStyleTickDatum[], p1: number, p2: number) {
        const { horizontal, range, type } = this;

        const gridFills: AxisFillDatum[] = [];
        if (ticks.length == 0) return gridFills;

        let gridFillIndexOffset = 0;
        const isVerticalUnitTime = !horizontal && type === 'unit-time';
        const firstFillOffCanvas =
            (isVerticalUnitTime && ticks[0].translation < range[0]) ||
            (!isVerticalUnitTime && ticks[0].translation > range[0]);

        if (firstFillOffCanvas) {
            const injectedTick = { tickId: `before:${ticks[0].tickId}`, translation: range[0] };
            gridFills.push(this.calculateGridFill(injectedTick, -1, ticks[0].index, p1, p2, ticks));
            gridFillIndexOffset = 1;
        }

        gridFills.push(
            ...ticks.map((tick, index) =>
                this.calculateGridFill(tick, index, tick.index + gridFillIndexOffset, p1, p2, ticks)
            )
        );

        return gridFills;
    }

    protected calculateGridFill(
        { tickId, translation }: Pick<GridLineStyleTickDatum, 'tickId' | 'translation'>,
        index: number,
        gridFillIndex: number,
        p1: number,
        p2: number,
        ticks: GridLineStyleTickDatum[]
    ): AxisFillDatum {
        const { horizontal, range } = this;
        const gridLine = this.options.gridLine;

        const nextTick = ticks[index + 1];
        const startOffset = translation;
        const endOffset = nextTick ? nextTick.translation : range[1];

        const [x1, y1, x2, y2] = horizontal
            ? [startOffset, Math.max(p1, p2), endOffset, Math.min(p1, p2)]
            : [Math.min(p1, p2), Math.min(startOffset, endOffset), Math.max(p1, p2), Math.max(startOffset, endOffset)];
        const { fill, fillOpacity } = gridLine.style[gridFillIndex % gridLine.style.length] ?? {};

        return { tickId, x1, y1, x2, y2, fill, fillOpacity };
    }

    protected calculateTickLines(
        ticks: TickDatum[],
        direction: number,
        scrollbarThickness: number = 0
    ): AxisLineDatum[] {
        return ticks.map((tick) => this.calculateTickLine(tick, tick.index, direction, ticks, scrollbarThickness));
    }

    protected calculateTickLine(
        { isPrimary, tickId, translation: offset }: Pick<TickDatum, 'isPrimary' | 'tickId' | 'translation'>,
        _index: number,
        direction: number,
        _ticks: TickDatum[],
        scrollbarThickness: number = 0
    ): AxisLineDatum {
        const { horizontal, primaryTick } = this;
        const tick = this.options.tick;

        const datumTick = isPrimary && primaryTick ? primaryTick : tick;
        const tickSize = this.getTickSize(datumTick);
        const tickSpacing = this.getTickSpacing(datumTick);
        const tickOffset = -direction * (scrollbarThickness + tickSpacing);
        const h = -direction * tickSize;
        const [x1, y1, x2, y2] = horizontal
            ? [offset, tickOffset, offset, tickOffset + h]
            : [tickOffset, offset, tickOffset + h, offset];
        const { stroke, width: strokeWidth } = datumTick;
        const lineDash = undefined;

        return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
    }

    override update() {
        this.updateDirection();

        const previousTicksIds = Array.from(this.tickLabelGroupSelection.nodes(), (node) => node.unsafeDatum.tickId);

        super.update();

        const { tickLayout } = this;
        this.updateTitle(this.scale.domain, tickLayout?.spacing ?? 0);

        if (!this.animatable) {
            this.moduleCtx.animationManager.skipCurrentBatch();
        }

        if (tickLayout) {
            const { ticks } = tickLayout;

            if (this.animationManager.isSkipped()) {
                this.resetSelectionNodes();
            } else {
                const tickIds = ticks.map((datum) => datum.tickId);
                const diff = diffArrays(previousTicksIds, tickIds);
                this.animationState.transition('update', diff);
            }
        }

        const { enabled, stroke, width } = this.options.line;
        // Without this the layout isn't consistent when enabling/disabling the line, padding configurations are not respected.
        this.lineNode.setProperties({ stroke, strokeWidth: enabled ? width : 0 });

        this.updateTickLines();
        this.updateGridLines();
        this.updateGridFills();
    }

    private getAxisTransform() {
        return {
            completeTransform: {
                translationX: Math.floor(this.translation.x + this.crossAxisTranslation.x),
                translationY: Math.floor(this.translation.y + this.crossAxisTranslation.y),
            },
            positionOnlyTransform: {
                translationX: Math.floor(this.translation.x),
                translationY: Math.floor(this.translation.y),
            },
        };
    }

    protected override getLayoutTranslation(): { x: number; y: number } {
        const {
            completeTransform: { translationX, translationY },
        } = this.getAxisTransform();
        return { x: translationX, y: translationY };
    }

    override getLayoutState() {
        const layout = super.getLayoutState();
        return { ...layout, position: this.position };
    }

    protected override updatePosition(): void {
        super.updatePosition();

        const { completeTransform, positionOnlyTransform } = this.getAxisTransform();
        this.tickLineGroup.datum = this.options.crossAt?.labelsAtEdge ? positionOnlyTransform : completeTransform;
        this.tickLabelGroup.datum = this.options.crossAt?.labelsAtEdge ? positionOnlyTransform : completeTransform;
        this.lineNodeGroup.datum = completeTransform;
        this.headingLabelGroup.datum = this.options.crossAt?.titleAtEdge ? positionOnlyTransform : completeTransform;
    }

    setAxisVisible(visible: boolean) {
        this.tickLineGroup.visible = visible && (this.options.tick.enabled || (this.primaryTick?.enabled ?? false));
        this.tickLabelGroup.visible = visible && (this.options.label.enabled || (this.primaryTick?.enabled ?? false));
        this.lineNodeGroup.visible = visible;
        this.headingLabelGroup.visible = visible;
    }

    private getAxisLineCoordinates() {
        const { horizontal } = this;
        const [c1, c2] = findMinMax(this.lineRange ?? this.range);

        return horizontal ? { x1: c1, x2: c2, y1: 0, y2: 0 } : { x1: 0, x2: 0, y1: c1, y2: c2 };
    }

    private getTickLineBBox(datum: TickDatum, scrollbarThickness: number) {
        const { translation } = datum;
        const { position, primaryTick } = this;
        let tickSize = this.getTickSize();
        if (primaryTick?.enabled) {
            tickSize = Math.max(tickSize, this.getTickSize(primaryTick));
        }
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;
        const tickSpacing = this.getTickSpacing(this.options.tick);
        const tickOffset = -direction * (scrollbarThickness + tickSpacing);
        const start = tickOffset;
        const end = tickOffset - direction * (tickSize + tickSpacing);
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        switch (position) {
            case 'top':
                return new BBox(translation, min, 0, max - min);
            case 'bottom':
                return new BBox(translation, min, 0, max - min);
            case 'left':
                return new BBox(min, translation, max - min, 0);
            case 'right':
                return new BBox(min, translation, max - min, 0);
        }
    }

    protected lineNodeBBox() {
        const { position, seriesAreaPadding } = this;
        const { y1, y2 } = this.getAxisLineCoordinates();
        const dy = y2 - y1;
        switch (position) {
            case 'top':
                return new BBox(y1, -seriesAreaPadding, dy, seriesAreaPadding);
            case 'bottom':
                return new BBox(y1, 0, dy, seriesAreaPadding);
            case 'left':
                return new BBox(-seriesAreaPadding, y1, seriesAreaPadding, dy);
            case 'right':
                return new BBox(0, y1, seriesAreaPadding, dy);
        }
    }

    protected titleBBox(domain: D[], spacing: number) {
        const { tempCaption } = this;
        tempCaption.node.setProperties(this.titleProps(tempCaption, domain, spacing));
        this.wrapTitleText(tempCaption);
        return tempCaption.node.getBBox();
    }

    private wrapTitleText(caption: Caption) {
        const axisLength = Math.abs(this.range[1] - this.range[0]) || Infinity;
        const thickness = this.options.thickness ?? Infinity;
        const orientation = this.options.title.orientation ?? defaultTitleOrientation(this.position);
        if (isTitleAcrossAxis(this.position, orientation)) {
            caption.computeTextWrap(thickness, axisLength);
        } else {
            caption.computeTextWrap(axisLength, thickness);
        }
    }

    protected getScrollbarThickness(scrollbar?: ScrollbarLayout): number {
        if (!scrollbar?.enabled) return 0;
        return scrollbar.placement === 'inner' ? scrollbar.spacing + scrollbar.thickness : 0;
    }

    protected resolveScrollbarLayout(
        scrollbar: ScrollbarLayout | undefined,
        labelThickness: number
    ): (ScrollbarLayout & { offset: number }) | undefined {
        if (!scrollbar) return;

        const { position } = this;
        const direction = position === 'top' || position === 'left' ? -1 : 1;

        if (scrollbar.placement === 'inner') {
            const offset = direction === 1 ? scrollbar.spacing : -scrollbar.spacing - scrollbar.thickness;
            return { ...scrollbar, offset };
        }

        const offset =
            direction === 1
                ? labelThickness + scrollbar.spacing
                : -labelThickness - scrollbar.spacing - scrollbar.thickness;

        return { ...scrollbar, offset };
    }

    protected applyScrollbarLayout(
        boxes: BBox[],
        labelThickness: number,
        scrollbar: ScrollbarLayout | undefined
    ): { spacing: number; scrollbarLayout: (ScrollbarLayout & { offset: number }) | undefined } {
        const scrollbarLayout = this.resolveScrollbarLayout(scrollbar, labelThickness);

        let spacing = labelThickness;
        if (scrollbarLayout) {
            const { offset, thickness, placement } = scrollbarLayout;
            if (placement === 'outer') {
                spacing += scrollbarLayout.spacing + thickness;
            }
            if (this.horizontal) {
                boxes.push(new BBox(0, offset, 0, thickness));
            } else {
                boxes.push(new BBox(offset, 0, thickness, 0));
            }
        }

        return { spacing, scrollbarLayout };
    }

    private measureAxisLayout(
        domain: D[],
        ticks: TickDatum[],
        labels: LabelNodeDatum[],
        scrollbar: ScrollbarLayout | undefined,
        scrollbarThickness: number
    ) {
        const { primaryTick, primaryLabel, position, horizontal, seriesAreaPadding } = this;
        const tick = this.options.tick;
        const label = this.options.label;
        const title = this.options.title;
        const boxes: BBox[] = [];

        boxes.push(this.lineNodeBBox());

        if (tick.enabled || primaryTick?.enabled) {
            for (const datum of ticks) {
                boxes.push(this.getTickLineBBox(datum, scrollbarThickness));
            }
        }

        const { tempText } = this;
        if (label.enabled) {
            for (const datum of labels) {
                if (!datum.visible) continue;

                tempText.setProperties(datum);

                const box = tempText.getBBox();
                if (box) {
                    boxes.push(box);
                }
            }
        }

        if (primaryLabel?.enabled && position === 'bottom') {
            const inexactMeasurementPadding = 2;

            // Force base min-height
            boxes.push(
                new BBox(
                    0,
                    calcLineHeight(label.fontSize) + inexactMeasurementPadding,
                    1,
                    this.getTickSize(tick) + this.getTickSpacing(tick) + label.spacing + seriesAreaPadding
                )
            );

            if (primaryLabel.format != null) {
                const { format } = primaryLabel;
                const formats = isPlainObject(format) ? Object.values(format) : [format];
                const maxLines = formats.reduce((m, f) => Math.max(m, countLines(f)), 0);
                boxes.push(
                    new BBox(
                        0,
                        this.getTickSize(primaryTick ?? tick) +
                            this.getTickSpacing(primaryTick ?? tick) +
                            primaryLabel.spacing +
                            seriesAreaPadding,
                        1,
                        maxLines * calcLineHeight(primaryLabel.fontSize) + inexactMeasurementPadding
                    )
                );
            }
        }

        const combined = BBox.merge(boxes);
        const labelThickness = horizontal ? combined.height : combined.width;
        const { spacing, scrollbarLayout } = this.applyScrollbarLayout(boxes, labelThickness, scrollbar);
        this.layout.labelThickness = labelThickness;
        this.layout.scrollbar = scrollbarLayout;

        if (title.enabled) {
            boxes.push(this.titleBBox(domain, spacing));
        }

        const bbox = BBox.merge(boxes);
        return { bbox, spacing };
    }

    protected titleProps(caption: Caption, domain: D[], spacing: number) {
        const title = this.options.title;

        if (!title.enabled) {
            caption.enabled = false;
            return {
                visible: false,
                text: '',
                textAlign: 'center' as const,
                textBaseline: 'bottom' as const,
                x: 0,
                y: 0,
                rotationCenterX: 0,
                rotationCenterY: 0,
                rotation: 0,
            };
        }

        caption.enabled = true;
        caption.color = title.color;
        caption.fontFamily = title.fontFamily;
        caption.fontSize = title.fontSize;
        caption.fontStyle = title.fontStyle;
        caption.fontWeight = title.fontWeight;
        caption.wrapping = title.wrapping;
        caption.truncate = title.truncate;
        caption.maxWidth = title.maxWidth;
        caption.maxHeight = title.maxHeight;

        const { range } = this;
        const midOffset = (range[0] + range[1]) / 2;
        const padding = title.spacing + spacing;

        let x: number;
        let y: number;
        switch (this.position) {
            case 'top':
                x = midOffset;
                y = -padding;
                break;
            case 'bottom':
                x = midOffset;
                y = padding;
                break;
            case 'left':
                x = -padding;
                y = midOffset;
                break;
            case 'right':
                x = padding;
                y = midOffset;
                break;
        }

        const { rotation, textAlign, textBaseline } = getTitleOrientationLayout(
            this.position,
            title.orientation ?? defaultTitleOrientation(this.position)
        );

        const { formatter = (p) => p.defaultValue } = title;
        const text = this.cachedCallWithContext(formatter, this.getTitleFormatterParams(domain));
        caption.text = text;

        return {
            visible: true,
            text,
            textAlign,
            textBaseline,
            x,
            y,
            rotationCenterX: x,
            rotationCenterY: y,
            rotation,
        };
    }

    private getTickLabelProps(
        datum: TickDatum,
        tickGenerationResult: { rotation: number; textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline },
        scrollbarThickness: number
    ): LabelNodeDatum {
        const { horizontal, primaryLabel, primaryTick, seriesAreaPadding, scale } = this;
        const { tickId, tickLabel: text = '', translation, isPrimary, textUntruncated } = datum;
        const label = isPrimary && primaryLabel?.enabled ? primaryLabel : this.options.label;
        const tick = isPrimary && primaryTick?.enabled ? primaryTick : this.options.tick;
        const { rotation, textBaseline, textAlign } = tickGenerationResult;
        const { range } = scale;
        const sideFlag = getAxisLabelSideFlag(this.mirrored);
        const borderOffset = expandLabelPadding(label)[this.position];
        let labelOffset =
            sideFlag * (this.getTickSize(tick) + this.getTickSpacing(tick) + label.spacing + seriesAreaPadding) -
            borderOffset;

        if (scrollbarThickness) {
            labelOffset += sideFlag * scrollbarThickness;
        }
        const visible = text !== '';

        const x = horizontal ? translation : labelOffset;
        const y = horizontal ? -labelOffset : translation;

        return {
            ...this.getLabelStyles({ value: datum.tick, formattedValue: text }, undefined, label),
            tickId,
            rotation,
            text,
            textAlign,
            textBaseline,
            textUntruncated,
            visible,
            x,
            y,
            rotationCenterX: x,
            rotationCenterY: y,
            range,
        };
    }

    protected updateSelections() {
        if (!this.tickLayout) return;

        const lineData = this.getAxisLineCoordinates();
        const { tickLines, gridLines, gridFills, labels } = this.tickLayout;

        const getDatumId = (datum: AxisLabelDatum | AxisLineDatum | AxisFillDatum) => datum.tickId;

        this.lineNode.datum = lineData;
        this.gridLineGroupSelection.update(this.options.gridLine.enabled ? gridLines : [], undefined, getDatumId);
        this.gridFillGroupSelection.update(this.options.gridLine.enabled ? gridFills : [], undefined, getDatumId);
        this.tickLineGroupSelection.update(tickLines, undefined, getDatumId);
        const labelsEnabled = this.options.label.enabled || (this.primaryLabel?.enabled ?? false);
        this.tickLabelGroupSelection.update(labelsEnabled ? labels : [], undefined, getDatumId);
    }

    protected updateGridLines() {
        this.gridLineGroupSelection.each((line, datum) => {
            line.stroke = datum.stroke;
            line.strokeWidth = datum.strokeWidth;
            line.lineDash = datum.lineDash;
        });
    }

    protected updateGridFills() {
        this.gridFillGroupSelection.each((rect, datum) => {
            rect.fill = datum.fill;
            rect.fillOpacity = datum.fillOpacity ?? 1;
        });
    }

    protected updateTickLines() {
        this.tickLineGroupSelection.each((line, datum) => {
            line.stroke = datum.stroke;
            line.strokeWidth = datum.strokeWidth;
            line.lineDash = datum.lineDash;
        });
    }

    protected updateTitle(domain: D[], spacing: number): void {
        const { caption } = this;
        const titleProps = this.titleProps(caption, domain, spacing);
        caption.node.visible = titleProps.visible;
        caption.node.text = titleProps.text;
        caption.node.textAlign = titleProps.textAlign;
        caption.node.textBaseline = titleProps.textBaseline;
        caption.node.datum = titleProps;

        if (titleProps.visible) {
            this.wrapTitleText(caption);
        }
    }

    protected updateLabels() {
        const labelsEnabled = this.options.label.enabled || (this.primaryLabel?.enabled ?? false);
        if (!labelsEnabled) return;

        // Apply label option values
        this.tickLabelGroupSelection.each((node, datum) => {
            node.fill = datum.color;
            node.text = datum.text;
            node.textBaseline = datum.textBaseline;
            node.textAlign = datum.textAlign ?? 'center';
            node.pointerEvents = datum.textUntruncated == null ? PointerEvents.None : PointerEvents.All;
            node.setFont(datum);
            node.setBoxing(datum);
        });
    }

    private animateReadyUpdate(diff: FromToDiff) {
        const { animationManager } = this.moduleCtx;
        const selectionCtx = prepareAxisAnimationContext(this);
        const fns = prepareAxisAnimationFunctions(selectionCtx);

        fromToMotion(
            this.id,
            'axis-group',
            animationManager,
            [this.lineNodeGroup, this.tickLabelGroup, this.tickLineGroup, this.headingLabelGroup],
            fns.group
        );
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
            (node) => node.unsafeDatum.tickId,
            diff
        );
        fromToMotion(
            this.id,
            'title',
            animationManager,
            [this.caption.node],
            fns.label,
            (node) => node.unsafeDatum.tickId,
            diff
        );
    }

    protected resetSelectionNodes() {
        resetMotion(
            [this.lineNodeGroup, this.tickLabelGroup, this.tickLineGroup, this.headingLabelGroup],
            resetAxisGroupFn()
        );
        resetMotion([this.gridLineGroupSelection, this.tickLineGroupSelection], resetAxisLineSelectionFn());
        resetMotion([this.gridFillGroupSelection], resetAxisFillSelectionFn());
        resetMotion([this.tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([this.caption.node], resetAxisLabelSelectionFn());
        resetMotion([this.lineNode], resetAxisLineSelectionFn());
    }
}
