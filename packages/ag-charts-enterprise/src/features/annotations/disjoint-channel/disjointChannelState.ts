import { _ModuleSupport, _Util } from 'ag-charts-community';

import { AnnotationType, type GuardDragClickDoubleEvent, type Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { DisjointChannelProperties } from './disjointChannelProperties';
import type { DisjointChannelScene } from './disjointChannelScene';

const { StateMachine } = _ModuleSupport;

interface DisjointChannelStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: DisjointChannelProperties) => void;
    delete: () => void;
    datum: () => DisjointChannelProperties | undefined;
    node: () => DisjointChannelScene | undefined;
    showAnnotationOptions: () => void;
    guardDragClickDoubleEvent: GuardDragClickDoubleEvent;
}

export class DisjointChannelStateMachine extends StateMachine<
    'start' | 'end' | 'height',
    'click' | 'hover' | 'drag' | 'cancel' | 'reset'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: DisjointChannelStateMachineContext) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = new DisjointChannelProperties();
            datum.set({ start: point, end: point, startHeight: 0, endHeight: 0 });
            ctx.create(datum);
        };

        const actionEndUpdate = ({ point }: { point: Point }) => {
            ctx.guardDragClickDoubleEvent.hover();
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleHandles({ topRight: false, bottomLeft: false, bottomRight: false });
            ctx.update();
        };

        const actionEndFinish = ({ point }: { point: Point }) => {
            ctx.datum()?.set({ end: point });
        };

        const actionHeightUpdate = ({ point }: { point: Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const endHeight = datum.end.y - (point.y ?? 0);
            const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;

            const bottomStart = { x: datum.start.x, y: datum.start.y - startHeight };
            const bottomEnd = { x: datum.end.x, y: point.y };

            ctx.node()?.toggleHandles({ bottomLeft: false });

            if (!ctx.validatePoint(bottomStart) || !ctx.validatePoint(bottomEnd)) {
                return;
            }

            datum.set({ startHeight, endHeight });
            ctx.update();
        };

        const actionHeightFinish = ({ point }: { point: Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const endHeight = datum.end.y - (point.y ?? 0);
            const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;

            const bottomStart = { x: datum.start.x, y: datum.start.y - endHeight };
            const bottomEnd = { x: datum.end.x, y: point.y };

            ctx.node()?.toggleHandles(true);

            if (!ctx.validatePoint(bottomStart) || !ctx.validatePoint(bottomEnd)) {
                return;
            }

            datum.set({ startHeight, endHeight });
            ctx.recordAction(`Create ${AnnotationType.DisjointChannel} annotation`);
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
                    // Ensure that a double event of drag before a single click does not trigger an immediate
                    // transition causing the start and end to be at the same point.
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
