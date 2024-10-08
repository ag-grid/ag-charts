import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import type { AnnotationProperties, AnnotationsStateMachineContext } from '../annotationsSuperTypes';

const { StateMachine, Vec2 } = _ModuleSupport;

export class DragStateMachine<
    D extends AnnotationProperties,
    N extends {
        dragStart: (datum: D, offset: _ModuleSupport.Vec2, context: AnnotationContext) => void;
        drag: (datum: D, offset: _ModuleSupport.Vec2, context: AnnotationContext, snapping: boolean) => void;
        stopDragging: () => void;
    },
> extends StateMachine<'idle' | 'dragging', 'keyDown' | 'keyUp' | 'drag' | 'dragStart' | 'dragEnd'> {
    override debug = _Util.Debug.create(true, 'annotations');

    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private hasMoved = false;
    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private dragStart?: _ModuleSupport.Vec2;

    constructor(
        ctx: AnnotationsStateMachineContext & {
            datum: () => D | undefined;
            node: () => N | undefined;
            setSelectedWithDrag: () => void;
            setSnapping: (snapping: boolean) => void;
            getSnapping: () => boolean;
        }
    ) {
        super('idle', {
            idle: {
                dragStart: {
                    target: 'dragging',
                    action: ({ offset, context }) => {
                        this.hasMoved = false;
                        this.dragStart = offset;
                        ctx.node()?.dragStart(ctx.datum()!, offset, context);
                    },
                },
            },

            dragging: {
                keyDown: ({ shiftKey }: { shiftKey: boolean }) => {
                    ctx.setSnapping(shiftKey);
                },

                keyUp: ({ shiftKey }: { shiftKey: boolean }) => {
                    ctx.setSnapping(shiftKey);
                },

                drag: ({ offset, context }) => {
                    this.hasMoved = Vec2.lengthSquared(Vec2.sub(offset, this.dragStart!)) > 0;
                    ctx.setSelectedWithDrag();
                    const datum = ctx.datum()!;
                    const snapping = ctx.getSnapping();
                    ctx.node()?.drag(datum, offset, context, snapping);
                    ctx.update();
                },

                dragEnd: {
                    target: StateMachine.parent,
                    action: () => {
                        ctx.node()?.stopDragging();
                        ctx.stopInteracting();
                        if (this.hasMoved) ctx.recordAction('Move annotation');
                    },
                },
            },
        });
    }
}
