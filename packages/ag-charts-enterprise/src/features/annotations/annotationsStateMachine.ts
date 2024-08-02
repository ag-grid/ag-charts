import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import {
    type AnnotationContext,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type GuardDragClickDoubleEvent,
} from './annotationTypes';
import { getTypedDatum, isTextType, setColor, setFontsize } from './annotationsConfig';
import type { AnnotationProperties, AnnotationsStateMachineContext } from './annotationsSuperTypes';
import { CalloutProperties } from './callout/calloutProperties';
import { CalloutScene } from './callout/calloutScene';
import { CalloutStateMachine } from './callout/calloutState';
import { CommentProperties } from './comment/commentProperties';
import { CommentScene } from './comment/commentScene';
import { CommentStateMachine } from './comment/commentState';
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
import { NoteProperties } from './note/noteProperties';
import { NoteScene } from './note/noteScene';
import { NoteStateMachine } from './note/noteState';
import { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import { ParallelChannelStateMachine } from './parallel-channel/parallelChannelState';
import { guardCancelAndExit, guardSaveAndExit } from './states/textualStateUtils';
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
    | 'fontSize'
    | 'keyDown'
    | 'updateTextInputBBox'
    | 'render';

export class AnnotationsStateMachine extends StateMachine<States, AnnotationType | AnnotationEvent> {
    override debug = _Util.Debug.create(true, 'annotations');

    private hovered?: number;
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

        const deleteDatum = () => {
            if (this.active != null) ctx.delete(this.active);
            this.active = undefined;
            ctx.select();
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

            return new (class DragStateMachine extends StateMachine<
                'idle' | 'dragging',
                'drag' | 'dragStart' | 'dragEnd'
            > {
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

        const textStateMachineContext = <T, U>(
            type: AnnotationType,
            isDatum: (value: unknown) => value is T,
            isNode: (value: unknown) => value is U
        ) => ({
            ...ctx,
            create: createDatum(type),
            delete: deleteDatum,
            datum: getDatum<T>(isDatum),
            node: getNode<U>(isNode),
            showTextInput: () => {
                if (this.active != null) ctx.showTextInput(this.active);
            },
            deselect: () => {
                const prevActive = this.active;
                this.active = this.hovered = undefined;
                ctx.select(this.active, prevActive);
            },
            showAnnotationOptions: () => {
                if (this.active != null) ctx.showAnnotationOptions(this.active);
            },
        });

        const actionColor = ({
            colorPickerType,
            color,
        }: {
            colorPickerType: AnnotationOptionsColorPickerType;
            color: string;
        }) => {
            const datum = ctx.datum(this.active!);
            if (!datum) return;

            if (colorPickerType === 'text-color') {
                ctx.updateTextInputColor(color);
            }
            setColor(datum, colorPickerType, color);
            ctx.update();
        };

        const actionFontSize = (fontSize: number) => {
            const datum = ctx.datum(this.active!);
            const node = ctx.node(this.active!);
            if (!datum || !node || !isTextType(datum)) return;

            ctx.updateTextInputFontSize(fontSize);

            setFontsize(datum, datum.type, fontSize);

            if ('invalidateTextInputBBox' in node) {
                node.invalidateTextInputBBox();
            }

            ctx.update();
        };

        const guardActive = () => this.active != null;
        const guardHovered = () => this.hovered != null;

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
                            const prevActive = this.active;
                            this.active = this.hovered;
                            ctx.select(this.hovered, prevActive);
                            selectedWithDrag = false;
                        },
                    },
                ],

                drag: {
                    guard: guardHovered,
                    target: States.Idle,
                    action: () => {
                        const prevActive = this.active;
                        this.active = this.hovered;
                        ctx.select(this.hovered, prevActive);
                    },
                },

                dragStart: {
                    guard: guardHovered,
                    target: States.Dragging,
                    action: () => {
                        selectedWithDrag = this.active == null || this.hovered != this.active;
                        const prevActive = this.active;
                        this.active = this.hovered;
                        ctx.select(this.hovered, prevActive);
                        ctx.startInteracting();
                    },
                },

                color: {
                    guard: guardActive,
                    target: States.Idle,
                    action: actionColor,
                },

                fontSize: {
                    guard: guardActive,
                    target: States.Idle,
                    action: actionFontSize,
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
                    delete: deleteDatum,
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
                    delete: deleteDatum,
                    datum: getDatum<DisjointChannelProperties>(DisjointChannelProperties.is),
                    node: getNode<DisjointChannelScene>(DisjointChannelScene.is),
                    guardDragClickDoubleEvent,
                }),
                [AnnotationType.ParallelChannel]: new ParallelChannelStateMachine({
                    ...ctx,
                    create: createDatum<ParallelChannelProperties>(AnnotationType.ParallelChannel),
                    delete: deleteDatum,
                    datum: getDatum<ParallelChannelProperties>(ParallelChannelProperties.is),
                    node: getNode<ParallelChannelScene>(ParallelChannelScene.is),
                    guardDragClickDoubleEvent,
                }),

                // Texts
                [AnnotationType.Text]: new TextStateMachine(
                    textStateMachineContext<TextProperties, TextScene>(
                        AnnotationType.Text,
                        TextProperties.is,
                        TextScene.is
                    )
                ),
                [AnnotationType.Comment]: new CommentStateMachine(
                    textStateMachineContext<CommentProperties, CommentScene>(
                        AnnotationType.Comment,
                        CommentProperties.is,
                        CommentScene.is
                    )
                ),
                [AnnotationType.Callout]: new CalloutStateMachine(
                    textStateMachineContext<CalloutProperties, CalloutScene>(
                        AnnotationType.Callout,
                        CalloutProperties.is,
                        CalloutScene.is
                    )
                ),
                [AnnotationType.Note]: new NoteStateMachine(
                    textStateMachineContext<NoteProperties, NoteScene>(
                        AnnotationType.Note,
                        NoteProperties.is,
                        NoteScene.is
                    )
                ),
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
                [AnnotationType.Comment]: dragStateMachine<CommentProperties, CommentScene>(
                    CommentProperties.is,
                    CommentScene.is
                ),
                [AnnotationType.Callout]: dragStateMachine<CalloutProperties, CalloutScene>(
                    CalloutProperties.is,
                    CalloutScene.is
                ),
                [AnnotationType.Note]: dragStateMachine<NoteProperties, NoteScene>(NoteProperties.is, NoteScene.is),
            },

            [States.TextInput]: {
                onEnter: () => {
                    if (this.active == null) return;

                    const datum = getTypedDatum(ctx.datum(this.active));
                    if (!datum || !('getTextInputCoords' in datum)) return;

                    ctx.startInteracting();
                    ctx.showTextInput(this.active);
                    datum.visible = false;

                    ctx.update();
                },

                updateTextInputBBox: {
                    guard: guardActive,
                    target: States.TextInput,
                    action: (bbox: _Scene.BBox) => {
                        const node = ctx.node(this.active!);
                        if (!node || !('setTextInputBBox' in node)) return;
                        node.setTextInputBBox(bbox);
                        ctx.update();
                    },
                },

                click: {
                    target: States.Idle,
                    action: ({ textInputValue }: { textInputValue?: string }) => {
                        if (textInputValue != null && textInputValue.length > 0) {
                            ctx.datum(this.active!)?.set({ text: textInputValue });
                            ctx.update();
                        } else {
                            ctx.delete(this.active!);
                        }
                    },
                },

                keyDown: [
                    {
                        guard: guardCancelAndExit,
                        target: States.Idle,
                    },
                    {
                        guard: guardSaveAndExit,
                        target: States.Idle,
                        action: ({ textInputValue }: { textInputValue?: string }) => {
                            ctx.datum(this.active!)?.set({ text: textInputValue });
                            ctx.update();
                        },
                    },
                ],

                color: {
                    guard: guardActive,
                    target: States.TextInput,
                    action: actionColor,
                },

                fontSize: {
                    guard: guardActive,
                    target: States.TextInput,
                    action: actionFontSize,
                },

                cancel: States.Idle,

                onExit: () => {
                    ctx.stopInteracting();
                    ctx.hideTextInput();

                    const wasActive = this.active;
                    const prevActive = this.active;
                    this.active = this.hovered = undefined;
                    ctx.select(this.active, prevActive);

                    if (wasActive == null) return;

                    const datum = ctx.datum(wasActive);
                    const node = ctx.node(wasActive);
                    if (!datum || !node) return;

                    datum.visible = true;

                    if ('invalidateTextInputBBox' in node) {
                        node.invalidateTextInputBBox();
                    }
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
