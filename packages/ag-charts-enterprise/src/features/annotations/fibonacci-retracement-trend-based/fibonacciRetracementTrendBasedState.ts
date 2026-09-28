import { Debug, type Point, StateMachine } from 'ag-charts-core';

import type { AnnotationContext, DataPoint } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { SNAP_TO_ANGLE, snapPoint } from '../utils/coords';
import { applyAnnotationOptions } from '../utils/datum';
import {
    type FibonacciRetracementTrendBasedDatum,
    fibonacciRetracementTrendBasedDatum,
} from './fibonacciRetracementTrendBasedDatum';
import type { FibonacciRetracementTrendBasedScene } from './fibonacciRetracementTrendBasedScene';

const INHERITED_PROPERTIES = ['datum', 'node', 'snapping'] as const;

interface FibonacciRetracementTrendBasedStateMachineContext extends Omit<
    AnnotationsCreateStateMachineContext,
    'create'
> {
    create: (datum: FibonacciRetracementTrendBasedDatum) => void;
}

export class FibonacciRetracementTrendBasedStateMachine extends StateMachine<
    'start' | 'waiting-first-render' | 'end' | 'endRetracement',
    Pick<
        AnnotationStateEvents,
        'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'reset' | 'cancel' | 'render'
    >
> {
    override debug = Debug.create(true, 'annotations');

    protected datum?: FibonacciRetracementTrendBasedDatum;

    protected node?: FibonacciRetracementTrendBasedScene;

    protected snapping: boolean = false;

    override inheritedProperties() {
        return INHERITED_PROPERTIES;
    }

    constructor(ctx: FibonacciRetracementTrendBasedStateMachineContext) {
        const actionCreate = ({ point }: { point: DataPoint }) => {
            const datum = this.createDatum();
            applyAnnotationOptions(datum, { start: point, end: point });
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

            applyAnnotationOptions(datum, { end: snapPoint(offset, context, snapping, datum.start, SNAP_TO_ANGLE) });
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

            applyAnnotationOptions(datum, {
                endRetracement: snapPoint(offset, context, snapping, datum.end, SNAP_TO_ANGLE),
            });
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
        return fibonacciRetracementTrendBasedDatum.create();
    }
}
