import { _Scene } from 'ag-charts-community';

import type { Coords, LineCoords } from '../annotationTypes';
import { Annotation } from '../scenes/annotation';
import { DivariantHandle, UnivariantHandle } from '../scenes/handle';
import { CollidableLine } from '../scenes/shapes';
import type { DisjointChannelAnnotation } from './disjointChannelProperties';

type ChannelHandle = keyof DisjointChannel['handles'];

export class DisjointChannel extends Annotation {
    static override is(value: unknown): value is DisjointChannel {
        return Annotation.isCheck(value, 'disjoint-channel');
    }

    type = 'disjoint-channel';

    override activeHandle?: ChannelHandle;

    private topLine = new CollidableLine();
    private bottomLine = new CollidableLine();
    private background = new _Scene.Path();

    private seriesRect?: _Scene.BBox;

    private handles = {
        topLeft: new DivariantHandle(),
        topRight: new DivariantHandle(),
        bottomLeft: new DivariantHandle(),
        bottomRight: new UnivariantHandle(),
    };

    constructor() {
        super();
        this.append([this.background, this.topLine, this.bottomLine, ...Object.values(this.handles)]);
    }

    public update(datum: DisjointChannelAnnotation, seriesRect: _Scene.BBox, top?: LineCoords, bottom?: LineCoords) {
        const { locked, visible } = datum;

        this.locked = locked ?? false;
        this.seriesRect = seriesRect;

        if (top == null || bottom == null) {
            this.visible = false;
            return;
        } else {
            this.visible = visible ?? true;
        }

        this.updateLines(datum, top, bottom);
        this.updateHandles(datum, top, bottom);
        this.updateBackground(datum, top, bottom);
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
        invertPoint: (point: Coords) => Coords | undefined
    ) {
        const { activeHandle, handles } = this;
        if (activeHandle == null) return;

        const { offset } = handles[activeHandle].drag(target);
        handles[activeHandle].toggleDragging(true);

        if (activeHandle === 'topLeft' || activeHandle === 'bottomLeft') {
            const direction = activeHandle === 'topLeft' ? 1 : -1;
            const start = invertPoint({
                x: handles.topLeft.handle.x + offset.x,
                y: handles.topLeft.handle.y + offset.y * direction,
            });

            if (!start || datum.start.y == null) return;

            const startSize = datum.startSize + (start.y - datum.start.y) * 2;

            datum.start.x = start.x;
            datum.start.y = start.y;
            datum.startSize = startSize;
        } else if (activeHandle === 'topRight') {
            const end = invertPoint({
                x: handles.topRight.handle.x + offset.x,
                y: handles.topRight.handle.y + offset.y,
            });

            if (!end || datum.end.y == null) return;

            const endSize = datum.endSize + (end.y - datum.end.y) * 2;

            datum.end.x = end.x;
            datum.end.y = end.y;
            datum.endSize = endSize;
        } else if (activeHandle === 'bottomRight') {
            const bottomEnd = invertPoint({
                x: handles.bottomRight.handle.x + offset.x,
                y: handles.bottomRight.handle.y + offset.y,
            });

            if (!bottomEnd || datum.start.y == null || datum.end.y == null) return;

            const endSize = datum.end.y - bottomEnd.y;
            const startSize = datum.startSize - (datum.endSize - endSize);

            datum.startSize = startSize;
            datum.endSize = endSize;
        }
    }

    override stopDragging() {
        const { activeHandle, handles } = this;
        if (activeHandle == null) return;

        handles[activeHandle].toggleDragging(false);
    }

    override getCursor() {
        if (this.activeHandle == null) return 'pointer';
        return this.handles[this.activeHandle].getCursor();
    }

    override containsPoint(x: number, y: number) {
        const { handles, seriesRect, topLine, bottomLine } = this;

        this.activeHandle = undefined;

        for (const [handle, child] of Object.entries(handles)) {
            if (child.containsPoint(x, y)) {
                this.activeHandle = handle as ChannelHandle;
                return true;
            }
        }

        x -= seriesRect?.x ?? 0;
        y -= seriesRect?.y ?? 0;

        return topLine.containsPoint(x, y) || bottomLine.containsPoint(x, y);
    }

    private updateLines(datum: DisjointChannelAnnotation, top: LineCoords, bottom: LineCoords) {
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

    private updateHandles(datum: DisjointChannelAnnotation, top: LineCoords, bottom: LineCoords) {
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

    private updateBackground(datum: DisjointChannelAnnotation, top: LineCoords, bottom: LineCoords) {
        const { background } = this;

        background.path.clear();
        background.path.moveTo(top.x1, top.y1);
        background.path.lineTo(top.x2, top.y2);
        background.path.lineTo(bottom.x2, bottom.y2);
        background.path.lineTo(bottom.x1, bottom.y1);
        background.path.closePath();
        background.checkPathDirty();
        background.setProperties({
            fill: datum.background.fill,
            fillOpacity: datum.background.fillOpacity,
        });
    }
}
