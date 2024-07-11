import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent, StateInputEvent } from '../annotationTypes';
import { TextProperties } from './textProperties';
import type { TextScene } from './textScene';

const { StateMachine } = _ModuleSupport;

export class TextStateMachine extends StateMachine<'start' | 'edit', 'click' | 'cancel' | 'input'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        appendDatum: (datum: TextProperties) => void,
        onExitCreate: () => void,
        showTextInput: () => void,
        hideTextInput: () => void
    ) {
        const onClick = ({ point }: StateClickEvent<TextProperties, TextScene>) => {
            const datum = new TextProperties();
            datum.set({ x: point.x, y: point.y, text: '' });
            appendDatum(datum);
        };

        const onInput = ({ datum, value }: StateInputEvent<TextProperties>) => {
            datum.text = value ?? '';
        };

        super('start', {
            start: {
                click: {
                    target: 'edit',
                    action: onClick,
                },
                cancel: StateMachine.parent,
                onExit: onExitCreate,
            },
            edit: {
                onEnter: showTextInput,
                input: {
                    target: StateMachine.parent,
                    action: onInput,
                },
                cancel: StateMachine.parent,
                onExit: hideTextInput,
            },
        });
    }
}
