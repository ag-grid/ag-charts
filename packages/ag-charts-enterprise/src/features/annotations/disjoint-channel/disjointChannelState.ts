import { _ModuleSupport, _Util } from 'ag-charts-community';

import { AnnotationType, type Point } from '../annotationTypes';
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
}

export class DisjointChannelStateMachine extends StateMachine<
    'start' | 'end' | 'height',
    'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'cancel' | 'reset'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: DisjointChannelStateMachineContext) {
        const actionCreate = ({ point }: { point: () => Point }) => {
            const datum = new DisjointChannelProperties();
            const origin = point();
            datum.set({ start: origin, end: origin, startHeight: 0, endHeight: 0 });
            ctx.create(datum);
            ctx.addPostUpdateFns(
                () => ctx.node()?.toggleActive(true),
                () =>
                    ctx.node()?.toggleHandles({
                        topLeft: true,
                        topRight: false,
                        bottomLeft: false,
                        bottomRight: false,
                    })
            );
        };

        const actionEndUpdate = ({ point }: { point: (origin?: Point, snapToAngle?: number) => Point }) => {
            const datum = ctx.datum();
            datum?.set({ end: point(datum?.start, datum?.snapToAngle) });

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
            const endHeight = datum.end.y - (y ?? 0);
            const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;

            const bottomStart = { x: datum.start.x, y: datum.start.y - startHeight };
            const bottomEnd = { x: datum.end.x, y };

            ctx.node()?.toggleHandles({ bottomLeft: true, bottomRight: true });

            if (!ctx.validatePoint(bottomStart) || !ctx.validatePoint(bottomEnd)) {
                return;
            }

            datum.set({ startHeight, endHeight });
            ctx.update();
        };

        const actionHeightFinish = ({ point }: { point: () => Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const y = point().y;
            const endHeight = datum.end.y - (y ?? 0);
            const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;

            const bottomStart = { x: datum.start.x, y: datum.start.y - endHeight };
            const bottomEnd = { x: datum.end.x, y };

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
                keyDown: actionEndUpdate,
                keyUp: actionEndUpdate,
                click: {
                    target: 'height',
                    action: actionEndFinish,
                },
                dragEnd: {
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
            },
            height: {
                hover: actionHeightUpdate,
                click: {
                    target: StateMachine.parent,
                    action: actionHeightFinish,
                },
                drag: {
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
