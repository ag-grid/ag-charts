import { Debug, type Point, StateMachine } from 'ag-charts-core';

import type { AnnotationContext, DataPoint } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { SNAP_TO_ANGLE, snapPoint } from '../utils/coords';
import { applyAnnotationOptions } from '../utils/datum';
import { type ArrowDatum, type LineDatum, type LineTypeDatum, arrowDatum, lineDatum } from './lineDatum';
import type { LineScene } from './lineScene';

const INHERITED_PROPERTIES = ['datum', 'node', 'snapping'] as const;

interface LineStateMachineContext<Datum extends LineTypeDatum> extends Omit<
    AnnotationsCreateStateMachineContext,
    'create'
> {
    create: (datum: Datum) => void;
}

export abstract class LineTypeStateMachine<Datum extends LineTypeDatum> extends StateMachine<
    'start' | 'waiting-first-render' | 'waiting-create-render' | 'end',
    Pick<
        AnnotationStateEvents,
        'click' | 'create' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'reset' | 'cancel' | 'render'
    >
> {
    override debug = Debug.create(true, 'annotations');

    protected datum?: Datum;

    protected node?: LineScene;

    protected snapping: boolean = false;

    override inheritedProperties() {
        return INHERITED_PROPERTIES;
    }

    constructor(ctx: LineStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: DataPoint }) => {
            const datum = this.createDatum();
            applyAnnotationOptions(datum, { start: point, end: point });
            ctx.create(datum);
        };

        const actionCreateAll = ({ points: [start, end] }: { points: DataPoint[] }) => {
            const datum = this.createDatum();
            applyAnnotationOptions(datum, { start, end });
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

            applyAnnotationOptions(datum, { end: snapPoint(offset, context, snapping, datum.start, SNAP_TO_ANGLE) });
            ctx.update();
        };

        const actionEndFinish = () => {
            this.node?.toggleHandles({ end: true });
            ctx.update();
        };

        const actionCancel = () => ctx.delete();

        const onExitEnd = () => {
            ctx.showAnnotationOptions();
            ctx.recordAction(`Create ${this.datum?.type} annotation`);
        };

        const actionCreatedRender = () => {
            this.node?.toggleActive(true);
            onExitEnd();
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
                create: {
                    target: 'waiting-create-render',
                    action: actionCreateAll,
                },
                reset: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: 'end',
                    action: actionFirstRender,
                },
            },
            'waiting-create-render': {
                render: {
                    target: StateMachine.parent,
                    action: actionCreatedRender,
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

export class ArrowStateMachine extends LineTypeStateMachine<ArrowDatum> {
    override createDatum() {
        return arrowDatum.create();
    }
}

export class LineStateMachine extends LineTypeStateMachine<LineDatum> {
    override createDatum() {
        return lineDatum.create();
    }
}
