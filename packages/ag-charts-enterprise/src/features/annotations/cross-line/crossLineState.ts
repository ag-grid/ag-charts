import { type Direction, _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent } from '../annotationTypes';
import { type CrossLineProperties, HorizontalLineProperties, VerticalLineProperties } from './crossLineProperties';
import type { CrossLineScene } from './crossLineScene';

export function isHorizontalAxis(region: any) {
    return region === 'horizontal-axes';
}

const { StateMachine } = _ModuleSupport;

export class CrossLineStateMachine extends StateMachine<'start', 'click' | 'cancel'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        direction: Direction,
        appendDatum: (datum: CrossLineProperties, direction?: any) => void,
        onExit: () => void
    ) {
        const onClick = ({ point }: StateClickEvent<CrossLineProperties, CrossLineScene>) => {
            const isHorizontal = direction === 'horizontal';
            const datum = isHorizontal ? new HorizontalLineProperties() : new VerticalLineProperties();

            datum.set({ value: isHorizontal ? point.y : point.x });
            appendDatum(datum);
        };

        super('start', {
            start: {
                click: {
                    target: StateMachine.parent,
                    action: onClick,
                },
                cancel: StateMachine.parent,
                onExit,
            },
        });
    }
}
