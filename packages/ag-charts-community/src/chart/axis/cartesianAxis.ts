import { arraysEqual, diffArrays } from 'ag-charts-core';
import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { ModuleContext } from '../../module/moduleContext';
import { type FromToDiff, fromToMotion } from '../../motion/fromToMotion';
import { resetMotion } from '../../motion/resetMotion';
import type { Scale } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { TransformableGroup } from '../../scene/group';
import { Matrix } from '../../scene/matrix';
import { Line } from '../../scene/shape/line';
import { TransformableText } from '../../scene/shape/text';
import { normalizeAngle360 } from '../../util/angle';
import { findMinMax } from '../../util/number';
import { Property } from '../../util/properties';
import { StateMachine } from '../../util/stateMachine';
import { Caption } from '../caption';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { AnimationManager } from '../interaction/animationManager';
import { Axis, AxisGroupZIndexMap, type LabelNodeDatum } from './axis';
import { AxisTickGenerator, type TickGenerationResult } from './axisTickGenerator';
import {
    type AxisLabelDatum,
    NiceMode,
    type TickDatum,
    axisLinePosition,
    prepareAxisAnimationContext,
    prepareAxisAnimationFunctions,
    resetAxisGroupFn,
    resetAxisGroupFnNoRotation,
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
        new TransformableGroup({ name: `${this.id}-Axis-heading` })
    );

    protected readonly lineNodeGroup = this.axisGroup.appendChild(
        new TransformableGroup({ name: `${this.id}-Axis-line` })
    );
    protected readonly lineNode = this.lineNodeGroup.appendChild(
        new Line({
            // name: `${this.id}-Axis-line`,
            zIndex: AxisGroupZIndexMap.AxisLine,
        })
    );

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

    protected getTransformBox(bbox: BBox) {
        const matrix = new Matrix();
        const { rotation, translationX, translationY } = this.getAxisTransform();
        Matrix.updateTransformMatrix(matrix, 1, 1, rotation, translationX, translationY);
        return matrix.transformBBox(bbox);
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
            const { bbox, spacing } = this.tickBBox(domain, [], []);
            // Performance optimization: if ticks have no effect, don't generate them
            this.generatedTicks = { ticks: [], labels: [], spacing };
            return {
                ticks: [],
                tickDomain: domain,
                niceDomain: domain,
                primaryTickCount: initialPrimaryTickCount,
                fractionDigits: 0,
                bbox,
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
        const { bbox, spacing } = this.tickBBox(tickDomain, ticks, labels);

        this.generatedTicks = { ticks, labels, spacing };

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

    protected lineNodeBBox() {
        const sideFlag = this.label.getSideFlag();
        const { x, y1, y2 } = this.getAxisLineCoordinates();
        return new BBox(x + Math.min(sideFlag * this.seriesAreaPadding, 0), y1, this.seriesAreaPadding, y2 - y1);
    }

    protected titleBBox(domain: D[], spacing: number) {
        this.setTitleProps(this.tempCaption, { domain, spacing });
        return this.tempCaption.node.getBBox();
    }

    private tickBBox(domain: D[], ticks: TickDatum[], labels: LabelNodeDatum[]) {
        const boxes: BBox[] = [];

        boxes.push(this.lineNodeBBox());

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

        let spacing = 0;
        if (this.title?.enabled) {
            spacing = BBox.merge(boxes).width;
            boxes.push(this.titleBBox(domain, spacing));
        }

        const bbox = BBox.merge(boxes);
        return { bbox: this.getTransformBox(bbox), spacing };
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
        const sideFlag = this.label.getSideFlag();

        const parallelFlipRotation = normalizeAngle360(this.rotation);
        const titleRotationFlag =
            sideFlag === -1 && parallelFlipRotation > Math.PI && parallelFlipRotation < Math.PI * 2 ? -1 : 1;
        const rotation = (titleRotationFlag * sideFlag * Math.PI) / 2;
        const textBaseline = titleRotationFlag === 1 ? 'bottom' : 'top';

        const { range } = this;
        const x = Math.floor((titleRotationFlag * sideFlag * (range[0] + range[1])) / 2);
        const y = sideFlag === -1 ? Math.floor(titleRotationFlag * -padding) : Math.floor(-padding);

        const { formatter = (p) => p.defaultValue } = title;
        const text = this.callWithContext(formatter, this.getTitleFormatterParams(params.domain));
        caption.text = text;

        titleNode.setProperties({ visible: true, text, textBaseline, x, y, rotation });
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

    protected axisExtents(): [number, number] {
        const { position, gridPadding, gridLength } = this;
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;

        return [gridPadding, gridLength * direction + gridPadding];
    }

    protected override updateGridLines() {
        const {
            gridLine: { style, width },
            gridLength,
        } = this;

        if (gridLength === 0 || style.length === 0) {
            return;
        }

        const [p1, p2] = this.axisExtents();
        const linePosition: Partial<Line> = axisLinePosition(!this.horizontal, p1, p2);

        this.gridLineGroupSelection.each((line, _, index) => {
            const { stroke, lineDash } = style[index % style.length];
            line.setProperties(linePosition);
            line.setProperties({
                stroke,
                strokeWidth: width,
                lineDash,
            });
        });
    }

    protected override updateTickLines() {
        const { tick, position, horizontal } = this;
        const direction = position === 'bottom' || position === 'right' ? -1 : 1;

        this.tickLineGroupSelection.each((line, datum: any) => {
            line.strokeWidth = datum.tickWidth ?? tick.width;
            line.stroke = datum.tickStroke ?? tick.stroke;
            line.setProperties(axisLinePosition(!horizontal, 0, -direction * (datum.tickSize ?? this.getTickSize())));
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
        const fns = prepareAxisAnimationFunctions(this.horizontal, selectionCtx);

        fromToMotion(
            this.id,
            'axis-group-no-rotation',
            animationManager,
            [this.tickLineGroup, this.lineNodeGroup],
            fns.groupNoRotation
        );
        fromToMotion(this.id, 'axis-group', animationManager, [this.tickLabelGroup, this.headingLabelGroup], fns.group);
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
        const { horizontal } = this;
        const selectionCtx = prepareAxisAnimationContext(this);

        resetMotion([this.tickLineGroup, this.lineNodeGroup], resetAxisGroupFnNoRotation());
        resetMotion([this.tickLabelGroup, this.headingLabelGroup], resetAxisGroupFn());
        resetMotion(
            [this.gridLineGroupSelection, this.tickLineGroupSelection],
            resetAxisSelectionFn(horizontal, selectionCtx)
        );
        resetMotion([this.tickLabelGroupSelection], resetAxisLabelSelectionFn());
        resetMotion([this.lineNode], resetAxisLineSelectionFn(horizontal));
    }
}
