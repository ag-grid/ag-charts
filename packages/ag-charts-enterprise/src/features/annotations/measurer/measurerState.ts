import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext, MeasurerPropertiesType } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { isEphemeralType } from '../utils/types';
import {
    DatePriceRangeProperties,
    DateRangeProperties,
    PriceRangeProperties,
    QuickDatePriceRangeProperties,
} from './measurerProperties';
import type { MeasurerScene } from './measurerScene';

const { StateMachine, StateMachineProperty } = _ModuleSupport;

interface MeasurerStateMachineContext<Datum extends MeasurerPropertiesType>
    extends Omit<AnnotationsCreateStateMachineContext, 'create'> {
    create: (datum: Datum) => void;
}

abstract class MeasurerTypeStateMachine<Datum extends MeasurerPropertiesType> extends StateMachine<
    'start' | 'end',
    Pick<AnnotationStateEvents, 'click' | 'hover' | 'drag' | 'dragEnd' | 'reset' | 'cancel'>
> {
    override debug = _Util.Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected datum?: Datum;

    @StateMachineProperty()
    protected node?: MeasurerScene;

    constructor(ctx: MeasurerStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: Point }) => {
            const datum = this.createDatum();
            datum.set({ start: point, end: point });
            ctx.create(datum);
        };

        const actionEndUpdate = ({ point }: { point: Point }) => {
            const { datum, node } = this;
            datum?.set({ end: point });

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
            if (isEphemeralType(this.datum)) return;
            ctx.recordAction(`Create ${this.node?.type} annotation`);
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
