import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import type { AnnotationProperties, AnnotationsStateMachineContext } from '../annotationsSuperTypes';

const { StateMachine } = _ModuleSupport;
const { Vec2 } = _Util;

export class DragStateMachine<
    D extends AnnotationProperties,
    N extends {
        dragStart: (datum: D, offset: _Util.Vec2, context: AnnotationContext) => void;
        drag: (datum: D, offset: _Util.Vec2, context: AnnotationContext) => void;
        stopDragging: () => void;
    },
> extends StateMachine<'idle' | 'dragging', 'drag' | 'dragStart' | 'dragEnd'> {
    override debug = _Util.Debug.create(true, 'annotations');

    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private hasMoved = false;
    // eslint-disable-next-line @typescript-eslint/prefer-readonly
    private dragStart?: _Util.Vec2;

    constructor(
        ctx: AnnotationsStateMachineContext & {
            datum: () => D | undefined;
            node: () => N | undefined;
            setSelectedWithDrag: () => void;
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
                drag: ({ offset, context }) => {
                    this.hasMoved = Vec2.lengthSquared(Vec2.sub(offset, this.dragStart!)) > 0;
                    ctx.setSelectedWithDrag();
                    ctx.node()?.drag(ctx.datum()!, offset, context);
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
