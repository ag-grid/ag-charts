import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { PointProperties } from '../properties/pointProperties';
import type { PointScene } from '../scenes/pointScene';
import type { AnnotationStateEvents } from './stateTypes';

const { StateMachine, StateMachineProperty } = _ModuleSupport;

interface PointStateMachineContext<Datum extends PointProperties>
    extends Omit<AnnotationsCreateStateMachineContext, 'create'> {
    create: (datum: Datum) => void;
}

export abstract class PointStateMachine<
    Datum extends PointProperties,
    Node extends PointScene<Datum>,
> extends StateMachine<
    'start' | 'waiting-first-render',
    Pick<AnnotationStateEvents, 'click' | 'drag' | 'cancel' | 'render' | 'reset'>
> {
    override debug = _Util.Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected node?: Node;

    constructor(ctx: PointStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ x: point.x, y: point.y });
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
