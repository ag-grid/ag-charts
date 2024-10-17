import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
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
}

abstract class LineTypeStateMachine<Datum extends ArrowProperties | LineProperties> extends StateMachine<
    'start' | 'end',
    'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'reset' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: LineStateMachineContext<Datum>) {
        const actionCreate = ({ point }: { point: () => Point }) => {
            const datum = this.createDatum();
            const origin = point();
            datum.set({ start: origin, end: origin });
            ctx.create(datum);
            ctx.addPostUpdateFns(
                () => ctx.node()?.toggleActive(true),
                () => ctx.node()?.toggleHandles({ start: true, end: false })
            );
        };

        const actionEndUpdate = ({ point }: { point: (origin?: Point, snapToAngle?: number) => Point }) => {
            const datum = ctx.datum();
            datum?.set({ end: point(datum?.start, datum?.snapToAngle) });

            ctx.update();
        };

        const actionEndFinish = () => {
            ctx.node()?.toggleHandles({ end: true });
            ctx.update();
        };

        const actionCancel = () => ctx.delete();

        const onExitEnd = () => {
            ctx.showAnnotationOptions();
            ctx.recordAction(`Create ${ctx.datum()?.type} annotation`);
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
                keyDown: actionEndUpdate,
                keyUp: actionEndUpdate,
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
