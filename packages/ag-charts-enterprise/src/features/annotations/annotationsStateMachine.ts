import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType, type GuardDragClickDoubleEvent } from './annotationTypes';
import { colorDatum, getTypedDatum, isTextType } from './annotationsConfig';
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
    TextInput = 'text-input',
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

export class AnnotationsStateMachine extends StateMachine<States, AnnotationType | AnnotationEvent> {
    override debug = _Util.Debug.create(true, 'annotations');

    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private hovered?: number;

    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private active?: number;

    constructor(ctx: AnnotationsStateMachineContext) {
        // A `click` is preceeded by the `dragStart` and `dragEnd` events, since `dragStart` also selects the annotation we
        // need to differentiate when the second time the annotation is clicked was not the first `click` event after
        // the `dragStart.
        let selectedWithDrag = false;

        // Ensure that a double event of drag before a single click does not trigger an immediate transition causing
        // the start and end to be at the same point.
        let hoverEventsCount = 0;
        const guardDragClickDoubleEvent: GuardDragClickDoubleEvent = {
            guard: () => hoverEventsCount > 0,
            hover: () => {
                hoverEventsCount++;
            },
            reset: () => {
                hoverEventsCount = 0;
            },
        };

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

        const dragStateMachine = <
            D extends AnnotationProperties,
            N extends {
                dragStart: (datum: D, offset: _Util.Vec2, context: AnnotationContext) => void;
                drag: (datum: D, offset: _Util.Vec2, context: AnnotationContext) => void;
                stopDragging: () => void;
            },
        >(
            isDatum: (value: unknown) => value is D,
            isNode: (value: unknown) => value is N
        ) => {
            const node = getNode(isNode);
            const datum = getDatum(isDatum);

            return new (class extends StateMachine<'idle' | 'dragging', 'drag' | 'dragStart' | 'dragEnd'> {
                override debug = _Util.Debug.create(true, 'annotations');
                constructor() {
                    super('idle', {
                        idle: {
                            dragStart: {
                                target: 'dragging',
                                action: ({ offset, context }) => {
                                    node()?.dragStart(datum()!, offset, context);
                                },
                            },
                        },

                        dragging: {
                            drag: ({ offset, context }) => {
                                selectedWithDrag = true;
                                node()?.drag(datum()!, offset, context);
                                ctx.update();
                            },

                            dragEnd: {
                                target: StateMachine.parent,
                                action: () => {
                                    node()?.stopDragging();
                                    ctx.stopInteracting();
                                },
                            },
                        },
                    });
                }
            })();
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

                click: [
                    {
                        guard: () => {
                            if (this.active == null || this.hovered !== this.active || selectedWithDrag) return false;
                            const datum = ctx.datum(this.active);
                            if (!datum) return false;
                            return isTextType(datum) && !datum.locked;
                        },
                        target: States.TextInput,
                    },
                    {
                        target: States.Idle,
                        action: () => {
                            this.active = ctx.select(this.hovered, this.active);
                            selectedWithDrag = false;
                        },
                    },
                ],

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
                        selectedWithDrag = this.active == null;
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
                    guardDragClickDoubleEvent,
                }),
                [AnnotationType.HorizontalLine]: new CrossLineStateMachine('horizontal', {
                    ...ctx,
                    create: createDatum<CrossLineProperties>(AnnotationType.HorizontalLine),
                }),
                [AnnotationType.VerticalLine]: new CrossLineStateMachine('vertical', {
                    ...ctx,
                    create: createDatum<CrossLineProperties>(AnnotationType.VerticalLine),
                }),

                // Channels
                [AnnotationType.DisjointChannel]: new DisjointChannelStateMachine({
                    ...ctx,
                    create: createDatum<DisjointChannelProperties>(AnnotationType.DisjointChannel),
                    datum: getDatum<DisjointChannelProperties>(DisjointChannelProperties.is),
                    node: getNode<DisjointChannelScene>(DisjointChannelScene.is),
                    guardDragClickDoubleEvent,
                }),
                [AnnotationType.ParallelChannel]: new ParallelChannelStateMachine({
                    ...ctx,
                    create: createDatum<ParallelChannelProperties>(AnnotationType.ParallelChannel),
                    datum: getDatum<ParallelChannelProperties>(ParallelChannelProperties.is),
                    node: getNode<ParallelChannelScene>(ParallelChannelScene.is),
                    guardDragClickDoubleEvent,
                }),

                // Texts
                [AnnotationType.Text]: new TextStateMachine({
                    ...ctx,
                    create: createDatum<TextProperties>(AnnotationType.Text),
                    delete: () => {
                        if (this.active != null) ctx.delete(this.active);
                        this.active = ctx.select();
                    },
                    datum: getDatum<TextProperties>(TextProperties.is),
                    node: getNode<TextScene>(TextScene.is),
                    showTextInput: () => {
                        if (this.active != null) ctx.showTextInput(this.active);
                    },
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
                [AnnotationType.Line]: dragStateMachine<LineProperties, LineScene>(LineProperties.is, LineScene.is),
                [AnnotationType.HorizontalLine]: dragStateMachine<HorizontalLineProperties, CrossLineScene>(
                    HorizontalLineProperties.is,
                    CrossLineScene.is
                ),
                [AnnotationType.VerticalLine]: dragStateMachine<VerticalLineProperties, CrossLineScene>(
                    VerticalLineProperties.is,
                    CrossLineScene.is
                ),

                // Channels
                [AnnotationType.ParallelChannel]: dragStateMachine<ParallelChannelProperties, ParallelChannelScene>(
                    ParallelChannelProperties.is,
                    ParallelChannelScene.is
                ),
                [AnnotationType.DisjointChannel]: dragStateMachine<DisjointChannelProperties, DisjointChannelScene>(
                    DisjointChannelProperties.is,
                    DisjointChannelScene.is
                ),

                // Texts
                [AnnotationType.Text]: dragStateMachine<TextProperties, TextScene>(TextProperties.is, TextScene.is),
            },

            [States.TextInput]: {
                onEnter: () => {
                    if (this.active == null) return;

                    const datum = getTypedDatum(ctx.datum(this.active));
                    if (!datum || !('getTextBBox' in datum)) return;

                    ctx.startInteracting();
                    ctx.showTextInput(this.active);
                    datum.visible = false;

                    ctx.update();
                },

                click: {
                    target: States.Idle,
                    action: ({ textInputValue }: { textInputValue?: string }) => {
                        if (textInputValue) {
                            ctx.datum(this.active!)?.set({ text: textInputValue });
                        } else {
                            ctx.delete(this.active!);
                        }
                    },
                },

                keyDown: {
                    guard: ({ key }: { key: string }) => key === 'Escape',
                    target: States.Idle,
                },

                onExit: () => {
                    if (this.active == null) return;

                    const datum = ctx.datum(this.active);
                    if (!datum) return;

                    ctx.stopInteracting();
                    ctx.hideTextInput();
                    datum.visible = true;

                    this.active = this.hovered = ctx.select(undefined, this.active);
                },
            },
        });
    }

    // TODO: remove this leak
    public getActive() {
        return this.active;
    }

    // TODO: remove this leak
    public isActive(index: number) {
        return index === this.active;
    }
}
