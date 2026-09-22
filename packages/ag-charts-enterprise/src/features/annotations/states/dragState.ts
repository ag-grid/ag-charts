import { Debug, type Point, StateMachine, Vec2 } from 'ag-charts-core';

import type { AnnotationContext } from '../annotationTypes';
import type { AnnotationDatum, AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import type { AnnotationStateEvents } from './stateTypes';

export class DragStateMachine<
    Datum extends AnnotationDatum,
    Node extends {
        dragStart: (datum: Datum, offset: Point, context: AnnotationContext) => void;
        drag: (datum: Datum, offset: Point, context: AnnotationContext, snapping: boolean) => void;
        stopDragging: () => void;
    },
> extends StateMachine<
    'idle' | 'dragging',
    Pick<AnnotationStateEvents, 'keyDown' | 'keyUp' | 'drag' | 'dragStart' | 'dragEnd'>
> {
    override debug = Debug.create(true, 'annotations');

    protected hasMoved = false;
    protected dragStart?: Point;

    protected snapping: boolean = false;

    protected datum?: Datum;

    protected node?: Node;

    override inheritedProperties() {
        return ['snapping', 'datum', 'node'] as const;
    }

    private offset?: Point;

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
                        if (this.hasMoved) ctx.recordAction('Move annotation');
                        ctx.update();
                    },
                },
            },
        });
    }
}
