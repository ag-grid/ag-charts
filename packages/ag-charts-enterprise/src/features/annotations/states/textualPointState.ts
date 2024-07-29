import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { TextualPointProperties } from '../properties/textualPointProperties';
import type { TextualPointScene } from '../scenes/textualPointScene';

const { StateMachine } = _ModuleSupport;

interface TextualPointStateMachineContext<Datum extends TextualPointProperties, Node extends TextualPointScene<Datum>>
    extends Omit<AnnotationsStateMachineContext, 'create' | 'delete' | 'datum' | 'node' | 'showTextInput'> {
    create: (datum: Datum) => void;
    delete: () => void;
    datum: () => Datum | undefined;
    node: () => Node | undefined;
    showTextInput: () => void;
}

export abstract class TextualPointStateMachine<
    Datum extends TextualPointProperties,
    Node extends TextualPointScene<Datum>,
> extends StateMachine<
    'start' | 'waiting-first-render' | 'edit',
    'click' | 'cancel' | 'keyDown' | 'textInput' | 'render'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: TextualPointStateMachineContext<Datum, Node>) {
        const onClick = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ x: point.x, y: point.y, text: '' });
            ctx.create(datum);
            ctx.resetToolbarButtonStates();
        };

        const onSave = ({ textInputValue }: { textInputValue?: string }) => {
            if (textInputValue != null && textInputValue.length > 0) {
                ctx.datum()?.set({ text: textInputValue });
                ctx.update();
            } else {
                ctx.delete();
            }
        };

        super('start', {
            start: {
                click: {
                    target: 'waiting-first-render',
                    action: onClick,
                },
                cancel: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: 'edit',
                    action: () => {
                        ctx.node()?.toggleActive(true);
                        ctx.showAnnotationOptions();
                    },
                },
            },
            edit: {
                onEnter: () => {
                    ctx.showTextInput();
                    const datum = ctx.datum();
                    if (datum) {
                        datum.visible = false;
                    }
                },
                textInput: ({ bbox }) => {
                    const node = ctx.node();
                    node?.setTextInputBBox(bbox);
                    ctx.update();
                },
                keyDown: [
                    {
                        guard: ({ key }: { key: string }) => key === 'Escape',
                        target: StateMachine.parent,
                        action: () => {
                            ctx.delete();
                        },
                    },
                    {
                        guard: ({ key, shiftKey }: { key: string; shiftKey: boolean }) => !shiftKey && key === 'Enter',
                        target: StateMachine.parent,
                        action: onSave,
                    },
                ],
                click: {
                    target: StateMachine.parent,
                    action: onSave,
                },
                cancel: StateMachine.parent,
                onExit: () => {
                    ctx.hideTextInput();
                    const datum = ctx.datum();
                    if (datum) {
                        datum.visible = true;
                    }
                },
            },
        });
    }

    protected abstract createDatum(): Datum;
}
