import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { ParallelChannelProperties } from './parallelChannelProperties';
import type { ParallelChannelScene } from './parallelChannelScene';

const { StateMachine } = _ModuleSupport;

interface ParallelChannelStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: ParallelChannelProperties) => void;
    datum: () => ParallelChannelProperties | undefined;
    node: () => ParallelChannelScene | undefined;
}

export class ParallelChannelStateMachine extends StateMachine<
    'start' | 'end' | 'height',
    'click' | 'hover' | 'drag' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(ctx: ParallelChannelStateMachineContext) {
        let hoverEventsSinceStart = 0;

        const onStartClick = ({ point }: { point: Point }) => {
            const datum = new ParallelChannelProperties();
            datum.set({ start: point, end: point, height: 0 });
            ctx.create(datum);
        };

        const onEndHover = ({ point }: { point: Point }) => {
            hoverEventsSinceStart++;
            ctx.datum()?.set({ end: point, height: 0 });
            ctx.node()?.toggleHandles({
                topMiddle: false,
                topRight: false,
                bottomLeft: false,
                bottomMiddle: false,
                bottomRight: false,
            });
            ctx.update();
        };

        const onEndClick = ({ point }: { point: Point }) => {
            ctx.datum()?.set({ end: point });
            ctx.node()?.toggleHandles({ topMiddle: false, bottomMiddle: false });
            ctx.update();
        };

        const onHeightHover = ({ point }: { point: Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const height = datum.end.y - (point.y ?? 0);
            const bottomStartY = datum.start.y - height;

            ctx.node()?.toggleHandles({ topMiddle: false, bottomMiddle: false });

            if (
                !ctx.validatePoint({ x: datum.start.x, y: bottomStartY }) ||
                !ctx.validatePoint({ x: datum.end.x, y: point.y })
            ) {
                return;
            }

            datum.set({ height });
            ctx.update();
        };

        const onHeightClick = ({ point }: { point: Point }) => {
            const datum = ctx.datum();

            if (datum?.start.y == null || datum?.end.y == null) return;

            const height = datum.end.y - (point.y ?? 0);
            const bottomStartY = datum.start.y - height;

            ctx.node()?.toggleHandles(true);

            if (
                ctx.validatePoint({ x: datum.start.x, y: bottomStartY }) &&
                ctx.validatePoint({ x: datum.end.x, y: point.y })
            ) {
                datum.set({ height });
            }
        };

        super('start', {
            start: {
                click: {
                    target: 'end',
                    action: onStartClick,
                },
                drag: {
                    target: 'end',
                    action: onStartClick,
                },
                cancel: StateMachine.parent,
            },
            end: {
                hover: onEndHover,
                click: {
                    // Ensure that a double event of drag before a single click does not trigger an immediate
                    // transition causing the start and end to be at the same point.
                    guard: () => hoverEventsSinceStart > 1,
                    target: 'height',
                    action: onEndClick,
                },
                drag: onEndHover,
                cancel: StateMachine.parent,
                onExit: () => {
                    hoverEventsSinceStart = 0;
                },
            },
            height: {
                hover: onHeightHover,
                click: {
                    target: StateMachine.parent,
                    action: onHeightClick,
                },
                cancel: StateMachine.parent,
            },
        });
    }
}
