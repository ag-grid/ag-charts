import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent, StateHoverEvent } from '../annotationTypes';
import { LineAnnotation } from './lineProperties';
import type { Line } from './lineScene';

export class LineStateMachine extends _ModuleSupport.StateMachine<'start' | 'end', 'click' | 'hover'> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(appendDatum: (datum: LineAnnotation) => void) {
        const onStartClick = ({ point }: StateClickEvent<LineAnnotation, Line>) => {
            const datum = new LineAnnotation();
            datum.set({ start: point, end: point });
            appendDatum(datum);
        };

        const onEndHover = ({ datum, node, point }: StateHoverEvent<LineAnnotation, Line>) => {
            datum?.set({ end: point });
            node?.toggleHandles({ end: false });
        };

        const onEndClick = ({ datum, node, point }: StateClickEvent<LineAnnotation, Line>) => {
            datum?.set({ end: point });
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
