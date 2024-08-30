import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { PointProperties } from '../properties/pointProperties';
import type { PointScene } from '../scenes/pointScene';

const { StateMachine } = _ModuleSupport;

interface PointStateMachineContext<Datum extends PointProperties, Node extends PointScene<Datum>>
    extends Omit<AnnotationsStateMachineContext, 'create' | 'node'> {
    create: (datum: Datum) => void;
    node: () => Node | undefined;
    showAnnotationOptions: () => void;
}

export abstract class PointStateMachine<
    Datum extends PointProperties,
    Node extends PointScene<Datum>,
> extends StateMachine<'start' | 'waiting-first-render', 'click' | 'cancel' | 'render' | 'reset'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: PointStateMachineContext<Datum, Node>) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ x: point.x, y: point.y });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            ctx.node()?.toggleActive(true);
            ctx.showAnnotationOptions();
            ctx.update();
        };

        super('start', {
            start: {
                click: {
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
