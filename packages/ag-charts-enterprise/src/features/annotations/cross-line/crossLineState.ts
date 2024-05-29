import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent, StateHoverEvent } from '../annotationTypes';
import { CrossLineAnnotation } from './crossLineProperties';
import type { CrossLine } from './crossLineScene';

export function isHorizontalAxis(region: any) {
    return region === 'horizontal-axes';
}

export class CrossLineStateMachine extends _ModuleSupport.StateMachine<'start' | 'end', 'click' | 'hover'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(appendDatum: (datum: CrossLineAnnotation) => void) {
        const onStartClick = ({ region, point }: StateClickEvent<CrossLineAnnotation, CrossLine>) => {
            const datum = new CrossLineAnnotation();
            const horizontalAxis = isHorizontalAxis(region);
            let direction = 'horizontal';
            if (horizontalAxis) {
                direction = 'vertical';
            }

            datum.set({ value: horizontalAxis ? point.x : point.y, direction });
            appendDatum(datum);
        };

        const onEndHover = ({ datum, node, point, region }: StateHoverEvent<CrossLineAnnotation, CrossLine>) => {
            const horizontalAxis = isHorizontalAxis(region);
            datum?.set({ value: horizontalAxis ? point.x : point.y });
            node?.toggleHandles(false);
        };

        const onEndClick = ({ datum, node, point, region }: StateClickEvent<CrossLineAnnotation, CrossLine>) => {
            const horizontalAxis = isHorizontalAxis(region);
            datum?.set({ value: horizontalAxis ? point.x : point.y });
            node?.toggleHandles(true);
        };

        super('start', {
            start: {
                click: {
                    target: 'end',
                    action: onStartClick,
                },
            },
            end: {
                hover: onEndHover,
                click: {
                    target: '__parent',
                    action: onEndClick,
                },
            },
        });
    }
}
