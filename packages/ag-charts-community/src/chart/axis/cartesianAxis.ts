import { arraysEqual, diffArrays } from 'ag-charts-core';
import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { ModuleContext } from '../../module/moduleContext';
import { type FromToDiff, fromToMotion } from '../../motion/fromToMotion';
import { resetMotion } from '../../motion/resetMotion';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { TransformableText } from '../../scene/shape/text';
import { StateMachine } from '../../util/stateMachine';
import { POSITION, POSITIVE_NUMBER, Validate } from '../../util/validation';
import { Caption } from '../caption';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { AnimationManager } from '../interaction/animationManager';
import { Axis, AxisGroupZIndexMap, type LabelNodeDatum, TranslatableLine } from './axis';
import { AxisTickGenerator, type TickGenerationResult } from './axisTickGenerator';
import { type AxisLabelDatum, NiceMode, type TickDatum } from './axisUtil';
import {
    prepareAxisAnimationContext,
    prepareAxisAnimationFunctions,
    resetAxisGroupFn,
    resetAxisLabelSelectionFn,
    resetAxisLineSelectionFn,
    resetAxisSelectionFn,
} from './axisUtil';
import { CartesianAxisLabel } from './cartesianAxisLabel';

type AxisAnimationState = 'empty' | 'ready';
type AxisAnimationEvent = { reset: undefined; resize: undefined; update: FromToDiff };

interface GeneratedTicks {
    ticks: TickDatum[];
    labels: LabelNodeDatum[];
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

    @Validate(POSITIVE_NUMBER, { optional: true })
    thickness?: number;

    @Validate(POSITION)
    position!: AgCartesianAxisPosition;

    protected animationManager: AnimationManager;

    protected readonly lineNode = this.axisGroup.appendChild(
        new TranslatableLine({
            name: `${this.id}-Axis-line`,
            zIndex: AxisGroupZIndexMap.AxisLine,
        })
    );

    private readonly tempText = new TransformableText();
    private readonly tempCaption = new Caption();

    private readonly tickGenerator = new AxisTickGenerator<S, D>(this as any);
    private generatedTicks: GeneratedTicks | undefined = undefined;

    protected readonly animationState: StateMachine<AxisAnimationState, AxisAnimationEvent>;

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

        this.axisGroup.appendChild(this.title.caption.node);

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
                this.rotation = -90;
                this.label.mirrored = true;
                this.label.parallel = true;
                break;
            case 'right':
                this.rotation = 0;
                this.label.mirrored = true;
                this.label.parallel = false;
                break;
            case 'bottom':
                this.rotation = -90;
                this.label.mirrored = false;
                this.label.parallel = true;
                break;
            case 'left':
                this.rotation = 0;
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
        const { parallelFlipRotation, regularFlipRotation } = this.calculateRotations();
        const labelX = sideFlag * (this.getTickSize() + this.label.spacing + this.seriesAreaPadding);

        if (
            niceMode === NiceMode.Off &&
            this.label.enabled === false &&
            this.tick.enabled === false &&
            this.gridLine.enabled === false
        ) {
            // Performance optimization: if ticks have no effect, don't generate them
            this.generatedTicks = { ticks: [], labels: [] };
            return {
                ticks: [],
                tickDomain: domain,
                niceDomain: domain,
                primaryTickCount: initialPrimaryTickCount,
                fractionDigits: 0,
                bbox: this.tickBBox([], []),
            };
        }

        const tickGenerationResult = this.tickGenerator.generateTicks({
            domain,
            niceMode,
            visibleRange,
            primaryTickCount: initialPrimaryTickCount,
            parallelFlipRotation,
            regularFlipRotation,
            labelX,
            sideFlag,
        });

        const { tickData, primaryTickCount = initialPrimaryTickCount } = tickGenerationResult;
        const { ticks, tickDomain, rawTicks, fractionDigits, niceDomain = domain } = tickData;

        const labels = ticks.map((d) => this.getTickLabelProps(d, tickGenerationResult));
        const bbox = this.tickBBox(ticks, labels);

        this.generatedTicks = { ticks, labels };

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

        this.updateTitle(!this.generatedTicks?.ticks.length);
    }

    protected override updatePosition(): void {
        super.updatePosition();

        this.axisGroup.datum = this.getAxisTransform();
    }

    private tickBBox(ticks: TickDatum[], labels: LabelNodeDatum[]) {
        const sideFlag = this.label.getSideFlag();
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
            for (const datum of ticks) {
                const { x1, x2, y } = this.getTickLineCoordinates(datum);
                const tickLineBox = new BBox(x1, y, x2 - x1, 0);
                boxes.push(tickLineBox);
            }
        }

        const { tempText } = this;
        if (this.label.enabled) {
            for (const datum of labels) {
                if (!datum.visible) continue;

                tempText.setProperties({
                    ...datum,
                    translationY: Math.round(datum.translationY),
                });

                const box = tempText.getBBox();
                if (box) {
                    boxes.push(box);
                }
            }
        }

        if (this.title?.enabled) {
            const spacing = BBox.merge(boxes).width;
            this.setTitleProps(this.tempCaption, { spacing });
            const titleBox = this.tempCaption.node.getBBox();
            if (titleBox) {
                boxes.push(titleBox);
            }
        }

        const bbox = BBox.merge(boxes);
        return this.getTransformBox(bbox);
    }

    private getTickLabelProps(datum: TickDatum, tickGenerationResult: TickGenerationResult): LabelNodeDatum {
        const { combinedRotation, textBaseline, textAlign } = tickGenerationResult;
        const { range } = this.scale;
        const text = datum.tickLabel;
        const sideFlag = this.label.getSideFlag();
        const labelX = sideFlag * (this.getTickSize() + this.label.spacing + this.seriesAreaPadding);
        const visible = text !== '' && text != null;

        return {
            ...this.getLabelStyles({ value: datum.tickLabel }),
            tickId: datum.tickId,
            rotation: combinedRotation,
            rotationCenterX: labelX,
            translationY: datum.translationY,
            text,
            textAlign,
            textBaseline,
            visible,
            x: labelX,
            y: 0,
            range,
        };
    }

    private getTickLineCoordinates(datum: TickDatum) {
        const sideFlag = this.label.getSideFlag();
        const x = sideFlag * this.getTickSize();
        const x1 = Math.min(0, x);
        const x2 = x1 + Math.abs(x);
        const y = datum.translationY;
        return { x1, x2, y };
    }

    protected updateSelections() {
        if (!this.generatedTicks) return;

        const lineData = this.getAxisLineCoordinates();
        const { ticks, labels } = this.generatedTicks;

        const getDatumId = (datum: TickDatum | AxisLabelDatum) => datum.tickId;

        this.lineNode.datum = lineData;
        this.gridLineGroupSelection.update(this.gridLength ? ticks : [], undefined, getDatumId);
        this.tickLineGroupSelection.update(ticks, undefined, getDatumId);
        this.tickLabelGroupSelection.update(labels, undefined, getDatumId);
    }

    protected updateTitle(noVisibleTicks?: boolean, spacing?: number): void {
        const { title, tickLineGroup, tickLabelGroup, lineNode } = this;

        if (title.enabled && !noVisibleTicks && spacing == null) {
            const tickBBox = Group.computeChildrenBBox([tickLineGroup, tickLabelGroup, lineNode]);
            spacing = tickBBox.width + (tickLabelGroup.visible ? 0 : this.seriesAreaPadding);
        }
        spacing ??= 0;

        this.setTitleProps(title.caption, { spacing });
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
        const selectionCtx = prepareAxisAnimationContext(this);

        resetMotion([this.axisGroup], resetAxisGroupFn());
        resetMotion([this.gridLineGroupSelection, this.tickLineGroupSelection], resetAxisSelectionFn(selectionCtx));
        resetMotion([this.tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([this.lineNode], resetAxisLineSelectionFn());
    }
}
