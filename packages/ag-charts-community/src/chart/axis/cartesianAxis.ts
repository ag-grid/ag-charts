import { arraysEqual, countLines, diffArrays, isPlainObject } from 'ag-charts-core';
import type { AgCartesianAxisPosition, TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

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
import type { Padding } from '../../util/padding';
import { Property } from '../../util/properties';
import type { AxisPrimaryTickCount } from '../../util/secondaryAxisTicks';
import { StateMachine } from '../../util/stateMachine';
import { TextUtils } from '../../util/textMeasurer';
import { Caption } from '../caption';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { AnimationManager } from '../interaction/animationManager';
import { Axis, AxisGroupZIndexMap, type LabelNodeDatum } from './axis';
import { AxisTickGenerator, type TickGenerationResult } from './axisTickGenerator';
import {
    type AxisLabelDatum,
    type AxisLineDatum,
    NiceMode,
    type TickDatum,
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

    override calculateLayout(primaryTickCount?: AxisPrimaryTickCount, chartPadding?: Padding) {
        this.updateDirection();
        return super.calculateLayout(primaryTickCount, chartPadding);
    }

    layoutCrossLines(): void {
        const anySeriesActive = this.isAnySeriesActive();
        this.crossLines.forEach((crossLine) => {
            crossLine.calculateLayout?.(anySeriesActive, this.reverse);
        });
    }

    override calculateTickLayout(
        domain: D[],
        niceMode: NiceMode,
        visibleRange: [number, number],
        initialPrimaryTickCount?: AxisPrimaryTickCount
    ): {
        niceDomain: D[];
        tickDomain: D[];
        ticks: D[];
        rawTickCount: number | undefined;
        fractionDigits: number;
        timeInterval: TimeInterval | TimeIntervalUnit | undefined;
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
                rawTickCount: 0,
                tickDomain: domain,
                niceDomain: domain,
                fractionDigits: 0,
                timeInterval: undefined,
                bbox,
            };
        }

        const { range, reverse, defaultTickMinSpacing } = this;
        const removeOverflowLabels = this.horizontal && ContinuousScale.is(this.scale);
        const tickGenerationResult = this.tickGenerator.generateTicks({
            domain,
            range,
            reverse,
            niceMode,
            visibleRange,
            primaryTickCount: initialPrimaryTickCount,
            defaultTickMinSpacing,
            parallelFlipRotation,
            regularFlipRotation,
            labelX,
            sideFlag,
            removeOverflowLabels,
            removeOverflowThreshold: this.chartPadding?.right,
        });

        const { tickData } = tickGenerationResult;
        const {
            ticks,
            tickDomain,
            rawTicks,
            rawTickCount,
            fractionDigits,
            timeInterval,
            niceDomain = domain,
        } = tickData;

        const labels = ticks.map((d) => this.getTickLabelProps(d, tickGenerationResult));

        const { position, horizontal, gridPadding, gridLength } = this;
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;
        const p1 = gridPadding;
        const p2 = direction * gridLength - gridPadding;

        const { gridLine } = this;
        const gridLines = ticks.map(({ tickId, translationY: offset }, index): AxisLineDatum => {
            const [x1, y1, x2, y2] = horizontal ? [offset, p1, offset, p2] : [p1, offset, p2, offset];
            const { style, width: strokeWidth } = gridLine;
            const { stroke, lineDash } = style[index % style.length] ?? {};
            return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
        });

        const { tick, primaryTick } = this;
        const tickLines = ticks.map(({ primary, tickId, translationY: offset }): AxisLineDatum => {
            const datumTick = primary && primaryTick?.enabled ? primaryTick : tick;
            const h = -direction * this.getTickSize(datumTick);
            const [x1, y1, x2, y2] = horizontal ? [offset, 0, offset, h] : [0, offset, h, offset];
            const { stroke, width: strokeWidth } = datumTick;
            const lineDash = undefined;
            return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
        });

        const { bbox, spacing } = this.tickBBox(tickDomain, ticks, labels);

        this.generatedTicks = { ticks, gridLines, tickLines, labels, spacing };

        return { ticks: rawTicks, rawTickCount, tickDomain, niceDomain, fractionDigits, timeInterval, bbox };
    }

    override update() {
        this.updateDirection();

        const previousTicksIds = Array.from(this.tickLabelGroupSelection.nodes(), (node) => node.datum.tickId);

        super.update();

        this.tickLineGroup.visible = this.tick.enabled || (this.primaryTick?.enabled ?? false);
        this.tickLabelGroup.visible = this.label.enabled || (this.primaryTick?.enabled ?? false);

        const { generatedTicks } = this;
        this.updateTitle(this.scale.domain, generatedTicks?.spacing ?? 0);

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

    private getTickLineBBox(datum: TickDatum) {
        const { position, primaryTick } = this;
        const tickSize = Math.max(this.getTickSize(), primaryTick?.enabled ? this.getTickSize(primaryTick) : 0);
        const { translationY } = datum;
        switch (position) {
            case 'top':
                return new BBox(translationY, -tickSize, translationY, tickSize);
            case 'bottom':
                return new BBox(translationY, 0, translationY, tickSize);
            case 'left':
                return new BBox(-tickSize, translationY, tickSize, translationY);
            case 'right':
                return new BBox(0, translationY, tickSize, translationY);
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

    private tickBBox(domain: D[], ticks: TickDatum[], labels: LabelNodeDatum[]) {
        const { tick, primaryTick, label, primaryLabel, title, position, horizontal, seriesAreaPadding } = this;
        const boxes: BBox[] = [];

        boxes.push(this.lineNodeBBox());

        if (tick.enabled || primaryTick?.enabled) {
            for (const datum of ticks) {
                boxes.push(this.getTickLineBBox(datum));
            }
        }

        const { tempText } = this;
        if (label.enabled) {
            for (const datum of labels) {
                if (!datum.visible) continue;

                tempText.setProperties(datum);

                const box = tempText.getBBox(false);
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
                    TextUtils.getLineHeight(label.fontSize) + inexactMeasurementPadding,
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
                        maxLines * TextUtils.getLineHeight(primaryLabel.fontSize) + inexactMeasurementPadding
                    )
                );
            }
        }

        let spacing = 0;
        if (title.enabled) {
            const combined = BBox.merge(boxes);
            spacing = horizontal ? combined.height : combined.width;
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
        const text = this.callWithContext(formatter, this.getTitleFormatterParams(domain));
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

    private getTickLabelProps(datum: TickDatum, tickGenerationResult: TickGenerationResult): LabelNodeDatum {
        const { horizontal, primaryLabel, primaryTick, seriesAreaPadding, scale } = this;
        const { tickId, tickLabel: text = '', translationY, primary } = datum;
        const label = primary && primaryLabel?.enabled ? primaryLabel : this.label;
        const tick = primary && primaryTick?.enabled ? primaryTick : this.tick;
        const { rotation, textBaseline, textAlign } = tickGenerationResult;
        const { range } = scale;
        const sideFlag = this.label.getSideFlag();
        const labelOffset = sideFlag * (this.getTickSize(tick) + label.spacing + seriesAreaPadding);
        const visible = text !== '';

        const x = horizontal ? translationY : labelOffset;
        const y = horizontal ? -labelOffset : translationY;

        return {
            ...this.getLabelStyles({ value: text }, undefined, label),
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
        this.gridLineGroupSelection.each((line, datum) => {
            line.stroke = datum.stroke;
            line.strokeWidth = datum.strokeWidth;
            line.lineDash = datum.lineDash;
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
        resetMotion([this.tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([this.title.caption.node], resetAxisLabelSelectionFn());
        resetMotion([this.lineNode], resetAxisLineSelectionFn());
    }
}
