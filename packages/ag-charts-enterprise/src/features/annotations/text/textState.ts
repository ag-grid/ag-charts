import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { TextProperties } from './textProperties';
import type { TextScene } from './textScene';

const { StateMachine } = _ModuleSupport;

interface TextStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: TextProperties) => void;
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

        const onInput = ({ value }: { value?: string }) => {
            ctx.datum()?.set({ text: value ?? '' });
            ctx.update();
        };

        super('start', {
            start: {
                click: {
                    target: 'edit',
                    action: onClick,
                },
                cancel: StateMachine.parent,
                onExit: () => {
                    ctx.selectLast();
                },
            },
            edit: {
                onEnter: () => {
                    ctx.showTextInput();
                },
                keyDown: {
                    guard: ({ key }: { key: string }) => key === 'Tab',
                    target: StateMachine.parent,
                    action: onInput,
                },
                cancel: StateMachine.parent,
                onExit: () => {
                    ctx.hideTextInput();
                },
            },
        });
    }
}
