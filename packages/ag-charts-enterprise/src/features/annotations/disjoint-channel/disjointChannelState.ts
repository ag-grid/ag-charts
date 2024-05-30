import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point, StateClickEvent, StateHoverEvent } from '../annotationTypes';
import { DisjointChannelAnnotation } from './disjointChannelProperties';
import type { DisjointChannel } from './disjointChannelScene';

export class DisjointChannelStateMachine extends _ModuleSupport.StateMachine<
    'start' | 'end' | 'size',
    'click' | 'hover'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        appendDatum: (datum: DisjointChannelAnnotation) => void,
        validateDatumPoint: (point: Point) => boolean
    ) {
        const onStartClick = ({ point }: StateClickEvent<DisjointChannelAnnotation, DisjointChannel>) => {
            const datum = new DisjointChannelAnnotation();
            datum.set({ start: point, end: point, startSize: 0, endSize: 0 });
            appendDatum(datum);
        };

        const onEndHover = ({ datum, node, point }: StateHoverEvent<DisjointChannelAnnotation, DisjointChannel>) => {
            datum.set({ end: point });
            node.toggleHandles({ topRight: false, bottomLeft: false, bottomRight: false });
        };

        const onEndClick = ({ datum, point }: StateClickEvent<DisjointChannelAnnotation, DisjointChannel>) => {
            datum?.set({ end: point });
        };

        const onSizeHover = ({ datum, node, point }: StateHoverEvent<DisjointChannelAnnotation, DisjointChannel>) => {
            if (datum.start.y == null || datum.end.y == null) return;

            const endSize = datum.end.y - point.y;
            const startSize = (datum.start.y - datum.end.y) * 2 + endSize;

            const bottomStart = { x: datum.start.x, y: datum.start.y - startSize };
            const bottomEnd = { x: datum.end.x, y: point.y };

            node.toggleHandles({ bottomLeft: false });

            if (!validateDatumPoint(bottomStart) || !validateDatumPoint(bottomEnd)) {
                return;
            }

            datum.set({ startSize, endSize });
        };

        const onSizeClick = ({ datum, node, point }: StateClickEvent<DisjointChannelAnnotation, DisjointChannel>) => {
            if (!datum || !node || datum.start.y == null || datum.end.y == null) return;

            const endSize = datum.end.y - point.y;
            const startSize = (datum.start.y - datum.end.y) * 2 + endSize;

            const bottomStart = { x: datum.start.x, y: datum.start.y - endSize };
            const bottomEnd = { x: datum.end.x, y: point.y };

            node.toggleHandles(true);

            if (validateDatumPoint(bottomStart) && validateDatumPoint(bottomEnd)) {
                datum.set({ startSize, endSize });
            }
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
                    target: 'size',
                    action: onEndClick,
                },
            },
            size: {
                hover: onSizeHover,
                click: {
                    target: '__parent',
                    action: onSizeClick,
                },
            },
        });
    }
}
