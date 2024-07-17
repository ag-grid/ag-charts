import { type Direction, _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point } from '../annotationTypes';
import type { AnnotationsStateMachineContext } from '../annotationsSuperTypes';
import { type CrossLineProperties, HorizontalLineProperties, VerticalLineProperties } from './crossLineProperties';

export function isHorizontalAxis(region: any) {
    return region === 'horizontal-axes';
}

const { StateMachine } = _ModuleSupport;

interface CrossLineStateMachineContext extends Omit<AnnotationsStateMachineContext, 'create'> {
    create: (datum: CrossLineProperties) => void;
}

export class CrossLineStateMachine extends StateMachine<'start', 'click' | 'cancel'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(direction: Direction, ctx: CrossLineStateMachineContext) {
        const onClick = ({ point }: { point: Point }) => {
            const isHorizontal = direction === 'horizontal';
            const datum = isHorizontal ? new HorizontalLineProperties() : new VerticalLineProperties();

            datum.set({ value: isHorizontal ? point.y : point.x });
            ctx.create(datum);
        };

        super('start', {
            start: {
                click: {
                    target: StateMachine.parent,
                    action: onClick,
                },
                cancel: StateMachine.parent,
            },
        });
    }
}
