import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';

import type { AnnotationOptionsColorPickerType, Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { TextualPointProperties } from '../properties/textualPointProperties';
import type { TextualPointScene } from '../scenes/textualPointScene';
import { wrapText } from '../text/util';
import { setColor } from '../utils/styles';
import { isTextType } from '../utils/types';
import { guardCancelAndExit, guardSaveAndExit } from './textualStateUtils';

const { StateMachine } = _ModuleSupport;

interface TextualPointStateMachineContext<Datum extends TextualPointProperties, Node extends TextualPointScene<Datum>>
    extends Omit<AnnotationsStateMachineContext, 'create' | 'delete' | 'datum' | 'node' | 'showTextInput'> {
    create: (datum: Datum) => void;
    delete: () => void;
    datum: () => Datum | undefined;
    node: () => Node | undefined;
    showTextInput: () => void;
    deselect: () => void;
    showAnnotationOptions: () => void;
}

export abstract class TextualPointStateMachine<
    Datum extends TextualPointProperties,
    Node extends TextualPointScene<Datum>,
> extends StateMachine<
    'start' | 'waiting-first-render' | 'edit',
    | 'click'
    | 'drag'
    | 'zoomChange'
    | 'cancel'
    | 'keyDown'
    | 'updateTextInputBBox'
    | 'color'
    | 'fontSize'
    | 'render'
    | 'reset'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: TextualPointStateMachineContext<Datum, Node>) {
        const actionCreate = ({ point }: { point: () => Point }) => {
            const datum = this.createDatum();
            const { x, y } = point();
            datum.set({ x, y });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            ctx.node()?.toggleActive(true);
            ctx.showAnnotationOptions();
            ctx.update();
        };

        const onStartEditing = () => {
            ctx.showTextInput();
            const datum = ctx.datum();
            if (datum) {
                datum.visible = false;
            }
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

            datum.fontSize = fontSize;
            ctx.updateTextInputFontSize(fontSize);
            ctx.update();
        };

        const actionCancel = () => {
            ctx.delete();
        };

        const actionSave = ({ textInputValue, bbox }: { textInputValue?: string; bbox: _Scene.BBox }) => {
            if (textInputValue != null && textInputValue.length > 0) {
                const datum = ctx.datum();

                if (!isTextType(datum)) {
                    return;
                }

                const wrappedText = wrapText(datum, textInputValue, bbox.width);
                datum?.set({ text: wrappedText });

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
                drag: {
                    target: 'waiting-first-render',
                    action: actionCreate,
                },
                cancel: StateMachine.parent,
                reset: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: 'edit',
                    action: actionFirstRender,
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
                zoomChange: {
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
