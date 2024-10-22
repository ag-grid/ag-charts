import { _ModuleSupport, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType, type Point } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { snapPoint } from '../utils/coords';
import { DisjointChannelProperties } from './disjointChannelProperties';
import type { DisjointChannelScene } from './disjointChannelScene';

const { StateMachine, StateMachineProperty } = _ModuleSupport;

interface DisjointChannelStateMachineContext extends Omit<AnnotationsCreateStateMachineContext, 'create'> {
    create: (datum: DisjointChannelProperties) => void;
}

export class DisjointChannelStateMachine extends StateMachine<
    'start' | 'waiting-first-render' | 'end' | 'height',
    Pick<
        AnnotationStateEvents,
        'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'cancel' | 'reset' | 'render'
    >
> {
    override debug = _Util.Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected datum?: DisjointChannelProperties;

    @StateMachineProperty()
    protected node?: DisjointChannelScene;

    @StateMachineProperty()
    protected snapping: boolean = false;

    constructor(ctx: DisjointChannelStateMachineContext) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = new DisjointChannelProperties();
            datum.set({ start: point, end: point, startHeight: 0, endHeight: 0 });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            const { node } = this;
            node?.toggleActive(true);
            node?.toggleHandles({ topLeft: true, topRight: false, bottomLeft: false, bottomRight: false });
        };

        const actionEndUpdate = ({ offset, context }: { offset: _ModuleSupport.Vec2; context: AnnotationContext }) => {
            const { datum, snapping } = this;
            if (!datum) return;

            datum.set({ end: snapPoint(offset, context, snapping, datum.start, datum.snapToAngle) });
            ctx.update();
        };

        const actionEndFinish = () => {
            this.node?.toggleHandles({ topRight: true });
            ctx.update();
        };

        const actionHeightUpdate = ({ point }: { point: Point }) => {
            const { datum, node } = this;

            if (datum?.start.y == null || datum?.end.y == null) return;

            const endHeight = datum.end.y - (point.y ?? 0);
            const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;

            const bottomStart = { x: datum.start.x, y: datum.start.y - startHeight };
            const bottomEnd = { x: datum.end.x, y: point.y };

            node?.toggleHandles({ bottomLeft: true, bottomRight: true });

            if (!ctx.validatePoint(bottomStart) || !ctx.validatePoint(bottomEnd)) {
                return;
            }

            datum.set({ startHeight, endHeight });
            ctx.update();
        };

        const actionHeightFinish = ({ point }: { point: Point }) => {
            const { datum, node } = this;

            if (datum?.start.y == null || datum?.end.y == null) return;

            const endHeight = datum.end.y - (point.y ?? 0);
            const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;

            const bottomStart = { x: datum.start.x, y: datum.start.y - endHeight };
            const bottomEnd = { x: datum.end.x, y: point.y };

            node?.toggleHandles(true);

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
                    target: 'waiting-first-render',
                    action: actionCreate,
                },
                drag: {
                    target: 'waiting-first-render',
                    action: actionCreate,
                },
                reset: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: 'end',
                    action: actionFirstRender,
                },
            },
            end: {
                hover: actionEndUpdate,
                drag: actionEndUpdate,
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
