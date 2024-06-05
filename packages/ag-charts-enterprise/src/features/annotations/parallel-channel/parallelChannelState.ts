import { _ModuleSupport, _Util } from 'ag-charts-community';

import type { Point, StateClickEvent, StateHoverEvent } from '../annotationTypes';
import { ParallelChannelAnnotation } from './parallelChannelProperties';
import type { ParallelChannel } from './parallelChannelScene';

export class ParallelChannelStateMachine extends _ModuleSupport.StateMachine<
    'start' | 'end' | 'height',
    'click' | 'hover' | 'cancel'
> {
    override debug = _Util.Debug.create(true, 'annotations');

    constructor(
        appendDatum: (datum: ParallelChannelAnnotation) => void,
        validateDatumPoint: (point: Point) => boolean
    ) {
        const onStartClick = ({ point }: StateClickEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            const datum = new ParallelChannelAnnotation();
            datum.set({ start: point, end: point, height: 0 });
            appendDatum(datum);
        };

        const onEndHover = ({ datum, node, point }: StateHoverEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            datum.set({ end: point, height: 0 });
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

        const onHeightHover = ({ datum, node, point }: StateHoverEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            if (datum.start.y == null || datum.end.y == null) return;

            const height = datum.end.y - point.y;
            const bottomStartY = datum.start.y - height;

            node.toggleHandles({ topMiddle: false, bottomMiddle: false });

            if (
                !validateDatumPoint({ x: datum.start.x, y: bottomStartY }) ||
                !validateDatumPoint({ x: datum.end.x, y: point.y })
            ) {
                return;
            }

            datum.set({ height });
        };

        const onHeightClick = ({ datum, node, point }: StateClickEvent<ParallelChannelAnnotation, ParallelChannel>) => {
            if (!datum || !node || datum.start.y == null || datum.end.y == null) return;

            const height = datum.end.y - point.y;
            const bottomStartY = datum.start.y - height;

            node.toggleHandles(true);

            if (
                validateDatumPoint({ x: datum.start.x, y: bottomStartY }) &&
                validateDatumPoint({ x: datum.end.x, y: point.y })
            ) {
                datum.set({ height });
            }
        };

        super('start', {
            start: {
                click: {
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
