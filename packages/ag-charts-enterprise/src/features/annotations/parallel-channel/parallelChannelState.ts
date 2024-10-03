import { _ModuleSupport, _Util } from 'ag-charts-community';

import { AnnotationType, type GuardDragClickDoubleEvent, type Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { ParallelChannelProperties } from './parallelChannelProperties';
import type { ParallelChannelScene } from './parallelChannelScene';

const { StateMachine } = _ModuleSupport;

interface ParallelChannelStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: ParallelChannelProperties) => void;
    delete: () => void;
    datum: () => ParallelChannelProperties | undefined;
    node: () => ParallelChannelScene | undefined;
    showAnnotationOptions: () => void;
    guardDragClickDoubleEvent: GuardDragClickDoubleEvent;
}

export class ParallelChannelStateMachine extends StateMachine<
    'start' | 'end' | 'height',
    'click' | 'hover' | 'drag' | 'cancel' | 'reset'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: ParallelChannelStateMachineContext) {
        const actionCreate = ({ point }: { point: () => Point }) => {
            const datum = new ParallelChannelProperties();
            const origin = point();
            datum.set({ start: origin, end: origin, height: 0 });
            ctx.create(datum);
            ctx.addPostUpdateFns(
                () => ctx.node()?.toggleActive(true),
                () =>
                    ctx.node()?.toggleHandles({
                        topLeft: true,
                        topMiddle: false,
                        topRight: false,
                        bottomLeft: false,
                        bottomMiddle: false,
                        bottomRight: false,
                    })
            );
        };

        const actionEndUpdate = ({ point }: { point: (origin?: Point, snapToAngle?: number) => Point }) => {
            ctx.guardDragClickDoubleEvent.hover();

            const datum = ctx.datum();
            datum?.set({ end: point(datum?.start, datum?.snapToAngle), height: 0 });

            ctx.update();
        };

        const actionEndFinish = () => {
            ctx.node()?.toggleHandles({
                topRight: true,
            });
            ctx.update();
        };

        const actionHeightUpdate = ({ point }: { point: () => Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const y = point().y;
            const height = datum.end.y - (y ?? 0);
            const bottomStartY = datum.start.y - height;

            ctx.node()?.toggleHandles({ bottomLeft: true, bottomRight: true });

            if (
                !ctx.validatePoint({ x: datum.start.x, y: bottomStartY }) ||
                !ctx.validatePoint({ x: datum.end.x, y })
            ) {
                return;
            }

            datum.set({ height });
            ctx.update();
        };

        const actionHeightFinish = ({ point }: { point: () => Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const y = point().y;
            const height = datum.end.y - (y ?? 0);
            const bottomStartY = datum.start.y - height;

            ctx.node()?.toggleHandles(true);

            if (
                !ctx.validatePoint({ x: datum.start.x, y: bottomStartY }) ||
                !ctx.validatePoint({ x: datum.end.x, y })
            ) {
                return;
            }

            datum.set({ height });
            ctx.recordAction(`Create ${AnnotationType.ParallelChannel} annotation`);
            ctx.showAnnotationOptions();
            ctx.update();
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
                reset: StateMachine.parent,
            },
            end: {
                hover: actionEndUpdate,
                drag: actionEndUpdate,
                click: {
                    guard: ctx.guardDragClickDoubleEvent.guard,
                    target: 'height',
                    action: actionEndFinish,
                },
                reset: {
                    target: StateMachine.parent,
                    action: actionCancel,
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
                reset: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
                cancel: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
            },
        });
    }
}
