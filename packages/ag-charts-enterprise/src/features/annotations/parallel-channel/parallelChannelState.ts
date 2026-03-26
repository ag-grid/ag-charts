import { Debug, type Point, StateMachine, StateMachineProperty, isNumber } from 'ag-charts-core';

import { type AnnotationContext, AnnotationType, type DataPoint } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { snapPoint } from '../utils/coords';
import { getGroupingValue } from '../utils/scale';
import { ParallelChannelProperties } from './parallelChannelProperties';
import type { ParallelChannelScene } from './parallelChannelScene';

interface ParallelChannelStateMachineContext extends Omit<AnnotationsCreateStateMachineContext, 'create'> {
    create: (datum: ParallelChannelProperties) => void;
}

export class ParallelChannelStateMachine extends StateMachine<
    'start' | 'waiting-first-render' | 'end' | 'height',
    Pick<
        AnnotationStateEvents,
        'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'cancel' | 'reset' | 'render'
    >
> {
    override debug = Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected datum?: ParallelChannelProperties;

    @StateMachineProperty()
    protected node?: ParallelChannelScene;

    @StateMachineProperty()
    protected snapping: boolean = false;

    constructor(ctx: ParallelChannelStateMachineContext) {
        const actionCreate = ({ point }: { point: DataPoint }) => {
            const datum = new ParallelChannelProperties();
            datum.set({ start: point, end: point, height: 0 });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            const { node } = this;
            node?.toggleActive(true);
            node?.toggleHandles({
                topLeft: true,
                topMiddle: false,
                topRight: false,
                bottomLeft: false,
                bottomMiddle: false,
                bottomRight: false,
            });
        };

        const actionEndUpdate = ({ offset, context }: { offset: Point; context: AnnotationContext }) => {
            const { datum, snapping } = this;
            if (!datum) return;

            datum.set({ end: snapPoint(offset, context, snapping, datum.start, datum.snapToAngle) });
            ctx.update();
        };

        const actionEndFinish = () => {
            this.node?.toggleHandles({
                topRight: true,
            });
            ctx.update();
        };

        const actionHeightUpdate = ({ point }: { point: DataPoint }) => {
            const { datum, node } = this;

            const endY = getGroupingValue(datum?.end.y);
            const startY = getGroupingValue(datum?.start.y);

            const { y: pointY } = point;

            if (datum == null || !isNumber(startY) || !isNumber(endY) || !isNumber(pointY)) return;

            const height = endY - (pointY ?? 0);
            const bottomStartY = startY - height;

            node?.toggleHandles({ bottomLeft: true, bottomRight: true });

            if (
                !ctx.validatePoint({ x: datum.start.x, y: bottomStartY }, { overflowContinuous: true }) ||
                !ctx.validatePoint({ x: datum.end.x, y: point.y }, { overflowContinuous: true })
            ) {
                return;
            }

            datum.set({ height });
            ctx.update();
        };

        const actionHeightFinish = ({ point }: { point: DataPoint }) => {
            const { datum, node } = this;

            const endY = getGroupingValue(datum?.end.y);
            const startY = getGroupingValue(datum?.start.y);

            const { y: pointY } = point;

            if (datum == null || !isNumber(startY) || !isNumber(endY) || !isNumber(pointY)) return;

            const height = endY - (pointY ?? 0);
            const bottomStartY = startY - height;

            node?.toggleHandles(true);

            if (
                !ctx.validatePoint({ x: datum.start.x, y: bottomStartY }, { overflowContinuous: true }) ||
                !ctx.validatePoint({ x: datum.end.x, y: point.y }, { overflowContinuous: true })
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
