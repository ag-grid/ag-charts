import { Debug, StateMachine } from 'ag-charts-core';

import type { DataPoint } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { PointDatum } from '../datum/pointDatum';
import type { PointScene } from '../scenes/pointScene';
import type { AnnotationStateEvents } from './stateTypes';

const INHERITED_PROPERTIES = ['node'] as const;

interface PointStateMachineContext<Datum extends PointDatum> extends Omit<
    AnnotationsCreateStateMachineContext,
    'create'
> {
    create: (datum: Datum) => void;
}

export abstract class PointStateMachine<Datum extends PointDatum, Node extends PointScene<Datum>> extends StateMachine<
    'start' | 'waiting-first-render',
    Pick<AnnotationStateEvents, 'click' | 'drag' | 'cancel' | 'render' | 'reset'>
> {
    override debug = Debug.create(true, 'annotations');

    protected node?: Node;

    override inheritedProperties() {
        return INHERITED_PROPERTIES;
    }

    constructor(ctx: PointStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: DataPoint }) => {
            const datum = this.createDatum();
            datum.x = point.x;
            datum.y = point.y;
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            this.node?.toggleActive(true);
            ctx.showAnnotationOptions();
            ctx.update();
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
                cancel: StateMachine.parent,
                reset: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: StateMachine.parent,
                    action: actionFirstRender,
                },
            },
        });
    }

    protected abstract createDatum(): Datum;
}
