import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent, StateDragEvent, StateHoverEvent } from '../annotationTypes';
import { LineProperties } from './lineProperties';
import type { LineScene } from './lineScene';

type Click = StateClickEvent<LineProperties, LineScene>;
type Hover = StateHoverEvent<LineProperties, LineScene>;
type Drag = StateDragEvent<LineProperties, LineScene>;

export class LineStateMachine extends _ModuleSupport.StateMachine<
    'start' | 'end',
    'click' | 'hover' | 'drag' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(appendDatum: (datum: LineProperties) => void) {
        const onStartClick = ({ point }: Click | Hover) => {
            const datum = new LineProperties();
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
