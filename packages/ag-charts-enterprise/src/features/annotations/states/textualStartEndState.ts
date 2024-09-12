import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import type { AnnotationOptionsColorPickerType, Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { TextualStartEndProperties } from '../properties/textualStartEndProperties';
import type { TextualStartEndScene } from '../scenes/textualStartEndScene';
import { setColor, setFontSize } from '../utils/styles';
import { isTextType } from '../utils/types';
import { guardCancelAndExit, guardSaveAndExit } from './textualStateUtils';

const { StateMachine } = _ModuleSupport;

interface TextualStartEndStateMachineContext<
    Datum extends TextualStartEndProperties,
    Node extends TextualStartEndScene<Datum>,
> extends Omit<AnnotationsStateMachineContext, 'create' | 'delete' | 'datum' | 'node' | 'showTextInput'> {
    create: (datum: Datum) => void;
    delete: () => void;
    datum: () => Datum | undefined;
    node: () => Node | undefined;
    showTextInput: () => void;
    deselect: () => void;
    showAnnotationOptions: () => void;
}

export abstract class TextualStartEndStateMachine<
    Datum extends TextualStartEndProperties,
    Node extends TextualStartEndScene<Datum>,
> extends StateMachine<
    'start' | 'waiting-first-render' | 'edit' | 'end',
    'click' | 'cancel' | 'hover' | 'keyDown' | 'updateTextInputBBox' | 'color' | 'fontSize' | 'render' | 'reset'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: TextualStartEndStateMachineContext<Datum, Node>) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ start: point, end: point, visible: true });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            ctx.node()?.toggleActive(true);
        };

        const onStartEditing = () => {
            ctx.showTextInput();
            const datum = ctx.datum();
            if (datum) datum.visible = false;
        };

        const onStopEditing = () => {
            ctx.hideTextInput();
            const datum = ctx.datum();
            if (datum) datum.visible = true;
            ctx.deselect();
        };

        const actionUpdateTextInputBBox = (bbox: _Scene.BBox) => {
            const node = ctx.node();
            node?.setTextInputBBox(bbox);
            ctx.update();
        };

        const onEndHover = ({ point }: { point: Point }) => {
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleActive(true);
            ctx.node()?.toggleHandles({ end: false });
            ctx.update();
        };

        const onEndClick = ({ point }: { point: Point }) => {
            ctx.showAnnotationOptions();
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleHandles({ end: true });
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
            const datum = ctx.datum();
            if (!datum) return;

            if (colorPickerType === 'text-color') {
                ctx.updateTextInputColor(color);
            }
            setColor(datum as any, colorPickerType, colorOpacity, color, opacity);
            ctx.update();
        };

        const actionFontSize = (fontSize: number) => {
            const datum = ctx.datum();
            const node = ctx.node();
            if (!datum || !node || !isTextType(datum)) return;

            setFontSize(datum, datum.type, fontSize);

            ctx.updateTextInputFontSize(fontSize);

            ctx.update();
        };

        const actionCancel = () => {
            ctx.delete();
        };

        const actionSave = ({ textInputValue }: { textInputValue?: string }) => {
            if (textInputValue != null && textInputValue.length > 0) {
                ctx.datum()?.set({ text: textInputValue });
                ctx.update();
                ctx.recordAction(`Create ${ctx.node()?.type} annotation`);
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
                click: {
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
                keyDown: [
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
