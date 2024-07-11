import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { LineProperties } from './lineProperties';
import type { LineScene } from './lineScene';

const { StateMachine } = _ModuleSupport;

interface LineStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: LineProperties) => void;
    datum: () => LineProperties | undefined;
    node: () => LineScene | undefined;
}

export class LineStateMachine extends StateMachine<'start' | 'end', 'click' | 'hover' | 'drag' | 'cancel'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: LineStateMachineContext) {
        const onStartClick = ({ point }: { point: Point }) => {
            const datum = new LineProperties();
            datum.set({ start: point, end: point });
            ctx.create(datum);
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

        super('start', {
            start: {
                click: {
                    target: 'end',
                    action: onStartClick,
                },
                // TODO: this or the one in the parent?
                drag: {
                    target: 'end',
                    action: onStartClick,
                },
                cancel: StateMachine.parent,
            },
            end: {
                hover: onEndHover,
                click: {
                    target: StateMachine.parent,
                    action: onEndClick,
                },
                drag: onEndHover,
                cancel: StateMachine.parent,
            },
        });
    }
}
