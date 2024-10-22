import { _ModuleSupport, _Util } from 'ag-charts-community';

import { type AnnotationContext, AnnotationType, type Point } from '../annotationTypes';
import type { AnnotationsCreateStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from '../states/stateTypes';
import { snapPoint } from '../utils/coords';
import { ParallelChannelProperties } from './parallelChannelProperties';
import type { ParallelChannelScene } from './parallelChannelScene';

const { StateMachine, StateMachineProperty } = _ModuleSupport;

interface ParallelChannelStateMachineContext extends Omit<AnnotationsCreateStateMachineContext, 'create'> {
    create: (datum: ParallelChannelProperties) => void;
}

export class ParallelChannelStateMachine extends StateMachine<
    'start' | 'end' | 'height',
    Pick<AnnotationStateEvents, 'click' | 'hover' | 'keyDown' | 'keyUp' | 'drag' | 'dragEnd' | 'cancel' | 'reset'>
> {
    override debug = _Util.Debug.create(true, 'annotations');

    @StateMachineProperty()
    protected datum?: ParallelChannelProperties;

    @StateMachineProperty()
    protected node?: ParallelChannelScene;

    @StateMachineProperty()
    protected snapping: boolean = false;

    constructor(ctx: ParallelChannelStateMachineContext) {
        const actionCreate = ({ point, shiftKey }: { point: Point; shiftKey: boolean }) => {
            ctx.setSnapping(shiftKey);
            const datum = new ParallelChannelProperties();
            datum.set({ start: point, end: point, height: 0 });
            ctx.create(datum);
            ctx.addPostUpdateFns(
                () => this.node?.toggleActive(true),
                () =>
                    this.node?.toggleHandles({
                        topLeft: true,
                        topMiddle: false,
                        topRight: false,
                        bottomLeft: false,
                        bottomMiddle: false,
                        bottomRight: false,
                    })
            );
        };

        const actionEndUpdate = ({ offset, context }: { offset: _ModuleSupport.Vec2; context: AnnotationContext }) => {
            const { datum, snapping } = this;
            if (!datum) return;

            datum.set({ end: snapPoint(offset, context, snapping, datum.start, datum.snapToAngle) });
            ctx.update();
        };

        const actionEndFinish = () => {
            this.node?.toggleHandles({
                topRight: true,
            });
            ctx.update();
        };

        const actionHeightUpdate = ({ point }: { point: Point }) => {
            const { datum, node } = this;

            if (datum?.start.y == null || datum?.end.y == null) return;

            const height = datum.end.y - (point.y ?? 0);
            const bottomStartY = datum.start.y - height;

            node?.toggleHandles({ bottomLeft: true, bottomRight: true });

            if (
                !ctx.validatePoint({ x: datum.start.x, y: bottomStartY }) ||
                !ctx.validatePoint({ x: datum.end.x, y: point.y })
            ) {
                return;
            }

            datum.set({ height });
            ctx.update();
        };

        const actionHeightFinish = ({ point }: { point: Point }) => {
            const { datum, node } = this;

            if (datum?.start.y == null || datum?.end.y == null) return;

            const height = datum.end.y - (point.y ?? 0);
            const bottomStartY = datum.start.y - height;

            node?.toggleHandles(true);

            if (
                !ctx.validatePoint({ x: datum.start.x, y: bottomStartY }) ||
                !ctx.validatePoint({ x: datum.end.x, y: point.y })
            ) {
                return;
            }

            datum.set({ height });
            ctx.recordAction(`Create ${AnnotationType.ParallelChannel} annotation`);
            ctx.showAnnotationOptions();
            ctx.update();
        };

        const actionCancel = () => ctx.delete();

        super('start', {
            start: {
                click: {
                    target: 'end',
                    action: actionCreate,
                },
                drag: {
                    target: 'end',
                    action: actionCreate,
                },
                reset: StateMachine.parent,
            },
            end: {
                hover: actionEndUpdate,
                drag: actionEndUpdate,
                keyDown: ({ shiftKey }) => ctx.setSnapping(shiftKey),
                keyUp: ({ shiftKey }) => ctx.setSnapping(shiftKey),
                click: {
                    target: 'height',
                    action: actionEndFinish,
                },
                dragEnd: {
                    target: 'height',
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
            },
            height: {
                hover: actionHeightUpdate,
                click: {
                    target: StateMachine.parent,
                    action: actionHeightFinish,
                },
                drag: {
                    target: StateMachine.parent,
                    action: actionHeightFinish,
                },
                reset: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
                cancel: {
                    target: StateMachine.parent,
                    action: actionCancel,
                },
            },
        });
    }
}
