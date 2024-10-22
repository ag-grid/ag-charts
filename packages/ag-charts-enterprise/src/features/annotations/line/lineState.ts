import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { AnnotationContext, Point } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { snapPoint } from '../utils/coords';
import { ArrowProperties, LineProperties } from './lineProperties';
import type { LineScene } from './lineScene';

const { StateMachine, StateMachineProperty } = _ModuleSupport;

interface LineStateMachineContext<Datum extends ArrowProperties | LineProperties>
    extends Omit<AnnotationsCreateStateMachineContext, 'create'> {
    create: (datum: Datum) => void;
}

abstract class LineTypeStateMachine<Datum extends ArrowProperties | LineProperties> extends StateMachine<
    'start' | 'end',
    Pick<AnnotationStateEvents, 'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'reset' | 'cancel'>
> {
    override debug = _Util.Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected datum?: Datum;

    @StateMachineProperty()
    protected node?: LineScene;

    @StateMachineProperty()
    protected snapping: boolean = false;

    constructor(ctx: LineStateMachineContext<Datum>) {
        const actionCreate = ({ point, shiftKey }: { point: Point; shiftKey: boolean }) => {
            ctx.setSnapping(shiftKey);
            const datum = this.createDatum();
            datum.set({ start: point, end: point });
            ctx.create(datum);
            ctx.addPostUpdateFns(
                () => this.node?.toggleActive(true),
                () => this.node?.toggleHandles({ start: true, end: false })
            );
        };

        const actionEndUpdate = ({ offset, context }: { offset: _ModuleSupport.Vec2; context: AnnotationContext }) => {
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
            ctx.recordAction(`Create ${this.datum?.type} annotation`);
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
                keyDown: ({ shiftKey }) => ctx.setSnapping(shiftKey),
                keyUp: ({ shiftKey }) => ctx.setSnapping(shiftKey),
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
