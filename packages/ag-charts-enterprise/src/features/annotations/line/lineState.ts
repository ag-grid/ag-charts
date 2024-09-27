import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { GuardDragClickDoubleEvent, Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { ArrowProperties, LineProperties } from './lineProperties';
import type { LineScene } from './lineScene';

const { StateMachine } = _ModuleSupport;

interface LineStateMachineContext<Datum extends ArrowProperties | LineProperties>
    extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: Datum) => void;
    delete: () => void;
    datum: () => Datum | undefined;
    node: () => LineScene | undefined;
    showAnnotationOptions: () => void;
    guardDragClickDoubleEvent: GuardDragClickDoubleEvent;
}

abstract class LineTypeStateMachine<Datum extends ArrowProperties | LineProperties> extends StateMachine<
    'start' | 'end',
    'click' | 'hover' | 'drag' | 'reset' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: LineStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: () => Point }) => {
            const datum = this.createDatum();
            const origin = point();
            datum.set({ start: origin, end: origin });
            ctx.create(datum);
        };

        const actionEndUpdate = ({ point }: { point: (origin?: Point, snapToAngle?: number) => Point }) => {
            ctx.guardDragClickDoubleEvent.hover();

            const datum = ctx.datum();
            datum?.set({ end: point(datum?.start, datum?.snapToAngle) });

            ctx.node()?.toggleActive(true); // TODO: move to onEnter, but node doesn't exist until next render
            ctx.node()?.toggleHandles({ end: false });
            ctx.update();
        };

        const actionEndFinish = () => {
            ctx.node()?.toggleHandles({ end: true });
        };

        const actionCancel = () => ctx.delete();

        const onExitEnd = () => {
            ctx.guardDragClickDoubleEvent.reset();
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
                    guard: ctx.guardDragClickDoubleEvent.guard,
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
