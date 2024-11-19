import { _ModuleSupport } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import type { AnnotationProperties, AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from './stateTypes';

const { StateMachine, StateMachineProperty, Vec2, Debug } = _ModuleSupport;

export class DragStateMachine<
    Datum extends AnnotationProperties,
    Node extends {
        dragStart: (datum: Datum, offset: _ModuleSupport.Vec2, context: AnnotationContext) => void;
        drag: (datum: Datum, offset: _ModuleSupport.Vec2, context: AnnotationContext, snapping: boolean) => void;
        stopDragging: () => void;
    },
> extends StateMachine<
    'idle' | 'dragging',
    Pick<AnnotationStateEvents, 'keyDown' | 'keyUp' | 'drag' | 'dragStart' | 'dragEnd'>
> {
    override debug = Debug.create(true, 'annotations');

    protected hasMoved = false;
    protected dragStart?: _ModuleSupport.Vec2;

    @StateMachineProperty()
    protected snapping: boolean = false;

    @StateMachineProperty()
    protected datum?: Datum;

    @StateMachineProperty()
    protected node?: Node;

    private offset?: _ModuleSupport.Vec2;

    constructor(ctx: AnnotationsStateMachineContext) {
        const actionKeyChange = ({ context }: { context: AnnotationContext }) => {
            this.node?.drag(this.datum!, this.offset!, context, this.snapping);
            ctx.update();
        };

        super('idle', {
            idle: {
                dragStart: {
                    target: 'dragging',
                    action: ({ offset, context }) => {
                        this.hasMoved = false;
                        this.dragStart = offset;
                        this.offset = offset;
                        this.node?.dragStart(this.datum!, offset, context);
                    },
                },
            },

            dragging: {
                keyDown: actionKeyChange,
                keyUp: actionKeyChange,

                drag: ({ offset, context }) => {
                    this.hasMoved = Vec2.lengthSquared(Vec2.sub(offset, this.dragStart!)) > 0;
                    this.offset = offset;
                    this.node?.drag(this.datum!, offset, context, this.snapping);
                    ctx.update();
                },

                dragEnd: {
                    target: StateMachine.parent,
                    action: () => {
                        this.node?.stopDragging();
                        ctx.stopInteracting();
                        if (this.hasMoved) ctx.recordAction('Move annotation');
                        ctx.update();
                    },
                },
            },
        });
    }
}
