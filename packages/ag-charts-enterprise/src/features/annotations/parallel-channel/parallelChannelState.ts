import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { StateClickEvent, StateHoverEvent } from '../annotationTypes';
import { ParallelChannelAnnotation } from './parallelChannelProperties';
import type { ParallelChannel } from './parallelChannelScene';

export class ParallelChannelStateMachine extends _ModuleSupport.StateMachine<
    'start' | 'end' | 'size',
    'click' | 'hover'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        createDatum: (datum: ParallelChannelAnnotation) => void,
        validateDatumPoint: (point: { x?: number | string | Date; y?: number | string | Date }) => boolean
    ) {
        const onStartClick = ({ point }: StateClickEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            const datum = new ParallelChannelAnnotation();
            datum.set({ start: point, end: point, size: 0 });
            createDatum(datum);
        };

        const onEndHover = ({ datum, node, point }: StateHoverEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            datum.set({ end: point, size: 0 });
            node.toggleHandles({
                topMiddle: false,
                topRight: false,
                bottomLeft: false,
                bottomMiddle: false,
                bottomRight: false,
            });
        };

        const onEndClick = ({ datum, node, point }: StateClickEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            datum?.set({ end: point });
            node?.toggleHandles({ topMiddle: false, bottomMiddle: false });
        };

        const onSizeHover = ({ datum, node, point }: StateHoverEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            if (datum.start.y == null || datum.end.y == null) return;

            const size = datum.end.y - point.y;
            const bottomStartY = datum.start.y - size;

            node.toggleHandles({ topMiddle: false, bottomMiddle: false });

            if (
                !validateDatumPoint({ x: datum.start.x, y: bottomStartY }) ||
                !validateDatumPoint({ x: datum.end.x, y: point.y })
            ) {
                return;
            }

            datum.set({ size });
        };

        const onSizeClick = ({ datum, node, point }: StateClickEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            if (!datum || !node || datum.start.y == null || datum.end.y == null) return;

            const size = datum.end.y - point.y;
            const bottomStartY = datum.start.y - size;

            node.toggleHandles(true);

            if (
                validateDatumPoint({ x: datum.start.x, y: bottomStartY }) &&
                validateDatumPoint({ x: datum.end.x, y: point.y })
            ) {
                datum.set({ size });
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
