import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import {
    type AnnotationLineStyle,
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type GuardDragClickDoubleEvent,
} from './annotationTypes';
import { annotationConfigs, getTypedDatum } from './annotationsConfig';
import type {
    AnnotationProperties,
    AnnotationsStateMachineContext,
    AnnotationsStateMachineHelperFns,
} from './annotationsSuperTypes';
import { guardCancelAndExit, guardSaveAndExit } from './states/textualStateUtils';
import { hasLineStyle, hasLineText } from './utils/has';
import { setColor, setFontSize, setLineStyle } from './utils/styles';
import { isChannelType, isTextType } from './utils/types';

const { StateMachine } = _ModuleSupport;

enum States {
    Idle = 'idle',
    Dragging = 'dragging',
    TextInput = 'text-input',
}
type AnnotationEvent =
    // Interaction events
    | 'hover'
    | 'click'
    | 'dblclick'
    | 'drag'
    | 'dragStart'
    | 'dragEnd'
    | 'keyDown'
    // Data events
    | 'cancel'
    | 'reset'
    | 'delete'
    | 'deleteAll'
    // Annotation properties events
    | 'color'
    | 'fontSize'
    | 'lineStyle'
    | 'lineText'
    | 'updateTextInputBBox'
    // Toolbar events
    | 'toolbarPressSettings'
    // Process events
    | 'render';

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

        const deleteDatum = () => {
            if (this.active != null) ctx.delete(this.active);
            this.active = undefined;
            ctx.select();
        };

        const stateMachineHelpers: AnnotationsStateMachineHelperFns = {
            createDatum,
            getDatum: getDatum as any, // TODO
            getNode: getNode as any, // TODO
        };

        const createStateMachineContext = {
            ...ctx,
            delete: deleteDatum,
            guardDragClickDoubleEvent,
            showTextInput: () => {
                if (this.active != null) ctx.showTextInput(this.active);
            },
            deselect: () => {
                const prevActive = this.active;
                this.active = undefined;
                this.hovered = undefined;
                ctx.select(this.active, prevActive);
            },
            showAnnotationOptions: () => {
                if (this.active != null) ctx.showAnnotationOptions(this.active);
            },
        };
        const createStateMachines = Object.fromEntries(
            Object.entries(annotationConfigs).map(([type, config]) => [
                type,
                config.createState(createStateMachineContext, stateMachineHelpers),
            ])
        ) as Record<AnnotationType, _ModuleSupport.StateMachine<any, any>>;

        const dragStateMachineContext = {
            ...ctx,
            setSelectedWithDrag: () => {
                selectedWithDrag = true;
            },
        };
        const dragStateMachines = Object.fromEntries(
            Object.entries(annotationConfigs).map(([type, config]) => [
                type,
                config.dragState(dragStateMachineContext, stateMachineHelpers),
            ])
        ) as Record<Partial<AnnotationType>, _ModuleSupport.StateMachine<any, any>>;

        const actionColor = ({
            colorPickerType,
            colorOpacity,
            color,
            opacity,
        }: {
            colorPickerType: AnnotationOptionsColorPickerType;
            colorOpacity: string;
            color: string;
            opacity: number;
        }) => {
            const datum = ctx.datum(this.active!);
            if (!datum) return;

            if (colorPickerType === 'text-color') {
                ctx.updateTextInputColor(color);
            }
            setColor(datum, colorPickerType, colorOpacity, color, opacity);
            ctx.update();
        };

        const actionFontSize = (fontSize: number) => {
            const datum = ctx.datum(this.active!);
            const node = ctx.node(this.active!);
            if (!datum || !node || !isTextType(datum)) return;

            setFontSize(datum, datum.type, fontSize);

            ctx.updateTextInputFontSize(fontSize);

            ctx.update();
        };

        const actionLineStyle = (lineStyle: AnnotationLineStyle) => {
            const datum = ctx.datum(this.active!);
            const node = ctx.node(this.active!);
            if (!datum || !node || !hasLineStyle(datum)) return;

            setLineStyle(datum, datum.type, lineStyle);

            ctx.update();
        };

        const actionUpdateTextInputBBox = (bbox: _Scene.BBox) => {
            const node = ctx.node(this.active!);
            if (!node || !('setTextInputBBox' in node)) return;
            node.setTextInputBBox(bbox);
            ctx.update();
        };

        const guardActive = () => this.active != null;
        const guardActiveHasLineText = () => {
            if (this.active == null) return false;
            const datum = ctx.datum(this.active);
            if (!datum) return false;
            return hasLineText(datum) && !datum.locked;
        };
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
                        action: () => {
                            const prevActive = this.active;
                            this.active = this.hovered;
                            ctx.select(this.hovered, prevActive);
                            selectedWithDrag = false;
                        },
                    },
                ],

                dblclick: {
                    guard: guardActiveHasLineText,
                    action: () => {
                        ctx.showAnnotationSettings(this.active!);
                    },
                },

                drag: {
                    guard: guardHovered,
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
                    action: actionColor,
                },

                fontSize: {
                    guard: guardActive,
                    action: actionFontSize,
                },

                lineStyle: {
                    guard: guardActive,
                    action: actionLineStyle,
                },

                lineText: {
                    guard: guardActive,
                    action: (props: { alignment?: string; fontSize?: number; label?: string; position?: string }) => {
                        const datum = getTypedDatum(ctx.datum(this.active!));
                        if (!hasLineText(datum)) return;
                        if (isChannelType(datum) && props.position === 'center') {
                            props.position = 'inside';
                        }
                        datum.text.set(props);
                        ctx.update();
                    },
                },

                updateTextInputBBox: {
                    guard: guardActive,
                    action: actionUpdateTextInputBBox,
                },

                toolbarPressSettings: {
                    guard: guardActiveHasLineText,
                    action: () => {
                        ctx.showAnnotationSettings(this.active!);
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

                delete: () => {
                    if (this.active == null) return;
                    ctx.delete(this.active);
                    ctx.recordAction('Delete annotation');
                },

                deleteAll: () => {
                    ctx.deleteAll();
                },

                ...createStateMachines,
            },

            [States.Dragging]: {
                onEnter: (_, data: any) => {
                    if (this.active == null) return;

                    const type = ctx.getAnnotationType(this.active);
                    if (!type) return;

                    this.transition(type);
                    this.transition('dragStart', data);
                },

                ...dragStateMachines,
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
                    action: actionUpdateTextInputBBox,
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
                    action: actionColor,
                },

                fontSize: {
                    guard: guardActive,
                    action: actionFontSize,
                },

                cancel: States.Idle,

                onExit: () => {
                    ctx.stopInteracting();
                    ctx.hideTextInput();
                    ctx.updateTextInputBBox(undefined);

                    const wasActive = this.active;
                    const prevActive = this.active;
                    this.active = this.hovered = undefined;
                    ctx.select(this.active, prevActive);

                    if (wasActive == null) return;

                    const datum = ctx.datum(wasActive);
                    const node = ctx.node(wasActive);
                    if (!datum || !node) return;

                    datum.visible = true;
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
