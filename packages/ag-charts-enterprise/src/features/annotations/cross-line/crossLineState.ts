import { type Direction, _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent } from '../annotationTypes';
import { type CrossLineAnnotation, HorizontalLineAnnotation, VerticalLineAnnotation } from './crossLineProperties';
import type { CrossLine } from './crossLineScene';

export function isHorizontalAxis(region: any) {
    return region === 'horizontal-axes';
}

export class CrossLineStateMachine extends _ModuleSupport.StateMachine<'start', 'click' | 'cancel'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        direction: Direction,
        appendDatum: (datum: CrossLineAnnotation, direction?: any) => void,
        onExit: () => void
    ) {
        const onClick = ({ point }: StateClickEvent<CrossLineAnnotation, CrossLine>) => {
            const isHorizontal = direction === 'horizontal';
            const datum = isHorizontal ? new HorizontalLineAnnotation() : new VerticalLineAnnotation();

            datum.set({ value: isHorizontal ? point.y : point.x });
            appendDatum(datum);
        };

        super('start', {
            start: {
                click: {
                    target: '__parent',
                    action: onClick,
                },
                cancel: '__parent',
                onExit,
            },
        });
    }
}
