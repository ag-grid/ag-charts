import { Debug, type Point, StateMachine, StateMachineProperty } from 'ag-charts-core';

import type { AnnotationContext, DataPoint } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { snapPoint } from '../utils/coords';
import { ArrowProperties, LineProperties, LineTypeProperties } from './lineProperties';
import type { LineScene } from './lineScene';

interface LineStateMachineContext<Datum extends LineTypeProperties>
    extends Omit<AnnotationsCreateStateMachineContext, 'create'> {
    create: (datum: Datum) => void;
}

export abstract class LineTypeStateMachine<Datum extends LineTypeProperties> extends StateMachine<
    'start' | 'waiting-first-render' | 'end',
    Pick<
        AnnotationStateEvents,
        'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'reset' | 'cancel' | 'render'
    >
> {
    override debug = Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected datum?: Datum;

    @StateMachineProperty()
    protected node?: LineScene;

    @StateMachineProperty()
    protected snapping: boolean = false;

    constructor(ctx: LineStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: DataPoint }) => {
            const datum = this.createDatum();
            datum.set({ start: point, end: point });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            const { node } = this;
            node?.toggleActive(true);
            node?.toggleHandles({ start: true, end: false });
        };

        const actionEndUpdate = ({ offset, context }: { offset: Point; context: AnnotationContext }) => {
            const { datum, snapping } = this;
            if (!datum) return;

            datum.set({ end: snapPoint(offset, context, snapping, datum.start, datum.snapToAngle) });
            ctx.update();
        };

        const actionEndFinish = () => {
            this.node?.toggleHandles({ end: true });
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
                    target: StateMachine.parent,
                    action: actionEndFinish,
                },
                drag: actionEndUpdate,
                dragEnd: {
                    target: StateMachine.parent,
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
        });
    }

    abstract createDatum(): Datum;
}

export class ArrowStateMachine extends LineTypeStateMachine<ArrowProperties> {
    override createDatum() {
        return new ArrowProperties();
    }
}

export class LineStateMachine extends LineTypeStateMachine<LineProperties> {
    override createDatum() {
        return new LineProperties();
    }
}
