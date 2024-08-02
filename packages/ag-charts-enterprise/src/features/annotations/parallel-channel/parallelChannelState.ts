import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { GuardDragClickDoubleEvent, Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { ParallelChannelProperties } from './parallelChannelProperties';
import type { ParallelChannelScene } from './parallelChannelScene';

const { StateMachine } = _ModuleSupport;

interface ParallelChannelStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: ParallelChannelProperties) => void;
    delete: () => void;
    datum: () => ParallelChannelProperties | undefined;
    node: () => ParallelChannelScene | undefined;
    guardDragClickDoubleEvent: GuardDragClickDoubleEvent;
}

export class ParallelChannelStateMachine extends StateMachine<
    'start' | 'end' | 'height',
    'click' | 'hover' | 'drag' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: ParallelChannelStateMachineContext) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = new ParallelChannelProperties();
            datum.set({ start: point, end: point, height: 0 });
            ctx.create(datum);
        };

        const actionEndUpdate = ({ point }: { point: Point }) => {
            ctx.guardDragClickDoubleEvent.hover();
            ctx.datum()?.set({ end: point, height: 0 });
            ctx.node()?.toggleHandles({
                topMiddle: false,
                topRight: false,
                bottomLeft: false,
                bottomMiddle: false,
                bottomRight: false,
            });
            ctx.update();
        };

        const actionEndFinish = ({ point }: { point: Point }) => {
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleHandles({ topMiddle: false, bottomMiddle: false });
            ctx.update();
        };

        const actionHeightUpdate = ({ point }: { point: Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const height = datum.end.y - (point.y ?? 0);
            const bottomStartY = datum.start.y - height;

            ctx.node()?.toggleHandles({ topMiddle: false, bottomMiddle: false });

            if (
                !ctx.validatePoint({ x: datum.start.x, y: bottomStartY }) ||
                !ctx.validatePoint({ x: datum.end.x, y: point.y })
            ) {
                return;
            }

            datum.set({ height });
            ctx.update();
        };

        const actionHeightFinish = ({ point }: { point: Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const height = datum.end.y - (point.y ?? 0);
            const bottomStartY = datum.start.y - height;

            ctx.node()?.toggleHandles(true);

            if (
                ctx.validatePoint({ x: datum.start.x, y: bottomStartY }) &&
                ctx.validatePoint({ x: datum.end.x, y: point.y })
            ) {
                datum.set({ height });
            }
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
                drag: actionEndUpdate,
                click: {
                    guard: ctx.guardDragClickDoubleEvent.guard,
                    target: 'height',
                    action: actionEndFinish,
                },
                cancel: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
                onExit: ctx.guardDragClickDoubleEvent.reset,
            },
            height: {
                hover: actionHeightUpdate,
                click: {
                    target: StateMachine.parent,
                    action: actionHeightFinish,
                },
                cancel: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
            },
        });
    }
}
