import { _Scene } from 'ag-charts-community';

import type {
    AnnotationHandleProperties,
    AnnotationProperties,
    ChannelAnnotationStylesProperties,
} from '../annotationProperties';
import { AnnotationType, type Coords, type LineCoords } from '../annotationTypes';
import { Annotation } from './annotation';
import { DivariantHandle, UnivariantHandle } from './handle';
import { CollidableLine } from './shapes';

type ChannelHandle = 'topLeft' | 'topMiddle' | 'topRight' | 'bottomLeft' | 'bottomMiddle' | 'bottomRight';

function firstOf<T extends string>(prop: T, ...sources: Array<Partial<Record<T, any>> | undefined>) {
    for (const obj of sources) {
        if (obj?.[prop] !== undefined) return obj[prop];
    }
}

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

    public update(
        datum: AnnotationProperties,
        handleStyles: AnnotationHandleProperties,
        channelStyles: ChannelAnnotationStylesProperties,
        seriesRect: _Scene.BBox,
        top?: LineCoords,
        bottom?: LineCoords
    ) {
        const { locked, visible } = datum;

        this.locked = locked ?? false;
        this.seriesRect = seriesRect;

        if (top == null || bottom == null) {
            this.visible = false;
            return;
        } else {
            this.visible = visible ?? true;
        }

        this.updateLines(datum, channelStyles, top, bottom);
        this.updateHandles(datum, handleStyles, channelStyles, top, bottom);
        this.updateBackground(datum, channelStyles, top, bottom);
    }

    override toggleHandles(show: boolean | Partial<Record<ChannelHandle, boolean>>) {
        if (typeof show === 'boolean') {
            show = {
                topLeft: show,
                topMiddle: show,
                topRight: show,
                bottomLeft: show,
                bottomMiddle: show,
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
        datum: AnnotationProperties,
        target: Coords,
        invertPoint: (point: Coords) => Coords | undefined
    ) {
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

        const invertedMoves = moves.map((move) =>
            invertPoint({
                x: handles[move].handle.x + offset.x,
                y: handles[move].handle.y + offset.y,
            })
        );

        // Do not move any handles if some of them are trying to move to invalid points
        if (invertedMoves.some((invertedMove) => invertedMove === undefined)) {
            return;
        }

        for (const [index, invertedMove] of invertedMoves.entries()) {
            const datumPoint = this.getHandleDatumPoint(moves[index], datum);
            datumPoint.x = invertedMove!.x;
            datumPoint.y = invertedMove!.y;
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

    private updateLines(
        datum: AnnotationProperties,
        channelStyles: ChannelAnnotationStylesProperties,
        top: LineCoords,
        bottom: LineCoords
    ) {
        const { topLine, middleLine, bottomLine } = this;

        const lineStyles = {
            lineDash: datum.lineDash ?? channelStyles.lineDash,
            lineDashOffset: datum.lineDashOffset ?? channelStyles.lineDashOffset,
            stroke: datum.stroke ?? channelStyles.stroke,
            strokeWidth: datum.strokeWidth ?? channelStyles.strokeWidth,
            strokeOpacity: datum.strokeOpacity ?? channelStyles.strokeOpacity,
        };

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

        if (datum.type === AnnotationType.ParallelChannel) {
            middleLine.setProperties({
                x1: top.x1,
                y1: bottom.y1 + (top.y1 - bottom.y1) / 2,
                x2: top.x2,
                y2: bottom.y2 + (top.y2 - bottom.y2) / 2,
                stroke: firstOf('stroke', datum.middle, channelStyles.middle, datum, channelStyles),
                strokeWidth: firstOf('strokeWidth', datum.middle, channelStyles.middle, datum, channelStyles),
                strokeOpacity: firstOf('strokeOpacity', datum.middle, channelStyles.middle, datum, channelStyles),
                lineDash: firstOf('lineDash', datum.middle, channelStyles.middle, datum, channelStyles),
                lineDashOffset: firstOf('lineDashOffset', datum.middle, channelStyles.middle, datum, channelStyles),
            });
        } else {
            middleLine.visible = false;
        }
    }

    private updateHandles(
        datum: AnnotationProperties,
        handleStyles: AnnotationHandleProperties,
        channelStyles: ChannelAnnotationStylesProperties,
        top: LineCoords,
        bottom: LineCoords
    ) {
        const {
            handles: { topLeft, topMiddle, topRight, bottomLeft, bottomMiddle, bottomRight },
        } = this;
        const { handle } = datum;

        const mergedHandleStyles = {
            fill: firstOf('fill', handle, handleStyles),
            stroke: firstOf('stroke', handle, handleStyles, datum, channelStyles),
            strokeOpacity: firstOf('strokeOpacity', handle, handleStyles, datum, channelStyles),
        };

        topLeft.update({ ...mergedHandleStyles, x: top.x1, y: top.y1 });
        topRight.update({ ...mergedHandleStyles, x: top.x2, y: top.y2 });
        bottomLeft.update({ ...mergedHandleStyles, x: bottom.x1, y: bottom.y1 });
        bottomRight.update({ ...mergedHandleStyles, x: bottom.x2, y: bottom.y2 });
        topMiddle.update({
            ...mergedHandleStyles,
            x: top.x1 + (top.x2 - top.x1) / 2 - topMiddle.handle.width / 2,
            y: top.y1 + (top.y2 - top.y1) / 2 - topMiddle.handle.height / 2,
        });
        bottomMiddle.update({
            ...mergedHandleStyles,
            x: bottom.x1 + (bottom.x2 - bottom.x1) / 2 - bottomMiddle.handle.width / 2,
            y: bottom.y1 + (bottom.y2 - bottom.y1) / 2 - bottomMiddle.handle.height / 2,
        });
    }

    private updateBackground(
        datum: AnnotationProperties,
        channelStyles: ChannelAnnotationStylesProperties,
        top: LineCoords,
        bottom: LineCoords
    ) {
        const { background } = this;

        background.path.clear();
        background.path.moveTo(top.x1, top.y1);
        background.path.lineTo(top.x2, top.y2);
        background.path.lineTo(bottom.x2, bottom.y2);
        background.path.lineTo(bottom.x1, bottom.y1);
        background.path.closePath();
        background.checkPathDirty();
        background.setProperties({
            fill: firstOf('fill', datum.background, channelStyles.background),
            fillOpacity: firstOf('fillOpacity', datum.background, channelStyles.background),
        });
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
