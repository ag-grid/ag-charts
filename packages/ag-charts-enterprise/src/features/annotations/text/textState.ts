import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { TextProperties } from './textProperties';
import type { TextScene } from './textScene';

const { StateMachine } = _ModuleSupport;

interface TextStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: TextProperties) => void;
    delete: () => void;
    datum: () => TextProperties | undefined;
    node: () => TextScene | undefined;
    showTextInput: () => void;
}

export class TextStateMachine extends StateMachine<'start' | 'edit', 'click' | 'cancel' | 'keyDown'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: TextStateMachineContext) {
        const onClick = ({ point }: { point: Point }) => {
            const datum = new TextProperties();
            datum.set({ x: point.x, y: point.y, text: '' });
            ctx.create(datum);
        };

        const onSave = ({ textInputValue }: { textInputValue?: string }) => {
            if (typeof textInputValue === 'string') {
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
                keyDown: [
                    {
                        guard: ({ key }: { key: string }) => key === 'Escape',
                        target: StateMachine.parent,
                        action: () => {
                            ctx.delete();
                        },
                    },
                    {
                        target: 'edit',
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
                },
            },
        });
    }
}
