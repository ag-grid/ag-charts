import { type Direction, _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { type CrossLineProperties, HorizontalLineProperties, VerticalLineProperties } from './crossLineProperties';
import type { CrossLineScene } from './crossLineScene';

export function isHorizontalAxis(region: any) {
    return region === 'horizontal-axes';
}

const { StateMachine } = _ModuleSupport;

interface CrossLineStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create' | 'node'> {
    create: (datum: CrossLineProperties) => void;
    node: () => CrossLineScene | undefined;
    showAnnotationOptions: () => void;
}

export class CrossLineStateMachine extends StateMachine<
    'start' | 'waiting-first-render',
    'click' | 'cancel' | 'render' | 'reset'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(direction: Direction, ctx: CrossLineStateMachineContext) {
        const onClick = ({ point }: { point: Point }) => {
            const isHorizontal = direction === 'horizontal';
            const datum = isHorizontal ? new HorizontalLineProperties() : new VerticalLineProperties();

            datum.set({ value: isHorizontal ? point.y : point.x });
            ctx.create(datum);
        };

        const actionFirstRender = () => {
            ctx.node()?.toggleActive(true);
            ctx.showAnnotationOptions();
            ctx.update();
        };

        super('start', {
            start: {
                click: {
                    target: 'waiting-first-render',
                    action: onClick,
                },
                reset: StateMachine.parent,
                cancel: StateMachine.parent,
            },
            'waiting-first-render': {
                render: {
                    target: StateMachine.parent,
                    action: actionFirstRender,
                },
            },
        });
    }
}
