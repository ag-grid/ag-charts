import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { AnnotationContext } from '../annotationTypes';
import type { AnnotationProperties, AnnotationsStateMachineContext } from '../annotationsSuperTypes';

const { StateMachine } = _ModuleSupport;

export class DragStateMachine<
    D extends AnnotationProperties,
    N extends {
        dragStart: (datum: D, offset: _Util.Vec2, context: AnnotationContext) => void;
        drag: (datum: D, offset: _Util.Vec2, context: AnnotationContext) => void;
        stopDragging: () => void;
    },
> extends StateMachine<'idle' | 'dragging', 'drag' | 'dragStart' | 'dragEnd'> {
    override debug = _Util.Debug.create(true, 'annotations');
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
                        ctx.node()?.dragStart(ctx.datum()!, offset, context);
                    },
                },
            },

            dragging: {
                drag: ({ offset, context }) => {
                    ctx.setSelectedWithDrag();
                    ctx.node()?.drag(ctx.datum()!, offset, context);
                    ctx.update();
                },

                dragEnd: {
                    target: StateMachine.parent,
                    action: () => {
                        ctx.node()?.stopDragging();
                        ctx.stopInteracting();
                    },
                },
            },
        });
    }
}
