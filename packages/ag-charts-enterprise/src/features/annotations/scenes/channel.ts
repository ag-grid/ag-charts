import { _Scene } from 'ag-charts-community';

import type { AnnotationProperties } from '../annotationProperties';
import type { Coords, LineCoords } from '../annotationTypes';
import { Annotation } from './annotation';
import { DivariantHandle, UnivariantHandle } from './handle';
import { CollidableLine } from './shapes';

type ChannelHandle = 'topLeft' | 'topMiddle' | 'topRight' | 'bottomLeft' | 'bottomMiddle' | 'bottomRight';

export class Channel extends Annotation {
    type = 'channel';

    override activeHandle?: ChannelHandle;

    private topLine = new CollidableLine();
    private middleLine = new _Scene.Line();
    private bottomLine = new CollidableLine();
    private background = new _Scene.Path();

    private seriesRect?: _Scene.BBox;

    private handles = {
        topLeft: new DivariantHandle(),
        topMiddle: new UnivariantHandle(),
        topRight: new DivariantHandle(),
        bottomLeft: new DivariantHandle(),
        bottomMiddle: new UnivariantHandle(),
        bottomRight: new DivariantHandle(),
    };

    constructor() {
        super();
        this.append([this.background, this.topLine, this.middleLine, this.bottomLine, ...Object.values(this.handles)]);
    }

    public update(datum: AnnotationProperties, seriesRect: _Scene.BBox, top?: LineCoords, bottom?: LineCoords) {
        this.seriesRect = seriesRect;

        if (top == null || bottom == null) {
            this.visible = false;
            return;
        } else {
            this.visible = true;
        }

        this.updateLines(datum, top, bottom);
        this.updateHandles(datum, top, bottom);
        this.updateBackground(datum, top, bottom);
    }

    override toggleHandles(show: boolean) {
        for (const [handle, node] of Object.entries(this.handles)) {
            node.visible = show;
            node.toggleHovered(this.activeHandle === handle);
        }
    }

    override toggleActive(active: boolean) {
        this.toggleHandles(active);
        for (const node of Object.values(this.handles)) {
            node.toggleActive(active);
        }
    }

    override dragHandle(datum: AnnotationProperties, target: Coords, invertPoint: (point: Coords) => Coords) {
        const { activeHandle, handles } = this;
        if (activeHandle == null) return;

        const { offset } = handles[activeHandle].drag(target);
        handles[activeHandle].toggleDragging(true);

        let moves: Array<ChannelHandle> = [];

        switch (activeHandle) {
            case 'topLeft':
            case 'bottomLeft':
                moves = ['topLeft', 'bottomLeft'];
                break;
            case 'topMiddle':
                moves = ['topLeft', 'topRight'];
                offset.y -= 6;
                break;
            case 'topRight':
            case 'bottomRight':
                moves = ['topRight', 'bottomRight'];
                break;
            case 'bottomMiddle':
                moves = ['bottomLeft', 'bottomRight'];
                offset.y -= 6;
                break;
        }

        for (const move of moves) {
            const invertedMove = invertPoint({
                x: handles[move].handle.x + offset.x,
                y: handles[move].handle.y + offset.y,
            });
            const datumPoint = this.getHandleDatumPoint(move, datum);
            datumPoint.x = invertedMove.x;
            datumPoint.y = invertedMove.y;
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

    private updateLines(datum: AnnotationProperties, top: LineCoords, bottom: LineCoords) {
        const { topLine, middleLine, bottomLine } = this;
        const { stroke, strokeWidth, strokeOpacity } = datum;

        topLine.setProperties({
            x1: top.x1,
            y1: top.y1,
            x2: top.x2,
            y2: top.y2,
            stroke,
            strokeWidth,
            strokeOpacity,
        });
        bottomLine.setProperties({
            x1: bottom.x1,
            y1: bottom.y1,
            x2: bottom.x2,
            y2: bottom.y2,
            stroke,
            strokeWidth,
            strokeOpacity,
        });
        topLine.updateCollisionBBox();
        bottomLine.updateCollisionBBox();

        if (datum.type === 'parallel-channel') {
            middleLine.setProperties({
                x1: top.x1,
                y1: bottom.y1 + (top.y1 - bottom.y1) / 2,
                x2: top.x2,
                y2: bottom.y2 + (top.y2 - bottom.y2) / 2,
                stroke: datum.middle.stroke,
                strokeWidth: datum.middle.strokeWidth,
                strokeOpacity: datum.middle.strokeOpacity,
                lineDash: datum.middle.lineDash,
            });
        } else {
            middleLine.visible = false;
        }
    }

    private updateHandles(datum: AnnotationProperties, top: LineCoords, bottom: LineCoords) {
        const {
            handles: { topLeft, topMiddle, topRight, bottomLeft, bottomMiddle, bottomRight },
        } = this;
        const { stroke, strokeOpacity } = datum;

        const handleStyles = {
            ...datum.handle.toJson(),
            stroke,
            strokeOpacity,
        };

        topLeft.update({ ...handleStyles, x: top.x1, y: top.y1 });
        topRight.update({ ...handleStyles, x: top.x2, y: top.y2 });
        bottomLeft.update({ ...handleStyles, x: bottom.x1, y: bottom.y1 });
        bottomRight.update({ ...handleStyles, x: bottom.x2, y: bottom.y2 });
        topMiddle.update({
            ...handleStyles,
            x: top.x1 + (top.x2 - top.x1) / 2 - topMiddle.handle.width / 2,
            y: top.y1 + (top.y2 - top.y1) / 2 - topMiddle.handle.height / 2,
        });
        bottomMiddle.update({
            ...handleStyles,
            x: bottom.x1 + (bottom.x2 - bottom.x1) / 2 - bottomMiddle.handle.width / 2,
            y: bottom.y1 + (bottom.y2 - bottom.y1) / 2 - bottomMiddle.handle.height / 2,
        });
    }

    private updateBackground(datum: AnnotationProperties, top: LineCoords, bottom: LineCoords) {
        const { background } = this;
        const {
            background: { fill, fillOpacity },
        } = datum;

        background.path.clear();
        background.path.moveTo(top.x1, top.y1);
        background.path.lineTo(top.x2, top.y2);
        background.path.lineTo(bottom.x2, bottom.y2);
        background.path.lineTo(bottom.x1, bottom.y1);
        background.path.closePath();
        background.checkPathDirty();
        background.setProperties({ fill, fillOpacity });
    }

    private getHandleDatumPoint(
        handle: Omit<ChannelHandle, 'topMiddle' | 'bottomMiddle'>,
        datum: AnnotationProperties
    ) {
        switch (handle) {
            case 'topLeft':
                return datum.top.start;
            case 'topRight':
                return datum.top.end;
            case 'bottomLeft':
                return datum.bottom.start;
            case 'bottomRight':
            default:
                return datum.bottom.end;
        }
    }
}
