import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent } from '../annotationTypes';
import { type CrossLineAnnotation, HorizontalLineAnnotation, VerticalLineAnnotation } from './crossLineProperties';
import type { CrossLine } from './crossLineScene';

export function isHorizontalAxis(region: any) {
    return region === 'horizontal-axes';
}

export class CrossLineStateMachine extends _ModuleSupport.StateMachine<'start', 'click' | 'cancel'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(appendDatum: (datum: CrossLineAnnotation) => void) {
        const onClick = ({ region, point }: StateClickEvent<CrossLineAnnotation, CrossLine>) => {
            const horizontalAxis = isHorizontalAxis(region);
            const datum = horizontalAxis ? new VerticalLineAnnotation() : new HorizontalLineAnnotation();

            datum.set({ value: horizontalAxis ? point.x : point.y });
            appendDatum(datum);
        };

        super('start', {
            start: {
                click: {
                    target: '__parent',
                    action: onClick,
                },
                cancel: '__parent',
            },
        });
    }
}
