import type { ChartAnimationPhase, Scale } from 'ag-charts-core';
import {
    ChartAxisDirection,
    Property,
    StateMachine,
    arraysEqual,
    calcLineHeight,
    countLines,
    diffArrays,
    findMinMax,
    isPlainObject,
} from 'ag-charts-core';
import type { AgCartesianAxisPosition, AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { ModuleContext } from '../../module/moduleContext';
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
import {
    type AxisFillDatum,
    type AxisLabelDatum,
    type AxisLineDatum,
    NiceMode,
    type TickDatum,
    prepareAxisAnimationContext,
    prepareAxisAnimationFunctions,
    resetAxisFillSelectionFn,
    resetAxisGroupFn,
    resetAxisLabelSelectionFn,
    resetAxisLineSelectionFn,
} from './axisUtil';
import { CartesianAxisLabel } from './cartesianAxisLabel';
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

export abstract class CartesianAxis<S extends Scale<D, number, any> = Scale<any, number, any>, D = any> extends Axis<
    S,
    D,
    GeneratedTicks
> {
    static is(value: unknown): value is CartesianAxis<any> {
        return value instanceof CartesianAxis;
    }

    @Property
    thickness?: number;

    @Property
    maxThicknessRatio: number = 0.3;

    @Property
    position!: AgCartesianAxisPosition;

    @Property
    crossAt?: { value: D; sticky?: boolean };

    readonly crossAxisTranslation: { x: number; y: number } = { x: 0, y: 0 };

    minimumTimeGranularity: AgTimeIntervalUnit | undefined = undefined;

    protected animationManager: AnimationManager;

    protected readonly headingLabelGroup = this.axisGroup.appendChild(
        new TranslatableGroup({ name: `${this.id}-Axis-heading` })
    );

    protected readonly lineNodeGroup = this.axisGroup.appendChild(
        new TranslatableGroup({ name: `${this.id}-Axis-line` })
    );
    protected readonly lineNode = this.lineNodeGroup.appendChild(new Line({ zIndex: AxisGroupZIndexMap.AxisLine }));

    protected tickLineGroupSelection = Selection.select<Line, AxisLineDatum>(this.tickLineGroup, Line, false);
    protected gridLineGroupSelection = Selection.select<Line, AxisLineDatum>(this.gridLineGroup, Line, false);
    protected gridFillGroupSelection = Selection.select<Rect, AxisFillDatum>(this.gridFillGroup, Rect, false);

    private readonly tempText = new TransformableText({ debugDirty: false });
    private readonly tempCaption = new Caption();

    protected readonly animationState: StateMachine<AxisAnimationState, AxisAnimationEvent>;

    protected get horizontal() {
        return this.position === 'top' || this.position === 'bottom';
    }

    constructor(moduleCtx: ModuleContext, scale: S) {
        super(moduleCtx, scale);

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

        this.headingLabelGroup.appendChild(this.title.caption.node);

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
            this.title.caption.registerInteraction(this.moduleCtx, 'afterend')
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
        return { ...super.createAxisContext(), position: this.position };
    }

    protected override createLabel() {
        return new CartesianAxisLabel();
    }

    protected updateDirection() {
        switch (this.position) {
            case 'top':
                this.label.mirrored = true;
                this.label.parallel = true;
                break;
            case 'right':
                this.label.mirrored = true;
                this.label.parallel = false;
                break;
            case 'bottom':
                this.label.mirrored = false;
                this.label.parallel = true;
                break;
            case 'left':
                this.label.mirrored = false;
                this.label.parallel = false;
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

    layoutCrossLines(): void {
        const crosslinesVisible = this.hasDefinedDomain() || this.hasVisibleSeries();
        for (const crossLine of this.crossLines) {
            crossLine.calculateLayout?.(crosslinesVisible);
        }
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
        const sideFlag = this.label.getSideFlag();
        const labelX = sideFlag * (this.getTickSize() + this.label.spacing + this.seriesAreaPadding);
        const scrollbar = this.chartLayout?.scrollbars?.[this.id];
        const scrollbarThickness = this.getScrollbarThickness(scrollbar);

        if (
            niceMode[0] === NiceMode.Off &&
            niceMode[1] === NiceMode.Off &&
            this.label.enabled === false &&
            this.tick.enabled === false &&
            this.gridLine.enabled === false
        ) {
            const { bbox, spacing } = this.measureAxisLayout(domain, [], [], scrollbar, scrollbarThickness);
            // Performance optimization: if ticks have no effect, don't generate them
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

        const { label, primaryLabel, scale, range, interval, reverse, defaultTickMinSpacing, minimumTimeGranularity } =
            this;

        const tickGenerationResult = generateTicks({
            label,
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
            axisRotation: this.horizontal ? -0.5 * Math.PI : 0,
            isVertical: this.direction === ChartAxisDirection.Y,
            sizeLimit: this.chartLayout?.sizeLimit,
            inRange: (translation: number) => this.inRange(translation, 0.001),
            tickFormatter: (...args) => this.tickFormatter(...args),
        });

        const { tickData } = tickGenerationResult;
        const removeOverflowLabels =
            this.label.avoidCollisions &&
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

        const { ticks, tickDomain, rawTicks, rawTickCount, fractionDigits, timeInterval, niceDomain } = tickData;

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
        const { gridLine, horizontal } = this;

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
        const { gridLine, horizontal, range } = this;

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
        const { horizontal, tick, primaryTick } = this;

        const datumTick = isPrimary && primaryTick ? primaryTick : tick;
        const tickSize = this.getTickSize(datumTick);
        const tickOffset = scrollbarThickness ? -direction * scrollbarThickness : 0;
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

        const previousTicksIds = Array.from(this.tickLabelGroupSelection.nodes(), (node) => node.datum.tickId);

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

        const { enabled, stroke, width } = this.line;
        // Without this the layout isn't consistent when enabling/disabling the line, padding configurations are not respected.
        this.lineNode.setProperties({ stroke, strokeWidth: enabled ? width : 0 });

        this.updateTickLines();
        this.updateGridLines();
        this.updateGridFills();
    }

    private getAxisTransform() {
        return {
            translationX: Math.floor(this.translation.x + this.crossAxisTranslation.x),
            translationY: Math.floor(this.translation.y + this.crossAxisTranslation.y),
        };
    }

    protected override getLayoutTranslation(): { x: number; y: number } {
        const { translationX, translationY } = this.getAxisTransform();
        return { x: translationX, y: translationY };
    }

    override getLayoutState() {
        const layout = super.getLayoutState();
        return { ...layout, position: this.position };
    }

    protected override updatePosition(): void {
        super.updatePosition();

        const axisTransform = this.getAxisTransform();
        this.tickLineGroup.datum = axisTransform;
        this.tickLabelGroup.datum = axisTransform;
        this.lineNodeGroup.datum = axisTransform;
        this.headingLabelGroup.datum = axisTransform;
    }

    setAxisVisible(visible: boolean) {
        this.tickLineGroup.visible = visible && (this.tick.enabled || (this.primaryTick?.enabled ?? false));
        this.tickLabelGroup.visible = visible && (this.label.enabled || (this.primaryTick?.enabled ?? false));
        this.lineNodeGroup.visible = visible;
        this.headingLabelGroup.visible = visible;
    }

    private getAxisLineCoordinates() {
        const { horizontal } = this;
        const [c1, c2] = findMinMax(this.range);

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
        const tickOffset = scrollbarThickness ? -direction * scrollbarThickness : 0;
        const start = tickOffset;
        const end = tickOffset - direction * tickSize;
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
        return tempCaption.node.getBBox();
    }

    protected getScrollbarThickness(scrollbar?: ScrollbarLayout): number {
        if (!scrollbar) return 0;
        return scrollbar.placement === 'inner' ? scrollbar.spacing + scrollbar.thickness : 0;
    }

    protected resolveScrollbarLayout(
        scrollbar: ScrollbarLayout | undefined,
        labelThickness: number
    ): (ScrollbarLayout & { offset: number }) | undefined {
        if (!scrollbar) return undefined;

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
        const { tick, primaryTick, label, primaryLabel, title, position, horizontal, seriesAreaPadding } = this;
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
                    this.getTickSize(tick) + label.spacing + seriesAreaPadding
                )
            );

            if (primaryLabel.format != null) {
                const { format } = primaryLabel;
                const formats = isPlainObject(format) ? Object.values(format) : [format];
                const maxLines = formats.reduce((m, f) => Math.max(m, countLines(f)), 0);
                boxes.push(
                    new BBox(
                        0,
                        this.getTickSize(primaryTick ?? tick) + primaryLabel.spacing + seriesAreaPadding,
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
        const { title } = this;

        if (!title.enabled) {
            caption.enabled = false;
            return {
                visible: false,
                text: '',
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

        const padding = (title.spacing ?? 0) + spacing;

        const { range } = this;
        const midOffset = (range[0] + range[1]) / 2;
        let x: number;
        let y: number;
        let rotation: number;
        let textBaseline: CanvasTextBaseline;
        switch (this.position) {
            case 'top':
                x = midOffset;
                y = -padding;
                rotation = 0;
                textBaseline = 'bottom';
                break;
            case 'bottom':
                x = midOffset;
                y = padding;
                rotation = 0;
                textBaseline = 'top';
                break;
            case 'left':
                x = -padding;
                y = midOffset;
                rotation = -0.5 * Math.PI;
                textBaseline = 'bottom';
                break;
            case 'right':
                x = padding;
                y = midOffset;
                rotation = 0.5 * Math.PI;
                textBaseline = 'bottom';
                break;
        }

        const { formatter = (p) => p.defaultValue } = title;
        const text = this.cachedCallWithContext(formatter, this.getTitleFormatterParams(domain));
        caption.text = text;

        return {
            visible: true,
            text,
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
        const label = isPrimary && primaryLabel?.enabled ? primaryLabel : this.label;
        const tick = isPrimary && primaryTick?.enabled ? primaryTick : this.tick;
        const { rotation, textBaseline, textAlign } = tickGenerationResult;
        const { range } = scale;
        const sideFlag = this.label.getSideFlag();
        const borderOffset = expandLabelPadding(label)[this.position];
        let labelOffset = sideFlag * (this.getTickSize(tick) + label.spacing + seriesAreaPadding) - borderOffset;

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
        this.gridLineGroupSelection.update(this.gridLine.enabled ? gridLines : [], undefined, getDatumId);
        this.gridFillGroupSelection.update(this.gridLine.enabled ? gridFills : [], undefined, getDatumId);
        this.tickLineGroupSelection.update(tickLines, undefined, getDatumId);
        this.tickLabelGroupSelection.update(labels, undefined, getDatumId);
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
        const { caption } = this.title;
        const titleProps = this.titleProps(caption, domain, spacing);
        caption.node.visible = titleProps.visible;
        caption.node.text = titleProps.text;
        caption.node.textBaseline = titleProps.textBaseline;
        caption.node.datum = titleProps;
    }

    protected updateLabels() {
        if (!this.label.enabled) return;

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
            (_, d) => d.tickId,
            diff
        );
        fromToMotion(
            this.id,
            'title',
            animationManager,
            [this.title.caption.node],
            fns.label,
            (_, d) => d.tickId,
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
        resetMotion([this.title.caption.node], resetAxisLabelSelectionFn());
        resetMotion([this.lineNode], resetAxisLineSelectionFn());
    }
}
