import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import type { AnnotationOptionsColorPickerType, Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { TextualStartEndProperties } from '../properties/textualStartEndProperties';
import type { TextualStartEndScene } from '../scenes/textualStartEndScene';
import { wrapText } from '../text/util';
import { setColor } from '../utils/styles';
import { isTextType } from '../utils/types';
import type { AnnotationStateEvents } from './stateTypes';
import { guardCancelAndExit, guardSaveAndExit } from './textualStateUtils';

const { StateMachine, StateMachineProperty } = _ModuleSupport;

interface TextualStartEndStateMachineContext<Datum extends TextualStartEndProperties>
    extends Omit<AnnotationsStateMachineContext, 'create' | 'delete' | 'datum' | 'node' | 'showTextInput'> {
    create: (datum: Datum) => void;
    delete: () => void;
    showTextInput: () => void;
    deselect: () => void;
    showAnnotationOptions: () => void;
}

export abstract class TextualStartEndStateMachine<
    Datum extends TextualStartEndProperties,
    Node extends TextualStartEndScene<Datum>,
> extends StateMachine<
    'start' | 'waiting-first-render' | 'edit' | 'end',
    Pick<
        AnnotationStateEvents,
        | 'click'
        | 'drag'
        | 'dragEnd'
        | 'dragStart'
        | 'resize'
        | 'cancel'
        | 'hover'
        | 'textInput'
        | 'keyDown'
        | 'updateTextInputBBox'
        | 'color'
        | 'fontSize'
        | 'render'
        | 'reset'
    >
> {
    override debug = _Util.Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected datum?: Datum;

    @StateMachineProperty()
    protected node?: Node;

    constructor(ctx: TextualStartEndStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ start: point, end: point, visible: true });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            const { node } = this;
            node?.toggleActive(true);
            node?.toggleHandles({ start: true });
        };

        const onStartEditing = () => {
            ctx.showTextInput();
            if (this.datum) this.datum.visible = false;
        };

        const onStopEditing = () => {
            ctx.hideTextInput();
            if (this.datum) this.datum.visible = true;
            ctx.deselect();
        };

        const actionUpdateTextInputBBox = (bbox?: _Scene.BBox) => {
            this.node?.setTextInputBBox(bbox);
            ctx.update();
        };

        const onEndHover = ({ point }: { point: Point }) => {
            const { datum, node } = this;
            datum?.set({ end: point });
            node?.toggleActive(true);
            node?.toggleHandles({ end: false });
            ctx.update();
        };

        const onEndClick = () => {
            ctx.showAnnotationOptions();
            this.node?.toggleHandles({ end: true });
        };

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
            const { datum } = this;
            if (!datum) return;

            if (colorPickerType === 'text-color') {
                ctx.updateTextInputColor(color);
            }
            setColor(datum as any, colorPickerType, colorOpacity, color, opacity);
            ctx.update();
        };

        const actionFontSize = (fontSize: number) => {
            const { datum, node } = this;
            if (!datum || !node || !isTextType(datum)) return;

            datum.fontSize = fontSize;
            ctx.updateTextInputFontSize(fontSize);
            ctx.update();
        };

        const actionCancel = () => {
            ctx.delete();
        };

        const actionSave = ({ textInputValue, bbox }: { textInputValue?: string; bbox?: _Scene.BBox }) => {
            const { datum } = this;
            if (bbox != null && textInputValue != null && textInputValue.length > 0) {
                if (!isTextType(datum)) {
                    return;
                }

                const wrappedText = wrapText(datum, textInputValue, bbox.width);
                datum?.set({ text: wrappedText });

                ctx.update();
                ctx.recordAction(`Create ${datum?.type} annotation`);
            } else {
                ctx.delete();
            }
        };

        super('start', {
            start: {
                click: {
                    target: 'waiting-first-render',
                    action: actionCreate,
                },
                dragStart: {
                    target: 'waiting-first-render',
                    action: actionCreate,
                },
                cancel: StateMachine.parent,
                reset: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: 'end',
                    action: actionFirstRender,
                },
            },
            end: {
                hover: onEndHover,
                drag: onEndHover,
                click: {
                    target: 'edit',
                    action: onEndClick,
                },
                dragEnd: {
                    target: 'edit',
                    action: onEndClick,
                },
                reset: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
                cancel: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
            },
            edit: {
                onEnter: onStartEditing,
                updateTextInputBBox: actionUpdateTextInputBBox,
                color: actionColor,
                fontSize: actionFontSize,
                textInput: [
                    {
                        guard: guardCancelAndExit,
                        target: StateMachine.parent,
                        action: actionCancel,
                    },
                    {
                        guard: guardSaveAndExit,
                        target: StateMachine.parent,
                        action: actionSave,
                    },
                ],
                click: {
                    target: StateMachine.parent,
                    action: actionSave,
                },
                dragStart: {
                    target: StateMachine.parent,
                    action: actionSave,
                },
                resize: {
                    target: StateMachine.parent,
                    action: actionSave,
                },
                onExit: onStopEditing,
                cancel: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
            },
        });
    }

    protected abstract createDatum(): Datum;
}
