import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent, StateDragEvent, StateHoverEvent } from '../annotationTypes';
import { LineAnnotation } from './lineProperties';
import type { Line } from './lineScene';

type Click = StateClickEvent<LineAnnotation, Line>;
type Hover = StateHoverEvent<LineAnnotation, Line>;
type Drag = StateDragEvent<LineAnnotation, Line>;

export class LineStateMachine extends _ModuleSupport.StateMachine<
    'start' | 'end',
    'click' | 'hover' | 'drag' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(appendDatum: (datum: LineAnnotation) => void) {
        const onStartClick = ({ point }: Click | Hover) => {
            const datum = new LineAnnotation();
            datum.set({ start: point, end: point });
            appendDatum(datum);
        };

        const onEndHover = ({ datum, node, point }: Hover | Drag) => {
            datum?.set({ end: point });
            node?.toggleHandles({ end: false });
        };

        const onEndClick = ({ datum, node, point }: Click) => {
            datum?.set({ end: point });
            node?.toggleHandles(true);
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
                cancel: '__parent',
            },
            end: {
                hover: onEndHover,
                click: {
                    target: '__parent',
                    action: onEndClick,
                },
                drag: onEndHover,
                cancel: '__parent',
            },
        });
    }
}
