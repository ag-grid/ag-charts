import { _Util } from 'ag-charts-community';

import type { AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { convertPoint, invertCoords } from '../annotationUtils';
import { Annotation } from '../scenes/annotation';
import { ChannelScene } from '../scenes/channelScene';
import { DivariantHandle, UnivariantHandle } from '../scenes/handle';
import type { DisjointChannelAnnotation } from './disjointChannelProperties';

const { Vec2 } = _Util;

type ChannelHandle = keyof DisjointChannel['handles'];

export class DisjointChannel extends ChannelScene<DisjointChannelAnnotation> {
    static override is(value: unknown): value is DisjointChannel {
        return Annotation.isCheck(value, 'disjoint-channel');
    }

    type = 'disjoint-channel';

    override activeHandle?: ChannelHandle;

    override handles = {
        topLeft: new DivariantHandle(),
        topRight: new DivariantHandle(),
        bottomLeft: new DivariantHandle(),
        bottomRight: new UnivariantHandle(),
    };

    constructor() {
        super();
        this.append([this.background, this.topLine, this.bottomLine, ...Object.values(this.handles)]);
    }

    override toggleHandles(show: boolean | Partial<Record<ChannelHandle, boolean>>) {
        if (typeof show === 'boolean') {
            show = {
                topLeft: show,
                topRight: show,
                bottomLeft: show,
                bottomRight: show,
            };
        }

        for (const [handle, node] of Object.entries(this.handles)) {
            node.visible = show[handle as ChannelHandle] ?? true;
            node.toggleHovered(this.activeHandle === handle);
        }
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        for (const node of Object.values(this.handles)) {
            node.toggleActive(active);
        }
    }

    override dragHandle(
        datum: DisjointChannelAnnotation,
        target: Coords,
        context: AnnotationContext,
        onInvalid: () => void
    ) {
        const { activeHandle, handles } = this;
        if (activeHandle == null) return;

        const { offset } = handles[activeHandle].drag(target);
        handles[activeHandle].toggleDragging(true);

        const invert = (coords: Coords) => invertCoords(coords, context);
        const prev = datum.toJson();

        switch (activeHandle) {
            case 'topLeft':
            case 'bottomLeft': {
                const direction = activeHandle === 'topLeft' ? 1 : -1;
                const start = invert({
                    x: handles.topLeft.handle.x + offset.x,
                    y: handles.topLeft.handle.y + offset.y * direction,
                });
                const bottomStart = invert({
                    x: handles.bottomLeft.handle.x + offset.x,
                    y: handles.bottomLeft.handle.y + offset.y * -direction,
                });

                if (!start || !bottomStart || datum.start.y == null) return;

                const startHeight = datum.startHeight + (start.y - datum.start.y) * 2;

                datum.start.x = start.x;
                datum.start.y = start.y;
                datum.startHeight = startHeight;

                break;
            }

            case 'topRight': {
                const end = invert({
                    x: handles.topRight.handle.x + offset.x,
                    y: handles.topRight.handle.y + offset.y,
                });

                if (!end || datum.end.y == null) return;

                const endHeight = datum.endHeight + (end.y - datum.end.y) * 2;

                datum.end.x = end.x;
                datum.end.y = end.y;
                datum.endHeight = endHeight;

                break;
            }

            case 'bottomRight': {
                const bottomStart = invert({
                    x: handles.bottomLeft.handle.x + offset.x,
                    y: handles.bottomLeft.handle.y + offset.y,
                });
                const bottomEnd = invert({
                    x: handles.bottomRight.handle.x + offset.x,
                    y: handles.bottomRight.handle.y + offset.y,
                });

                if (!bottomStart || !bottomEnd || datum.start.y == null || datum.end.y == null) return;

                const endHeight = datum.end.y - bottomEnd.y;
                const startHeight = datum.startHeight - (datum.endHeight - endHeight);

                datum.startHeight = startHeight;
                datum.endHeight = endHeight;
            }
        }

        if (!datum.isValidWithContext(context)) {
            datum.set(prev);
            onInvalid();
        }
    }

    protected override getOtherCoords(
        datum: DisjointChannelAnnotation,
        topLeft: Coords,
        topRight: Coords,
        context: AnnotationContext
    ): Coords[] {
        const { dragState } = this;

        if (!dragState) return [];

        const startHeight = convertPoint(datum.bottom.start, context).y - convertPoint(datum.start, context).y;
        const endHeight = convertPoint(datum.bottom.end, context).y - convertPoint(datum.end, context).y;

        const bottomLeft = Vec2.add(topLeft, Vec2.from(0, startHeight));
        const bottomRight = Vec2.add(topRight, Vec2.from(0, endHeight));

        return [bottomLeft, bottomRight];
    }

    override updateLines(datum: DisjointChannelAnnotation, top: LineCoords, bottom: LineCoords) {
        const { topLine, bottomLine } = this;
        const { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = datum;

        const lineStyles = { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth };

        topLine.setProperties({
            x1: top.x1,
            y1: top.y1,
            x2: top.x2,
            y2: top.y2,
            ...lineStyles,
        });
        bottomLine.setProperties({
            x1: bottom.x1,
            y1: bottom.y1,
            x2: bottom.x2,
            y2: bottom.y2,
            ...lineStyles,
        });
        topLine.updateCollisionBBox();
        bottomLine.updateCollisionBBox();
    }

    override updateHandles(datum: DisjointChannelAnnotation, top: LineCoords, bottom: LineCoords) {
        const {
            handles: { topLeft, topRight, bottomLeft, bottomRight },
        } = this;

        const handleStyles = {
            fill: datum.handle.fill,
            stroke: datum.handle.stroke ?? datum.stroke,
            strokeOpacity: datum.handle.strokeOpacity ?? datum.strokeOpacity,
        };

        topLeft.update({ ...handleStyles, x: top.x1, y: top.y1 });
        topRight.update({ ...handleStyles, x: top.x2, y: top.y2 });
        bottomLeft.update({ ...handleStyles, x: bottom.x1, y: bottom.y1 });
        bottomRight.update({
            ...handleStyles,
            x: bottom.x2 - bottomRight.handle.width / 2,
            y: bottom.y2 - bottomRight.handle.height / 2,
        });
    }
}
