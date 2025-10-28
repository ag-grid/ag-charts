import { _ModuleSupport } from 'ag-charts-community';
import { Debug, type Point } from 'ag-charts-core';

import type { AnnotationContext, DataPoint } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { snapPoint } from '../utils/coords';
import { FibonacciRetracementTrendBasedProperties } from './fibonacciRetracementTrendBasedProperties';
import type { FibonacciRetracementTrendBasedScene } from './fibonacciRetracementTrendBasedScene';

const { StateMachine, StateMachineProperty } = _ModuleSupport;

interface FibonacciRetracementTrendBasedStateMachineContext
    extends Omit<AnnotationsCreateStateMachineContext, 'create'> {
    create: (datum: FibonacciRetracementTrendBasedProperties) => void;
}

export class FibonacciRetracementTrendBasedStateMachine extends StateMachine<
    'start' | 'waiting-first-render' | 'end' | 'endRetracement',
    Pick<
        AnnotationStateEvents,
        'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'reset' | 'cancel' | 'render'
    >
> {
    override debug = Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected datum?: FibonacciRetracementTrendBasedProperties;

    @StateMachineProperty()
    protected node?: FibonacciRetracementTrendBasedScene;

    @StateMachineProperty()
    protected snapping: boolean = false;

    constructor(ctx: FibonacciRetracementTrendBasedStateMachineContext) {
        const actionCreate = ({ point }: { point: DataPoint }) => {
            const datum = this.createDatum();
            datum.set({ start: point, end: point });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            const { node } = this;
            node?.toggleActive(true);
            node?.toggleHandles({ start: true, end: false, endRetracement: false });
        };

        const actionEndUpdate = ({ offset, context }: { offset: Point; context: AnnotationContext }) => {
            const { datum, snapping } = this;
            if (!datum) return;

            datum.set({ end: snapPoint(offset, context, snapping, datum.start, datum.snapToAngle) });
            ctx.update();
        };

        const actionEndFinish = () => {
            const { datum } = this;
            if (!datum) return;

            datum.endRetracement.x = datum.end.x;
            datum.endRetracement.y = datum.end.y;

            this.node?.toggleHandles({ end: true });
            ctx.update();
        };

        const actionEndRetracementUpdate = ({ offset, context }: { offset: Point; context: AnnotationContext }) => {
            const { datum, snapping } = this;
            if (!datum) return;

            datum.set({ endRetracement: snapPoint(offset, context, snapping, datum.end, datum.snapToAngle) });
            ctx.update();
        };

        const actionEndRetracementFinish = () => {
            this.node?.toggleHandles({ endRetracement: true });
            ctx.update();
        };

        const actionCancel = () => ctx.delete();

        const onExitEnd = () => {
            ctx.showAnnotationOptions();
            ctx.recordAction(`Create ${(this.datum as any)?.type} annotation`);
        };

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
                click: {
                    target: 'endRetracement',
                    action: actionEndFinish,
                },
                drag: actionEndUpdate,
                dragEnd: {
                    target: 'endRetracement',
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
                onExit: onExitEnd,
            },
            endRetracement: {
                hover: actionEndRetracementUpdate,
                click: {
                    target: StateMachine.parent,
                    action: actionEndRetracementFinish,
                },
                drag: {
                    target: StateMachine.parent,
                    action: actionEndRetracementFinish,
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

    createDatum() {
        return new FibonacciRetracementTrendBasedProperties();
    }
}
