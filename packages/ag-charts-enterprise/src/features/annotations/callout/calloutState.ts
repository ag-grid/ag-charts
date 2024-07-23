import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { TextualStateMachineContext } from '../states/textualState';
import { CalloutProperties } from './calloutProperties';
import { CalloutScene } from './calloutScene';

const { StateMachine } = _ModuleSupport;

export class CalloutStateMachine extends StateMachine<
    'start' | 'waiting-first-render' | 'edit' | 'end',
    'click' | 'cancel' | 'hover' | 'keyDown' | 'render'
> {
    protected createDatum() {
        return new CalloutProperties();
    }

    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: TextualStateMachineContext<CalloutProperties, CalloutScene>) {
        const onStartClick = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ start: point, end: point, text: '' });
            ctx.create(datum);
            ctx.resetToolbarButtonStates();
        };

        const onEndHover = ({ point }: { point: Point }) => {
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleActive(true); // TODO: move to onEnter, but node doesn't exist until next render
            ctx.node()?.toggleHandles({ end: false });
            ctx.update();
        };

        const onEndClick = ({ point }: { point: Point }) => {
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleHandles({ end: true });
        };

        const onSave = ({ textInputValue }: { textInputValue?: string }) => {
            if (textInputValue !== null) {
                ctx.datum()?.set({ text: textInputValue });
                ctx.update();
            } else {
                ctx.delete();
            }
            ctx.layoutTextInput();
        };

        super('start', {
            start: {
                click: {
                    target: 'waiting-first-render',
                    action: onStartClick,
                },
                cancel: StateMachine.parent,
            },
            end: {
                hover: onEndHover,
                click: {
                    target: 'edit',
                    action: onEndClick,
                },
                cancel: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: 'end',
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
                    const datum = ctx.datum();
                    if (datum) {
                        datum.visible = true;
                    }
                },
            },
        });
    }
}
