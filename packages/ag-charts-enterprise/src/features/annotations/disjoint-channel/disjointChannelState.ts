import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent, StateHoverEvent } from '../annotationTypes';
import { DisjointChannelAnnotation } from './disjointChannelProperties';
import type { DisjointChannel } from './disjointChannelScene';

export class DisjointChannelStateMachine extends _ModuleSupport.StateMachine<
    'start' | 'end' | 'size',
    'click' | 'hover'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        createDatum: (datum: DisjointChannelAnnotation) => void,
        validateDatumPoint: (point: { x?: number | string | Date; y?: number | string | Date }) => boolean
    ) {
        const onStartClick = ({ point }: StateClickEvent<DisjointChannelAnnotation, DisjointChannel>) => {
            const datum = new DisjointChannelAnnotation();
            datum.set({ start: point, end: point, startSize: 0, endSize: 0 });
            createDatum(datum);
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
            const bottomStartY = datum.start.y + startSize;

            node.toggleHandles({ bottomLeft: false });

            if (
                !validateDatumPoint({ x: datum.start.x, y: bottomStartY }) ||
                !validateDatumPoint({ x: datum.end.x, y: point.y })
            ) {
                return;
            }

            datum.set({ startSize, endSize });
        };

        const onSizeClick = ({ datum, node, point }: StateClickEvent<DisjointChannelAnnotation, DisjointChannel>) => {
            if (!datum || !node || datum.start.y == null || datum.end.y == null) return;

            const endSize = datum.end.y - point.y;
            const startSize = (datum.start.y - datum.end.y) * 2 + endSize;
            const bottomStartY = datum.start.y - endSize;

            node.toggleHandles(true);

            if (
                validateDatumPoint({ x: datum.start.x, y: bottomStartY }) &&
                validateDatumPoint({ x: datum.end.x, y: point.y })
            ) {
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
