import { Debug, StateMachine } from 'ag-charts-core';

import type { DataPoint } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext, MeasurerDatumType } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { applyAnnotationOptions } from '../utils/datum';
import {
    type DatePriceRangeDatum,
    type DateRangeDatum,
    type PriceRangeDatum,
    type QuickDatePriceRangeDatum,
    datePriceRangeDatum,
    dateRangeDatum,
    priceRangeDatum,
    quickDatePriceRangeDatum,
} from './measurerDatum';
import type { MeasurerScene } from './measurerScene';

const INHERITED_PROPERTIES = ['datum', 'node'] as const;

interface MeasurerStateMachineContext<Datum extends MeasurerDatumType> extends Omit<
    AnnotationsCreateStateMachineContext,
    'create'
> {
    create: (datum: Datum) => void;
}

abstract class MeasurerTypeStateMachine<Datum extends MeasurerDatumType> extends StateMachine<
    'start' | 'waiting-create-render' | 'end',
    Pick<AnnotationStateEvents, 'click' | 'create' | 'hover' | 'drag' | 'dragEnd' | 'reset' | 'cancel' | 'render'>
> {
    override debug = Debug.create(true, 'annotations');

    protected datum?: Datum;

    protected node?: MeasurerScene;

    override inheritedProperties() {
        return INHERITED_PROPERTIES;
    }

    constructor(ctx: MeasurerStateMachineContext<Datum>) {
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

        const actionEndUpdate = ({ point }: { point: DataPoint }) => {
            const { datum, node } = this;
            if (datum) applyAnnotationOptions(datum, { end: point });

            node?.toggleActive(true);
            node?.toggleHandles({ end: false });
            ctx.update();
        };

        const actionEndFinish = () => {
            this.node?.toggleHandles({ end: true });
        };

        const actionCancel = () => ctx.delete();

        const onExitEnd = () => {
            ctx.showAnnotationOptions();
            ctx.recordAction(`Create ${this.node?.type} annotation`);
        };

        const actionCreatedRender = () => {
            this.node?.toggleActive(true);
            onExitEnd();
        };

        super('start', {
            start: {
                reset: StateMachine.parent,
                click: {
                    target: 'end',
                    action: actionCreate,
                },
                drag: {
                    target: 'end',
                    action: actionCreate,
                },
                create: {
                    target: 'waiting-create-render',
                    action: actionCreateAll,
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
                drag: actionEndUpdate,
                click: {
                    target: StateMachine.parent,
                    action: actionEndFinish,
                },
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

export class DateRangeStateMachine extends MeasurerTypeStateMachine<DateRangeDatum> {
    override createDatum() {
        return dateRangeDatum.create();
    }
}

export class PriceRangeStateMachine extends MeasurerTypeStateMachine<PriceRangeDatum> {
    override createDatum() {
        return priceRangeDatum.create();
    }
}

export class DatePriceRangeStateMachine extends MeasurerTypeStateMachine<DatePriceRangeDatum> {
    override createDatum() {
        return datePriceRangeDatum.create();
    }
}

export class QuickDatePriceRangeStateMachine extends MeasurerTypeStateMachine<QuickDatePriceRangeDatum> {
    override createDatum() {
        return quickDatePriceRangeDatum.create();
    }
}
