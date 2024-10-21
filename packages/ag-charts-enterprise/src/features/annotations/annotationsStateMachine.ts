import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import { type AnnotationLineStyle, type AnnotationOptionsColorPickerType, AnnotationType } from './annotationTypes';
import { annotationConfigs, getTypedDatum } from './annotationsConfig';
import type {
    AnnotationProperties,
    AnnotationsStateMachineContext,
    AnnotationsStateMachineHelperFns,
} from './annotationsSuperTypes';
import type { LinearSettingsDialogTextChangeProps } from './settings-dialog/settingsDialog';
import type { AnnotationHierarchyData, AnnotationStateEvents } from './states/stateTypes';
import { guardCancelAndExit, guardSaveAndExit } from './states/textualStateUtils';
import { wrapText } from './text/util';
import { hasLineStyle, hasLineText } from './utils/has';
import { setColor, setLineStyle } from './utils/styles';
import { isChannelType, isTextType } from './utils/types';

const { StateMachine, StateMachineProperty } = _ModuleSupport;

enum States {
    Idle = 'idle',
    Dragging = 'dragging',
    TextInput = 'text-input',
}

export class AnnotationsStateMachine extends StateMachine<States, AnnotationStateEvents, AnnotationHierarchyData> {
    override debug = _Util.Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected active?: number;

    override hierarchyData: AnnotationHierarchyData = {
        snapping: false,
    };

    constructor(ctx: AnnotationsStateMachineContext) {
        const getDatum =
            <T>(is: (value: unknown) => value is T) =>
            () => {
                if (this.hierarchyData.active == null) return;
                const datum = ctx.datum(this.hierarchyData.active);
                if (is(datum)) return datum;
            };

        const getNode =
            <T>(is: (value: unknown) => value is T) =>
            () => {
                if (this.hierarchyData.active == null) return;
                const node = ctx.node(this.hierarchyData.active);
                if (is(node)) return node;
            };

        const createDatum =
            <T extends AnnotationProperties>(type: AnnotationType) =>
            (datum: T) => {
                ctx.create(type, datum);
                this.hierarchyData.active = ctx.selectLast();
            };

        const deleteDatum = () => {
            if (this.hierarchyData.active != null) ctx.delete(this.hierarchyData.active);
            this.hierarchyData.active = undefined;
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
            showTextInput: () => {
                if (this.hierarchyData.active != null) ctx.showTextInput(this.hierarchyData.active);
            },
            deselect: () => {
                const prevActive = this.hierarchyData.active;
                this.hierarchyData.active = undefined;
                this.hierarchyData.hovered = undefined;
                ctx.select(this.hierarchyData.active, prevActive);
            },
            showAnnotationOptions: () => {
                if (this.hierarchyData.active != null) ctx.showAnnotationOptions(this.hierarchyData.active);
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
            setSnapping: (snapping: boolean) => {
                this.hierarchyData.snapping = snapping;
            },
            getSnapping: () => {
                return this.hierarchyData.snapping;
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
            const datum = ctx.datum(this.hierarchyData.active!);
            if (!datum) return;

            if (colorPickerType === 'text-color') {
                ctx.updateTextInputColor(color);
            }
            setColor(datum, colorPickerType, colorOpacity, color, opacity);
            ctx.update();
        };

        const actionFontSize = (fontSize: number) => {
            const datum = ctx.datum(this.hierarchyData.active!);
            const node = ctx.node(this.hierarchyData.active!);
            if (!datum || !node) return;

            if (isTextType(datum)) {
                datum.fontSize = fontSize;
                ctx.updateTextInputFontSize(fontSize);
            } else if (hasLineText(datum)) {
                datum.text.fontSize = fontSize;
            }

            ctx.update();
        };

        const actionLineStyle = (lineStyle: AnnotationLineStyle) => {
            const datum = ctx.datum(this.hierarchyData.active!);
            const node = ctx.node(this.hierarchyData.active!);
            if (!datum || !node || !hasLineStyle(datum)) return;

            setLineStyle(datum, lineStyle);
            ctx.update();
        };

        const actionUpdateTextInputBBox = (bbox?: _Scene.BBox) => {
            const node = ctx.node(this.hierarchyData.active!);
            if (!node || !('setTextInputBBox' in node)) return;
            node.setTextInputBBox(bbox);
            ctx.update();
        };

        const actionSaveText = ({ textInputValue, bbox }: { textInputValue?: string; bbox?: _Scene.BBox }) => {
            const datum = ctx.datum(this.hierarchyData.active!);
            if (bbox != null && textInputValue != null && textInputValue.length > 0) {
                if (!isTextType(datum)) {
                    return;
                }

                const wrappedText = wrapText(datum, textInputValue, bbox.width);
                datum.set({ text: wrappedText });

                ctx.update();
                ctx.recordAction(`Change ${datum.type} annotation text`);
            } else {
                ctx.delete(this.hierarchyData.active!);
                ctx.recordAction(`Delete ${datum?.type} annotation`);
            }
        };

        const actionCancel = () => {
            ctx.updateTextInputBBox(undefined);
        };

        const guardActive = () => this.hierarchyData.active != null;
        const guardCopied = () => this.hierarchyData.copied != null;
        const guardActiveHasLineText = () => {
            if (this.hierarchyData.active == null) return false;
            const datum = ctx.datum(this.hierarchyData.active);
            if (!datum) return false;
            return hasLineText(datum) && !datum.locked;
        };
        const guardHovered = () => this.hierarchyData.hovered != null;

        super(States.Idle, {
            [States.Idle]: {
                onEnter: () => {
                    this.active = 2;
                    console.log(this.active);
                    ctx.select(this.hierarchyData.active, this.hierarchyData.active);
                    if (this.hierarchyData.hoverCoords) {
                        this.hierarchyData.hovered = ctx.hoverAtCoords(
                            this.hierarchyData.hoverCoords,
                            this.hierarchyData.active
                        );
                    }
                },

                hover: ({ offset }) => {
                    this.hierarchyData.hovered = ctx.hoverAtCoords(offset, this.hierarchyData.active);
                    this.hierarchyData.hoverCoords = offset;
                },

                keyDown: ({ shiftKey }) => {
                    this.hierarchyData.snapping = shiftKey;
                },

                keyUp: ({ shiftKey }) => {
                    this.hierarchyData.snapping = shiftKey;
                },

                translate: {
                    guard: guardActive,
                    action: ({ translation }) => {
                        ctx.startInteracting();
                        ctx.translate(this.hierarchyData.active!, translation);
                        ctx.update();
                    },
                },

                translateEnd: {
                    guard: guardActive,
                    action: () => {
                        ctx.stopInteracting();
                    },
                },

                copy: {
                    guard: guardActive,
                    action: () => {
                        this.hierarchyData.copied = ctx.copy(this.hierarchyData.active!);
                    },
                },

                cut: {
                    guard: guardActive,
                    action: () => {
                        this.hierarchyData.copied = ctx.copy(this.hierarchyData.active!);
                        deleteDatum();
                    },
                },

                paste: {
                    guard: guardCopied,
                    action: () => {
                        ctx.paste(this.hierarchyData.copied!);
                    },
                },

                selectLast: () => {
                    const previousActive = this.hierarchyData.active;
                    this.hierarchyData.active = ctx.selectLast();
                    ctx.select(this.hierarchyData.active, previousActive);
                },

                click: [
                    {
                        guard: () => {
                            if (
                                this.hierarchyData.active == null ||
                                this.hierarchyData.hovered !== this.hierarchyData.active
                            )
                                return false;
                            const datum = ctx.datum(this.hierarchyData.active);
                            if (!datum) return false;
                            return isTextType(datum) && !datum.locked;
                        },
                        target: States.TextInput,
                    },
                    {
                        action: () => {
                            const prevActive = this.hierarchyData.active;
                            this.hierarchyData.active = this.hierarchyData.hovered;
                            ctx.select(this.hierarchyData.hovered, prevActive);
                        },
                    },
                ],

                drag: {
                    action: () => {
                        const prevActive = this.active;
                        this.active = this.hovered;
                        ctx.select(this.hovered, prevActive);
                    },
                },

                dblclick: {
                    guard: guardActiveHasLineText,
                    action: ({ offset }) => {
                        const nodeAtCoords =
                            ctx.getNodeAtCoords(offset, this.hierarchyData.active!) === 'text' ? 'text' : 'line';
                        ctx.showAnnotationSettings(this.hierarchyData.active!, undefined, nodeAtCoords);
                    },
                },

                dragStart: {
                    guard: guardHovered,
                    target: States.Dragging,
                    action: () => {
                        const prevActive = this.hierarchyData.active;
                        this.hierarchyData.active = this.hierarchyData.hovered;
                        ctx.select(this.hierarchyData.hovered, prevActive);
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

                lineProps: {
                    guard: guardActive,
                    action: (props) => {
                        const datum = getTypedDatum(ctx.datum(this.hierarchyData.active!));
                        datum?.set(props);
                        ctx.update();
                        ctx.recordAction(
                            `Change ${datum?.type} ${Object.entries(props)
                                .map(([key, value]) => `${key} to ${value}`)
                                .join(', ')}`
                        );
                    },
                },

                lineStyle: {
                    guard: guardActive,
                    action: actionLineStyle,
                },

                lineText: {
                    guard: guardActive,
                    action: (props: LinearSettingsDialogTextChangeProps) => {
                        const datum = getTypedDatum(ctx.datum(this.hierarchyData.active!));
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
                    action: (sourceEvent: Event) => {
                        ctx.showAnnotationSettings(this.hierarchyData.active!, sourceEvent);
                    },
                },

                reset: () => {
                    if (this.hierarchyData.active != null) {
                        ctx.node(this.hierarchyData.active)?.toggleActive(false);
                    }

                    this.hierarchyData.hovered = undefined;
                    this.hierarchyData.active = undefined;

                    ctx.select(this.hierarchyData.active, this.hierarchyData.active);

                    ctx.resetToIdle();
                },

                delete: () => {
                    if (this.hierarchyData.active == null) return;
                    ctx.delete(this.hierarchyData.active);
                    ctx.recordAction(`Delete ${ctx.datum(this.hierarchyData.active)?.type} annotation`);
                },

                deleteAll: () => {
                    ctx.deleteAll();
                },

                ...createStateMachines,
            },

            [States.Dragging]: {
                onEnter: (_, data: any) => {
                    if (this.hierarchyData.active == null) return;

                    const type = ctx.getAnnotationType(this.hierarchyData.active);
                    if (!type) return;

                    this.transition(type);
                    this.transition('dragStart', data);
                },

                ...dragStateMachines,
            },

            [States.TextInput]: {
                onEnter: () => {
                    if (this.hierarchyData.active == null) return;

                    const datum = getTypedDatum(ctx.datum(this.hierarchyData.active));
                    if (!datum || !('getTextInputCoords' in datum)) return;

                    ctx.startInteracting();
                    ctx.showTextInput(this.hierarchyData.active);
                    datum.visible = false;

                    ctx.update();
                },

                updateTextInputBBox: {
                    guard: guardActive,
                    action: actionUpdateTextInputBBox,
                },

                zoomChange: {
                    target: States.Idle,
                    action: actionSaveText,
                },

                click: {
                    target: States.Idle,
                    action: actionSaveText,
                },

                drag: {
                    target: States.Idle,
                    action: actionSaveText,
                },

                textInput: [
                    {
                        guard: guardCancelAndExit,
                        target: States.Idle,
                        action: actionCancel,
                    },
                    {
                        guard: guardSaveAndExit,
                        target: States.Idle,
                        action: actionSaveText,
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

                cancel: {
                    target: States.Idle,
                    action: actionCancel,
                },

                onExit: () => {
                    ctx.stopInteracting();
                    ctx.hideTextInput();

<<<<<<< Updated upstream
                    const wasActive = this.active;
                    this.active = this.hovered = undefined;
                    ctx.select(this.active, wasActive);
=======
                    const wasActive = this.hierarchyData.active;
                    const prevActive = this.hierarchyData.active;
                    this.hierarchyData.active = this.hierarchyData.hovered = undefined;
                    ctx.select(this.hierarchyData.active, prevActive);
>>>>>>> Stashed changes

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
        return this.hierarchyData.active;
    }

    // TODO: remove this leak
    public isActive(index: number) {
        return index === this.hierarchyData.active;
    }
}
