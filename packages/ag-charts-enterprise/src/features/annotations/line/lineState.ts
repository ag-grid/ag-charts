import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { GuardDragClickDoubleEvent, Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { LineProperties } from './lineProperties';
import type { LineScene } from './lineScene';

const { StateMachine } = _ModuleSupport;

interface LineStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: LineProperties) => void;
    delete: () => void;
    datum: () => LineProperties | undefined;
    node: () => LineScene | undefined;
    guardDragClickDoubleEvent: GuardDragClickDoubleEvent;
}

export class LineStateMachine extends StateMachine<'start' | 'end', 'click' | 'hover' | 'drag' | 'cancel'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: LineStateMachineContext) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = new LineProperties();
            datum.set({ start: point, end: point });
            ctx.create(datum);
        };

        const actionEndUpdate = ({ point }: { point: Point }) => {
            ctx.guardDragClickDoubleEvent.hover();
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleActive(true); // TODO: move to onEnter, but node doesn't exist until next render
            ctx.node()?.toggleHandles({ end: false });
            ctx.update();
        };

        const actionEndFinish = ({ point }: { point: Point }) => {
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleHandles({ end: true });
        };

        const actionCancel = () => ctx.delete();

        super('start', {
            start: {
                click: {
                    target: 'end',
                    action: actionCreate,
                },
                drag: {
                    target: 'end',
                    action: actionCreate,
                },
            },
            end: {
                hover: actionEndUpdate,
                click: {
                    guard: ctx.guardDragClickDoubleEvent.guard,
                    target: StateMachine.parent,
                    action: actionEndFinish,
                },
                drag: actionEndUpdate,
                cancel: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
                onExit: ctx.guardDragClickDoubleEvent.reset,
            },
        });
    }
}
