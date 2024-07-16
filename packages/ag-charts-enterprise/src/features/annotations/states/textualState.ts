import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { TextualProperties } from '../properties/textualProperties';
import type { TextualScene } from '../scenes/textualScene';

const { StateMachine } = _ModuleSupport;

interface TextualStateMachineContext<Datum extends TextualProperties, Node extends TextualScene<Datum>>
    extends Omit<AnnotationsStateMachineContext, 'create' | 'delete' | 'datum' | 'node' | 'showTextInput'> {
    create: (datum: Datum) => void;
    delete: () => void;
    datum: () => Datum | undefined;
    node: () => Node | undefined;
    showTextInput: () => void;
}

export abstract class TextualStateMachine<
    Datum extends TextualProperties,
    Node extends TextualScene<Datum>,
> extends StateMachine<'start' | 'edit', 'click' | 'cancel' | 'keyDown'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: TextualStateMachineContext<Datum, Node>) {
        const onClick = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ x: point.x, y: point.y, text: '' });
            ctx.create(datum);
        };

        const onSave = ({ textInputValue }: { textInputValue?: string }) => {
            if (textInputValue) {
                ctx.datum()?.set({ text: textInputValue });
                ctx.update();
            } else {
                ctx.delete();
            }
        };

        super('start', {
            start: {
                click: {
                    target: 'edit',
                    action: onClick,
                },
                cancel: StateMachine.parent,
            },
            edit: {
                onEnter: () => {
                    ctx.showTextInput();
                },
                keyDown: {
                    guard: ({ key }: { key: string }) => key === 'Escape',
                    target: StateMachine.parent,
                    action: () => {
                        ctx.delete();
                    },
                },
                click: {
                    target: StateMachine.parent,
                    action: onSave,
                },
                cancel: StateMachine.parent,
                onExit: () => {
                    ctx.hideTextInput();
                },
            },
        });
    }

    protected abstract createDatum(): Datum;
}
