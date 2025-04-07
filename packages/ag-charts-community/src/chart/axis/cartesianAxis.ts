import { arraysEqual, diffArrays } from 'ag-charts-core';
import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { ModuleContext } from '../../module/moduleContext';
import { type FromToDiff, fromToMotion } from '../../motion/fromToMotion';
import { resetMotion } from '../../motion/resetMotion';
import { ContinuousScale } from '../../scale/continuousScale';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { TranslatableGroup } from '../../scene/group';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { TransformableText } from '../../scene/shape/text';
import { normalizeAngle360 } from '../../util/angle';
import { findMinMax } from '../../util/number';
import { Property } from '../../util/properties';
import { StateMachine } from '../../util/stateMachine';
import { Caption } from '../caption';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import { ChartAxisDirection } from '../chartAxisDirection';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import type { AnimationManager } from '../interaction/animationManager';
import { Axis, AxisGroupZIndexMap, type LabelNodeDatum } from './axis';
import { AxisTickGenerator, type TickDatum, type TickGenerationResult } from './axisTickGenerator';
import {
    type AxisLabelDatum,
    type AxisLineDatum,
    NiceMode,
    prepareAxisAnimationContext,
    prepareAxisAnimationFunctions,
    resetAxisGroupFn,
    resetAxisLabelSelectionFn,
    resetAxisLineSelectionFn,
} from './axisUtil';
import { CartesianAxisLabel } from './cartesianAxisLabel';

type AxisAnimationState = 'empty' | 'ready';
type AxisAnimationEvent = { reset: undefined; resize: undefined; update: FromToDiff };

interface GeneratedTicks {
    ticks: TickDatum[];
    tickLines: AxisLineDatum[];
    gridLines: AxisLineDatum[];
    labels: LabelNodeDatum[];
    spacing: number;
}

export abstract class CartesianAxis<S extends Scale<D, number, any> = Scale<any, number, any>, D = any> extends Axis<
    S,
    D,
    TickDatum,
    LabelNodeDatum
> {
    static is(value: unknown): value is CartesianAxis<any> {
        return value instanceof CartesianAxis;
    }

    @Property
    thickness?: number;

    @Property
    position!: AgCartesianAxisPosition;

    protected animationManager: AnimationManager;

    protected readonly headingLabelGroup = this.axisGroup.appendChild(
        new TranslatableGroup({ name: `${this.id}-Axis-heading` })
    );

    protected readonly lineNodeGroup = this.axisGroup.appendChild(
        new TranslatableGroup({ name: `${this.id}-Axis-line` })
    );
    protected readonly lineNode = this.lineNodeGroup.appendChild(
        new Line({
            // name: `${this.id}-Axis-line`,
            zIndex: AxisGroupZIndexMap.AxisLine,
        })
    );

    protected tickLineGroupSelection = Selection.select<Line, AxisLineDatum>(this.tickLineGroup, Line, false);
    protected gridLineGroupSelection = Selection.select<Line, AxisLineDatum>(this.gridLineGroup, Line, false);

    private readonly tempText = new TransformableText({ debugDirty: false });
    private readonly tempCaption = new Caption();

    private readonly tickGenerator = new AxisTickGenerator<S, D>(this as any);
    private generatedTicks: GeneratedTicks | undefined = undefined;

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
        this.destroyFns.push(
            moduleCtx.layoutManager.addListener('layout:complete', (e) => {
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
        this.gridLineGroupSelection.clear();
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

    override calculateLayout(primaryTickCount?: number) {
        this.updateDirection();
        return super.calculateLayout(primaryTickCount);
    }

    layoutCrossLines(): void {
        const { position, label } = this;
        const anySeriesActive = this.isAnySeriesActive();
        this.crossLines.forEach((crossLine) => {
            if (crossLine instanceof CartesianCrossLine) {
                crossLine.position = position;
                crossLine.label.parallel ??= label.parallel;
            }
            crossLine.calculateLayout?.(anySeriesActive, this.reverse);
        });
    }

    override calculateTickLayout(
        domain: D[],
        niceMode: NiceMode,
        visibleRange: [number, number],
        initialPrimaryTickCount?: number
    ): {
        niceDomain: D[];
        primaryTickCount: number | undefined;
        tickDomain: D[];
        ticks: D[];
        fractionDigits: number;
        bbox: BBox;
    } {
        const sideFlag = this.label.getSideFlag();
        const rotation = this.horizontal ? -0.5 * Math.PI : 0;
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

        const labelX = sideFlag * (this.getTickSize() + this.label.spacing + this.seriesAreaPadding);

        if (
            niceMode === NiceMode.Off &&
            this.label.enabled === false &&
            this.tick.enabled === false &&
            this.gridLine.enabled === false
        ) {
            const { bbox, spacing } = this.tickBBox(domain, [], []);
            // Performance optimization: if ticks have no effect, don't generate them
            this.generatedTicks = { ticks: [], tickLines: [], gridLines: [], labels: [], spacing };
            return {
                ticks: [],
                tickDomain: domain,
                niceDomain: domain,
                primaryTickCount: initialPrimaryTickCount,
                fractionDigits: 0,
                bbox,
            };
        }

        const removeOverflowingLabels = this.horizontal && ContinuousScale.is(this.scale);
        const tickGenerationResult = this.tickGenerator.generateTicks({
            domain,
            niceMode,
            visibleRange,
            primaryTickCount: initialPrimaryTickCount,
            parallelFlipRotation,
            regularFlipRotation,
            labelX,
            sideFlag,
            removeOverflowingLabels,
        });

        const { tickData, primaryTickCount = initialPrimaryTickCount } = tickGenerationResult;
        const { ticks, tickDomain, rawTicks, fractionDigits, niceDomain = domain } = tickData;

        const labels = ticks.map((d) => this.getTickLabelProps(d, tickGenerationResult));

        const { position, horizontal, gridPadding, gridLength } = this;
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;
        const p1 = gridPadding;
        const p2 = direction * gridLength - gridPadding;

        const gridLines = ticks.map(({ tickId, translationY }) => {
            return horizontal
                ? { tickId, offset: translationY, x1: translationY, x2: translationY, y1: p1, y2: p2 }
                : { tickId, offset: translationY, x1: p1, x2: p2, y1: translationY, y2: translationY };
        });

        const tickLines = ticks.map(({ tickId, translationY, tickSize }) => {
            const h = -direction * (tickSize ?? this.getTickSize());
            return horizontal
                ? { tickId, offset: translationY, x1: translationY, x2: translationY, y1: 0, y2: h }
                : { tickId, offset: translationY, x1: 0, x2: h, y1: translationY, y2: translationY };
        });

        const { bbox, spacing } = this.tickBBox(tickDomain, ticks, labels);

        this.generatedTicks = { ticks, gridLines, tickLines, labels, spacing };

        return { ticks: rawTicks, tickDomain, niceDomain, primaryTickCount, fractionDigits, bbox };
    }

    override update() {
        this.updateDirection();

        const previousTicksIds = Array.from(this.tickLabelGroupSelection.nodes(), (node) => node.datum.tickId);

        super.update();

        if (!this.animatable) {
            this.moduleCtx.animationManager.skipCurrentBatch();
        }

        if (this.generatedTicks) {
            const { ticks } = this.generatedTicks;

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

        const { generatedTicks } = this;
        this.updateTitle(this.scale.domain, generatedTicks?.spacing ?? 0);

        this.updateTickLines();
        this.updateGridLines();
    }

    private getAxisTransform() {
        return {
            translationX: Math.floor(this.translation.x),
            translationY: Math.floor(this.translation.y),
        };
    }

    protected override updatePosition(): void {
        super.updatePosition();

        const axisTransform = this.getAxisTransform();
        this.tickLineGroup.datum = axisTransform;
        this.tickLabelGroup.datum = axisTransform;
        this.lineNodeGroup.datum = axisTransform;
        this.headingLabelGroup.datum = axisTransform;
    }

    private getAxisLineCoordinates() {
        const { horizontal } = this;
        const [c1, c2] = findMinMax(this.range);

        return horizontal ? { x1: c1, x2: c2, y1: 0, y2: 0 } : { x1: 0, x2: 0, y1: c1, y2: c2 };
    }

    private getTickLineCoordinates(datum: TickDatum) {
        const sideFlag = this.label.getSideFlag();
        const x = sideFlag * this.getTickSize();
        const x1 = Math.min(0, x);
        const x2 = x1 + Math.abs(x);
        const y = datum.translationY;
        return { x1, x2, y };
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
        this.setTitleProps(this.tempCaption, { domain, spacing });
        return this.tempCaption.node.getBBox();
    }

    private tickBBox(domain: D[], ticks: TickDatum[], labels: LabelNodeDatum[]) {
        const { horizontal } = this;
        const boxes: BBox[] = [];

        boxes.push(this.lineNodeBBox());

        if (this.tick.enabled) {
            for (const datum of ticks) {
                const { x1, x2, y } = this.getTickLineCoordinates(datum);
                const tickLineBox = horizontal ? new BBox(y, x1, 0, x2 - x1) : new BBox(x1, y, x2 - x1, 0);
                boxes.push(tickLineBox);
            }
        }

        const { tempText } = this;
        if (this.label.enabled) {
            for (const datum of labels) {
                if (!datum.visible) continue;

                tempText.setProperties(datum);

                const box = tempText.getBBox();
                if (box) {
                    boxes.push(box);
                }
            }
        }

        let spacing = 0;
        if (this.title?.enabled) {
            const combined = BBox.merge(boxes);
            spacing = horizontal ? combined.height : combined.width;
            boxes.push(this.titleBBox(domain, spacing));
        }

        const bbox = BBox.merge(boxes);
        return { bbox, spacing };
    }

    protected setTitleProps(caption: Caption, params: { domain: D[]; spacing: number }) {
        const { title } = this;

        if (!title.enabled) {
            caption.enabled = false;
            caption.node.visible = false;
            return;
        }

        caption.enabled = true;
        caption.color = title.color;
        caption.fontFamily = title.fontFamily;
        caption.fontSize = title.fontSize;
        caption.fontStyle = title.fontStyle;
        caption.fontWeight = title.fontWeight;
        caption.wrapping = title.wrapping;

        const titleNode = caption.node;
        const padding = (title.spacing ?? 0) + params.spacing;

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
        const text = this.callWithContext(formatter, this.getTitleFormatterParams(params.domain));
        caption.text = text;

        titleNode.setProperties({
            visible: true,
            text,
            textBaseline,
            x,
            y,
            rotationCenterX: x,
            rotationCenterY: y,
            rotation,
        });
    }

    private getTickLabelProps(datum: TickDatum, tickGenerationResult: TickGenerationResult): LabelNodeDatum {
        const { horizontal } = this;
        const { rotation, textBaseline, textAlign } = tickGenerationResult;
        const { range } = this.scale;
        const { tickId, tickLabel: text = '', translationY } = datum;
        const sideFlag = this.label.getSideFlag();
        const labelOffset = sideFlag * (this.getTickSize() + this.label.spacing + this.seriesAreaPadding);
        const visible = text !== '';

        const x = horizontal ? translationY : labelOffset;
        const y = horizontal ? -labelOffset : translationY;

        return {
            ...this.getLabelStyles({ value: text }),
            tickId,
            rotation,
            text,
            textAlign,
            textBaseline,
            visible,
            x,
            y,
            rotationCenterX: x,
            rotationCenterY: y,
            range,
        };
    }

    protected updateSelections() {
        if (!this.generatedTicks) return;

        const lineData = this.getAxisLineCoordinates();
        const { tickLines, gridLines, labels } = this.generatedTicks;

        const getDatumId = (datum: AxisLabelDatum | AxisLineDatum) => datum.tickId;

        this.lineNode.datum = lineData;
        this.gridLineGroupSelection.update(this.gridLine.enabled ? gridLines : [], undefined, getDatumId);
        this.tickLineGroupSelection.update(tickLines, undefined, getDatumId);
        this.tickLabelGroupSelection.update(labels, undefined, getDatumId);
    }

    protected updateGridLines() {
        const { style, width } = this.gridLine;

        if (this.gridLength === 0 || style.length === 0) return;

        this.gridLineGroupSelection.each((line, _, index) => {
            const { stroke, lineDash } = style[index % style.length];
            line.stroke = stroke;
            line.strokeWidth = width;
            line.lineDash = lineDash;
        });
    }

    protected updateTickLines() {
        const { tick } = this;

        this.tickLineGroupSelection.each((line, datum: any) => {
            line.strokeWidth = datum.tickWidth ?? tick.width;
            line.stroke = datum.tickStroke ?? tick.stroke;
        });
    }

    protected updateTitle(domain: D[], spacing: number): void {
        const { title } = this;

        this.setTitleProps(title.caption, { domain, spacing });
    }

    protected updateLabels() {
        if (!this.label.enabled) return;

        // Apply label option values
        this.tickLabelGroupSelection.each((node, datum) => {
            node.fill = datum.fill;
            node.fontFamily = datum.fontFamily;
            node.fontSize = datum.fontSize;
            node.fontStyle = datum.fontStyle;
            node.fontWeight = datum.fontWeight;
            node.text = datum.text;
            node.textBaseline = datum.textBaseline;
            node.textAlign = datum.textAlign ?? 'center';
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
    }

    protected resetSelectionNodes() {
        resetMotion(
            [this.lineNodeGroup, this.tickLabelGroup, this.tickLineGroup, this.headingLabelGroup],
            resetAxisGroupFn()
        );
        resetMotion([this.gridLineGroupSelection, this.tickLineGroupSelection], resetAxisLineSelectionFn());
        resetMotion([this.tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([this.lineNode], resetAxisLineSelectionFn());
    }
}
