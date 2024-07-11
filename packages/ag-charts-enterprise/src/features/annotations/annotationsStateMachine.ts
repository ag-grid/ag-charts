import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType } from './annotationTypes';
import { colorDatum } from './annotationsConfig';
import type { AnnotationProperties, AnnotationsStateMachineContext } from './annotationsSuperTypes';
import {
    type CrossLineProperties,
    HorizontalLineProperties,
    VerticalLineProperties,
} from './cross-line/crossLineProperties';
import { CrossLineScene } from './cross-line/crossLineScene';
import { CrossLineStateMachine } from './cross-line/crossLineState';
import { DisjointChannelProperties } from './disjoint-channel/disjointChannelProperties';
import { DisjointChannelScene } from './disjoint-channel/disjointChannelScene';
import { DisjointChannelStateMachine } from './disjoint-channel/disjointChannelState';
import { LineProperties } from './line/lineProperties';
import { LineScene } from './line/lineScene';
import { LineStateMachine } from './line/lineState';
import { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import { ParallelChannelStateMachine } from './parallel-channel/parallelChannelState';
import { TextProperties } from './text/textProperties';
import { TextScene } from './text/textScene';
import { TextStateMachine } from './text/textState';

const { StateMachine } = _ModuleSupport;

enum States {
    Idle = 'idle',
    Dragging = 'dragging',
}
type AnnotationEvent =
    | 'click'
    | 'hover'
    | 'drag'
    | 'dragStart'
    | 'dragEnd'
    | 'input'
    | 'cancel'
    | 'reset'
    | 'color'
    | 'keyDown';

export class AnnotationsStateMachine extends StateMachine<
    States | AnnotationType.Line,
    AnnotationType | AnnotationEvent
> {
    override debug = _Util.Debug.create(true, 'annotations');

    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private hovered?: number;

    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private active?: number;

    constructor(ctx: AnnotationsStateMachineContext) {
        const getDatum =
            <T>(is: (value: unknown) => value is T) =>
            () => {
                if (this.active == null) return;
                const datum = ctx.datum(this.active);
                if (is(datum)) return datum;
            };

        const getNode =
            <T>(is: (value: unknown) => value is T) =>
            () => {
                if (this.active == null) return;
                const node = ctx.node(this.active);
                if (is(node)) return node;
            };

        const createDatum =
            <T extends AnnotationProperties>(type: AnnotationType) =>
            (datum: T) => {
                ctx.create(type, datum);
                this.active = ctx.selectLast();
            };

        super(States.Idle, {
            [States.Idle]: {
                onEnter: () => {
                    ctx.resetToIdle();
                    ctx.select(this.active);
                },

                hover: ({ offset }: { offset: _Util.Vec2 }) => {
                    this.hovered = ctx.hoverAtCoords(offset, this.active);
                },

                click: () => {
                    this.active = ctx.select(this.hovered, this.active);
                },

                drag: {
                    guard: () => this.hovered != null,
                    target: States.Idle,
                    action: () => {
                        this.active = ctx.select(this.hovered, this.active);
                    },
                },

                dragStart: {
                    guard: () => this.hovered != null,
                    target: States.Dragging,
                    action: () => {
                        this.active = ctx.select(this.hovered, this.active);
                        ctx.startInteracting();
                    },
                },

                color: {
                    guard: () => this.active != null,
                    target: States.Idle,
                    action: (color: string) => {
                        const datum = ctx.datum(this.active!);
                        if (!datum) return;

                        colorDatum(datum, color);
                        ctx.update();
                    },
                },

                reset: () => {
                    if (this.active != null) {
                        ctx.node(this.active)?.toggleActive(false);
                    }

                    this.hovered = undefined;
                    this.active = undefined;

                    ctx.resetToIdle();
                },

                // Lines
                [AnnotationType.Line]: new LineStateMachine({
                    ...ctx,
                    create: createDatum<LineProperties>(AnnotationType.Line),
                    datum: getDatum<LineProperties>(LineProperties.is),
                    node: getNode<LineScene>(LineScene.is),
                }),
                [AnnotationType.HorizontalLine]: new CrossLineStateMachine('horizontal', {
                    ...ctx,
                    create: createDatum<CrossLineProperties>(AnnotationType.HorizontalLine),
                    datum: getDatum<HorizontalLineProperties>(HorizontalLineProperties.is),
                    node: getNode<CrossLineScene>(CrossLineScene.is),
                }),
                [AnnotationType.VerticalLine]: new CrossLineStateMachine('vertical', {
                    ...ctx,
                    create: createDatum<CrossLineProperties>(AnnotationType.VerticalLine),
                    datum: getDatum<VerticalLineProperties>(VerticalLineProperties.is),
                    node: getNode<CrossLineScene>(CrossLineScene.is),
                }),

                // Channels
                [AnnotationType.DisjointChannel]: new DisjointChannelStateMachine({
                    ...ctx,
                    create: createDatum<DisjointChannelProperties>(AnnotationType.DisjointChannel),
                    datum: getDatum<DisjointChannelProperties>(DisjointChannelProperties.is),
                    node: getNode<DisjointChannelScene>(DisjointChannelScene.is),
                }),
                [AnnotationType.ParallelChannel]: new ParallelChannelStateMachine({
                    ...ctx,
                    create: createDatum<ParallelChannelProperties>(AnnotationType.ParallelChannel),
                    datum: getDatum<ParallelChannelProperties>(ParallelChannelProperties.is),
                    node: getNode<ParallelChannelScene>(ParallelChannelScene.is),
                }),

                // Texts
                [AnnotationType.Text]: new TextStateMachine({
                    ...ctx,
                    create: createDatum<TextProperties>(AnnotationType.Text),
                    datum: getDatum<TextProperties>(TextProperties.is),
                    node: getNode<TextScene>(TextScene.is),
                    showTextInput: () => ctx.showTextInput(this.active),
                }),
            },

            [States.Dragging]: {
                onEnter: (_, data: any) => {
                    if (this.active == null) return;

                    const type = ctx.getAnnotationType(this.active);
                    if (!type) return;

                    this.transition(type);
                    this.transition('dragStart', data);
                },

                // Lines
                [AnnotationType.Line]: new DragStateMachine({
                    ...ctx,
                    datum: getDatum<LineProperties>(LineProperties.is),
                    node: getNode<LineScene>(LineScene.is),
                }),

                [AnnotationType.HorizontalLine]: new DragStateMachine({
                    ...ctx,
                    datum: getDatum<HorizontalLineProperties>(HorizontalLineProperties.is),
                    node: getNode<CrossLineScene>(CrossLineScene.is),
                }),

                [AnnotationType.VerticalLine]: new DragStateMachine({
                    ...ctx,
                    datum: getDatum<VerticalLineProperties>(VerticalLineProperties.is),
                    node: getNode<CrossLineScene>(CrossLineScene.is),
                }),

                // Channels
                [AnnotationType.ParallelChannel]: new DragStateMachine({
                    ...ctx,
                    datum: getDatum<ParallelChannelProperties>(ParallelChannelProperties.is),
                    node: getNode<ParallelChannelScene>(ParallelChannelScene.is),
                }),

                [AnnotationType.DisjointChannel]: new DragStateMachine({
                    ...ctx,
                    datum: getDatum<DisjointChannelProperties>(DisjointChannelProperties.is),
                    node: getNode<DisjointChannelScene>(DisjointChannelScene.is),
                }),

                // Texts
                [AnnotationType.Text]: new DragStateMachine({
                    ...ctx,
                    datum: getDatum<TextProperties>(TextProperties.is),
                    node: getNode<TextScene>(TextScene.is),
                }),
            },

            [AnnotationType.Line]: {},
        });
    }

    // TODO: remove this leak
    public getActive() {
        return this.active;
    }

    // TODO: remove this leak
    public isActive(index: Number) {
        return index === this.active;
    }
}

class DragStateMachine<
    D extends AnnotationProperties,
    N extends {
        dragStart?: (datum: D, offset: _Util.Vec2, context: AnnotationContext) => void;
        drag: (datum: D, offset: _Util.Vec2, context: AnnotationContext) => void;
        stopDragging: () => void;
    },
> extends StateMachine<'idle' | 'dragging', 'drag' | 'dragStart' | 'dragEnd'> {
    override debug = _Util.Debug.create(true, 'annotations');
    constructor(
        ctx: {
            datum: () => D | undefined;
            node: () => N | undefined;
        } & AnnotationsStateMachineContext
    ) {
        super('idle', {
            idle: {
                dragStart: {
                    target: 'dragging',
                    action: ({ offset, context }) => {
                        ctx.node()?.dragStart?.(ctx.datum()!, offset, context);
                    },
                },
            },

            dragging: {
                drag: ({ offset, context }) => {
                    ctx.node()?.drag(ctx.datum()!, offset, context);
                    ctx.update();
                },

                dragEnd: {
                    target: StateMachine.parent,
                    action: () => {
                        ctx.node()?.stopDragging();
                        ctx.stopInteracting();
                    },
                },
            },
        });
    }
}
