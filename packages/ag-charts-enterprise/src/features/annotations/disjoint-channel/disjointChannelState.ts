import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point, StateClickEvent, StateDragEvent, StateHoverEvent } from '../annotationTypes';
import { DisjointChannelProperties } from './disjointChannelProperties';
import type { DisjointChannelScene } from './disjointChannelScene';

type Click = StateClickEvent<DisjointChannelProperties, DisjointChannelScene>;
type Drag = StateDragEvent<DisjointChannelProperties, DisjointChannelScene>;
type Hover = StateHoverEvent<DisjointChannelProperties, DisjointChannelScene>;

export class DisjointChannelStateMachine extends _ModuleSupport.StateMachine<
    'start' | 'end' | 'height',
    'click' | 'hover' | 'drag' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        appendDatum: (datum: DisjointChannelProperties) => void,
        validateDatumPoint: (point: Point) => boolean
    ) {
        const onStartClick = ({ point }: Click | Drag) => {
            const datum = new DisjointChannelProperties();
            datum.set({ start: point, end: point, startHeight: 0, endHeight: 0 });
            appendDatum(datum);
        };

        const onEndHover = ({ datum, node, point }: Hover | Drag) => {
            datum?.set({ end: point });
            node?.toggleHandles({ topRight: false, bottomLeft: false, bottomRight: false });
        };

        const onEndClick = ({ datum, point }: Click) => {
            datum?.set({ end: point });
        };

        const onHeightHover = ({ datum, node, point }: Hover) => {
            if (datum.start.y == null || datum.end.y == null) return;

            const endHeight = datum.end.y - point.y;
            const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;

            const bottomStart = { x: datum.start.x, y: datum.start.y - startHeight };
            const bottomEnd = { x: datum.end.x, y: point.y };

            node.toggleHandles({ bottomLeft: false });

            if (!validateDatumPoint(bottomStart) || !validateDatumPoint(bottomEnd)) {
                return;
            }

            datum.set({ startHeight, endHeight });
        };

        const onHeightClick = ({ datum, node, point }: Click) => {
            if (!datum || !node || datum.start.y == null || datum.end.y == null) return;

            const endHeight = datum.end.y - point.y;
            const startHeight = (datum.start.y - datum.end.y) * 2 + endHeight;

            const bottomStart = { x: datum.start.x, y: datum.start.y - endHeight };
            const bottomEnd = { x: datum.end.x, y: point.y };

            node.toggleHandles(true);

            if (validateDatumPoint(bottomStart) && validateDatumPoint(bottomEnd)) {
                datum.set({ startHeight, endHeight });
            }
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
                    target: 'height',
                    action: onEndClick,
                },
                drag: onEndHover,
                cancel: '__parent',
            },
            height: {
                hover: onHeightHover,
                click: {
                    target: '__parent',
                    action: onHeightClick,
                },
                cancel: '__parent',
            },
        });
    }
}
