import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext, MeasurerPropertiesType } from '../annotationsSuperTypes';
import {
    DatePriceRangeProperties,
    DateRangeProperties,
    PriceRangeProperties,
    QuickDatePriceRangeProperties,
} from './measurerProperties';
import type { MeasurerScene } from './measurerScene';

const { StateMachine } = _ModuleSupport;

interface MeasurerStateMachineContext<Datum extends MeasurerPropertiesType>
    extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: Datum) => void;
    delete: () => void;
    datum: () => Datum | undefined;
    node: () => MeasurerScene | undefined;
    showAnnotationOptions: () => void;
}

abstract class MeasurerTypeStateMachine<Datum extends MeasurerPropertiesType> extends StateMachine<
    'start' | 'end',
    'click' | 'hover' | 'drag' | 'dragEnd' | 'reset' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: MeasurerStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: () => Point }) => {
            const datum = this.createDatum();
            const origin = point();
            datum.set({ start: origin, end: origin });
            ctx.create(datum);
        };

        const actionEndUpdate = ({ point }: { point: () => Point }) => {
            const datum = ctx.datum();
            datum?.set({ end: point() });

            ctx.node()?.toggleActive(true);
            ctx.node()?.toggleHandles({ end: false });
            ctx.update();
        };

        const actionEndFinish = () => {
            ctx.node()?.toggleHandles({ end: true });
        };

        const actionCancel = () => ctx.delete();

        const onExitEnd = () => {
            ctx.showAnnotationOptions();
            ctx.recordAction(`Create ${ctx.node()?.type} annotation`);
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
            },
            end: {
                hover: actionEndUpdate,
                click: {
                    target: StateMachine.parent,
                    action: actionEndFinish,
                },
                dragEnd: {
                    target: StateMachine.parent,
                    action: actionEndFinish,
                },
                drag: actionEndUpdate,
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

export class DateRangeStateMachine extends MeasurerTypeStateMachine<DateRangeProperties> {
    override createDatum() {
        return new DateRangeProperties();
    }
}

export class PriceRangeStateMachine extends MeasurerTypeStateMachine<PriceRangeProperties> {
    override createDatum() {
        return new PriceRangeProperties();
    }
}

export class DatePriceRangeStateMachine extends MeasurerTypeStateMachine<DatePriceRangeProperties> {
    override createDatum() {
        return new DatePriceRangeProperties();
    }
}

export class QuickDatePriceRangeStateMachine extends MeasurerTypeStateMachine<QuickDatePriceRangeProperties> {
    override createDatum() {
        return new QuickDatePriceRangeProperties();
    }
}
