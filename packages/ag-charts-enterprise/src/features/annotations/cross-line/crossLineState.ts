import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent } from '../annotationTypes';
import { CrossLineAnnotation } from './crossLineProperties';
import type { CrossLine } from './crossLineScene';

export function isHorizontalAxis(region: any) {
    return region === 'horizontal-axes';
}

export class CrossLineStateMachine extends _ModuleSupport.StateMachine<'start', 'click'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(appendDatum: (datum: CrossLineAnnotation) => void) {
        const onClick = ({ region, point }: StateClickEvent<CrossLineAnnotation, CrossLine>) => {
            const datum = new CrossLineAnnotation();
            const horizontalAxis = isHorizontalAxis(region);
            let direction = 'horizontal';
            if (horizontalAxis) {
                direction = 'vertical';
            }

            datum.set({ value: horizontalAxis ? point.x : point.y, direction });
            appendDatum(datum);
        };

        super('start', {
            start: {
                click: {
                    target: '__parent',
                    action: onClick,
                },
            },
        });
    }
}
